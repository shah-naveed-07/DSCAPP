import React from 'react';
import { ShieldCheck, Lock, EyeOff, Server, HardDrive } from 'lucide-react';

export const PrivacyScreen: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-4 pb-8 text-slate-100 animate-fadeIn">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121623] to-[#0c0f18] border border-[#232c45]">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Privacy Architecture</h2>
        </div>
        <p className="text-xs text-slate-400">
          Dark Skull Corporation enforces a zero-compromise, minimal-data footprint policy across all client apps.
        </p>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
        <div className="p-3.5 rounded-xl bg-[#131724] border border-[#21283d] flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-white font-bold">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>1. Hardware Storage Security</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Session tokens and private access credentials are never stored in plaintext SharedPreferences. The native Android application utilizes `EncryptedSharedPreferences` backed by hardware-isolated Android Keystore AES256 encryption.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131724] border border-[#21283d] flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-white font-bold">
            <EyeOff className="w-4 h-4 text-purple-400" />
            <span>2. Zero Advertising & Tracking</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Our native Android applications contain zero third-party advertising SDKs, ad-trackers, social graph beacons, or telemetry surveillance modules.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131724] border border-[#21283d] flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-white font-bold">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>3. Hardware ID (HWID) Usage</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Device identifiers are hashed and solely utilized for licensing verification and anti-account-sharing controls on the DSCAuth cluster. No personal device contact lists, SMS, photos, or location telemetry are queried or collected.
          </p>
        </div>
      </div>
    </div>
  );
};
