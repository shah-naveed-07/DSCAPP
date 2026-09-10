import React from 'react';
import { Bot, Mic, Sparkles } from 'lucide-react';

interface Props {
  onClick: () => void;
  isListening?: boolean;
}

export const FloatingAssistantButton: React.FC<Props> = ({ onClick, isListening }) => {
  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
      <button
        onClick={onClick}
        className="group relative flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 text-white shadow-xl shadow-cyan-500/25 border border-cyan-400/40 hover:scale-105 active:scale-95 transition-all duration-300"
        title="Ask MJ"
      >
        {/* Glow backdrop pulse */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-80 transition duration-300 animate-pulse" />

        <div className="relative flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-950/40 flex items-center justify-center text-cyan-300">
            {isListening ? (
              <Mic className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            ) : (
              <Bot className="w-3.5 h-3.5 text-cyan-300" />
            )}
          </div>
          <span className="text-xs font-semibold tracking-wide text-slate-100">
            Ask MJ
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
        </div>
      </button>
    </div>
  );
};
