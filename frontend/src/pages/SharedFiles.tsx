import { useState, useEffect, useCallback } from 'react';
import { shareApi, fileApi } from '../services/api';
import type { FileShareItem, FolderShareItem } from '../types';
import { formatBytes } from '../components/StorageBar';
import FileThumbnail from '../components/FileThumbnail';
import { Download, Trash2, FileIcon, Share2, Folder as FolderIcon } from 'lucide-react';

type Tab = 'with-me' | 'by-me';

export default function SharedFiles() {
  const [tab, setTab] = useState<Tab>('with-me');
  const [shares, setShares] = useState<FileShareItem[]>([]);
  const [folderShares, setFolderShares] = useState<FolderShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = localStorage.getItem('pageSize');
    return saved ? parseInt(saved) : 20;
  });

  const loadShares = useCallback(async () => {
    setLoading(true);
    try {
      const fetcher = tab === 'with-me' ? shareApi.sharedWithMe : shareApi.sharedByMe;
      const { data } = await fetcher(page, pageSize);
      setShares(data.shares ?? []);
      setFolderShares(data.folderShares ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      console.error('Failed to load shared files:', err);
    } finally {
      setLoading(false);
    }
  }, [tab, page, pageSize]);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  const handleTabChange = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    setPage(1);
  };

  const handleDownload = async (share: FileShareItem) => {
    try {
      const response = await fileApi.download(share.fileId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', share.file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleRemoveShare = async (share: FileShareItem) => {
    if (!confirm(`Remove share for "${share.file.originalName}"?`)) return;
    try {
      await shareApi.remove(share.id);
      loadShares();
    } catch (err) {
      console.error('Remove share failed:', err);
    }
  };

  const handleRemoveFolderShare = async (share: FolderShareItem) => {
    if (!confirm(`Remove share for folder "${share.folder.name}"?`)) return;
    try {
      await shareApi.removeFolderShare(share.id);
      loadShares();
    } catch (err) {
      console.error('Remove folder share failed:', err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Shared Files</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Files shared with you and by you</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleTabChange('with-me')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'with-me'
              ? 'bg-blue-600 text-white'
              : 'border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
          }`}
        >
          Shared with me
        </button>
        <button
          onClick={() => handleTabChange('by-me')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'by-me'
              ? 'bg-blue-600 text-white'
              : 'border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
          }`}
        >
          Shared by me
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="spinner mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading shared files...</p>
        </div>
      ) : shares.length === 0 && folderShares.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
            <Share2 size={28} className="text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">
            {tab === 'with-me' ? 'No files shared with you' : 'You haven\'t shared any files'}
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {tab === 'with-me'
              ? 'Files others share with you will appear here'
              : 'Files you share with others will appear here'}
          </p>
        </div>
      ) : (
        <>
          {/* Shared Folders */}
          {folderShares.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                Shared Folders
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {folderShares.map((share) => (
                  <div
                    key={share.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                        <FolderIcon size={20} className="text-amber-500 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          {share.folder.name}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {tab === 'with-me' ? `From ${share.sharedBy.name}` : `To ${share.sharedWith.name}`}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              share.permission === 'VIEW'
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {share.permission}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {new Date(share.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {tab === 'by-me' && (
                        <button
                          onClick={() => handleRemoveFolderShare(share)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition md:opacity-0 md:group-hover:opacity-100"
                          title="Remove share"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shared Files Table */}
          {shares.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="hidden sm:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Size</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {tab === 'with-me' ? 'Shared By' : 'Shared With'}
                    </th>
                    <th className="hidden md:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Permission</th>
                    <th className="hidden md:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shares.map((share) => (
                    <tr key={share.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-700/50 transition-colors group">
                      <td className="px-3 sm:px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <FileThumbnail
                            fileId={share.fileId}
                            mimeType={share.file.mimeType}
                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                            fallback={
                              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                <FileIcon size={18} className="text-slate-400 dark:text-slate-500" />
                              </div>
                            }
                          />
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px] sm:max-w-xs">
                            {share.file.originalName}
                          </span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                        {formatBytes(share.file.fileSize)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                        {tab === 'with-me' ? share.sharedBy.name : share.sharedWith.name}
                      </td>
                      <td className="hidden md:table-cell px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            share.permission === 'VIEW'
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {share.permission}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(share.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {tab === 'with-me' && share.permission === 'DOWNLOAD' && (
                            <button
                              onClick={() => handleDownload(share)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition"
                              title="Download"
                            >
                              <Download size={13} />
                              Download
                            </button>
                          )}
                          {tab === 'by-me' && (
                            <button
                              onClick={() => handleRemoveShare(share)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition"
                              title="Remove share"
                            >
                              <Trash2 size={13} />
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 mt-5 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 dark:text-slate-400">Per page:</label>
                <select
                  value={pageSize}
                  onChange={e => {
                    const size = parseInt(e.target.value);
                    setPageSize(size);
                    setPage(1);
                    localStorage.setItem('pageSize', String(size));
                  }}
                  className="text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[10, 25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
