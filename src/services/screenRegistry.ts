import { ScreenDestination } from '../types';

export interface ActionDescription {
  action: string;
  label: string;
  description: string;
  isSensitive?: boolean;
}

export interface ScreenSemanticInfo {
  screenId: ScreenDestination;
  title: string;
  description: string;
  category: 'public' | 'user' | 'admin' | 'owner';
  availableActions: ActionDescription[];
  readableSummary: string;
  componentHelp: Record<string, string>;
}

export const SCREEN_SEMANTIC_REGISTRY: Record<ScreenDestination, ScreenSemanticInfo> = {
  home: {
    screenId: 'home',
    title: 'Home Dashboard',
    description: 'The main landing screen of the DSCWeb Android application, showing live server cluster status, featured security tools, quick navigation to Free Panel and VIP plans, and Keystore encryption metrics.',
    category: 'public',
    availableActions: [
      { action: 'OPEN_FREE_PANEL', label: 'Open Free Panel', description: 'Navigates to the public shared access panel' },
      { action: 'OPEN_PRODUCTS', label: 'View Products', description: 'Browse VIP subscription plans (Bronze, Silver, Gold, Platinum)' },
      { action: 'OPEN_APPS', label: 'Published Apps', description: 'Inspect certified Google Play applications' },
      { action: 'OPEN_DOWNLOADS', label: 'Download Center', description: 'Access signed APKs, panel software, and tools' },
      { action: 'OPEN_USER_LOGIN', label: 'Sign In', description: 'Log in with existing subscriber credentials' },
      { action: 'OPEN_ADMIN_LOGIN', label: 'Admin Gateway', description: 'Access restricted administrator console' },
    ],
    readableSummary: 'Dark Skull Corporation Android client home page. Highlights 99.98% cluster uptime, hardware-backed Keystore security, and quick links to Free Panel, Products, Downloads, and Play Store apps.',
    componentHelp: {
      'free panel banner': 'Tapping this opens the live Free Panel where you can view community credentials and remaining slot counts.',
      'vip products card': 'Opens our catalog of Bronze, Silver, Gold, and Platinum monthly or lifetime subscription tiers.',
      'published apps card': 'Shows Dark Skull Corporation apps published on Google Play like QR Scanner Pro and MindMatrix.',
      'server status chip': 'Shows real-time connectivity to the dscauth.onrender.com backend cluster.',
    },
  },
  apps: {
    screenId: 'apps',
    title: 'Published Android Apps',
    description: 'Showcases official Dark Skull Corporation applications available on the Google Play Store, including QR Scanner Pro, MindMatrix, and DSC Secure Authenticator.',
    category: 'public',
    availableActions: [
      { action: 'OPEN_HOME', label: 'Go Home', description: 'Return to home screen' },
      { action: 'OPEN_DOWNLOADS', label: 'Open Downloads', description: 'View direct APK builds' },
    ],
    readableSummary: 'Catalog of 3 certified Play Store apps: QR Scanner Pro (50,000+ downloads, 4.8 stars), MindMatrix Cyber Neural Trainer (100,000+ downloads, 4.9 stars), and DSC Secure Authenticator (25,000+ downloads).',
    componentHelp: {
      'google play button': 'Launches the certified Google Play store listing for the selected application.',
      'view specs button': 'Expands technical architecture highlights, encryption standards, and performance specifications.',
      'share button': 'Shares the Play Store URL via Android native share sheet or copies to clipboard.',
    },
  },
  products: {
    screenId: 'products',
    title: 'VIP Products & Plans',
    description: 'Displays Dark Skull Corporation subscription tiers (Bronze Suite, Silver Pro, Gold VIP, and Platinum Enterprise) with flexible durations and native checkout.',
    category: 'public',
    availableActions: [
      { action: 'SELECT_PRODUCT', label: 'Select Plan', description: 'Opens native checkout modal for selected product' },
      { action: 'OPEN_DOWNLOADS', label: 'View Downloads', description: 'See available software builds' },
    ],
    readableSummary: 'Available plans: Bronze Suite ($15/mo starter), Silver Pro ($25/mo most popular), Gold VIP ($45/mo dual-slot elite), and Platinum Enterprise ($80/mo unrestricted). Duration options: 30 Days, 60 Days, Lifetime.',
    componentHelp: {
      'duration tabs': 'Switches between 30 Days, 60 Days, or Lifetime subscription durations with automated price calculations.',
      'select & order button': 'Launches the native order checkout sheet with USDT, BTC, or PayPal payment instructions.',
    },
  },
  freepanel: {
    screenId: 'freepanel',
    title: 'Public Free Panel',
    description: 'Community shared access panel showing live user slot availability, public credentials, fair use rules, and direct companion APK download.',
    category: 'public',
    availableActions: [
      { action: 'REFRESH_FREE_PANEL', label: 'Refresh Status', description: 'Queries live slot availability from /api/public/free-panel' },
      { action: 'COPY_CREDENTIALS', label: 'Copy Login', description: 'Copies shared username or password' },
      { action: 'DOWNLOAD_FREE_PANEL', label: 'Download Companion', description: 'Downloads the Free Panel companion APK' },
    ],
    readableSummary: 'Public Free Panel for testing DSC security tools. Shows remaining slots out of total capacity, rotating credentials, and fair-use policy prohibiting password modification.',
    componentHelp: {
      'refresh button': 'Fetches updated user slot availability from DSCAuth server.',
      'copy button': 'Copies public testing username or password to your clipboard.',
      'download free panel button': 'Downloads the free panel companion application package.',
    },
  },
  downloads: {
    screenId: 'downloads',
    title: 'Download Center',
    description: 'Categorized repository of official Dark Skull Corporation software builds, signed Android APKs, Windows security suite packages, and diagnostic utilities.',
    category: 'public',
    availableActions: [
      { action: 'START_DOWNLOAD', label: 'Download File', description: 'Triggers package download' },
      { action: 'FILTER_CATEGORY', label: 'Filter Builds', description: 'Filter by Android, Panel, or Tools' },
    ],
    readableSummary: 'Downloadable packages include: DSCWeb Android Client (v1.0.0, 28.4MB), DSC Free Panel Companion APK (v2.4.1, 14.2MB), DSC Security Suite Panel for Windows (v4.1.0, 42.8MB), and DSC HWID Tool (v1.1.2, 3.6MB).',
    componentHelp: {
      'category chips': 'Filters download list between All, Android packages, Windows Panel builds, and Diagnostic Tools.',
      'download package button': 'Triggers direct download of the selected package build.',
      'changelog toggle': 'Expands release notes and bug fixes for the selected version.',
    },
  },
  user_login: {
    screenId: 'user_login',
    title: 'Subscriber Sign In',
    description: 'Authentication portal for active subscribers, linking account credentials securely with DSCAuth.',
    category: 'public',
    availableActions: [
      { action: 'LOGIN_USER', label: 'Sign In', description: 'Submits credentials to /api/auth/login' },
      { action: 'OPEN_REGISTER', label: 'Create Account', description: 'Switches to registration screen' },
      { action: 'OPEN_ADMIN_LOGIN', label: 'Admin Login', description: 'Switches to administrative gateway' },
    ],
    readableSummary: 'User login screen requiring username and password. Seamlessly handles client device binding internally.',
    componentHelp: {
      'username field': 'Enter subscriber account username.',
      'password field': 'Enter subscriber account password.',
    },
  },
  user_register: {
    screenId: 'user_register',
    title: 'Create DSC Account',
    description: 'Registration screen for new subscribers, verifying subscription license key directly against the DSCAuth backend.',
    category: 'public',
    availableActions: [
      { action: 'REGISTER_USER', label: 'Create Account', description: 'Submits credentials and key to /api/auth/register' },
      { action: 'OPEN_LOGIN', label: 'Sign In', description: 'Switches back to sign in screen' },
    ],
    readableSummary: 'User registration screen requiring username, password, confirm password, and license key. Device identifier is managed securely and silently.',
    componentHelp: {
      'username field': 'Desired account username (minimum 3 characters).',
      'password field': 'Desired account password (minimum 3 characters).',
      'license key field': 'Valid DSC subscription license key (e.g. DSC-PLAT-...).',
    },
  },
  admin_login: {
    screenId: 'admin_login',
    title: 'Administrator Gateway',
    description: 'High-security gateway for Dark Skull Corporation systems operators, verifying administrative role claims and audit telemetry.',
    category: 'public',
    availableActions: [
      { action: 'LOGIN_ADMIN', label: 'Sign In Admin', description: 'Submits credentials to /api/admin/login' },
      { action: 'OPEN_USER_LOGIN', label: 'User Login', description: 'Switches back to user login' },
    ],
    readableSummary: 'Restricted administrative entry portal requiring authorized operator passphrase. Validates operator role and owner permissions upon successful JWT grant.',
    componentHelp: {
      'admin username': 'Operator account identifier.',
      'admin passphrase': 'Operator access passphrase.',
    },
  },
  user_dashboard: {
    screenId: 'user_dashboard',
    title: 'User Subscriber Dashboard',
    description: 'Authenticated subscriber control room displaying active plan details, expiration date, masked/revealed hardware license key, panel download launcher, and password change modal.',
    category: 'user',
    availableActions: [
      { action: 'COPY_USER_KEY', label: 'Copy License Key', description: 'Copies license key to clipboard' },
      { action: 'START_DOWNLOAD', label: 'Download Panel', description: 'Downloads plan-associated panel software' },
      { action: 'OPEN_CHANGE_PASSWORD', label: 'Change Password', description: 'Opens password update dialog' },
      { action: 'REFRESH_CURRENT_SCREEN', label: 'Refresh Order', description: 'Queries /api/auth/my-order' },
      { action: 'LOGOUT', label: 'Sign Out', description: 'Ends authenticated user session' },
    ],
    readableSummary: 'Active subscriber portal showing current tier name, expiry date, order reference, hardware license key with single-tap copy, direct panel download link, and password modification controls.',
    componentHelp: {
      'copy key button': 'Copies your hardware-bound license key so you can paste it into your DSC panel software.',
      'download panel button': 'Downloads the specific panel build associated with your active subscription plan.',
      'change password button': 'Opens a secure dialog to update your subscriber password (disabled for Free tier).',
      'mask/reveal key button': 'Toggles masking of your license key for privacy in shared environments.',
    },
  },
  admin_dashboard: {
    screenId: 'admin_dashboard',
    title: 'Administrator Console',
    description: 'System operator console providing live registered user search & deletion, pending order approval/rejection, secondary admin creation, and server health telemetry.',
    category: 'admin',
    availableActions: [
      { action: 'OPEN_ADMIN_USERS', label: 'User Management', description: 'Search and inspect registered users' },
      { action: 'OPEN_ADMIN_ORDERS', label: 'Pending Orders', description: 'Approve or reject customer orders' },
      { action: 'OPEN_ADMIN_MANAGEMENT', label: 'Admin Ops', description: 'Create admins or change password' },
      { action: 'OPEN_OWNER_CENTER', label: 'Owner Center', description: 'Open master owner database (if authorized)' },
      { action: 'LOGOUT', label: 'Sign Out', description: 'Ends administrative session' },
    ],
    readableSummary: 'Administrator management dashboard with live user count, pending order queues with instant approval/rejection buttons, operator password updates, and direct entry to Owner Center.',
    componentHelp: {
      'approve order button': 'Confirms user payment, activates subscription, and generates license key in database.',
      'reject order button': 'Declines order if payment proof is invalid or unverified.',
      'delete user button': 'Permanently removes user account from backend (requires confirmation).',
      'owner database card': 'Navigates to master database tools if your JWT holds verified isOwner permissions.',
    },
  },
  owner_center: {
    screenId: 'owner_center',
    title: 'Master Owner Database Center',
    description: 'Maximum privilege interface for verified platform owners. Provides license key generator & CRUD, administrator account management, global maintenance toggle, and panel update announcements.',
    category: 'owner',
    availableActions: [
      { action: 'GENERATE_KEY', label: 'Generate License Key', description: 'Creates new subscription key' },
      { action: 'DELETE_KEY', label: 'Delete Key', description: 'Revokes a license key (sensitive)', isSensitive: true },
      { action: 'DELETE_ADMIN', label: 'Revoke Admin', description: 'Revokes administrator access (sensitive)', isSensitive: true },
      { action: 'TOGGLE_MAINTENANCE', label: 'Toggle Maintenance', description: 'Toggles global cluster maintenance mode (sensitive)', isSensitive: true },
      { action: 'OPEN_ADMIN_DASHBOARD', label: 'Back to Admin', description: 'Return to admin overview' },
    ],
    readableSummary: 'Owner database control center. Direct CRUD management for master license keys, secondary administrator access revocation, global maintenance toggling, and panel update broadcasts.',
    componentHelp: {
      'generate key form': 'Generates and commits a fresh license key to the database with customized plan and duration.',
      'maintenance mode toggle': 'Restricts platform access for scheduled maintenance or emergency lockdown.',
      'revoke admin button': 'Deletes administrative permissions for the selected operator.',
    },
  },
  about: {
    screenId: 'about',
    title: 'About Dark Skull Corporation',
    description: 'Corporate background, security mission, hardware Keystore encryption architecture, and native Jetpack Compose design foundation.',
    category: 'public',
    availableActions: [
      { action: 'OPEN_HOME', label: 'Go Home', description: 'Return to home' },
      { action: 'OPEN_CONTACT', label: 'Contact Support', description: 'Contact team' },
    ],
    readableSummary: 'About DSC: Outlines our mission for high-performance security software, AES-256 Keystore token protection, native Jetpack Compose architecture, and authoritative DSCAuth server cluster.',
    componentHelp: {},
  },
  contact: {
    screenId: 'contact',
    title: 'Contact & Support Desk',
    description: 'Support ticket dispatch portal and direct communication links to official Discord and engineering email.',
    category: 'public',
    availableActions: [
      { action: 'SEND_TICKET', label: 'Send Ticket', description: 'Queues support inquiry' },
      { action: 'OPEN_HOME', label: 'Go Home', description: 'Return to home' },
    ],
    readableSummary: 'Contact desk with direct Discord community link, support email, and an in-app support ticket dispatch form.',
    componentHelp: {
      'send ticket button': 'Dispatches your support inquiry directly to the administrative review queue.',
    },
  },
  privacy: {
    screenId: 'privacy',
    title: 'Privacy Architecture',
    description: 'Details our zero-compromise privacy commitments, hardware token isolation, zero third-party ad tracking, and non-invasive HWID policies.',
    category: 'public',
    availableActions: [{ action: 'OPEN_HOME', label: 'Go Home', description: 'Return to home' }],
    readableSummary: 'Privacy Policy: Zero third-party ad SDKs or location tracking. Tokens stored in hardware-isolated Android Keystore. HWID used strictly for account verification.',
    componentHelp: {},
  },
  terms: {
    screenId: 'terms',
    title: 'Terms of Service',
    description: 'Subscription license stipulations, Free Panel fair-use restrictions, and server cluster availability guidelines.',
    category: 'public',
    availableActions: [{ action: 'OPEN_HOME', label: 'Go Home', description: 'Return to home' }],
    readableSummary: 'Terms of Service: Individual license key binding rules, prohibition against modifying Free Panel credentials, and uptime guidelines.',
    componentHelp: {},
  },
  maintenance: {
    screenId: 'maintenance',
    title: 'System Maintenance Notice',
    description: 'Notice displayed when the platform undergoes scheduled server cluster maintenance or security updates.',
    category: 'public',
    availableActions: [{ action: 'OPEN_HOME', label: 'Retry Connection', description: 'Checks if maintenance has concluded' }],
    readableSummary: 'System Maintenance screen: The server cluster is currently undergoing maintenance. Core API requests may be temporarily paused.',
    componentHelp: {},
  },
};

export function getScreenSemantic(screenId: ScreenDestination): ScreenSemanticInfo {
  return SCREEN_SEMANTIC_REGISTRY[screenId] || SCREEN_SEMANTIC_REGISTRY.home;
}
