import { useState, useEffect, useCallback } from 'react';
import { fileApi, folderApi } from '../services/api';
import type { FileItem, Folder } from '../types';
import { formatBytes } from '../components/StorageBar';
import { Undo2, Trash2, Trash, FileIcon, Folder as FolderIcon, ChevronRight, ArrowLeft, LayoutGrid, List } from 'lucide-react';
import FileThumbnail from '../components/FileThumbnail';
import FilePreviewModal from '../components/FilePreviewModal';

export default function TrashPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = localStorage.getItem('pageSize');
    return saved ? parseInt(saved) : 20;
  });
  const [view, setView] = useState<'list' | 'grid'>('list');

  // Browsing into trashed folders
  const [currentTrashFolderId, setCurrentTrashFolderId] = useState<number | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: number; name: string }[]>([]);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Bulk selection
  const [selectedFileIds, setSelectedFileIds] = useState<Set<number>>(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<number>>(new Set());

  const canPreview = (mimeType: string) => mimeType.startsWith('image/') || mimeType === 'application/pdf' || mimeType.startsWith('video/');

  const loadTrash = useCallback(async () => {
    setLoading(true);
    setSelectedFileIds(new Set());
    setSelectedFolderIds(new Set());
    try {
      if (currentTrashFolderId) {
        const res = await folderApi.trashContents(currentTrashFolderId);
        setFiles(res.data.files);
        setFolders(res.data.folders);
        setTotalPages(1);
      } else {
        const [filesRes, foldersRes] = await Promise.all([
          fileApi.trash(page, pageSize),
          folderApi.trash(page, pageSize),
        ]);
        setFiles(filesRes.data.files);
        setFolders(foldersRes.data.folders);
        setTotalPages(Math.max(filesRes.data.totalPages, foldersRes.data.totalPages));
      }
    } catch (err) {
      console.error('Failed to load trash:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, currentTrashFolderId]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const navigateToTrashFolder = (folder: Folder) => {
    setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentTrashFolderId(folder.id);
  };

  const navigateBack = () => {
    if (breadcrumb.length <= 1) {
      setBreadcrumb([]);
      setCurrentTrashFolderId(null);
    } else {
      const newBreadcrumb = breadcrumb.slice(0, -1);
      setBreadcrumb(newBreadcrumb);
      setCurrentTrashFolderId(newBreadcrumb[newBreadcrumb.length - 1].id);
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index < 0) {
      setBreadcrumb([]);
      setCurrentTrashFolderId(null);
    } else {
      const newBreadcrumb = breadcrumb.slice(0, index + 1);
      setBreadcrumb(newBreadcrumb);
      setCurrentTrashFolderId(newBreadcrumb[newBreadcrumb.length - 1].id);
    }
  };

  const handleRestoreFile = async (file: FileItem) => {
    try {
      await fileApi.restore(file.id);
      loadTrash();
    } catch (err) {
      console.error('Restore failed:', err);
    }
  };

  const handlePermanentDeleteFile = async (file: FileItem) => {
    if (!confirm(`Permanently delete "${file.originalName}"? This cannot be undone.`)) return;
    try {
      await fileApi.permanentDelete(file.id);
      loadTrash();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleRestoreFolder = async (folder: Folder) => {
    try {
      await folderApi.restore(folder.id);
      loadTrash();
    } catch (err) {
      console.error('Restore failed:', err);
    }
  };

  const handlePermanentDeleteFolder = async (folder: Folder) => {
    if (!confirm(`Permanently delete folder "${folder.name}" and all its contents? This cannot be undone.`)) return;
    try {
      await folderApi.permanentDelete(folder.id);
      loadTrash();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Permanently delete all items in trash? This cannot be undone.')) return;
    try {
      await fileApi.emptyTrash();
      loadTrash();
    } catch (err) {
      console.error('Empty trash failed:', err);
    }
  };

  // Bulk selection helpers
  const toggleFileSelection = (id: number) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleFolderSelection = (id: number) => {
    setSelectedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allSelected = files.length + folders.length > 0 &&
    files.every(f => selectedFileIds.has(f.id)) &&
    folders.every(f => selectedFolderIds.has(f.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedFileIds(new Set());
      setSelectedFolderIds(new Set());
    } else {
      setSelectedFileIds(new Set(files.map(f => f.id)));
      setSelectedFolderIds(new Set(folders.map(f => f.id)));
    }
  };

  const totalSelected = selectedFileIds.size + selectedFolderIds.size;

  const handleBulkRestore = async () => {
    try {
      await Promise.all([
        ...[...selectedFileIds].map(id => fileApi.restore(id)),
        ...[...selectedFolderIds].map(id => folderApi.restore(id)),
      ]);
      loadTrash();
    } catch (err) {
      console.error('Bulk restore failed:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Permanently delete ${totalSelected} selected item(s)? This cannot be undone.`)) return;
    try {
      await Promise.all([
        ...[...selectedFileIds].map(id => fileApi.permanentDelete(id)),
        ...[...selectedFolderIds].map(id => folderApi.permanentDelete(id)),
      ]);
      loadTrash();
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  const isEmpty = files.length === 0 && folders.length === 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trash</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Restore or permanently delete files and folders</p>
        </div>
        <div className="flex items-center gap-2">
          {!isEmpty && (
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition ${view === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="List view"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition ${view === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          )}
          {!isEmpty && !currentTrashFolderId && (
            <button
              onClick={handleEmptyTrash}
              className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 text-sm font-semibold transition-all"
            >
              <Trash2 size={16} />
              Empty Trash
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center gap-1 mb-4 text-sm overflow-x-auto whitespace-nowrap pb-1">
          <button
            onClick={() => navigateToBreadcrumb(-1)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition"
          >
            <ArrowLeft size={14} />
            Trash
          </button>
          {breadcrumb.map((item, index) => (
            <span key={item.id} className="flex items-center gap-1">
              <ChevronRight size={14} className="text-slate-400" />
              <button
                onClick={() => navigateToBreadcrumb(index)}
                className={`font-medium transition ${
                  index === breadcrumb.length - 1
                    ? 'text-slate-800 dark:text-white'
                    : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                {item.name}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Bulk action toolbar */}
      {totalSelected > 0 && !currentTrashFolderId && (
        <div className="flex items-center gap-3 mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{totalSelected} selected</span>
          <button
            onClick={handleBulkRestore}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition"
          >
            <Undo2 size={13} />
            Restore Selected
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition"
          >
            <Trash2 size={13} />
            Delete Selected
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
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading trash...</p>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
            <Trash size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">
            {currentTrashFolderId ? 'This folder is empty' : 'Trash is empty'}
          </p>
          <p className="text-sm text-slate-400">
            {currentTrashFolderId ? 'No deleted items in this folder' : 'Deleted files and folders will appear here'}
          </p>
          {currentTrashFolderId && (
            <button
              onClick={navigateBack}
              className="mt-4 flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition"
            >
              <ArrowLeft size={15} /> Back
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <>
          {/* Folders grid */}
          {folders.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Folders</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {folders.map((folder) => (
                  <div
                    key={`folder-${folder.id}`}
                    className={`relative bg-white dark:bg-slate-800 rounded-xl border transition-all group cursor-pointer ${
                      selectedFolderIds.has(folder.id)
                        ? 'border-blue-400 dark:border-blue-500 shadow-md ring-2 ring-blue-200 dark:ring-blue-800'
                        : 'border-slate-100 dark:border-slate-700 hover:shadow-md'
                    } p-3`}
                    onDoubleClick={() => navigateToTrashFolder(folder)}
                  >
                    {!currentTrashFolderId && (
                      <input
                        type="checkbox"
                        checked={selectedFolderIds.has(folder.id)}
                        onChange={() => toggleFolderSelection(folder.id)}
                        onClick={e => e.stopPropagation()}
                        className="absolute top-2 left-2 w-4 h-4 accent-blue-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        style={selectedFolderIds.has(folder.id) ? { opacity: 1 } : {}}
                      />
                    )}
                    <div className="aspect-square mb-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <FolderIcon size={32} className="text-blue-500" />
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate mb-1">{folder.name}</p>
                    <p className="text-[11px] text-slate-400">{folder.deletedAt ? new Date(folder.deletedAt).toLocaleDateString() : ''}</p>
                    {!currentTrashFolderId && (
                      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRestoreFolder(folder); }}
                          className="flex-1 flex items-center justify-center py-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-[11px] gap-1 transition"
                          title="Restore"
                        >
                          <Undo2 size={11} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePermanentDeleteFolder(folder); }}
                          className="flex-1 flex items-center justify-center py-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 text-[11px] gap-1 transition"
                          title="Delete permanently"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Files grid */}
          {files.length > 0 && (
            <div>
              {folders.length > 0 && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Files</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`relative bg-white dark:bg-slate-800 rounded-xl border transition-all group cursor-pointer ${
                      selectedFileIds.has(file.id)
                        ? 'border-blue-400 dark:border-blue-500 shadow-md ring-2 ring-blue-200 dark:ring-blue-800'
                        : 'border-slate-100 dark:border-slate-700 hover:shadow-md'
                    } p-3`}
                    onDoubleClick={() => canPreview(file.mimeType) && setPreviewFile(file)}
                  >
                    {!currentTrashFolderId && (
                      <input
                        type="checkbox"
                        checked={selectedFileIds.has(file.id)}
                        onChange={() => toggleFileSelection(file.id)}
                        onClick={e => e.stopPropagation()}
                        className="absolute top-2 left-2 w-4 h-4 accent-blue-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        style={selectedFileIds.has(file.id) ? { opacity: 1 } : {}}
                      />
                    )}
                    <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                      <FileThumbnail
                        fileId={file.id}
                        mimeType={file.mimeType}
                        className="w-full h-full object-cover"
                        fallback={
                          <div className="w-full h-full flex items-center justify-center">
                            <FileIcon size={28} className="text-slate-400" />
                          </div>
                        }
                      />
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate mb-1">{file.originalName}</p>
                    <p className="text-[11px] text-slate-400">{formatBytes(file.fileSize)}</p>
                    {!currentTrashFolderId && (
                      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRestoreFile(file); }}
                          className="flex-1 flex items-center justify-center py-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition"
                          title="Restore"
                        >
                          <Undo2 size={11} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePermanentDeleteFile(file); }}
                          className="flex-1 flex items-center justify-center py-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                          title="Delete permanently"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!currentTrashFolderId && (
            <div className="flex items-center justify-between gap-2 mt-5 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 dark:text-slate-400">Per page:</label>
                <select
                  value={pageSize}
                  onChange={e => {
                    const size = parseInt(e.target.value);
                    setPageSize(size);
                    setPage(1);
                    localStorage.setItem('pageSize', String(size));
                  }}
                  className="text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[10, 25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              {totalPages > 1 && (
              <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3.5 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition">Previous</button>
              <span className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3.5 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition">Next</button>
              </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  {!currentTrashFolderId && (
                    <th className="px-4 py-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-blue-600"
                      />
                    </th>
                  )}
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="hidden sm:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="hidden sm:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Size</th>
                  <th className="hidden sm:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deleted</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Folders */}
                {folders.map((folder) => (
                  <tr
                    key={`folder-${folder.id}`}
                    className={`border-b border-slate-50 dark:border-slate-700 last:border-0 transition-colors group cursor-pointer ${
                      selectedFolderIds.has(folder.id) ? 'bg-blue-50/70 dark:bg-blue-900/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-700/50'
                    }`}
                    onClick={() => navigateToTrashFolder(folder)}
                  >
                    {!currentTrashFolderId && (
                      <td className="px-4 py-3.5 w-10" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedFolderIds.has(folder.id)}
                          onChange={() => toggleFolderSelection(folder.id)}
                          className="w-4 h-4 accent-blue-600"
                        />
                      </td>
                    )}
                    <td className="px-3 sm:px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <FolderIcon size={18} className="text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px] sm:max-w-xs">{folder.name}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">Folder</td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-slate-400">&mdash;</td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{folder.deletedAt ? new Date(folder.deletedAt).toLocaleDateString() : '-'}</td>
                    <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {!currentTrashFolderId && (
                          <button
                            onClick={() => handleRestoreFolder(folder)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition"
                            title="Restore"
                          >
                            <Undo2 size={13} />
                            Restore
                          </button>
                        )}
                        {!currentTrashFolderId && (
                          <button
                            onClick={() => handlePermanentDeleteFolder(folder)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition"
                            title="Delete permanently"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Files */}
                {files.map((file) => (
                  <tr
                    key={file.id}
                    className={`border-b border-slate-50 dark:border-slate-700 last:border-0 transition-colors group cursor-pointer ${
                      selectedFileIds.has(file.id) ? 'bg-blue-50/70 dark:bg-blue-900/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-700/50'
                    }`}
                    onDoubleClick={() => canPreview(file.mimeType) && setPreviewFile(file)}
                  >
                    {!currentTrashFolderId && (
                      <td className="px-4 py-3.5 w-10" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedFileIds.has(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className="w-4 h-4 accent-blue-600"
                        />
                      </td>
                    )}
                    <td className="px-3 sm:px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <FileThumbnail
                          fileId={file.id}
                          mimeType={file.mimeType}
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                          fallback={
                            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                              <FileIcon size={18} className="text-slate-400" />
                            </div>
                          }
                        />
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px] sm:max-w-xs">{file.originalName}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">File</td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{formatBytes(file.fileSize)}</td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{file.deletedAt ? new Date(file.deletedAt).toLocaleDateString() : '-'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {!currentTrashFolderId && (
                          <button
                            onClick={() => handleRestoreFile(file)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition"
                            title="Restore"
                          >
                            <Undo2 size={13} />
                            Restore
                          </button>
                        )}
                        {!currentTrashFolderId && (
                          <button
                            onClick={() => handlePermanentDeleteFile(file)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition"
                            title="Delete permanently"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {!currentTrashFolderId && (
            <div className="flex items-center justify-between gap-2 mt-5 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 dark:text-slate-400">Per page:</label>
                <select
                  value={pageSize}
                  onChange={e => {
                    const size = parseInt(e.target.value);
                    setPageSize(size);
                    setPage(1);
                    localStorage.setItem('pageSize', String(size));
                  }}
                  className="text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[10, 25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3.5 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition">Previous</button>
                  <span className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3.5 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition">Next</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
      <FilePreviewModal open={!!previewFile} onClose={() => setPreviewFile(null)} file={previewFile} files={files} onNavigate={setPreviewFile} />
    </div>
  );
}
