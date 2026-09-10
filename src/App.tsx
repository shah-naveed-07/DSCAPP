import React, { useState, useEffect } from 'react';
import { ScreenDestination, UserSession } from './types';
import { getStoredSession, storeSession, clearSession } from './services/api';
import { MaterialTopAppBar } from './components/MaterialTopAppBar';
import { MaterialNavigationBar } from './components/MaterialNavigationBar';
import { HomeScreen } from './components/screens/HomeScreen';
import { AppsScreen } from './components/screens/AppsScreen';
import { ProductsScreen } from './components/screens/ProductsScreen';
import { FreePanelScreen } from './components/screens/FreePanelScreen';
import { DownloadsScreen } from './components/screens/DownloadsScreen';
import { UserLoginScreen } from './components/screens/UserLoginScreen';
import { AdminLoginScreen } from './components/screens/AdminLoginScreen';
import { UserDashboardScreen } from './components/screens/UserDashboardScreen';
import { AdminDashboardScreen } from './components/screens/AdminDashboardScreen';
import { OwnerCenterScreen } from './components/screens/OwnerCenterScreen';
import { AboutScreen } from './components/screens/AboutScreen';
import { ContactScreen } from './components/screens/ContactScreen';
import { PrivacyScreen } from './components/screens/PrivacyScreen';
import { TermsScreen } from './components/screens/TermsScreen';
import { AndroidCodeModal } from './components/AndroidCodeModal';
import { AIAssistantSheet } from './components/AIAssistantSheet';
import { FloatingAssistantButton } from './components/FloatingAssistantButton';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenDestination>('home');
  const [screenHistory, setScreenHistory] = useState<ScreenDestination[]>(['home']);
  const [session, setSession] = useState<UserSession | null>(getStoredSession());
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);

  // Sync session state to storage
  useEffect(() => {
    if (session) {
      storeSession(session);
    } else {
      clearSession();
    }
  }, [session]);

  // Section 10: Session Startup Workflow
  useEffect(() => {
    const existing = getStoredSession();
    if (!existing || !existing.token) {
      // No token -> Public Home
      return;
    }
    // Validate expiry
    if (existing.exp && existing.exp * 1000 <= Date.now()) {
      // Token expired -> clear and stay on public home
      clearSession();
      setSession(null);
      return;
    }
    // Determine role and route accordingly on startup
    if (existing.role === 'Admin') {
      setCurrentScreen('admin_dashboard');
      setScreenHistory(['home', 'admin_dashboard']);
    } else if (existing.role === 'User') {
      setCurrentScreen('user_dashboard');
      setScreenHistory(['home', 'user_dashboard']);
    }
  }, []);

  const handleNavigate = (destination: ScreenDestination) => {
    // Route & Role Guards
    let target = destination;
    if (target === 'user_dashboard' && !session) {
      target = 'user_login';
    } else if (target === 'admin_dashboard' && session?.role !== 'Admin') {
      target = 'admin_login';
    } else if (target === 'owner_center' && (session?.role !== 'Admin' || !session?.isOwner)) {
      target = session?.role === 'Admin' ? 'admin_dashboard' : 'admin_login';
    } else if (target === 'user_login' && session?.role === 'User') {
      target = 'user_dashboard';
    } else if (target === 'admin_login' && session?.role === 'Admin') {
      target = 'admin_dashboard';
    }

    if (target === currentScreen) return;
    setScreenHistory((prev) => [...prev, target]);
    setCurrentScreen(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (screenHistory.length > 1) {
      const nextHistory = [...screenHistory];
      nextHistory.pop(); // remove current
      const prev = nextHistory[nextHistory.length - 1];
      setScreenHistory(nextHistory);
      setCurrentScreen(prev);
    } else {
      setCurrentScreen('home');
      setScreenHistory(['home']);
    }
  };

  const handleUserLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    handleNavigate('user_dashboard');
  };

  const handleAdminLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    handleNavigate('admin_dashboard');
  };

  const handleLogout = () => {
    setSession(null);
    clearSession();
    handleNavigate('home');
  };

  const handleActionExecute = (actionCode: string, payload?: unknown) => {
    switch (actionCode) {
      case 'LOGOUT':
        handleLogout();
        break;
      case 'START_DOWNLOAD':
        handleNavigate('downloads');
        break;
      case 'VIEW_DASHBOARD':
        if (session?.role === 'Admin') {
          handleNavigate('admin_dashboard');
        } else if (session?.role === 'User') {
          handleNavigate('user_dashboard');
        } else {
          handleNavigate('user_login');
        }
        break;
      default:
        console.log('Assistant action executed:', actionCode, payload);
    }
  };

  // Compute title for the current screen
  const getScreenTitle = (screen: ScreenDestination): string => {
    switch (screen) {
      case 'home':
        return 'DSCWeb';
      case 'apps':
        return 'Published Apps';
      case 'products':
        return 'VIP Products';
      case 'freepanel':
        return 'Free Access Panel';
      case 'downloads':
        return 'Downloads';
      case 'user_login':
        return 'Sign In';
      case 'admin_login':
        return 'Admin Gateway';
      case 'user_dashboard':
        return 'User Dashboard';
      case 'admin_dashboard':
        return 'Admin Console';
      case 'owner_center':
        return 'Owner Database';
      case 'about':
        return 'About DSC';
      case 'contact':
        return 'Contact Support';
      case 'privacy':
        return 'Privacy Policy';
      case 'terms':
        return 'Terms of Service';
      default:
        return 'DSCWeb Android';
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex justify-center text-slate-100 selection:bg-cyan-500/30">
      {/* Mobile Shell Wrapper */}
      <div className="w-full max-w-md bg-[#0a0d14] border-x border-[#1a1f2e] min-h-screen flex flex-col relative shadow-2xl">
        {/* Top App Bar */}
        <MaterialTopAppBar
          currentScreen={currentScreen}
          onBack={handleBack}
          session={session}
          onLogout={handleLogout}
          onOpenCode={() => setShowCodeModal(true)}
          onNavigate={handleNavigate}
          onOpenAssistant={() => setShowAssistant(true)}
        />

        {/* Content Area */}
        <main className="flex-1 flex flex-col">
          {currentScreen === 'home' && <HomeScreen onNavigate={handleNavigate} />}
          {currentScreen === 'apps' && <AppsScreen />}
          {currentScreen === 'products' && <ProductsScreen />}
          {currentScreen === 'freepanel' && <FreePanelScreen />}
          {currentScreen === 'downloads' && <DownloadsScreen />}
          {currentScreen === 'user_login' && (
            <UserLoginScreen onLoginSuccess={handleUserLoginSuccess} onNavigate={handleNavigate} />
          )}
          {currentScreen === 'admin_login' && (
            <AdminLoginScreen onLoginSuccess={handleAdminLoginSuccess} onNavigate={handleNavigate} />
          )}
          {currentScreen === 'user_dashboard' && session && (
            <UserDashboardScreen session={session} onLogout={handleLogout} />
          )}
          {currentScreen === 'admin_dashboard' && session && (
            <AdminDashboardScreen
              session={session}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          )}
          {currentScreen === 'owner_center' && session && (
            <OwnerCenterScreen session={session} onNavigate={handleNavigate} />
          )}
          {currentScreen === 'about' && <AboutScreen />}
          {currentScreen === 'contact' && <ContactScreen />}
          {currentScreen === 'privacy' && <PrivacyScreen />}
          {currentScreen === 'terms' && <TermsScreen />}
        </main>

        {/* Bottom Navigation Bar */}
        <MaterialNavigationBar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          session={session}
        />

        {/* Floating AI Voice Assistant Button */}
        <FloatingAssistantButton onClick={() => setShowAssistant(true)} />

        {/* AI Voice Assistant Sheet */}
        <AIAssistantSheet
          isOpen={showAssistant}
          onClose={() => setShowAssistant(false)}
          currentScreen={currentScreen}
          session={session}
          onNavigate={handleNavigate}
          onActionExecute={handleActionExecute}
        />

        {/* Native Android Project Code Modal */}
        {showCodeModal && <AndroidCodeModal onClose={() => setShowCodeModal(false)} />}
      </div>
    </div>
  );
}
