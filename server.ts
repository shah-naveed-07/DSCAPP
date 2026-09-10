import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json());

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
You are the in-app Voice & Text AI Assistant for the "DSCWeb Android Native Application" (Dark Skull Corporation).
You operate INSIDE the native Android client and help users navigate, discover actions, read screen contents, and understand cybersecurity & licensing features.

ROLE & BEHAVIOR:
- You are not a generic internet bot. You are the embedded operator assistant for DSCWeb Android.
- You understand screens, navigation intents, registered actions, and role permissions (Guest, User, Admin, Owner).
- You speak concisely, directly, and helpfully.
- When the user wants to navigate, discover, read, or perform an action, you map their intent to a registered action or provide exact contextual answers.
- You support English, Hindi, Urdu, and Hinglish naturally (e.g., "Mujhe downloads mein le chalo" -> OPEN_DOWNLOADS, "Mera plan kab expire hoga?" -> GET_USER_PLAN).

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

SENSITIVE ACTIONS (Require explicit user confirmation):
- DELETE_USER (Requires confirmation)
- DELETE_KEY (Requires confirmation)
- DELETE_ADMIN (Requires confirmation)
- TOGGLE_MAINTENANCE (Requires confirmation)

PERMISSIONS ENFORCEMENT:
- Guest users cannot access User Dashboard or Admin/Owner screens.
- Regular users cannot access Admin Dashboard or Owner Center.
- Admin users without verified Owner privileges cannot access Owner Center.
- You NEVER bypass server-side authentication or execute unregistered actions.

RESPONSE FORMAT:
You MUST always respond with valid JSON adhering to this schema:
{
  "message": "Natural language response to read or speak to the user",
  "intent": "INTENT_NAME or null",
  "action": "REGISTERED_ACTION_CODE or null",
  "requiresConfirmation": false,
  "actionPayload": null
}
`;

// AI Assistant Proxy Endpoint
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const { query, currentScreen, authState, screenContext, conversationHistory } = req.body;

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

Screen Context:
${JSON.stringify(screenContext || {}, null, 2)}

Recent Conversation:
${JSON.stringify(conversationHistory || [], null, 2)}

Interpret the user's intent, identify if a registered action should be executed, enforce permission boundaries, and return the JSON response.
`;

    if (ai) {
      // Primary model: gemini-3.6-flash (recommended by GenAI API), followed by resilient fallbacks
      const candidateModels = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction: DSCWEB_SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          });

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
          // Model unavailable or spike; try next candidate model or fallback engine
          continue;
        }
      }
    }

    // Fallback rule-based response if GEMINI_API_KEY is not configured or fails
    const q = query.toLowerCase().trim();

    // Navigation fast path
    if (q.includes('home') || q.includes('shuru')) {
      return res.json({
        message: 'Opening Home screen.',
        intent: 'NAVIGATE',
        action: 'OPEN_HOME',
        requiresConfirmation: false,
      });
    }
    if (q.includes('download') || q.includes('apk') || q.includes('le chalo')) {
      return res.json({
        message: 'Navigating to Download Center.',
        intent: 'NAVIGATE',
        action: 'OPEN_DOWNLOADS',
        requiresConfirmation: false,
      });
    }
    if (q.includes('app') || q.includes('play store') || q.includes('qr') || q.includes('mindmatrix')) {
      return res.json({
        message: 'Opening Published Apps section.',
        intent: 'NAVIGATE',
        action: 'OPEN_APPS',
        requiresConfirmation: false,
      });
    }
    if (q.includes('plan') || q.includes('product') || q.includes('vip') || q.includes('price')) {
      return res.json({
        message: 'Showing VIP Products and subscription tiers.',
        intent: 'NAVIGATE',
        action: 'OPEN_PRODUCTS',
        requiresConfirmation: false,
      });
    }
    if (q.includes('free') || q.includes('slot')) {
      return res.json({
        message: 'Opening Free Access Panel.',
        intent: 'NAVIGATE',
        action: 'OPEN_FREE_PANEL',
        requiresConfirmation: false,
      });
    }
    if (q.includes('dashboard') || q.includes('my account') || q.includes('mera account')) {
      if (!authState || authState.role === 'Guest') {
        return res.json({
          message: 'Please sign in first to access your User Dashboard. Opening sign-in screen.',
          intent: 'NAVIGATE',
          action: 'OPEN_USER_LOGIN',
          requiresConfirmation: false,
        });
      }
      return res.json({
        message: 'Opening your User Dashboard.',
        intent: 'NAVIGATE',
        action: 'OPEN_USER_DASHBOARD',
        requiresConfirmation: false,
      });
    }
    if (q.includes('admin') || q.includes('orders') || q.includes('pending')) {
      if (authState?.role !== 'Admin') {
        return res.json({
          message: 'Administrator authorization required to access Admin tools. Opening Admin gateway.',
          intent: 'NAVIGATE',
          action: 'OPEN_ADMIN_LOGIN',
          requiresConfirmation: false,
        });
      }
      return res.json({
        message: 'Opening Admin Console.',
        intent: 'NAVIGATE',
        action: 'OPEN_ADMIN_DASHBOARD',
        requiresConfirmation: false,
      });
    }
    if (q.includes('owner')) {
      if (!authState?.isOwner) {
        return res.json({
          message: 'Access denied: Master Owner privileges are required to access Owner Center.',
          intent: 'PERMISSION_DENIED',
          action: null,
          requiresConfirmation: false,
        });
      }
      return res.json({
        message: 'Verified Owner: Opening Owner Database.',
        intent: 'NAVIGATE',
        action: 'OPEN_OWNER_CENTER',
        requiresConfirmation: false,
      });
    }
    if (q.includes('read') || q.includes('what is this') || q.includes('kya hai')) {
      const desc = screenContext?.description || 'You are viewing the DSCWeb Android application.';
      return res.json({
        message: `Currently viewing ${screenContext?.title || currentScreen}: ${desc}`,
        intent: 'READ_SCREEN',
        action: null,
        requiresConfirmation: false,
      });
    }

    return res.json({
      message: `I understand you're asking about "${query}". You can ask me to open Downloads, view VIP Plans, check the Free Panel, read this page, or open your Dashboard.`,
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
