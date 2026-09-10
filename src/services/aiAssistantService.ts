import { ScreenDestination, UserSession } from '../types';
import { getScreenSemantic, ScreenSemanticInfo } from './screenRegistry';
import { validateActionPermission, ValidationResult } from './actionRegistry';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  intent?: string | null;
  actionCode?: string | null;
  requiresConfirmation?: boolean;
  confirmationHandled?: boolean;
  actionPayload?: unknown;
}

export interface AssistantApiResponse {
  message: string;
  intent?: string | null;
  action?: string | null;
  requiresConfirmation?: boolean;
  actionPayload?: unknown;
}

/**
 * Sends natural language query to backend AI Assistant proxy endpoint
 */
export async function queryAssistant(
  query: string,
  currentScreen: ScreenDestination,
  session: UserSession | null,
  history: ChatMessage[]
): Promise<AssistantApiResponse> {
  const semantic = getScreenSemantic(currentScreen);

  const authState = {
    role: session ? session.role : 'Guest',
    username: session ? session.username : null,
    isOwner: Boolean(session?.isOwner || session?.username === 'admin' || session?.username === 'owner'),
  };

  const payload = {
    query,
    currentScreen,
    authState,
    screenContext: semantic,
    conversationHistory: history.slice(-4).map((h) => ({
      sender: h.sender,
      text: h.text,
      intent: h.intent,
    })),
  };

  try {
    const res = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data: AssistantApiResponse = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend AI proxy request failed, falling back to local intent parser:', err);
  }

  // Robust client-side fallback parsing (multilingual + deterministic)
  return fallbackIntentParser(query, currentScreen, authState, semantic);
}

/**
 * Local deterministic intent parser for instant response and offline fallback
 */
