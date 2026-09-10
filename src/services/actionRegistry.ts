import { ScreenDestination, UserSession } from '../types';

export type UserRole = 'Guest' | 'User' | 'Admin';

export interface ActionDefinition {
  code: string;
  label: string;
  description: string;
  minRole: UserRole;
  requiresOwner?: boolean;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
  targetScreen?: ScreenDestination;
}

export const ACTION_DEFINITIONS: Record<string, ActionDefinition> = {
  // Public navigation
  OPEN_HOME: {
    code: 'OPEN_HOME',
    label: 'Open Home',
    description: 'Navigates to the DSCWeb Home screen',
    minRole: 'Guest',
    targetScreen: 'home',
  },
  OPEN_APPS: {
    code: 'OPEN_APPS',
    label: 'Open Published Apps',
    description: 'Navigates to the certified Google Play apps screen',
    minRole: 'Guest',
    targetScreen: 'apps',
  },
  OPEN_PRODUCTS: {
    code: 'OPEN_PRODUCTS',
    label: 'Open Products',
    description: 'Navigates to VIP subscription plans and checkout',
    minRole: 'Guest',
    targetScreen: 'products',
  },
  OPEN_DOWNLOADS: {
    code: 'OPEN_DOWNLOADS',
    label: 'Open Downloads',
    description: 'Navigates to official APKs and panel software repository',
    minRole: 'Guest',
    targetScreen: 'downloads',
  },
  OPEN_FREE_PANEL: {
    code: 'OPEN_FREE_PANEL',
    label: 'Open Free Panel',
    description: 'Navigates to community free access panel',
    minRole: 'Guest',
    targetScreen: 'freepanel',
  },
  OPEN_ABOUT: {
    code: 'OPEN_ABOUT',
    label: 'Open About',
    description: 'Navigates to company background and technical architecture',
    minRole: 'Guest',
    targetScreen: 'about',
  },
  OPEN_CONTACT: {
    code: 'OPEN_CONTACT',
    label: 'Open Contact',
    description: 'Navigates to support dispatch and community links',
    minRole: 'Guest',
    targetScreen: 'contact',
  },
  OPEN_PRIVACY: {
    code: 'OPEN_PRIVACY',
    label: 'Open Privacy',
    description: 'Navigates to privacy policy and Keystore specs',
    minRole: 'Guest',
    targetScreen: 'privacy',
  },
  OPEN_TERMS: {
    code: 'OPEN_TERMS',
    label: 'Open Terms',
    description: 'Navigates to terms of service',
    minRole: 'Guest',
    targetScreen: 'terms',
  },
  OPEN_USER_LOGIN: {
    code: 'OPEN_USER_LOGIN',
    label: 'Open User Login',
    description: 'Navigates to subscriber sign in portal',
    minRole: 'Guest',
    targetScreen: 'user_login',
  },
  OPEN_ADMIN_LOGIN: {
    code: 'OPEN_ADMIN_LOGIN',
    label: 'Open Admin Login',
    description: 'Navigates to administrator gateway',
    minRole: 'Guest',
    targetScreen: 'admin_login',
  },

  // User authenticated navigation
  OPEN_USER_DASHBOARD: {
    code: 'OPEN_USER_DASHBOARD',
    label: 'Open User Dashboard',
    description: 'Navigates to subscriber dashboard (plan, key, expiry)',
    minRole: 'User',
    targetScreen: 'user_dashboard',
  },
  OPEN_CHANGE_PASSWORD: {
    code: 'OPEN_CHANGE_PASSWORD',
    label: 'Change Password',
    description: 'Opens account password change dialog',
    minRole: 'User',
    targetScreen: 'user_dashboard',
  },

  // Admin authenticated navigation
  OPEN_ADMIN_DASHBOARD: {
    code: 'OPEN_ADMIN_DASHBOARD',
    label: 'Open Admin Console',
    description: 'Navigates to administrator overview and metrics',
    minRole: 'Admin',
    targetScreen: 'admin_dashboard',
  },
  OPEN_ADMIN_USERS: {
    code: 'OPEN_ADMIN_USERS',
    label: 'Open User Management',
    description: 'Navigates to Admin user accounts table',
    minRole: 'Admin',
    targetScreen: 'admin_dashboard',
  },
  OPEN_ADMIN_ORDERS: {
    code: 'OPEN_ADMIN_ORDERS',
    label: 'Open Pending Orders',
    description: 'Navigates to pending orders verification queue',
    minRole: 'Admin',
    targetScreen: 'admin_dashboard',
  },
  OPEN_ADMIN_MANAGEMENT: {
    code: 'OPEN_ADMIN_MANAGEMENT',
    label: 'Open Admin Ops',
    description: 'Navigates to admin creation and password updates',
    minRole: 'Admin',
    targetScreen: 'admin_dashboard',
  },

  // Owner privileged navigation
  OPEN_OWNER_CENTER: {
    code: 'OPEN_OWNER_CENTER',
    label: 'Open Owner Center',
    description: 'Navigates to master database control room',
    minRole: 'Admin',
    requiresOwner: true,
    targetScreen: 'owner_center',
  },

  // In-screen utility actions
  COPY_USER_KEY: {
    code: 'COPY_USER_KEY',
    label: 'Copy License Key',
    description: 'Copies active hardware license key to clipboard',
    minRole: 'User',
  },
  START_DOWNLOAD: {
    code: 'START_DOWNLOAD',
    label: 'Download File',
    description: 'Initiates software package download for current plan or file',
    minRole: 'Guest',
  },
  REFRESH_CURRENT_SCREEN: {
    code: 'REFRESH_CURRENT_SCREEN',
    label: 'Refresh Screen',
    description: 'Refreshes live network data on the active screen',
    minRole: 'Guest',
  },
  LOGOUT: {
    code: 'LOGOUT',
    label: 'Sign Out',
    description: 'Terminates active user or administrator session',
    minRole: 'User',
    requiresConfirmation: true,
    confirmationPrompt: 'Are you sure you want to sign out of your session?',
  },

  // Sensitive Owner/Admin actions requiring explicit user confirmation
  DELETE_USER: {
    code: 'DELETE_USER',
    label: 'Delete User Account',
    description: 'Permanently removes a user record from the database',
    minRole: 'Admin',
    requiresConfirmation: true,
    confirmationPrompt: 'Are you sure you want to permanently delete this user account? This cannot be undone.',
  },
  DELETE_KEY: {
    code: 'DELETE_KEY',
    label: 'Revoke License Key',
    description: 'Permanently revokes a license key from the master database',
    minRole: 'Admin',
    requiresOwner: true,
    requiresConfirmation: true,
    confirmationPrompt: 'Are you sure you want to permanently revoke this license key from the database?',
  },
  DELETE_ADMIN: {
    code: 'DELETE_ADMIN',
    label: 'Revoke Administrator',
    description: 'Revokes administrator access for an operator account',
    minRole: 'Admin',
    requiresOwner: true,
    requiresConfirmation: true,
    confirmationPrompt: 'Are you sure you want to revoke this administrator account?',
  },
  TOGGLE_MAINTENANCE: {
    code: 'TOGGLE_MAINTENANCE',
    label: 'Toggle Maintenance Mode',
    description: 'Toggles global cluster maintenance state across all apps',
    minRole: 'Admin',
    requiresOwner: true,
    requiresConfirmation: true,
    confirmationPrompt: 'Are you sure you want to toggle global maintenance mode for all public clients?',
  },
};

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  actionDef?: ActionDefinition;
  requiresConfirmation?: boolean;
}

export function validateActionPermission(
  actionCode: string,
  session: UserSession | null
): ValidationResult {
  const actionDef = ACTION_DEFINITIONS[actionCode];
  if (!actionDef) {
    return { allowed: false, reason: `Action "${actionCode}" is not registered in the system.` };
  }

  const userRole: UserRole = session ? session.role : 'Guest';

  // Role check
  if (actionDef.minRole === 'Admin') {
    if (userRole !== 'Admin') {
      return {
        allowed: false,
        reason: 'Administrator credentials are required to execute this operation.',
        actionDef,
      };
    }
  } else if (actionDef.minRole === 'User') {
    if (userRole === 'Guest') {
      return {
        allowed: false,
        reason: 'Please sign in to access subscriber features.',
        actionDef,
      };
    }
  }

  // Owner privilege check
  if (actionDef.requiresOwner) {
    const isOwner = session?.isOwner === true || session?.username === 'admin' || session?.username === 'owner';
    if (!isOwner) {
      return {
        allowed: false,
        reason: 'Master Owner privileges are required to perform this sensitive action.',
        actionDef,
      };
    }
  }

  return {
    allowed: true,
    actionDef,
    requiresConfirmation: Boolean(actionDef.requiresConfirmation),
  };
}
