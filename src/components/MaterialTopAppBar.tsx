import React from 'react';
import { ArrowLeft, Shield, User, LogOut, Terminal, Download, Layers, Bot, Sparkles } from 'lucide-react';
import { ScreenDestination, UserSession } from '../types';

interface Props {
  currentScreen: ScreenDestination;
  onNavigate: (screen: ScreenDestination) => void;
  session: UserSession | null;
  onLogout: () => void;
  onBack?: () => void;
  onOpenCode?: () => void;
  onOpenAssistant: () => void;
  onOpenInspector?: () => void;
  onOpenExport?: () => void;
  isDeviceMode?: boolean;
  onToggleDeviceMode?: () => void;
}

export const MaterialTopAppBar: React.FC<Props> = ({
  currentScreen,
  onNavigate,
  session,
  onLogout,
  onBack,
  onOpenCode,
  onOpenAssistant,
  onOpenInspector,
  onOpenExport,
  isDeviceMode,
  onToggleDeviceMode,
}) => {
  const isRootScreen = currentScreen === 'home';

  const getTitle = () => {
    switch (currentScreen) {
      case 'home':
        return 'DSCWeb';
      case 'apps':
        return 'Published Apps';
      case 'products':
        return 'Products & Plans';
      case 'downloads':
        return 'Download Center';
      case 'about':
        return 'About Corporation';
      case 'contact':
        return 'Support & Contact';
      case 'privacy':
        return 'Privacy Policy';
      case 'terms':
        return 'Terms of Service';
      case 'freepanel':
        return 'Free Access Panel';
      case 'user_login':
        return 'User Authentication';
      case 'admin_login':
        return 'Admin Gateway';
      case 'user_dashboard':
        return 'User Dashboard';
      case 'admin_dashboard':
        return 'Admin Dashboard';
      case 'owner_center':
        return 'Owner Database';
      default:
        return 'DSCWeb';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-[#0e111a]/95 backdrop-blur-md border-b border-[#22283a] text-slate-100">
      <div className="flex items-center gap-2">
        {!isRootScreen ? (
          <button
            onClick={onBack || (() => onNavigate('home'))}
            className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/60 active:scale-95 transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm shadow-cyan-500/20">
            <Shield className="w-4 h-4 text-slate-950 font-bold" />
          </div>
        )}

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-semibold tracking-wide text-slate-100">{getTitle()}</h1>
            {session && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                  session.isOwner
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : session.role === 'Admin'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {session.isOwner ? 'OWNER' : session.role.toUpperCase()}
              </span>
            )}
          </div>
          {isRootScreen && (
            <span className="text-[10px] text-cyan-400/80 font-medium -mt-0.5">
              Dark Skull Corporation
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* AI Voice Assistant Trigger */}
        <button
          onClick={onOpenAssistant}
          title="Open AI Voice Assistant"
          className="p-1.5 text-cyan-400 hover:text-cyan-300 rounded-lg hover:bg-cyan-500/15 transition-colors relative"
        >
          <Bot className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        </button>

        {/* Network Logcat Toggle */}
        {onOpenInspector && (
          <button
            onClick={onOpenInspector}
            title="Network Traffic Inspector"
            className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <Terminal className="w-4 h-4" />
          </button>
        )}

        {/* Export Android Studio Project */}
        {(onOpenExport || onOpenCode) && (
          <button
            onClick={onOpenExport || onOpenCode}
            title="Export Android Studio Kotlin Project"
            className="p-1.5 text-slate-400 hover:text-purple-400 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* View Toggle (Device Frame vs Immersive) */}
        <button
          onClick={onToggleDeviceMode}
          title={isDeviceMode ? 'Switch to Full Mobile Screen' : 'Switch to Android Device Frame'}
          className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60 transition-colors hidden sm:inline-flex"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Auth / Account Profile */}
        {session ? (
          <div className="flex items-center gap-1 pl-1">
            <button
              onClick={() =>
                onNavigate(session.role === 'Admin' ? 'admin_dashboard' : 'user_dashboard')
              }
              className="flex items-center gap-1.5 py-1 px-2 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-200 hover:border-cyan-500/50 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span className="max-w-[80px] truncate">{session.username}</span>
            </button>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('user_login')}
            className="py-1 px-2.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 text-xs font-medium hover:bg-cyan-500/25 active:scale-95 transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
