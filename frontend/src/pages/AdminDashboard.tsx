import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import type { DashboardStats } from '../types';
import { formatBytes } from '../components/StorageBar';
import { Users, FileIcon, HardDrive, ShieldAlert, TrendingUp, Database, Copy } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await adminApi.dashboard();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="spinner mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
        <p className="text-red-500 font-medium">Failed to load dashboard data</p>
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
    { label: 'Active Users', value: stats.activeUsers, icon: TrendingUp, bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
    { label: 'Banned Users', value: stats.bannedUsers, icon: ShieldAlert, bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
    { label: 'Total Files', value: stats.totalFiles, icon: FileIcon, bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
    { label: 'Duplicate Files', value: stats.duplicateCount ?? 0, icon: Copy, bg: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400' },
  ];

  const usedBytes = parseInt(stats.totalStorageUsed || '0');
  const allocatedBytes = parseInt(stats.totalStorageAllocated || '0');
  const storagePercent = allocatedBytes > 0 ? Math.max(0, Math.min(Math.round((usedBytes / allocatedBytes) * 100), 100)) : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">System overview and statistics</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${card.bg}`}>
                <card.icon size={20} className={card.text} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value.toLocaleString()}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Storage overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <HardDrive size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Storage Usage</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500 dark:text-slate-400">Used</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{formatBytes(stats.totalStorageUsed)}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700"
                  style={{ width: `${Math.min(storagePercent, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Allocated</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatBytes(stats.totalStorageAllocated)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">Utilization</p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{storagePercent}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
              <Database size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Quick Summary</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm text-slate-500 dark:text-slate-400">File-to-User Ratio</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {stats.totalUsers > 0 ? (stats.totalFiles / stats.totalUsers).toFixed(1) : '0'} files/user
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm text-slate-500 dark:text-slate-400">Avg Storage/User</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {stats.totalUsers > 0 ? formatBytes(String(Math.round(usedBytes / stats.totalUsers))) : '0 B'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">User Health</span>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
