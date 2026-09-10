import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Lazy-initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// System prompt grounding the assistant in DSCWeb Android app architecture
const DSCWEB_SYSTEM_INSTRUCTION = `
You are MJ, the official intelligent in-app Voice & Action Assistant for the "DSCWeb Android Native Application" (Dark Skull Corporation).
You operate INSIDE the native Android client and help users navigate screens, discover actions, read screen contents, manage licenses, and understand system features.

IDENTITY & PERSONALITY:
- Your name is MJ.
- You are not an external internet bot; you are the embedded operator assistant for DSCWeb Android.
- You speak concisely, directly, smartly, and helpfully.
- BILINGUAL FLUENCY (English & Hinglish):
  - You understand natural Hinglish (Hindi written in Roman script) as naturally as English.
  - If the user speaks or writes in Hinglish (e.g., "Mera plan check karo", "Downloads mein le chalo", "Free users dikhao", "Ye page read karke sunao"), reply in crisp, natural Hinglish.
  - If the user speaks in English, reply in English.
  - Always keep spoken sentences smooth and phonetically clean for Android Text-To-Speech (TTS).

ROLE PERMISSIONS & BOUNDARIES:
- Guest: Can navigate public screens (Home, Apps, Products, Downloads, Free Panel, Login). Cannot access user dashboard or admin areas.
- User: Can view personal subscription, change password, copy license key, navigate public screens. Cannot access Admin Dashboard or Owner Center.
- Admin: Can manage users, pending orders, and basic keys. Cannot access Owner Center unless verified as Owner.
- Owner: Has master database root access (Users DB, Free Users, Global UserPass, Live Updates, Admin accounts).
- If an unauthorized user asks for privileged screens or actions, refuse politely in their language (e.g., "Aapke paas Owner privileges nahi hain. Main sirf authorized actions execute kar sakta hoon.").

REGISTERED ACTION CODES:
- OPEN_HOME
- OPEN_APPS
- OPEN_PRODUCTS
- OPEN_DOWNLOADS
- OPEN_FREE_PANEL
- OPEN_ABOUT
- OPEN_CONTACT
- OPEN_PRIVACY
- OPEN_TERMS
- OPEN_USER_LOGIN
- OPEN_ADMIN_LOGIN
- OPEN_USER_DASHBOARD
- OPEN_CHANGE_PASSWORD
- OPEN_ADMIN_DASHBOARD
- OPEN_ADMIN_USERS
- OPEN_ADMIN_ORDERS
- OPEN_ADMIN_MANAGEMENT
- OPEN_OWNER_CENTER
- REFRESH_CURRENT_SCREEN
- COPY_USER_KEY
- START_DOWNLOAD
- LOGOUT

SENSITIVE ACTIONS (Require explicit confirmation: "requiresConfirmation: true"):
- DELETE_USER
- DELETE_KEY
- DELETE_ADMIN
- TOGGLE_MAINTENANCE
- SET_GLOBAL_USERPASS

RESPONSE FORMAT:
You MUST always respond with valid JSON adhering to this schema:
{
  "message": "Natural language response to read or speak to the user (in English or Hinglish matching user language)",
  "intent": "INTENT_NAME or null",
  "action": "REGISTERED_ACTION_CODE or null",
  "requiresConfirmation": false,
  "actionPayload": null
}
`;

