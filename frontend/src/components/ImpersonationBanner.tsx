import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftCircle, Eye } from 'lucide-react';

export default function ImpersonationBanner() {
  const { user, impersonatedBy, stopImpersonation } = useAuth();

  if (!impersonatedBy) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 flex items-center justify-center gap-3 shadow-md relative z-50">
      <Eye size={16} className="shrink-0" />
      <span className="text-sm font-medium">
        Viewing as <strong className="font-bold">{user?.name}</strong> ({user?.username})
      </span>
      <button
        onClick={stopImpersonation}
        className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-all"
      >
        <ArrowLeftCircle size={14} />
        Return to Admin
      </button>
    </div>
  );
}
