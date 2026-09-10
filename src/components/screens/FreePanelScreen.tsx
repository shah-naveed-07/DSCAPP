import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Users,
  Copy,
  Check,
  Download,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { FreePanelInfo } from '../../types';
import { fetchFreePanel, subscribeAppConfig } from '../../services/api';

export const FreePanelScreen: React.FC = () => {
  const [panelInfo, setPanelInfo] = useState<FreePanelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<'user' | 'pass' | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await fetchFreePanel();
    setPanelInfo(res.data);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const res = await fetchFreePanel();
    setPanelInfo(res.data);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeAppConfig((cfg) => {
      setPanelInfo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          downloadUrl: cfg.freeLink || prev.downloadUrl,
        };
      });
    });
    return () => unsubscribe();
  }, []);

  const handleCopy = (text: string, field: 'user' | 'pass') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-8 text-slate-100 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#12192b] via-[#101422] to-[#0c0f18] border border-cyan-500/30 p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Public Free Panel</h2>
              <p className="text-xs text-cyan-400/90 font-mono">DSC Community Shared Access</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-cyan-400 active:scale-95 transition-all"
            title="Refresh Slot Status"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
          Dark Skull Corporation provides complimentary community access slots to test our panel capabilities. Slots rotate periodically.
        </p>
      </div>

      {loading ? (
        <div className="p-8 rounded-xl bg-[#121623] border border-[#21283d] flex flex-col items-center justify-center text-center gap-2 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-xs">Querying /api/public/free-panel status...</span>
        </div>
      ) : panelInfo ? (
        <>
          {/* Slots & Progress Card */}
          <div className="p-4 rounded-xl bg-[#121623] border border-[#21283d]">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Available User Slots</span>
              </div>
              <span className="font-mono text-cyan-400 font-bold">
                {panelInfo.remainingSlots} / {panelInfo.totalSlots} Slots Open
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-[#181e30] overflow-hidden p-0.5 border border-[#26314c]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      5,
                      ((panelInfo.totalSlots - panelInfo.remainingSlots) / panelInfo.totalSlots) * 100
                    )
                  )}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Auto-refreshed from DSCAuth</span>
              </span>
              <span
                className={`font-semibold ${
                  panelInfo.available ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {panelInfo.available ? '● ACCEPTING LOGINS' : '● SLOTS FULL'}
              </span>
            </div>
          </div>

          {/* Credentials Card */}
          <div className="p-4 rounded-xl bg-[#121623] border border-[#21283d] flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Free Access Credentials
            </h3>

            {/* Username */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-400">Username:</span>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#181d2c] border border-[#262f47]">
                <span className="text-xs font-mono font-semibold text-cyan-300">
                  {panelInfo.username || 'dsc_free_user'}
                </span>
                <button
                  onClick={() => handleCopy(panelInfo.username || 'dsc_free_user', 'user')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400"
                >
                  {copiedField === 'user' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedField === 'user' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-400">Password:</span>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#181d2c] border border-[#262f47]">
                <span className="text-xs font-mono font-semibold text-cyan-300">
                  {panelInfo.password || 'DSC_FreePass_2026'}
                </span>
                <button
                  onClick={() => handleCopy(panelInfo.password || 'DSC_FreePass_2026', 'pass')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400"
                >
                  {copiedField === 'pass' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedField === 'pass' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Download Panel Companion Action */}
            {panelInfo.downloadUrl && panelInfo.downloadUrl.trim() !== '' ? (
              <a
                href={panelInfo.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-cyan-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Download Free Panel APK / Companion</span>
              </a>
            ) : (
              <button
                disabled
                className="w-full py-2.5 mt-1 rounded-xl bg-slate-800 text-slate-400 font-medium text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-700/60"
                title="Free panel download link has not been configured by owner"
              >
                <AlertCircle className="w-4 h-4 text-amber-400/80" />
                <span>Download Unavailable (Link Not Configured)</span>
              </button>
            )}
          </div>

          {/* Usage Policies Card */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-amber-300">Fair Use Policy:</span> Free accounts are
              strictly forbidden from changing passwords (enforced server-side). If password change
              is attempted, the account is automatically flagged and reset by the backend guard.
            </div>
          </div>
        </>
      ) : (
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Unable to reach Free Panel backend. Please check connection.</span>
        </div>
      )}
    </div>
  );
};
