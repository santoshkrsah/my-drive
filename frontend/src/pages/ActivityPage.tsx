import { useState, useEffect } from 'react';
import { activityApi } from '../services/api';
import { Clock, Filter, Trash2, X, AlertTriangle } from 'lucide-react';

interface ActivityItem {
  id: number;
  userId: number;
  actionType: string;
  resourceType: string;
  resourceId: number | null;
  resourceName: string | null;
  details: string | null;
  createdAt: string;
}

const actionLabels: Record<string, string> = {
  FILE_UPLOAD: 'Uploaded file',
  FILE_DELETE: 'Deleted file',
  FILE_RESTORE: 'Restored file',
  FILE_RENAME: 'Renamed file',
  FILE_MOVE: 'Moved file',
  FILE_DOWNLOAD: 'Downloaded file',
  FILE_SHARE: 'Shared file',
  FOLDER_CREATE: 'Created folder',
  FOLDER_DELETE: 'Deleted folder',
  FOLDER_RENAME: 'Renamed folder',
  FOLDER_MOVE: 'Moved folder',
  FOLDER_RESTORE: 'Restored folder',
  FOLDER_SHARE: 'Shared folder',
};

const actionColors: Record<string, string> = {
  FILE_UPLOAD: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  FILE_DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  FILE_RESTORE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  FILE_RENAME: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  FILE_MOVE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  FILE_DOWNLOAD: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  FILE_SHARE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  FOLDER_CREATE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  FOLDER_DELETE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  FOLDER_RENAME: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  FOLDER_MOVE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  FOLDER_RESTORE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  FOLDER_SHARE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionType, setActionType] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadActivity();
  }, [page, actionType]);

  const loadActivity = async () => {
    setLoading(true);
    try {
      const { data } = await activityApi.myActivity(page, 50, actionType || undefined);
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleClearActivity = async () => {
    setClearing(true);
    try {
      await activityApi.clearMyActivity();
      setShowClearModal(false);
      setPage(1);
      loadActivity();
    } catch (err) {
      console.error('Failed to clear activity:', err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Activity</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your recent actions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Trash2 size={16} />
            Reset Activity
          </button>
          <Filter size={16} className="text-slate-400" />
          <select
            value={actionType}
            onChange={e => { setActionType(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
          >
            <option value="">All Actions</option>
            <option value="FILE_UPLOAD">Uploads</option>
            <option value="FILE_DELETE">Deletions</option>
            <option value="FILE_RESTORE">Restores</option>
            <option value="FILE_RENAME">Renames</option>
            <option value="FILE_MOVE">Moves</option>
            <option value="FILE_DOWNLOAD">Downloads</option>
            <option value="FILE_SHARE">File Shares</option>
            <option value="FOLDER_CREATE">Folder Created</option>
            <option value="FOLDER_DELETE">Folder Deleted</option>
            <option value="FOLDER_RENAME">Folder Renamed</option>
            <option value="FOLDER_MOVE">Folder Moved</option>
            <option value="FOLDER_RESTORE">Folder Restored</option>
            <option value="FOLDER_SHARE">Folder Shares</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <Clock size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-400">No activity yet</h3>
          <p className="text-sm text-slate-400 mt-1">Your actions will appear here</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">Action</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">Resource</th>
                  <th className="hidden sm:table-cell text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">Details</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-6 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50/70 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${actionColors[log.actionType] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                        {actionLabels[log.actionType] || log.actionType}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-200 max-w-[150px] sm:max-w-[200px] truncate font-medium">{log.resourceName || '—'}</td>
                    <td className="hidden sm:table-cell px-6 py-3 text-sm text-slate-500 dark:text-slate-400 max-w-[150px] sm:max-w-[300px] truncate">{log.details || '—'}</td>
                    <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors dark:text-white"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors dark:text-white"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Clear Activity Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowClearModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Clear All Activity</h2>
              </div>
              <button onClick={() => setShowClearModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition text-slate-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Are you sure you want to delete all your activity logs? This action cannot be undone and will permanently remove your entire activity history from the database.
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
                  onClick={handleClearActivity}
                  disabled={clearing}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {clearing ? 'Clearing...' : 'Delete All Activity'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
