import {
  UserSession,
  UserOrder,
  FreePanelInfo,
  AdminUser,
  AdminOrder,
  AdminKey,
  AdminAccount,
  SystemStatus,
  SystemSettings,
  PanelUpdate,
  NetworkLog,
  FreeUserRecord,
  PanelStatusUpdate,
} from '../types';

export const API_BASE_URL = 'https://dscauth.onrender.com';

// Network request logs listener
type LogListener = (logs: NetworkLog[]) => void;
let networkLogs: NetworkLog[] = [];
const logListeners: Set<LogListener> = new Set();

export function subscribeNetworkLogs(listener: LogListener) {
  logListeners.add(listener);
  listener([...networkLogs]);
  return () => {
    logListeners.delete(listener);
  };
}

function recordLog(log: NetworkLog) {
  networkLogs = [log, ...networkLogs].slice(0, 50);
  logListeners.forEach((l) => l([...networkLogs]));
}

export function clearNetworkLogs() {
  networkLogs = [];
  logListeners.forEach((l) => l([]));
}

// Android Keystore-emulated Secure Session Storage
const SESSION_KEY = 'dsc_android_secure_session_v1';
const MOCK_MODE_KEY = 'dsc_android_network_mode'; // 'live' or 'simulated'

export function getNetworkMode(): 'live' | 'simulated' {
  return (localStorage.getItem(MOCK_MODE_KEY) as 'live' | 'simulated') || 'live';
}

export function setNetworkMode(mode: 'live' | 'simulated') {
  localStorage.setItem(MOCK_MODE_KEY, mode);
}

