import React, { useEffect, useState } from 'react';
import {
  Shield,
  Sparkles,
  Zap,
  ShoppingBag,
  DownloadCloud,
  LayoutGrid,
  ChevronRight,
  Server,
  Lock,
  Globe,
  Radio,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { ScreenDestination, SystemStatus } from '../../types';
import { fetchSystemStatus, API_BASE_URL } from '../../services/api';

interface Props {
  onNavigate: (screen: ScreenDestination) => void;
}

export const HomeScreen: React.FC<Props> = ({ onNavigate }) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    fetchSystemStatus().then((status) => setSystemStatus(status));
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 pb-8 text-slate-100 animate-fadeIn">
      {/* Brand Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121624] via-[#101420] to-[#0c0f17] border border-[#23293f] p-4.5 shadow-xl shadow-cyan-950/20">
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-md shadow-cyan-500/30">
              <Shield className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold tracking-tight text-white">Dark Skull Corporation</h2>
              </div>
              <p className="text-xs text-cyan-400 font-mono">DSCWeb Official Native Android Client</p>
            </div>
          </div>

          {/* Backend Status Chip */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ONLINE</span>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-300 leading-relaxed">
          High-performance security tools, privileged panel access, enterprise subscription management,
          and published Android solutions backed by end-to-end Keystore encryption.
        </p>

        <div className="mt-3.5 pt-3 border-t border-[#232a42] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate max-w-[170px]">{API_BASE_URL.replace('https://', '')}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>v{systemStatus?.version || '2.4.1'}</span>
          </div>
        </div>
      </div>

      {/* Free Panel Highlight Banner */}
      <div
        onClick={() => onNavigate('freepanel')}
        className="cursor-pointer group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-950/70 via-[#131b2e] to-blue-950/70 border border-cyan-500/30 p-3.5 hover:border-cyan-400/60 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Free Access Panel</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500 text-slate-950 font-bold rounded">
                  OPEN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Check active user slots, free credentials & direct tool download.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Quick Navigation Bento Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div
          onClick={() => onNavigate('products')}
          className="cursor-pointer group flex flex-col justify-between p-3.5 rounded-xl bg-[#141825] border border-[#232a40] hover:border-cyan-500/40 hover:bg-[#181d2e] active:scale-[0.98] transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">VIP Products</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Bronze, Silver & Gold toolsets</p>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-purple-300 font-medium">
            <span>Explore Plans</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('apps')}
          className="cursor-pointer group flex flex-col justify-between p-3.5 rounded-xl bg-[#141825] border border-[#232a40] hover:border-cyan-500/40 hover:bg-[#181d2e] active:scale-[0.98] transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">Published Apps</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">QR Scanner, MindMatrix</p>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-blue-300 font-medium">
            <span>Google Play</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('downloads')}
          className="cursor-pointer group flex flex-col justify-between p-3.5 rounded-xl bg-[#141825] border border-[#232a40] hover:border-cyan-500/40 hover:bg-[#181d2e] active:scale-[0.98] transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
            <DownloadCloud className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">Downloads</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">APKs, Panel builds, Tools</p>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-300 font-medium">
            <span>Get Builds</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('admin_login')}
          className="cursor-pointer group flex flex-col justify-between p-3.5 rounded-xl bg-[#141825] border border-[#232a40] hover:border-purple-500/40 hover:bg-[#181d2e] active:scale-[0.98] transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">Admin Gateway</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Management & Owner portal</p>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-amber-300 font-medium">
            <span>Admin Auth</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Security Pillars */}
      <div className="rounded-xl bg-[#111520] border border-[#202738] p-3.5">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Zap className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Enterprise Architecture
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-[#161a28] border border-[#252c40]">
            <Lock className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <p className="text-[10px] font-semibold text-slate-200">Keystore Encrypted</p>
            <p className="text-[9px] text-slate-500 mt-0.5">Hardware-level tokens</p>
          </div>
          <div className="p-2 rounded-lg bg-[#161a28] border border-[#252c40]">
            <Radio className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-[10px] font-semibold text-slate-200">Real Backend</p>
            <p className="text-[9px] text-slate-500 mt-0.5">DSCAuth connected</p>
          </div>
          <div className="p-2 rounded-lg bg-[#161a28] border border-[#252c40]">
            <Globe className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-[10px] font-semibold text-slate-200">99.98% Uptime</p>
            <p className="text-[9px] text-slate-500 mt-0.5">Continuous clusters</p>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2">
        <button onClick={() => onNavigate('about')} className="hover:text-slate-300 transition-colors">
          About
        </button>
        <span>•</span>
        <button onClick={() => onNavigate('contact')} className="hover:text-slate-300 transition-colors">
          Contact
        </button>
        <span>•</span>
        <button onClick={() => onNavigate('privacy')} className="hover:text-slate-300 transition-colors">
          Privacy
        </button>
        <span>•</span>
        <button onClick={() => onNavigate('terms')} className="hover:text-slate-300 transition-colors">
          Terms
        </button>
      </div>
    </div>
  );
};
