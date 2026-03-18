import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';
import type { ActivityLog } from '../types';
import { Activity, Filter, Trash2, X, AlertTriangle } from 'lucide-react';

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getLogs(page, 50, actionFilter || undefined);
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleClearLogs = async () => {
    setClearing(true);
    try {
      await adminApi.clearLogs();
      setShowClearModal(false);
      setPage(1);
      loadLogs();
    } catch (err) {
      console.error('Failed to clear logs:', err);
    } finally {
      setClearing(false);
    }
  };

  const actionTypes = [
    'CREATE_USER', 'UPDATE_USER', 'SOFT_DELETE_USER', 'PERMANENT_DELETE_USER',
    'BAN_USER', 'UNBAN_USER', 'IMPERSONATE', 'STOP_IMPERSONATION',
  ];

  const actionBadge = (action: string) => {
    const styles: Record<string, string> = {
      CREATE_USER: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
      UPDATE_USER: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
      SOFT_DELETE_USER: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
      PERMANENT_DELETE_USER: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      BAN_USER: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      UNBAN_USER: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
      IMPERSONATE: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800',
      STOP_IMPERSONATION: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
    };
    const label = action.replace(/_/g, ' ');
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide ${styles[action] || 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}>
        {label}
      </span>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity Logs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track all administrative actions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Trash2 size={16} />
            Reset Logs
          </button>
          <Filter size={15} className="text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-800 dark:text-white pr-8"
          >
            <option value="">All Actions</option>
            {actionTypes.map((at) => (
              <option key={at} value={at}>{at.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="spinner mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
            <Activity size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">No activity logs</p>
          <p className="text-sm text-slate-400">{actionFilter ? 'No logs match this filter' : 'Admin actions will appear here'}</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Admin</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                  <th className="hidden sm:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target</th>
                  <th className="hidden md:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Details</th>
                  <th className="hidden lg:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <div>
                        <p className="text-slate-700 dark:text-slate-200 font-medium">{new Date(log.timestamp).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{log.admin?.username || '-'}</span>
                    </td>
                    <td className="px-5 py-3.5">{actionBadge(log.actionType)}</td>
                    <td className="hidden sm:table-cell px-5 py-3.5">
                      {log.targetUser ? (
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{log.targetUser.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">@{log.targetUser.username}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{log.details || '-'}</td>
                    <td className="hidden lg:table-cell px-5 py-3.5">
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded">{log.ipAddress || '-'}</span>
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

      {/* Clear Logs Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowClearModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Clear All Logs</h2>
              </div>
              <button onClick={() => setShowClearModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition text-slate-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Are you sure you want to delete all activity logs? This action cannot be undone and will permanently remove all admin activity history from the database.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearModal(false)}
                  disabled={clearing}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearLogs}
                  disabled={clearing}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {clearing ? 'Clearing...' : 'Delete All Logs'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
