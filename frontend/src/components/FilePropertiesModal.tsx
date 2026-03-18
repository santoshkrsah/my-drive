import { useState } from 'react';
import { X, Info, Copy, Check } from 'lucide-react';
import type { FileItem, Folder } from '../types';
import { formatBytes } from './StorageBar';

interface Props {
  open: boolean;
  onClose: () => void;
  file: FileItem | null;
  folders?: Folder[];
}

function getMimeTypeLabel(mimeType: string): string {
  if (mimeType.startsWith('image/')) return `Image (${mimeType.split('/')[1].toUpperCase()})`;
  if (mimeType.startsWith('video/')) return `Video (${mimeType.split('/')[1].toUpperCase()})`;
  if (mimeType.startsWith('audio/')) return `Audio (${mimeType.split('/')[1].toUpperCase()})`;
  if (mimeType.includes('pdf')) return 'PDF Document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'Spreadsheet';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Word Document';
  if (mimeType.includes('text/plain')) return 'Plain Text';
  if (mimeType.includes('zip')) return 'ZIP Archive';
  if (mimeType.includes('rar')) return 'RAR Archive';
  if (mimeType.includes('tar')) return 'TAR Archive';
  if (mimeType.includes('compress')) return 'Compressed Archive';
  return mimeType;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function FilePropertiesModal({ open, onClose, file, folders = [] }: Props) {
  const [copied, setCopied] = useState(false);

  if (!open || !file) return null;

  const folderName = file.folderId
    ? (folders.find(f => f.id === file.folderId)?.name ?? `Folder #${file.folderId}`)
    : 'My Files';

  const handleCopyHash = () => {
    if (file.fileHash) {
      navigator.clipboard.writeText(file.fileHash).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'Name', value: <span className="font-medium break-all">{file.originalName}</span> },
    { label: 'Type', value: getMimeTypeLabel(file.mimeType) },
    { label: 'Size', value: formatBytes(file.fileSize) },
    { label: 'Location', value: folderName },
    { label: 'Created', value: formatDate(file.uploadDate) },
    { label: 'Last Accessed', value: formatDate(file.lastAccessedAt) },
  ];

  if (file.fileHash) {
    rows.push({
      label: 'Hash (SHA-256)',
      value: (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={file.fileHash}>
            {file.fileHash.substring(0, 16)}…
          </span>
          <button
            onClick={handleCopyHash}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition flex-shrink-0"
            title="Copy hash"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
          </button>
        </div>
      ),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <Info size={18} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">File Properties</h2>
          <button onClick={onClose} className="ml-auto p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-start gap-4">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-28 shrink-0 mt-0.5">
                {label}
              </span>
              <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
