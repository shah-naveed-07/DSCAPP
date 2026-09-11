// Wake-Word / Voice Invocation Engine for MJ Assistant
// Conforms to portable WakeWordEngine architecture for future Native Android migration

export type WakeWordState =
  | 'disabled'             // Wake word feature toggled off
  | 'unsupported'          // Platform lacks speech recognition
  | 'permission_required'  // Needs user permission
  | 'permission_denied'    // User or browser denied mic permission
  | 'standby'              // Active & listening for "Hey MJ"
  | 'activated'            // Detected "Hey MJ", listening for command
  | 'processing'           // Intent engine analyzing user command
  | 'speaking'             // MJ speaking response aloud (wake listening suspended)
  | 'paused';              // Temporarily suspended (e.g. background tab or active manual mic)

export interface WakeWordEvent {
  wakePhrase: string;
  command: string;
  rawTranscript: string;
  timestamp: number;
}

export interface WakeDetectionResult {
  detected: boolean;
  wakePhrase: string;
  command: string;
}

export interface WakeWordEngine {
  start: () => Promise<boolean>;
  stop: () => void;
  isRunning: () => boolean;
  getState: () => WakeWordState;
  onWakeWordDetected: ((event: WakeWordEvent) => void) | null;
  onStateChanged: ((state: WakeWordState) => void) | null;
  onError: ((error: string) => void) | null;
}

const STORAGE_KEY_WAKE_ENABLED = 'dsc_assistant_wakeword_enabled';
const STORAGE_KEY_MIC_PERMISSION = 'dsc_assistant_mic_permission_granted';

/**
 * Normalizes speech text for robust wake-word detection:
 * - Lowercases text
 * - Strips punctuation, quotes, symbols to whitespace
 * - Collapses repeated whitespace
 */
