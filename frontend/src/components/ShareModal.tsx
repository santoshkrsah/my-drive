import { useState, useEffect } from 'react';
import { shareApi } from '../services/api';
import type { FileItem, FileShareItem, FolderShareItem } from '../types';
import { Share2, X, UserPlus, Trash2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  file?: FileItem | null;
  folder?: { id: number; name: string; parentId: number | null; createdAt: string } | null;
}

export default function ShareModal({ open, onClose, file, folder }: Props) {
  const [username, setUsername] = useState('');
  const [permission, setPermission] = useState<'VIEW' | 'DOWNLOAD'>('VIEW');
  const [shares, setShares] = useState<(FileShareItem | FolderShareItem)[]>([]);
  const [sharing, setSharing] = useState(false);
  const [loadingShares, setLoadingShares] = useState(false);
  const [error, setError] = useState('');

  const isFolder = !!folder;
  const item = folder || file;

  const loadShares = async () => {
    if (!item) return;
    setLoadingShares(true);
    try {
      if (isFolder) {
        const res = await shareApi.folderShares(folder!.id);
        setShares(res.data.shares || res.data);
      } else {
        const res = await shareApi.fileShares(file!.id);
        setShares(res.data.shares || res.data);
      }
    } catch (err) {
      console.error('Failed to load shares:', err);
    } finally {
      setLoadingShares(false);
    }
  };

  useEffect(() => {
    if (open && item) {
      setUsername('');
      setPermission('VIEW');
      setError('');
      loadShares();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id]);

  if (!open || !item) return null;

  const handleShare = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Username is required');
      return;
    }

    setSharing(true);
    setError('');

    try {
      if (isFolder) {
        await shareApi.shareFolder(folder!.id, trimmed, permission);
      } else {
        await shareApi.share(file!.id, trimmed, permission);
      }
      setUsername('');
      setPermission('VIEW');
      await loadShares();
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to share ${isFolder ? 'folder' : 'file'}`);
    } finally {
      setSharing(false);
    }
  };

  const handleRemove = async (shareId: number) => {
    try {
      if (isFolder) {
        await shareApi.removeFolderShare(shareId);
      } else {
        await shareApi.remove(shareId);
      }
      await loadShares();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove share');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !sharing) {
      handleShare();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 modal-enter" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Share2 size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {isFolder ? 'Share Folder' : 'Share File'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[250px]">
                {isFolder ? folder!.name : file!.originalName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Share form */}
          <div className="flex gap-2">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter username"
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <select
              value={permission}
              onChange={e => setPermission(e.target.value as 'VIEW' | 'DOWNLOAD')}
              className="px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="VIEW">View</option>
              <option value="DOWNLOAD">Download</option>
            </select>
            <button
              onClick={handleShare}
              disabled={!username.trim() || sharing}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <UserPlus size={15} />
              {sharing ? 'Sharing...' : 'Share'}
            </button>
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Existing shares */}
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Shared With</h3>
            {loadingShares ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner" />
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  This {isFolder ? 'folder' : 'file'} has not been shared with anyone yet
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {shares.map((share) => (
                  <div key={share.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2.5 group">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {share.sharedWith.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{share.sharedWith.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">@{share.sharedWith.username} &middot; {share.permission}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(share.id)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition text-red-500 dark:text-red-400"
                      title="Remove access"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
