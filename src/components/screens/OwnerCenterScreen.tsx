import React, { useEffect, useState } from 'react';
import {
  Crown,
  Key,
  Users,
  Settings,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  Power,
  Sliders,
  CheckCircle2,
  Shield,
  ArrowLeft,
  Smartphone,
  Save,
  Search,
  Check,
  X,
  ShoppingCart,
  UserCheck,
  Radio,
  Lock,
  Globe,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Copy,
  Edit3,
} from 'lucide-react';
import {
  AdminAccount,
  AdminKey,
  AdminOrder,
  AdminUser,
  FreeUserRecord,
  PanelStatusUpdate,
  PanelUpdate,
  ScreenDestination,
  SystemSettings,
  UserSession,
} from '../../types';
import {
  ownerGetKeys,
  ownerCreateKey,
  ownerDeleteKey,
  ownerGetAdmins,
  ownerCreateAdmin,
  ownerDeleteAdmin,
  ownerGetSettings,
  ownerUpdateSettings,
  ownerToggleMaintenance,
  ownerGetPanelUpdates,
  ownerGetUsers,
  ownerUpdateUser,
  ownerDeleteUser,
  ownerGetFreeUsers,
  ownerUpdateFreeUser,
  ownerDeleteFreeUser,
  ownerSetGlobalUserPass,
  ownerGetPanelStatus,
  ownerSavePanelStatus,
  ownerGetAllOrders,
  ownerProcessOrder,
  ownerDeleteOrder,
  checkOwnerAccess,
  getSystemSettings,
  updateSystemSettings,
  toggleMaintenance,
} from '../../services/api';

type OwnerSection =
  | 'overview'
  | 'users'
  | 'settings'
  | 'global_userpass'
  | 'free_users'
  | 'updates'
  | 'keys'
  | 'orders'
  | 'admins';

interface Props {
  session: UserSession;
  onNavigate: (screen: ScreenDestination) => void;
}

