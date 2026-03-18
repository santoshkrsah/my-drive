import { X, Keyboard } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ['Delete'], action: 'Move selected files to trash' },
  { keys: ['Ctrl', 'A'], action: 'Select all files' },
  { keys: ['Escape'], action: 'Clear selection / Close modal' },
  { keys: ['Enter'], action: 'Open selected folder' },
  { keys: ['Ctrl', 'Shift', 'N'], action: 'Create new folder' },
  { keys: ['?'], action: 'Show keyboard shortcuts' },
];

export default function KeyboardShortcutsModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <Keyboard size={18} className="text-slate-600 dark:text-slate-300" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="ml-auto p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="space-y-3">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">{s.action}</span>
                <div className="flex gap-1">
                  {s.keys.map((key, j) => (
                    <kbd key={j} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-mono text-slate-600 dark:text-slate-300 shadow-sm">
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 rounded-b-2xl">
          <button onClick={onClose} className="w-full py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
