// Speech-to-Text (STT) and Text-to-Speech (TTS) Service for DSCWeb Android App

export type AssistantVoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: { new (): SpeechRecognitionInstance };
    webkitSpeechRecognition?: { new (): SpeechRecognitionInstance };
  }
}

const VOICE_OUTPUT_KEY = 'dsc_assistant_voice_output_enabled';

export function isVoiceOutputEnabled(): boolean {
  const saved = localStorage.getItem(VOICE_OUTPUT_KEY);
  return saved === null ? true : saved === 'true';
}

export function setVoiceOutputEnabled(enabled: boolean) {
  localStorage.setItem(VOICE_OUTPUT_KEY, String(enabled));
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let activeRecognition: SpeechRecognitionInstance | null = null;

/**
 * Starts listening to microphone input via Web Speech API
 */
export function startVoiceListening(
  onTranscript: (text: string, isFinal: boolean) => void,
  onStateChange: (state: AssistantVoiceState) => void,
  onError: (errorText: string) => void
): () => void {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition is not supported in this browser. Please type your query.');
    onStateChange('error');
    return () => {};
  }

  try {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      onError('Speech recognition constructor unavailable.');
      return () => {};
    }

    // Abort any existing instance
    if (activeRecognition) {
      try {
        activeRecognition.abort();
      } catch {}
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Works with accented and multilingual phrases

    recognition.onstart = () => {
      onStateChange('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        onTranscript(interimTranscript.trim(), false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        onStateChange('idle');
      } else {
        onError(`Microphone error: ${event.error}`);
        onStateChange('error');
      }
    };

    recognition.onend = () => {
      activeRecognition = null;
    };

    activeRecognition = recognition;
    recognition.start();

    return () => {
      try {
        recognition.stop();
      } catch {}
      activeRecognition = null;
      onStateChange('idle');
    };
  } catch (err: unknown) {
    onError(err instanceof Error ? err.message : 'Failed to start microphone');
    onStateChange('error');
    return () => {};
  }
}

/**
 * Stops any active speech recognition
 */
export function stopVoiceListening() {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch {}
    activeRecognition = null;
  }
}

/**
 * Speaks text aloud using SpeechSynthesis
 */
export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  if (!isSpeechSynthesisSupported() || !isVoiceOutputEnabled()) {
    return () => {};
  }

  // Cancel any prior speech
  stopSpeaking();

  // Strip markdown formatting for cleaner speech output
  const cleanText = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#+\s/g, '')
    .trim();

  if (!cleanText) return () => {};

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.lang = 'en-US';

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);

  return () => {
    stopSpeaking();
  };
}

/**
 * Immediately stops any active text-to-speech utterance
 */
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}
