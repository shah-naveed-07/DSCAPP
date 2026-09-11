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
  Terminal,
} from 'lucide-react';
import { FreePanelInfo } from '../../types';
import { fetchFreePanel, API_BASE_URL } from '../../services/api';

export const FreePanelScreen: React.FC = () => {
  const [panelInfo, setPanelInfo] = useState<FreePanelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    url?: string;
    method?: string;
    status?: number;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<'user' | 'pass' | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    const res = await fetchFreePanel();
    if (res.data) {
      setPanelInfo(res.data);
      setErrorMessage(null);
      setErrorDetails(null);
    } else {
      setPanelInfo(null);
      setErrorMessage(res.error || 'Free Panel temporarily unavailable.');
      setErrorDetails({
        url: res.url || `${API_BASE_URL}/api/public/free-panel`,
        method: res.method || 'GET',
        status: res.status,
      });
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const res = await fetchFreePanel();
    if (res.data) {
      setPanelInfo(res.data);
      setErrorMessage(null);
      setErrorDetails(null);
    } else {
      setPanelInfo(null);
      setErrorMessage(res.error || 'Free Panel temporarily unavailable.');
      setErrorDetails({
        url: res.url || `${API_BASE_URL}/api/public/free-panel`,
        method: res.method || 'GET',
        status: res.status,
      });
    }
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (text: string, field: 'user' | 'pass') => {
    if (!text) return;
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
            disabled={refreshing || loading}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-cyan-400 active:scale-95 transition-all disabled:opacity-50"
            title="Refresh Real Backend Slot Status"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
          Complimentary shared community access directly synchronized with the real DSCAuth backend database.
        </p>
      </div>

      {loading ? (
        <div className="p-8 rounded-xl bg-[#121623] border border-[#21283d] flex flex-col items-center justify-center text-center gap-3 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-xs font-mono">GET /api/public/free-panel query in progress...</span>
        </div>
      ) : panelInfo ? (
        <>
          {/* Slots Status Card */}
          <div className="p-4 rounded-xl bg-[#121623] border border-[#21283d] flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Slot Allocation</span>
              </div>
              <span className="font-mono text-cyan-400 font-bold">
                {panelInfo.usedSlots} / {panelInfo.maxSlots} Slots In Use
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-[#181e30] overflow-hidden p-0.5 border border-[#26314c]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  panelInfo.slotsFull
                    ? 'bg-gradient-to-r from-amber-500 to-red-500'
                    : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(panelInfo.usedSlots > 0 ? 5 : 0, panelInfo.progress))}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-mono text-[10px]">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Live backend sync</span>
              </span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[10px] tracking-wide font-mono ${
                  panelInfo.slotsFull
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {panelInfo.slotsFull
                  ? 'SLOTS FULL'
                  : `ACCEPTING LOGINS (${panelInfo.remainingSlots} OPEN)`}
              </span>
            </div>

            {/* Existing user note if slots are full */}
            {panelInfo.slotsFull && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>No Slot is Available. Existing users can still download.</span>
              </div>
            )}
          </div>

          {/* Real Credentials Card */}
          <div className="p-4 rounded-xl bg-[#121623] border border-[#21283d] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                FREE ACCESS CREDENTIALS
              </h3>
              <span className="text-[10px] font-mono text-cyan-400/70">DSCAuth Server Verified</span>
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-400">Username:</span>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#181d2c] border border-[#262f47]">
                <span className="text-xs font-mono font-semibold text-cyan-300 select-all">
                  {panelInfo.freeUser || '(No active free user configured)'}
                </span>
                {panelInfo.freeUser && (
                  <button
                    onClick={() => handleCopy(panelInfo.freeUser, 'user')}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 active:scale-95 transition-colors"
                  >
                    {copiedField === 'user' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedField === 'user' ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-400">Password:</span>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#181d2c] border border-[#262f47]">
                <span className="text-xs font-mono font-semibold text-cyan-300 select-all">
                  {panelInfo.freePass || '(No password required)'}
                </span>
                {panelInfo.freePass && (
                  <button
                    onClick={() => handleCopy(panelInfo.freePass, 'pass')}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 active:scale-95 transition-colors"
                  >
                    {copiedField === 'pass' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedField === 'pass' ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Download Panel Companion Action */}
            {panelInfo.freeLink && panelInfo.freeLink.trim() !== '' ? (
              <a
                href={panelInfo.freeLink}
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
                title="Free panel download link is not configured in backend SystemSettings"
              >
                <AlertCircle className="w-4 h-4 text-amber-400/80" />
                <span>Download currently unavailable.</span>
              </button>
            )}
          </div>

          {/* Fair Use Policy */}
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
        /* Error state: No fake credentials, clean retry and technical diagnostics */
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-slate-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-red-300">Free Panel temporarily unavailable.</h3>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                {errorMessage || 'Unable to retrieve public free panel state from DSCAuth backend.'}
              </p>
            </div>
          </div>

          {errorDetails && (
            <div className="p-3 rounded-lg bg-[#0e121d] border border-slate-800 font-mono text-[10px] text-slate-400 flex flex-col gap-1">
              <div className="flex items-center gap-1 text-slate-300 font-bold mb-0.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Technical Request Diagnostics</span>
              </div>
              <div><span className="text-slate-500">Method:</span> {errorDetails.method || 'GET'}</div>
              <div><span className="text-slate-500">Endpoint:</span> {errorDetails.url}</div>
              <div><span className="text-slate-500">HTTP Status:</span> {errorDetails.status ?? '0 (Network Error / Timeout)'}</div>
            </div>
          )}

          <button
            onClick={loadData}
            className="w-full py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all mt-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}
    </div>
  );
};
