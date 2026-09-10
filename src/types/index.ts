export interface UserSession {
  token: string;
  username: string;
  role: 'User' | 'Admin';
  exp?: number;
  sub?: string;
  isOwner?: boolean;
}

export interface UserOrder {
  username: string;
  plan: string;
  expiry: string;
  status: string;
  key: string;
  orderId?: string;
  createdAt?: string;
}

export interface FreePanelInfo {
  available: boolean;
  username?: string;
  password?: string;
  remainingSlots: number;
  totalSlots: number;
  progress: number;
  downloadUrl?: string;
  message?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  plan: string;
  expiry: string;
  status: 'active' | 'expired' | 'suspended';
  hwid?: string;
  createdAt?: string;
}

export interface AdminOrder {
  id: string;
  username: string;
  plan: string;
  price: string;
  status: 'pending' | 'approved' | 'rejected';
  paymentProof?: string;
  createdAt: string;
}

export interface AdminKey {
  id: string;
  key: string;
  plan: string;
  durationDays: number;
  status: 'unused' | 'used';
  usedBy?: string;
  createdAt: string;
}

export interface AdminAccount {
  id: string;
  username: string;
  role: 'Admin' | 'Owner';
  isOwner?: boolean;
  createdAt: string;
}

export interface FreeUserRecord {
  id: string;
  username: string;
  hwid?: string;
  captchaToken?: string;
  isBanned?: boolean;
  failedLoginAttempts?: number;
  lockoutEnd?: string;
  firstLoginTime?: string;
  lastLoginTime?: string;
}

export interface PanelStatusUpdate {
  update1?: string; // Aimbot Status
  update2?: string; // Sniper Status
  update3?: string; // Bypass Status
  update4?: string; // General Status
}

export interface SystemStatus {
  maintenance: boolean;
  message?: string;
  version: string;
  uptime?: string;
}

export interface SystemSettings {
  registrationOpen?: boolean;
  freePanelActive?: boolean;
  defaultDurationDays?: number;
  announcement?: string;
  supportDiscord?: string;
  supportTelegram?: string;
  freeLink?: string;
  showHomeDownloadBtn?: boolean;
  downloadLink?: string;
  apkUrl?: string;
  maintenance?: boolean;
  latestVersion?: string;
  updateUrl?: string;
  maintenanceReason?: string;
  freeUsername?: string;
  freePassword?: string;
  maxFreeSlots?: number | string;
  freeValidDays?: number | string;
  streamerLink?: string;
  sniperLink?: string;
  specialLink?: string;
  aimbotLink?: string;
  premiumLink?: string;
  customisedLink?: string;
  [key: string]: unknown;
}

export interface PanelUpdate {
  version: string;
  releaseNotes: string;
  downloadUrl?: string;
  releaseDate: string;
}

export interface ProductItem {
  id: string;
  name: string;
  tagline: string;
  price: string;
  period: string;
  badge?: string;
  features: string[];
  popular?: boolean;
  accentColor: string;
}

export interface AppItem {
  id: string;
  name: string;
  category: string;
  rating: number;
  downloads: string;
  version: string;
  description: string;
  playStoreUrl: string;
  icon: string;
  features: string[];
}

export interface DownloadItem {
  id: string;
  title: string;
  category: 'Android' | 'Windows' | 'Panel' | 'Tools';
  version: string;
  size: string;
  date: string;
  downloadUrl: string;
  changelog: string[];
}

export interface NetworkLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  durationMs: number;
  requestBody?: unknown;
  responseBody?: unknown;
  error?: string;
}

export type ScreenDestination =
  | 'home'
  | 'apps'
  | 'products'
  | 'downloads'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'freepanel'
  | 'user_login'
  | 'user_register'
  | 'admin_login'
  | 'user_dashboard'
  | 'admin_dashboard'
  | 'owner_center'
  | 'maintenance';
