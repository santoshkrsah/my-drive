import { useState, useEffect } from 'react';
import { fileApi } from '../services/api';
import type { FileItem } from '../types';
import { formatBytes } from '../components/StorageBar';
import FileThumbnail from '../components/FileThumbnail';
import FilePreviewModal from '../components/FilePreviewModal';
import { Clock, Download, Eye, FileIcon, Image, Film, Music, FileText, Archive, FileSpreadsheet } from 'lucide-react';

export default function RecentFiles() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = localStorage.getItem('pageSize');
    return saved ? parseInt(saved) : 20;
  });
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  useEffect(() => {
    loadRecent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  const loadRecent = async () => {
    setLoading(true);
    try {
      const { data } = await fileApi.recent(pageSize);
      setFiles(data.files);
    } catch (err) {
      console.error('Failed to load recent files:', err);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Files</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your most recently uploaded files</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">Show:</label>
          <select
            value={pageSize}
            onChange={e => {
              const size = parseInt(e.target.value);
              setPageSize(size);
              localStorage.setItem('pageSize', String(size));
            }}
            className="text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[10, 25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="spinner mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading recent files...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
            <Clock size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">No recent files</p>
          <p className="text-sm text-slate-400">Upload files to see them here</p>
        </div>
      ) : (
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
      )}

      <FilePreviewModal open={!!previewFile} onClose={() => setPreviewFile(null)} file={previewFile} files={files} onNavigate={setPreviewFile} />
    </div>
  );
}
