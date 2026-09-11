import React, { useState } from 'react';
import { Mic, ShieldCheck, X, AlertCircle, Volume2, CheckCircle2 } from 'lucide-react';
import { requestMicrophoneAccess } from '../services/wakeWordService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGranted: () => void;
}

export const MicrophonePermissionModal: React.FC<Props> = ({ isOpen, onClose, onGranted }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestAccess = async () => {
    setIsRequesting(true);
    setErrorMessage(null);

    const res = await requestMicrophoneAccess();
    setIsRequesting(false);

    if (res.granted) {
      onGranted();
      onClose();
    } else {
      setErrorMessage(
        res.error ||
          'Microphone permission was denied. You can still use MJ with text chat anytime.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm rounded-2xl bg-[#0f1320] border border-[#232d47] shadow-2xl p-5 text-slate-100 flex flex-col gap-4 animate-slideUp">
        {/* Header with Icon */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Mic className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Enable Voice Wake Word</h3>
              <p className="text-[11px] text-cyan-400 font-mono">"Hey MJ" / "MJ"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Core explanation */}
        <div className="rounded-xl bg-[#141a2d] border border-[#1e2740] p-3.5 flex flex-col gap-2 text-xs text-slate-300">
          <div className="flex items-start gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              Allow microphone access so you can say <strong className="text-white">"Hey MJ"</strong> or <strong className="text-white">"MJ"</strong> to wake your assistant without pressing any buttons.
            </p>
          </div>
          <div className="flex items-start gap-2 pt-2 border-t border-[#1f2842] text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-300">Privacy First:</strong> Wake-word detection runs locally in your browser. Microphone audio is never continuously recorded or uploaded to cloud servers.
            </p>
          </div>
        </div>

        {/* Error message banner if permission was blocked */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span>{errorMessage}</span>
              <span className="text-[10px] text-slate-400">
                Tip: If blocked by browser, click the site settings / lock icon in the browser address bar to allow microphone.
              </span>
            </div>
          </div>
        )}

        {/* Supported wake phrases recap */}
        <div className="flex flex-col gap-1 text-[11px]">
          <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
            Supported Wake Phrases
          </span>
          <div className="flex flex-wrap gap-1.5">
            {['"Hey MJ"', '"MJ"', '"Hey em jay"', '"okay MJ"'].map((phrase) => (
              <span
                key={phrase}
                className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]"
              >
                {phrase}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRequestAccess}
            disabled={isRequesting}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-95 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isRequesting ? 'Requesting...' : 'Allow Access'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