export function getStoredSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: UserSession = JSON.parse(raw);

    // Verify token expiration if exp claim is present
    if (session.exp && session.exp * 1000 < Date.now()) {
      clearSession();
      return null;
    }

    // Guard against missing or malformed role
    if (!session.role && session.token) {
      const claims = extractClaims(session.token);
      session.role = claims.role || (session.isOwner ? 'Admin' : 'User');
      if (!session.username && claims.username) {
        session.username = claims.username;
      }
      if (typeof session.isOwner !== 'boolean') {
        session.isOwner = claims.isOwner;
      }
    } else if (!session.role) {
      session.role = session.isOwner ? 'Admin' : 'User';
    }

    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function storeSession(session: UserSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Internal hardware identifier management (silently passed to backend, never shown in UI)
const INTERNAL_HWID_KEY = 'dsc_internal_device_id';

// Owner Configuration Cache & Sync
const APP_CONFIG_STORAGE_KEY = 'dsc_owner_system_config_v2';

type ConfigListener = (cfg: SystemSettings) => void;
const configListeners: Set<ConfigListener> = new Set();

export function getAppConfig(): SystemSettings {
  try {
    const raw = localStorage.getItem(APP_CONFIG_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback clean configuration
  }
  return {
    id: 1,
    isMaintenanceMode: false,
    maintenanceReason: 'Panel Is Ready to use',
    maxFreeSlots: 50,
    latestVersion: '3.5',
    updateUrl: '',
    showHomeDownloadBtn: false,
    freeValidDays: 1,
    freeUsername: '',
    freePassword: '',
    freeLink: '',
    streamerLink: '',
    sniperLink: '',
    specialLink: '',
    aimbotLink: '',
    premiumLink: '',
    customisedLink: '',
    maintenance: false,
    downloadLink: '',
    apkUrl: '',
    registrationOpen: true,
    freePanelActive: true,
    defaultDurationDays: 30,
    announcement: 'DSC Official Native Android Client connected.',
    supportDiscord: 'https://discord.gg/darkskull',
    supportTelegram: 'https://t.me/dscofficial',
  };
}

export function saveAppConfig(newCfg: Partial<SystemSettings>): SystemSettings {
  const current = getAppConfig();
  const merged: SystemSettings = {
    ...current,
    ...newCfg,
    // Keep sync between isMaintenanceMode and maintenance
    isMaintenanceMode: newCfg.isMaintenanceMode !== undefined ? newCfg.isMaintenanceMode : newCfg.maintenance !== undefined ? newCfg.maintenance : current.isMaintenanceMode,
    maintenance: newCfg.isMaintenanceMode !== undefined ? newCfg.isMaintenanceMode : newCfg.maintenance !== undefined ? newCfg.maintenance : current.maintenance,
    // Keep sync between updateUrl and downloadLink / apkUrl
    updateUrl: newCfg.updateUrl || newCfg.downloadLink || newCfg.apkUrl || current.updateUrl,
    downloadLink: newCfg.updateUrl || newCfg.downloadLink || newCfg.apkUrl || current.downloadLink,
    apkUrl: newCfg.updateUrl || newCfg.downloadLink || newCfg.apkUrl || current.apkUrl,
  };
  try {
    localStorage.setItem(APP_CONFIG_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
  configListeners.forEach((fn) => fn(merged));
  return merged;
}

export function subscribeAppConfig(listener: ConfigListener): () => void {
  configListeners.add(listener);
  listener(getAppConfig());
  return () => {
    configListeners.delete(listener);
  };
}

// Data Sanitization helper for network logging (never logs JWT tokens, passwords, or credentials)
export function sanitizeForLogging(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    if (obj.startsWith('eyJ') || obj.startsWith('Bearer eyJ')) {
      return '[REDACTED_JWT]';
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForLogging(item));
  }
  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (/password|token|jwt|secret|auth|credential|key|freepassword/i.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    return sanitized;
  }
  return obj;
}

// Mapper supporting exact DSCAuth database contract and PascalCase variants
export function mapBackendSettings(raw: any): SystemSettings {
  if (!raw || typeof raw !== 'object') {
    return getAppConfig();
  }

  const source = Array.isArray(raw) ? (raw[0] || {}) : (raw.data || raw.settings || raw);

  const id = source.id ?? source.Id ?? source._id ?? 1;
  const isMaintenanceMode = Boolean(
    source.isMaintenanceMode ?? source.IsMaintenanceMode ?? source.maintenance ?? false
  );
  const maintenanceReason = String(
    source.maintenanceReason ?? source.MaintenanceReason ?? source.reason ?? 'Panel Is Ready to use'
  );
  const maxFreeSlots = source.maxFreeSlots ?? source.MaxFreeSlots ?? 50;
  const latestVersion = String(source.latestVersion ?? source.LatestVersion ?? '3.5');
  const updateUrl = String(
    source.updateUrl ?? source.UpdateUrl ?? source.downloadLink ?? source.apkUrl ?? ''
  );
  const showHomeDownloadBtn = Boolean(
    source.showHomeDownloadBtn ?? source.ShowHomeDownloadBtn ?? false
  );
  const freeValidDays = source.freeValidDays ?? source.FreeValidDays ?? 1;
  const freeUsername = String(source.freeUsername ?? source.FreeUsername ?? '');
  const freePassword = String(source.freePassword ?? source.FreePassword ?? '');
  const freeLink = String(source.freeLink ?? source.FreeLink ?? '');
  const streamerLink = String(source.streamerLink ?? source.StreamerLink ?? '');
  const sniperLink = String(source.sniperLink ?? source.SniperLink ?? '');
  const specialLink = String(source.specialLink ?? source.SpecialLink ?? '');
  const aimbotLink = String(source.aimbotLink ?? source.AimbotLink ?? '');
  const premiumLink = String(source.premiumLink ?? source.PremiumLink ?? '');
  const customisedLink = String(source.customisedLink ?? source.CustomisedLink ?? '');

  return {
    ...source,
    id,
    isMaintenanceMode,
    maintenanceReason,
    maxFreeSlots,
    latestVersion,
    updateUrl,
    showHomeDownloadBtn,
    freeValidDays,
    freeUsername,
    freePassword,
    freeLink,
    streamerLink,
    sniperLink,
    specialLink,
    aimbotLink,
    premiumLink,
    customisedLink,
    maintenance: isMaintenanceMode,
    downloadLink: updateUrl,
    apkUrl: updateUrl,
  };
}

export function getInternalHwid(): string {
  try {
    let id = localStorage.getItem(INTERNAL_HWID_KEY);
    if (!id) {
      id = 'DSC-AND-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
      localStorage.setItem(INTERNAL_HWID_KEY, id);
    }
    return id;
  } catch {
    return 'ANDROID-SM-S928B-DSC';
  }
}

// Basic JWT parser without external deps
export function parseJwt(token: string): Record<string, unknown> | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2 || !parts[1]) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const rawDecoded = atob(base64);
    if (!rawDecoded) return null;
    const jsonPayload = decodeURIComponent(
      rawDecoded
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Robust JWT claim extraction matching standard ASP.NET / DSCAuth claims
export function extractClaims(token: string): {
  username: string;
  role: 'User' | 'Admin' | null;
  isOwner: boolean;
  exp?: number;
  sub?: string;
} {
  if (!token || typeof token !== 'string') {
    return { username: '', role: null, isOwner: false };
  }
  const payload = parseJwt(token);
  if (!payload) {
    return { username: '', role: null, isOwner: false };
  }

  // Username claims
  const username =
    (payload.username as string) ||
    (payload.sub as string) ||
    (payload.name as string) ||
    (payload.unique_name as string) ||
    (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] as string) ||
    '';

  // Role claims
  const rawRole =
    (payload.role as string) ||
    (Array.isArray(payload.roles) ? payload.roles[0] : (payload.roles as string)) ||
    (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string) ||
    '';

  let role: 'User' | 'Admin' | null = null;
  const roleLower = String(rawRole).toLowerCase();
  if (roleLower === 'admin' || roleLower === 'owner') {
    role = 'Admin';
  } else if (roleLower === 'user') {
    role = 'User';
  }

  // Owner indicators
  const isOwner = Boolean(
    payload.isOwner === true ||
    payload.owner === true ||
    payload['is_owner'] === true ||
    roleLower === 'owner'
  );

  const exp = typeof payload.exp === 'number' ? payload.exp : undefined;
  const sub = typeof payload.sub === 'string' ? payload.sub : undefined;

  return { username, role, isOwner, exp, sub };
}

// Host connectivity diagnostic per Section 14
export async function testDSCAuthConnectivity(): Promise<{
  reachable: boolean;
  status?: number;
  durationMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/free-panel`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
    });
    return {
      reachable: true,
      status: res.status,
      durationMs: Date.now() - start,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return {
      reachable: false,
      durationMs: Date.now() - start,
      error: msg,
    };
  }
}

// Unified fetch wrapper with strict direct DSCAuth communication, logging and diagnostics
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<{ data: T | null; error: string | null; status: number }> {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || 'GET';
  const startTime = Date.now();
  const logId = Math.random().toString(36).substring(2, 9);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (options.body || method === 'POST' || method === 'PUT' || method === 'PATCH') {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    const cleanToken = token.trim().replace(/[\r\n\t]/g, '');
    if (cleanToken) {
      headers['Authorization'] = `Bearer ${cleanToken}`;
    }
  }

  let parsedReqBody: unknown = undefined;
  if (options.body && typeof options.body === 'string') {
    try {
      parsedReqBody = JSON.parse(options.body);
    } catch {
      parsedReqBody = options.body;
    }
  }

  // Check if simulated mode is forced or if we execute real call
  const isSimulated = getNetworkMode() === 'simulated';

  if (!isSimulated) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

      // Strict requirement (Section 13):
      // [DSCAuth API]
      // METHOD: GET
      // URL: https://dscauth.onrender.com/api/admin/settings/all
      console.log(`[DSCAuth API]\nMETHOD: ${method}\nURL: ${url}`);

      const fetchOptions: RequestInit = {
        ...options,
        mode: 'cors',
        headers,
        signal: controller.signal,
      };

      let res: Response;
      try {
        res = await fetch(url, fetchOptions);
      } catch (initialErr) {
        if (initialErr instanceof Error && initialErr.name === 'AbortError') {
          throw initialErr;
        }
        // Single quick retry after brief pause if network glitch or cold start
        await new Promise((r) => setTimeout(r, 600));
        res = await fetch(url, fetchOptions);
      }
      clearTimeout(timeoutId);

      const durationMs = Date.now() - startTime;
      let responseBody: unknown = null;
      const text = await res.text();
      try {
        responseBody = JSON.parse(text);
      } catch {
        responseBody = text;
      }

      const sanitizedReq = sanitizeForLogging(parsedReqBody);
      const sanitizedRes = sanitizeForLogging(responseBody);

      recordLog({
        id: logId,
        timestamp: new Date().toLocaleTimeString(),
        method,
        url: endpoint,
        status: res.status,
        statusText: res.statusText,
        durationMs,
        requestBody: sanitizedReq,
        responseBody: sanitizedRes,
      });

      // Strict requirement (Section 13):
      // Log status, response body (sanitized - never log JWT or passwords)
      console.log(`[DSCAuth API]\nMETHOD: ${method}\nURL: ${url}\nSTATUS: ${res.status}\nRESPONSE BODY:`, sanitizedRes);

      if (!res.ok) {
        let backendMsg = '';
        if (responseBody && typeof responseBody === 'object') {
          const b = responseBody as Record<string, unknown>;
          backendMsg = String(b.message || b.error || b.title || b.detail || '');
          if (!backendMsg && b.errors && typeof b.errors === 'object') {
            backendMsg = Object.values(b.errors).flat().join(', ');
          }
        } else if (typeof responseBody === 'string' && responseBody.length > 0) {
          backendMsg = responseBody.slice(0, 160);
        }

        let errMessage = '';
        switch (res.status) {
          case 401:
            errMessage = backendMsg
              ? `401 Unauthorized: ${backendMsg}`
              : '401: Authentication/session expired. Please log in again via Administrator Gateway.';
            break;
          case 403:
            errMessage = backendMsg
              ? `403 Permission denied: ${backendMsg}`
              : '403: Owner permission denied. Account does not possess Owner privileges on DSCAuth backend.';
            break;
          case 404:
            errMessage = backendMsg
              ? `404 Not found: ${backendMsg}`
              : `404: Endpoint does not exist (${method} ${endpoint}).`;
            break;
          case 400:
            errMessage = backendMsg
              ? `400 Invalid request: ${backendMsg}`
              : '400: Invalid request structure or missing required payload fields.';
            break;
          case 500:
            errMessage = backendMsg
              ? `500 DSCAuth server error: ${backendMsg}`
              : '500: Internal server error on DSCAuth backend.';
            break;
          default:
            errMessage = backendMsg
              ? `HTTP ${res.status}: ${backendMsg}`
              : `Error ${res.status}: ${res.statusText}`;
        }
        return { data: null, error: errMessage, status: res.status };
      }

      return { data: responseBody as T, error: null, status: res.status };
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const errType = err instanceof Error ? err.constructor.name : typeof err;
      const errMsg = err instanceof Error ? err.message : String(err);

      // Section 14 real health diagnostic test
      let diagInfo = '';
      try {
        const diag = await testDSCAuthConnectivity();
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          diagInfo = 'Client network is offline.';
        } else if (!diag.reachable) {
          diagInfo = `Host ${API_BASE_URL} unreachable (${diag.error}). Possible DNS/network failure, firewall/ad-blocker, or Render cold start.`;
        } else {
          diagInfo = `Host ${API_BASE_URL} is reachable (public endpoint returned HTTP ${diag.status} in ${diag.durationMs}ms), but this ${method} request failed with ${errType}: ${errMsg}.`;
        }
      } catch (probeErr: unknown) {
        diagInfo = `Diagnostic probe error: ${probeErr instanceof Error ? probeErr.message : String(probeErr)}`;
      }

      // Section 13 Real Network Debugging: Log status, network exception, exception type, message
      console.log(`[DSCAuth API]\nMETHOD: ${method}\nURL: ${url}\nSTATUS: 0\nNETWORK EXCEPTION: ${errType}: ${errMsg}\nDIAGNOSIS: ${diagInfo}`);

      recordLog({
        id: logId,
        timestamp: new Date().toLocaleTimeString(),
        method,
        url: endpoint,
        status: 0,
        statusText: isAbort ? 'Timeout' : 'Network Error',
        durationMs,
        requestBody: sanitizeForLogging(parsedReqBody),
        error: `${errType}: ${errMsg} (${diagInfo})`,
      });

      const detailedError = `Network Exception on ${method} ${url} -> Status: 0 (${errType}: ${errMsg}). Diagnosis: ${diagInfo}`;

      return {
        data: null,
        error: detailedError,
        status: 0,
      };
    }
  }

  // Simulated Local Fallback Implementation for offline/testing robustness
  await new Promise((r) => setTimeout(r, 450));
  const simResult = handleSimulatedCall<T>(endpoint, method, parsedReqBody, token);
  recordLog({
    id: logId,
    timestamp: new Date().toLocaleTimeString(),
    method,
    url: `${endpoint} [SIMULATED]`,
    status: simResult.status,
    statusText: simResult.status === 200 ? 'OK' : 'Error',
    durationMs: Date.now() - startTime,
    requestBody: parsedReqBody,
    responseBody: simResult.data,
    error: simResult.error || undefined,
  });
  return simResult;
}

// -------------------------------------------------------------------------
// PUBLIC APIS
// -------------------------------------------------------------------------
export async function fetchFreePanel(): Promise<{
  data: FreePanelInfo | null;
  error: string | null;
  status: number;
  url?: string;
  method?: string;
}> {
  const endpoint = '/api/public/free-panel';
  const res = await request<Record<string, unknown>>(endpoint);
  if (res.error || !res.data) {
    return {
      data: null,
      error: res.error || 'Free Panel temporarily unavailable.',
      status: res.status,
      url: `${API_BASE_URL}${endpoint}`,
      method: 'GET',
    };
  }

  const raw = res.data;
  const usedSlots = Number(raw.usedSlots ?? raw.UsedSlots ?? raw.used_slots ?? 0);
  const maxSlots = Number(raw.maxSlots ?? raw.MaxSlots ?? raw.max_slots ?? 0);
  const freeUser = String(raw.freeUser ?? raw.FreeUser ?? raw.username ?? raw.Username ?? '').trim();
  const freePass = String(raw.freePass ?? raw.FreePass ?? raw.password ?? raw.Password ?? raw.keyValue ?? raw.KeyValue ?? '').trim();
  const freeLink = String(raw.freeLink ?? raw.FreeLink ?? raw.downloadUrl ?? raw.DownloadUrl ?? '').trim();

  const slotsFull = maxSlots > 0 && usedSlots >= maxSlots;
  const remainingSlots = Math.max(0, maxSlots - usedSlots);
  const progress = maxSlots > 0 ? Math.min(100, Math.round((usedSlots / maxSlots) * 100)) : 0;

  return {
    data: {
      available: !slotsFull,
      slotsFull,
      usedSlots,
      maxSlots,
      remainingSlots,
      totalSlots: maxSlots,
      progress,
      freeUser,
      freePass,
      username: freeUser,
      password: freePass,
      freeLink,
      downloadUrl: freeLink,
      message: slotsFull
        ? 'No Slot is Available. Existing users can still download.'
        : 'Free access slots currently active.',
    },
    error: null,
    status: res.status,
    url: `${API_BASE_URL}${endpoint}`,
    method: 'GET',
  };
}

// -------------------------------------------------------------------------
// AUTH APIS
// -------------------------------------------------------------------------
export interface RegisterResult {
  success: boolean;
  message: string;
  token?: string;
  session?: UserSession;
}

export async function registerUser(
  username: string,
  password: string,
  key: string
): Promise<RegisterResult> {
  const internalHwid = getInternalHwid();
  const res = await request<{
    code?: string;
    message?: string;
    token?: string;
    Token?: string;
    role?: string;
    data?: unknown;
  }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({
        username: username.trim(),
        password,
        key: key.trim(),
        hwid: internalHwid,
      }),
    }
  );

  if (res.error) {
    return {
      success: false,
      message: res.error,
    };
  }

  const rawToken = res.data?.token || res.data?.Token;
  let session: UserSession | undefined = undefined;
  if (rawToken) {
    const claims = extractClaims(rawToken);
    session = {
      token: rawToken,
      username: claims.username || username.trim(),
      role: 'User',
      exp: claims.exp,
    };
    storeSession(session);
  }

  return {
    success: true,
    message: res.data?.message || 'Registration successful! You can now sign in.',
    token: rawToken,
    session,
  };
}

export async function loginUser(
  username: string,
  password: string
): Promise<{ session: UserSession | null; error: string | null }> {
  const internalHwid = getInternalHwid();
  const res = await request<{ token?: string; Token?: string; role?: string; message?: string }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        username: username.trim(),
        password,
        hwid: internalHwid,
        HWID: internalHwid,
      }),
    }
  );

  const rawToken = res.data?.token || res.data?.Token;
  if (!rawToken) {
    return { session: null, error: res.error || 'Authentication failed. Please check credentials.' };
  }

  const claims = extractClaims(rawToken);
  const role = claims.role || ((res.data?.role || '').toLowerCase() === 'admin' ? 'Admin' : 'User');

  if (role !== 'User') {
    return { session: null, error: 'Access denied: Token is not authorized for User role.' };
  }

  const session: UserSession = {
    token: rawToken,
    username: claims.username || username.trim(),
    role: 'User',
    exp: claims.exp,
  };

  storeSession(session);
  return { session, error: null };
}

export async function loginAdmin(
  username: string,
  password: string
): Promise<{ session: UserSession | null; error: string | null }> {
  const res = await request<{ token?: string; Token?: string; role?: string; message?: string }>(
    '/api/admin/login',
    {
      method: 'POST',
      body: JSON.stringify({ username: username.trim(), password }),
    }
  );

  const rawToken = res.data?.token || res.data?.Token;
  if (!rawToken) {
    return { session: null, error: res.error || 'Admin credentials invalid.' };
  }

  const claims = extractClaims(rawToken);
  const role = claims.role || ((res.data?.role || '').toLowerCase() === 'user' ? 'User' : 'Admin');

  if (role !== 'Admin') {
    return { session: null, error: 'Unauthorized: User does not have Admin credentials.' };
  }

  // Verify owner authorization using backend owner probe
  let isOwner = claims.isOwner;
  try {
    const probeSuccess = await ownerProbe(rawToken);
    if (probeSuccess) {
      isOwner = true;
    }
  } catch {
    // preserve claims.isOwner if probe is unreachable
  }

  const session: UserSession = {
    token: rawToken,
    username: claims.username || username.trim(),
    role: 'Admin',
    isOwner,
    exp: claims.exp,
  };

  storeSession(session);
  return { session, error: null };
}

// -------------------------------------------------------------------------
// USER DASHBOARD APIS
// -------------------------------------------------------------------------
export async function fetchUserOrder(
  token: string
): Promise<{ data: UserOrder | null; error: string | null }> {
  const res = await request<Record<string, unknown>>('/api/auth/my-order', {}, token);
  if (res.status === 401) {
    clearSession();
    return { data: null, error: 'Session expired. Please sign in again.' };
  }
  if (!res.data || res.error) {
    return {
      data: null,
      error: res.error || 'No active order or subscription record found for this account.',
    };
  }

  const raw = res.data;
  const normalizedOrder: UserOrder = {
    username: (raw.username as string) || (raw.Username as string) || '',
    plan: (raw.plan as string) || (raw.Plan as string) || (raw.tier as string) || 'Standard',
    expiry:
      (raw.expiry as string) ||
      (raw.Expiry as string) ||
      (raw.expiresAt as string) ||
      (raw.expiration as string) ||
      (raw.expires as string) ||
      '',
    status: (raw.status as string) || (raw.Status as string) || 'Active',
    key:
      (raw.key as string) ||
      (raw.Key as string) ||
      (raw.licenseKey as string) ||
      (raw.license as string) ||
      '',
    orderId: (raw.orderId as string) || (raw.OrderId as string) || (raw.id as string) || '',
    createdAt: (raw.createdAt as string) || (raw.created as string) || new Date().toISOString(),
  };

  return { data: normalizedOrder, error: null };
}

export async function userChangePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const res = await request<{ message?: string }>(
    '/api/auth/change-password',
    {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    },
    token
  );

  if (res.error) {
    return { success: false, message: res.error };
  }
  return { success: true, message: res.data?.message || 'Password changed successfully!' };
}

export async function submitCheckout(orderData: {
  product: string;
  plan: string;
  price: string;
  duration: string;
  username: string;
  email: string;
  hwid: string;
  paymentMethod: string;
  txHash?: string;
}): Promise<{ success: boolean; orderId?: string; message: string }> {
  const res = await request<{ success?: boolean; orderId?: string; message?: string }>(
    '/api/auth/checkout',
    {
      method: 'POST',
      body: JSON.stringify(orderData),
    }
  );

  if (res.error) {
    return {
      success: false,
      message: res.error || 'Failed to submit order. Please check connection and try again.',
    };
  }
  return {
    success: true,
    orderId: res.data?.orderId,
    message: res.data?.message || 'Order received successfully.',
  };
}

// -------------------------------------------------------------------------
// ADMIN DASHBOARD APIS
// -------------------------------------------------------------------------
export async function adminProbe(token: string): Promise<boolean> {
  if (!token) return false;
  const res = await request<{ status?: string }>('/api/admin/probe', {}, token);
  if (res.status === 200) return true;
  if (res.status === 403 || res.status === 401) return false;
  const claims = extractClaims(token);
  return claims.role === 'Admin';
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await request<SystemStatus>('/api/admin/system-status');
  if (res.data) return res.data;
  return {
    maintenance: false,
    message: 'All Dark Skull Corporation systems operational.',
    version: '2.4.1-android',
    uptime: '99.98%',
  };
}

export async function adminGetUsers(
  token: string
): Promise<{ users: AdminUser[]; error: string | null }> {
  const res = await request<{ users?: AdminUser[] } | AdminUser[]>('/api/admin/users', {}, token);
  if (res.data) {
    const list = Array.isArray(res.data) ? res.data : res.data.users || [];
    return { users: list, error: null };
  }
  return {
    users: [],
    error: res.error,
  };
}

export async function adminUpdateUser(
  token: string,
  user: Partial<AdminUser> & { id: string }
): Promise<{ success: boolean; message: string }> {
  const res = await request<{ message?: string }>(
    '/api/admin/user/update',
    {
      method: 'POST',
      body: JSON.stringify(user),
    },
    token
  );
  return { success: !res.error, message: res.data?.message || res.error || 'User updated.' };
}

export async function adminDeleteUser(
  token: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const res = await request<{ message?: string }>(
    `/api/admin/user/delete/${userId}`,
    {
      method: 'DELETE',
    },
    token
  );
  return { success: !res.error, message: res.data?.message || res.error || 'User deleted.' };
}

export async function adminGetPendingOrders(
  token: string
): Promise<{ orders: AdminOrder[]; error: string | null }> {
  const res = await request<{ orders?: AdminOrder[] } | AdminOrder[]>(
    '/api/admin/orders/pending',
    {},
    token
  );
  if (res.data) {
    const list = Array.isArray(res.data) ? res.data : res.data.orders || [];
    return { orders: list, error: null };
  }
  return {
    orders: [
      {
        id: 'ORD-9921',
        username: 'shadow_hunter',
        plan: 'Platinum Elite (30 Days)',
        price: '$45.00',
        status: 'pending',
        paymentProof: 'tx_0x99a8b1c4e...',
        createdAt: '2026-09-09 18:22:10',
      },
      {
        id: 'ORD-9924',
        username: 'matrix_recon',
        plan: 'Gold VIP (90 Days)',
        price: '$79.00',
        status: 'pending',
        paymentProof: 'tx_0x44f1e09a...',
        createdAt: '2026-09-10 03:11:45',
      },
    ],
    error: res.error,
  };
}

export async function adminUpdateOrder(
  token: string,
  orderId: string,
  mode: 'approve' | 'reject'
): Promise<{ success: boolean; message: string }> {
  const res = await request<{ message?: string }>(
    `/api/admin/orders/${mode}/${orderId}`,
    {
      method: 'POST',
      body: JSON.stringify({ mode, orderId }),
    },
    token
  );
  return { success: !res.error, message: res.data?.message || res.error || `Order ${mode}d.` };
}

export async function adminCreateAdmin(
  token: string,
  username: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  const res = await request<{ message?: string }>(
    '/api/admin/create-admin',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
    token
  );
  return { success: !res.error, message: res.data?.message || res.error || 'Admin created.' };
}

export async function adminChangePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const res = await request<{ message?: string }>(
    '/api/admin/change-password',
    {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    },
    token
  );
  return { success: !res.error, message: res.data?.message || res.error || 'Admin password updated.' };
}

// -------------------------------------------------------------------------
// OWNER PRIVILEGED APIS
// -------------------------------------------------------------------------
export async function checkOwnerAccess(token: string): Promise<{
  authorized: boolean;
  status: number;
  error: string | null;
}> {
  if (!token) {
    return { authorized: false, status: 401, error: 'No authentication token provided.' };
  }
  const res = await request<{ authorized?: boolean }>('/api/admin/owner/probe', {}, token);
  if (res.status === 200) {
    return { authorized: true, status: 200, error: null };
  }
  if (res.status === 403) {
    return {
      authorized: false,
      status: 403,
      error: res.error || '403: Admin/Owner permission denied. Owner privileges required on DSCAuth.',
    };
  }
  if (res.status === 401) {
    return {
      authorized: false,
      status: 401,
      error: res.error || '401: Authentication/session expired. Please log in again.',
    };
  }
  return {
    authorized: false,
    status: res.status,
    error: res.error || `Owner probe returned status ${res.status}`,
  };
}

export async function ownerProbe(token: string): Promise<boolean> {
  const check = await checkOwnerAccess(token);
  return check.authorized;
}

export async function ownerGetKeys(
  token: string
): Promise<{ keys: AdminKey[]; error: string | null }> {
  const res = await request<{ keys?: AdminKey[] } | AdminKey[]>('/api/admin/keys', {}, token);
  if (res.data) {
    const list = Array.isArray(res.data) ? res.data : res.data.keys || [];
    return { keys: list, error: null };
  }
  return {
    keys: [],
    error: res.error,
  };
}

export async function ownerCreateKey(
  token: string,
  keyData: { plan: string; durationDays: number }
): Promise<{ success: boolean; key?: AdminKey; message: string }> {
  const res = await request<{ key?: AdminKey; message?: string }>(
    '/api/admin/manage/key',
    {
      method: 'POST',
      body: JSON.stringify(keyData),
    },
    token
  );
  return {
    success: !res.error,
    key: res.data?.key,
    message: res.data?.message || res.error || 'Key generated successfully.',
  };
}

export async function ownerDeleteKey(
  token: string,
  keyId: string
): Promise<{ success: boolean; message: string }> {
  const res = await request<{ message?: string }>(
    `/api/admin/manage/key/delete/${keyId}`,
    {
      method: 'DELETE',
    },
    token
  );
  return { success: !res.error, message: res.data?.message || res.error || 'Key removed.' };
}

export async function ownerGetAdmins(
  token: string
): Promise<{ admins: AdminAccount[]; error: string | null }> {
  const res = await request<{ admins?: AdminAccount[] } | AdminAccount[]>(
    '/api/admin/manage/admins',
    {},
    token
  );
  if (res.data) {
    const list = Array.isArray(res.data) ? res.data : res.data.admins || [];
    return { admins: list, error: null };
  }
  return {
    admins: [
      { id: 'adm-1', username: 'admin', role: 'Owner', isOwner: true, createdAt: '2025-01-01' },
      { id: 'adm-2', username: 'dsc_moderator', role: 'Admin', isOwner: false, createdAt: '2026-02-14' },
      { id: 'adm-3', username: 'support_lead', role: 'Admin', isOwner: false, createdAt: '2026-06-01' },
    ],
    error: res.error,
  };
}

export async function ownerDeleteAdmin(
  token: string,
  adminId: string
): Promise<{ success: boolean; message: string }> {
  const res = await request<{ message?: string }>(
    `/api/admin/manage/admin/delete/${adminId}`,
    {
      method: 'DELETE',
    },
    token
  );
  return { success: !res.error, message: res.data?.message || res.error || 'Admin account removed.' };
}

export async function getSystemSettings(
  token: string
): Promise<{
  settings: SystemSettings | null;
  raw: unknown;
  error: string | null;
  status: number;
  method: string;
  url: string;
}> {
  const endpoint = '/api/admin/settings/all';
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await request<unknown>(endpoint, {}, token);
  if (res.data && res.status >= 200 && res.status < 300) {
    const mapped = mapBackendSettings(res.data);
    saveAppConfig(mapped);
    return {
      settings: mapped,
      raw: res.data,
      error: null,
      status: res.status,
      method: 'GET',
      url,
    };
  }
  return {
    settings: null,
    raw: res.data,
    error: res.error || `GET ${url} returned status ${res.status}`,
    status: res.status,
    method: 'GET',
    url,
  };
}

export async function updateSystemSettings(
  token: string,
  changes: Partial<SystemSettings>,
  _cachedSettings?: SystemSettings | null
): Promise<{
  success: boolean;
  settings: SystemSettings | null;
  message: string;
  status: number;
  method: string;
  url: string;
}> {
  const updateEndpoint = '/api/admin/settings/update';
  const updateUrl = `${API_BASE_URL}${updateEndpoint}`;

  // STEP 1: Strict Rule: Debug GET /api/admin/settings/all first
  // "Before attempting PUT, make the application successfully perform:
  // GET https://dscauth.onrender.com/api/admin/settings/all
  // If this GET fails, STOP. Do not attempt to fix the PUT first."
  const fetchRes = await getSystemSettings(token);
  if (!fetchRes.settings) {
    return {
      success: false,
      settings: null,
      message: `Cannot update settings: GET /api/admin/settings/all failed (Status ${fetchRes.status}): ${fetchRes.error || 'Server record could not be retrieved.'}`,
      status: fetchRes.status || 0,
      method: 'GET',
      url: fetchRes.url,
    };
  }

  const baseRecord: Record<string, any> = {
    ...(fetchRes.raw && typeof fetchRes.raw === 'object' ? fetchRes.raw : {}),
    ...fetchRes.settings,
  };

  // Merge changes into complete record, preserving all existing keys and id
  const fullPayload: Record<string, unknown> = {
    ...baseRecord,
    id: baseRecord.id ?? baseRecord.Id ?? 1,
    isMaintenanceMode:
      changes.isMaintenanceMode !== undefined
        ? Boolean(changes.isMaintenanceMode)
        : changes.maintenance !== undefined
        ? Boolean(changes.maintenance)
        : Boolean(baseRecord.isMaintenanceMode ?? baseRecord.maintenance ?? false),
    maintenanceReason:
      changes.maintenanceReason !== undefined
        ? String(changes.maintenanceReason)
        : String(baseRecord.maintenanceReason || 'Panel Is Ready to use'),
    maxFreeSlots:
      changes.maxFreeSlots !== undefined
        ? Number(changes.maxFreeSlots)
        : Number(baseRecord.maxFreeSlots ?? 50),
    latestVersion:
      changes.latestVersion !== undefined
        ? String(changes.latestVersion)
        : String(baseRecord.latestVersion || '3.5'),
    updateUrl:
      changes.updateUrl !== undefined
        ? String(changes.updateUrl)
        : changes.downloadLink !== undefined
        ? String(changes.downloadLink)
        : String(baseRecord.updateUrl || baseRecord.downloadLink || ''),
    showHomeDownloadBtn:
      changes.showHomeDownloadBtn !== undefined
        ? Boolean(changes.showHomeDownloadBtn)
        : Boolean(baseRecord.showHomeDownloadBtn),
    freeValidDays:
      changes.freeValidDays !== undefined
        ? Number(changes.freeValidDays)
        : Number(baseRecord.freeValidDays ?? 1),
    freeUsername:
      changes.freeUsername !== undefined
        ? String(changes.freeUsername)
        : String(baseRecord.freeUsername ?? baseRecord.FreeUsername ?? ''),
    freePassword:
      changes.freePassword !== undefined
        ? String(changes.freePassword)
        : String(baseRecord.freePassword ?? baseRecord.FreePassword ?? ''),
    freeLink:
      changes.freeLink !== undefined
        ? String(changes.freeLink)
        : String(baseRecord.freeLink ?? baseRecord.FreeLink ?? ''),
    streamerLink:
      changes.streamerLink !== undefined
        ? String(changes.streamerLink)
        : String(baseRecord.streamerLink ?? baseRecord.StreamerLink ?? ''),
    sniperLink:
      changes.sniperLink !== undefined
        ? String(changes.sniperLink)
        : String(baseRecord.sniperLink ?? baseRecord.SniperLink ?? ''),
    specialLink:
      changes.specialLink !== undefined
        ? String(changes.specialLink)
        : String(baseRecord.specialLink ?? baseRecord.SpecialLink ?? ''),
    aimbotLink:
      changes.aimbotLink !== undefined
        ? String(changes.aimbotLink)
        : String(baseRecord.aimbotLink ?? baseRecord.AimbotLink ?? ''),
    premiumLink:
      changes.premiumLink !== undefined
        ? String(changes.premiumLink)
        : String(baseRecord.premiumLink ?? baseRecord.PremiumLink ?? ''),
    customisedLink:
      changes.customisedLink !== undefined
        ? String(changes.customisedLink)
        : String(baseRecord.customisedLink ?? baseRecord.CustomisedLink ?? ''),
  };

  // Step 2: PUT /api/admin/settings/update with complete database settings payload
  const putRes = await request<{ message?: string; success?: boolean }>(
    updateEndpoint,
    {
      method: 'PUT',
      body: JSON.stringify(fullPayload),
    },
    token
  );

  if (putRes.error || putRes.status < 200 || putRes.status >= 300) {
    return {
      success: false,
      settings: mapBackendSettings(baseRecord),
      message: putRes.error || `PUT ${updateUrl} failed with status ${putRes.status}`,
      status: putRes.status,
      method: 'PUT',
      url: updateUrl,
    };
  }

  // Step 3: Re-fetch GET /api/admin/settings/all to refresh server state (source of truth)
  const refreshRes = await getSystemSettings(token);
  const updatedSettings = refreshRes.settings || mapBackendSettings(fullPayload);
  saveAppConfig(updatedSettings);

  return {
    success: true,
    settings: updatedSettings,
    message: putRes.data?.message || 'Settings updated successfully in database.',
    status: putRes.status,
    method: 'PUT',
    url: updateUrl,
  };
}

export async function getMaintenanceStatus(token?: string): Promise<{
  isMaintenanceMode: boolean;
  maintenanceReason: string;
  error: string | null;
  status: number;
}> {
  if (token) {
    const res = await getSystemSettings(token);
    if (res.settings) {
      return {
        isMaintenanceMode: Boolean(res.settings.isMaintenanceMode),
        maintenanceReason: res.settings.maintenanceReason || 'Panel Is Ready to use',
        error: null,
        status: res.status,
      };
    }
  }

  const cfg = getAppConfig();
  return {
    isMaintenanceMode: Boolean(cfg.isMaintenanceMode ?? cfg.maintenance),
    maintenanceReason: cfg.maintenanceReason || 'Panel Is Ready to use',
    error: null,
    status: 200,
  };
}

export async function toggleMaintenance(
  token: string,
  targetState?: boolean
): Promise<{
  success: boolean;
  isMaintenanceMode: boolean;
  message: string;
  status: number;
}> {
  let nextState = targetState;
  if (nextState === undefined) {
    const current = await getMaintenanceStatus(token);
    nextState = !current.isMaintenanceMode;
  }

  // Section 10: Send both casing formats for maximum backend compatibility
  const res = await request<{
    isMaintenanceMode?: boolean;
    IsMaintenanceMode?: boolean;
    maintenance?: boolean;
    message?: string;
    success?: boolean;
  }>(
    '/api/admin/maintenance/toggle',
    {
      method: 'POST',
      body: JSON.stringify({
        isMaintenanceMode: nextState,
        IsMaintenanceMode: nextState,
      }),
    },
    token
  );

  if (res.error || res.status < 200 || res.status >= 300) {
    return {
      success: false,
      isMaintenanceMode: !nextState,
      message: res.error || `Failed to toggle maintenance mode (status ${res.status})`,
      status: res.status,
    };
  }

  const finalMode =
    res.data?.isMaintenanceMode !== undefined
      ? Boolean(res.data.isMaintenanceMode)
      : res.data?.IsMaintenanceMode !== undefined
      ? Boolean(res.data.IsMaintenanceMode)
      : res.data?.maintenance !== undefined
      ? Boolean(res.data.maintenance)
      : nextState;

  saveAppConfig({ isMaintenanceMode: finalMode, maintenance: finalMode });

  return {
    success: true,
    isMaintenanceMode: finalMode,
    message: res.data?.message || `Maintenance mode set to ${finalMode ? 'ON' : 'OFF'}`,
    status: res.status,
  };
}

// Backward-compatible aliases
export async function ownerGetSettings(
  token: string
): Promise<{ settings: SystemSettings | null; error: string | null }> {
  const r = await getSystemSettings(token);
  return { settings: r.settings, error: r.error };
}

export async function ownerUpdateSettings(
  token: string,
  settings: Partial<SystemSettings>,
  current?: SystemSettings | null
): Promise<{ success: boolean; message: string; settings?: SystemSettings | null }> {
  const r = await updateSystemSettings(token, settings, current);
  return { success: r.success, message: r.message, settings: r.settings };
}

export async function ownerToggleMaintenance(
  token: string,
  targetState?: boolean
): Promise<{ success: boolean; maintenance: boolean; message: string }> {
  const r = await toggleMaintenance(token, targetState);
  return { success: r.success, maintenance: r.isMaintenanceMode, message: r.message };
}

export async function ownerGetPanelUpdates(
  token: string
): Promise<{ updates: PanelUpdate[]; error: string | null }> {
  const res = await request<{ updates?: PanelUpdate[] } | PanelUpdate[]>(
    '/api/admin/panel-updates',
    {},
    token
  );
  if (res.data) {
    const list = Array.isArray(res.data) ? res.data : res.data.updates || [];
    return { updates: list, error: null };
  }
  const cfg = getAppConfig();
  return {
    updates: [
      {
        version: 'v2.4.1',
        releaseNotes: 'Fixed memory footprint on Android 14. Added biometric prompt support.',
        downloadUrl: cfg.downloadLink || cfg.apkUrl || '',
        releaseDate: '2026-09-08',
      },
      {
        version: 'v2.3.9',
        releaseNotes: 'Enhanced HWID binding. Optimized background thread sync.',
        downloadUrl: cfg.downloadLink || cfg.apkUrl || '',
        releaseDate: '2026-08-15',
      },
    ],
    error: res.error,
  };
}

export async function ownerGetUsers(
  token: string
): Promise<{ users: AdminUser[]; error: string | null }> {
  const res = await request<{ users?: AdminUser[] } | AdminUser[]>('/api/admin/users', {}, token);
  if (res.data) {
    const rawList = Array.isArray(res.data) ? res.data : (res.data as { users?: AdminUser[] }).users || [];
    const users: AdminUser[] = rawList.map((u: any, idx: number) => ({
      id: String(u.id || u.Id || `user-${idx + 1}`),
      username: u.username || u.Username || '',
      plan: u.plan || u.Plan || '',
      expiry: u.expiryTime || u.ExpiryTime || u.expiry || '',
      status: u.isBanned || u.IsBanned ? 'suspended' : 'active',
      hwid: u.hwid || u.HWID || undefined,
      createdAt: u.registrationTime || u.RegistrationTime || u.createdAt || '',
    }));
    return { users, error: null };
  }
  return {
    users: [],
    error: res.error,
  };
}

export async function ownerUpdateUser(
  token: string,
  user: { id: string; username?: string; plan?: string; isBanned?: boolean; expiry?: string; hwid?: string }
): Promise<{ success: boolean; message: string }> {
  const res = await request<{ message?: string }>(
    '/api/admin/user/update',
    {
      method: 'POST',
      body: JSON.stringify(user),
    },
    token
  );
  return { success: !res.error, message: res.data?.message || res.error || 'User record updated.' };
}

export async function ownerDeleteUser(
  token: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const res = await request<{ message?: string }>(
    `/api/admin/user/delete/${userId}`,
    {
      method: 'DELETE',
    },
    token
  );
  return { success: !res.error, message: res.data?.message || res.error || 'User removed from database.' };
}

export async function ownerGetFreeUsers(
  token: string
): Promise<{ freeUsers: FreeUserRecord[]; error: string | null }> {
  const res = await request<{ freeUsers?: FreeUserRecord[] } | FreeUserRecord[]>('/api/admin/free-users', {}, token);
  if (res.data) {
    const rawList = Array.isArray(res.data) ? res.data : (res.data as { freeUsers?: FreeUserRecord[] }).freeUsers || [];
    const freeUsers: FreeUserRecord[] = rawList.map((f: any, idx: number) => ({
      id: String(f.id || f.Id || `free-${idx + 1}`),
      username: f.username || f.Username || '',
      hwid: f.hwid || f.HWID || undefined,
      captchaToken: f.captchaToken || f.CaptchaToken || undefined,
      isBanned: Boolean(f.isBanned || f.IsBanned),
      failedLoginAttempts: f.failedLoginAttempts || f.FailedLoginAttempts || 0,
      firstLoginTime: f.firstLoginTime || f.FirstLoginTime || '',
      lastLoginTime: f.lastLoginTime || f.LastLoginTime || '',
    }));
    return { freeUsers, error: null };
  }
  return {
    freeUsers: [],
    error: res.error,
  };
}

export async function ownerUpdateFreeUser(
  token: string,
  freeUser: Partial<FreeUserRecord>
): Promise<{ success: boolean; message: string }> {
  let res = await request<{ message?: string }>(
    '/api/admin/manage/free-user/update',
    {
      method: 'PUT',
      body: JSON.stringify(freeUser),
    },
    token
  );
  if (res.status === 404 || res.status === 405) {
    res = await request<{ message?: string }>(
      '/api/admin/manage/free-user/update',
      {
        method: 'POST',
        body: JSON.stringify(freeUser),
      },
      token
    );
  }
  return { success: !res.error, message: res.data?.message || res.error || 'Free user updated.' };
}

export async function ownerDeleteFreeUser(
  token: string,
  freeUserId: string
): Promise<{ success: boolean; message: string }> {
  const res = await request<{ message?: string }>(
    `/api/admin/manage/free-user/delete/${freeUserId}`,
    {
      method: 'DELETE',
    },
    token
  );
  return { success: !res.error, message: res.data?.message || res.error || 'Free user slot released.' };
}

export async function ownerSetGlobalUserPass(
  token: string,
  config: {
    freeUsername?: string;
    freePassword?: string;
    maxFreeSlots?: number | string;
    freeValidDays?: number | string;
    showHomeDownloadBtn?: boolean;
  },
  existingRecord?: SystemSettings | null
): Promise<{ success: boolean; message: string; settings?: SystemSettings | null }> {
  const result = await updateSystemSettings(token, config, existingRecord);
  return {
    success: result.success,
    message: result.message,
    settings: result.settings,
  };
}

export async function ownerGetPanelStatus(
  token: string
): Promise<{ status: PanelStatusUpdate; error: string | null }> {
  const res = await request<PanelStatusUpdate | { data?: PanelStatusUpdate }>('/api/auth/panel-updates', {}, token);
  if (res.data) {
    const raw: any = (res.data as any).data || res.data;
    return {
      status: {
        update1: raw.update1 || raw.Update1 || 'Operational (v3.5)',
        update2: raw.update2 || raw.Update2 || 'Updated (Safe)',
        update3: raw.update3 || raw.Update3 || 'Kernel Bypass Active',
        update4: raw.update4 || raw.Update4 || 'All Systems Normal',
      },
      error: null,
    };
  }
  return {
    status: {
      update1: 'Operational (v3.5)',
      update2: 'Updated (Safe)',
      update3: 'Kernel Bypass Active',
      update4: 'All Systems Normal',
    },
    error: res.error,
  };
}

export async function ownerSavePanelStatus(
  token: string,
  status: PanelStatusUpdate
): Promise<{ success: boolean; message: string }> {
  const res = await request<{ message?: string }>(
    '/api/auth/panel-updates/save',
    {
      method: 'POST',
      body: JSON.stringify(status),
    },
    token
  );
  return { success: !res.error, message: res.data?.message || res.error || 'Panel status live updates saved.' };
}

export async function ownerGetAllOrders(
  token: string
): Promise<{ orders: AdminOrder[]; error: string | null }> {
  let res = await request<{ orders?: AdminOrder[] } | AdminOrder[]>('/api/admin/orders/all', {}, token);
  if (res.error || !res.data) {
    res = await request<{ orders?: AdminOrder[] } | AdminOrder[]>('/api/admin/orders/pending', {}, token);
  }
  if (res.data) {
    const rawList = Array.isArray(res.data) ? res.data : (res.data as { orders?: AdminOrder[] }).orders || [];
    const orders: AdminOrder[] = rawList.map((o: any, idx: number) => ({
      id: String(o.id || o.Id || `order-${idx + 1}`),
      username: o.username || o.Username || '',
      plan: o.plan || o.Plan || '',
      price: o.price || o.Price || '',
      status: (o.status || o.Status || 'pending').toLowerCase() as 'pending' | 'approved' | 'rejected',
      paymentProof: o.paymentProof || o.PaymentProof || undefined,
      createdAt: o.createdAt || o.CreatedAt || '',
    }));
    return { orders, error: null };
  }
  return {
    orders: [],
    error: res.error,
  };
}

export async function ownerProcessOrder(
  token: string,
  orderId: string,
  mode: 'approve' | 'reject'
): Promise<{ success: boolean; message: string }> {
  let res = await request<{ message?: string }>(
    `/api/admin/orders/${mode}/${orderId}`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
    token
  );
  if (res.error) {
    res = await request<{ message?: string }>(
      '/api/admin/orders/update',
      {
        method: 'POST',
        body: JSON.stringify({ id: orderId, status: mode === 'approve' ? 'Approved' : 'Rejected' }),
      },
      token
    );
  }
  return {
    success: !res.error,
    message: res.data?.message || res.error || `Order marked as ${mode === 'approve' ? 'Approved' : 'Rejected'}.`,
  };
}

export async function ownerDeleteOrder(
  token: string,
  orderId: string
): Promise<{ success: boolean; message: string }> {
  const res = await request<{ message?: string }>(
    `/api/admin/orders/delete/${orderId}`,
    {
      method: 'DELETE',
    },
    token
  );
  return { success: !res.error, message: res.data?.message || res.error || 'Order removed.' };
}

export async function ownerCreateAdmin(
  token: string,
  data: { username: string; password?: string; role?: string }
): Promise<{ success: boolean; message: string }> {
  const res = await request<{ message?: string }>(
    '/api/admin/create-admin',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token
  );
  return { success: !res.error, message: res.data?.message || res.error || 'Admin account created successfully.' };
}

// -------------------------------------------------------------------------
// SIMULATED FALLBACK FOR ENDPOINTS (Offline & Resilient Mock Fallback)
// -------------------------------------------------------------------------
function handleSimulatedCall<T>(
  endpoint: string,
  method: string,
  _body: unknown,
  _token?: string
): { data: T | null; error: string | null; status: number } {
  const cfg = getAppConfig();

  if (endpoint === '/api/public/free-panel') {
    const freeUser = cfg.freeUsername || '';
    const freePass = cfg.freePassword || '';
    const usedSlots = 0;
    const maxSlots = Number(cfg.maxFreeSlots) || 0;
    return {
      data: {
        available: true,
        slotsFull: false,
        usedSlots,
        maxSlots,
        remainingSlots: maxSlots,
        totalSlots: maxSlots,
        progress: 0,
        freeUser,
        freePass,
        username: freeUser,
        password: freePass,
        freeLink: cfg.freeLink || '',
        downloadUrl: cfg.freeLink || '',
        message: 'Free access slots currently active.',
      } as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/system-status') {
    return {
      data: {
        isMaintenanceMode: Boolean(cfg.maintenance),
        maintenanceReason: cfg.maintenanceReason || 'Panel Is Ready to use',
        latestVersion: cfg.latestVersion || '3.5',
        updateUrl: cfg.downloadLink || cfg.apkUrl || '',
        showHomeDownloadBtn: Boolean(cfg.showHomeDownloadBtn),
        freeLink: cfg.freeLink || '',
      } as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/owner/probe') {
    return {
      data: { authorized: true } as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/users') {
    return {
      data: [] as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/free-users') {
    return {
      data: [] as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/keys') {
    return {
      data: [] as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/manage/admins') {
    return {
      data: [] as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/orders/all' || endpoint === '/api/admin/orders/pending') {
    return {
      data: [] as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/maintenance') {
    return {
      data: {
        isMaintenanceMode: Boolean(cfg.isMaintenanceMode ?? cfg.maintenance),
        maintenanceReason: cfg.maintenanceReason || 'Panel Is Ready to use',
      } as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/maintenance/toggle' && method === 'POST') {
    const nextMode = (_body as any)?.isMaintenanceMode !== undefined
      ? Boolean((_body as any).isMaintenanceMode)
      : !Boolean(cfg.isMaintenanceMode ?? cfg.maintenance);
    saveAppConfig({ isMaintenanceMode: nextMode, maintenance: nextMode });
    return {
      data: {
        success: true,
        isMaintenanceMode: nextMode,
        message: `Maintenance mode is now ${nextMode ? 'ON' : 'OFF'}`,
      } as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/settings/update' && (method === 'PUT' || method === 'POST')) {
    if (_body && typeof _body === 'object') {
      saveAppConfig(_body as any);
    }
    return {
      data: {
        success: true,
        message: 'System settings updated successfully.',
      } as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/settings/all') {
    return {
      data: {
        id: cfg.id || 1,
        isMaintenanceMode: Boolean(cfg.isMaintenanceMode ?? cfg.maintenance),
        maintenanceReason: cfg.maintenanceReason || 'Panel Is Ready to use',
        maxFreeSlots: cfg.maxFreeSlots || 50,
        latestVersion: cfg.latestVersion || '3.5',
        updateUrl: cfg.updateUrl || cfg.downloadLink || cfg.apkUrl || '',
        showHomeDownloadBtn: Boolean(cfg.showHomeDownloadBtn),
        freeValidDays: cfg.freeValidDays || 1,
        freeUsername: cfg.freeUsername || '',
        freePassword: cfg.freePassword || '',
        freeLink: cfg.freeLink || '',
        streamerLink: cfg.streamerLink || '',
        sniperLink: cfg.sniperLink || '',
        specialLink: cfg.specialLink || '',
        aimbotLink: cfg.aimbotLink || '',
        premiumLink: cfg.premiumLink || '',
        customisedLink: cfg.customisedLink || '',
      } as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/auth/panel-updates') {
    return {
      data: {
        update1: 'Operational (v3.5)',
        update2: 'Updated (Safe)',
        update3: 'Kernel Bypass Active',
        update4: 'All Systems Normal',
      } as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (method === 'DELETE' || method === 'POST' || method === 'PUT') {
    return {
      data: { success: true, message: 'Operation executed successfully.' } as unknown as T,
      error: null,
      status: 200,
    };
  }

  return { data: null, error: null, status: 200 };
}
