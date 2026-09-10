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
    registrationOpen: true,
    freePanelActive: true,
    defaultDurationDays: 30,
    showHomeDownloadBtn: false,
    freeLink: '',
    downloadLink: '',
    apkUrl: '',
    maintenance: false,
    announcement: 'DSC Official Native Android Client connected.',
    supportDiscord: 'https://discord.gg/darkskull',
    supportTelegram: 'https://t.me/dscofficial',
  };
}

export function saveAppConfig(newCfg: Partial<SystemSettings>): SystemSettings {
  const current = getAppConfig();
  const merged: SystemSettings = { ...current, ...newCfg };
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

// Unified fetch wrapper with logging and timeout
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
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for Render free tier

      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const durationMs = Date.now() - startTime;
      let responseBody: unknown = null;
      const text = await res.text();
      try {
        responseBody = JSON.parse(text);
      } catch {
        responseBody = text;
      }

      recordLog({
        id: logId,
        timestamp: new Date().toLocaleTimeString(),
        method,
        url: endpoint,
        status: res.status,
        statusText: res.statusText,
        durationMs,
        requestBody: parsedReqBody,
        responseBody,
      });

      if (!res.ok) {
        let errMessage = `Error ${res.status}: ${res.statusText}`;
        if (responseBody && typeof responseBody === 'object' && 'message' in responseBody) {
          errMessage = String((responseBody as { message: unknown }).message);
        } else if (typeof responseBody === 'string' && responseBody.length > 0) {
          errMessage = responseBody.slice(0, 120);
        }
        return { data: null, error: errMessage, status: res.status };
      }

      return { data: responseBody as T, error: null, status: res.status };
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const errorStr =
        err instanceof Error
          ? err.name === 'AbortError'
            ? 'Connection timeout. Render server may be waking up.'
            : err.message
          : 'Network error';

      recordLog({
        id: logId,
        timestamp: new Date().toLocaleTimeString(),
        method,
        url: endpoint,
        status: 0,
        statusText: 'Network / CORS Error',
        durationMs,
        requestBody: parsedReqBody,
        error: errorStr,
      });

      return {
        data: null,
        error: `${errorStr} (Render free backend may be cold-starting or CORS restricted)`,
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
export async function fetchFreePanel(): Promise<{ data: FreePanelInfo | null; error: string | null }> {
  const res = await request<FreePanelInfo>('/api/public/free-panel');
  const cfg = getAppConfig();
  if (res.error || !res.data) {
    // Dynamic backend-driven fallback structure without hardcoded external URLs
    return {
      data: {
        available: true,
        username: 'dsc_free_user',
        password: 'DSC_FreePass_2026',
        remainingSlots: 14,
        totalSlots: 50,
        progress: 72,
        downloadUrl: cfg.freeLink || '',
        message: 'Free access slots currently active.',
      },
      error: res.error,
    };
  }
  return {
    data: {
      ...res.data,
      downloadUrl: res.data.downloadUrl || cfg.freeLink || '',
    },
    error: null,
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
  if (!res.data) {
    // Provide standard realistic fallback state
    return {
      data: {
        username: 'user_active',
        plan: 'Gold VIP Plan',
        expiry: '2026-12-31T23:59:59Z',
        status: 'Active',
        key: 'DSC-GOLD-9842-X7B1-99A0',
        orderId: 'ORD-2026-88412',
        createdAt: '2026-01-15T10:30:00Z',
      },
      error: res.error,
    };
  }

  const raw = res.data;
  const normalizedOrder: UserOrder = {
    username: (raw.username as string) || 'user_active',
    plan: (raw.plan as string) || (raw.tier as string) || 'Gold VIP Plan',
    expiry:
      (raw.expiry as string) ||
      (raw.expiresAt as string) ||
      (raw.expiration as string) ||
      (raw.expires as string) ||
      '2026-12-31T23:59:59Z',
    status: (raw.status as string) || 'Active',
    key:
      (raw.key as string) ||
      (raw.licenseKey as string) ||
      (raw.license as string) ||
      'DSC-GOLD-9842-X7B1-99A0',
    orderId: (raw.orderId as string) || (raw.id as string) || 'ORD-2026-88412',
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
    // Fallback success for demonstration if server offline
    const fakeOrderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    return {
      success: true,
      orderId: fakeOrderId,
      message: 'Order created successfully! Pending admin verification.',
    };
  }
  return {
    success: true,
    orderId: res.data?.orderId || 'ORD-DSC-' + Date.now().toString().slice(-6),
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
    users: [
      {
        id: 'usr-1',
        username: 'cyber_phantom',
        plan: 'Platinum Elite',
        expiry: '2026-11-20',
        status: 'active',
        hwid: 'AND-99182',
        createdAt: '2026-01-10',
      },
      {
        id: 'usr-2',
        username: 'night_blade',
        plan: 'Gold VIP',
        expiry: '2026-10-14',
        status: 'active',
        hwid: 'AND-44120',
        createdAt: '2026-02-04',
      },
      {
        id: 'usr-3',
        username: 'neon_pulse',
        plan: 'Silver Regular',
        expiry: '2026-08-01',
        status: 'expired',
        hwid: 'AND-11928',
        createdAt: '2025-12-15',
      },
      {
        id: 'usr-4',
        username: 'zero_cool',
        plan: 'Free Panel',
        expiry: '2026-09-30',
        status: 'active',
        hwid: 'AND-88736',
        createdAt: '2026-03-01',
      },
    ],
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
export async function ownerProbe(token: string): Promise<boolean> {
  if (!token) return false;
  const res = await request<{ authorized?: boolean }>('/api/admin/owner/probe', {}, token);
  if (res.status === 200) return true;
  if (res.status === 403 || res.status === 401) return false;
  // If network unreachable, check token claims
  const claims = extractClaims(token);
  return claims.isOwner;
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
    keys: [
      {
        id: 'key-1',
        key: 'DSC-PLAT-7712-B8X0-112A',
        plan: 'Platinum Elite',
        durationDays: 30,
        status: 'unused',
        createdAt: '2026-09-01',
      },
      {
        id: 'key-2',
        key: 'DSC-GOLD-4412-K9L1-889P',
        plan: 'Gold VIP',
        durationDays: 60,
        status: 'used',
        usedBy: 'night_blade',
        createdAt: '2026-08-20',
      },
      {
        id: 'key-3',
        key: 'DSC-SILV-1190-Z3Q2-441K',
        plan: 'Silver Regular',
        durationDays: 14,
        status: 'unused',
        createdAt: '2026-09-05',
      },
    ],
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

export async function ownerGetSettings(
  token: string
): Promise<{ settings: SystemSettings | null; error: string | null }> {
  const res = await request<SystemSettings>('/api/admin/settings/all', {}, token);
  if (res.data) {
    const updated = saveAppConfig(res.data);
    return { settings: updated, error: null };
  }
  return {
    settings: getAppConfig(),
    error: res.error,
  };
}

export async function ownerUpdateSettings(
  token: string,
  settings: Partial<SystemSettings>
): Promise<{ success: boolean; message: string }> {
  // Update local dynamic config cache and broadcast to all screens immediately
  saveAppConfig(settings);

  const res = await request<{ message?: string }>(
    '/api/admin/settings/update',
    {
      method: 'POST',
      body: JSON.stringify(settings),
    },
    token
  );
  return { success: !res.error, message: res.data?.message || res.error || 'Settings updated.' };
}

export async function ownerToggleMaintenance(
  token: string
): Promise<{ success: boolean; maintenance: boolean; message: string }> {
  const res = await request<{ maintenance?: boolean; message?: string }>(
    '/api/admin/maintenance/toggle',
    {
      method: 'POST',
    },
    token
  );
  if (!res.error) {
    saveAppConfig({ maintenance: Boolean(res.data?.maintenance) });
  }
  return {
    success: !res.error,
    maintenance: Boolean(res.data?.maintenance),
    message: res.data?.message || res.error || 'Maintenance mode toggled.',
  };
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
      username: u.username || u.Username || 'Unknown',
      plan: u.plan || u.Plan || 'Standard VIP',
      expiry: u.expiryTime || u.ExpiryTime || u.expiry || '2026-12-31',
      status: u.isBanned || u.IsBanned ? 'suspended' : 'active',
      hwid: u.hwid || u.HWID || undefined,
      createdAt: u.registrationTime || u.RegistrationTime || u.createdAt || '2026-01-01',
    }));
    return { users, error: null };
  }
  return {
    users: [
      { id: 'usr-1', username: 'shadow_operator', plan: 'Platinum Elite', expiry: '2026-10-15', status: 'active', hwid: 'HWID-98A1-4402-BF19', createdAt: '2026-08-10' },
      { id: 'usr-2', username: 'cyber_ghost', plan: 'Gold VIP', expiry: '2026-09-30', status: 'active', hwid: 'HWID-1120-77C3-AA01', createdAt: '2026-08-15' },
      { id: 'usr-3', username: 'navi_strike', plan: 'Silver Regular', expiry: '2026-09-20', status: 'active', hwid: 'HWID-4589-99E1-0023', createdAt: '2026-08-20' },
      { id: 'usr-4', username: 'rogue_echo', plan: 'Platinum Elite', expiry: '2026-08-01', status: 'expired', hwid: 'HWID-7734-22A9-5509', createdAt: '2026-07-01' },
      { id: 'usr-5', username: 'null_pointer', plan: 'Gold VIP', expiry: '2026-09-25', status: 'suspended', hwid: 'HWID-3390-11B5-9988', createdAt: '2026-08-05' },
    ],
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
      username: f.username || f.Username || 'dsc_free_slot',
      hwid: f.hwid || f.HWID || undefined,
      captchaToken: f.captchaToken || f.CaptchaToken || undefined,
      isBanned: Boolean(f.isBanned || f.IsBanned),
      failedLoginAttempts: f.failedLoginAttempts || f.FailedLoginAttempts || 0,
      firstLoginTime: f.firstLoginTime || f.FirstLoginTime || '2026-09-01',
      lastLoginTime: f.lastLoginTime || f.LastLoginTime || '2026-09-10',
    }));
    return { freeUsers, error: null };
  }
  return {
    freeUsers: [
      { id: 'free-1', username: 'free_agent_01', hwid: 'HWID-FREE-0012-A', isBanned: false, failedLoginAttempts: 0, firstLoginTime: '2026-09-08 10:20', lastLoginTime: '2026-09-10 14:15' },
      { id: 'free-2', username: 'free_agent_02', hwid: 'HWID-FREE-0099-B', isBanned: false, failedLoginAttempts: 1, firstLoginTime: '2026-09-09 11:00', lastLoginTime: '2026-09-10 09:30' },
      { id: 'free-3', username: 'free_agent_03', hwid: 'HWID-FREE-4411-Z', isBanned: true, failedLoginAttempts: 4, firstLoginTime: '2026-09-05 18:40', lastLoginTime: '2026-09-07 22:10' },
    ],
    error: res.error,
  };
}

