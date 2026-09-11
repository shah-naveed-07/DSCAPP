import React from 'react';
import { Bot, Mic, MicOff, Volume2, Loader2, Sparkles } from 'lucide-react';
import { WakeWordState } from '../services/wakeWordService';

interface Props {
  onClick: () => void;
  wakeState?: WakeWordState;
  wakeEnabled?: boolean;
}

export const FloatingAssistantButton: React.FC<Props> = ({
  onClick,
  wakeState = 'disabled',
  wakeEnabled = false,
}) => {
  const isListening = wakeState === 'activated' || wakeState === 'standby';
  const isSpeaking = wakeState === 'speaking';
  const isProcessing = wakeState === 'processing';

  // Label for state indicator
  let stateBadge = 'Wake word off';
  let badgeColor = 'bg-slate-900/90 border-slate-700 text-slate-400';
  let dotColor = 'bg-slate-500';

  if (wakeEnabled) {
    if (wakeState === 'standby') {
      stateBadge = 'Listening for "Hey MJ"';
      badgeColor = 'bg-cyan-950/85 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/20';
      dotColor = 'bg-cyan-400 animate-pulse';
    } else if (wakeState === 'activated') {
      stateBadge = 'Listening...';
      badgeColor = 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/30';
      dotColor = 'bg-emerald-400 animate-ping';
    } else if (wakeState === 'processing') {
      stateBadge = 'Thinking...';
      badgeColor = 'bg-purple-950/90 border-purple-500/50 text-purple-300';
      dotColor = 'bg-purple-400 animate-spin';
    } else if (wakeState === 'speaking') {
      stateBadge = 'Speaking...';
      badgeColor = 'bg-blue-950/90 border-blue-500/50 text-blue-300';
      dotColor = 'bg-blue-400 animate-pulse';
    } else if (wakeState === 'permission_denied') {
      stateBadge = 'Mic blocked';
      badgeColor = 'bg-amber-950/90 border-amber-500/50 text-amber-300';
      dotColor = 'bg-amber-400';
    }
  }

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2">
      {/* Subtle Wake State Badge (when wake word enabled) */}
      {wakeEnabled && (
        <button
          onClick={onClick}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium backdrop-blur-md transition-all hover:scale-105 active:scale-95 animate-fadeIn ${badgeColor}`}
          title={`MJ: ${stateBadge} (Say "Hey MJ" or "MJ")`}
        >
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="font-semibold text-white/90">MJ:</span>
          <span>{stateBadge}</span>
        </button>
      )}

      {/* Main Floating Assistant Button */}
      <button
        onClick={onClick}
        className={`group relative flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full text-white shadow-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
          wakeState === 'activated'
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 border-emerald-400 shadow-emerald-500/30 ring-2 ring-emerald-400/40'
            : isSpeaking
            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-blue-400 shadow-blue-500/30'
            : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 border-cyan-400/40 shadow-cyan-500/25'
        }`}
        title="Ask MJ (or say 'Hey MJ')"
      >
        {/* Glow backdrop pulse */}
        <div
          className={`absolute -inset-0.5 rounded-full blur opacity-40 group-hover:opacity-80 transition duration-300 ${
            wakeState === 'activated'
              ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 animate-ping'
              : 'bg-gradient-to-r from-cyan-500 to-purple-600 animate-pulse'
          }`}
        />

        <div className="relative flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-950/40 flex items-center justify-center text-cyan-300">
            {wakeState === 'activated' ? (
              <Mic className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            ) : isSpeaking ? (
              <Volume2 className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
            ) : isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 text-purple-300 animate-spin" />
            ) : (
              <Bot className="w-3.5 h-3.5 text-cyan-300" />
            )}
          </div>
          <span className="text-xs font-semibold tracking-wide text-slate-100">
            {wakeState === 'activated' ? 'Listening...' : 'Ask MJ'}
          </span>
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                wakeState === 'activated'
                  ? 'bg-emerald-400'
                  : wakeEnabled
                  ? 'bg-cyan-400'
                  : 'bg-slate-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                wakeState === 'activated'
                  ? 'bg-emerald-400'
                  : wakeEnabled
                  ? 'bg-cyan-400'
                  : 'bg-slate-500'
              }`}
            />
          </span>
        </div>
      </button>
    </div>
  );
};

