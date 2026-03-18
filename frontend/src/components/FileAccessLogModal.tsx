import { useState, useEffect, useCallback } from 'react';
import { fileApi } from '../services/api';
import type { FileItem } from '../types';
import { X, Download, Eye, ClipboardList } from 'lucide-react';

interface AccessLogEntry {
  id: number;
  userId: number;
  actionType: string;
  createdAt: string;
  user: { id: number; name: string; username: string };
}

interface Props {
  open: boolean;
  onClose: () => void;
  file: FileItem | null;
}

export default function FileAccessLogModal({ open, onClose, file }: Props) {
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    try {
      const { data } = await fileApi.accessLog(file.id, page, 20);
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load access log:', err);
    } finally {
      setLoading(false);
    }
  }, [file, page]);

  useEffect(() => {
    if (open) loadLogs();
  }, [open, loadLogs]);

  useEffect(() => {
    if (!open) {
      setLogs([]);
      setPage(1);
      setTotalPages(1);
    }
  }, [open]);

  if (!open || !file) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <ClipboardList size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Access Log</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[240px]">{file.originalName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="spinner mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading access log...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                <ClipboardList size={22} className="text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No access events yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Downloads and previews will appear here</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{log.user.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">@{log.user.username}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.actionType === 'FILE_DOWNLOAD'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {log.actionType === 'FILE_DOWNLOAD'
                          ? <Download size={11} />
                          : <Eye size={11} />}
                        {log.actionType === 'FILE_DOWNLOAD' ? 'Download' : 'Preview'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-slate-700 dark:text-slate-200">{new Date(log.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 px-6 py-3 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
