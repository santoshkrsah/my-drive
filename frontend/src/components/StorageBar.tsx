import type { StorageUsage } from '../types';

export function formatBytes(bytes: string | number | null | undefined): string {
  let b: number;
  if (typeof bytes === 'string') {
    // Handle BigInt strings properly using Number() instead of parseInt()
    b = Number(bytes);
  } else {
    b = bytes ?? 0;
  }

  if (!b || isNaN(b) || b <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface Props {
  storage: StorageUsage;
}

export default function StorageBar({ storage }: Props) {
  const percent = Math.max(0, Math.min(Math.round(storage.percentUsed || 0), 100));
  const barColor = percent > 90
    ? 'from-red-500 to-red-400'
    : percent > 70
    ? 'from-amber-500 to-yellow-400'
    : 'from-blue-500 to-blue-400';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Storage</h3>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{percent}% used</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span><span className="font-medium text-slate-700 dark:text-slate-200">{formatBytes(storage.storageUsed)}</span> used</span>
        <span><span className="font-medium text-slate-700 dark:text-slate-200">{formatBytes(storage.storageRemaining)}</span> free of {formatBytes(storage.storageQuota)}</span>
      </div>
    </div>
  );
}
