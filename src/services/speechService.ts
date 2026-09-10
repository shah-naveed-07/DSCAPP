// Speech-to-Text (STT) and Text-to-Speech (TTS) Service for MJ Assistant

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

export interface VoiceDiagnostics {
  selectedVoiceName: string;
  selectedVoiceLang: string;
  requestedMode: 'hinglish' | 'english' | 'hindi';
  availableVoicesCount: number;
  fallbackReason?: string;
  timestamp: string;
}

let lastVoiceDiagnostics: VoiceDiagnostics = {
  selectedVoiceName: 'None',
  selectedVoiceLang: 'en-IN',
  requestedMode: 'hinglish',
  availableVoicesCount: 0,
  timestamp: new Date().toISOString(),
};

/**
 * Internal diagnostics accessor (never shown to normal users)
 */
export function getVoiceDiagnostics(): VoiceDiagnostics {
  return { ...lastVoiceDiagnostics };
}

// Preload and cache speech synthesis voices
let cachedVoices: SpeechSynthesisVoice[] = [];

function updateCachedVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const list = window.speechSynthesis.getVoices();
    if (list && list.length > 0) {
      cachedVoices = list;
    }
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  updateCachedVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    updateCachedVoices();
  };
}

/**
 * Detects whether the text is Hinglish / Roman Hindi, Hindi (Devanagari), or English
 */
export function detectLanguageMode(text: string): 'hinglish' | 'hindi' | 'english' {
  if (!text) return 'english';

  // Devanagari Unicode range
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hindi';
  }

  // Common Roman Hindi / Hinglish tokens
  const hinglishTokens = [
    'kholo', 'khol', 'dikhao', 'dikhana', 'dekho', 'dekhna', 'batao', 'bata', 'bolo',
    'karo', 'kar', 'karna', 'mera', 'meri', 'mere', 'mujhe', 'humara', 'aapka', 'aapko',
    'hai', 'hain', 'hoga', 'hogi', 'kya', 'kaise', 'kaha', 'kyun', 'nahi', 'nahin',
    'haan', 'han', 'theek', 'thik', 'bilkul', 'shuru', 'wapis', 'peeche', 'piche',
    'pehle', 'wala', 'wali', 'bhai', 'dost', 'le chalo', 'samjhao', 'chahiye', 'kar do',
    'mat karo', 'rehne do', 'de do', 'muft', 'band karo', 'badal do', 'badlo'
  ];

  const lower = text.toLowerCase();
  for (const token of hinglishTokens) {
    const pattern = new RegExp(`\\b${token}\\b`, 'i');
    if (pattern.test(lower)) {
      return 'hinglish';
    }
  }

  return 'english';
}

/**
 * Cleans text for natural Text-To-Speech playback
 * Strips markdown, URLs, technical action codes, and JSON blocks
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove bold and italic markdown
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove markdown headers
    .replace(/^#+\s+/gm, '')
    // Remove markdown bullet points
    .replace(/^[\s•*-]+\s*/gm, '')
    // Remove URLs
    .replace(/https?:\/\/\S+/gi, '')
    // Remove action codes like OPEN_USER_DASHBOARD
    .replace(/\b[A-Z]+_[A-Z0-9_]+\b/g, '')
    // Remove JSON artifacts
    .replace(/\{[^}]+\}/g, '')
    // Collapse multiple whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Starts listening to microphone input via Web Speech API
 * Automatically interrupts any active speech synthesis
 */
