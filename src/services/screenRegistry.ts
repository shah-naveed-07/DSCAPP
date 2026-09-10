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
  purpose: string;
  visibleInformation: string;
  roleRequirements: 'Guest' | 'User' | 'Admin' | 'Owner';
  navigationDestinations: ScreenDestination[];
  destructiveActions: string[];
  availableActions: ActionDescription[];
  readableSummary: string;
  hinglishSummary: string;
  componentHelp: Record<string, string>;
}

export const SCREEN_SEMANTIC_REGISTRY: Record<ScreenDestination, ScreenSemanticInfo> = {
  home: {
    screenId: 'home',
    title: 'Home Screen',
    purpose: 'Main entry point and gateway to all DSCWeb tools, VIP plans, free access panel, and Play Store apps.',
    visibleInformation: 'Live server status chip (uptime 99.98%), Free Panel banner with remaining slots, VIP subscription cards, certified Play Store apps, and quick navigation links.',
    roleRequirements: 'Guest',
    navigationDestinations: ['freepanel', 'products', 'apps', 'downloads', 'user_login', 'admin_login', 'about', 'contact'],
    destructiveActions: [],
    availableActions: [
      { action: 'OPEN_FREE_PANEL', label: 'Open Free Panel', description: 'Navigates to the public shared access panel' },
      { action: 'OPEN_PRODUCTS', label: 'View Products', description: 'Browse VIP subscription plans (Bronze, Silver, Gold, Platinum)' },
      { action: 'OPEN_APPS', label: 'Published Apps', description: 'Inspect certified Google Play applications' },
      { action: 'OPEN_DOWNLOADS', label: 'Download Center', description: 'Access signed APKs, panel software, and tools' },
      { action: 'OPEN_USER_LOGIN', label: 'Sign In', description: 'Log in with existing subscriber credentials' },
      { action: 'OPEN_ADMIN_LOGIN', label: 'Admin Gateway', description: 'Access restricted administrator console' },
    ],
    readableSummary: 'This is the main Home screen. Here you can monitor server status, access the public Free Panel, browse VIP plans, explore published Play Store apps, and sign in to your subscriber or administrator account.',
    hinglishSummary: 'Yeh Home screen hai. Yahan aap server status dekh sakte hain, Free Panel khol sakte hain, VIP plans aur Play Store apps explore kar sakte hain, aur login kar sakte hain.',
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
    purpose: 'Showcase official Dark Skull Corporation Android applications published on Google Play.',
    visibleInformation: 'Application cards with icon, rating, download milestones (50K+ / 100K+), version numbers, Play Store links, and technical specifications.',
    roleRequirements: 'Guest',
    navigationDestinations: ['home', 'downloads'],
    destructiveActions: [],
    availableActions: [
      { action: 'OPEN_HOME', label: 'Go Home', description: 'Return to home screen' },
      { action: 'OPEN_DOWNLOADS', label: 'Open Downloads', description: 'View direct APK builds' },
    ],
    readableSummary: 'This screen displays DSC applications verified on Google Play: QR Scanner Pro, MindMatrix Neural Trainer, and DSC Secure Authenticator, along with user ratings and Play Store links.',
    hinglishSummary: 'Yeh Published Apps screen hai jahan Dark Skull Corporation ke official Google Play Store apps jaise QR Scanner Pro aur MindMatrix listed hain.',
    componentHelp: {
      'google play button': 'Launches the certified Google Play store listing for the selected application.',
      'view specs button': 'Expands technical architecture highlights, encryption standards, and performance specifications.',
      'share button': 'Shares the Play Store URL via Android native share sheet or copies to clipboard.',
    },
  },
  products: {
    screenId: 'products',
    title: 'VIP Products & Plans',
    purpose: 'Display Dark Skull Corporation subscription tiers and facilitate order checkout.',
    visibleInformation: 'Bronze Suite ($15/mo), Silver Pro ($25/mo), Gold VIP ($45/mo), and Platinum Enterprise ($80/mo). Duration toggles for 30 Days, 60 Days, and Lifetime.',
    roleRequirements: 'Guest',
    navigationDestinations: ['home', 'downloads'],
    destructiveActions: [],
    availableActions: [
      { action: 'SELECT_PRODUCT', label: 'Select Plan', description: 'Opens native checkout modal for selected product' },
      { action: 'OPEN_DOWNLOADS', label: 'View Downloads', description: 'See available software builds' },
    ],
    readableSummary: 'Here you can explore our VIP subscription tiers ranging from Bronze ($15) to Platinum Enterprise ($80), select 30-day, 60-day, or lifetime durations, and place an order.',
    hinglishSummary: 'Yahan VIP plans aur prices diye gaye hain: Bronze, Silver, Gold, aur Platinum. Duration 30 din, 60 din ya lifetime select karke aap order place kar sakte hain.',
    componentHelp: {
      'duration tabs': 'Switches between 30 Days, 60 Days, or Lifetime subscription durations with automated price calculations.',
      'select & order button': 'Launches the native order checkout sheet with USDT, BTC, or PayPal payment instructions.',
    },
  },
  freepanel: {
    screenId: 'freepanel',
    title: 'Public Free Panel',
    purpose: 'Provide free community access to testing security tools with rotating credentials and slot management.',
    visibleInformation: 'Live remaining slots, progress bar of capacity, public username and password with copy button, and Free Panel companion APK download button.',
    roleRequirements: 'Guest',
    navigationDestinations: ['home', 'downloads'],
    destructiveActions: [],
    availableActions: [
      { action: 'REFRESH_FREE_PANEL', label: 'Refresh Status', description: 'Queries live slot availability from /api/public/free-panel' },
      { action: 'COPY_CREDENTIALS', label: 'Copy Login', description: 'Copies shared username or password' },
      { action: 'DOWNLOAD_FREE_PANEL', label: 'Download Companion', description: 'Downloads the Free Panel companion APK' },
    ],
    readableSummary: 'The Free Panel screen lets community members test tools for free. It shows available slots, public credentials, and direct APK download for the companion application.',
    hinglishSummary: 'Yeh Free Panel screen hai. Yahan aap community ke liye free testing credentials, slot status dekh sakte hain aur companion APK download kar sakte hain.',
    componentHelp: {
      'refresh button': 'Fetches updated user slot availability from DSCAuth server.',
      'copy button': 'Copies public testing username or password to your clipboard.',
      'download free panel button': 'Downloads the free panel companion application package.',
    },
  },
  downloads: {
    screenId: 'downloads',
    title: 'Download Center',
    purpose: 'Centralized repository of official APK builds, Windows security tools, and diagnostic utilities.',
    visibleInformation: 'Categories (All, Android, Windows, Panel, Tools), package names, version tags, file sizes, release dates, changelogs, and direct download links.',
    roleRequirements: 'Guest',
    navigationDestinations: ['home'],
    destructiveActions: [],
    availableActions: [
      { action: 'START_DOWNLOAD', label: 'Download File', description: 'Triggers package download' },
      { action: 'FILTER_CATEGORY', label: 'Filter Builds', description: 'Filter by Android, Panel, or Tools' },
    ],
    readableSummary: 'The Download Center offers official APKs and tools: DSCWeb Android Client (v1.0.0), Free Panel Companion APK (v2.4.1), Windows Security Suite, and HWID diagnostic utility.',
    hinglishSummary: 'Download Center mein DSCWeb Android app, Free Panel APK, Windows tools aur diagnostics ki direct download links available hain.',
    componentHelp: {
      'category chips': 'Filters download list between All, Android packages, Windows Panel builds, and Diagnostic Tools.',
      'download package button': 'Triggers direct download of the selected package build.',
      'changelog toggle': 'Expands release notes and bug fixes for the selected version.',
    },
  },
  user_login: {
    screenId: 'user_login',
    title: 'Subscriber Sign In',
    purpose: 'Sign in to access personal subscription details, active license keys, and plan downloads.',
    visibleInformation: 'Username and password fields, login button, links to registration and Admin Gateway.',
    roleRequirements: 'Guest',
    navigationDestinations: ['user_dashboard', 'user_register', 'admin_login', 'home'],
    destructiveActions: [],
    availableActions: [
      { action: 'LOGIN_USER', label: 'Sign In', description: 'Submits credentials to /api/auth/login' },
      { action: 'OPEN_REGISTER', label: 'Create Account', description: 'Switches to registration screen' },
      { action: 'OPEN_ADMIN_LOGIN', label: 'Admin Login', description: 'Switches to administrative gateway' },
    ],
    readableSummary: 'Subscriber sign in screen. Enter your registered username and password to access your dashboard.',
    hinglishSummary: 'Yahan apna subscriber username aur password enter karke dashboard mein login karein.',
    componentHelp: {
      'username field': 'Enter subscriber account username.',
      'password field': 'Enter subscriber account password.',
    },
  },
  user_register: {
    screenId: 'user_register',
    title: 'Create DSC Account',
    purpose: 'Register a new subscriber account by redeeming an authorized subscription license key.',
    visibleInformation: 'Username, password, confirm password, and license key input fields.',
    roleRequirements: 'Guest',
    navigationDestinations: ['user_login', 'home'],
    destructiveActions: [],
    availableActions: [
      { action: 'REGISTER_USER', label: 'Create Account', description: 'Submits credentials and key to /api/auth/register' },
      { action: 'OPEN_LOGIN', label: 'Sign In', description: 'Switches back to sign in screen' },
    ],
    readableSummary: 'User Registration screen. Provide your desired username, password, and subscription license key to create an account.',
    hinglishSummary: 'Naya account banane ke liye apna username, password aur purchase ki hui license key enter karein.',
    componentHelp: {
      'username field': 'Desired account username (minimum 3 characters).',
      'password field': 'Desired account password (minimum 3 characters).',
      'license key field': 'Valid DSC subscription license key (e.g. DSC-PLAT-...).',
    },
  },
  admin_login: {
    screenId: 'admin_login',
    title: 'Administrator Gateway',
    purpose: 'Restricted login for system operators and platform administrators.',
    visibleInformation: 'Operator username and secure passphrase fields, sign-in button.',
    roleRequirements: 'Guest',
    navigationDestinations: ['admin_dashboard', 'user_login', 'home'],
    destructiveActions: [],
    availableActions: [
      { action: 'LOGIN_ADMIN', label: 'Sign In Admin', description: 'Submits credentials to /api/admin/login' },
      { action: 'OPEN_USER_LOGIN', label: 'User Login', description: 'Switches back to user login' },
    ],
    readableSummary: 'Administrative operator portal requiring elevated authorization credentials.',
    hinglishSummary: 'Yeh Administrator Gateway hai. Sirf system operators aur admins ke liye login page.',
    componentHelp: {
      'admin username': 'Operator account identifier.',
      'admin passphrase': 'Operator access passphrase.',
    },
  },
  user_dashboard: {
    screenId: 'user_dashboard',
    title: 'User Subscriber Dashboard',
    purpose: 'Manage your active subscription, view plan details, copy license key, download plan software, and change password.',
    visibleInformation: 'Active tier name, expiration timestamp, masked/revealed license key, panel download link, and password change trigger.',
    roleRequirements: 'User',
    navigationDestinations: ['downloads', 'home'],
    destructiveActions: ['LOGOUT'],
    availableActions: [
      { action: 'COPY_USER_KEY', label: 'Copy License Key', description: 'Copies license key to clipboard' },
      { action: 'START_DOWNLOAD', label: 'Download Panel', description: 'Downloads plan-associated panel software' },
      { action: 'OPEN_CHANGE_PASSWORD', label: 'Change Password', description: 'Opens password update dialog' },
      { action: 'REFRESH_CURRENT_SCREEN', label: 'Refresh Order', description: 'Queries /api/auth/my-order' },
      { action: 'LOGOUT', label: 'Sign Out', description: 'Ends authenticated user session', isSensitive: true },
    ],
    readableSummary: 'Your Subscriber Dashboard displays your current plan, expiry date, hardware license key with quick copy, download button for your plan panel, and password management.',
    hinglishSummary: 'Aapke Subscriber Dashboard par aapka active plan, expiry date, license key (copy button ke saath), panel download link aur password change karne ki suvidha hai.',
    componentHelp: {
      'copy key button': 'Copies your hardware-bound license key so you can paste it into your DSC panel software.',
      'download panel button': 'Downloads the specific panel build associated with your active subscription plan.',
      'change password button': 'Opens a secure dialog to update your subscriber password.',
      'mask/reveal key button': 'Toggles masking of your license key for privacy in shared environments.',
    },
  },
  admin_dashboard: {
    screenId: 'admin_dashboard',
    title: 'Administrator Console',
    purpose: 'Manage platform users, approve/reject pending customer orders, inspect cluster telemetry, and manage operator accounts.',
    visibleInformation: 'Registered user count, pending orders count, live search bar, user list with deletion buttons, pending orders verification cards, and Owner Center entry card.',
    roleRequirements: 'Admin',
    navigationDestinations: ['owner_center', 'home'],
    destructiveActions: ['DELETE_USER', 'LOGOUT'],
    availableActions: [
      { action: 'OPEN_ADMIN_USERS', label: 'User Management', description: 'Search and inspect registered users' },
      { action: 'OPEN_ADMIN_ORDERS', label: 'Pending Orders', description: 'Approve or reject customer orders' },
      { action: 'OPEN_ADMIN_MANAGEMENT', label: 'Admin Ops', description: 'Create admins or change password' },
      { action: 'OPEN_OWNER_CENTER', label: 'Owner Center', description: 'Open master owner database (requires Owner privileges)' },
      { action: 'SEARCH_USER', label: 'Search User', description: 'Filters registered users by username' },
      { action: 'DELETE_USER', label: 'Delete User', description: 'Permanently deletes user account', isSensitive: true },
      { action: 'LOGOUT', label: 'Sign Out', description: 'Ends administrative session', isSensitive: true },
    ],
    readableSummary: 'Administrator Console: provides user account search and deletion, order approval and rejection workflows, admin operations, and navigation to the Owner Center.',
    hinglishSummary: 'Admin Console mein aap users search aur delete kar sakte hain, pending orders approve/reject kar sakte hain, aur Owner Center khol sakte hain (agar Owner access ho).',
    componentHelp: {
      'approve order button': 'Confirms user payment, activates subscription, and generates license key in database.',
      'reject order button': 'Declines order if payment proof is invalid or unverified.',
      'delete user button': 'Permanently removes user account from backend (requires confirmation).',
      'owner database card': 'Navigates to master database tools if your session holds verified isOwner permissions.',
    },
  },
  owner_center: {
    screenId: 'owner_center',
    title: 'Master Owner Database Center',
    purpose: 'Root administrative interface for platform owners: license key generation, admin revocation, global maintenance toggling, and panel update announcements.',
    visibleInformation: 'Key generator form, keys table with revocation buttons, administrator account list with revocation controls, global maintenance toggle switch, and update broadcast feeds.',
    roleRequirements: 'Owner',
    navigationDestinations: ['admin_dashboard', 'home'],
    destructiveActions: ['DELETE_KEY', 'DELETE_ADMIN', 'TOGGLE_MAINTENANCE'],
    availableActions: [
      { action: 'GENERATE_KEY', label: 'Generate License Key', description: 'Creates new subscription key' },
      { action: 'DELETE_KEY', label: 'Delete Key', description: 'Revokes a license key (sensitive)', isSensitive: true },
      { action: 'DELETE_ADMIN', label: 'Revoke Admin', description: 'Revokes administrator access (sensitive)', isSensitive: true },
      { action: 'TOGGLE_MAINTENANCE', label: 'Toggle Maintenance', description: 'Toggles global cluster maintenance mode (sensitive)', isSensitive: true },
      { action: 'OPEN_ADMIN_DASHBOARD', label: 'Back to Admin', description: 'Return to admin overview' },
    ],
    readableSummary: 'Master Owner Center: grants full control over subscription license generation, operator revocation, global system maintenance, and panel update announcements.',
    hinglishSummary: 'Owner Database Center: Yahan se master license keys generate aur delete ki ja sakti hain, admins revoke kiye ja sakte hain, aur global maintenance mode toggle kiya ja sakta hai.',
    componentHelp: {
      'generate key form': 'Generates and commits a fresh license key to the database with customized plan and duration.',
      'maintenance mode toggle': 'Restricts platform access for scheduled maintenance or emergency lockdown.',
      'revoke admin button': 'Deletes administrative permissions for the selected operator.',
    },
  },
  about: {
    screenId: 'about',
    title: 'About Dark Skull Corporation',
    purpose: 'Provide company background, cybersecurity mission, Keystore hardware isolation details, and architecture specifications.',
    visibleInformation: 'Company overview, security specifications, hardware-backed token storage principles, and server cluster SLA.',
    roleRequirements: 'Guest',
    navigationDestinations: ['home', 'contact'],
    destructiveActions: [],
    availableActions: [
      { action: 'OPEN_HOME', label: 'Go Home', description: 'Return to home' },
      { action: 'OPEN_CONTACT', label: 'Contact Support', description: 'Contact team' },
    ],
    readableSummary: 'About page detailing Dark Skull Corporation security mission, hardware keystore integration, and high availability server cluster.',
    hinglishSummary: 'About screen par Dark Skull Corporation ki details, security standards aur technology background bataya gaya hai.',
    componentHelp: {},
  },
  contact: {
    screenId: 'contact',
    title: 'Contact & Support Desk',
    purpose: 'Submit support inquiries directly to the administrative queue or join community channels.',
    visibleInformation: 'Official Discord community link, support email, and interactive support ticket submission form.',
    roleRequirements: 'Guest',
    navigationDestinations: ['home'],
    destructiveActions: [],
    availableActions: [
      { action: 'SEND_TICKET', label: 'Send Ticket', description: 'Queues support inquiry' },
      { action: 'OPEN_HOME', label: 'Go Home', description: 'Return to home' },
    ],
    readableSummary: 'Contact desk with direct Discord link, support email, and an in-app support ticket submission form.',
    hinglishSummary: 'Yahan se aap support ticket bhej sakte hain aur official Discord community join kar sakte hain.',
    componentHelp: {
      'send ticket button': 'Dispatches your support inquiry directly to the administrative review queue.',
    },
  },
  privacy: {
    screenId: 'privacy',
    title: 'Privacy Architecture',
    purpose: 'Detail zero-tracking privacy architecture, non-invasive HWID policies, and token encryption guarantees.',
    visibleInformation: 'Privacy commitments, zero third-party telemetry, device hardware identifier binding rules, and Keystore isolation.',
    roleRequirements: 'Guest',
    navigationDestinations: ['home'],
    destructiveActions: [],
    availableActions: [{ action: 'OPEN_HOME', label: 'Go Home', description: 'Return to home' }],
    readableSummary: 'Privacy Policy outlining zero-tracking principles, encrypted credentials, and non-invasive device verification.',
    hinglishSummary: 'Privacy policy screen: zero third-party ads, safe token storage aur HWID privacy details.',
    componentHelp: {},
  },
  terms: {
    screenId: 'terms',
    title: 'Terms of Service',
    purpose: 'Outline subscription license terms, fair use of Free Panel, and account guidelines.',
    visibleInformation: 'License key stipulations, prohibition against modifying Free Panel credentials, and uptime guidelines.',
    roleRequirements: 'Guest',
    navigationDestinations: ['home'],
    destructiveActions: [],
    availableActions: [{ action: 'OPEN_HOME', label: 'Go Home', description: 'Return to home' }],
    readableSummary: 'Terms of Service covering license rules, fair use of testing panel, and platform policies.',
    hinglishSummary: 'Terms of Service: subscription rules aur Free Panel use guidelines.',
    componentHelp: {},
  },
  maintenance: {
    screenId: 'maintenance',
    title: 'System Maintenance Notice',
    purpose: 'Inform users that the platform is temporarily offline for scheduled server updates.',
    visibleInformation: 'Maintenance reason, estimated restoration message, and retry button.',
    roleRequirements: 'Guest',
    navigationDestinations: ['home'],
    destructiveActions: [],
    availableActions: [{ action: 'OPEN_HOME', label: 'Retry Connection', description: 'Checks if maintenance has concluded' }],
    readableSummary: 'Maintenance screen displayed when the server cluster is undergoing updates.',
    hinglishSummary: 'Server cluster maintenance notice: filhal server update ho raha hai.',
    componentHelp: {},
  },
};

export function getScreenSemantic(screenId: ScreenDestination): ScreenSemanticInfo {
  return SCREEN_SEMANTIC_REGISTRY[screenId] || SCREEN_SEMANTIC_REGISTRY.home;
}
