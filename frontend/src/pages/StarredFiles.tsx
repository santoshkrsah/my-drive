import { useState, useEffect, useCallback } from 'react';
import { fileApi } from '../services/api';
import type { FileItem } from '../types';
import { formatBytes } from '../components/StorageBar';
import FileThumbnail from '../components/FileThumbnail';
import FilePreviewModal from '../components/FilePreviewModal';
import { Star, Download, Eye, FileIcon, Image, Film, Music, FileText, Archive, FileSpreadsheet, LayoutGrid, List } from 'lucide-react';

export default function StarredFiles() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = localStorage.getItem('pageSize');
    return saved ? parseInt(saved) : 20;
  });
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [view, setView] = useState<'list' | 'grid'>('list');

  const loadStarred = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fileApi.starred(page, pageSize);
      setFiles(data.files);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load starred files:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadStarred();
  }, [loadStarred]);

  const handleDownload = async (file: FileItem) => {
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

  const handleUnstar = async (file: FileItem) => {
    try {
      await fileApi.toggleStar(file.id);
      loadStarred();
    } catch (err) {
      console.error('Unstar failed:', err);
    }
  };

  const canPreview = (mimeType: string) => mimeType.startsWith('image/') || mimeType === 'application/pdf' || mimeType.startsWith('video/');

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image size={18} className="text-pink-500" />;
    if (mimeType.startsWith('video/')) return <Film size={18} className="text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music size={18} className="text-green-500" />;
    if (mimeType.includes('pdf')) return <FileText size={18} className="text-red-500" />;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <Archive size={18} className="text-amber-500" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) return <FileSpreadsheet size={18} className="text-emerald-600" />;
    if (mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('text')) return <FileText size={18} className="text-blue-500" />;
    return <FileIcon size={18} className="text-slate-400" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Starred Files</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your favorite files for quick access</p>
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-lg transition ${view === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            title="List view"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg transition ${view === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="spinner mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading starred files...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
            <Star size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">No starred files</p>
          <p className="text-sm text-slate-400">Star files from My Files to add them here</p>
        </div>
      ) : view === 'grid' ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-3 hover:shadow-md transition-all group cursor-pointer"
                onDoubleClick={() => canPreview(file.mimeType) ? setPreviewFile(file) : handleDownload(file)}
              >
                <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                  <FileThumbnail
                    fileId={file.id}
                    mimeType={file.mimeType}
                    className="w-full h-full object-cover"
                    fallback={
                      <div className="w-full h-full flex items-center justify-center">
                        {getFileIcon(file.mimeType)}
                      </div>
                    }
                  />
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate mb-1">{file.originalName}</p>
                <p className="text-[11px] text-slate-400">{formatBytes(file.fileSize)}</p>
                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUnstar(file); }}
                    className="flex-1 flex items-center justify-center py-1 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition"
                    title="Unstar"
                  >
                    <Star size={13} fill="currentColor" />
                  </button>
                  {canPreview(file.mimeType) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                      className="flex-1 flex items-center justify-center py-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition"
                      title="Preview"
                    >
                      <Eye size={13} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                    className="flex-1 flex items-center justify-center py-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                    title="Download"
                  >
                    <Download size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

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
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="hidden sm:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Size</th>
                    <th className="hidden sm:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Uploaded</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr
                      key={file.id}
                      className="border-b border-slate-50 dark:border-slate-700 last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-700/50 transition-colors group"
                      onDoubleClick={() => canPreview(file.mimeType) ? setPreviewFile(file) : handleDownload(file)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
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
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px] sm:max-w-xs">{file.originalName}</span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{formatBytes(file.fileSize)}</td>
                      <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{new Date(file.uploadDate).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleUnstar(file)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition"
                            title="Unstar"
                          >
                            <Star size={15} fill="currentColor" />
                          </button>
                          {canPreview(file.mimeType) && (
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition"
                              title="Preview"
                            >
                              <Eye size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(file)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                            title="Download"
                          >
                            <Download size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
            </div>
          )}
        </>
      )}

      <FilePreviewModal open={!!previewFile} onClose={() => setPreviewFile(null)} file={previewFile} files={files} onNavigate={setPreviewFile} />
    </div>
  );
}
