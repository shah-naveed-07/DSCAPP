import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  X,
  Trash2,
  Sparkles,
  Bot,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  StopCircle,
  HelpCircle,
  Terminal,
} from 'lucide-react';
import { ScreenDestination, UserSession } from '../types';
import {
  ChatMessage,
  queryAssistant,
} from '../services/aiAssistantService';
import {
  startVoiceListening,
  stopVoiceListening,
  speakText,
  stopSpeaking,
  isVoiceOutputEnabled,
  setVoiceOutputEnabled,
  isSpeechRecognitionSupported,
  AssistantVoiceState,
} from '../services/speechService';
import { getScreenSemantic } from '../services/screenRegistry';
import { validateActionPermission, ACTION_DEFINITIONS } from '../services/actionRegistry';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: ScreenDestination;
  session: UserSession | null;
  onNavigate: (screen: ScreenDestination) => void;
  onActionExecute?: (actionCode: string, payload?: unknown) => void;
}

export const AIAssistantSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  currentScreen,
  session,
  onNavigate,
  onActionExecute,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your DSCWeb in-app Voice Assistant. You can speak or type to navigate screens, read page contents, discover buttons, or check subscription details.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [voiceState, setVoiceState] = useState<AssistantVoiceState>('idle');
  const [voiceOutput, setVoiceOutput] = useState<boolean>(isVoiceOutputEnabled());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    actionCode: string;
    prompt: string;
    messageId: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Clean up voice when closed
  useEffect(() => {
    if (!isOpen) {
      stopVoiceListening();
      stopSpeaking();
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

  const handleMicClick = () => {
    if (voiceState === 'listening') {
      stopVoiceListening();
      setVoiceState('idle');
      return;
    }

    setErrorMessage(null);
    stopSpeaking();

    const stop = startVoiceListening(
      (transcript, isFinal) => {
        setInputText(transcript);
        if (isFinal && transcript.trim()) {
          handleSendQuery(transcript.trim());
          stopVoiceListening();
        }
      },
      (state) => setVoiceState(state),
      (err) => setErrorMessage(err)
    );

    stopListeningRef.current = stop;
  };

  const executeAction = (actionCode: string, payload?: unknown) => {
    const validation = validateActionPermission(actionCode, session);

    if (!validation.allowed) {
      addAssistantMessage(validation.reason || 'Action not permitted for current role.');
      return;
    }

    const actionDef = validation.actionDef;

    // 1. Navigation actions
    if (actionDef?.targetScreen) {
      onNavigate(actionDef.targetScreen);
      return;
    }

    // 2. Specific Screen Utilities
    if (actionCode === 'COPY_USER_KEY') {
      if (onActionExecute) onActionExecute('COPY_USER_KEY');
      return;
    }

    if (actionCode === 'START_DOWNLOAD') {
      onNavigate('downloads');
      return;
    }

    if (actionCode === 'REFRESH_CURRENT_SCREEN') {
      if (onActionExecute) onActionExecute('REFRESH_CURRENT_SCREEN');
      return;
    }

    if (onActionExecute) {
      onActionExecute(actionCode, payload);
    }
  };

  const addAssistantMessage = (
    text: string,
    intent?: string | null,
    actionCode?: string | null,
    requiresConf?: boolean
  ) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      intent,
      actionCode,
      requiresConfirmation: requiresConf,
    };

    setMessages((prev) => [...prev, newMsg]);

    // Handle voice output
    if (voiceOutput) {
      setVoiceState('speaking');
      speakText(
        text,
        () => setVoiceState('speaking'),
        () => setVoiceState('idle')
      );
    }
  };

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setVoiceState('processing');
    setErrorMessage(null);

    // Query backend AI assistant
    const response = await queryAssistant(textToSend, currentScreen, session, messages);

    setVoiceState('idle');

    // Check if action requires confirmation
    if (response.action && response.requiresConfirmation) {
      const actionDef = ACTION_DEFINITIONS[response.action];
      const prompt = actionDef?.confirmationPrompt || `Execute ${actionDef?.label || response.action}?`;

      addAssistantMessage(response.message, response.intent, response.action, true);
      setPendingConfirmation({
        actionCode: response.action,
        prompt,
        messageId: `msg-${Date.now()}`,
      });
      return;
    }

    // Direct allowed action execution
    if (response.action) {
      executeAction(response.action, response.actionPayload);
    }

    addAssistantMessage(response.message, response.intent, response.action, false);
  };

  const handleConfirmAction = () => {
    if (pendingConfirmation) {
      executeAction(pendingConfirmation.actionCode);
      addAssistantMessage(`Confirmed: Executed ${pendingConfirmation.actionCode}.`);
      setPendingConfirmation(null);
    }
  };

  const handleCancelAction = () => {
    if (pendingConfirmation) {
      addAssistantMessage('Action cancelled.');
      setPendingConfirmation(null);
    }
  };

  const handleClearChat = () => {
    stopSpeaking();
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: 'Conversation history cleared. How can I help you in DSCWeb today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const currentSemantic = getScreenSemantic(currentScreen);

  const quickPrompts = [
    'Read this page for me',
    'What can I do on this screen?',
    'Where are my downloads?',
    'What is my current plan?',
    'Show me VIP Products',
    'Open Free Panel',
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
                <h3 className="text-xs font-bold text-white">DSC AI Voice Assistant</h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  v2.5
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
                    ? 'Listening to microphone...'
                    : voiceState === 'processing'
                    ? 'Reasoning intent...'
                    : voiceState === 'speaking'
                    ? 'Speaking response...'
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
              title={voiceOutput ? 'Voice output enabled' : 'Voice output disabled'}
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
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Screen Semantic Context Indicator */}
        <div className="px-3.5 py-1.5 bg-[#101422] border-b border-[#1c2234] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-slate-500">Context:</span>
            <span className="font-semibold text-cyan-400 truncate">{currentSemantic.title}</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 shrink-0">
            {currentSemantic.availableActions.length} Actions
          </span>
        </div>

        {/* Chat History Message Stream */}
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

                  {/* Action Badge if an action was identified */}
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
                        className="hover:text-cyan-300 flex items-center gap-0.5"
                        title="Replay Voice"
                      >
                        <Volume2 className="w-2.5 h-2.5" />
                        <span>Replay</span>
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
                  onClick={handleConfirmAction}
                  className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all"
                >
                  Confirm & Execute
                </button>
                <button
                  onClick={handleCancelAction}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Voice speaking wave indicator */}
          {voiceState === 'speaking' && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 animate-pulse">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px]">Speaking response...</span>
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
                ? 'Listening... speak clearly'
                : 'Ask anything (e.g., "Open downloads", "Read page")...'
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
