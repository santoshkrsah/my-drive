import { useState, useEffect, useCallback } from 'react';
import { fileApi } from '../services/api';
import { formatBytes } from '../components/StorageBar';
import FileThumbnail from '../components/FileThumbnail';
import FilePreviewModal from '../components/FilePreviewModal';
import { Copy, Download, Eye, Trash2, FileIcon, Image, Film, Music, FileText, Archive, FileSpreadsheet } from 'lucide-react';
import type { FileItem } from '../types';

interface DuplicateFile {
  id: number;
  originalName: string;
  fileSize: string;
  mimeType: string;
  uploadDate: string;
  fileHash?: string | null;
  folder?: { id: number; name: string } | null;
}

interface DuplicateGroup {
  hash: string;
  files: DuplicateFile[];
}

export default function DuplicateFiles() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [previewList, setPreviewList] = useState<FileItem[]>([]);

  const loadDuplicates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fileApi.getDuplicates(page, 200);
      const files: DuplicateFile[] = data.files;
      setTotalFiles(data.total);
      setTotalPages(data.totalPages);

      // Group by fileHash (backend returns them sorted by hash then date)
      const groupMap = new Map<string, DuplicateFile[]>();
      for (const f of files) {
        const key = f.fileHash ?? '__no_hash__';
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(f);
      }
      setGroups(Array.from(groupMap.entries()).map(([hash, groupFiles]) => ({ hash, files: groupFiles })));
    } catch (err) {
      console.error('Failed to load duplicates:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadDuplicates();
  }, [loadDuplicates]);

  const handleDownload = async (file: DuplicateFile) => {
    try {
      const response = await fileApi.download(file.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleDelete = async (file: DuplicateFile) => {
    try {
      await fileApi.softDelete(file.id);
      loadDuplicates();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const canPreview = (mimeType: string) =>
    mimeType.startsWith('image/') || mimeType === 'application/pdf' || mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/') || mimeType.startsWith('text/') ||
    mimeType.includes('wordprocessingml') || mimeType === 'application/msword' ||
    mimeType.includes('spreadsheetml') || mimeType === 'application/vnd.ms-excel';

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image size={16} className="text-pink-500" />;
    if (mimeType.startsWith('video/')) return <Film size={16} className="text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music size={16} className="text-green-500" />;
    if (mimeType.includes('pdf')) return <FileText size={16} className="text-red-500" />;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <Archive size={16} className="text-amber-500" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) return <FileSpreadsheet size={16} className="text-emerald-600" />;
    if (mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('text')) return <FileText size={16} className="text-blue-500" />;
    return <FileIcon size={16} className="text-slate-400" />;
  };

  const openPreview = (file: DuplicateFile, groupFiles: DuplicateFile[]) => {
    setPreviewFile(file as unknown as FileItem);
    setPreviewList(groupFiles as unknown as FileItem[]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Duplicate Files</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {totalFiles > 0
              ? `${totalFiles} file${totalFiles !== 1 ? 's' : ''} with identical content — grouped by matching hash`
              : 'Files with identical content appear here'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="spinner mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Scanning for duplicates...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
            <Copy size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">No duplicates found</p>
          <p className="text-sm text-slate-400">All your files have unique content</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, gi) => (
            <div key={group.hash} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* Group header */}
              <div className="flex items-center gap-3 px-5 py-3 bg-rose-50 dark:bg-rose-900/20 border-b border-rose-100 dark:border-rose-800/30">
                <div className="p-1.5 bg-rose-100 dark:bg-rose-900/40 rounded-lg">
                  <Copy size={14} className="text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                    Group {gi + 1} — {group.files.length} identical files
                  </span>
                  <span className="ml-2 text-xs text-slate-400 font-mono truncate hidden sm:inline">
                    hash: {group.hash.slice(0, 12)}…
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                  {formatBytes(group.files[0]?.fileSize ?? '0')} each
                </span>
              </div>

              {/* Files in group */}
              <div className="divide-y divide-slate-50 dark:divide-slate-700">
                {group.files.map((file, fi) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                    onDoubleClick={() => canPreview(file.mimeType) ? openPreview(file, group.files) : handleDownload(file)}
                  >
                    {/* Index badge */}
                    <span className="text-xs font-medium text-slate-400 w-4 shrink-0">#{fi + 1}</span>

                    {/* Thumbnail */}
                    <FileThumbnail
                      fileId={file.id}
                      mimeType={file.mimeType}
                      className="w-9 h-9 rounded-lg object-cover shrink-0"
                      fallback={
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                          {getFileIcon(file.mimeType)}
                        </div>
                      }
                    />

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{file.originalName}</p>
                      <p className="text-xs text-slate-400">
                        {file.folder ? `📁 ${file.folder.name}` : 'Root'}
                        <span className="mx-1.5">·</span>
                        {new Date(file.uploadDate).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {canPreview(file.mimeType) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openPreview(file, group.files); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition"
                          title="Preview"
                        >
                          <Eye size={15} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                        title="Download"
                      >
                        <Download size={15} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                        title="Move to trash"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

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
        </div>
      )}

      <FilePreviewModal
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        files={previewList}
        onNavigate={setPreviewFile}
      />
    </div>
  );
}
