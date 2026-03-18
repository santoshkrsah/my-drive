import { useState, useEffect, useMemo } from 'react';
import { fileApi } from '../services/api';
import { Pencil, X } from 'lucide-react';
import type { FileItem } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onRenamed: () => void;
  file: FileItem | null;
  userRole?: string;
}

export default function RenameModal({ open, onClose, onRenamed, file, userRole = 'USER' }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isSysadmin = userRole === 'SYSADMIN';

  // Split filename into basename and extension for non-SYSADMIN users
  const { basename, extension } = useMemo(() => {
    if (!file) return { basename: '', extension: '' };
    const orig = file.originalName;
    const dotIdx = orig.lastIndexOf('.');
    if (dotIdx > 0) {
      return { basename: orig.substring(0, dotIdx), extension: orig.substring(dotIdx) };
    }
    return { basename: orig, extension: '' };
  }, [file]);

  useEffect(() => {
    if (file && open) {
      if (isSysadmin) {
        setName(file.originalName);
      } else {
        setName(basename);
      }
      setError('');
    }
  }, [file, open, isSysadmin, basename]);

  if (!open || !file) return null;

  const handleSubmit = async () => {
    const finalName = isSysadmin ? name.trim() : (name.trim() + extension);
    if (!finalName) return;
    setSaving(true);
    setError('');
    try {
      await fileApi.rename(file.id, finalName);
      onRenamed();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Rename failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
            <Pencil size={18} className="text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Rename File</h2>
          <button onClick={onClose} className="ml-auto p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5">
          {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl">{error}</div>}
          {isSysadmin ? (
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-0">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="flex-1 min-w-0 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-l-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                autoFocus
              />
              {extension && (
                <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-600 border border-l-0 border-slate-200 dark:border-slate-600 rounded-r-xl text-sm text-slate-500 dark:text-slate-300 select-none">
                  {extension}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-sm"
          >
            {saving ? 'Saving...' : 'Rename'}
          </button>
        </div>
      </div>
    </div>
  );
}
