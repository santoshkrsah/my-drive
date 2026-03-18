import { useState, useEffect, useRef } from 'react';
import { versionApi } from '../services/api';
import { formatBytes } from './StorageBar';
import type { FileItem, FileVersionItem } from '../types';
import { History, X, Upload, RotateCcw, Trash2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  file: FileItem | null;
  onVersionChange: () => void;
}

export default function VersionHistoryModal({ open, onClose, file, onVersionChange }: Props) {
  const [versions, setVersions] = useState<FileVersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadVersions = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await versionApi.history(file.id);
      setVersions(res.data.versions || res.data);
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && file) {
      setError('');
      loadVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file?.id]);

  if (!open || !file) return null;

  const handleUploadVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selected);

    try {
      await versionApi.upload(file.id, formData);
      await loadVersions();
      onVersionChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload new version');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRestore = async (versionId: number) => {
    setError('');
    try {
      await versionApi.restore(file.id, versionId);
      await loadVersions();
      onVersionChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to restore version');
    }
  };

  const handleDelete = async (versionId: number) => {
    if (!confirm('Delete this version? This cannot be undone.')) return;
    setError('');
    try {
      await versionApi.delete(versionId);
      await loadVersions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete version');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 modal-enter" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <History size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Version History</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[250px]">{file.originalName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Upload new version */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Upload size={15} />
            {uploading ? 'Uploading...' : 'Upload New Version'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUploadVersion}
          />

          {error && (
            <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded-lg text-sm">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Version list */}
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Versions</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">No version history available</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {versions.map((version) => (
                  <div key={version.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2.5 group">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">v{version.versionNumber}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{version.fileName}</p>
                      <p className="text-xs text-slate-400">
                        {formatBytes(version.fileSize)} &middot; {new Date(version.uploadedAt).toLocaleDateString()}{' '}
                        {new Date(version.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRestore(version.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                        title="Restore this version"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(version.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                        title="Delete this version"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
