import React from 'react';
import { FileText, CheckCircle, AlertTriangle, Scale } from 'lucide-react';

export const TermsScreen: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-4 pb-8 text-slate-100 animate-fadeIn">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121623] to-[#0c0f18] border border-[#232c45]">
        <div className="flex items-center gap-2 mb-1">
          <Scale className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Terms of Service</h2>
        </div>
        <p className="text-xs text-slate-400">
          Rules and stipulations governing use of Dark Skull Corporation software, subscriptions, and tools.
        </p>
      </div>

      {/* Terms list */}
      <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
        <div className="p-3.5 rounded-xl bg-[#131724] border border-[#21283d] flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-white font-bold">
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            <span>1. License Agreement</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Each license key granted upon verified payment authorizes single or multi-instance execution depending strictly upon the purchased tier (Bronze, Silver, Gold, or Platinum). Subscriptions may not be transferred, sub-licensed, or shared across unauthorized parties.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131724] border border-[#21283d] flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-white font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>2. Fair Use & Free Panel Restrictions</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Public Free Panel accounts are shared community resources. Attempting to modify passwords, reverse engineer API communications, or monopolize slot allocations will result in automated IP & HWID network bans.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131724] border border-[#21283d] flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-white font-bold">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>3. Service Availability</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            While Dark Skull Corporation aims for uninterrupted uptime, scheduled maintenance or security patch deployments may temporarily occur. The cluster status is visibly broadcasted in real time.
          </p>
        </div>
      </div>
    </div>
  );
};
