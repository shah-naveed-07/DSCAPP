import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  X,
  Trash2,
  Bot,
  User,
  AlertCircle,
  CheckCircle2,
  StopCircle,
  Terminal,
  Loader2,
  Radio,
} from 'lucide-react';
import { ScreenDestination, UserSession, UserOrder } from '../types';
import {
  ChatMessage,
  queryAssistant,
  LiveDataContext,
} from '../services/aiAssistantService';
import {
  startVoiceListening,
  stopVoiceListening,
  speakText,
  stopSpeaking,
  stopAllSpeech,
  isVoiceOutputEnabled,
  setVoiceOutputEnabled,
  AssistantVoiceState,
} from '../services/speechService';
import {
  WakeWordState,
  WakeWordEvent,
  extractWakeWordAndCommand,
} from '../services/wakeWordService';
import { MJWakeStatusIndicator } from './MJWakeStatusIndicator';
import { getScreenSemantic } from '../services/screenRegistry';
import { validateActionPermission, ACTION_DEFINITIONS } from '../services/actionRegistry';
import { fetchUserOrder, getAppConfig } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: ScreenDestination;
  session: UserSession | null;
  onNavigate: (screen: ScreenDestination) => void;
  onBack?: () => void;
  onActionExecute?: (
    actionCode: string,
    payload?: unknown
  ) => Promise<{ success: boolean; message?: string }> | void;
  wakeWordEnabled?: boolean;
  wakeWordState?: WakeWordState;
  onToggleWakeWord?: () => void;
  pendingWakeEvent?: WakeWordEvent | null;
  onClearPendingWakeEvent?: () => void;
}