// AI Assistant Proxy Endpoint
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const { query, currentScreen, authState, screenContext, liveData, conversationHistory } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required' });
    }

    const ai = getAiClient();

    // Context payload
    const userPrompt = `
User Query: "${query}"
Current Screen: ${currentScreen || 'home'}
User Role: ${authState?.role || 'Guest'} (Username: ${authState?.username || 'None'})
Owner Authorized: ${Boolean(authState?.isOwner)}

Live Application Data:
${JSON.stringify(liveData || {}, null, 2)}

Screen Context:
${JSON.stringify(screenContext || {}, null, 2)}

Recent Conversation:
${JSON.stringify(conversationHistory || [], null, 2)}

Interpret the user's intent, identify if a registered action should be executed, enforce permission boundaries, and return the JSON response adhering to the system instruction.
`;

    if (ai) {
      // Primary model: gemini-3.8-flash (official recommendation), followed by resilient fallbacks
      const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
      for (const model of candidateModels) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Model call timeout')), 4000)
          );
          const response = await Promise.race([
            ai.models.generateContent({
              model,
              contents: userPrompt,
              config: {
                systemInstruction: DSCWEB_SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json',
                temperature: 0.2,
              },
            }),
            timeoutPromise,
          ]);

          const text = response.text;
          if (text) {
            try {
              const parsed = JSON.parse(text);
              return res.json(parsed);
            } catch {
              return res.json({
                message: text,
                intent: 'GENERAL_INFO',
                action: null,
                requiresConfirmation: false,
              });
            }
          }
        } catch {
          // Model unavailable or timed out; try next candidate model or fallback engine
          continue;
        }
      }
    }

    // Fallback rule-based response if GEMINI_API_KEY is not configured or fails
    const q = (query || '')
      .toLowerCase()
      .replace(/[.,?!:;'"()\[\]{}]/g, ' ')
      .replace(/(.)\1{2,}/g, '$1$1')
      .replace(/\s+/g, ' ')
      .trim();

    const isHinglish = /kholo|dikhao|le chalo|kya hai|batao|kaise|karo|chalu|band|suno|mera|meri|mujhe|aapka|theek|nahi|de do|muft|shuru|wapis|peeche|piche|kar do|mat karo/i.test(q);

    // Follow-up affirmation
    if (/^(haan|ha|han|yes|kar do|kardo|proceed|confirm)$/i.test(q)) {
      return res.json({
        message: isHinglish ? 'Confirmation mil gaya hai. Proceed kar raha hoon.' : 'Confirmation received. Proceeding.',
        intent: 'CONFIRM_PROCEED',
        action: null,
        requiresConfirmation: false,
      });
    }

    // Follow-up cancellation
    if (/^(nahi|nahin|no|cancel|mat karo|rehne do)$/i.test(q)) {
      return res.json({
        message: isHinglish ? 'Theek hai, action cancel kar diya gaya hai.' : 'Action cancelled.',
        intent: 'CONFIRM_CANCEL',
        action: null,
        requiresConfirmation: false,
      });
    }

    // Navigate back
    if (q.includes('wapis') || q.includes('peeche') || q.includes('piche') || q.includes('go back')) {
      return res.json({
        message: isHinglish ? 'Peeche chalte hain.' : 'Going back.',
        intent: 'NAVIGATE_BACK',
        action: 'NAVIGATE_BACK',
        requiresConfirmation: false,
      });
    }

    // Explain screen
    if (q.includes('ye kya hai') || q.includes('ye page kya') || q.includes('explain this page') || q.includes('what is this page')) {
      return res.json({
        message: isHinglish
          ? `Aap abhi ${screenContext?.title || currentScreen} par hain. ${screenContext?.hinglishSummary || screenContext?.description || ''}`
          : `You are currently on ${screenContext?.title || currentScreen}. ${screenContext?.readableSummary || screenContext?.description || ''}`,
        intent: 'EXPLAIN_SCREEN',
        action: null,
        requiresConfirmation: false,
      });
    }

    // Explain actions
    if (q.includes('yaha kya kar sakta hu') || q.includes('available actions') || q.includes('what can i do here')) {
      const actionsList = (screenContext?.availableActions || []).map((a: { label: string; description: string }) => `• ${a.label}: ${a.description}`).join('\n');
      return res.json({
        message: isHinglish
          ? `Current screen par available actions:\n${actionsList || 'Navigation and review options'}`
          : `Actions available on this screen:\n${actionsList || 'Navigation and review options'}`,
        intent: 'EXPLAIN_ACTIONS',
        action: null,
        requiresConfirmation: false,
      });
    }

    // Plan & Expiry
    if (q.includes('mera plan') || q.includes('my plan') || q.includes('expire') || q.includes('expiry') || q.includes('kab tak')) {
      if (!authState || authState.role === 'Guest') {
        return res.json({
          message: isHinglish
            ? 'Plan details check karne ke liye pehle login karein. Sign-in screen open kar raha hoon.'
            : 'Please sign in first to access your subscription details.',
          intent: 'NAVIGATE',
          action: 'OPEN_USER_LOGIN',
          requiresConfirmation: false,
        });
      }
      const order = liveData?.userOrder;
      if (order && order.plan) {
        return res.json({
          message: isHinglish
            ? `Aapka active plan ${order.plan} hai. Status: ${order.status}. Expiry: ${order.expiry}.`
            : `Your active plan is ${order.plan} with status ${order.status}. Expiration: ${order.expiry}.`,
          intent: 'CHECK_MY_PLAN',
          action: currentScreen !== 'user_dashboard' ? 'OPEN_USER_DASHBOARD' : null,
          requiresConfirmation: false,
        });
      }
      return res.json({
        message: isHinglish ? 'Aapka User Dashboard open kar raha hoon jahan plan status hai.' : 'Opening your User Dashboard.',
        intent: 'NAVIGATE',
        action: 'OPEN_USER_DASHBOARD',
        requiresConfirmation: false,
      });
    }

    // Maintenance
    if (q.includes('maintenance')) {
      const isMaint = Boolean(liveData?.systemConfig?.maintenance || liveData?.systemConfig?.maintenanceReason);
      return res.json({
        message: isMaint
          ? (isHinglish ? 'System maintenance mode ON hai.' : 'System maintenance mode is currently ON.')
          : (isHinglish ? 'Maintenance mode filhal OFF hai, sabhi services active hain.' : 'Maintenance mode is currently OFF. All services operating normally.'),
        intent: 'CHECK_MAINTENANCE',
        action: null,
        requiresConfirmation: false,
      });
    }

    // Search user
    const searchMatch = q.match(/(?:search|khojo)\s+([a-zA-Z0-9_-]+)/i) || q.match(/([a-zA-Z0-9_-]+)\s+ko\s+search/i);
    if (searchMatch && searchMatch[1] && !['karo', 'kar', 'khol'].includes(searchMatch[1])) {
      const targetUser = searchMatch[1];
      if (authState?.role !== 'Admin') {
        return res.json({
          message: isHinglish ? 'User search ke liye Admin credentials zaroori hain.' : 'Administrator credentials required to search users.',
          intent: 'NAVIGATE',
          action: 'OPEN_ADMIN_LOGIN',
          requiresConfirmation: false,
        });
      }
      return res.json({
        message: isHinglish ? `User "${targetUser}" ko search kar raha hoon.` : `Searching for user "${targetUser}".`,
        intent: 'SEARCH_USER',
        action: 'SEARCH_USER',
        actionPayload: { username: targetUser },
        requiresConfirmation: false,
      });
    }

    // Navigation fast path
    if (q.includes('home') || q.includes('shuru') || q.includes('mukhya') || q.includes('ghar')) {
      return res.json({
        message: isHinglish ? 'Ji, Home screen open kar raha hoon.' : 'Opening Home screen.',
        intent: 'NAVIGATE',
        action: 'OPEN_HOME',
        requiresConfirmation: false,
      });
    }

    if (q.includes('download') || q.includes('apk') || q.includes('le chalo') || q.includes('install')) {
      return res.json({
        message: isHinglish ? 'Yeh lijiye, Download Center open kar raha hoon.' : 'Navigating to Download Center.',
        intent: 'NAVIGATE',
        action: 'OPEN_DOWNLOADS',
        requiresConfirmation: false,
      });
    }

    if (q.includes('app') || q.includes('play store') || q.includes('qr') || q.includes('mindmatrix')) {
      return res.json({
        message: isHinglish ? 'Published Apps screen khol diya hai.' : 'Opening Published Apps section.',
        intent: 'NAVIGATE',
        action: 'OPEN_APPS',
        requiresConfirmation: false,
      });
    }

    if (q.includes('plan') || q.includes('product') || q.includes('vip') || q.includes('price') || q.includes('kitne') || q.includes('rate')) {
      return res.json({
        message: isHinglish ? 'VIP Plans aur pricing details screen khol raha hoon.' : 'Showing VIP Products and subscription tiers.',
        intent: 'NAVIGATE',
        action: 'OPEN_PRODUCTS',
        requiresConfirmation: false,
      });
    }

    if (q.includes('free') || q.includes('slot') || q.includes('muft')) {
      return res.json({
        message: isHinglish ? 'Free Access Panel screen open kar raha hoon.' : 'Opening Free Access Panel.',
        intent: 'NAVIGATE',
        action: 'OPEN_FREE_PANEL',
        requiresConfirmation: false,
      });
    }

    if (q.includes('dashboard') || q.includes('my account') || q.includes('mera account') || q.includes('profile')) {
      if (!authState || authState.role === 'Guest') {
        return res.json({
          message: isHinglish
            ? 'Pehle aapko login karna hoga. Sign-in screen open kar raha hoon.'
            : 'Please sign in first to access your User Dashboard. Opening sign-in screen.',
          intent: 'NAVIGATE',
          action: 'OPEN_USER_LOGIN',
          requiresConfirmation: false,
        });
      }
      return res.json({
        message: isHinglish ? 'Aapka User Dashboard khol diya hai.' : 'Opening your User Dashboard.',
        intent: 'NAVIGATE',
        action: 'OPEN_USER_DASHBOARD',
        requiresConfirmation: false,
      });
    }

    if (q.includes('admin') || q.includes('pending') || q.includes('orders')) {
      if (authState?.role !== 'Admin') {
        return res.json({
          message: isHinglish
            ? 'Admin tools ke liye Admin authorization zaroori hai. Admin login khol raha hoon.'
            : 'Administrator authorization required to access Admin tools. Opening Admin gateway.',
          intent: 'NAVIGATE',
          action: 'OPEN_ADMIN_LOGIN',
          requiresConfirmation: false,
        });
      }
      return res.json({
        message: isHinglish ? 'Admin Console open kar raha hoon.' : 'Opening Admin Console.',
        intent: 'NAVIGATE',
        action: 'OPEN_ADMIN_DASHBOARD',
        requiresConfirmation: false,
      });
    }

    if (q.includes('owner') || q.includes('malik') || q.includes('database')) {
      if (!authState?.isOwner) {
        return res.json({
          message: isHinglish
            ? 'Access Denied: Aapke paas Master Owner privileges nahi hain. Main yeh action execute nahi kar sakta.'
            : 'Access denied: Master Owner privileges are required to access Owner Center.',
          intent: 'PERMISSION_DENIED',
          action: null,
          requiresConfirmation: false,
        });
      }
      return res.json({
        message: isHinglish ? 'Verified Owner: Master Owner Database open kar raha hoon.' : 'Verified Owner: Opening Owner Database.',
        intent: 'NAVIGATE',
        action: 'OPEN_OWNER_CENTER',
        requiresConfirmation: false,
      });
    }

    if (q.includes('copy key') || q.includes('license key') || q.includes('key copy')) {
      return res.json({
        message: isHinglish ? 'License key clipboard par copy kar raha hoon.' : 'Copying license key to clipboard.',
        intent: 'ACTION',
        action: 'COPY_USER_KEY',
        requiresConfirmation: false,
      });
    }

    if (q.includes('refresh') || q.includes('reload') || q.includes('dobara')) {
      return res.json({
        message: isHinglish ? 'Screen data refresh kar raha hoon.' : 'Refreshing screen data.',
        intent: 'ACTION',
        action: 'REFRESH_CURRENT_SCREEN',
        requiresConfirmation: false,
      });
    }

    return res.json({
      message: isHinglish
        ? `Main MJ hoon. Maine aapka sawaal "${query}" samjha. Aap mujhse Downloads, VIP Plans, Free Panel kholne, ya screen padhne ke liye bol sakte hain.`
        : `I am MJ. I understand you're asking about "${query}". You can ask me to open Downloads, view VIP Plans, check the Free Panel, read this page, or open your Dashboard.`,
      intent: 'FALLBACK_HELP',
      action: null,
      requiresConfirmation: false,
    });
  } catch (err: unknown) {
    console.warn('AI assistant request handling notice, applying local fallback:', err instanceof Error ? err.message : err);
    return res.json({
      message: 'I am ready to assist with DSCWeb Android actions. You can ask me to navigate screens, read this page, or view downloads and VIP plans.',
      intent: 'FALLBACK_HELP',
      action: null,
      requiresConfirmation: false,
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DSCWeb Android Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
