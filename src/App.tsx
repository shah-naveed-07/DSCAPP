import React, { useState, useEffect } from 'react';
import { ScreenDestination, UserSession } from './types';
import { AuthManager, AuthState } from './services/authManager';
import { MaterialTopAppBar } from './components/MaterialTopAppBar';
import { MaterialNavigationBar } from './components/MaterialNavigationBar';
import { HomeScreen } from './components/screens/HomeScreen';
import { AppsScreen } from './components/screens/AppsScreen';
import { ProductsScreen } from './components/screens/ProductsScreen';
import { FreePanelScreen } from './components/screens/FreePanelScreen';
import { DownloadsScreen } from './components/screens/DownloadsScreen';
import { UserLoginScreen } from './components/screens/UserLoginScreen';
import { UserRegistrationScreen } from './components/screens/UserRegistrationScreen';
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
import { MicrophonePermissionModal } from './components/MicrophonePermissionModal';
import {
  wakeWordEngine,
  isWakeWordEnabled,
  setWakeWordEnabled,
  WakeWordState,
  WakeWordEvent,
} from './services/wakeWordService';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenDestination>('home');
  const [screenHistory, setScreenHistory] = useState<ScreenDestination[]>(['home']);
  const [authState, setAuthState] = useState<AuthState>(AuthManager.getState());
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [wakeWordEnabled, setWakeEnabledState] = useState<boolean>(isWakeWordEnabled());
  const [wakeWordState, setWakeWordState] = useState<WakeWordState>(wakeWordEngine.getState());
  const [pendingWakeEvent, setPendingWakeEvent] = useState<WakeWordEvent | null>(null);
  const [showMicPermissionModal, setShowMicPermissionModal] = useState(false);

  // Subscribe to centralized AuthManager as the single source of truth
  useEffect(() => {
    const unsubscribe = AuthManager.subscribe((state) => {
      setAuthState(state);
    });
    return unsubscribe;
  }, []);

  // Initialize and connect Voice Wake-Word Engine ("Hey MJ" / "MJ")
  useEffect(() => {
    wakeWordEngine.onWakeWordDetected = (event: WakeWordEvent) => {
      // Wake up assistant immediately without button press
      setShowAssistant(true);
      setPendingWakeEvent(event);
    };

    wakeWordEngine.onStateChanged = (state: WakeWordState) => {
      setWakeWordState(state);
    };

    if (wakeWordEnabled) {
      wakeWordEngine.start();
    }

    return () => {
      wakeWordEngine.stop();
    };
  }, []);

  const handleToggleWakeWord = () => {
    if (wakeWordEnabled) {
      setWakeWordEnabled(false);
      setWakeEnabledState(false);
      wakeWordEngine.stop();
    } else {
      setShowMicPermissionModal(true);
    }
  };

  const handleMicPermissionGranted = () => {
    setWakeWordEnabled(true);
    setWakeEnabledState(true);
    wakeWordEngine.start();
  };

  // Section 10: Session Startup Workflow
  useEffect(() => {
    AuthManager.restoreSession().then((restored) => {
      if (restored.state === 'Admin') {
        setCurrentScreen('admin_dashboard');
        setScreenHistory(['home', 'admin_dashboard']);
      } else if (restored.state === 'User') {
        setCurrentScreen('user_dashboard');
        setScreenHistory(['home', 'user_dashboard']);
      }
    });
  }, []);

  const handleNavigate = (destination: ScreenDestination) => {
    // Check route and role access through AuthManager
    const access = AuthManager.checkAccess(destination);
    const target = access.allowed ? destination : (access.redirectTo || 'home');

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

  const handleUserLoginSuccess = (newSession?: UserSession) => {
    if (newSession) {
      handleNavigate('user_dashboard');
    } else {
      handleNavigate('user_login');
    }
  };

  const handleAdminLoginSuccess = (_newSession: UserSession) => {
    handleNavigate('admin_dashboard');
  };

  const handleLogout = () => {
    AuthManager.logout();
    handleNavigate('home');
  };

  const handleActionExecute = async (
    actionCode: string,
    payload?: unknown
  ): Promise<{ success: boolean; message?: string }> => {
    switch (actionCode) {
      case 'LOGOUT':
        handleLogout();
        return { success: true, message: 'Logged out successfully.' };
      case 'START_DOWNLOAD':
        handleNavigate('downloads');
        return { success: true, message: 'Opened Download Center.' };
      case 'NAVIGATE_BACK':
        handleBack();
        return { success: true, message: 'Navigated back.' };
      case 'COPY_USER_KEY':
        window.dispatchEvent(new CustomEvent('user_copy_key'));
        return { success: true, message: 'License key copied.' };
      case 'OPEN_CHANGE_PASSWORD':
        if (currentScreen !== 'user_dashboard') {
          handleNavigate('user_dashboard');
        }
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('user_open_password_modal'));
        }, 150);
        return { success: true, message: 'Opened change password dialog.' };
      case 'SEARCH_USER': {
        const username = (payload as { username?: string })?.username || '';
        if (currentScreen !== 'admin_dashboard') {
          handleNavigate('admin_dashboard');
        }
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('admin_search_user', { detail: { username } }));
        }, 150);
        return { success: true, message: `Searching user "${username}".` };
      }
      case 'OPEN_ADMIN_USERS':
        if (currentScreen !== 'admin_dashboard') {
          handleNavigate('admin_dashboard');
        }
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('admin_switch_tab', { detail: { tab: 'users' } }));
        }, 150);
        return { success: true, message: 'Switched to Users tab.' };
      case 'OPEN_ADMIN_ORDERS':
        if (currentScreen !== 'admin_dashboard') {
          handleNavigate('admin_dashboard');
        }
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('admin_switch_tab', { detail: { tab: 'orders' } }));
        }, 150);
        return { success: true, message: 'Switched to Orders queue.' };
      case 'REFRESH_CURRENT_SCREEN':
        window.dispatchEvent(new CustomEvent('user_refresh_order'));
        return { success: true, message: 'Screen refreshed.' };
      default:
        console.log('Assistant action executed:', actionCode, payload);
        return { success: true };
    }
  };

  const session = authState.session;

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
          {currentScreen === 'user_register' && (
            <UserRegistrationScreen
              onRegisterSuccess={handleUserLoginSuccess}
              onNavigate={handleNavigate}
            />
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

        {/* Floating AI Voice Assistant Button with Wake Status */}
        <FloatingAssistantButton
          onClick={() => setShowAssistant(true)}
          wakeState={wakeWordState}
          wakeEnabled={wakeWordEnabled}
        />

        {/* AI Voice Assistant Sheet */}
        <AIAssistantSheet
          isOpen={showAssistant}
          onClose={() => setShowAssistant(false)}
          currentScreen={currentScreen}
          session={session}
          onNavigate={handleNavigate}
          onBack={handleBack}
          onActionExecute={handleActionExecute}
          wakeWordEnabled={wakeWordEnabled}
          wakeWordState={wakeWordState}
          onToggleWakeWord={handleToggleWakeWord}
          pendingWakeEvent={pendingWakeEvent}
          onClearPendingWakeEvent={() => setPendingWakeEvent(null)}
        />

        {/* Microphone Permission Modal */}
        <MicrophonePermissionModal
          isOpen={showMicPermissionModal}
          onClose={() => setShowMicPermissionModal(false)}
          onGranted={handleMicPermissionGranted}
        />

        {/* Native Android Project Code Modal */}
        {showCodeModal && <AndroidCodeModal onClose={() => setShowCodeModal(false)} />}
      </div>
    </div>
  );
}