export const AIAssistantSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  currentScreen,
  session,
  onNavigate,
  onBack,
  onActionExecute,
  wakeWordEnabled = false,
  wakeWordState = 'disabled',
  onToggleWakeWord,
  pendingWakeEvent,
  onClearPendingWakeEvent,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hi, I'm MJ. How can I help?\n\nYou can talk to me in English or natural Hinglish. For example:\n• \"Mera dashboard kholo\"\n• \"Mera plan kab expire hoga?\"\n• \"Downloads open karo\"\n• \"Ye page kya hai?\"",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [voiceState, setVoiceState] = useState<AssistantVoiceState>('idle');
  const [voiceOutput, setVoiceOutput] = useState<boolean>(isVoiceOutputEnabled());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cachedOrder, setCachedOrder] = useState<UserOrder | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  const [pendingConfirmation, setPendingConfirmation] = useState<{
    actionCode: string;
    prompt: string;
    payload?: Record<string, unknown>;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  // Pre-load user order if session exists for real live context
  useEffect(() => {
    if (session && session.token) {
      fetchUserOrder(session.token).then((res) => {
        if (res.data) setCachedOrder(res.data);
      });
    } else {
      setCachedOrder(null);
    }
  }, [session]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, voiceState, isExecutingAction]);

  // Stop both STT and TTS when closed
  useEffect(() => {
    if (!isOpen) {
      stopAllSpeech();
      setVoiceState('idle');
    }
  }, [isOpen]);

  const handleToggleVoiceOutput = () => {
    const next = !voiceOutput;
    setVoiceOutput(next);
    setVoiceOutputEnabled(next);
    if (!next) {
      stopSpeaking();
      if (voiceState === 'speaking') setVoiceState('idle');
    }
  };

  // Handle external wake-word trigger ("Hey MJ" / "MJ")
  useEffect(() => {
    if (isOpen && pendingWakeEvent) {
      const { command } = pendingWakeEvent;
      if (onClearPendingWakeEvent) {
        onClearPendingWakeEvent();
      }

      if (command && command.trim()) {
        // User spoke the command directly with the wake phrase
        handleSendQuery(command.trim());
      } else {
        // User just said "Hey MJ" or "MJ" - start active voice listening for command
        setTimeout(() => {
          handleMicClick();
        }, 80);
      }
    }
  }, [isOpen, pendingWakeEvent]);

  const handleMicClick = () => {
    // Stop any active speech synthesis immediately (user interruption)
    stopSpeaking();

    if (voiceState === 'listening') {
      stopVoiceListening();
      setVoiceState('idle');
      return;
    }

    setErrorMessage(null);

    const stop = startVoiceListening(
      (transcript, isFinal) => {
        // Normalize and strip wake phrase if user said "Hey MJ" while speaking
        const detection = extractWakeWordAndCommand(transcript);
        const actualQuery = detection.detected && detection.command ? detection.command : transcript;

        setInputText(actualQuery);
        if (isFinal && actualQuery.trim()) {
          handleSendQuery(actualQuery.trim());
          stopVoiceListening();
        }
      },
      (state) => setVoiceState(state),
      (err) => setErrorMessage(err)
    );

    stopListeningRef.current = stop;
  };

  const addAssistantMessage = (
    text: string,
    intent?: string | null,
    actionCode?: string | null,
    requiresConf?: boolean,
    actionPayload?: Record<string, unknown>
  ) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'assistant',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      intent,
      actionCode,
      requiresConfirmation: requiresConf,
      actionPayload,
    };

    setMessages((prev) => [...prev, newMsg]);

    // Speak aloud if enabled
    if (voiceOutput) {
      setVoiceState('speaking');
      speakText(
        text,
        () => setVoiceState('speaking'),
        () => setVoiceState('idle')
      );
    }
  };

  const executeAction = async (actionCode: string, payload?: Record<string, unknown>) => {
    const validation = validateActionPermission(actionCode, session);

    if (!validation.allowed) {
      const reason = validation.reasonHinglish || validation.reason || 'Action not permitted.';
      addAssistantMessage(reason);
      return;
    }

    const actionDef = validation.actionDef;

    // Handle back navigation
    if (actionCode === 'NAVIGATE_BACK') {
      if (onBack) {
        onBack();
      } else {
        onNavigate('home');
      }
      return;
    }

    // Handle screen destinations
    if (actionDef?.targetScreen) {
      onNavigate(actionDef.targetScreen);
      return;
    }

    // Handle action execution via callback with result awareness
    if (onActionExecute) {
      setIsExecutingAction(true);
      try {
        const result = await onActionExecute(actionCode, payload);
        setIsExecutingAction(false);
        if (result && typeof result === 'object' && result.success === false) {
          addAssistantMessage(`Action complete nahi ho saka: ${result.message || 'Error occurred.'}`);
        }
      } catch (err) {
        setIsExecutingAction(false);
        addAssistantMessage(`Action execution failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = (queryText || inputText).trim();
    if (!textToSend) return;

    // Stop listening if active
    stopVoiceListening();

    // Add user message to UI
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setVoiceState('processing');
    setErrorMessage(null);

    const liveContext: LiveDataContext = {
      userOrder: cachedOrder,
      systemConfig: getAppConfig(),
      activeScreen: currentScreen,
    };

    // Query MJ Assistant engine
    const response = await queryAssistant(textToSend, currentScreen, session, messages, liveContext);

    setVoiceState('idle');

    // Handle Follow-up Affirmation (e.g. user said "haan", "yes", "kar do")
    if (response.intent === 'CONFIRM_PROCEED' && pendingConfirmation) {
      const actionToRun = pendingConfirmation.actionCode;
      const payloadToRun = pendingConfirmation.payload;
      setPendingConfirmation(null);

      // Mark confirmation handled
      setMessages((prev) =>
        prev.map((m) => (m.requiresConfirmation ? { ...m, confirmationHandled: true } : m))
      );

      addAssistantMessage(response.message || 'Executing confirmed action...');
      await executeAction(actionToRun, payloadToRun);
      return;
    }

    // Handle Follow-up Cancellation (e.g. user said "nahi", "cancel", "mat karo")
    if (response.intent === 'CONFIRM_CANCEL' && pendingConfirmation) {
      setPendingConfirmation(null);
      setMessages((prev) =>
        prev.map((m) => (m.requiresConfirmation ? { ...m, confirmationHandled: true } : m))
      );
      addAssistantMessage(response.message || 'Action cancelled.');
      return;
    }

    // Check if new action requires explicit confirmation
    if (response.action && response.requiresConfirmation) {
      const actionDef = ACTION_DEFINITIONS[response.action];
      const prompt =
        actionDef?.confirmationPromptHinglish ||
        actionDef?.confirmationPrompt ||
        `Kya aap ${actionDef?.label || response.action} execute karna chahte hain?`;

      setPendingConfirmation({
        actionCode: response.action,
        prompt,
        payload: response.actionPayload || undefined,
      });

      addAssistantMessage(
        response.message,
        response.intent,
        response.action,
        true,
        response.actionPayload || undefined
      );
      return;
    }

    // Execute direct allowed action
    if (response.action) {
      await executeAction(response.action, response.actionPayload || undefined);
    }

    addAssistantMessage(
      response.message,
      response.intent,
      response.action,
      false,
      response.actionPayload || undefined
    );
  };

  const handleConfirmPendingAction = async () => {
    if (pendingConfirmation) {
      const { actionCode, payload } = pendingConfirmation;
      setPendingConfirmation(null);

      setMessages((prev) =>
        prev.map((m) => (m.requiresConfirmation ? { ...m, confirmationHandled: true } : m))
      );

      addAssistantMessage(`Action confirm ho gaya: ${actionCode} execute kiya ja raha hai.`);
      await executeAction(actionCode, payload);
    }
  };

  const handleCancelPendingAction = () => {
    if (pendingConfirmation) {
      setPendingConfirmation(null);
      setMessages((prev) =>
        prev.map((m) => (m.requiresConfirmation ? { ...m, confirmationHandled: true } : m))
      );
      addAssistantMessage('Action cancel kar diya gaya hai.');
    }
  };

  const handleClearChat = () => {
    stopSpeaking();
    setPendingConfirmation(null);
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: "Hi, I'm MJ. How can I help?\n\nChat history reset ho gayi hai. Batayein main kya madad kar sakta hoon?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const currentSemantic = getScreenSemantic(currentScreen);

  const quickPrompts = [
    'Mera dashboard kholo',
    'Mera plan batao',
    'Downloads kholo',
    'Free panel dikhao',
    'Ye page kya hai?',
    'Yaha kya kar sakta hu?',
    'Settings kholo',
    'Maintenance status kya hai?',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md h-[92vh] sm:h-[84vh] rounded-t-3xl sm:rounded-2xl bg-[#0d101a] border border-[#232a3f] shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-slideUp">
        {/* Header */}
        <div className="p-3.5 border-b border-[#1f263b] flex items-center justify-between bg-[#121624]">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20">
                <Bot className="w-5 h-5 text-slate-950" />
              </div>
              {voiceState === 'listening' && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white tracking-wide">MJ</h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-medium">
                  In-App Assistant
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    voiceState === 'listening'
                      ? 'bg-red-400 animate-pulse'
                      : voiceState === 'processing'
                      ? 'bg-amber-400 animate-spin'
                      : voiceState === 'speaking'
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-cyan-400'
                  }`}
                />
                <span className="capitalize font-mono">
                  {voiceState === 'listening'
                    ? 'MJ is listening...'
                    : voiceState === 'processing'
                    ? 'MJ is thinking...'
                    : voiceState === 'speaking'
                    ? 'MJ is speaking...'
                    : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle TTS */}
            <button
              onClick={handleToggleVoiceOutput}
              className={`p-2 rounded-lg border text-xs transition-colors ${
                voiceOutput
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
              title={voiceOutput ? 'Voice playback ON' : 'Voice playback OFF'}
            >
              {voiceOutput ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Clear Chat */}
            <button
              onClick={handleClearChat}
              className="p-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Clear Chat History"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close MJ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Screen Semantic Context Bar */}
        <div className="px-3.5 py-1.5 bg-[#101422] border-b border-[#1c2234] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-slate-500">Screen:</span>
            <span className="font-semibold text-cyan-400 truncate">{currentSemantic.title}</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 shrink-0">
            {currentSemantic.availableActions.length} Actions
          </span>
        </div>

        {/* Wake Word Setting Bar */}
        <div className="px-3.5 py-2 bg-[#121726] border-b border-[#1f273d] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              wakeWordEnabled ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
            }`}>
              <Radio className={`w-3.5 h-3.5 ${wakeWordEnabled ? 'animate-pulse' : ''}`} />
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white truncate">Wake word</span>
                <MJWakeStatusIndicator
                  state={wakeWordState}
                  enabled={wakeWordEnabled}
                  compact
                />
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Say 'Hey MJ' or 'MJ' to start talking to MJ.
              </p>
            </div>
          </div>

          {/* Toggle Switch [ ON / OFF ] */}
          {onToggleWakeWord && (
            <button
              onClick={onToggleWakeWord}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                wakeWordEnabled ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
              title={`Turn Wake Word ${wakeWordEnabled ? 'OFF' : 'ON'}`}
            >
              <span className="sr-only">Toggle wake word</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  wakeWordEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          )}
        </div>

        {/* Chat History Stream */}
        <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[88%] ${
                  isUser ? 'self-end flex-row-reverse' : 'self-start'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-[#181e30] border border-[#27324c] text-cyan-400'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed flex flex-col gap-1.5 ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-tr-none shadow-md shadow-cyan-950/20'
                      : 'bg-[#141826] border border-[#21283d] text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Registered Action Pill */}
                  {msg.actionCode && (
                    <div className="mt-1 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] font-mono text-cyan-300">
                      <span className="flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-cyan-400" />
                        <span>Action: {msg.actionCode}</span>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[9px] text-slate-400/80 pt-0.5">
                    <span>{msg.timestamp}</span>
                    {!isUser && voiceOutput && (
                      <button
                        onClick={() => speakText(msg.text)}
                        className="hover:text-cyan-300 flex items-center gap-0.5 ml-2"
                        title="Replay Voice"
                      >
                        <Volume2 className="w-2.5 h-2.5" />
                        <span>Play</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pending Confirmation Box */}
          {pendingConfirmation && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2 animate-fadeIn">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300">Confirmation Required</h4>
                  <p className="text-[11px] text-amber-200/90 mt-0.5">{pendingConfirmation.prompt}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleConfirmPendingAction}
                  disabled={isExecutingAction}
                  className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1"
                >
                  {isExecutingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Haan, proceed karo</span>
                </button>
                <button
                  onClick={handleCancelPendingAction}
                  disabled={isExecutingAction}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                >
                  Nahi, cancel
                </button>
              </div>
            </div>
          )}

          {/* Action Execution Indicator */}
          {isExecutingAction && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Action execute ho raha hai...</span>
            </div>
          )}

          {/* Voice speaking indicator */}
          {voiceState === 'speaking' && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 animate-pulse">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px]">MJ is speaking...</span>
              </div>
              <button
                onClick={() => {
                  stopSpeaking();
                  setVoiceState('idle');
                }}
                className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
              >
                <StopCircle className="w-3 h-3" />
                <span>Stop</span>
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3.5 py-1.5 bg-[#0f121d] border-t border-[#1a2033] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(prompt)}
              className="px-2.5 py-1 rounded-full bg-[#161a28] border border-[#242c42] hover:border-cyan-500/40 text-[10px] text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-all active:scale-95"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#121624] border-t border-[#1f263b] flex items-center gap-2">
          {/* Microphone Button */}
          <button
            onClick={handleMicClick}
            className={`p-2.5 rounded-xl transition-all relative ${
              voiceState === 'listening'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                : 'bg-[#181d2d] border border-[#27324c] text-cyan-400 hover:bg-[#20273c]'
            }`}
            title={voiceState === 'listening' ? 'Stop Listening' : 'Tap to Speak'}
          >
            {voiceState === 'listening' ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendQuery();
            }}
            placeholder={
              voiceState === 'listening'
                ? 'MJ is listening... speak clearly'
                : 'Ask MJ in English or Hinglish (e.g., "Downloads kholo")...'
            }
            className="flex-1 px-3 py-2 rounded-xl bg-[#171c2b] border border-[#27324c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendQuery()}
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all shadow-md shadow-cyan-500/20"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
