import { useEffect, useState } from 'react';
import { X, Tag as TagIcon, Check, User } from 'lucide-react';
import { tagApi } from '../services/api';
import type { Tag, FileItem } from '../types';

interface TagPickerModalProps {
  open: boolean;
  onClose: () => void;
  file: FileItem | null;
  onTagsChanged?: () => void;
}

export default function TagPickerModal({ open, onClose, file, onTagsChanged }: TagPickerModalProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [appliedTagIds, setAppliedTagIds] = useState<Set<number>>(new Set());
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    tagApi.list().then(res => setAllTags(res.data.tags || []));
  }, [open]);

  useEffect(() => {
    if (!file) return;
    const ids = new Set((file.fileTags ?? []).map(ft => ft.tagId));
    setAppliedTagIds(ids);
  }, [file]);

  async function toggleTag(tagId: number) {
    if (!file || toggling !== null) return;
    setToggling(tagId);
    try {
      if (appliedTagIds.has(tagId)) {
        await tagApi.removeFromFile(file.id, tagId);
        setAppliedTagIds(prev => { const next = new Set(prev); next.delete(tagId); return next; });
      } else {
        await tagApi.addToFile(file.id, tagId);
        setAppliedTagIds(prev => new Set([...prev, tagId]));
      }
      onTagsChanged?.();
    } catch (err: any) {
      console.error('Tag toggle failed', err);
    } finally {
      setToggling(null);
    }
  }

  if (!open || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TagIcon size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Manage Tags</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{file.originalName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tag list */}
        <div className="p-3 max-h-72 overflow-y-auto">
          {allTags.length === 0 ? (
            <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-6">No tags available. Create tags from the Tags page.</p>
          ) : (
            <div className="space-y-1">
              {allTags.map(tag => {
                const applied = appliedTagIds.has(tag.id);
                const busy = toggling === tag.id;
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    disabled={busy}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                      ${applied
                        ? 'bg-slate-50 dark:bg-slate-700/50'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                      }
                      ${busy ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                    `}
                  >
                    {/* Color swatch */}
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1 text-left text-slate-700 dark:text-slate-200">{tag.name}</span>
                    {tag.userId != null && (
                      <User size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    )}
                    {applied && (
                      <Check size={14} className="text-blue-500 dark:text-blue-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
