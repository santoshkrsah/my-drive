import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';
import { formatBytes } from '../components/StorageBar';
import { Pencil, Trash2, Ban, CheckCircle, Eye, X, UserPlus, Search, Users, Bell, Clock, AlertTriangle } from 'lucide-react';

export default function UserManagement() {
  const { impersonate } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', role: 'USER', storageQuota: '5368709120', maxUploadSizeMB: '', maxFilesPerUpload: '', allowedExtensions: '' });
  const [formError, setFormError] = useState('');
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyForm, setNotifyForm] = useState({ title: '', message: '', sendToAll: true });
  const [notifyError, setNotifyError] = useState('');
  const [notifySuccess, setNotifySuccess] = useState('');
  const [notifyUsers, setNotifyUsers] = useState<User[]>([]);
  const [notifySearch, setNotifySearch] = useState('');
  const [notifySelectedIds, setNotifySelectedIds] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteTimerMinutes, setDeleteTimerMinutes] = useState(60);
  const [now, setNow] = useState(Date.now());

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.listUsers(page, 20, search || undefined);
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Load all users when notification modal opens
  useEffect(() => {
    if (showNotifyModal) {
      adminApi.listUsers(1, 1000, '').then(res => setNotifyUsers(res.data.users || [])).catch(() => {});
      setNotifySearch('');
      setNotifySelectedIds([]);
    }
  }, [showNotifyModal]);

  // Live countdown for scheduled deletions
  useEffect(() => {
    const hasScheduled = users.some(u => u.status === 'DELETED' && u.scheduledDeletionAt);
    if (!hasScheduled) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [users]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', username: '', password: '', role: 'USER', storageQuota: '5368709120', maxUploadSizeMB: '', maxFilesPerUpload: '', allowedExtensions: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      username: user.username,
      password: '',
      role: user.role,
      storageQuota: user.storageQuota,
      maxUploadSizeMB: user.maxUploadSize ? String(Math.round(parseInt(user.maxUploadSize) / (1024 * 1024))) : '',
      maxFilesPerUpload: user.maxFilesPerUpload ? String(user.maxFilesPerUpload) : '',
      allowedExtensions: user.allowedExtensions || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const uploadFields = {
        maxUploadSize: form.maxUploadSizeMB ? String(parseInt(form.maxUploadSizeMB) * 1024 * 1024) : '',
        maxFilesPerUpload: form.maxFilesPerUpload || '',
        allowedExtensions: form.allowedExtensions || '',
      };
      if (editUser) {
        await adminApi.updateUser(editUser.id, {
          name: form.name,
          email: form.email,
          role: form.role,
          storageQuota: form.storageQuota,
          password: form.password || undefined,
          ...uploadFields,
        });
      } else {
        await adminApi.createUser({ ...form, ...uploadFields });
      }
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleScheduleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteUser(deleteTarget.id, false, deleteTimerMinutes);
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteUser(deleteTarget.id, true);
      loadUsers();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleBan = async (user: User) => {
    try {
      if (user.status === 'BANNED') {
        await adminApi.unbanUser(user.id);
      } else {
        await adminApi.banUser(user.id);
      }
      loadUsers();
    } catch (err) {
      console.error('Ban/unban failed:', err);
    }
  };

  const handleImpersonate = async (user: User) => {
    try {
      await impersonate(user.id);
    } catch (err) {
      console.error('Impersonation failed:', err);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifyError('');
    setNotifySuccess('');
    if (!notifyForm.sendToAll && notifySelectedIds.length === 0) {
      setNotifyError('Please select at least one user or enable "Send to all".');
      return;
    }
    try {
      const { data } = await adminApi.sendNotification({
        title: notifyForm.title,
        message: notifyForm.message,
        sendToAll: notifyForm.sendToAll,
        userIds: notifyForm.sendToAll ? [] : notifySelectedIds,
      });
      setNotifySuccess(`Notification sent to ${data.sent} user(s)`);
      setNotifyForm({ title: '', message: '', sendToAll: true });
      setTimeout(() => { setShowNotifyModal(false); setNotifySuccess(''); }, 1500);
    } catch (err: any) {
      setNotifyError(err.response?.data?.error || 'Failed to send notification');
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
      BANNED: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      DELETED: 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${styles[status] || 'bg-slate-50 border border-slate-200 dark:bg-slate-700 dark:border-slate-600'}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'ACTIVE' ? 'bg-emerald-500' : status === 'BANNED' ? 'bg-red-500' : 'bg-slate-400'}`} />
        {status}
      </span>
    );
  };

  const roleBadge = (role: string) => {
    if (role === 'SYSADMIN') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800">Admin</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600">User</span>;
  };

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const formatCountdown = (scheduledDeletionAt: string) => {
    const remaining = Math.max(0, new Date(scheduledDeletionAt).getTime() - now);
    if (remaining === 0) return 'Deleting...';
    const totalSecs = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Create, edit, and manage user accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setNotifyError(''); setNotifySuccess(''); setShowNotifyModal(true); }}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold transition-all shadow-sm"
          >
            <Bell size={16} />
            Send Notification
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <UserPlus size={16} />
            Create User
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search users by name, email, or username..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="spinner mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
            <Users size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">No users found</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">{search ? 'Try a different search term' : 'Create your first user to get started'}</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="hidden sm:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="hidden md:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Storage</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 dark:border-slate-700 last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                          {initials(user.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{roleBadge(user.role)}</td>
                    <td className="hidden sm:table-cell px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        {statusBadge(user.status)}
                        {user.status === 'DELETED' && user.scheduledDeletionAt && (
                          <span className="flex items-center gap-1 text-[11px] text-red-500 dark:text-red-400 font-medium">
                            <Clock size={11} />
                            {formatCountdown(user.scheduledDeletionAt)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-5 py-3.5">
                      <div className="text-sm">
                        <span className="text-slate-700 dark:text-slate-200 font-medium">{formatBytes(user.storageUsed)}</span>
                        <span className="text-slate-400 dark:text-slate-500"> / {formatBytes(user.storageQuota)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(user)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleBan(user)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${user.status === 'BANNED' ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30' : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'}`}
                          title={user.status === 'BANNED' ? 'Unban' : 'Ban'}
                        >
                          {user.status === 'BANNED' ? <CheckCircle size={14} /> : <Ban size={14} />}
                        </button>
                        <button
                          onClick={() => handleImpersonate(user)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition"
                          title="Impersonate"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => { setDeleteTimerMinutes(60); setDeleteTarget(user); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete User Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Delete User</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{deleteTarget.name}</p>
                </div>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition text-slate-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Scheduled delete */}
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Schedule deletion — select grace period:</p>
                <select
                  value={deleteTimerMinutes}
                  onChange={e => setDeleteTimerMinutes(Number(e.target.value))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                  <option value={10}>10 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={480}>8 hours</option>
                  <option value={1440}>24 hours</option>
                </select>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                  User and all their data will be permanently deleted after this period.
                </p>
                <button
                  onClick={handleScheduleDelete}
                  className="mt-3 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition"
                >
                  Schedule Deletion
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-700" /></div>
                <div className="relative flex justify-center"><span className="px-2 bg-white dark:bg-slate-800 text-xs text-slate-400">or</span></div>
              </div>

              {/* Permanent delete */}
              <div className="rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 p-4">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Immediately and permanently deletes the user and all their files. This cannot be undone.
                  </p>
                </div>
                <button
                  onClick={handlePermanentDelete}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition"
                >
                  Delete Permanently Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 modal-enter max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <UserPlus size={18} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{editUser ? 'Edit User' : 'Create User'}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded-lg text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white"
                  required
                />
              </div>
              {!editUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
                  <input
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white"
                    required
                  />
                </div>
              )}
              {editUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
                  <p className="text-sm text-slate-500 dark:text-slate-400 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50">@{editUser.username}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {editUser ? 'New Password (leave empty to keep)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white"
                  required={!editUser}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white"
                  >
                    <option value="USER">User</option>
                    <option value="SYSADMIN">SysAdmin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Quota (GB)</label>
                  <input
                    type="number"
                    value={Math.round(parseInt(form.storageQuota) / 1073741824)}
                    onChange={(e) => setForm({ ...form, storageQuota: String(parseInt(e.target.value) * 1073741824) })}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white"
                    min="1"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Upload Controls</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Max Upload Size (MB)</label>
                    <input
                      type="number"
                      value={form.maxUploadSizeMB}
                      onChange={(e) => setForm({ ...form, maxUploadSizeMB: e.target.value })}
                      placeholder="100"
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Max Files Per Upload</label>
                    <input
                      type="number"
                      value={form.maxFilesPerUpload}
                      onChange={(e) => setForm({ ...form, maxFilesPerUpload: e.target.value })}
                      placeholder="10"
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white"
                      min="1"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Allowed Extensions</label>
                  <input
                    value={form.allowedExtensions}
                    onChange={(e) => setForm({ ...form, allowedExtensions: e.target.value })}
                    placeholder="pdf, jpg, png, docx (empty = all)"
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                  />
                </div>
              </div>
            </form>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 rounded-b-2xl">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition">
                Cancel
              </button>
              <button
                onClick={(e) => { e.preventDefault(); const formEl = (e.target as HTMLElement).closest('.modal-enter')?.querySelector('form'); formEl?.requestSubmit(); }}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
              >
                {editUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowNotifyModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 modal-enter" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                  <Bell size={18} className="text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Send Notification</h2>
              </div>
              <button onClick={() => setShowNotifyModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSendNotification} className="p-6 space-y-4">
              {notifyError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {notifyError}
                </div>
              )}
              {notifySuccess && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-2 rounded-lg text-sm">
                  {notifySuccess}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title</label>
                <input
                  value={notifyForm.title}
                  onChange={(e) => setNotifyForm({ ...notifyForm, title: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white"
                  placeholder="Notification title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Message</label>
                <textarea
                  value={notifyForm.message}
                  onChange={(e) => setNotifyForm({ ...notifyForm, message: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition resize-none bg-white dark:bg-slate-700 dark:text-white"
                  rows={3}
                  placeholder="Notification message..."
                  required
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="sendToAll"
                    checked={notifyForm.sendToAll}
                    onChange={(e) => setNotifyForm({ ...notifyForm, sendToAll: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded border-slate-300 dark:border-slate-600"
                  />
                  <label htmlFor="sendToAll" className="text-sm text-slate-700 dark:text-slate-300">Send to all active users</label>
                </div>
                {!notifyForm.sendToAll && (
                  <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <Search size={14} className="text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={notifySearch}
                          onChange={e => setNotifySearch(e.target.value)}
                          placeholder="Search users..."
                          className="w-full text-sm bg-transparent text-slate-700 dark:text-slate-200 outline-none placeholder-slate-400"
                        />
                      </div>
                    </div>
                    {notifySelectedIds.length > 0 && (
                      <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300 border-b border-slate-100 dark:border-slate-700">
                        {notifySelectedIds.length} user{notifySelectedIds.length !== 1 ? 's' : ''} selected
                      </div>
                    )}
                    <div className="max-h-48 overflow-y-auto">
                      {notifyUsers
                        .filter(u => u.status === 'ACTIVE')
                        .filter(u => {
                          const q = notifySearch.toLowerCase();
                          return !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                        })
                        .map(u => (
                          <label key={u.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifySelectedIds.includes(u.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setNotifySelectedIds(prev => [...prev, u.id]);
                                } else {
                                  setNotifySelectedIds(prev => prev.filter(id => id !== u.id));
                                }
                              }}
                              className="w-4 h-4 accent-blue-600 rounded shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{u.name}</p>
                              <p className="text-xs text-slate-400 truncate">{u.email}</p>
                            </div>
                          </label>
                        ))
                      }
                      {notifyUsers.filter(u => u.status === 'ACTIVE').length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">No active users found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </form>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 rounded-b-2xl">
              <button type="button" onClick={() => setShowNotifyModal(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition">
                Cancel
              </button>
              <button
                onClick={(e) => { e.preventDefault(); const formEl = (e.target as HTMLElement).closest('.modal-enter')?.querySelector('form'); formEl?.requestSubmit(); }}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-sm"
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
