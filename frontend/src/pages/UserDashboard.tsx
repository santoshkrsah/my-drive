import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fileApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatBytes } from '../components/StorageBar';
import {
  HardDrive, FileText, Share2, Star, Clock, FolderOpen,
  Image, Film, Music, Archive, FileSpreadsheet, Copy,
} from 'lucide-react';

interface DashboardData {
  storageQuota: string;
  storageUsed: string;
  totalFiles: number;
  recentFiles: { id: number; originalName: string; fileSize: string; mimeType: string; uploadDate: string }[];
  fileTypes: { mimeType: string; count: number; totalSize: string }[];
  sharedCount: number;
  starredCount: number;
  duplicateCount: number;
}

function getFileTypeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Images';
  if (mimeType.startsWith('video/')) return 'Videos';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'Documents';
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv') || mimeType.includes('excel')) return 'Spreadsheets';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('compress')) return 'Archives';
  return 'Other';
}

function getCategoryFileTypeFilter(category: string): string {
  switch (category) {
    case 'Images': return 'image';
    case 'Videos': return 'video';
    case 'Audio': return 'audio';
    case 'Documents': return 'application/pdf';
    case 'Spreadsheets': return 'application/vnd';
    case 'Archives': return 'application/zip';
    default: return '__other__';
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'Images': return <Image size={16} />;
    case 'Videos': return <Film size={16} />;
    case 'Audio': return <Music size={16} />;
    case 'Documents': return <FileText size={16} />;
    case 'Spreadsheets': return <FileSpreadsheet size={16} />;
    case 'Archives': return <Archive size={16} />;
    default: return <FileText size={16} />;
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'Images': return 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
    case 'Videos': return 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
    case 'Audio': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
    case 'Documents': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    case 'Spreadsheets': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'Archives': return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    default: return 'bg-slate-50 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
  }
}

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data: d } = await fileApi.dashboard();
        if (!cancelled) { setData(d); setError(false); }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="spinner mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 dark:text-slate-400 mb-3">Failed to load dashboard</p>
        <button
          onClick={() => { setLoading(true); setError(false); fileApi.dashboard().then(({ data: d }) => setData(d)).catch(() => setError(true)).finally(() => setLoading(false)); }}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  const usedNum = parseInt(data.storageUsed || '0');
  const quotaNum = parseInt(data.storageQuota || '0');
  const storagePercent = quotaNum > 0 ? Math.max(0, Math.min(Math.round((usedNum / quotaNum) * 100), 100)) : 0;

  // Aggregate file types into categories
  const categoryMap = new Map<string, { count: number; totalSize: number }>();
  for (const ft of data.fileTypes) {
    const cat = getFileTypeCategory(ft.mimeType);
    const existing = categoryMap.get(cat) || { count: 0, totalSize: 0 };
    existing.count += ft.count;
    existing.totalSize += parseInt(ft.totalSize);
    categoryMap.set(cat, existing);
  }
  const categories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1].count - a[1].count);

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Here's an overview of your drive
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <button
          onClick={() => navigate('/files')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <HardDrive size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatBytes(data.storageUsed)}</p>
          <p className="text-xs text-slate-400 mt-0.5">of {formatBytes(data.storageQuota)} used</p>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, storagePercent)}%` }}
            />
          </div>
        </button>

        <button
          onClick={() => navigate('/files')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
              <FolderOpen size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.totalFiles}</p>
          <p className="text-xs text-slate-400 mt-0.5">Total files</p>
        </button>

        <button
          onClick={() => navigate('/shared')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
              <Share2 size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.sharedCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Shared files</p>
        </button>

        <button
          onClick={() => navigate('/starred')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
              <Star size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.starredCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Starred files</p>
        </button>

        <button
          onClick={() => navigate('/duplicates')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
              <Copy size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.duplicateCount ?? 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">Duplicate files</p>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Uploads */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              Recent Uploads
            </h2>
            <button
              onClick={() => navigate('/recent')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium"
            >
              View all
            </button>
          </div>
          {data.recentFiles.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No files uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {data.recentFiles.map(file => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer"
                  onClick={() => navigate('/files')}
                >
                  <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                    <FileText size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{file.originalName}</p>
                    <p className="text-[11px] text-slate-400">{formatBytes(file.fileSize)}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(file.uploadDate)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File Types */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FolderOpen size={16} className="text-slate-400" />
              File Types
            </h2>
          </div>
          {categories.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No files yet</p>
          ) : (
            <div className="space-y-2">
              {categories.map(([category, info]) => (
                <button
                  key={category}
                  onClick={() => navigate('/files?fileType=' + getCategoryFileTypeFilter(category))}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer text-left"
                >
                  <div className={`p-1.5 rounded-lg ${getCategoryColor(category)}`}>
                    {getCategoryIcon(category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300">{category}</p>
                    <p className="text-[11px] text-slate-400">{info.count} file{info.count !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{formatBytes(String(info.totalSize))}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
