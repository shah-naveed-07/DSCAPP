import React from 'react';
import { Shield, Target, Cpu, Lock, CheckCircle2 } from 'lucide-react';

export const AboutScreen: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-4 pb-8 text-slate-100 animate-fadeIn">
      {/* Brand Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#131929] to-[#0c0f18] border border-[#232c45]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Dark Skull Corporation</h2>
            <p className="text-xs text-cyan-400 font-mono">Advanced Software & Security Infrastructure</p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mt-2">
          Established to deliver high-performance, robust cybersecurity instrumentation, rapid mobile tools, and autonomous panel systems.
        </p>
      </div>

      {/* Core Principles */}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Our Foundation
        </h3>

        <div className="p-3.5 rounded-xl bg-[#131724] border border-[#21283d] flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Hardware Encrypted Tokens</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Every Android client leverages the system Keystore hardware security module (MasterKey with AES256-GCM) ensuring persistent user & admin credentials remain inaccessible to third-party processes.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131724] border border-[#21283d] flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Native Jetpack Compose</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Zero heavy WebViews. Direct 120fps reactive UI architecture with strict MVVM patterns, Retrofit2 interceptors, and background Coroutine network threads.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131724] border border-[#21283d] flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Authoritative Central Backend</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              The client operates as a true client to DSCAuth (onrender.com), preserving exact role boundaries, server-side JWT verification, and zero client-side bypasses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
