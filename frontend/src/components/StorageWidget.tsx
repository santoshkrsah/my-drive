import { useState, useEffect } from 'react';
import { fileApi } from '../services/api';
import { HardDrive } from 'lucide-react';
import { formatBytes } from './StorageBar';

export default function StorageWidget() {
  const [usage, setUsage] = useState<{ storageQuota: string; storageUsed: string; percentUsed: number } | null>(null);

  useEffect(() => {
    const fetchUsage = () => fileApi.storage().then(res => setUsage(res.data)).catch(() => {});
    fetchUsage();
    const interval = setInterval(fetchUsage, 30_000);
    window.addEventListener('focus', fetchUsage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchUsage);
    };
  }, []);

  if (!usage) return null;

  const percent = Math.max(0, Math.min(usage.percentUsed || 0, 100));
  const color = percent < 50
    ? 'bg-emerald-500'
    : percent < 80
    ? 'bg-amber-500'
    : 'bg-red-500';

  return (
    <div className="px-5 py-3">
      <div className="flex items-center gap-2 mb-2">
        <HardDrive size={14} className="text-slate-400" />
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Storage</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-[11px] text-slate-400">
        {formatBytes(usage.storageUsed)} / {formatBytes(usage.storageQuota)}
      </p>
    </div>
  );
}