export function normalizeForWakeWord(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[,.?!:;'"()\[\]{}\-_\/\\#*`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Wake Word regex matcher:
 * Supported wake phrases:
 * - "Hey MJ", "MJ"
 * Speech recognition variations:
 * - "hey m j", "m j"
 * - "hey em jay", "em jay", "m jay"
 * - "okay mj", "ok mj", "okay em jay", "ok em jay"
 *
 * Strict token boundary prevents false activations from unrelated words:
 * - "mujhe..." (does NOT activate)
 * - "main..." (does NOT activate)
 * - "mera..." (does NOT activate)
 * - "samjha..." (does NOT activate)
 * - "Hey DSC", "Hey Assistant" (does NOT activate)
 */
const WAKE_PHRASE_REGEX =
  /^(?:(?:uh|um|er|ah|oye)\s+)?(?:(hey|hay|hei|ok|okay|hi|hello)\s+)?(mj|m\s+j|em\s+jay|m\s+jay)(?:[,\s]+(.*))?$/i;

/**
 * Extracts wake phrase and remainder command from user utterance
 */
export function extractWakeWordAndCommand(rawTranscript: string): WakeDetectionResult {
  const normalized = normalizeForWakeWord(rawTranscript);
  if (!normalized) {
    return { detected: false, wakePhrase: '', command: '' };
  }

  const match = normalized.match(WAKE_PHRASE_REGEX);
  if (!match) {
    return { detected: false, wakePhrase: '', command: '' };
  }

  const prefix = match[1] ? match[1].trim() : '';
  const wakeWordToken = match[2] ? match[2].trim() : 'mj';
  const wakePhrase = prefix ? `${prefix} ${wakeWordToken}` : wakeWordToken;

  let command = (match[3] || '').trim();

  // If command exists, attempt to extract the slice from the raw transcript to preserve original casing
  if (command && rawTranscript) {
    // Locate approximate end position of wake word in original transcript
    const wakeVariants = [
      'hey mj', 'hey m j', 'hey em jay', 'okay mj', 'ok mj',
      'ok em jay', 'okay em jay', 'em jay', 'm j', 'mj'
    ];
    const lowerRaw = rawTranscript.toLowerCase();
    for (const variant of wakeVariants) {
      const idx = lowerRaw.indexOf(variant);
      if (idx !== -1 && idx < 15) { // wake phrase occurs at start of utterance
        const remainder = rawTranscript.slice(idx + variant.length).replace(/^[,.\s\-:]+/, '').trim();
        if (remainder) {
          command = remainder;
          break;
        }
      }
    }
  }

  return {
    detected: true,
    wakePhrase,
    command,
  };
}

/**
 * Validates the wake word extractor against the required test cases
 */
export function testWakeWordPatterns(): { passed: boolean; details: Record<string, boolean> } {
  const tests: Array<{ input: string; shouldMatch: boolean; expectedCommandSub?: string }> = [
    // Positive tests
    { input: 'Hey MJ', shouldMatch: true },
    { input: 'MJ', shouldMatch: true },
    { input: 'Hey M J', shouldMatch: true },
    { input: 'Hey em jay', shouldMatch: true },
    { input: 'em jay', shouldMatch: true },
    { input: 'okay MJ', shouldMatch: true },
    { input: 'ok MJ', shouldMatch: true },
    { input: 'Hey MJ mera dashboard kholo', shouldMatch: true, expectedCommandSub: 'dashboard' },
    { input: 'MJ settings open karo', shouldMatch: true, expectedCommandSub: 'settings' },
    { input: 'Hey MJ mujhe mera plan batao', shouldMatch: true, expectedCommandSub: 'plan' },
    { input: 'MJ orders check karo', shouldMatch: true, expectedCommandSub: 'orders' },
    { input: 'Hey MJ free users dikhao', shouldMatch: true, expectedCommandSub: 'users' },
    { input: 'Hey MJ owner database kholo', shouldMatch: true, expectedCommandSub: 'database' },
    { input: 'Hey MJ haan', shouldMatch: true, expectedCommandSub: 'haan' },
    { input: 'Hey MJ cancel', shouldMatch: true, expectedCommandSub: 'cancel' },

    // False positive tests (MUST NOT activate)
    { input: 'mujhe dashboard kholo', shouldMatch: false },
    { input: 'main settings dekh raha hoon', shouldMatch: false },
    { input: 'mera plan kya hai', shouldMatch: false },
    { input: 'ye page mujhe samajh nahi aa raha', shouldMatch: false },
    { input: 'Hey DSC', shouldMatch: false },
    { input: 'Hey DSCWeb', shouldMatch: false },
    { input: 'Hey Assistant', shouldMatch: false },
    { input: 'Hey AI', shouldMatch: false },
    { input: 'bhai mujhe samjhao', shouldMatch: false },
    { input: 'namja kholo', shouldMatch: false },
  ];

  const details: Record<string, boolean> = {};
  let allPassed = true;

  for (const t of tests) {
    const res = extractWakeWordAndCommand(t.input);
    const passed = res.detected === t.shouldMatch;
    details[t.input] = passed;
    if (!passed) allPassed = false;
  }

  return { passed: allPassed, details };
}

/**
 * Plays subtle, pleasant two-tone activation chime using Web Audio API
 */
let sharedAudioCtx: AudioContext | null = null;

export function playActivationChime() {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return;

    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtxClass();
    }

    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }

    const now = sharedAudioCtx.currentTime;
    const osc1 = sharedAudioCtx.createOscillator();
    const osc2 = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(sharedAudioCtx.destination);

    osc1.start(now);
    osc1.stop(now + 0.08);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.22);
  } catch (e) {
    // Audio chime failure should never crash the app
    console.debug('Chime audio playback suppressed:', e);
  }
}

/**
 * Web Speech API-based Wake Word Engine
 * - Runs foreground, on-device browser speech recognition
 * - Never continuously uploads audio to cloud AI
 * - Low resource overhead; automatically pauses when page is hidden or MJ is speaking
 */
class BrowserWakeWordEngine implements WakeWordEngine {
  private recognition: any = null;
  private running = false;
  private currentState: WakeWordState = 'disabled';
  private restartTimeout: any = null;
  private isSuspendedForTTS = false;
  private isSuspendedForProcessing = false;

  public onWakeWordDetected: ((event: WakeWordEvent) => void) | null = null;
  public onStateChanged: ((state: WakeWordState) => void) | null = null;
  public onError: ((error: string) => void) | null = null;

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getState(): WakeWordState {
    return this.currentState;
  }

  private setState(newState: WakeWordState) {
    if (this.currentState !== newState) {
      this.currentState = newState;
      if (this.onStateChanged) {
        this.onStateChanged(newState);
      }
    }
  }

