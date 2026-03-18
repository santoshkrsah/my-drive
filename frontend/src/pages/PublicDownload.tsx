import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicLinkApi } from '../services/api';
import { Download, Lock, FileIcon, HardDrive } from 'lucide-react';

function formatBytes(bytes: string | number | null | undefined) {
  const b = typeof bytes === 'string' ? parseInt(bytes, 10) : (bytes ?? 0);
  if (!b || isNaN(b as number) || (b as number) <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b as number) / Math.log(k));
  return parseFloat(((b as number) / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function PublicDownload() {
  const { token } = useParams<{ token: string }>();
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!token) return;
    publicLinkApi.getPublicFile(token)
      .then(res => { setFileInfo(res.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.error || 'Link not found or expired'); setLoading(false); });
  }, [token]);

  const handleDownload = async () => {
    if (!token) return;
    setDownloading(true);
    setError('');
    try {
      const res = await publicLinkApi.downloadPublicFile(token, password || undefined);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileInfo?.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-600 rounded-xl shadow-lg mb-4">
            <HardDrive size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">My Drive</h1>
          <p className="text-slate-400 text-sm mt-1">Shared file download</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {loading ? (
            <div className="flex justify-center py-8"><div className="spinner" /></div>
          ) : error && !fileInfo ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          ) : fileInfo ? (
            <>
              <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FileIcon size={24} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{fileInfo.fileName}</p>
                  <p className="text-sm text-slate-500">{formatBytes(fileInfo.fileSize)} &middot; {fileInfo.mimeType}</p>
                </div>
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}

              {fileInfo.hasPassword && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock size={14} className="text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Password required</span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={e => e.key === 'Enter' && handleDownload()}
                  />
                </div>
              )}

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-sm"
              >
                <Download size={18} />
                {downloading ? 'Downloading...' : 'Download File'}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
