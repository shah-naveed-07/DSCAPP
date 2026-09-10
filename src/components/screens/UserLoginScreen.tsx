import React, { useState } from 'react';
import { Shield, Lock, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { ScreenDestination, UserSession } from '../../types';
import { AuthManager } from '../../services/authManager';

interface Props {
  onLoginSuccess: (session: UserSession) => void;
  onNavigate: (screen: ScreenDestination) => void;
}

export const UserLoginScreen: React.FC<Props> = ({ onLoginSuccess, onNavigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please provide both username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { session, error } = await AuthManager.loginUser(username.trim(), password);
    setIsLoading(false);

    if (session) {
      onLoginSuccess(session);
    } else {
      setErrorMessage(error || 'Login failed. Please check credentials or network.');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-8 text-slate-100 animate-fadeIn">
      {/* Header */}
      <div className="text-center py-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/30 mb-2.5">
          <Shield className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </div>
        <h2 className="text-base font-bold text-white">Subscriber Portal</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Sign in to access your active subscription, license keys, and download center
        </p>
      </div>

      {/* Navigation Tabs between Login and Register */}
      <div className="grid grid-cols-2 p-1 rounded-xl bg-[#121623] border border-[#232c45]">
        <button
          type="button"
          className="py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 text-slate-950 shadow-md transition-all text-center"
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => onNavigate('user_register')}
          className="py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-slate-200 transition-all text-center"
        >
          Create Account
        </button>
      </div>

      {/* Login Card */}
      <div className="p-4.5 rounded-2xl bg-[#121623] border border-[#232c45] shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Username Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Username</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your DSC username"
              required
              autoCapitalize="none"
              className="w-full px-3 py-2 rounded-xl bg-[#171c2b] border border-[#27324c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter account password"
                required
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-[#171c2b] border border-[#27324c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
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

          {/* Error Message Alert */}
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
            className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in to DSCAuth...</span>
              </>
            ) : (
              <span>Sign In to Dashboard</span>
            )}
          </button>
        </form>

        {/* Register Account Link */}
        <div className="mt-4 pt-3.5 border-t border-[#1e2538] text-center">
          <button
            type="button"
            onClick={() => onNavigate('user_register')}
            className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            Don&apos;t have an account yet?{' '}
            <span className="text-cyan-400 underline font-semibold">Register with License Key</span>
          </button>
        </div>
      </div>

      {/* Switch to Admin Login */}
      <div className="text-center">
        <button
          onClick={() => onNavigate('admin_login')}
          className="text-xs text-slate-400 hover:text-purple-400 transition-colors"
        >
          Administrator or Owner? <span className="text-purple-400 underline font-semibold">Admin Gateway</span>
        </button>
      </div>
    </div>
  );
};
