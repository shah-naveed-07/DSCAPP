import React, { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  ShoppingBag,
  UserPlus,
  Key,
  Crown,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  Search,
  RefreshCw,
  Server,
  Lock,
  ChevronRight,
  AlertCircle,
  LogOut,
  Sliders,
} from 'lucide-react';
import { AdminOrder, AdminUser, ScreenDestination, SystemStatus, UserSession } from '../../types';
import {
  adminGetPendingOrders,
  adminGetUsers,
  adminUpdateOrder,
  adminDeleteUser,
  adminCreateAdmin,
  adminChangePassword,
  fetchSystemStatus,
  ownerProbe,
} from '../../services/api';

interface Props {
  session: UserSession;
  onNavigate: (screen: ScreenDestination) => void;
  onLogout: () => void;
}

export const AdminDashboardScreen: React.FC<Props> = ({ session, onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'orders' | 'admin_ops'>('overview');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [hasOwnerAccess, setHasOwnerAccess] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Admin Ops form states
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [adminOpLoading, setAdminOpLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [statusRes, usersRes, ordersRes, ownerAccess] = await Promise.all([
      fetchSystemStatus(),
      adminGetUsers(session.token),
      adminGetPendingOrders(session.token),
      ownerProbe(session.token),
    ]);
    setSystemStatus(statusRes);
    setUsers(usersRes.users);
    setOrders(ordersRes.orders);
    setHasOwnerAccess(ownerAccess);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [session.token]);

  useEffect(() => {
    const handleSearchEvent = (e: Event) => {
      const custom = e as CustomEvent<{ username: string }>;
      if (custom.detail?.username) {
        setActiveTab('users');
        setUserSearch(custom.detail.username);
      }
    };
    const handleSwitchTab = (e: Event) => {
      const custom = e as CustomEvent<{ tab: 'overview' | 'users' | 'orders' | 'admin_ops' }>;
      if (custom.detail?.tab) {
        setActiveTab(custom.detail.tab);
      }
    };

    window.addEventListener('admin_search_user', handleSearchEvent);
    window.addEventListener('admin_switch_tab', handleSwitchTab);

    return () => {
      window.removeEventListener('admin_search_user', handleSearchEvent);
      window.removeEventListener('admin_switch_tab', handleSwitchTab);
    };
  }, []);

  const handleOrderDecision = async (orderId: string, mode: 'approve' | 'reject') => {
    const res = await adminUpdateOrder(session.token, orderId, mode);
    setActionFeedback(res.message);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    const res = await adminDeleteUser(session.token, userToDelete.id);
    setIsDeletingUser(false);
    setUserToDelete(null);
    setActionFeedback(res.message);
    setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminOpLoading(true);
    const res = await adminCreateAdmin(session.token, newAdminUser, newAdminPass);
    setAdminOpLoading(false);
    setActionFeedback(res.message);
    if (res.success) {
      setNewAdminUser('');
      setNewAdminPass('');
    }
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminOpLoading(true);
    const res = await adminChangePassword(session.token, currPass, newPass);
    setAdminOpLoading(false);
    setActionFeedback(res.message);
    if (res.success) {
      setCurrPass('');
      setNewPass('');
    }
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const query = (userSearch || '').toLowerCase();
    return (
      (u.username || '').toLowerCase().includes(query) ||
      (u.plan || '').toLowerCase().includes(query) ||
      (u.hwid || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col gap-4 p-4 pb-8 text-slate-100 animate-fadeIn">
      {/* Header Profile */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c142e] via-[#141224] to-[#0c0f18] border border-purple-500/40 p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-purple-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{session.username}</h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                  ADMINISTRATOR
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Control Center • Role-Authorized</p>
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-purple-400 active:scale-95 transition-all"
            title="Refresh Admin Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Owner Access Prompt Card (if authorized) */}
      {hasOwnerAccess && (
        <div
          onClick={() => onNavigate('owner_center')}
          className="cursor-pointer group p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#1a1728] to-purple-500/15 border border-amber-500/40 flex items-center justify-between hover:border-amber-400 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Privileged Owner Database</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold rounded">
                  VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Manage Keys, Admins, Maintenance Toggle & Global DB tables.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0e111a] border border-[#22283a]">
        {[
          { id: 'overview' as const, label: 'Overview', icon: Server },
          { id: 'users' as const, label: `Users (${users.length})`, icon: Users },
          { id: 'orders' as const, label: `Orders (${orders.length})`, icon: ShoppingBag },
          { id: 'admin_ops' as const, label: 'Manage', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 px-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-3 animate-fadeIn">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-xl bg-[#131724] border border-[#232a40]">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Total Registered Users
              </span>
              <div className="text-xl font-black text-cyan-400 mt-1">{users.length}</div>
              <span className="text-[10px] text-slate-500">Live from /api/admin/users</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#131724] border border-[#232a40]">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Pending Orders
              </span>
              <div className="text-xl font-black text-amber-400 mt-1">{orders.length}</div>
              <span className="text-[10px] text-slate-500">Requiring verification</span>
            </div>
          </div>

          {/* System Status Card */}
          <div className="p-4 rounded-xl bg-[#131724] border border-[#232a40] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                DSC Server Status
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
                {systemStatus?.maintenance ? 'MAINTENANCE MODE' : 'ONLINE (99.98%)'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {systemStatus?.message || 'Cluster nodes synchronized and accepting authentications.'}
            </p>
            <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
              <span>Backend Version: {systemStatus?.version || '2.4.1'}</span>
              <span>Uptime: {systemStatus?.uptime || '99.98%'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users Management */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-3 animate-fadeIn">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by username or license tier..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141825] border border-[#232a40] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Users List */}
          <div className="flex flex-col gap-2">
            {filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-[#121623] rounded-xl">
                No users found matching query.
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-3.5 rounded-xl bg-[#131724] border border-[#21283d] flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{u.username}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            (u.status || '').toLowerCase() === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {(u.status ? String(u.status).toUpperCase() : 'ACTIVE')}
                        </span>
                      </div>
                      <p className="text-[11px] text-cyan-400 mt-0.5">{u.plan}</p>
                    </div>

                    <button
                      onClick={() => setUserToDelete(u)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Delete User Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                    <span>
                      Device:{' '}
                      <span className={u.hwid ? 'text-emerald-400' : 'text-slate-500'}>
                        {u.hwid ? 'Bound (Active)' : 'Unbound'}
                      </span>
                    </span>
                    <span>Exp: {u.expiry}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Orders Pending */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-3 animate-fadeIn">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-[#121623] rounded-xl flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
              <span>All pending orders processed. No backlog.</span>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="p-3.5 rounded-xl bg-[#131724] border border-[#232a40] flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400">{ord.id}</span>
                    <h4 className="text-xs font-bold text-white">{ord.username}</h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">{ord.plan}</p>
                  </div>
                  <span className="text-sm font-black text-emerald-400">{ord.price}</span>
                </div>

                {ord.paymentProof && (
                  <div className="p-2 rounded bg-[#0e111a] text-[10px] font-mono text-slate-400 break-all">
                    Proof: {ord.paymentProof}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleOrderDecision(ord.id, 'approve')}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Generate Key</span>
                  </button>
                  <button
                    onClick={() => handleOrderDecision(ord.id, 'reject')}
                    className="py-1.5 px-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Admin Management (Create Admin & Password) */}
      {activeTab === 'admin_ops' && (
        <div className="flex flex-col gap-3.5 animate-fadeIn">
          {/* Create New Admin */}
          <div className="p-4 rounded-xl bg-[#131724] border border-[#232a40] flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <UserPlus className="w-4 h-4 text-purple-400" />
              <span>Create New Admin Account</span>
            </div>
            <form onSubmit={handleCreateAdmin} className="flex flex-col gap-2">
              <input
                type="text"
                value={newAdminUser}
                onChange={(e) => setNewAdminUser(e.target.value)}
                placeholder="New admin username"
                required
                className="w-full px-3 py-2 rounded-lg bg-[#181d2c] border border-[#27324c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <input
                type="password"
                value={newAdminPass}
                onChange={(e) => setNewAdminPass(e.target.value)}
                placeholder="New admin passphrase"
                required
                className="w-full px-3 py-2 rounded-lg bg-[#181d2c] border border-[#27324c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={adminOpLoading}
                className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs mt-1 transition-all disabled:opacity-50"
              >
                {adminOpLoading ? 'Processing...' : 'Create Admin'}
              </button>
            </form>
          </div>

          {/* Change Admin Password */}
          <div className="p-4 rounded-xl bg-[#131724] border border-[#232a40] flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Change Your Admin Password</span>
            </div>
            <form onSubmit={handleChangeAdminPassword} className="flex flex-col gap-2">
              <input
                type="password"
                value={currPass}
                onChange={(e) => setCurrPass(e.target.value)}
                placeholder="Current admin password"
                required
                className="w-full px-3 py-2 rounded-lg bg-[#181d2c] border border-[#27324c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="New admin password"
                required
                className="w-full px-3 py-2 rounded-lg bg-[#181d2c] border border-[#27324c] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={adminOpLoading}
                className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs mt-1 transition-all disabled:opacity-50"
              >
                {adminOpLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#121623] border border-red-500/40 p-5 shadow-2xl text-slate-100 flex flex-col gap-3 animate-scaleIn">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete User Account</h3>
                <p className="text-[11px] text-slate-400">This action will permanently delete user records.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#181d2c] border border-[#27324c] text-xs">
              <span className="text-slate-400">Username: </span>
              <span className="font-bold text-white">{userToDelete.username}</span>
              <br />
              <span className="text-slate-400">Plan: </span>
              <span className="text-cyan-400">{userToDelete.plan}</span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingUser}
                className="flex-1 py-2 rounded-xl bg-[#1e2538] hover:bg-[#28324a] text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors disabled:opacity-50"
              >
                {isDeletingUser ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full py-2.5 mt-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <LogOut className="w-4 h-4" />
        <span>Exit Admin Session</span>
      </button>
    </div>
  );
};
