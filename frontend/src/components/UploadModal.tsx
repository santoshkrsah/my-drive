import { useState, useRef, useEffect, useCallback } from 'react';
import { fileApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Upload, X, FileUp, FolderOpen, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
  folderId?: number;
}

interface DuplicateEntry {
  file: File;
  existingName: string;
  existingDate: string;
}

interface FolderFileEntry {
  file: File;
  relativePath: string;
}

const HASH_SIZE_LIMIT = 200 * 1024 * 1024; // 200 MB — files larger than this skip duplicate check

async function computeHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        resolve(hashHex);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export default function UploadModal({ open, onClose, onUploaded, folderId }: Props) {
  const { user, refreshUser } = useAuth();

  // Refresh user data each time the modal opens to pick up admin-changed limits
  useEffect(() => {
    if (open) {
      refreshUser();
    }
  }, [open]);

  // Derive limits from user settings; fall back to 100 MB / 10 files when not set
  const MAX_FILE_BYTES = user?.maxUploadSize ? parseInt(user.maxUploadSize) : 100 * 1024 * 1024;
  const MAX_FILE_MB = Math.round(MAX_FILE_BYTES / (1024 * 1024));
  const MAX_FILES = user?.maxFilesPerUpload ?? 10;

  const [mode, setMode] = useState<'files' | 'folder'>('files');

  // File mode state
  const [files, setFiles] = useState<File[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateEntry[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Folder mode state
  const [folderFiles, setFolderFiles] = useState<FolderFileEntry[]>([]);

  // Shared state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Callback ref: sets webkitdirectory when the input mounts (the normal useRef+useEffect
  // approach fails because the input lives inside {mode==='folder'&&…} and is only mounted
  // after the user switches tabs — by then the one-time [] useEffect has already run).
  const folderInputNodeRef = useRef<HTMLInputElement | null>(null);
  const setFolderInputRef = useCallback((node: HTMLInputElement | null) => {
    folderInputNodeRef.current = node;
    if (node) {
      node.setAttribute('webkitdirectory', '');
      node.setAttribute('mozdirectory', '');
    }
  }, []);

  if (!open) return null;

  const resetState = () => {
    setFiles([]);
    setFolderFiles([]);
    setDuplicates([]);
    setError('');
    setInfo('');
    setProgress(0);
    setUploading(false);
    setCheckingDuplicates(false);
  };

  const handleModeSwitch = (newMode: 'files' | 'folder') => {
    setMode(newMode);
    resetState();
  };

  // ─── File mode handlers ───────────────────────────────────────────────────
  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const all = Array.from(selected);
    const oversized = all.filter(f => f.size > MAX_FILE_BYTES);
    const valid = all.filter(f => f.size <= MAX_FILE_BYTES);

    setError('');
    setInfo('');
    setDuplicates([]);

    if (oversized.length > 0) {
      setError(
        `${oversized.map(f => f.name).join(', ')} ${oversized.length === 1 ? 'exceeds' : 'exceed'} the ${MAX_FILE_MB}MB limit and ${oversized.length === 1 ? 'was' : 'were'} removed.`
      );
    }
    setFiles(valid);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const proceedUpload = async () => {
    setUploading(true);
    setProgress(0);
    setError('');
    setDuplicates([]);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (folderId) {
      formData.append('folderId', String(folderId));
    }

    try {
      await fileApi.upload(formData, setProgress);
      resetState();
      onUploaded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setCheckingDuplicates(true);
    setError('');
    setInfo('');
    setDuplicates([]);

    const filesToHash = files.filter(f => f.size <= HASH_SIZE_LIMIT);
    const largeFilesCount = files.length - filesToHash.length;

    try {
      const found: DuplicateEntry[] = [];

      for (const file of filesToHash) {
        const hash = await computeHash(file);
        const { data } = await fileApi.checkDuplicate(hash);
        if (data.isDuplicate) {
          found.push({
            file,
            existingName: data.existingFile?.originalName || data.existingFile?.name || 'Unknown',
            existingDate: data.existingFile?.uploadDate || data.existingFile?.uploadedAt
              ? new Date(data.existingFile.uploadDate || data.existingFile.uploadedAt).toLocaleDateString()
              : 'Unknown',
          });
        }
      }

      if (largeFilesCount > 0) {
        setInfo(`Duplicate check skipped for ${largeFilesCount} large file${largeFilesCount > 1 ? 's' : ''} (over 200MB).`);
      }

      if (found.length > 0) {
        setDuplicates(found);
      } else {
        await proceedUpload();
      }
    } catch {
      console.warn('Duplicate check failed, proceeding with upload');
      await proceedUpload();
    } finally {
      setCheckingDuplicates(false);
    }
  };

  // ─── Folder mode handlers ─────────────────────────────────────────────────
  const handleFolderSelect = (selected: FileList | null) => {
    if (!selected) return;
    setError('');
    setInfo('');

    const entries: FolderFileEntry[] = Array.from(selected).map(file => ({
      file,
      relativePath: (file as any).webkitRelativePath || file.name,
    }));

    setFolderFiles(entries);
  };

  const proceedFolderUpload = async () => {
    if (folderFiles.length === 0) return;

    setUploading(true);
    setProgress(0);
    setError('');

    const formData = new FormData();
    folderFiles.forEach(({ file }) => formData.append('files', file));
    formData.append('relativePaths', JSON.stringify(folderFiles.map(e => e.relativePath)));
    if (folderId) {
      formData.append('folderId', String(folderId));
    }

    try {
      await fileApi.uploadFolder(formData, setProgress);
      resetState();
      onUploaded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Folder upload failed');
      setUploading(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const totalFolderSize = folderFiles.reduce((sum, e) => sum + e.file.size, 0);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 modal-enter" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              {mode === 'folder'
                ? <FolderOpen size={20} className="text-blue-600 dark:text-blue-400" />
                : <FileUp size={20} className="text-blue-600 dark:text-blue-400" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {mode === 'folder' ? 'Upload Folder' : 'Upload Files'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {mode === 'folder'
                  ? 'Upload an entire folder with its structure'
                  : `Max ${MAX_FILE_MB}MB per file · Up to ${MAX_FILES} files`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-gray-700 rounded-xl mb-5">
            <button
              onClick={() => handleModeSwitch('files')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'files'
                  ? 'bg-white dark:bg-gray-800 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
              }`}
            >
              <FileUp size={14} /> Files
            </button>
            <button
              onClick={() => handleModeSwitch('folder')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${
                mode === 'folder'
                  ? 'bg-white dark:bg-gray-800 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
              }`}
            >
              <FolderOpen size={14} /> Folder
            </button>
          </div>

          {/* ── Files Mode ── */}
          {mode === 'files' && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${dragOver
                    ? 'border-blue-400 bg-blue-50/70 dark:bg-blue-900/20 scale-[1.01]'
                    : 'border-slate-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-gray-700/50'
                  }`}
              >
                <div className={`mx-auto mb-3 w-12 h-12 rounded-full flex items-center justify-center transition
                  ${dragOver ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-slate-100 dark:bg-gray-700'}`}>
                  <Upload size={22} className={dragOver ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-gray-400'} />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-gray-200">
                  {dragOver ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2 max-h-44 overflow-y-auto">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-gray-700/50 rounded-lg px-3 py-2.5 group">
                      <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <FileUp size={14} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-gray-200 truncate">{file.name}</p>
                        <p className="text-xs text-slate-400 dark:text-gray-500">{formatSize(file.size)}</p>
                      </div>
                      {!uploading && (
                        <button onClick={() => removeFile(i)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-gray-600 rounded transition">
                          <X size={14} className="text-slate-500 dark:text-gray-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {info && (
                <div className="mt-4 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-3 py-2 rounded-lg text-sm">
                  <Info size={14} className="shrink-0" />
                  {info}
                </div>
              )}

              {duplicates.length > 0 && (
                <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Duplicate files detected</span>
                  </div>
                  <ul className="space-y-1 mb-3">
                    {duplicates.map((dup, i) => (
                      <li key={i} className="text-xs text-yellow-700 dark:text-yellow-400">
                        <span className="font-medium">{dup.file.name}</span> matches existing file{' '}
                        <span className="font-medium">{dup.existingName}</span> (uploaded {dup.existingDate})
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <button onClick={proceedUpload} className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded-lg transition">
                      Upload Anyway
                    </button>
                    <button onClick={() => setDuplicates([])} className="px-3 py-1.5 border border-yellow-300 dark:border-yellow-600 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {checkingDuplicates && (
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
                  <svg className="animate-spin h-4 w-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Checking for duplicates...
                </div>
              )}
            </>
          )}

          {/* ── Folder Mode ── */}
          {mode === 'folder' && (
            <>
              <div
                onClick={() => folderInputNodeRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  border-slate-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-gray-700/50`}
              >
                <div className="mx-auto mb-3 w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-gray-700">
                  <FolderOpen size={22} className="text-slate-400 dark:text-gray-400" />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-gray-200">Click to select a folder</p>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">The entire folder structure will be preserved</p>
                <input
                  ref={setFolderInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFolderSelect(e.target.files)}
                />
              </div>

              {folderFiles.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">
                      {folderFiles.length} file{folderFiles.length !== 1 ? 's' : ''} · {formatSize(totalFolderSize)}
                    </p>
                    <button onClick={() => setFolderFiles([])} className="text-xs text-red-500 hover:text-red-700 transition">
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {folderFiles.slice(0, 50).map((entry, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                        <FileUp size={12} className="text-blue-500 shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-gray-300 truncate flex-1" title={entry.relativePath}>
                          {entry.relativePath}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">{formatSize(entry.file.size)}</span>
                      </div>
                    ))}
                    {folderFiles.length > 50 && (
                      <p className="text-xs text-slate-400 text-center py-1">…and {folderFiles.length - 50} more files</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Progress (shared) */}
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-gray-300">Uploading...</span>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              {progress === 100 && (
                <div className="flex items-center gap-1.5 mt-2 text-green-600 dark:text-green-400 text-xs font-medium">
                  <CheckCircle size={14} />
                  Upload complete!
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 dark:border-gray-600 rounded-xl text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition">
            Cancel
          </button>
          {mode === 'files' ? (
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading || checkingDuplicates}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {uploading ? 'Uploading...' : checkingDuplicates ? 'Checking...' : `Upload ${files.length || ''} file${files.length !== 1 ? 's' : ''}`}
            </button>
          ) : (
            <button
              onClick={proceedFolderUpload}
              disabled={folderFiles.length === 0 || uploading}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {uploading ? 'Uploading...' : folderFiles.length === 0 ? 'Select Folder' : `Upload ${folderFiles.length} file${folderFiles.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
