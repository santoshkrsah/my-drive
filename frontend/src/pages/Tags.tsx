import { useEffect, useState } from 'react';
import { Tag as TagIcon, Plus, Pencil, Trash2, Check, X, Globe, User } from 'lucide-react';
import { tagApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Tag } from '../types';

export default function Tags() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SYSADMIN';

  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createColor, setCreateColor] = useState('#3b82f6');
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState('');

  async function loadTags() {
    try {
      const res = await tagApi.list();
      setTags(res.data.tags || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTags(); }, []);

  const systemTags = tags.filter(t => t.userId == null);
  const myTags = tags.filter(t => t.userId != null && t.userId === user?.id);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    setError('');
    try {
      await tagApi.create(createName.trim(), createColor);
      setCreateName('');
      setCreateColor('#3b82f6');
      await loadTags();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create tag');
    } finally {
      setCreating(false);
    }
  }

  function startEdit(tag: Tag) {
    setEditId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
    setError('');
  }

  function cancelEdit() {
    setEditId(null);
    setEditName('');
    setEditColor('');
    setError('');
  }

  async function handleSave(id: number) {
    if (!editName.trim()) return;
    setSaving(true);
    setError('');
    try {
      await tagApi.update(id, editName.trim(), editColor);
      cancelEdit();
      await loadTags();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update tag');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    try {
      await tagApi.delete(id);
      setDeleteConfirm(null);
      await loadTags();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete tag');
    } finally {
      setDeleting(false);
    }
  }

  function renderTagRow(tag: Tag, canEdit: boolean) {
    return (
      <div key={tag.id} className="px-5 py-3.5 flex items-center gap-4">
        {editId === tag.id ? (
          <>
            <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700">
              <span
                className="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-500"
                style={{ backgroundColor: editColor }}
              />
              <input
                type="color"
                value={editColor}
                onChange={e => setEditColor(e.target.value)}
                className="w-8 h-6 cursor-pointer border-0 bg-transparent p-0"
              />
            </div>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              maxLength={32}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSave(tag.id); if (e.key === 'Escape') cancelEdit(); }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleSave(tag.id)}
                disabled={saving || !editName.trim()}
                className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 disabled:opacity-50 transition"
                title="Save"
              >
                <Check size={14} />
              </button>
              <button
                onClick={cancelEdit}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </div>
          </>
        ) : deleteConfirm === tag.id ? (
          <>
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{tag.name}</span>
            <span className="text-xs text-red-500 dark:text-red-400">Delete this tag?</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(tag.id)}
                disabled={deleting}
                className="px-3 py-1 text-xs font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition"
              >
                {deleting ? '…' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1 text-xs font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
            <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{tag.name}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {new Date(tag.createdAt).toLocaleDateString()}
            </span>
            {canEdit && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => startEdit(tag)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(tag.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tags</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isAdmin
            ? 'Manage system-wide tags and your personal tags.'
            : 'Create and manage your personal tags to organize files.'}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          <X size={14} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Create tag form */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          {isAdmin ? 'Create System Tag' : 'Create Personal Tag'}
        </h2>
        <form onSubmit={handleCreate} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tag Name</label>
            <input
              type="text"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              placeholder="e.g. Important, Work, Personal…"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              maxLength={32}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Color</label>
            <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700">
              <span
                className="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-500"
                style={{ backgroundColor: createColor }}
              />
              <input
                type="color"
                value={createColor}
                onChange={e => setCreateColor(e.target.value)}
                className="w-8 h-6 cursor-pointer border-0 bg-transparent p-0"
                title="Pick a color"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating || !createName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition"
          >
            <Plus size={14} />
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
      </div>

      {/* System Tags section */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
          <Globe size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            System Tags <span className="text-slate-400 dark:text-slate-500 font-normal">({systemTags.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : systemTags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500">No system tags yet.</p>
            {!isAdmin && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">An admin can create system-wide tags.</p>}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {systemTags.map(tag => renderTagRow(tag, isAdmin))}
          </div>
        )}
      </div>

      {/* My Tags section */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
          <User size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            My Tags <span className="text-slate-400 dark:text-slate-500 font-normal">({myTags.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : myTags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
              <TagIcon size={20} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No personal tags yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Create your first personal tag above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {myTags.map(tag => renderTagRow(tag, true))}
          </div>
        )}
      </div>
    </div>
  );
}
