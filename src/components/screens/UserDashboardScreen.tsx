import React, { useEffect, useState } from 'react';
import {
  User,
  Shield,
  Key,
  Copy,
  Check,
  Download,
  Calendar,
  Lock,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { UserOrder, UserSession } from '../../types';
import { fetchUserOrder, userChangePassword } from '../../services/api';

interface Props {
  session: UserSession;
  onLogout: () => void;
}

export const UserDashboardScreen: React.FC<Props> = ({ session, onLogout }) => {
  const [order, setOrder] = useState<UserOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Change Password Dialog States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; message: string } | null>(
    null
  );

  const loadOrder = async () => {
    setLoading(true);
    const res = await fetchUserOrder(session.token);
    setOrder(res.data);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const res = await fetchUserOrder(session.token);
    setOrder(res.data);
    setRefreshing(false);
  };

  useEffect(() => {
    loadOrder();
  }, [session.token]);

  const handleCopyKey = () => {
    if (order?.key) {
      navigator.clipboard.writeText(order.key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: false, message: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
      return;
    }

    setIsChangingPass(true);
    setPasswordStatus(null);

    const res = await userChangePassword(session.token, currentPassword, newPassword);
    setIsChangingPass(false);
    setPasswordStatus(res);

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordModal(false), 2500);
    }
  };

  const isFreeUser = order?.plan.toLowerCase().includes('free');

  return (
    <div className="flex flex-col gap-4 p-4 pb-8 text-slate-100 animate-fadeIn">
      {/* User Header Profile Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121829] via-[#101422] to-[#0c0f18] border border-cyan-500/30 p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{session.username}</h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                  SUBSCRIBER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                HWID: ANDROID-SM-S928B-DSC
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-cyan-400 active:scale-95 transition-all"
            title="Refresh Order Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 rounded-xl bg-[#121623] border border-[#21283d] flex flex-col items-center justify-center text-center gap-2 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-xs">Querying /api/auth/my-order from backend...</span>
        </div>
      ) : order ? (
        <>
          {/* Subscription & Expiry Card */}
          <div className="p-4 rounded-2xl bg-[#121623] border border-[#21283d] shadow-md flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Active Subscription
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">{order.plan}</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
                {order.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e2538] text-xs">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#161a28] border border-[#232a40]">
                <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400">Expires:</span>
                  <span className="font-semibold text-slate-200">
                    {order.expiry.split('T')[0] || order.expiry}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#161a28] border border-[#232a40]">
                <Package className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400">Order Ref:</span>
                  <span className="font-semibold text-slate-200 font-mono truncate max-w-[90px]">
                    {order.orderId || 'ORD-9912'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* License Key Card */}
          <div className="p-4 rounded-2xl bg-[#121623] border border-[#21283d] shadow-md flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>Your Hardware License Key</span>
              </div>
              <button
                onClick={() => setShowKey(!showKey)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showKey ? 'Mask' : 'Reveal'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#0f121d] border border-[#21283d]">
              <span className="font-mono text-xs font-semibold text-cyan-300 tracking-wider">
                {showKey
                  ? order.key
                  : order.key.replace(/[A-Z0-9]/g, (c, i) => (i < 4 || i > 15 ? c : '•'))}
              </span>
              <button
                onClick={handleCopyKey}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 px-2 py-1 rounded bg-slate-800/80 transition-colors"
              >
                {copiedKey ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Bind this license key in your DSC panel to authorize full feature injection.
            </p>
          </div>

          {/* Action Row: Download Panel & Change Password */}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`https://dscauth.onrender.com/api/auth/download?plan=${encodeURIComponent(
                order.plan
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-cyan-500/20 text-center"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download Panel</span>
            </a>

            <button
              onClick={() => {
                if (isFreeUser) {
                  alert(
                    'Password change is disabled for Free Tier accounts by Dark Skull policy.'
                  );
                } else {
                  setShowPasswordModal(true);
                }
              }}
              className="py-3 px-3 rounded-xl bg-[#181d2c] border border-[#27324c] hover:border-cyan-500/40 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all text-center"
            >
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Change Password</span>
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full py-2.5 mt-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Session</span>
          </button>
        </>
      ) : (
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
          Failed to load user order.
        </div>
      )}

      {/* Change Password Dialog Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#121623] border border-[#262e45] p-5 shadow-2xl text-slate-100 flex flex-col gap-3.5 animate-slideUp">
            <div className="flex items-center justify-between pb-2 border-b border-[#20273c]">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white">Change Account Password</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#181d2c] border border-[#2b354f] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-300">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#181d2c] border border-[#2b354f] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#181d2c] border border-[#2b354f] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {passwordStatus && (
                <div
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                    passwordStatus.success
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border border-red-500/30 text-red-300'
                  }`}
                >
                  {passwordStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isChangingPass}
                className="w-full py-2.5 mt-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs disabled:opacity-50 transition-all"
              >
                {isChangingPass ? 'Updating with Server...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
