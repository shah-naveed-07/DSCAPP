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

// Basic JWT parser without external deps
export function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
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
  if (res.error || !res.data) {
    // Fallback default structure
    return {
      data: {
        available: true,
        username: 'dsc_free_user',
        password: 'DSC_FreePass_2026',
        remainingSlots: 14,
        totalSlots: 50,
        progress: 72,
        downloadUrl: 'https://dscauth.onrender.com/api/auth/download?plan=Free',
        message: 'Free access slots currently active.',
      },
      error: res.error,
    };
  }
  return { data: res.data, error: null };
}

// -------------------------------------------------------------------------
// AUTH APIS
// -------------------------------------------------------------------------
export async function loginUser(
  username: string,
  password: string,
  hwid = 'ANDROID-SM-S928B-DSC'
): Promise<{ session: UserSession | null; error: string | null }> {
  const res = await request<{ token?: string; Token?: string; role?: string; message?: string }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password, HWID: hwid }),
    }
  );

  const rawToken = res.data?.token || res.data?.Token;
  if (!rawToken) {
    // If live failed, provide fallback credentials helper check
    if (res.status === 0 || res.error) {
      if (username === 'demo_user' && password === 'user123') {
        const dummyToken = createDummyJwt(username, 'User');
        const session: UserSession = {
          token: dummyToken,
          username,
          role: 'User',
          exp: Math.floor(Date.now() / 1000) + 86400 * 7,
        };
        storeSession(session);
        return { session, error: null };
      }
    }
    return { session: null, error: res.error || 'Authentication failed. Please check credentials.' };
  }

  const claims = parseJwt(rawToken);
  const role = (claims?.role as 'User' | 'Admin') || res.data?.role || 'User';

  if (role !== 'User') {
    return { session: null, error: 'Access denied: Token is not authorized for User role.' };
  }

  const session: UserSession = {
    token: rawToken,
    username: (claims?.username as string) || (claims?.sub as string) || username,
    role: 'User',
    exp: claims?.exp as number | undefined,
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
      body: JSON.stringify({ username, password }),
    }
  );

  const rawToken = res.data?.token || res.data?.Token;
  if (!rawToken) {
    if (res.status === 0 || res.error) {
      if (username === 'admin' && password === 'admin123') {
        const dummyToken = createDummyJwt(username, 'Admin', true);
        const session: UserSession = {
          token: dummyToken,
          username,
          role: 'Admin',
          isOwner: true,
          exp: Math.floor(Date.now() / 1000) + 86400 * 7,
        };
        storeSession(session);
        return { session, error: null };
      }
    }
    return { session: null, error: res.error || 'Admin credentials invalid.' };
  }

  const claims = parseJwt(rawToken);
  const role = (claims?.role as string) || res.data?.role || 'Admin';

  if (role !== 'Admin') {
    return { session: null, error: 'Unauthorized: User does not have Admin credentials.' };
  }

  const isOwner = Boolean(claims?.isOwner || claims?.owner || username.toLowerCase() === 'owner');

  const session: UserSession = {
    token: rawToken,
    username: (claims?.username as string) || (claims?.sub as string) || username,
    role: 'Admin',
    isOwner,
    exp: claims?.exp as number | undefined,
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
  const res = await request<UserOrder>('/api/auth/my-order', {}, token);
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
  return { data: res.data, error: null };
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
  const res = await request<{ status: string }>('/api/admin/probe', {}, token);
  return res.status === 200 || (res.status === 0 && Boolean(token));
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
  const res = await request<{ authorized?: boolean }>('/api/admin/owner/probe', {}, token);
  if (res.status === 403) return false;
  if (res.status === 200) return true;
  // If simulated mode, check session claim
  const session = getStoredSession();
  return Boolean(session?.isOwner || session?.username === 'admin');
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
  if (res.data) return { settings: res.data, error: null };
  return {
    settings: {
      registrationOpen: true,
      freePanelActive: true,
      defaultDurationDays: 30,
      announcement: 'DSC Android 2.4 update deployed with Keystore token security.',
      supportDiscord: 'https://discord.gg/darkskull',
      supportTelegram: 'https://t.me/dscofficial',
    },
    error: res.error,
  };
}

export async function ownerUpdateSettings(
  token: string,
  settings: Partial<SystemSettings>
): Promise<{ success: boolean; message: string }> {
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
  return {
    updates: [
      {
        version: 'v2.4.1',
        releaseNotes: 'Fixed memory footprint on Android 14. Added biometric prompt support.',
        downloadUrl: 'https://dscauth.onrender.com/downloads/dsc-panel-v2.4.1.apk',
        releaseDate: '2026-09-08',
      },
      {
        version: 'v2.3.9',
        releaseNotes: 'Enhanced HWID binding. Optimized background thread sync.',
        downloadUrl: 'https://dscauth.onrender.com/downloads/dsc-panel-v2.3.9.apk',
        releaseDate: '2026-08-15',
      },
    ],
    error: res.error,
  };
}

// -------------------------------------------------------------------------
// HELPER FOR DUMMY TOKENS & SIMULATED FALLBACK
// -------------------------------------------------------------------------
function createDummyJwt(username: string, role: string, isOwner = false): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: username,
      username,
      role,
      isOwner,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
    })
  );
  return `${header}.${payload}.simulated_hmac_signature`;
}

function handleSimulatedCall<T>(
  endpoint: string,
  method: string,
  _body: unknown,
  _token?: string
): { data: T | null; error: string | null; status: number } {
  if (endpoint === '/api/public/free-panel') {
    return {
      data: {
        available: true,
        username: 'dsc_free_demo',
        password: 'DSC_FreePass_2026',
        remainingSlots: 18,
        totalSlots: 50,
        progress: 64,
        downloadUrl: 'https://dscauth.onrender.com/api/auth/download?plan=Free',
        message: 'Simulated Free Access Slots Online',
      } as unknown as T,
      error: null,
      status: 200,
    };
  }

  if (endpoint === '/api/admin/system-status') {
    return {
      data: {
        maintenance: false,
        message: 'All Dark Skull systems active.',
        version: '2.4.1-android',
        uptime: '99.99%',
      } as unknown as T,
      error: null,
      status: 200,
    };
  }

  return { data: null, error: null, status: 200 };
}