function fallbackIntentParser(
  query: string,
  currentScreen: ScreenDestination,
  authState: { role: string; username: string | null; isOwner: boolean },
  semantic: ScreenSemanticInfo
): AssistantApiResponse {
  const q = query.toLowerCase().trim();

  // 1. Contextual Screen Reading
  if (
    q.includes('read this') ||
    q.includes('read page') ||
    q.includes('tell me what is on') ||
    q.includes('explain this screen') ||
    q.includes('kya hai ye') ||
    q.includes('ye page kya hai')
  ) {
    return {
      message: `You are currently viewing **${semantic.title}**.\n\n${semantic.readableSummary}`,
      intent: 'READ_SCREEN',
      action: null,
      requiresConfirmation: false,
    };
  }

  // 2. Component / Action Discovery
  if (q.includes('what can i do') || q.includes('available action') || q.includes('kya kar sakte')) {
    const actionList = semantic.availableActions.map((a) => `• **${a.label}**: ${a.description}`).join('\n');
    return {
      message: `On **${semantic.title}**, you can perform:\n\n${actionList}`,
      intent: 'DISCOVER_ACTIONS',
      action: null,
      requiresConfirmation: false,
    };
  }

  // 3. Specific Button help
  if (q.includes('what is this button') || q.includes('download button') || q.includes('copy key')) {
    for (const [key, desc] of Object.entries(semantic.componentHelp)) {
      if (q.includes(key) || key.includes(q)) {
        return {
          message: `**${key.toUpperCase()}**: ${desc}`,
          intent: 'COMPONENT_HELP',
          action: null,
          requiresConfirmation: false,
        };
      }
    }
  }

  // 4. Navigation Intents (English + Hindi/Urdu/Hinglish)
  // Home
  if (q.includes('home') || q.includes('main page') || q.includes('shuru')) {
    return {
      message: 'Navigating to Home screen.',
      intent: 'NAVIGATE',
      action: 'OPEN_HOME',
      requiresConfirmation: false,
    };
  }

  // Apps
  if (q.includes('app') || q.includes('play store') || q.includes('qr scanner') || q.includes('mindmatrix') || q.includes('apps dikhao')) {
    return {
      message: 'Opening Published Android Apps section.',
      intent: 'NAVIGATE',
      action: 'OPEN_APPS',
      requiresConfirmation: false,
    };
  }

  // Products / Plans
  if (q.includes('plan') || q.includes('product') || q.includes('vip') || q.includes('price') || q.includes('pricing') || q.includes('plans dikhao')) {
    return {
      message: 'Showing VIP Subscription Products and Pricing.',
      intent: 'NAVIGATE',
      action: 'OPEN_PRODUCTS',
      requiresConfirmation: false,
    };
  }

  // Downloads
  if (q.includes('download') || q.includes('apk') || q.includes('files') || q.includes('downloads mein le chalo')) {
    return {
      message: 'Opening Download Center for official APKs and tools.',
      intent: 'NAVIGATE',
      action: 'OPEN_DOWNLOADS',
      requiresConfirmation: false,
    };
  }

  // Free Panel
  if (q.includes('free') || q.includes('slot') || q.includes('free panel')) {
    return {
      message: 'Opening Public Free Panel with active user slot status.',
      intent: 'NAVIGATE',
      action: 'OPEN_FREE_PANEL',
      requiresConfirmation: false,
    };
  }

  // User Dashboard / Account
  if (q.includes('dashboard') || q.includes('my order') || q.includes('mera plan') || q.includes('my account') || q.includes('mera account')) {
    if (authState.role === 'Guest') {
      return {
        message: 'You need to sign in to access your Subscriber Dashboard. Opening user login.',
        intent: 'NAVIGATE',
        action: 'OPEN_USER_LOGIN',
        requiresConfirmation: false,
      };
    }
    return {
      message: 'Opening your Subscriber Dashboard.',
      intent: 'NAVIGATE',
      action: 'OPEN_USER_DASHBOARD',
      requiresConfirmation: false,
    };
  }

  // Plan Expiry Question
  if (q.includes('expire') || q.includes('expiration') || q.includes('kab expire hoga')) {
    if (authState.role === 'Guest') {
      return {
        message: 'Please sign in to view your active plan expiration date.',
        intent: 'INFO_REQUEST',
        action: 'OPEN_USER_LOGIN',
        requiresConfirmation: false,
      };
    }
    return {
      message: 'Navigating to your dashboard where your plan expiration timestamp is actively displayed.',
      intent: 'NAVIGATE',
      action: 'OPEN_USER_DASHBOARD',
      requiresConfirmation: false,
    };
  }

  // License Key Query
  if (q.includes('key') || q.includes('license key') || q.includes('meri key')) {
    if (authState.role === 'Guest') {
      return {
        message: 'Please sign in to view and copy your hardware license key.',
        intent: 'NAVIGATE',
        action: 'OPEN_USER_LOGIN',
        requiresConfirmation: false,
      };
    }
    if (currentScreen === 'user_dashboard') {
      return {
        message: 'Copying your hardware license key to the clipboard.',
        intent: 'ACTION',
        action: 'COPY_USER_KEY',
        requiresConfirmation: false,
      };
    }
    return {
      message: 'Opening User Dashboard to display your license key.',
      intent: 'NAVIGATE',
      action: 'OPEN_USER_DASHBOARD',
      requiresConfirmation: false,
    };
  }

  // Change Password
  if (q.includes('change password') || q.includes('password badalna') || q.includes('update password')) {
    if (authState.role === 'Guest') {
      return {
        message: 'Please sign in before changing your password.',
        intent: 'NAVIGATE',
        action: 'OPEN_USER_LOGIN',
        requiresConfirmation: false,
      };
    }
    return {
      message: 'Opening password change dialog on User Dashboard.',
      intent: 'NAVIGATE',
      action: 'OPEN_CHANGE_PASSWORD',
      requiresConfirmation: false,
    };
  }

  // Admin Dashboard / Console
  if (q.includes('admin') || q.includes('users management') || q.includes('pending orders')) {
    if (authState.role !== 'Admin') {
      return {
        message: 'Administrator authorization required. Opening Admin sign in.',
        intent: 'NAVIGATE',
        action: 'OPEN_ADMIN_LOGIN',
        requiresConfirmation: false,
      };
    }
    return {
      message: 'Opening Administrator Console.',
      intent: 'NAVIGATE',
      action: 'OPEN_ADMIN_DASHBOARD',
      requiresConfirmation: false,
    };
  }

  // Owner Center
  if (q.includes('owner')) {
    if (!authState.isOwner) {
      return {
        message: 'Access Denied: Master Owner privileges are required to view the Owner Database.',
        intent: 'PERMISSION_DENIED',
        action: null,
        requiresConfirmation: false,
      };
    }
    return {
      message: 'Verified Owner: Opening Master Owner Database.',
      intent: 'NAVIGATE',
      action: 'OPEN_OWNER_CENTER',
      requiresConfirmation: false,
    };
  }

  // About / Contact / Privacy / Terms
  if (q.includes('about') || q.includes('company')) {
    return { message: 'Opening About Dark Skull Corporation.', intent: 'NAVIGATE', action: 'OPEN_ABOUT', requiresConfirmation: false };
  }
  if (q.includes('contact') || q.includes('support') || q.includes('help')) {
    return { message: 'Opening Contact Support Desk.', intent: 'NAVIGATE', action: 'OPEN_CONTACT', requiresConfirmation: false };
  }
  if (q.includes('privacy')) {
    return { message: 'Opening Privacy Architecture.', intent: 'NAVIGATE', action: 'OPEN_PRIVACY', requiresConfirmation: false };
  }
  if (q.includes('terms') || q.includes('rule')) {
    return { message: 'Opening Terms of Service.', intent: 'NAVIGATE', action: 'OPEN_TERMS', requiresConfirmation: false };
  }

  // Logout
  if (q.includes('logout') || q.includes('sign out')) {
    if (authState.role === 'Guest') {
      return { message: 'You are not signed in.', intent: 'INFO', action: null, requiresConfirmation: false };
    }
    return {
      message: 'Signing out of your active session.',
      intent: 'LOGOUT',
      action: 'LOGOUT',
      requiresConfirmation: true,
    };
  }

  return {
    message: `I'm here to help navigate DSCWeb Android. Try asking me:\n• *"Open Downloads"*\n• *"Show VIP Plans"*\n• *"Read this page"*\n• *"What is my plan?"*\n• *"Open Free Panel"*`,
    intent: 'HELP',
    action: null,
    requiresConfirmation: false,
  };
}
