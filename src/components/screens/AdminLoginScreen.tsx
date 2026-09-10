import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { ScreenDestination, UserSession } from '../../types';
import { AuthManager } from '../../services/authManager';

interface Props {
  onLoginSuccess: (session: UserSession) => void;
  onNavigate: (screen: ScreenDestination) => void;
}

export const AdminLoginScreen: React.FC<Props> = ({ onLoginSuccess, onNavigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please provide administrative credentials.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { session, error } = await AuthManager.loginAdmin(username.trim(), password);
    setIsLoading(false);

    if (session) {
      onLoginSuccess(session);
    } else {
      setErrorMessage(error || 'Admin login rejected. Unauthorized credentials.');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-8 text-slate-100 animate-fadeIn">
      {/* Header */}
      <div className="text-center py-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30 mb-2.5">
          <Lock className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </div>
        <h2 className="text-base font-bold text-white">Administrator Gateway</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Restricted access for Dark Skull Corporation systems operators and owners
        </p>
      </div>

      {/* Security Warning Notice */}
      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-2.5 text-xs text-purple-200">
        <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <span className="text-[11px] leading-relaxed">
          Authorized personnel only. All access attempts are recorded and monitored on the DSCAuth cluster.
        </span>
      </div>

      {/* Login Card */}
      <div className="p-4.5 rounded-2xl bg-[#121623] border border-[#26213d] shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Username */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Identifier</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter administrative username"
              required
              autoCapitalize="none"
              className="w-full px-3 py-2 rounded-xl bg-[#171a2b] border border-[#2b2548] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Passphrase</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter passphrase"
                required
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-[#171a2b] border border-[#2b2548] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authorizing with DSC Gateway...</span>
              </>
            ) : (
              <span>Verify & Access Admin Console</span>
            )}
          </button>
        </form>
      </div>

      {/* Switch to User Login */}
      <div className="text-center">
        <button
          onClick={() => onNavigate('user_login')}
          className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          Not an administrator? <span className="text-cyan-400 underline font-semibold">User Login</span>
        </button>
      </div>
    </div>
  );
};
