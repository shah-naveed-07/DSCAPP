import React from 'react';
import { Home, LayoutGrid, ShoppingBag, DownloadCloud, Sparkles, UserCheck } from 'lucide-react';
import { ScreenDestination, UserSession } from '../types';

interface Props {
  currentScreen: ScreenDestination;
  onNavigate: (screen: ScreenDestination) => void;
  session: UserSession | null;
}

export const MaterialNavigationBar: React.FC<Props> = ({
  currentScreen,
  onNavigate,
  session,
}) => {
  const navItems = [
    { id: 'home' as ScreenDestination, label: 'Home', icon: Home },
    { id: 'apps' as ScreenDestination, label: 'Apps', icon: LayoutGrid },
    { id: 'products' as ScreenDestination, label: 'Plans', icon: ShoppingBag },
    { id: 'freepanel' as ScreenDestination, label: 'Free', icon: Sparkles, badge: 'Live' },
    { id: 'downloads' as ScreenDestination, label: 'Files', icon: DownloadCloud },
    {
      id: (session
        ? session.role === 'Admin'
          ? 'admin_dashboard'
          : 'user_dashboard'
        : 'user_login') as ScreenDestination,
      label: session ? (session.role === 'Admin' ? 'Admin' : 'Portal') : 'Sign In',
      icon: UserCheck,
    },
  ];

  return (
    <nav className="sticky bottom-0 z-30 flex items-center justify-around px-2 py-1.5 bg-[#0e111a]/95 backdrop-blur-md border-t border-[#22283a] text-slate-400">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          currentScreen === item.id ||
          (item.id === 'user_dashboard' && currentScreen === 'user_dashboard') ||
          (item.id === 'admin_dashboard' &&
            (currentScreen === 'admin_dashboard' || currentScreen === 'owner_center'));

        return (
          <button
            key={item.label}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative ${
              isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`relative px-3 py-1 rounded-full transition-all duration-200 ${
                isActive ? 'bg-cyan-500/15 shadow-sm shadow-cyan-500/10' : ''
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              {item.badge && (
                <span className="absolute -top-1 -right-1 text-[9px] px-1 py-0.2 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold rounded-full">
                  {item.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] font-medium tracking-tight mt-0.5 ${
                isActive ? 'font-semibold text-cyan-400' : 'text-slate-400'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
