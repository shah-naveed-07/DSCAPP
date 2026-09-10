import React, { useEffect, useState } from 'react';
import {
  Crown,
  Key,
  Users,
  Settings,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  Power,
  Sliders,
  CheckCircle2,
  Shield,
  ArrowLeft,
  Smartphone,
  Save,
} from 'lucide-react';
import { AdminAccount, AdminKey, PanelUpdate, ScreenDestination, SystemSettings, UserSession } from '../../types';
import {
  ownerGetKeys,
  ownerCreateKey,
  ownerDeleteKey,
  ownerGetAdmins,
  ownerDeleteAdmin,
  ownerGetSettings,
  ownerUpdateSettings,
  ownerToggleMaintenance,
  ownerGetPanelUpdates,
} from '../../services/api';

interface Props {
  session: UserSession;
  onNavigate: (screen: ScreenDestination) => void;
}

export const OwnerCenterScreen: React.FC<Props> = ({ session, onNavigate }) => {
  const [activeSection, setActiveSection] = useState<'keys' | 'admins' | 'settings' | 'updates'>(
    'keys'
  );
  const [keys, setKeys] = useState<AdminKey[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [updates, setUpdates] = useState<PanelUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<AdminKey | null>(null);
  const [adminToDelete, setAdminToDelete] = useState<AdminAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New Key state
  const [newKeyPlan, setNewKeyPlan] = useState('Platinum Elite');
  const [newKeyDuration, setNewKeyDuration] = useState(30);

  const loadAll = async () => {
    setLoading(true);
    const [keysRes, adminsRes, settingsRes, updatesRes] = await Promise.all([
      ownerGetKeys(session.token),
      ownerGetAdmins(session.token),
      ownerGetSettings(session.token),
      ownerGetPanelUpdates(session.token),
    ]);
    setKeys(keysRes.keys);
    setAdmins(adminsRes.admins);
    setSettings(settingsRes.settings);
    setUpdates(updatesRes.updates);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [session.token]);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await ownerCreateKey(session.token, {
      plan: newKeyPlan,
      durationDays: Number(newKeyDuration),
    });
    setStatusMessage(res.message);
    if (res.success) {
      loadAll();
    }
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleConfirmDeleteKey = async () => {
    if (!keyToDelete) return;
    setIsDeleting(true);
    const res = await ownerDeleteKey(session.token, keyToDelete.id);
    setIsDeleting(false);
    setKeyToDelete(null);
    setStatusMessage(res.message);
    setKeys((prev) => prev.filter((k) => k.id !== keyToDelete.id));
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleConfirmDeleteAdmin = async () => {
    if (!adminToDelete) return;
    setIsDeleting(true);
    const res = await ownerDeleteAdmin(session.token, adminToDelete.id);
    setIsDeleting(false);
    setAdminToDelete(null);
    setStatusMessage(res.message);
    setAdmins((prev) => prev.filter((a) => a.id !== adminToDelete.id));
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleToggleMaintenance = async () => {
    const res = await ownerToggleMaintenance(session.token);
    setStatusMessage(res.message);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-8 text-slate-100 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#261b0c] via-[#1a1410] to-[#0d0f18] border border-amber-500/50 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Owner Control Center</h2>
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold rounded">
                  MAX PRIVILEGE
                </span>
              </div>
              <p className="text-xs text-amber-300/80 font-mono">
                Direct Master Database CRUD Gateway
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('admin_dashboard')}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-300 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Section Switcher Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0e111a] border border-[#22283a]">
        {[
          { id: 'keys' as const, label: `Keys (${keys.length})`, icon: Key },
          { id: 'admins' as const, label: `Admins (${admins.length})`, icon: Users },
          { id: 'settings' as const, label: 'Settings', icon: Settings },
          { id: 'updates' as const, label: 'Updates', icon: Smartphone },
        ].map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex-1 py-1.5 px-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section 1: Keys */}
      {activeSection === 'keys' && (
        <div className="flex flex-col gap-3.5 animate-fadeIn">
          {/* Key Generator Form */}
          <div className="p-4 rounded-xl bg-[#131724] border border-[#232a40] flex flex-col gap-2.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Generate License Key</span>
            </span>

            <form onSubmit={handleGenerateKey} className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newKeyPlan}
                  onChange={(e) => setNewKeyPlan(e.target.value)}
                  className="px-2.5 py-2 rounded-lg bg-[#181d2c] border border-[#27324c] text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Bronze Suite">Bronze Suite</option>
                  <option value="Silver Pro">Silver Pro</option>
                  <option value="Gold VIP">Gold VIP</option>
                  <option value="Platinum Elite">Platinum Elite</option>
                </select>

                <select
                  value={newKeyDuration}
                  onChange={(e) => setNewKeyDuration(Number(e.target.value))}
                  className="px-2.5 py-2 rounded-lg bg-[#181d2c] border border-[#27324c] text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={365}>1 Year</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all"
              >
                Generate & Save to DB
              </button>
            </form>
          </div>

          {/* Keys List */}
          <div className="flex flex-col gap-2">
            {keys.map((k) => (
              <div
                key={k.id}
                className="p-3 rounded-xl bg-[#131724] border border-[#232a40] flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="font-mono text-xs font-bold text-amber-300">{k.key}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{k.plan}</span>
                    <span>•</span>
                    <span>{k.durationDays} Days</span>
                    <span>•</span>
                    <span
                      className={`font-semibold ${
                        k.status === 'unused' ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {k.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setKeyToDelete(k)}
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10"
                  title="Revoke Key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Admins */}
      {activeSection === 'admins' && (
        <div className="flex flex-col gap-2.5 animate-fadeIn">
          {admins.map((adm) => (
            <div
              key={adm.id}
              className="p-3.5 rounded-xl bg-[#131724] border border-[#232a40] flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  {adm.username[0]?.toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{adm.username}</h4>
                  <span className="text-[10px] text-slate-400">Created {adm.createdAt}</span>
                </div>
              </div>

              {adm.isOwner ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  MASTER OWNER
                </span>
              ) : (
                <button
                  onClick={() => setAdminToDelete(adm)}
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Section 3: Settings & Maintenance */}
      {activeSection === 'settings' && (
        <div className="flex flex-col gap-3 animate-fadeIn">
          {/* Maintenance Mode Toggle */}
          <div className="p-4 rounded-xl bg-[#131724] border border-[#232a40] flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Power className="w-4 h-4 text-red-400" />
                <span>Global Maintenance Mode</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Restricts public app & web traffic. Only admins can authenticate.
              </p>
            </div>
            <button
              onClick={handleToggleMaintenance}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 text-xs font-bold transition-all"
            >
              Toggle State
            </button>
          </div>

          {/* Settings info */}
          <div className="p-4 rounded-xl bg-[#131724] border border-[#232a40] flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-white">System Configuration</h4>
            <div className="text-xs text-slate-300 flex flex-col gap-1">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">User Registrations:</span>
                <span className="text-emerald-400 font-semibold">Enabled</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Free Panel Rotation:</span>
                <span className="text-cyan-400 font-semibold">Active</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Default Key Duration:</span>
                <span className="font-mono text-slate-200">30 Days</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Panel Updates */}
      {activeSection === 'updates' && (
        <div className="flex flex-col gap-2.5 animate-fadeIn">
          {updates.map((up, i) => (
            <div key={i} className="p-3 rounded-xl bg-[#131724] border border-[#232a40] flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">{up.version}</span>
                <span className="text-[10px] text-slate-400">{up.releaseDate}</span>
              </div>
              <p className="text-xs text-slate-300">{up.releaseNotes}</p>
              <span className="text-[10px] font-mono text-cyan-400 truncate">{up.downloadUrl}</span>
            </div>
          ))}
        </div>
      )}
      {/* Key Delete Modal */}
      {keyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#121623] border border-red-500/40 p-5 shadow-2xl text-slate-100 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white">Revoke License Key</h3>
            <p className="text-xs text-slate-400">Permanently delete license key <span className="font-mono text-amber-300">{keyToDelete.key}</span> from the database?</p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setKeyToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-[#1e2538] text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteKey}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Delete Modal */}
      {adminToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#121623] border border-red-500/40 p-5 shadow-2xl text-slate-100 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white">Revoke Admin Account</h3>
            <p className="text-xs text-slate-400">Permanently revoke admin privileges and delete account <span className="font-bold text-white">{adminToDelete.username}</span>?</p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdminToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-[#1e2538] text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAdmin}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
