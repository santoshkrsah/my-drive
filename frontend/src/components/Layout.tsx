import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ImpersonationBanner from './ImpersonationBanner';
import StorageWidget from './StorageWidget';
import NotificationBell from './NotificationBell';
import { useDarkMode } from '../hooks/useDarkMode';
import { adminApi, authApi } from '../services/api';
import {
  LayoutDashboard,
  Trash2,
  Users,
  Activity,
  LogOut,
  HardDrive,
  Shield,
  ChevronRight,
  Share2,
  Clock,
  Star,
  Sun,
  Moon,
  Menu,
  X,
  FolderOpen,
  Tag,
  ArchiveRestore,
  Lock,
  Copy,
} from 'lucide-react';

export default function Layout() {
  const { user, logout, impersonatedBy } = useAuth();
  const location = useLocation();
  const { isDark, toggle } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recoverableCount, setRecoverableCount] = useState(0);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const openPwModal = () => {
    setPwCurrent(''); setPwNew(''); setPwConfirm('');
    setPwSuccess(''); setPwError('');
    setPwModalOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccess(''); setPwError('');
    if (pwNew.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (pwNew !== pwConfirm) { setPwError('Passwords do not match.'); return; }
    setPwSaving(true);
    try {
      await authApi.changePassword(pwCurrent, pwNew);
      setPwSuccess('Password changed successfully.');
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
    } catch (err: any) {
      setPwError(err?.response?.data?.error || 'Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  };

  const isAdmin = user?.role === 'SYSADMIN' && !impersonatedBy;

  useEffect(() => {
    if (!isAdmin) return;
    const fetchCount = () => {
      adminApi.recoverableUnviewedCount().then(({ data }) => setRecoverableCount(data.count)).catch(() => {});
    };
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [isAdmin]);

  const isActive = (path: string) => location.pathname === path;

  const navItem = (path: string, label: string, icon: React.ReactNode) => (
    <Link
      to={path}
      onClick={() => setSidebarOpen(false)}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
        ${isActive(path)
          ? 'bg-white/12 text-white shadow-sm'
          : 'text-slate-300 hover:bg-white/8 hover:text-white'
        }`}
    >
      <span className={`transition-colors ${isActive(path) ? 'text-blue-300' : 'text-slate-400 group-hover:text-slate-300'}`}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {isActive(path) && <ChevronRight size={14} className="text-slate-400" />}
    </Link>
  );

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 flex flex-col">
      <ImpersonationBanner />
      <div className="flex flex-1 min-h-0">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-[260px] bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shrink-0
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:overflow-y-auto
        `}>
          {/* Brand */}
          <div className="px-5 py-5 border-b border-white/8 flex items-center justify-between">
            <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 rounded-lg shadow-md">
                <HardDrive size={20} />
              </div>
              <span className="text-lg font-bold tracking-tight">My Drive</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition md:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItem('/', 'Dashboard', <LayoutDashboard size={18} />)}
            {navItem('/files', 'My Files', <FolderOpen size={18} />)}
            {navItem('/recent', 'Recent', <Clock size={18} />)}
            {navItem('/starred', 'Starred', <Star size={18} />)}
            {navItem('/shared', 'Shared Files', <Share2 size={18} />)}
            {navItem('/trash', 'Trash', <Trash2 size={18} />)}
            {navItem('/activity', 'My Activity', <Clock size={18} />)}
            {navItem('/tags', 'My Tags', <Tag size={18} />)}
            {navItem('/duplicates', 'Duplicates', <Copy size={18} />)}

            {isAdmin && (
              <>
                <div className="pt-5 pb-2 px-3">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                    Administration
                  </p>
                </div>
                {navItem('/admin', 'Dashboard', <Shield size={18} />)}
                {navItem('/admin/users', 'Manage Users', <Users size={18} />)}
                {navItem('/admin/logs', 'Activity Logs', <Activity size={18} />)}
                <Link
                  to="/admin/recoverable-files"
                  onClick={() => { setSidebarOpen(false); setRecoverableCount(0); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                    ${isActive('/admin/recoverable-files')
                      ? 'bg-white/12 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/8 hover:text-white'
                    }`}
                >
                  <span className={`transition-colors ${isActive('/admin/recoverable-files') ? 'text-blue-300' : 'text-slate-400 group-hover:text-slate-300'}`}>
                    <ArchiveRestore size={18} />
                  </span>
                  <span className="flex-1">Recoverable Files</span>
                  {recoverableCount > 0 && (
                    <span className="flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {recoverableCount > 99 ? '99+' : recoverableCount}
                    </span>
                  )}
                  {isActive('/admin/recoverable-files') && <ChevronRight size={14} className="text-slate-400" />}
                </Link>
              </>
            )}
          </nav>

          {/* Storage widget */}
          <StorageWidget />

          {/* User panel */}
          <div className="px-3 py-4 border-t border-white/8">
            <div className="flex items-center gap-3 px-3 py-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold shadow-inner">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={openPwModal}
                className="flex items-center justify-center gap-1.5 bg-white/6 hover:bg-white/12 text-slate-300 hover:text-white p-2.5 rounded-xl text-sm font-medium transition-all"
                title="Change Password"
              >
                <Lock size={16} />
              </button>
              <button
                onClick={logout}
                className="flex-1 flex items-center justify-center gap-2 bg-white/6 hover:bg-white/12 text-slate-300 hover:text-white py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-y-auto min-w-0">
          {/* Sticky header */}
          <div className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b border-slate-100/80 dark:border-slate-800 shrink-0">
            {/* Mobile header with hamburger */}
            <div className="flex items-center gap-3 px-4 py-3 md:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <Link to="/" className="flex items-center gap-2 flex-1">
                <div className="p-1.5 bg-blue-600 rounded-lg shadow-sm text-white">
                  <HardDrive size={16} />
                </div>
                <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">My Drive</span>
              </Link>
              <button
                onClick={toggle}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <NotificationBell />
            </div>
            {/* Desktop notification bell + dark mode toggle */}
            <div className="hidden md:flex items-center justify-end gap-2 px-8 py-3">
              <button
                onClick={toggle}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <NotificationBell />
            </div>
          </div>
          {/* Scrollable content area */}
          <div className="flex-1 px-4 md:px-8 py-4 md:py-8">
            <div className="max-w-[1200px] mx-auto animate-in">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Change Password Modal */}
      {pwModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock size={16} className="text-slate-500" />
                Change Password
              </h2>
              <button onClick={() => setPwModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={pwCurrent}
                  onChange={e => setPwCurrent(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={pwNew}
                  onChange={e => setPwNew(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {pwError && <p className="text-sm text-red-600 dark:text-red-400">{pwError}</p>}
              {pwSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400">{pwSuccess}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition"
                >
                  {pwSaving ? 'Saving...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setPwModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