export const OwnerCenterScreen: React.FC<Props> = ({ session, onNavigate }) => {
  const [activeSection, setActiveSection] = useState<OwnerSection>('overview');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Owner Authorization Verification State (Section 6)
  const [ownerAccess, setOwnerAccess] = useState<'checking' | 'authorized' | 'denied'>('checking');
  const [probeError, setProbeError] = useState<string | null>(null);

  // Data Stores
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [freeUsers, setFreeUsers] = useState<FreeUserRecord[]>([]);
  const [keys, setKeys] = useState<AdminKey[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [updates, setUpdates] = useState<PanelUpdate[]>([]);
  const [panelStatus, setPanelStatus] = useState<PanelStatusUpdate>({
    update1: 'Operational (v3.5)',
    update2: 'Updated (Safe)',
    update3: 'Kernel Bypass Active',
    update4: 'All Systems Normal',
  });

  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [freeUserSearch, setFreeUserSearch] = useState('');
  const [keySearch, setKeySearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Pagination
  const [userPage, setUserPage] = useState(1);
  const [freeUserPage, setFreeUserPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Confirmations
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'user' | 'free_user' | 'key' | 'admin' | 'order';
    id: string;
    label: string;
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Key Generation Form
  const [newKeyPlan, setNewKeyPlan] = useState('Platinum Elite');
  const [newKeyDuration, setNewKeyDuration] = useState(30);

  // Admin Creation Form
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'Admin' | 'Owner'>('Admin');

  // Settings Edit State (Mapped strictly to DSCAuth system settings contract)
  const [editLatestVersion, setEditLatestVersion] = useState('3.5');
  const [editDownloadLink, setEditDownloadLink] = useState('');
  const [editFreeLink, setEditFreeLink] = useState('');
  const [editMaintenanceReason, setEditMaintenanceReason] = useState('Panel Is Ready to use');
  const [editShowHomeDownloadBtn, setEditShowHomeDownloadBtn] = useState(false);
  const [editStreamerLink, setEditStreamerLink] = useState('');
  const [editSniperLink, setEditSniperLink] = useState('');
  const [editSpecialLink, setEditSpecialLink] = useState('');
  const [editAimbotLink, setEditAimbotLink] = useState('');
  const [editPremiumLink, setEditPremiumLink] = useState('');
  const [editCustomisedLink, setEditCustomisedLink] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Global UserPass State
  const [globalFreeUsername, setGlobalFreeUsername] = useState('');
  const [globalFreePassword, setGlobalFreePassword] = useState('');
  const [globalMaxFreeSlots, setGlobalMaxFreeSlots] = useState<number | string>(50);
  const [globalFreeValidDays, setGlobalFreeValidDays] = useState<number | string>(1);
  const [showGlobalPassConfirm, setShowGlobalPassConfirm] = useState(false);
  const [globalPassConfirmDetails, setGlobalPassConfirmDetails] = useState<{
    isClearing: boolean;
    user: AdminUser | null;
  } | null>(null);
  const [isSavingGlobalPass, setIsSavingGlobalPass] = useState(false);
  const [editingFreeUser, setEditingFreeUser] = useState<FreeUserRecord | null>(null);
  const [isSavingFreeUser, setIsSavingFreeUser] = useState(false);

  // Live Panel Status State
  const [statusUpdate1, setStatusUpdate1] = useState('');
  const [statusUpdate2, setStatusUpdate2] = useState('');
  const [statusUpdate3, setStatusUpdate3] = useState('');
  const [statusUpdate4, setStatusUpdate4] = useState('');
  const [isSavingPanelStatus, setIsSavingPanelStatus] = useState(false);

  // Settings Diagnostic & Live State
  const [settingsLoadStatus, setSettingsLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [settingsLoadError, setSettingsLoadError] = useState<{
    method: string;
    url: string;
    status: number;
    message: string;
  } | null>(null);

  // Dedicated direct fetch for GET /api/admin/settings/all
  const fetchSettingsDirectly = async () => {
    setSettingsLoadStatus('loading');
    setSettingsLoadError(null);
    try {
      const res = await getSystemSettings(session.token);
      if (res.settings) {
        const s = res.settings;
        setSettings(s);
        setSettingsLoadStatus('success');
        setSettingsLoadError(null);

        // Section 7: populate server values
        setGlobalFreeUsername(s.freeUsername || '');
        setGlobalFreePassword(s.freePassword || '');
        setGlobalMaxFreeSlots(s.maxFreeSlots ?? 50);
        setGlobalFreeValidDays(s.freeValidDays ?? 1);

        // Section 9: populate download and link fields from server record
        setEditLatestVersion(s.latestVersion || '3.5');
        setEditDownloadLink(s.updateUrl || s.downloadLink || s.apkUrl || '');
        setEditFreeLink(s.freeLink || '');
        setEditMaintenanceReason(s.maintenanceReason || 'Panel Is Ready to use');
        setEditShowHomeDownloadBtn(Boolean(s.showHomeDownloadBtn));
        setEditStreamerLink(s.streamerLink || '');
        setEditSniperLink(s.sniperLink || '');
        setEditSpecialLink(s.specialLink || '');
        setEditAimbotLink(s.aimbotLink || '');
        setEditPremiumLink(s.premiumLink || '');
        setEditCustomisedLink(s.customisedLink || '');
      } else {
        setSettingsLoadStatus('error');
        setSettingsLoadError({
          method: res.method || 'GET',
          url: res.url || 'https://dscauth.onrender.com/api/admin/settings/all',
          status: res.status,
          message: res.error || 'Failed to retrieve settings from DSCAuth backend.',
        });
        setErrorMessage(res.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSettingsLoadStatus('error');
      setSettingsLoadError({
        method: 'GET',
        url: 'https://dscauth.onrender.com/api/admin/settings/all',
        status: 0,
        message: msg,
      });
      setErrorMessage(msg);
    }
  };

  // Initial Data Fetching from Database
  const loadAll = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [
        usersRes,
        freeUsersRes,
        keysRes,
        adminsRes,
        ordersRes,
        settingsRes,
        updatesRes,
        panelStatusRes,
      ] = await Promise.all([
        ownerGetUsers(session.token),
        ownerGetFreeUsers(session.token),
        ownerGetKeys(session.token),
        ownerGetAdmins(session.token),
        ownerGetAllOrders(session.token),
        getSystemSettings(session.token),
        ownerGetPanelUpdates(session.token),
        ownerGetPanelStatus(session.token),
      ]);

      setUsers(usersRes.users);
      setFreeUsers(freeUsersRes.freeUsers);
      setKeys(keysRes.keys);
      setAdmins(adminsRes.admins);
      setOrders(ordersRes.orders);
      setUpdates(updatesRes.updates);

      if (panelStatusRes.status) {
        setPanelStatus(panelStatusRes.status);
        setStatusUpdate1(panelStatusRes.status.update1 || '');
        setStatusUpdate2(panelStatusRes.status.update2 || '');
        setStatusUpdate3(panelStatusRes.status.update3 || '');
        setStatusUpdate4(panelStatusRes.status.update4 || '');
      }

      if (settingsRes.settings) {
        const s = settingsRes.settings;
        setSettings(s);
        setSettingsLoadStatus('success');
        setSettingsLoadError(null);

        setEditLatestVersion(s.latestVersion || '3.5');
        setEditDownloadLink(s.updateUrl || s.downloadLink || s.apkUrl || '');
        setEditFreeLink(s.freeLink || '');
        setEditMaintenanceReason(s.maintenanceReason || 'Panel Is Ready to use');
        setEditShowHomeDownloadBtn(Boolean(s.showHomeDownloadBtn));
        setEditStreamerLink(s.streamerLink || '');
        setEditSniperLink(s.sniperLink || '');
        setEditSpecialLink(s.specialLink || '');
        setEditAimbotLink(s.aimbotLink || '');
        setEditPremiumLink(s.premiumLink || '');
        setEditCustomisedLink(s.customisedLink || '');

        setGlobalFreeUsername(s.freeUsername || '');
        setGlobalFreePassword(s.freePassword || '');
        setGlobalMaxFreeSlots(s.maxFreeSlots ?? 50);
        setGlobalFreeValidDays(s.freeValidDays ?? 1);
      } else if (settingsRes.error) {
        setSettingsLoadStatus('error');
        setSettingsLoadError({
          method: settingsRes.method || 'GET',
          url: settingsRes.url || 'https://dscauth.onrender.com/api/admin/settings/all',
          status: settingsRes.status,
          message: settingsRes.error,
        });
        setErrorMessage(settingsRes.error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load master owner database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const verifyAndLoad = async () => {
      setLoading(true);
      setErrorMessage(null);
      // Section 6: Before displaying Owner-only controls, use GET /api/admin/owner/probe
      const probeRes = await checkOwnerAccess(session.token);
      if (!isMounted) return;

      if (!probeRes.authorized) {
        setOwnerAccess('denied');
        setProbeError(
          probeRes.error ||
            '403: Admin/Owner permission denied. Owner privileges required on DSCAuth backend.'
        );
        setLoading(false);
        return;
      }

      setOwnerAccess('authorized');
      await loadAll();
    };

    verifyAndLoad();
    return () => {
      isMounted = false;
    };
  }, [session.token]);

  // Always re-fetch live settings directly from GET /api/admin/settings/all when opening Global UserPass or Settings
  useEffect(() => {
    if (
      (activeSection === 'global_userpass' || activeSection === 'settings') &&
      ownerAccess === 'authorized' &&
      session?.token
    ) {
      fetchSettingsDirectly();
    }
  }, [activeSection, ownerAccess, session.token]);

  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // --- ACTIONS ---

  // 1. User Management
  const handleToggleUserBan = async (user: AdminUser) => {
    const nextBanned = user.status !== 'suspended';
    const res = await ownerUpdateUser(session.token, {
      id: user.id,
      isBanned: nextBanned,
    });
    notify(res.message);
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: nextBanned ? 'suspended' : 'active' } : u))
    );
  };

  // 2. Free User Management
  const handleToggleFreeUserBan = async (user: FreeUserRecord) => {
    const nextBanned = !user.isBanned;
    const res = await ownerUpdateFreeUser(session.token, {
      id: user.id,
      isBanned: nextBanned,
    });
    notify(res.message);
    setFreeUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isBanned: nextBanned } : u))
    );
  };

  // 3. Key Generation
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await ownerCreateKey(session.token, {
      plan: newKeyPlan,
      durationDays: Number(newKeyDuration),
    });
    notify(res.message);
    if (res.success) {
      const keysRes = await ownerGetKeys(session.token);
      setKeys(keysRes.keys);
    }
  };

  // 4. Create Admin Account
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUsername.trim() || !newAdminPassword.trim()) {
      notify('Username and password are required');
      return;
    }
    const res = await ownerCreateAdmin(session.token, {
      username: newAdminUsername.trim(),
      password: newAdminPassword.trim(),
      role: newAdminRole,
    });
    notify(res.message);
    if (res.success) {
      setNewAdminUsername('');
      setNewAdminPassword('');
      const adminsRes = await ownerGetAdmins(session.token);
      setAdmins(adminsRes.admins);
    }
  };

  // 5. Orders Processing
  const handleProcessOrder = async (orderId: string, mode: 'approve' | 'reject') => {
    const res = await ownerProcessOrder(session.token, orderId, mode);
    notify(res.message);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: mode === 'approve' ? 'approved' : 'rejected' } : o))
    );
  };

  // 6. Generic Delete Confirmation Executor
  const handleExecuteDelete = async () => {
    if (!deleteConfirm) return;
    setIsProcessingAction(true);
    const { type, id } = deleteConfirm;

    try {
      if (type === 'user') {
        const res = await ownerDeleteUser(session.token, id);
        notify(res.message);
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else if (type === 'free_user') {
        const res = await ownerDeleteFreeUser(session.token, id);
        notify(res.message);
        setFreeUsers((prev) => prev.filter((u) => u.id !== id));
      } else if (type === 'key') {
        const res = await ownerDeleteKey(session.token, id);
        notify(res.message);
        setKeys((prev) => prev.filter((k) => k.id !== id));
      } else if (type === 'admin') {
        const res = await ownerDeleteAdmin(session.token, id);
        notify(res.message);
        setAdmins((prev) => prev.filter((a) => a.id !== id));
      } else if (type === 'order') {
        const res = await ownerDeleteOrder(session.token, id);
        notify(res.message);
        setOrders((prev) => prev.filter((o) => o.id !== id));
      }
    } finally {
      setIsProcessingAction(false);
      setDeleteConfirm(null);
    }
  };

  // 7. Toggle Global Maintenance Mode (Section 2 Contract: POST /api/admin/maintenance/toggle)
  const handleToggleMaintenance = async () => {
    setIsProcessingAction(true);
    setErrorMessage(null);
    const targetState = !(settings?.isMaintenanceMode ?? settings?.maintenance ?? false);
    const res = await toggleMaintenance(session.token, targetState);
    setIsProcessingAction(false);
    if (!res.success) {
      setErrorMessage(res.message);
      notify(`Maintenance toggle failed: ${res.message}`);
    } else {
      notify(res.message);
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              isMaintenanceMode: res.isMaintenanceMode,
              maintenance: res.isMaintenanceMode,
            }
          : prev
      );
      // Re-fetch to ensure exact server state from GET /api/admin/settings/all
      const fresh = await getSystemSettings(session.token);
      if (fresh.settings) {
        setSettings(fresh.settings);
      }
    }
  };

  // 8. Save System Settings (Section 1 & 5 Contract: PUT /api/admin/settings/update with complete object)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) {
      notify('Cannot update settings: Server record not loaded. Please retry GET /api/admin/settings/all.');
      return;
    }
    setIsSavingSettings(true);
    setErrorMessage(null);
    const payload: Partial<SystemSettings> = {
      latestVersion: editLatestVersion.trim(),
      updateUrl: editDownloadLink.trim(),
      downloadLink: editDownloadLink.trim(),
      apkUrl: editDownloadLink.trim(),
      freeLink: editFreeLink.trim(),
      maintenanceReason: editMaintenanceReason.trim(),
      showHomeDownloadBtn: editShowHomeDownloadBtn,
      streamerLink: editStreamerLink.trim(),
      sniperLink: editSniperLink.trim(),
      specialLink: editSpecialLink.trim(),
      aimbotLink: editAimbotLink.trim(),
      premiumLink: editPremiumLink.trim(),
      customisedLink: editCustomisedLink.trim(),
    };
    const res = await updateSystemSettings(session.token, payload, settings);
    setIsSavingSettings(false);
    if (!res.success) {
      setErrorMessage(res.message);
      notify(`Save failed: ${res.message}`);
    } else {
      notify(res.message);
      if (res.settings) {
        setSettings(res.settings);
        setEditLatestVersion(res.settings.latestVersion || '3.5');
        setEditDownloadLink(res.settings.updateUrl || res.settings.downloadLink || '');
        setEditFreeLink(res.settings.freeLink || '');
        setEditMaintenanceReason(res.settings.maintenanceReason || 'Panel Is Ready to use');
        setEditShowHomeDownloadBtn(Boolean(res.settings.showHomeDownloadBtn));
        setEditStreamerLink(res.settings.streamerLink || '');
        setEditSniperLink(res.settings.sniperLink || '');
        setEditSpecialLink(res.settings.specialLink || '');
        setEditAimbotLink(res.settings.aimbotLink || '');
        setEditPremiumLink(res.settings.premiumLink || '');
        setEditCustomisedLink(res.settings.customisedLink || '');
      }
      await fetchSettingsDirectly();
    }
  };

  // Free User Classification Helper (Section 6 & 7)
  const isFreeAccount = (u: AdminUser) => {
    const p = (u.plan || '').trim().toLowerCase();
    return p === 'free' || p === 'free-panel' || p === 'free_panel' || p === 'freepanel' || p.includes('free');
  };

  // 9. Check & Open Global UserPass Confirmation (Section 6 & 7 Contract)
  const handleOpenGlobalPassConfirm = async () => {
    if (!settings) {
      notify('Cannot update Global UserPass: Server settings record not loaded. Please wait for GET request to complete.');
      return;
    }
    const trimmedUser = globalFreeUsername.trim();
    if (!trimmedUser) {
      // Blank means turning off public global login
      setGlobalPassConfirmDetails({
        isClearing: true,
        user: null,
      });
      setShowGlobalPassConfirm(true);
      return;
    }

    // Query Users database (GET /api/admin/users)
    setIsSavingGlobalPass(true);
    const usersRes = await ownerGetUsers(session.token);
    setIsSavingGlobalPass(false);
    const latestUsers = usersRes.users && usersRes.users.length > 0 ? usersRes.users : users;
    const target = trimmedUser.toLowerCase();
    const matched = latestUsers.find((u) => (u.username || '').trim().toLowerCase() === target);

    // CASE A: Requested username does NOT exist in backend
    if (!matched) {
      const msg = `Free user "${trimmedUser}" does not exist. Create/select an existing Free user first.`;
      setErrorMessage(msg);
      notify(msg);
      return;
    }

    // CASE C: Requested username exists BUT it is a normal paid/User/Admin account
    if (!isFreeAccount(matched)) {
      const planName = matched.plan || 'Standard / Paid';
      const msg = `This username ("${matched.username}") already belongs to another account (Plan: ${planName}). Choose an existing Free user.`;
      setErrorMessage(msg);
      notify(msg);
      return;
    }

    // CASE B: Requested username exists AND it is already a Free user
    setErrorMessage(null);
    setGlobalPassConfirmDetails({
      isClearing: false,
      user: matched,
    });
    setShowGlobalPassConfirm(true);
  };

  // Execute Global UserPass Save
  const handleSaveGlobalUserPass = async () => {
    if (!settings) {
      notify('Cannot update Global UserPass: Server record not loaded. Please wait for GET request to succeed.');
      return;
    }
    setIsSavingGlobalPass(true);
    setErrorMessage(null);
    const targetUsername = globalPassConfirmDetails?.isClearing
      ? ''
      : (globalPassConfirmDetails?.user?.username || globalFreeUsername.trim());

    const res = await ownerSetGlobalUserPass(
      session.token,
      {
        freeUsername: targetUsername,
        freePassword: globalFreePassword.trim(),
        maxFreeSlots: Number(globalMaxFreeSlots) || 50,
        freeValidDays: Number(globalFreeValidDays) || 1,
      },
      settings
    );
    setIsSavingGlobalPass(false);
    setShowGlobalPassConfirm(false);
    if (!res.success) {
      setErrorMessage(res.message);
      notify(`Failed to update Global UserPass: ${res.message}`);
    } else {
      notify(res.message);
      if (res.settings) {
        setSettings(res.settings);
        setGlobalFreeUsername(res.settings.freeUsername || '');
        setGlobalFreePassword(res.settings.freePassword || '');
        setGlobalMaxFreeSlots(res.settings.maxFreeSlots ?? 50);
        setGlobalFreeValidDays(res.settings.freeValidDays ?? 1);
      }
      await fetchSettingsDirectly();
    }
  };

  // Free User Edit Handler (PUT /api/admin/manage/free-user/update)
  const handleSaveFreeUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFreeUser) return;
    setIsSavingFreeUser(true);
    const res = await ownerUpdateFreeUser(session.token, editingFreeUser);
    setIsSavingFreeUser(false);
    if (res.success) {
      notify(res.message);
      setFreeUsers((prev) =>
        prev.map((f) => (f.id === editingFreeUser.id ? editingFreeUser : f))
      );
      setEditingFreeUser(null);
    } else {
      notify(`Update failed: ${res.message}`);
    }
  };

  // 10. Save Live Panel Status
  const handleSavePanelStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPanelStatus(true);
    const updated: PanelStatusUpdate = {
      update1: statusUpdate1.trim(),
      update2: statusUpdate2.trim(),
      update3: statusUpdate3.trim(),
      update4: statusUpdate4.trim(),
    };
    const res = await ownerSavePanelStatus(session.token, updated);
    setIsSavingPanelStatus(false);
    setPanelStatus(updated);
    notify(res.message);
  };

  // Filtering & Pagination Calculations
  const userSearchTerm = (userSearch || '').toLowerCase();
  const filteredUsers = users.filter((u) =>
    (u.username || '').toLowerCase().includes(userSearchTerm) ||
    (u.hwid && u.hwid.toLowerCase().includes(userSearchTerm)) ||
    (u.plan || '').toLowerCase().includes(userSearchTerm)
  );
  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage);

  const freeUserSearchTerm = (freeUserSearch || '').toLowerCase();
  const filteredFreeUsers = freeUsers.filter((f) =>
    (f.username || '').toLowerCase().includes(freeUserSearchTerm) ||
    (f.hwid && f.hwid.toLowerCase().includes(freeUserSearchTerm))
  );
  const totalFreeUserPages = Math.ceil(filteredFreeUsers.length / itemsPerPage) || 1;
  const paginatedFreeUsers = filteredFreeUsers.slice((freeUserPage - 1) * itemsPerPage, freeUserPage * itemsPerPage);

  const keySearchTerm = (keySearch || '').toLowerCase();
  const filteredKeys = keys.filter((k) =>
    (k.key || '').toLowerCase().includes(keySearchTerm) ||
    (k.plan || '').toLowerCase().includes(keySearchTerm) ||
    (k.usedBy && k.usedBy.toLowerCase().includes(keySearchTerm))
  );

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  const isMaintenanceActive = Boolean(settings?.isMaintenanceMode ?? settings?.maintenance);

  if (ownerAccess === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-8 text-center">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        <h3 className="text-sm font-bold text-white">Verifying Owner Authorization...</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Probing DSCAuth backend (<code className="text-cyan-400">/api/admin/owner/probe</code>) to authenticate Owner privileges.
        </p>
      </div>
    );
  }

  if (ownerAccess === 'denied') {
    return (
      <div className="flex flex-col gap-4 pb-20 max-w-2xl mx-auto w-full pt-8 animate-fadeIn">
        <div className="p-8 rounded-2xl bg-[#121623] border border-red-500/40 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Owner Authorization Denied (403 Forbidden)</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
              The DSCAuth backend probe (<code className="text-red-300">GET /api/admin/owner/probe</code>) returned HTTP 403 Forbidden. This account does not possess Owner privileges.
            </p>
            {probeError && (
              <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-[11px] font-mono text-red-300 text-left">
                {probeError}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => onNavigate('admin_dashboard')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Admin Dashboard</span>
            </button>
            <button
              onClick={async () => {
                setOwnerAccess('checking');
                const probeRes = await checkOwnerAccess(session.token);
                if (probeRes.authorized) {
                  setOwnerAccess('authorized');
                  await loadAll();
                } else {
                  setOwnerAccess('denied');
                  setProbeError(probeRes.error || '403: Admin/Owner permission denied.');
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-semibold hover:brightness-110 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Probe</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-20 max-w-5xl mx-auto w-full">
      {/* Top Banner Navigation */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 border border-amber-500/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('admin_dashboard')}
            className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
            title="Return to Admin Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-black tracking-tight text-white">Owner Database Manager</h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-400/30">
                PROD ROOT
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Source of truth controls for DSCWeb users, authentication, keys, and system variables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAll}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-300 hover:text-cyan-400 transition-colors disabled:opacity-50"
            title="Refresh All Database Tables"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notification Toasts */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tab Navigation Menu */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none border-b border-[#1c2234]">
        {[
          { id: 'overview', label: 'Overview', icon: Shield, count: null },
          { id: 'users', label: 'Users DB', icon: Users, count: users.length },
          { id: 'settings', label: 'System Config', icon: Settings, count: null },
          { id: 'global_userpass', label: 'Global UserPass', icon: Lock, count: null },
          { id: 'free_users', label: 'Free Users', icon: UserCheck, count: freeUsers.length },
          { id: 'updates', label: 'Panel Updates', icon: Radio, count: updates.length },
          { id: 'keys', label: 'Register Keys', icon: Key, count: keys.length },
          { id: 'orders', label: 'Orders', icon: ShoppingCart, count: orders.filter((o) => o.status === 'pending').length },
          { id: 'admins', label: 'Admin Accounts', icon: Crown, count: admins.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as OwnerSection)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151a29]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-cyan-500/30 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: OVERVIEW METRICS & CONTROLS */}
      {/* ========================================================================= */}
      {activeSection === 'overview' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#121623] border border-[#20273c] flex flex-col gap-1">
              <span className="text-[11px] text-slate-400">Total VIP Users</span>
              <span className="text-2xl font-black text-white font-mono">{users.length}</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> {users.filter((u) => u.status === 'active').length} Active
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#121623] border border-[#20273c] flex flex-col gap-1">
              <span className="text-[11px] text-slate-400">Pending Orders</span>
              <span className="text-2xl font-black text-amber-300 font-mono">
                {orders.filter((o) => o.status === 'pending').length}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {orders.length} Total Processed
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#121623] border border-[#20273c] flex flex-col gap-1">
              <span className="text-[11px] text-slate-400">License Keys</span>
              <span className="text-2xl font-black text-cyan-300 font-mono">{keys.length}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {keys.filter((k) => k.status === 'unused').length} Unused Available
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#121623] border border-[#20273c] flex flex-col gap-1">
              <span className="text-[11px] text-slate-400">Free Panel Users</span>
              <span className="text-2xl font-black text-purple-300 font-mono">{freeUsers.length}</span>
              <span className="text-[10px] text-purple-400">Rotational Slots</span>
            </div>
          </div>

          {/* Quick Action Matrix & System Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Global Maintenance Switch */}
            <div className="p-4 rounded-2xl bg-[#121623] border border-[#20273c] flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Power className={`w-4 h-4 ${isMaintenanceActive ? 'text-red-400' : 'text-emerald-400'}`} />
                    Global Maintenance Switch
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                      isMaintenanceActive
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isMaintenanceActive ? 'MAINTENANCE ON' : 'SYSTEM ONLINE'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  When enabled, all client panels and public web visitors are greeted with the maintenance message. Only Owner and Admins retain authentication access.
                </p>
                <div className="text-[11px] font-mono text-slate-300 mt-2 bg-[#0d101a] p-2 rounded-lg border border-slate-800">
                  Reason: "{settings?.maintenanceReason || 'Panel Is Ready to use'}"
                </div>
              </div>

              <button
                onClick={handleToggleMaintenance}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  isMaintenanceActive
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-500/20'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isMaintenanceActive ? 'Turn Maintenance OFF' : 'Turn Maintenance ON'}</span>
              </button>
            </div>

            {/* Live Panel Status Overview */}
            <div className="p-4 rounded-2xl bg-[#121623] border border-[#20273c] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  Live Mod Status Broadcast
                </span>
                <button
                  onClick={() => setActiveSection('updates')}
                  className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  Edit Status <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#0c101a] border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Aimbot Status</span>
                  <span className="font-semibold text-emerald-400 font-mono text-[11px]">
                    {panelStatus.update1 || 'Operational'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0c101a] border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Sniper Status</span>
                  <span className="font-semibold text-cyan-400 font-mono text-[11px]">
                    {panelStatus.update2 || 'Updated'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0c101a] border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Bypass Status</span>
                  <span className="font-semibold text-purple-400 font-mono text-[11px]">
                    {panelStatus.update3 || 'Active'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0c101a] border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">General Engine</span>
                  <span className="font-semibold text-amber-400 font-mono text-[11px]">
                    {panelStatus.update4 || 'Normal'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Version: <strong className="text-white font-mono">{settings?.latestVersion || '3.5'}</strong></span>
                <span>Home Download Banner: <strong className={settings?.showHomeDownloadBtn ? 'text-emerald-400' : 'text-slate-500'}>{settings?.showHomeDownloadBtn ? 'ACTIVE' : 'HIDDEN'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: FULL USER DATABASE */}
      {/* ========================================================================= */}
      {activeSection === 'users' && (
        <div className="flex flex-col gap-3 animate-fadeIn">
          {/* Search bar & count */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#121623] border border-[#20273c]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                placeholder="Search by username, HWID, or subscription plan..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0c101a] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
              {filteredUsers.length} records found
            </span>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#20273c] bg-[#121623]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0e121c] border-b border-[#20273c] text-[11px] text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">ID / User</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">HWID (Manager Only)</th>
                  <th className="p-3">Expiry</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2234]">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">
                      No user records matched your search query.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => {
                    const isBanned = u.status === 'suspended';
                    return (
                      <tr key={u.id} className="hover:bg-[#161c2c] transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-white">{u.username}</div>
                          <div className="text-[10px] font-mono text-slate-500">ID: {u.id}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono text-[10px] border border-cyan-500/20">
                            {u.plan}
                          </span>
                        </td>
                        <td className="p-3">
                          {u.hwid ? (
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {u.hwid}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Unbound</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-400">{u.expiry}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isBanned
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {isBanned ? 'BANNED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleUserBan(u)}
                              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                isBanned
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                              }`}
                              title={isBanned ? 'Unban User' : 'Ban User'}
                            >
                              {isBanned ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'user',
                                  id: u.id,
                                  label: `User account "${u.username}"`,
                                })
                              }
                              className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalUserPages > 1 && (
            <div className="flex items-center justify-between p-2 text-xs text-slate-400">
              <span>
                Page {userPage} of {totalUserPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={userPage <= 1}
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-[#121623] border border-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={userPage >= totalUserPages}
                  onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                  className="p-1.5 rounded-lg bg-[#121623] border border-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: SYSTEM SETTINGS */}
      {/* ========================================================================= */}
      {activeSection === 'settings' && (
        <form onSubmit={handleSaveSettings} className="flex flex-col gap-4 animate-fadeIn">
          {/* Settings Load Diagnostic State */}
          {settingsLoadStatus === 'loading' && (
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center gap-3 text-xs text-slate-300">
              <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Fetching system configuration from <code className="text-cyan-300 font-mono">GET https://dscauth.onrender.com/api/admin/settings/all</code>...</span>
            </div>
          )}

          {settingsLoadStatus === 'error' && settingsLoadError && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>DSCAuth Settings API Error (GET /api/admin/settings/all)</span>
                </div>
                <button
                  type="button"
                  onClick={fetchSettingsDirectly}
                  className="px-3 py-1 rounded-lg bg-red-800/60 hover:bg-red-700/60 text-white font-medium flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Request</span>
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-red-500/30 font-mono text-[11px] text-red-200 space-y-1">
                <div><strong>METHOD:</strong> {settingsLoadError.method}</div>
                <div><strong>URL:</strong> {settingsLoadError.url}</div>
                <div><strong>STATUS:</strong> {settingsLoadError.status}</div>
                <div className="break-all"><strong>ERROR:</strong> {settingsLoadError.message}</div>
              </div>
              <p className="text-[11px] text-red-300/90">
                {settingsLoadError.status === 401
                  ? 'Authentication failed (401 Unauthorized). The current session token is invalid or expired. Please sign out and log in again via Administrator Gateway.'
                  : settingsLoadError.status === 403
                  ? 'Permission denied (403 Forbidden). Your account does not have Owner privileges on the DSCAuth backend.'
                  : 'Backend communication error. Configuration editing is locked until server settings are loaded to prevent corrupting database keys.'}
              </p>
            </div>
          )}

          {settingsLoadStatus === 'success' && (
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Synchronized with DSCAuth (<code className="font-mono text-[11px] text-emerald-200">GET /api/admin/settings/all → 200 OK</code>)</span>
              </div>
              <button
                type="button"
                onClick={fetchSettingsDirectly}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-mono flex items-center gap-1"
                title="Refresh settings directly from backend"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-[#121623] border border-[#20273c] flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              General Configuration & Links
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Latest Version Tag</label>
                <input
                  type="text"
                  value={editLatestVersion}
                  disabled={settingsLoadStatus !== 'success'}
                  onChange={(e) => setEditLatestVersion(e.target.value)}
                  placeholder="e.g. 3.5"
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Maintenance Reason</label>
                <input
                  type="text"
                  value={editMaintenanceReason}
                  disabled={settingsLoadStatus !== 'success'}
                  onChange={(e) => setEditMaintenanceReason(e.target.value)}
                  placeholder="e.g. Panel Is Ready to use"
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-400 block mb-1">
                  Download Link / Direct APK URL
                </label>
                <input
                  type="text"
                  value={editDownloadLink}
                  disabled={settingsLoadStatus !== 'success'}
                  onChange={(e) => setEditDownloadLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-400 block mb-1">
                  Free Link / Public Telegram / Channel URL
                </label>
                <input
                  type="text"
                  value={editFreeLink}
                  disabled={settingsLoadStatus !== 'success'}
                  onChange={(e) => setEditFreeLink(e.target.value)}
                  placeholder="https://t.me/..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Show Home Download Button Toggle */}
              <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-[#0c101a] border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white block">Home Screen Download Banner</span>
                  <span className="text-[11px] text-slate-400 block">
                    Show the prominent direct APK download banner on the application Home screen.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={settingsLoadStatus !== 'success'}
                  onClick={() => setEditShowHomeDownloadBtn(!editShowHomeDownloadBtn)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                    editShowHomeDownloadBtn ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                      editShowHomeDownloadBtn ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Individual Feature / Mod Links */}
          <div className="p-4 rounded-2xl bg-[#121623] border border-[#20273c] flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              Website Feature Mod Redirect Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Streamer Link</label>
                <input
                  type="text"
                  value={editStreamerLink}
                  disabled={settingsLoadStatus !== 'success'}
                  onChange={(e) => setEditStreamerLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0c101a] border border-slate-700 text-white text-xs font-mono disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Sniper Link</label>
                <input
                  type="text"
                  value={editSniperLink}
                  disabled={settingsLoadStatus !== 'success'}
                  onChange={(e) => setEditSniperLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0c101a] border border-slate-700 text-white text-xs font-mono disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Aimbot Link</label>
                <input
                  type="text"
                  value={editAimbotLink}
                  disabled={settingsLoadStatus !== 'success'}
                  onChange={(e) => setEditAimbotLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0c101a] border border-slate-700 text-white text-xs font-mono disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Special Link</label>
                <input
                  type="text"
                  value={editSpecialLink}
                  disabled={settingsLoadStatus !== 'success'}
                  onChange={(e) => setEditSpecialLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0c101a] border border-slate-700 text-white text-xs font-mono disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Premium Link</label>
                <input
                  type="text"
                  value={editPremiumLink}
                  disabled={settingsLoadStatus !== 'success'}
                  onChange={(e) => setEditPremiumLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0c101a] border border-slate-700 text-white text-xs font-mono disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Customised Link</label>
                <input
                  type="text"
                  value={editCustomisedLink}
                  disabled={settingsLoadStatus !== 'success'}
                  onChange={(e) => setEditCustomisedLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0c101a] border border-slate-700 text-white text-xs font-mono disabled:opacity-50"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSettings || settingsLoadStatus !== 'success'}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSettings ? 'Saving Settings...' : 'Save Configuration'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: GLOBAL USERPASS (Website Parity Feature) */}
      {/* ========================================================================= */}
      {activeSection === 'global_userpass' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Settings Load Diagnostic State */}
          {settingsLoadStatus === 'loading' && (
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center gap-3 text-xs text-slate-300">
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Fetching Global UserPass credentials from <code className="text-cyan-300 font-mono">GET https://dscauth.onrender.com/api/admin/settings/all</code>...</span>
            </div>
          )}

          {settingsLoadStatus === 'error' && settingsLoadError && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>DSCAuth Settings API Error (GET /api/admin/settings/all)</span>
                </div>
                <button
                  type="button"
                  onClick={fetchSettingsDirectly}
                  className="px-3 py-1 rounded-lg bg-red-800/60 hover:bg-red-700/60 text-white font-medium flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Request</span>
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-red-500/30 font-mono text-[11px] text-red-200 space-y-1">
                <div><strong>METHOD:</strong> {settingsLoadError.method}</div>
                <div><strong>URL:</strong> {settingsLoadError.url}</div>
                <div><strong>STATUS:</strong> {settingsLoadError.status}</div>
                <div className="break-all"><strong>ERROR:</strong> {settingsLoadError.message}</div>
              </div>
              <p className="text-[11px] text-red-300/90">
                {settingsLoadError.status === 401
                  ? 'Authentication failed (401 Unauthorized). The current session token is invalid or expired. Please sign out and log in again via Administrator Gateway.'
                  : settingsLoadError.status === 403
                  ? 'Permission denied (403 Forbidden). Your account does not have Owner privileges on the DSCAuth backend.'
                  : 'Backend communication error. Global UserPass editing is locked until server settings are loaded to prevent corrupting database keys.'}
              </p>
            </div>
          )}

          {settingsLoadStatus === 'success' && (
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Synchronized with DSCAuth (<code className="font-mono text-[11px] text-emerald-200">GET /api/admin/settings/all → 200 OK</code>)</span>
              </div>
              <button
                type="button"
                onClick={fetchSettingsDirectly}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-mono flex items-center gap-1"
                title="Refresh settings directly from backend"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-[#121623] border border-amber-500/40 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Set Global UserPass / Free Panel Authentication</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure global credentials used by the Free Panel. Setting a username will activate the public login slot. Leaving the username blank will disable the public global login.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-400">
                    Global Free Username <span className="text-amber-400">(Blank = Turn OFF)</span>
                  </label>
                  {(() => {
                    const trimmed = globalFreeUsername.trim();
                    if (!trimmed) {
                      return <span className="text-[10px] text-slate-400 font-mono">● OFF / Blank</span>;
                    }
                    const matched = users.find((u) => (u.username || '').trim().toLowerCase() === trimmed.toLowerCase());
                    if (!matched) {
                      return <span className="text-[10px] text-amber-400 font-mono">● User Not in DB</span>;
                    }
                    if (isFreeAccount(matched)) {
                      return <span className="text-[10px] text-emerald-400 font-bold font-mono">✓ Free Account</span>;
                    }
                    return <span className="text-[10px] text-red-400 font-bold font-mono">⚠ Paid/Other Account</span>;
                  })()}
                </div>
                <input
                  type="text"
                  value={globalFreeUsername}
                  disabled={settingsLoadStatus !== 'success'}
                  onChange={(e) => setGlobalFreeUsername(e.target.value)}
                  placeholder="Leave empty to disable, or enter username..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white font-mono focus:border-amber-400 focus:outline-none disabled:opacity-50"
                />

                {/* Detected Free Accounts Selector */}
                {users.filter(isFreeAccount).length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <span className="text-[10px] text-slate-400">Select Existing Free Account:</span>
                    {users.filter(isFreeAccount).map((fu) => (
                      <button
                        key={fu.id}
                        type="button"
                        onClick={() => setGlobalFreeUsername(fu.username)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          globalFreeUsername.trim().toLowerCase() === fu.username.toLowerCase()
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                            : 'bg-[#182033] hover:bg-[#222d48] text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {fu.username}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 mt-1">
                    No accounts with Plan "free" detected in Users table yet.
                  </p>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Global Free Password</label>
                <input
                  type="text"
                  value={globalFreePassword}
                  disabled={settingsLoadStatus !== 'success'}
                  onChange={(e) => setGlobalFreePassword(e.target.value)}
                  placeholder="Enter free password..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white font-mono focus:border-amber-400 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Max Concurrent Free Slots</label>
                <input
                  type="number"
                  value={globalMaxFreeSlots}
                  disabled={settingsLoadStatus !== 'success'}
                  onChange={(e) => setGlobalMaxFreeSlots(e.target.value)}
                  placeholder="50"
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white font-mono focus:border-amber-400 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Free Access Valid Days</label>
                <input
                  type="number"
                  value={globalFreeValidDays}
                  disabled={settingsLoadStatus !== 'success'}
                  onChange={(e) => setGlobalFreeValidDays(e.target.value)}
                  placeholder="1"
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white font-mono focus:border-amber-400 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1e2539]">
              <span className="text-[11px] text-slate-400">
                State:{' '}
                <strong className={globalFreeUsername ? 'text-emerald-400' : 'text-amber-400'}>
                  {globalFreeUsername ? 'Global Login Active' : 'Global Login Inactive (Blank)'}
                </strong>
              </span>

              <button
                type="button"
                disabled={settingsLoadStatus !== 'success' || isSavingGlobalPass}
                onClick={handleOpenGlobalPassConfirm}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                {isSavingGlobalPass ? 'Verifying...' : 'Apply Global UserPass'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: FREE USERS DATABASE */}
      {/* ========================================================================= */}
      {activeSection === 'free_users' && (
        <div className="flex flex-col gap-3 animate-fadeIn">
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#121623] border border-[#20273c]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={freeUserSearch}
                onChange={(e) => {
                  setFreeUserSearch(e.target.value);
                  setFreeUserPage(1);
                }}
                placeholder="Search free users by username or HWID..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0c101a] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
              {filteredFreeUsers.length} free accounts
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#20273c] bg-[#121623]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0e121c] border-b border-[#20273c] text-[11px] text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">Username</th>
                  <th className="p-3">HWID</th>
                  <th className="p-3">Fail Attempts</th>
                  <th className="p-3">Last Login</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2234]">
                {paginatedFreeUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">
                      No free user slots currently active or found.
                    </td>
                  </tr>
                ) : (
                  paginatedFreeUsers.map((f) => (
                    <tr key={f.id} className="hover:bg-[#161c2c] transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-white">{f.username}</span>
                        <div className="text-[10px] font-mono text-slate-500">ID: {f.id}</div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {f.hwid || 'Unbound'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px]">{f.failedLoginAttempts || 0}</td>
                      <td className="p-3 font-mono text-[10px] text-slate-400">{f.lastLoginTime || 'N/A'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            f.isBanned
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {f.isBanned ? 'BANNED' : 'ALLOWED'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingFreeUser(f)}
                            className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                            title="Edit Free User Record (PUT /api/admin/manage/free-user/update)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleFreeUserBan(f)}
                            className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                            title={f.isBanned ? 'Unban Free User' : 'Ban Free User'}
                          >
                            {f.isBanned ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                type: 'free_user',
                                id: f.id,
                                label: `Free user slot "${f.username}"`,
                              })
                            }
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                            title="Delete Free User Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalFreeUserPages > 1 && (
            <div className="flex items-center justify-between p-2 text-xs text-slate-400">
              <span>
                Page {freeUserPage} of {totalFreeUserPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={freeUserPage <= 1}
                  onClick={() => setFreeUserPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-[#121623] border border-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={freeUserPage >= totalFreeUserPages}
                  onClick={() => setFreeUserPage((p) => Math.min(totalFreeUserPages, p + 1))}
                  className="p-1.5 rounded-lg bg-[#121623] border border-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: LIVE PANEL STATUS & UPDATES */}
      {/* ========================================================================= */}
      {activeSection === 'updates' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Live Mod Status Form */}
          <form onSubmit={handleSavePanelStatus} className="p-4 rounded-2xl bg-[#121623] border border-[#20273c] flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              Live Panel Status Display Messages
            </h3>
            <p className="text-[11px] text-slate-400">
              Broadcast real-time subsystem state to all clients on launch.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Status 1 (Aimbot)</label>
                <input
                  type="text"
                  value={statusUpdate1}
                  onChange={(e) => setStatusUpdate1(e.target.value)}
                  placeholder="e.g. Operational (v3.5)"
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Status 2 (Sniper)</label>
                <input
                  type="text"
                  value={statusUpdate2}
                  onChange={(e) => setStatusUpdate2(e.target.value)}
                  placeholder="e.g. Updated (Safe)"
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Status 3 (Bypass)</label>
                <input
                  type="text"
                  value={statusUpdate3}
                  onChange={(e) => setStatusUpdate3(e.target.value)}
                  placeholder="e.g. Kernel Bypass Active"
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Status 4 (General Status)</label>
                <input
                  type="text"
                  value={statusUpdate4}
                  onChange={(e) => setStatusUpdate4(e.target.value)}
                  placeholder="e.g. All Systems Normal"
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSavingPanelStatus}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingPanelStatus ? 'Updating Broadcast...' : 'Save Broadcast Status'}</span>
              </button>
            </div>
          </form>

          {/* Release History */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-white px-1">Changelog & Historical Releases</h4>
            {updates.map((up, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-[#121623] border border-[#20273c] flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">{up.version}</span>
                  <span className="text-[10px] text-slate-400">{up.releaseDate}</span>
                </div>
                <p className="text-xs text-slate-300">{up.releaseNotes}</p>
                {up.downloadUrl && (
                  <span className="text-[10px] font-mono text-cyan-400 truncate">{up.downloadUrl}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 7: REGISTER KEYS */}
      {/* ========================================================================= */}
      {activeSection === 'keys' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Key Generator Form */}
          <form onSubmit={handleGenerateKey} className="p-4 rounded-2xl bg-[#121623] border border-[#20273c] flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              Generate New VIP License Key
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Target Plan</label>
                <select
                  value={newKeyPlan}
                  onChange={(e) => setNewKeyPlan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="Platinum Elite">Platinum Elite</option>
                  <option value="Gold VIP">Gold VIP</option>
                  <option value="Silver Regular">Silver Regular</option>
                  <option value="Special Pass">Special Pass</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Validity (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={newKeyDuration}
                  onChange={(e) => setNewKeyDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Create License Key</span>
              </button>
            </div>
          </form>

          {/* Keys Search & Filter */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#121623] border border-[#20273c]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keySearch}
                onChange={(e) => setKeySearch(e.target.value)}
                placeholder="Search keys by code or plan..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0c101a] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
              {filteredKeys.length} keys total
            </span>
          </div>

          {/* Keys List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredKeys.map((k) => (
              <div key={k.id} className="p-3.5 rounded-xl bg-[#121623] border border-[#20273c] flex flex-col justify-between gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-cyan-300 select-all block">
                      {k.key}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {k.plan} • {k.durationDays} Days
                    </span>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      k.status === 'unused'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {k.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80 pt-2 mt-1">
                  <span>{k.usedBy ? `Used by: ${k.usedBy}` : `Created: ${k.createdAt}`}</span>
                  <button
                    onClick={() =>
                      setDeleteConfirm({
                        type: 'key',
                        id: k.id,
                        label: `License key "${k.key}"`,
                      })
                    }
                    className="text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 8: ORDERS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSection === 'orders' && (
        <div className="flex flex-col gap-3 animate-fadeIn">
          {/* Order Filter Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#121623] border border-[#20273c] text-xs">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setOrderFilter(filter)}
                className={`flex-1 py-1.5 rounded-lg capitalize font-semibold transition-colors ${
                  orderFilter === filter
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter} ({orders.filter((o) => (filter === 'all' ? true : o.status === filter)).length})
              </button>
            ))}
          </div>

          {/* Orders Cards Grid */}
          <div className="flex flex-col gap-2.5">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs rounded-2xl bg-[#121623] border border-[#20273c]">
                No orders in the "{orderFilter}" category.
              </div>
            ) : (
              filteredOrders.map((ord) => (
                <div key={ord.id} className="p-4 rounded-xl bg-[#121623] border border-[#20273c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{ord.username}</span>
                      <span className="font-mono text-[10px] text-slate-500">ID: {ord.id}</span>
                      <span
                        className={`text-[9px] px-2 py-0.2 rounded-full font-bold uppercase ${
                          ord.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : ord.status === 'rejected'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                      Plan: <strong className="text-cyan-300">{ord.plan}</strong> • Price: <strong className="text-white font-mono">{ord.price}</strong>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Submitted: {ord.createdAt}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ord.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleProcessOrder(ord.id, 'approve')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleProcessOrder(ord.id, 'reject')}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 text-xs font-bold flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'order',
                          id: ord.id,
                          label: `Order record #${ord.id} from ${ord.username}`,
                        })
                      }
                      className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400"
                      title="Delete Order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 9: ADMIN ACCOUNTS */}
      {/* ========================================================================= */}
      {activeSection === 'admins' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Create Admin Form */}
          <form onSubmit={handleCreateAdmin} className="p-4 rounded-2xl bg-[#121623] border border-[#20273c] flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              Provision New Administrator
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Username</label>
                <input
                  type="text"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  placeholder="admin username"
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Password</label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="secure password"
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Role Privilege</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as 'Admin' | 'Owner')}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="Admin">Admin (Panel Manager)</option>
                  <option value="Owner">Owner (Full Database Root)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Admin Account</span>
              </button>
            </div>
          </form>

          {/* Admin List */}
          <div className="flex flex-col gap-2.5">
            {admins.map((adm) => {
              const isOwner = adm.role === 'Owner' || adm.isOwner;
              const isSelf = Boolean(adm.username && session.username && adm.username.toLowerCase() === session.username.toLowerCase());
              return (
                <div key={adm.id} className="p-3.5 rounded-xl bg-[#121623] border border-[#20273c] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isOwner ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                      {isOwner ? <Crown className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{adm.username}</span>
                        {isSelf && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                            YOU
                          </span>
                        )}
                        <span
                          className={`text-[9px] px-2 py-0.2 rounded-full font-bold uppercase ${
                            isOwner ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isOwner ? 'Owner' : 'Admin'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">Registered: {adm.createdAt}</span>
                    </div>
                  </div>

                  {!isSelf && (
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'admin',
                          id: adm.id,
                          label: `Admin account "${adm.username}"`,
                        })
                      }
                      className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Revoke Admin Access"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SENSITIVE ACTION CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#121623] border border-red-500/40 p-5 shadow-2xl text-slate-100 flex flex-col gap-3">
            <div className="flex items-center gap-2.5 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">Confirm Permanent Deletion</h3>
            </div>
            <p className="text-xs text-slate-400">
              Are you sure you want to permanently delete <strong className="text-white">{deleteConfirm.label}</strong> from the DSCAuth database? This operation is irreversible.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={isProcessingAction}
                className="flex-1 py-2 rounded-xl bg-[#1e2538] text-xs font-semibold text-slate-300 hover:bg-[#28324a]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isProcessingAction}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white disabled:opacity-50"
              >
                {isProcessingAction ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL USERPASS CONFIRMATION MODAL */}
      {showGlobalPassConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#121623] border border-amber-500/50 p-5 shadow-2xl text-slate-100 flex flex-col gap-3">
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">
                {globalPassConfirmDetails?.isClearing
                  ? 'Disable Global Free Access?'
                  : 'Confirm Global Free Access Update'}
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              {globalPassConfirmDetails?.isClearing ? (
                <span>
                  You are setting the Global Free Username to <strong className="text-amber-300">blank</strong>. This will turn OFF public global logins. Existing users can still download.
                </span>
              ) : (
                <span>
                  Updating Global UserPass settings with verified Free account{' '}
                  <strong className="text-emerald-300">
                    {globalPassConfirmDetails?.user?.username || globalFreeUsername.trim()}
                  </strong>
                  .
                </span>
              )}
            </p>

            <div className="text-xs font-mono bg-[#0c101a] p-3 rounded-xl border border-slate-800 flex flex-col gap-1 text-slate-300">
              <div>
                Username:{' '}
                <strong className={globalPassConfirmDetails?.isClearing ? 'text-amber-400' : 'text-emerald-400'}>
                  {globalPassConfirmDetails?.isClearing
                    ? '(OFF / BLANK)'
                    : globalPassConfirmDetails?.user?.username || globalFreeUsername.trim()}
                </strong>
              </div>
              <div>
                Account Status:{' '}
                <strong className="text-cyan-300">
                  {globalPassConfirmDetails?.isClearing
                    ? 'Inactive'
                    : `Verified Free User (Plan: ${globalPassConfirmDetails?.user?.plan || 'free'})`}
                </strong>
              </div>
              <div>Password: <strong className="text-white">{globalFreePassword || '(None)'}</strong></div>
              <div>Max Slots: <strong className="text-cyan-300">{globalMaxFreeSlots}</strong></div>
              <div>Valid Days: <strong className="text-cyan-300">{globalFreeValidDays}</strong></div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowGlobalPassConfirm(false)}
                disabled={isSavingGlobalPass}
                className="flex-1 py-2 rounded-xl bg-[#1e2538] text-xs font-semibold text-slate-300 hover:bg-[#28324a]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGlobalUserPass}
                disabled={isSavingGlobalPass}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-50"
              >
                {isSavingGlobalPass ? 'Saving...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FREE USER EDIT MODAL (Section 13: PUT /api/admin/manage/free-user/update) */}
      {editingFreeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleSaveFreeUserEdit}
            className="w-full max-w-md rounded-2xl bg-[#121623] border border-cyan-500/40 p-5 shadow-2xl text-slate-100 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-[#21283d] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Edit Free User Record</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingFreeUser(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Username</label>
                <input
                  type="text"
                  value={editingFreeUser.username}
                  onChange={(e) =>
                    setEditingFreeUser({ ...editingFreeUser, username: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Hardware ID (HWID)</label>
                <input
                  type="text"
                  value={editingFreeUser.hwid}
                  onChange={(e) =>
                    setEditingFreeUser({ ...editingFreeUser, hwid: e.target.value })
                  }
                  placeholder="HWID string or Unbound"
                  className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Failed Login Attempts</label>
                  <input
                    type="number"
                    value={editingFreeUser.failedLoginAttempts}
                    onChange={(e) =>
                      setEditingFreeUser({
                        ...editingFreeUser,
                        failedLoginAttempts: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Access Status</label>
                  <select
                    value={editingFreeUser.isBanned ? 'banned' : 'allowed'}
                    onChange={(e) =>
                      setEditingFreeUser({
                        ...editingFreeUser,
                        isBanned: e.target.value === 'banned',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0c101a] border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="allowed">Allowed (Active)</option>
                    <option value="banned">Banned (Suspended)</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                Note: Updating this individual Free User record executes <code className="text-cyan-300 font-mono">PUT /api/admin/manage/free-user/update</code> without altering SystemSettings or other accounts.
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#21283d]">
              <button
                type="button"
                onClick={() => setEditingFreeUser(null)}
                disabled={isSavingFreeUser}
                className="flex-1 py-2 rounded-xl bg-[#1e2538] text-xs font-semibold text-slate-300 hover:bg-[#28324a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingFreeUser}
                className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs disabled:opacity-50"
              >
                {isSavingFreeUser ? 'Saving...' : 'Save Free User'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
