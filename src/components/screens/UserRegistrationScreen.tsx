import React, { useState } from 'react';
import { UserPlus, Lock, User, Eye, EyeOff, Loader2, AlertCircle, KeyRound, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ScreenDestination, UserSession } from '../../types';
import { AuthManager } from '../../services/authManager';

interface Props {
  onRegisterSuccess: (session?: UserSession) => void;
  onNavigate: (screen: ScreenDestination) => void;
}

export const UserRegistrationScreen: React.FC<Props> = ({ onRegisterSuccess, onNavigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Local validation
    const trimmedUser = username.trim();
    const trimmedKey = licenseKey.trim();

    if (!trimmedUser || trimmedUser.length < 3) {
      setErrorMessage('Username must be at least 3 characters long.');
      return;
    }

    if (!password || password.length < 3) {
      setErrorMessage('Password must be at least 3 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    if (!trimmedKey) {
      setErrorMessage('License key is required. Please provide a valid DSC license key.');
      return;
    }

    setIsLoading(true);

    try {
      // Real DSCAuth registration API call via centralized AuthManager
      const result = await AuthManager.registerUser(trimmedUser, password, trimmedKey);
      setIsLoading(false);

      if (result.success) {
        setSuccessMessage(result.message || 'Account successfully registered!');
        if (result.session) {
          setTimeout(() => {
            onRegisterSuccess(result.session);
          }, 1000);
        } else {
          // Navigate to login after brief delay or user clicks
          setTimeout(() => {
            onNavigate('user_login');
          }, 1800);
        }
      } else {
        setErrorMessage(result.message || 'Registration failed. Please check your license key.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Network error during registration. Please verify connection.');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-8 text-slate-100 animate-fadeIn">
      {/* Header */}
      <div className="text-center py-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 mb-2.5">
          <UserPlus className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </div>
        <h2 className="text-base font-bold text-white">Create DSC Account</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Register your subscriber account using your subscription license key
        </p>
      </div>

      {/* Navigation Tabs between Login and Register */}
      <div className="grid grid-cols-2 p-1 rounded-xl bg-[#121623] border border-[#232c45]">
        <button
          type="button"
          onClick={() => onNavigate('user_login')}
          className="py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-slate-200 transition-all text-center"
        >
          Sign In
        </button>
        <button
          type="button"
          className="py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-slate-950 shadow-md transition-all text-center"
        >
          Create Account
        </button>
      </div>

      {/* Registration Card */}
      <div className="p-4.5 rounded-2xl bg-[#121623] border border-[#232c45] shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Username Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Username</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username (min 3 chars)"
              required
              minLength={3}
              autoCapitalize="none"
              className="w-full px-3 py-2 rounded-xl bg-[#171c2b] border border-[#27324c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create account password (min 3 chars)"
                required
                minLength={3}
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-[#171c2b] border border-[#27324c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Confirm Password</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              minLength={3}
              className="w-full px-3 py-2 rounded-xl bg-[#171c2b] border border-[#27324c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* License Key Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>License Key</span>
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="DSC-PLAT-XXXX-XXXX-XXXX"
              required
              autoCapitalize="characters"
              className="w-full px-3 py-2 rounded-xl bg-[#171c2b] border border-[#27324c] text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Received from your subscription order or authorized reseller.</span>
            </span>
          </div>

          {/* Success Message Banner */}
          {successMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

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
            className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering on DSCAuth...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Switch to Sign In */}
        <div className="mt-4 pt-3.5 border-t border-[#1e2538] text-center">
          <button
            type="button"
            onClick={() => onNavigate('user_login')}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            Already have an active account?{' '}
            <span className="text-emerald-400 underline font-semibold">Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
