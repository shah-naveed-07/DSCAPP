import { UserSession, ScreenDestination } from '../types';
import {
  getStoredSession,
  storeSession,
  clearSession,
  loginUser as apiLoginUser,
  loginAdmin as apiLoginAdmin,
  registerUser as apiRegisterUser,
  ownerProbe,
} from './api';

export type AuthStateType = 'Unauthenticated' | 'User' | 'Admin';

export interface AuthState {
  state: AuthStateType;
  session: UserSession | null;
  token: string | null;
  username: string | null;
  role: 'User' | 'Admin' | null;
  isOwner: boolean;
  exp: number | null;
  isLoading: boolean;
}

type AuthListener = (state: AuthState) => void;

class AuthManagerService {
  private currentState: AuthState = {
    state: 'Unauthenticated',
    session: null,
    token: null,
    username: null,
    role: null,
    isOwner: false,
    exp: null,
    isLoading: true,
  };

  private listeners: Set<AuthListener> = new Set();
  private initialized = false;

  constructor() {
    this.restoreSession();
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.currentState));
  }

  public getState(): AuthState {
    return this.currentState;
  }

  public async restoreSession(): Promise<AuthState> {
    const existing = getStoredSession();
    if (!existing || !existing.token) {
      this.currentState = {
        state: 'Unauthenticated',
        session: null,
        token: null,
        username: null,
        role: null,
        isOwner: false,
        exp: null,
        isLoading: false,
      };
      this.initialized = true;
      this.notify();
      return this.currentState;
    }

    // Verify expiration timestamp
    if (existing.exp && existing.exp * 1000 <= Date.now()) {
      clearSession();
      this.currentState = {
        state: 'Unauthenticated',
        session: null,
        token: null,
        username: null,
        role: null,
        isOwner: false,
        exp: null,
        isLoading: false,
      };
      this.initialized = true;
      this.notify();
      return this.currentState;
    }

    // For Admin sessions, verify Owner probe on backend
    let isOwner = Boolean(existing.isOwner);
    if (existing.role === 'Admin') {
      try {
        const probeResult = await ownerProbe(existing.token);
        isOwner = probeResult;
        existing.isOwner = isOwner;
        storeSession(existing);
      } catch {
        // preserve existing stored claim
      }
    }

    this.currentState = {
      state: existing.role,
      session: existing,
      token: existing.token,
      username: existing.username,
      role: existing.role,
      isOwner,
      exp: existing.exp || null,
      isLoading: false,
    };
    this.initialized = true;
    this.notify();
    return this.currentState;
  }

  public async loginUser(username: string, password: string) {
    this.currentState.isLoading = true;
    this.notify();

    const result = await apiLoginUser(username, password);
    if (result.session) {
      this.currentState = {
        state: 'User',
        session: result.session,
        token: result.session.token,
        username: result.session.username,
        role: 'User',
        isOwner: false,
        exp: result.session.exp || null,
        isLoading: false,
      };
      this.notify();
    } else {
      this.currentState.isLoading = false;
      this.notify();
    }
    return result;
  }

  public async loginAdmin(username: string, password: string) {
    this.currentState.isLoading = true;
    this.notify();

    const result = await apiLoginAdmin(username, password);
    if (result.session) {
      this.currentState = {
        state: 'Admin',
        session: result.session,
        token: result.session.token,
        username: result.session.username,
        role: 'Admin',
        isOwner: Boolean(result.session.isOwner),
        exp: result.session.exp || null,
        isLoading: false,
      };
      this.notify();
    } else {
      this.currentState.isLoading = false;
      this.notify();
    }
    return result;
  }

  public async registerUser(username: string, password: string, key: string) {
    this.currentState.isLoading = true;
    this.notify();

    const result = await apiRegisterUser(username, password, key);
    if (result.session) {
      this.currentState = {
        state: 'User',
        session: result.session,
        token: result.session.token,
        username: result.session.username,
        role: 'User',
        isOwner: false,
        exp: result.session.exp || null,
        isLoading: false,
      };
      this.notify();
    } else {
      this.currentState.isLoading = false;
      this.notify();
    }
    return result;
  }

  public logout() {
    clearSession();
    this.currentState = {
      state: 'Unauthenticated',
      session: null,
      token: null,
      username: null,
      role: null,
      isOwner: false,
      exp: null,
      isLoading: false,
    };
    this.notify();
  }

  public checkAccess(target: ScreenDestination): { allowed: boolean; redirectTo?: ScreenDestination } {
    const { state, isOwner } = this.currentState;

    if (target === 'user_dashboard') {
      if (state !== 'User') return { allowed: false, redirectTo: 'user_login' };
      return { allowed: true };
    }

    if (target === 'admin_dashboard') {
      if (state !== 'Admin') return { allowed: false, redirectTo: 'admin_login' };
      return { allowed: true };
    }

    if (target === 'owner_center') {
      if (state !== 'Admin') return { allowed: false, redirectTo: 'admin_login' };
      if (!isOwner) return { allowed: false, redirectTo: 'admin_dashboard' };
      return { allowed: true };
    }

    if (target === 'user_login' || target === 'user_register') {
      if (state === 'User') return { allowed: false, redirectTo: 'user_dashboard' };
      return { allowed: true };
    }

    if (target === 'admin_login') {
      if (state === 'Admin') return { allowed: false, redirectTo: 'admin_dashboard' };
      return { allowed: true };
    }

    return { allowed: true };
  }
}

export const AuthManager = new AuthManagerService();