  private handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      if (this.running) {
        this.stopRecognitionOnly();
        this.setState('paused');
      }
    } else if (document.visibilityState === 'visible') {
      if (this.running && isWakeWordEnabled()) {
        this.startRecognitionOnly();
      }
    }
  }

  public async start(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      this.setState('unsupported');
      if (this.onError) {
        this.onError('Speech recognition is not supported in this browser environment.');
      }
      return false;
    }

    this.running = true;
    return this.startRecognitionOnly();
  }

  private startRecognitionOnly(): boolean {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    try {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN'; // Indian English handles Hindi accents, Hinglish, and English tokens cleanly

      rec.onstart = () => {
        if (!this.isSuspendedForTTS && !this.isSuspendedForProcessing) {
          this.setState('standby');
        }
      };

      rec.onresult = (event: any) => {
        // While MJ is actively speaking aloud or processing, ignore recognition to prevent echo loop
        if (this.isSuspendedForTTS || this.isSuspendedForProcessing) {
          return;
        }

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (!transcript) continue;

          const detection = extractWakeWordAndCommand(transcript);
          if (detection.detected) {
            // Wake word confirmed!
            playActivationChime();
            this.setState('activated');

            if (this.onWakeWordDetected) {
              this.onWakeWordDetected({
                wakePhrase: detection.wakePhrase,
                command: detection.command,
                rawTranscript: transcript,
                timestamp: Date.now(),
              });
            }
            break;
          }
        }
      };

      rec.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.running = false;
          this.setState('permission_denied');
          if (this.onError) {
            this.onError('Microphone permission was denied. Click to retry.');
          }
        } else if (event.error === 'no-speech' || event.error === 'aborted') {
          // Benign browser timeouts; will auto-restart if still running
        } else {
          console.debug('Wake-word listener error:', event.error);
        }
      };

      rec.onend = () => {
        this.recognition = null;
        // Auto-restart standby listener if still running and not explicitly suspended
        if (this.running && document.visibilityState === 'visible' && !this.isSuspendedForTTS) {
          this.restartTimeout = setTimeout(() => {
            if (this.running) {
              this.startRecognitionOnly();
            }
          }, 300);
        }
      };

      this.recognition = rec;
      rec.start();
      return true;
    } catch (err) {
      console.warn('Failed to start wake-word recognizer:', err);
      this.setState('disabled');
      return false;
    }
  }

  private stopRecognitionOnly() {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
  }

  public stop() {
    this.running = false;
    this.stopRecognitionOnly();
    this.setState('disabled');
  }

  /**
   * Temporarily suspends wake-word recognition during MJ Text-To-Speech playback
   * to avoid interpreting MJ's own synthesized voice as a wake command.
   */
  public suspendForTTS(suspended: boolean) {
    this.isSuspendedForTTS = suspended;
    if (suspended) {
      this.setState('speaking');
      this.stopRecognitionOnly();
    } else {
      if (this.running && isWakeWordEnabled() && document.visibilityState === 'visible') {
        this.setState('standby');
        this.startRecognitionOnly();
      }
    }
  }

  /**
   * Suspends wake-word during active command processing
   */
  public suspendForProcessing(processing: boolean) {
    this.isSuspendedForProcessing = processing;
    if (processing) {
      this.setState('processing');
    } else {
      if (this.running && isWakeWordEnabled()) {
        this.setState('standby');
      }
    }
  }
}

// Singleton Engine Instance
export const wakeWordEngine = new BrowserWakeWordEngine();

// Persistent Preference Helpers
export function isWakeWordSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
}

export function isWakeWordEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY_WAKE_ENABLED) === 'true';
}

export function setWakeWordEnabled(enabled: boolean) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_WAKE_ENABLED, String(enabled));
  }
  if (enabled) {
    wakeWordEngine.start();
  } else {
    wakeWordEngine.stop();
  }
}

export function hasMicrophonePermission(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY_MIC_PERMISSION) === 'true';
}

export function setMicrophonePermission(granted: boolean) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_MIC_PERMISSION, String(granted));
  }
}

/**
 * Requests microphone permission with explicit user intent and context
 */
export async function requestMicrophoneAccess(): Promise<{ granted: boolean; error?: string }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { granted: false, error: 'Microphone API unavailable in this browser.' };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Immediately stop tracks so mic indicator doesn't remain persistently green before start
    stream.getTracks().forEach((track) => track.stop());
    setMicrophonePermission(true);
    return { granted: true };
  } catch (err: any) {
    setMicrophonePermission(false);
    return {
      granted: false,
      error: err?.message || 'Microphone permission was denied by user or browser.',
    };
  }
}