export function startVoiceListening(
  onTranscript: (text: string, isFinal: boolean) => void,
  onStateChange: (state: AssistantVoiceState) => void,
  onError: (errorText: string) => void
): () => void {
  // Interrupt any active TTS immediately
  stopSpeaking();

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

    if (activeRecognition) {
      try {
        activeRecognition.abort();
      } catch {}
      activeRecognition = null;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    // en-IN allows seamless recognition of English, Indian accents, and Roman Hinglish
    recognition.lang = 'en-IN';

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
      } else if (event.error === 'aborted') {
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
 * Intelligent voice selection for Indian English & Hinglish
 */
function selectBestVoice(mode: 'hinglish' | 'hindi' | 'english'): {
  voice: SpeechSynthesisVoice | null;
  lang: string;
  fallbackReason?: string;
} {
  updateCachedVoices();
  const voices = cachedVoices.length > 0 ? cachedVoices : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);

  if (!voices || voices.length === 0) {
    return {
      voice: null,
      lang: mode === 'hindi' ? 'hi-IN' : 'en-IN',
      fallbackReason: 'No synthesized voices loaded yet in browser engine',
    };
  }

  // 1. For Devanagari Hindi or Hinglish, look for Hindi voices first, then Indian English
  if (mode === 'hindi' || mode === 'hinglish') {
    const hindiVoice = voices.find(
      (v) => (v.lang || '').toLowerCase().startsWith('hi') || (v.name || '').toLowerCase().includes('hindi')
    );
    if (hindiVoice) {
      return { voice: hindiVoice, lang: hindiVoice.lang };
    }

    const indianEngVoice = voices.find(
      (v) =>
        (v.lang || '').toLowerCase() === 'en-in' ||
        (v.lang || '').toLowerCase() === 'en_in' ||
        (v.name || '').toLowerCase().includes('india') ||
        (v.name || '').toLowerCase().includes('neerja') ||
        (v.name || '').toLowerCase().includes('prabhat') ||
        (v.name || '').toLowerCase().includes('hemant')
    );
    if (indianEngVoice) {
      return { voice: indianEngVoice, lang: indianEngVoice.lang };
    }
  }

  // 2. For English, look for Indian English or natural English voices
  const preferredEngVoice = voices.find(
    (v) =>
      (v.lang || '').toLowerCase() === 'en-in' ||
      (v.lang || '').toLowerCase() === 'en_in' ||
      (v.name || '').toLowerCase().includes('india')
  );
  if (preferredEngVoice) {
    return { voice: preferredEngVoice, lang: preferredEngVoice.lang };
  }

  // 3. Fallback to any English voice
  const generalEngVoice = voices.find((v) => (v.lang || '').toLowerCase().startsWith('en'));
  if (generalEngVoice) {
    return {
      voice: generalEngVoice,
      lang: generalEngVoice.lang,
      fallbackReason: 'Indian English voice not installed on device; using system English voice',
    };
  }

  // 4. Ultimate fallback to default voice
  return {
    voice: voices[0] || null,
    lang: mode === 'hindi' ? 'hi-IN' : 'en-IN',
    fallbackReason: 'Default device voice selected',
  };
}

/**
 * Speaks text aloud using SpeechSynthesis with natural Hinglish / Indian pronunciation
 */
export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  if (!isSpeechSynthesisSupported() || !isVoiceOutputEnabled()) {
    return () => {};
  }

  // Stop previous speech synthesis and cancel listening
  stopSpeaking();
  stopVoiceListening();

  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) return () => {};

  const mode = detectLanguageMode(cleanText);
  const { voice, lang, fallbackReason } = selectBestVoice(mode);

  lastVoiceDiagnostics = {
    selectedVoiceName: voice ? voice.name : 'System Default',
    selectedVoiceLang: lang,
    requestedMode: mode,
    availableVoicesCount: cachedVoices.length,
    fallbackReason,
    timestamp: new Date().toISOString(),
  };

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = mode === 'hinglish' ? 0.95 : 1.0;
  utterance.pitch = 1.0;
  utterance.lang = lang;

  if (voice) {
    utterance.voice = voice;
  }

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

/**
 * Stops both speech listening (STT) and voice speech (TTS) simultaneously
 */
export function stopAllSpeech() {
  stopVoiceListening();
  stopSpeaking();
}
