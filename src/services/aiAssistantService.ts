import { ScreenDestination, UserSession, UserOrder } from '../types';
import { getScreenSemantic, ScreenSemanticInfo } from './screenRegistry';
import { validateActionPermission, ACTION_DEFINITIONS } from './actionRegistry';
import { getAppConfig } from './api';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  intent?: string | null;
  actionCode?: string | null;
  requiresConfirmation?: boolean;
  confirmationHandled?: boolean;
  actionPayload?: Record<string, unknown> | null;
  status?: 'pending' | 'success' | 'failed';
}

export interface AssistantApiResponse {
  message: string;
  intent?: string | null;
  action?: string | null;
  requiresConfirmation?: boolean;
  actionPayload?: Record<string, unknown> | null;
}

export interface LiveDataContext {
  userOrder?: UserOrder | null;
  systemConfig?: ReturnType<typeof getAppConfig>;
  activeScreen?: ScreenDestination;
}

/**
 * Normalizes text for intent matching:
 * - strips accents, lowercases
 * - collapses repeated letters (e.g., haaaan -> haan, kholoooo -> kholo)
 * - removes punctuation
 */
function normalizeQuery(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .replace(/[.,?!:;'"()\[\]{}]/g, ' ')
    .replace(/(.)\1{2,}/g, '$1$1') // limit 3+ repeated characters to 2
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detects if the sentence has Hinglish or Hindi flavor
 */
export function isHinglishText(text: string): boolean {
  if (!text) return false;
  if (/[\u0900-\u097F]/.test(text)) return true;
  return /\b(kholo|khol|dikhao|dikhana|dekho|dekhna|batao|bata|bolo|karo|kar|karna|mera|meri|mere|mujhe|humara|aapka|aapko|hai|hain|hoga|hogi|kya|kaise|kaha|kyun|nahi|nahin|haan|han|theek|thik|bilkul|shuru|wapis|peeche|piche|pehle|wala|bhai|dost|le chalo|samjhao|chahiye|kar do|mat karo|rehne do|de do|muft|band karo|badal do|badlo|bande|banda|isko|ye wala)\b/i.test(
    text
  );
}

/**
 * Sends natural language query to backend AI Assistant proxy endpoint,
 * with resilient, comprehensive client-side deterministic fallback.
 */
export async function queryAssistant(
  query: string,
  currentScreen: ScreenDestination,
  session: UserSession | null,
  history: ChatMessage[],
  liveContext?: LiveDataContext
): Promise<AssistantApiResponse> {
  const semantic = getScreenSemantic(currentScreen);
  const sysConfig = liveContext?.systemConfig || getAppConfig();

  const authState = {
    role: session ? session.role : 'Guest',
    username: session ? session.username : null,
    isOwner: Boolean(session && session.isOwner === true),
  };

  const payload = {
    query,
    currentScreen,
    authState,
    screenContext: semantic,
    liveData: {
      userOrder: liveContext?.userOrder || null,
      systemConfig: sysConfig,
    },
    conversationHistory: history.slice(-6).map((h) => ({
      sender: h.sender,
      text: h.text,
      intent: h.intent,
      actionCode: h.actionCode,
      requiresConfirmation: h.requiresConfirmation,
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
      if (data && typeof data.message === 'string') {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend AI proxy unavailable or timed out, executing MJ local intelligent intent resolver:', err);
  }

  // Resilient deterministic intent resolver with natural Hinglish vocabulary & context
  return resolveLocalIntent(query, currentScreen, authState, semantic, history, liveContext);
}

/**
 * Intelligent deterministic intent resolver supporting:
 * - Natural Hinglish vocabulary & variations
 * - Contextual follow-up commands (haan, nahi, cancel, wapis)
 * - Screen awareness (ye kya hai, yaha kya kar sakte hain)
 * - Entity extraction (e.g. search users, orders)
 * - Strict role validation
 * - Real live data consumption (user plan, expiry, maintenance)
 */
export function resolveLocalIntent(
  rawQuery: string,
  currentScreen: ScreenDestination,
  authState: { role: string; username: string | null; isOwner: boolean },
  semantic: ScreenSemanticInfo,
  history: ChatMessage[],
  liveContext?: LiveDataContext
): AssistantApiResponse {
  const q = normalizeQuery(rawQuery);
  const hinglish = isHinglishText(rawQuery);

  // Check last message in conversation history for pending confirmation or action
  const lastAssistantMsg = [...history].reverse().find((m) => m.sender === 'assistant');
  const hasPendingConfirmation = Boolean(
    lastAssistantMsg?.requiresConfirmation && !lastAssistantMsg?.confirmationHandled
  );
  const pendingActionCode = lastAssistantMsg?.actionCode;
  const pendingPayload = lastAssistantMsg?.actionPayload;

  // -------------------------------------------------------------
  // 1. Follow-up Affirmation (haan, yes, kar do, proceed, etc.)
  // -------------------------------------------------------------
  if (
    /^(haan|ha|han|yes|yep|yeah|kar do|kardo|proceed|do it|bilkul|theek hai|thik hai|agree|confirm)$/i.test(
      q
    ) ||
    /\b(haan karo|proceed karo|kar do bhai|confirm karo)\b/i.test(q)
  ) {
    if (hasPendingConfirmation && pendingActionCode) {
      return {
        message: hinglish
          ? 'Confirmation mil gaya hai. Action execute kar raha hoon...'
          : 'Confirmation received. Executing action...',
        intent: 'CONFIRM_PROCEED',
        action: pendingActionCode,
        requiresConfirmation: false,
        actionPayload: pendingPayload,
      };
    }
    return {
      message: hinglish
        ? 'Ji, main taiyar hoon. Batayein kya karna hai?'
        : 'Yes, I am ready. What would you like to do?',
      intent: 'AFFIRMATION',
      action: null,
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 2. Follow-up Denial / Cancel (nahi, no, cancel, mat karo, etc.)
  // -------------------------------------------------------------
  if (
    /^(nahi|nahin|na|no|nope|cancel|mat karo|mat kar|rehne do|chodo|stop)$/i.test(q) ||
    /\b(nahi rehne do|cancel kar do|mat karo bhai)\b/i.test(q)
  ) {
    if (hasPendingConfirmation) {
      return {
        message: hinglish
          ? 'Theek hai, action cancel kar diya gaya hai. Koi change nahi hua.'
          : 'Understood. The action has been cancelled without changes.',
        intent: 'CONFIRM_CANCEL',
        action: null,
        requiresConfirmation: false,
      };
    }
    return {
      message: hinglish ? 'Theek hai, batayein aur kya madad karun?' : 'Alright, how else can I help you?',
      intent: 'CANCELLATION',
      action: null,
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 3. Navigation Back (wapis jao, peeche jao, go back, pehle wala)
  // -------------------------------------------------------------
  if (
    /\b(wapis|peeche|piche|go back|back jao|pehle wala|previous screen|back)\b/i.test(q)
  ) {
    return {
      message: hinglish ? 'Peeche chalte hain.' : 'Navigating back to previous screen.',
      intent: 'NAVIGATE_BACK',
      action: 'NAVIGATE_BACK',
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 4. Screen Awareness: "ye kya hai", "ye page kis liye hai"
  // -------------------------------------------------------------
  if (
    /\b(ye kya hai|ye page kya hai|ye page kis liye hai|explain this page|explain this screen|what is this screen|what is this page|read this page|is page ke baare mein batao)\b/i.test(
      q
    )
  ) {
    return {
      message: hinglish
        ? `Aap abhi **${semantic.title}** par hain.\n\n${semantic.hinglishSummary}\n\nVisible: ${semantic.visibleInformation}`
        : `You are currently viewing **${semantic.title}**.\n\n${semantic.readableSummary}\n\nVisible: ${semantic.visibleInformation}`,
      intent: 'EXPLAIN_SCREEN',
      action: null,
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 5. Action Discovery: "yaha kya kar sakta hu", "available actions"
  // -------------------------------------------------------------
  if (
    /\b(yaha kya kar sakta hu|yaha kya kar sakte|what can i do here|what actions are available|available actions|yaha ke options batao)\b/i.test(
      q
    )
  ) {
    const list = semantic.availableActions.map((a) => `• **${a.label}**: ${a.description}`).join('\n');
    return {
      message: hinglish
        ? `**${semantic.title}** par aap yeh actions kar sakte hain:\n\n${list}`
        : `On **${semantic.title}**, you can perform the following actions:\n\n${list}`,
      intent: 'EXPLAIN_ACTIONS',
      action: null,
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 6. User Account: "mera plan kya hai", "mera plan batao"
  // -------------------------------------------------------------
  if (
    /\b(mera plan|my plan|mera subscription|mera account|mera status)\b/i.test(q) &&
    !/\b(expire|expiry|kab tak)\b/i.test(q)
  ) {
    if (authState.role === 'Guest') {
      return {
        message: hinglish
          ? 'Apna plan check karne ke liye pehle login karna zaroori hai. User login kholun?'
          : 'Please sign in with your subscriber account to view your active plan.',
        intent: 'NAVIGATE',
        action: 'OPEN_USER_LOGIN',
        requiresConfirmation: false,
      };
    }

    const order = liveContext?.userOrder;
    if (order && order.plan) {
      return {
        message: hinglish
          ? `Aapka active plan **${order.plan}** hai. Status: **${order.status}**.`
          : `Your active subscription is **${order.plan}** with status: **${order.status}**.`,
        intent: 'CHECK_MY_PLAN',
        action: currentScreen !== 'user_dashboard' ? 'OPEN_USER_DASHBOARD' : null,
        requiresConfirmation: false,
      };
    }

    return {
      message: hinglish
        ? 'Aapka dashboard open kar raha hoon jahan aapka live plan aur status visible hai.'
        : 'Opening your Subscriber Dashboard to inspect your live subscription plan.',
      intent: 'NAVIGATE',
      action: 'OPEN_USER_DASHBOARD',
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 7. Plan Expiry: "mera plan kab expire ho raha hai", "kab expire hoga"
  // -------------------------------------------------------------
  if (/\b(expire|expiry|kab expire|kab tak hai|expiration date)\b/i.test(q)) {
    if (authState.role === 'Guest') {
      return {
        message: hinglish
          ? 'Plan expiry date dekhne ke liye login karein.'
          : 'Please log in to view your subscription expiration date.',
        intent: 'NAVIGATE',
        action: 'OPEN_USER_LOGIN',
        requiresConfirmation: false,
      };
    }

    const order = liveContext?.userOrder;
    if (order && order.expiry) {
      const formattedDate = new Date(order.expiry).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      return {
        message: hinglish
          ? `Aapka plan **${formattedDate}** ko expire hoga. Plan: **${order.plan}**.`
          : `Your plan **${order.plan}** is set to expire on **${formattedDate}**.`,
        intent: 'CHECK_MY_PLAN',
        action: currentScreen !== 'user_dashboard' ? 'OPEN_USER_DASHBOARD' : null,
        requiresConfirmation: false,
      };
    }

    return {
      message: hinglish
        ? 'Aapka dashboard open kar raha hoon jahan expiry date show hoti hai.'
        : 'Opening your Subscriber Dashboard where your expiration timestamp is displayed.',
      intent: 'NAVIGATE',
      action: 'OPEN_USER_DASHBOARD',
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 8. License Key: "meri key dikhao", "meri key copy karo"
  // -------------------------------------------------------------
  if (/\b(meri key|mera key|license key|key dikhao|key copy)\b/i.test(q)) {
    if (authState.role === 'Guest') {
      return {
        message: hinglish
          ? 'License key dekhne ke liye please login karein.'
          : 'Please log in to access your hardware-bound license key.',
        intent: 'NAVIGATE',
        action: 'OPEN_USER_LOGIN',
        requiresConfirmation: false,
      };
    }

    if (currentScreen === 'user_dashboard') {
      return {
        message: hinglish
          ? 'Aapki hardware license key clipboard par copy kar di gayi hai.'
          : 'Copying your hardware license key to your clipboard.',
        intent: 'ACTION',
        action: 'COPY_USER_KEY',
        requiresConfirmation: false,
      };
    }

    return {
      message: hinglish
        ? 'Dashboard open kar raha hoon jahan aap apni license key dekh aur copy kar sakte hain.'
        : 'Opening User Dashboard to display your hardware license key.',
      intent: 'NAVIGATE',
      action: 'OPEN_USER_DASHBOARD',
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 9. Maintenance Query: "maintenance on hai kya", "maintenance status"
  // -------------------------------------------------------------
  if (/\b(maintenance|maintenance status|maintenance on hai|maintenance chalu hai)\b/i.test(q)) {
    const config = liveContext?.systemConfig || getAppConfig();
    const isMaintenance = Boolean(config.maintenance || config.maintenanceReason);
    if (isMaintenance) {
      return {
        message: hinglish
          ? `Haan, system maintenance ON hai. Reason: ${config.maintenanceReason || 'Scheduled security updates'}.`
          : `Yes, maintenance mode is currently ACTIVE. Reason: ${config.maintenanceReason || 'Scheduled updates'}.`,
        intent: 'CHECK_MAINTENANCE',
        action: null,
        requiresConfirmation: false,
      };
    }
    return {
      message: hinglish
        ? 'Maintenance mode filhal OFF hai. Sabhi server cluster services normally operational hain.'
        : 'Maintenance mode is currently OFF. All system services are operating normally.',
      intent: 'CHECK_MAINTENANCE',
      action: null,
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 10. Dashboard Navigation: "mera dashboard kholo", "dashboard dikhao"
  // -------------------------------------------------------------
  if (
    /\b(dashboard|mera dashboard|user dashboard)\b/i.test(q) &&
    !/\b(admin|owner)\b/i.test(q)
  ) {
    if (authState.role === 'Guest') {
      return {
        message: hinglish
          ? 'Dashboard access karne ke liye pehle subscriber account mein sign in karein. Login page khol raha hoon.'
          : 'You need to sign in to access your Subscriber Dashboard. Opening user login.',
        intent: 'NAVIGATE',
        action: 'OPEN_USER_LOGIN',
        requiresConfirmation: false,
      };
    }
    return {
      message: hinglish
        ? 'Bilkul, aapka Subscriber Dashboard open kar raha hoon.'
        : 'Opening your Subscriber Dashboard.',
      intent: 'NAVIGATE',
      action: 'OPEN_USER_DASHBOARD',
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 11. Free Panel: "free panel kholo", "free panel dikhao", "free users check karo"
  // -------------------------------------------------------------
  if (/\b(free panel|free users|free panel dikhao|muft panel|free slot)\b/i.test(q)) {
    // If owner specifically asks for free users management database
    if (/\b(free users)\b/i.test(q) && authState.isOwner) {
      return {
        message: hinglish
          ? 'Master Owner Database mein Free Users section open kar raha hoon.'
          : 'Opening Master Owner Database for Free Users management.',
        intent: 'NAVIGATE',
        action: 'OPEN_OWNER_CENTER',
        requiresConfirmation: false,
      };
    }

    return {
      message: hinglish
        ? 'Public Free Panel open kar raha hoon jahan live testing slot availability dekh sakte hain.'
        : 'Opening the Public Free Panel to check testing slots and credentials.',
      intent: 'NAVIGATE',
      action: 'OPEN_FREE_PANEL',
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 12. Downloads: "downloads kholo", "download open karo", "download kaha se karu"
  // -------------------------------------------------------------
  if (/\b(download|downloads|apk|software download|download center|download kaha se)\b/i.test(q)) {
    return {
      message: hinglish
        ? 'Download Center open kar raha hoon. Yahan signed APKs, panel software aur tools available hain.'
        : 'Opening Download Center for official APKs and security software.',
      intent: 'NAVIGATE',
      action: 'OPEN_DOWNLOADS',
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 13. Products & Pricing: "vip products", "plans dikhao", "pricing"
  // -------------------------------------------------------------
  if (/\b(products|plans|pricing|vip plans|product dikhao|kharidna hai|order karna)\b/i.test(q)) {
    return {
      message: hinglish
        ? 'VIP Products and Plans screen open kar raha hoon. Bronze, Silver, Gold, Platinum plans available hain.'
        : 'Showing VIP Products and subscription tiers (Bronze, Silver, Gold, Platinum).',
      intent: 'NAVIGATE',
      action: 'OPEN_PRODUCTS',
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 14. Published Apps: "apps dikhao", "play store apps"
  // -------------------------------------------------------------
  if (/\b(published apps|play store|qr scanner|mindmatrix|apps screen)\b/i.test(q)) {
    return {
      message: hinglish
        ? 'Google Play Store ke verified DSC apps khol raha hoon.'
        : 'Opening Published Android Apps showcase.',
      intent: 'NAVIGATE',
      action: 'OPEN_APPS',
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 15. Search User (Entity Extraction): "users mein naveed ko search karo", "navi ko search karo"
  // -------------------------------------------------------------
  const searchUserMatch =
    q.match(/(?:search|khojo|dhoondo)\s+([a-zA-Z0-9_-]+)/i) ||
    q.match(/([a-zA-Z0-9_-]+)\s+ko\s+(?:search|dhoondo|find)/i) ||
    q.match(/users\s+mein\s+([a-zA-Z0-9_-]+)\s+ko\s+search/i);

  if (searchUserMatch && searchUserMatch[1] && !['karo', 'kar', 'dikhao', 'batao'].includes(searchUserMatch[1])) {
    const targetUser = searchUserMatch[1].trim();
    if (authState.role !== 'Admin') {
      return {
        message: hinglish
          ? 'User search karne ke liye Admin permissions zaroori hain. Pehle Admin sign in karein.'
          : 'Administrator privileges are required to search user accounts.',
        intent: 'NAVIGATE',
        action: 'OPEN_ADMIN_LOGIN',
        requiresConfirmation: false,
      };
    }

    return {
      message: hinglish
        ? `Users list mein "${targetUser}" ko filter aur search kar raha hoon.`
        : `Searching for user "${targetUser}" in Admin Console.`,
      intent: 'SEARCH_USER',
      action: 'SEARCH_USER',
      requiresConfirmation: false,
      actionPayload: { username: targetUser },
    };
  }

  // -------------------------------------------------------------
  // 16. Admin Users / Orders: "users kholo", "orders check karo", "orders dekhne hain"
  // -------------------------------------------------------------
  if (/\b(users kholo|user list|users open karo|registered users)\b/i.test(q)) {
    if (authState.role !== 'Admin') {
      return {
        message: hinglish
          ? 'Users management access karne ke liye Admin login zaroori hai.'
          : 'Administrator credentials required to view user accounts.',
        intent: 'NAVIGATE',
        action: 'OPEN_ADMIN_LOGIN',
        requiresConfirmation: false,
      };
    }
    return {
      message: hinglish
        ? 'Admin Console ke Users Management section mein le ja raha hoon.'
        : 'Opening Users Management in Admin Console.',
      intent: 'NAVIGATE',
      action: 'OPEN_ADMIN_USERS',
      requiresConfirmation: false,
    };
  }

  if (/\b(orders|pending orders|orders check|orders dekhne)\b/i.test(q)) {
    if (authState.role !== 'Admin') {
      return {
        message: hinglish
          ? 'Customer orders review karne ke liye Administrator login zaroori hai.'
          : 'Administrator credentials required to view customer orders queue.',
        intent: 'NAVIGATE',
        action: 'OPEN_ADMIN_LOGIN',
        requiresConfirmation: false,
      };
    }
    return {
      message: hinglish
        ? 'Pending orders verification queue open kar raha hoon.'
        : 'Opening Pending Orders queue in Admin Console.',
      intent: 'NAVIGATE',
      action: 'OPEN_ADMIN_ORDERS',
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 17. Owner Database: "owner database kholo", "owner center"
  // -------------------------------------------------------------
  if (/\b(owner database|owner center|malik database|root database)\b/i.test(q)) {
    if (!authState.isOwner) {
      return {
        message: hinglish
          ? 'Sorry, aapke current account ke paas Master Owner Database access ki permission nahi hai.'
          : 'Access Denied: Master Owner privileges are required to open Owner Center.',
        intent: 'PERMISSION_DENIED',
        action: null,
        requiresConfirmation: false,
      };
    }
    return {
      message: hinglish
        ? 'Verified Owner: Master Owner Database control room open kar raha hoon.'
        : 'Verified Owner: Opening Master Owner Database Center.',
      intent: 'NAVIGATE',
      action: 'OPEN_OWNER_CENTER',
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 18. Settings / Password: "settings kholo", "bhai settings dikhao", "password change"
  // -------------------------------------------------------------
  if (/\b(settings|setting|options|password change|password badalna)\b/i.test(q)) {
    if (authState.role === 'Guest') {
      return {
        message: hinglish
          ? 'Account settings ke liye pehle login karein.'
          : 'Please sign in to access account settings.',
        intent: 'NAVIGATE',
        action: 'OPEN_USER_LOGIN',
        requiresConfirmation: false,
      };
    }
    if (currentScreen === 'user_dashboard') {
      return {
        message: hinglish
          ? 'Password change modal open kar raha hoon.'
          : 'Opening password change dialog.',
        intent: 'ACTION',
        action: 'OPEN_CHANGE_PASSWORD',
        requiresConfirmation: false,
      };
    }
    return {
      message: hinglish
        ? 'User Dashboard open kar raha hoon jahan settings aur password change kar sakte hain.'
        : 'Navigating to User Dashboard for account settings.',
      intent: 'NAVIGATE',
      action: 'OPEN_USER_DASHBOARD',
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 19. Refresh Screen: "refresh karo", "phir se load karo", "reload"
  // -------------------------------------------------------------
  if (/\b(refresh|reload|phir se load|update karo|taza karo)\b/i.test(q)) {
    return {
      message: hinglish
        ? 'Current screen ka live data refresh kar raha hoon.'
        : 'Refreshing live data on current screen.',
      intent: 'REFRESH',
      action: 'REFRESH_CURRENT_SCREEN',
      requiresConfirmation: false,
    };
  }

  // -------------------------------------------------------------
  // 20. Destructive Action: Delete User ("navi ko delete karo")
  // -------------------------------------------------------------
  const deleteUserMatch =
    q.match(/(?:delete|hatao|remove)\s+user\s+([a-zA-Z0-9_-]+)/i) ||
    q.match(/([a-zA-Z0-9_-]+)\s+ko\s+(?:delete|hatao|remove)/i);

  if (deleteUserMatch && deleteUserMatch[1] && !['karo', 'kar', 'do', 'bhai'].includes(deleteUserMatch[1])) {
    const target = deleteUserMatch[1].trim();
    if (authState.role !== 'Admin') {
      return {
        message: hinglish
          ? 'Users delete karne ke liye Admin permissions zaroori hain.'
          : 'Administrator authorization required to delete accounts.',
        intent: 'PERMISSION_DENIED',
        action: null,
        requiresConfirmation: false,
      };
    }

    return {
      message: hinglish
        ? `User "${target}" ko database se permanently delete kiya jayega. Kya main proceed karun?`
        : `User "${target}" will be permanently deleted from the database. Should I proceed?`,
      intent: 'DELETE_USER',
      action: 'DELETE_USER',
      requiresConfirmation: true,
      actionPayload: { username: target },
    };
  }

  // -------------------------------------------------------------
  // 21. Destructive Action: Toggle Maintenance
  // -------------------------------------------------------------
  if (/\b(toggle maintenance|maintenance switch|maintenance badlo|maintenance band karo|maintenance chalu karo)\b/i.test(q)) {
    if (!authState.isOwner) {
      return {
        message: hinglish
          ? 'Global maintenance mode toggle karne ke liye Master Owner permissions zaroori hain.'
          : 'Master Owner privileges are required to toggle global maintenance mode.',
        intent: 'PERMISSION_DENIED',
        action: null,
        requiresConfirmation: false,
      };
    }
    return {
      message: hinglish
        ? 'Global maintenance mode toggle kiya jayega. Kya aap confirm karna chahte hain?'
        : 'Global cluster maintenance mode will be toggled. Please confirm to proceed.',
      intent: 'TOGGLE_MAINTENANCE',
      action: 'TOGGLE_MAINTENANCE',
      requiresConfirmation: true,
    };
  }

  // -------------------------------------------------------------
  // 22. Logout
  // -------------------------------------------------------------
  if (/\b(logout|sign out|log out|bahar jao)\b/i.test(q)) {
    if (authState.role === 'Guest') {
      return {
        message: hinglish ? 'Aap abhi sign in nahi hain.' : 'You are currently not signed in.',
        intent: 'INFO',
        action: null,
        requiresConfirmation: false,
      };
    }
    return {
      message: hinglish
        ? 'Kya aap sach mein apne session se sign out karna chahte hain?'
        : 'Are you sure you want to sign out of your session?',
      intent: 'LOGOUT',
      action: 'LOGOUT',
      requiresConfirmation: true,
    };
  }

  // -------------------------------------------------------------
  // 23. General Help
  // -------------------------------------------------------------
  return {
    message: hinglish
      ? `Main MJ hoon, aapka in-app assistant. Aap mujhse pooch sakte hain:\n• *"Mera dashboard kholo"*\n• *"Mera plan batao"*\n• *"Downloads open karo"*\n• *"Ye page kya hai"*\n• *"Free panel dikhao"*`
      : `I'm MJ, your in-app intelligent assistant. Try asking me:\n• *"Open my dashboard"*\n• *"What is my plan?"*\n• *"Open Downloads"*\n• *"Explain this screen"*\n• *"Check Free Panel"*`,
    intent: 'GENERAL_HELP',
    action: null,
    requiresConfirmation: false,
  };
}
