import { useState, useEffect } from 'react';
import { publicLinkApi } from '../services/api';
import { Link2, X, Copy, Trash2, Check } from 'lucide-react';
import type { FileItem, PublicLinkItem } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  file: FileItem | null;
}

export default function PublicLinkModal({ open, onClose, file }: Props) {
  const [links, setLinks] = useState<PublicLinkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxDownloads, setMaxDownloads] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    if (open && file) {
      loadLinks();
    }
  }, [open, file]);

  const loadLinks = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const { data } = await publicLinkApi.listForFile(file.id);
      setLinks(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (!open || !file) return null;

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const options: any = {};
      if (password) options.password = password;
      if (expiresAt) options.expiresAt = expiresAt;
      if (maxDownloads) options.maxDownloads = parseInt(maxDownloads);
      await publicLinkApi.create(file.id, options);
      setPassword('');
      setExpiresAt('');
      setMaxDownloads('');
      loadLinks();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create link');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (token: string, linkId: number) => {
    const url = `${window.location.origin}/public/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(linkId);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRevoke = async (id: number) => {
    try {
      await publicLinkApi.revoke(id);
      loadLinks();
    } catch { /* ignore */ }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <Link2 size={18} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Public Links</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[300px]">{file.originalName}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X size={18} className="text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-4">
          {error && <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl">{error}</div>}

          <div className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="Password (optional)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
            <div className="flex gap-3">
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
              <input
                type="number"
                placeholder="Max downloads"
                value={maxDownloads}
                onChange={e => setMaxDownloads(e.target.value)}
                className="w-36 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                min="1"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all"
            >
              {creating ? 'Creating...' : 'Generate Link'}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-4"><div className="spinner" /></div>
          ) : links.length > 0 ? (
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {links.map(link => (
                <div key={link.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">{`${window.location.origin}/public/${link.token}`}</p>
                    <div className="flex gap-2 mt-1">
                      {link.hasPassword && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Password</span>}
                      {link.expiresAt && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Expires</span>}
                      {link.maxDownloads && <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">{link.downloadCount}/{link.maxDownloads}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleCopy(link.token, link.id)} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-colors">
                    {copied === link.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400 dark:text-slate-500" />}
                  </button>
                  <button onClick={() => handleRevoke(link.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No public links yet</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 rounded-b-2xl">
          <button onClick={onClose} className="w-full py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