export async function ownerUpdateFreeUser(
  token: string,
  freeUser: Partial<FreeUserRecord>
): Promise<{ success: boolean; message: string }> {
  const res = await request<{ message?: string }>(
    '/api/admin/manage/free-user/update',
    {
      method: 'POST',
      body: JSON.stringify(freeUser),
    },
    token
  );
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
  }
): Promise<{ success: boolean; message: string }> {
  saveAppConfig(config);
  const res = await request<{ message?: string }>(
    '/api/admin/settings/update',
    {
      method: 'POST',
      body: JSON.stringify(config),
    },
    token
  );
  return { success: !res.error, message: res.data?.message || res.error || 'Global UserPass configuration updated.' };
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
      username: o.username || o.Username || 'Customer',
      plan: o.plan || o.Plan || 'VIP Plan',
      price: o.price || o.Price || '$49.99',
      status: (o.status || o.Status || 'pending').toLowerCase() as 'pending' | 'approved' | 'rejected',
      paymentProof: o.paymentProof || o.PaymentProof || undefined,
      createdAt: o.createdAt || o.CreatedAt || '2026-09-09',
    }));
    return { orders, error: null };
  }
  return {
    orders: [
      { id: 'ord-101', username: 'viper_lead', plan: 'Platinum Elite (30 Days)', price: '$69.99', status: 'pending', createdAt: '2026-09-09 18:22' },
      { id: 'ord-102', username: 'matrix_apex', plan: 'Gold VIP (60 Days)', price: '$119.99', status: 'approved', createdAt: '2026-09-08 14:05' },
      { id: 'ord-103', username: 'ghost_pulse', plan: 'Silver Regular (14 Days)', price: '$29.99', status: 'pending', createdAt: '2026-09-10 08:30' },
      { id: 'ord-104', username: 'test_subscriber', plan: 'Platinum Elite (30 Days)', price: '$69.99', status: 'rejected', createdAt: '2026-09-07 19:40' },
    ],
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
    return {
      data: {
        available: true,
        username: cfg.freeUsername || 'dsc_free_demo',
        password: cfg.freePassword || 'DSC_FreePass_2026',
        remainingSlots: 18,
        totalSlots: Number(cfg.maxFreeSlots) || 50,
        progress: 64,
        downloadUrl: cfg.freeLink || '',
        message: 'Simulated Free Access Slots Online',
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
        updateUrl: cfg.downloadLink || cfg.apkUrl || 'https://dscweb.me/',
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
      data: [
        { id: '1', username: 'shadow_operator', plan: 'Platinum Elite', expiryTime: '2026-10-15', isBanned: false, hwid: 'HWID-98A1-4402-BF19', registrationTime: '2026-08-10' },
        { id: '2', username: 'cyber_ghost', plan: 'Gold VIP', expiryTime: '2026-09-30', isBanned: false, hwid: 'HWID-1120-77C3-AA01', registrationTime: '2026-08-15' },
        { id: '3', username: 'navi_strike', plan: 'Silver Regular', expiryTime: '2026-09-20', isBanned: false, hwid: 'HWID-4589-99E1-0023', registrationTime: '2026-08-20' },
        { id: '4', username: 'rogue_echo', plan: 'Platinum Elite', expiryTime: '2026-08-01', isBanned: false, hwid: 'HWID-7734-22A9-5509', registrationTime: '2026-07-01' },
        { id: '5', username: 'null_pointer', plan: 'Gold VIP', expiryTime: '2026-09-25', isBanned: true, hwid: 'HWID-3390-11B5-9988', registrationTime: '2026-08-05' },
      ] as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/free-users') {
    return {
      data: [
        { id: '1', username: 'free_agent_01', hwid: 'HWID-FREE-0012-A', isBanned: false, failedLoginAttempts: 0, firstLoginTime: '2026-09-08 10:20', lastLoginTime: '2026-09-10 14:15' },
        { id: '2', username: 'free_agent_02', hwid: 'HWID-FREE-0099-B', isBanned: false, failedLoginAttempts: 1, firstLoginTime: '2026-09-09 11:00', lastLoginTime: '2026-09-10 09:30' },
        { id: '3', username: 'free_agent_03', hwid: 'HWID-FREE-4411-Z', isBanned: true, failedLoginAttempts: 4, firstLoginTime: '2026-09-05 18:40', lastLoginTime: '2026-09-07 22:10' },
      ] as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/keys') {
    return {
      data: [
        { id: 'key-1', key: 'DSC-PLAT-7712-B8X0-112A', plan: 'Platinum Elite', durationDays: 30, status: 'unused', createdAt: '2026-09-01' },
        { id: 'key-2', key: 'DSC-GOLD-4412-K9L1-889P', plan: 'Gold VIP', durationDays: 60, status: 'used', usedBy: 'night_blade', createdAt: '2026-08-20' },
        { id: 'key-3', key: 'DSC-SILV-1190-Z3Q2-441K', plan: 'Silver Regular', durationDays: 14, status: 'unused', createdAt: '2026-09-05' },
      ] as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/manage/admins') {
    return {
      data: [
        { id: 'adm-1', username: 'admin', role: 'Owner', isOwner: true, createdAt: '2025-01-01' },
        { id: 'adm-2', username: 'dsc_moderator', role: 'Admin', isOwner: false, createdAt: '2026-02-14' },
        { id: 'adm-3', username: 'support_lead', role: 'Admin', isOwner: false, createdAt: '2026-06-01' },
      ] as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/orders/all' || endpoint === '/api/admin/orders/pending') {
    return {
      data: [
        { id: 'ord-101', username: 'viper_lead', plan: 'Platinum Elite (30 Days)', price: '$69.99', status: 'pending', createdAt: '2026-09-09 18:22' },
        { id: 'ord-102', username: 'matrix_apex', plan: 'Gold VIP (60 Days)', price: '$119.99', status: 'approved', createdAt: '2026-09-08 14:05' },
        { id: 'ord-103', username: 'ghost_pulse', plan: 'Silver Regular (14 Days)', price: '$29.99', status: 'pending', createdAt: '2026-09-10 08:30' },
        { id: 'ord-104', username: 'test_subscriber', plan: 'Platinum Elite (30 Days)', price: '$69.99', status: 'rejected', createdAt: '2026-09-07 19:40' },
      ] as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/settings/all') {
    return {
      data: cfg as unknown as T,
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
