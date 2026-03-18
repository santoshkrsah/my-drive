import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';
import { formatBytes } from '../components/StorageBar';
import { ArchiveRestore, Trash2, RefreshCw, FileSearch, Folder as FolderIcon, FileText } from 'lucide-react';

interface RecoverableFile {
  id: number;
  originalName: string;
  fileSize: string;
  mimeType: string;
  deletedAt: string | null;
  purgeAfter: string | null;
  user: { id: number; name: string; username: string; email: string };
}

interface RecoverableFolder {
  id: number;
  name: string;
  deletedAt: string | null;
  purgeAfter: string | null;
  user: { id: number; name: string; username: string; email: string };
}

export default function RecoverableFiles() {
  const [files, setFiles] = useState<RecoverableFile[]>([]);
  const [folders, setFolders] = useState<RecoverableFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [selectedFileIds, setSelectedFileIds] = useState<Set<number>>(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<number>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setSelectedFileIds(new Set());
    setSelectedFolderIds(new Set());
    try {
      const { data } = await adminApi.recoverableFiles();
      setFiles(data.files || []);
      setFolders(data.folders || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load recoverable items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    adminApi.markRecoverableViewed().catch(console.error);
  }, []);

  const toggleFile = (id: number) => setSelectedFileIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleFolder = (id: number) => setSelectedFolderIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allItems = [...folders.map(f => ({ ...f, _type: 'folder' as const })), ...files.map(f => ({ ...f, _type: 'file' as const }))];
  const allSelected = allItems.length > 0 && files.every(f => selectedFileIds.has(f.id)) && folders.every(f => selectedFolderIds.has(f.id));
  const toggleAll = () => {
    if (allSelected) { setSelectedFileIds(new Set()); setSelectedFolderIds(new Set()); }
    else { setSelectedFileIds(new Set(files.map(f => f.id))); setSelectedFolderIds(new Set(folders.map(f => f.id))); }
  };

  const totalSelected = selectedFileIds.size + selectedFolderIds.size;

  const handleRecover = async (type: 'file' | 'folder', id: number, name: string) => {
    if (!confirm(`Recover "${name}" and restore it to the owner's files?`)) return;
    try {
      if (type === 'file') await adminApi.recoverFile(id);
      else await adminApi.recoverFolder(id);
      loadItems();
    } catch (err) { console.error('Recover failed:', err); }
  };

  const handlePurge = async (type: 'file' | 'folder', id: number, name: string) => {
    if (!confirm(`Permanently purge "${name}"? This cannot be undone.`)) return;
    try {
      if (type === 'file') await adminApi.purgeFile(id);
      else await adminApi.purgeFolder(id);
      loadItems();
    } catch (err) { console.error('Purge failed:', err); }
  };

  const handleBulkRecover = async () => {
    if (!confirm(`Recover ${totalSelected} selected item(s)?`)) return;
    setBulkWorking(true);
    try {
      await adminApi.bulkRecover([...selectedFileIds], [...selectedFolderIds]);
      loadItems();
    } catch (err) { console.error('Bulk recover failed:', err); } finally { setBulkWorking(false); }
  };

  const handleBulkPurge = async () => {
    if (!confirm(`Permanently purge ${totalSelected} selected item(s)? This cannot be undone.`)) return;
    setBulkWorking(true);
    try {
      await adminApi.bulkPurge([...selectedFileIds], [...selectedFolderIds]);
      loadItems();
    } catch (err) { console.error('Bulk purge failed:', err); } finally { setBulkWorking(false); }
  };

  const isPurgeSoon = (purgeAfter: string | null) =>
    purgeAfter ? (new Date(purgeAfter).getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000 : false;

  const isEmpty = files.length === 0 && folders.length === 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recoverable Items</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Files and folders permanently deleted by users — recoverable within 30 days.
            {total > 0 && <span className="ml-1 font-medium text-amber-600 dark:text-amber-400">({total} item{total !== 1 ? 's' : ''} pending purge)</span>}
          </p>
        </div>
        <button
          onClick={loadItems}
          className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 transition shadow-sm"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Bulk action toolbar */}
      {totalSelected > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{totalSelected} selected</span>
          <button
            onClick={handleBulkRecover}
            disabled={bulkWorking}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition disabled:opacity-50"
          >
            <ArchiveRestore size={13} /> Recover Selected
          </button>
          <button
            onClick={handleBulkPurge}
            disabled={bulkWorking}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition disabled:opacity-50"
          >
            <Trash2 size={13} /> Purge Selected
          </button>
          <button
            onClick={() => { setSelectedFileIds(new Set()); setSelectedFolderIds(new Set()); }}
            className="ml-auto text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
          >
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="spinner mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading recoverable items...</p>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
            <FileSearch size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">No recoverable items</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">No files or folders are currently pending purge.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="px-4 py-3.5 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 accent-blue-600" />
                  </th>
                  <th className="text-left px-3 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-8">Type</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Owner</th>
                  <th className="hidden sm:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Size</th>
                  <th className="hidden md:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deleted</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Purge Date</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Folders section */}
                {folders.map(folder => (
                  <tr key={`folder-${folder.id}`} className={`border-b border-slate-50 dark:border-slate-700 last:border-0 transition-colors group ${selectedFolderIds.has(folder.id) ? 'bg-blue-50/60 dark:bg-blue-900/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-700/50'}`}>
                    <td className="px-4 py-3.5 w-10">
                      <input type="checkbox" checked={selectedFolderIds.has(folder.id)} onChange={() => toggleFolder(folder.id)} className="w-4 h-4 accent-blue-600" />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <FolderIcon size={14} className="text-blue-500" />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">{folder.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Folder</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{folder.user.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">@{folder.user.username}</p>
                    </td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-slate-400">&mdash;</td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                      {folder.deletedAt ? new Date(folder.deletedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {folder.purgeAfter ? (
                        <span className={`text-sm font-medium ${isPurgeSoon(folder.purgeAfter) ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>
                          {new Date(folder.purgeAfter).toLocaleDateString()}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleRecover('folder', folder.id, folder.name)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition"
                        >
                          <ArchiveRestore size={13} /> Recover
                        </button>
                        <button
                          onClick={() => handlePurge('folder', folder.id, folder.name)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition"
                        >
                          <Trash2 size={13} /> Purge
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Files section */}
                {files.map(file => (
                  <tr key={`file-${file.id}`} className={`border-b border-slate-50 dark:border-slate-700 last:border-0 transition-colors group ${selectedFileIds.has(file.id) ? 'bg-blue-50/60 dark:bg-blue-900/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-700/50'}`}>
                    <td className="px-4 py-3.5 w-10">
                      <input type="checkbox" checked={selectedFileIds.has(file.id)} onChange={() => toggleFile(file.id)} className="w-4 h-4 accent-blue-600" />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <FileText size={14} className="text-slate-400" />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">{file.originalName}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{file.mimeType}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{file.user.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">@{file.user.username}</p>
                    </td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                      {formatBytes(file.fileSize)}
                    </td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                      {file.deletedAt ? new Date(file.deletedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {file.purgeAfter ? (
                        <span className={`text-sm font-medium ${isPurgeSoon(file.purgeAfter) ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>
                          {new Date(file.purgeAfter).toLocaleDateString()}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleRecover('file', file.id, file.originalName)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition"
                        >
                          <ArchiveRestore size={13} /> Recover
                        </button>
                        <button
                          onClick={() => handlePurge('file', file.id, file.originalName)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition"
                        >
                          <Trash2 size={13} /> Purge
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
    </div>
  );
}
