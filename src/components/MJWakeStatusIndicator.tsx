import React from 'react';
import { Mic, MicOff, Volume2, Loader2, Sparkles } from 'lucide-react';
import { WakeWordState } from '../services/wakeWordService';

interface Props {
  state: WakeWordState;
  enabled: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export const MJWakeStatusIndicator: React.FC<Props> = ({
  state,
  enabled,
  onClick,
  compact = false,
}) => {
  // Determine text and styling based on MJ Wake State
  let label = 'Wake word off';
  let dotColor = 'bg-slate-500';
  let glowColor = 'border-slate-700/60 bg-slate-900/80 text-slate-400';
  let icon = <MicOff className="w-3 h-3 text-slate-400" />;

  if (!enabled || state === 'disabled') {
    label = 'Wake word off';
    dotColor = 'bg-slate-500';
    glowColor = 'border-slate-700/60 bg-slate-900/80 text-slate-400';
    icon = <MicOff className="w-3 h-3 text-slate-400" />;
  } else if (state === 'permission_denied') {
    label = 'Mic permission denied';
    dotColor = 'bg-amber-400';
    glowColor = 'border-amber-500/40 bg-amber-950/40 text-amber-300';
    icon = <MicOff className="w-3 h-3 text-amber-400" />;
  } else if (state === 'standby') {
    label = 'Listening for "Hey MJ"';
    dotColor = 'bg-cyan-400 animate-pulse';
    glowColor = 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300';
    icon = <Mic className="w-3 h-3 text-cyan-400" />;
  } else if (state === 'activated') {
    label = 'Listening...';
    dotColor = 'bg-emerald-400 animate-ping';
    glowColor = 'border-emerald-500/40 bg-emerald-950/50 text-emerald-300 shadow-sm shadow-emerald-500/20';
    icon = <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />;
  } else if (state === 'processing') {
    label = 'Thinking...';
    dotColor = 'bg-purple-400 animate-spin';
    glowColor = 'border-purple-500/40 bg-purple-950/50 text-purple-300';
    icon = <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />;
  } else if (state === 'speaking') {
    label = 'Speaking...';
    dotColor = 'bg-blue-400 animate-pulse';
    glowColor = 'border-blue-500/40 bg-blue-950/50 text-blue-300';
    icon = <Volume2 className="w-3 h-3 text-blue-400" />;
  } else if (state === 'paused') {
    label = 'Wake word paused';
    dotColor = 'bg-slate-400';
    glowColor = 'border-slate-700/60 bg-slate-900/80 text-slate-400';
    icon = <MicOff className="w-3 h-3 text-slate-400" />;
  }

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium transition-all ${glowColor}`}
        title={`MJ: ${label}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span>MJ: {label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-2 px-2.5 py-1 rounded-full border backdrop-blur-md text-[11px] font-medium transition-all hover:scale-102 active:scale-98 ${glowColor}`}
      title={`MJ: ${label}`}
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span className="font-semibold text-white/90">MJ</span>
      <span className="text-slate-400">•</span>
      <span className="truncate max-w-[160px]">{label}</span>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
    </button>
  );
};
