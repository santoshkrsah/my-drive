import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fileApi, folderApi, tagApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { FileItem, StorageUsage, Folder, Tag } from '../types';
import StorageBar from '../components/StorageBar';
import UploadModal from '../components/UploadModal';
import CreateFolderModal from '../components/CreateFolderModal';
import FilePreviewModal from '../components/FilePreviewModal';
import ShareModal from '../components/ShareModal';
import VersionHistoryModal from '../components/VersionHistoryModal';
import RenameModal from '../components/RenameModal';
import MoveToModal from '../components/MoveToModal';
import PublicLinkModal from '../components/PublicLinkModal';
import KeyboardShortcutsModal from '../components/KeyboardShortcutsModal';
import FileAccessLogModal from '../components/FileAccessLogModal';
import TagPickerModal from '../components/TagPickerModal';
import FilePropertiesModal from '../components/FilePropertiesModal';
import FileThumbnail from '../components/FileThumbnail';
import ContextMenu from '../components/ContextMenu';
import type { ContextMenuItem } from '../components/ContextMenu';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useViewPreference } from '../hooks/useViewPreference';
import { formatBytes } from '../components/StorageBar';
import {
  Upload, Download, Trash2, FileIcon, RefreshCw, Image, Film, Music,
  FileText, Archive, FileSpreadsheet, FolderOpen, FolderPlus, ChevronRight,
  Home, Eye, Share2, History, Folder as FolderIcon, Search, Pencil,
  FolderInput, Link2, X, CheckSquare, Square, Grid3X3, List, MoreHorizontal,
  ArrowUpDown, ArrowUp, ArrowDown, Star, SlidersHorizontal, ClipboardList, Tag as TagIcon, Info,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = localStorage.getItem('pageSize');
    return saved ? parseInt(saved) : 20;
  });
  const [currentFolderId, setCurrentFolderId] = useState<number | undefined>(() => {
    const fp = new URLSearchParams(window.location.search).get('folder');
    return fp ? parseInt(fp) : undefined;
  });
  const [breadcrumb, setBreadcrumb] = useState<{ id: number; name: string }[]>([]);

  // Modal states
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [shareFolder, setShareFolder] = useState<Folder | null>(null);
  const [versionFile, setVersionFile] = useState<FileItem | null>(null);
  const [renameFile, setRenameFile] = useState<FileItem | null>(null);
  const [moveItem, setMoveItem] = useState<{ type: 'file' | 'folder'; id: number; name: string; folderId: number | null } | null>(null);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [linkFile, setLinkFile] = useState<FileItem | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [accessLogFile, setAccessLogFile] = useState<FileItem | null>(null);
  const [tagFile, setTagFile] = useState<FileItem | null>(null);
  const [propertiesFile, setPropertiesFile] = useState<FileItem | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ files: FileItem[]; folders: Folder[] } | null>(null);
  const [searchFileType, setSearchFileType] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sizeMin, setSizeMin] = useState('');
  const [sizeMax, setSizeMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [stagedDateFrom, setStagedDateFrom] = useState('');
  const [stagedDateTo, setStagedDateTo] = useState('');
  const [stagedSizeMin, setStagedSizeMin] = useState('');
  const [stagedSizeMax, setStagedSizeMax] = useState('');
  const [stagedTagIds, setStagedTagIds] = useState<number[]>([]);

  // Bulk selection
  const [selectedFileIds, setSelectedFileIds] = useState<Set<number>>(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<number>>(new Set());

  // Sorting
  const [sortBy, setSortBy] = useState('uploadDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Drag state
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null);

  // View preference
  const { view, setView } = useViewPreference();

  // Action menu for grid view
  const [actionMenuFile, setActionMenuFile] = useState<number | null>(null);

  // Right-click context menu
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number;
    type: 'file' | 'folder';
    item: FileItem | Folder;
  } | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const [filesRes, storageRes, foldersRes] = await Promise.all([
        fileApi.list(page, pageSize, currentFolderId, sortBy, sortDir),
        fileApi.storage(),
        folderApi.list(currentFolderId || null),
      ]);
      setFiles(filesRes.data.files);
      setTotalPages(filesRes.data.totalPages);
      setStorage(storageRes.data);
      setFolders(foldersRes.data.folders);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, currentFolderId, sortBy, sortDir]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Load available tags once on mount
  useEffect(() => {
    tagApi.list().then(res => setAvailableTags(res.data.tags || [])).catch(() => {});
  }, []);

  // Read fileType URL param on mount
  useEffect(() => {
    const ft = searchParams.get('fileType');
    if (ft) {
      setSearchFileType(ft);
      setShowFilters(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentFolderId) {
      folderApi.breadcrumb(currentFolderId).then(res => {
        setBreadcrumb(res.data);
      }).catch(() => setBreadcrumb([]));
    } else {
      setBreadcrumb([]);
    }
  }, [currentFolderId]);

  // Clear selection and action menu when folder/search changes
  useEffect(() => {
    setSelectedFileIds(new Set());
    setSelectedFolderIds(new Set());
    setActionMenuFile(null);
    setContextMenu(null);
  }, [currentFolderId, searchResults]);

  // Close action menu on outside click
  useEffect(() => {
    if (actionMenuFile === null) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-action-menu]')) {
        setActionMenuFile(null);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [actionMenuFile]);

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!searchQuery.trim() && !searchFileType && !dateFrom && !dateTo && !sizeMin && !sizeMax && selectedTagIds.length === 0) {
      setSearchResults(null);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await fileApi.search(
          searchQuery.trim(),
          searchFileType || undefined,
          dateFrom || undefined,
          dateTo || undefined,
          sizeMin || undefined,
          sizeMax || undefined,
          selectedTagIds.length > 0 ? selectedTagIds : undefined,
        );
        setSearchResults({ files: data.files, folders: data.folders });
      } catch {
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery, searchFileType, dateFrom, dateTo, sizeMin, sizeMax, selectedTagIds]);

  const navigateToFolder = (folderId?: number) => {
    setCurrentFolderId(folderId);
    setPage(1);
    setSearchQuery('');
    setSearchResults(null);
    setSearchParams(
      prev => {
        const p = new URLSearchParams(prev);
        if (folderId) { p.set('folder', String(folderId)); } else { p.delete('folder'); }
        return p;
      },
      { replace: true }
    );
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const response = await fileApi.download(file.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Move "${file.originalName}" to trash?`)) return;
    try {
      await fileApi.softDelete(file.id);
      loadFiles();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleDeleteFolder = async (folder: Folder) => {
    if (!confirm(`Delete folder "${folder.name}" and all its contents?`)) return;
    try {
      await folderApi.delete(folder.id);
      loadFiles();
    } catch (err) {
      console.error('Delete folder failed:', err);
    }
  };

  const handleToggleStar = async (file: FileItem) => {
    try {
      await fileApi.toggleStar(file.id);
      loadFiles();
    } catch (err) {
      console.error('Toggle star failed:', err);
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedFileIds.size === 0) return;
    if (!confirm(`Move ${selectedFileIds.size} file(s) to trash?`)) return;
    try {
      await fileApi.bulkDelete(Array.from(selectedFileIds));
      setSelectedFileIds(new Set());
      loadFiles();
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  const handleBulkDeleteFolders = async () => {
    if (selectedFolderIds.size === 0) return;
    if (!confirm(`Move ${selectedFolderIds.size} folder(s) to trash?`)) return;
    try {
      await folderApi.bulkDelete(Array.from(selectedFolderIds));
      setSelectedFolderIds(new Set());
      loadFiles();
    } catch (err) {
      console.error('Bulk delete folders failed:', err);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedFileIds.size === 0) return;
    try {
      const response = await fileApi.bulkDownload(Array.from(selectedFileIds));
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'files.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Bulk download failed:', err);
    }
  };

  const toggleFileSelection = (fileId: number) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId); else next.add(fileId);
      return next;
    });
  };

  const toggleFolderSelection = (folderId: number) => {
    setSelectedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId); else next.add(folderId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const displayFiles = searchResults ? searchResults.files : files;
    const displayFlds = searchResults ? searchResults.folders : folders;
    const allFilesSelected = selectedFileIds.size === displayFiles.length;
    const allFoldersSelected = selectedFolderIds.size === displayFlds.length;
    if (allFilesSelected && allFoldersSelected) {
      setSelectedFileIds(new Set());
      setSelectedFolderIds(new Set());
    } else {
      setSelectedFileIds(new Set(displayFiles.map(f => f.id)));
      setSelectedFolderIds(new Set(displayFlds.map(f => f.id)));
    }
  };

  // Drag and drop
  const handleDragStart = (e: React.DragEvent, fileId: number) => {
    e.dataTransfer.setData('text/plain', String(fileId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, folderId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, folderId: number) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const fileId = parseInt(e.dataTransfer.getData('text/plain'));
    if (isNaN(fileId)) return;
    try {
      await fileApi.move(fileId, folderId);
      loadFiles();
    } catch (err) {
      console.error('Move failed:', err);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onDelete: () => { if (selectedFileIds.size > 0) handleBulkDelete(); if (selectedFolderIds.size > 0) handleBulkDeleteFolders(); },
    onSelectAll: toggleSelectAll,
    onEscape: () => { setSelectedFileIds(new Set()); setSelectedFolderIds(new Set()); },
    onNewFolder: () => setShowCreateFolder(true),
    onHelp: () => setShowShortcuts(true),
  });

  const canPreview = (mimeType: string) => {
    const m = mimeType.toLowerCase();
    return (
      m.startsWith('image/') ||
      m === 'application/pdf' ||
      m.startsWith('video/') ||
      m.startsWith('audio/') ||
      m.startsWith('text/') ||
      m === 'application/json' ||
      m === 'application/xml' ||
      // Office Open XML (.docx, .xlsx, .pptx)
      m.includes('officedocument') ||
      // Legacy Office binary (.doc, .xls, .ppt)
      m.includes('msword') ||
      m.includes('ms-excel') ||
      m.includes('ms-powerpoint') ||
      // LibreOffice / OpenDocument (.odt, .ods, .odp)
      m.includes('opendocument') ||
      // Outlook (.msg, .pst)
      m.includes('ms-outlook') ||
      // Access (.accdb, .mdb)
      m === 'application/msaccess' ||
      m === 'application/vnd.ms-access' ||
      // OneNote (.one)
      m.includes('onenote') ||
      // Project (.mpp)
      m.includes('ms-project') ||
      // Publisher (.pub)
      m.includes('mspublisher') ||
      // Visio (.vsdx, .vsd)
      m.includes('ms-visio') ||
      m === 'application/vnd.visio'
    );
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'file' | 'folder', item: FileItem | Folder) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, item });
  };

  const buildContextMenuItems = (): ContextMenuItem[] => {
    if (!contextMenu) return [];
    if (contextMenu.type === 'file') {
      const file = contextMenu.item as FileItem;
      const items: ContextMenuItem[] = [];
      if (canPreview(file.mimeType)) {
        items.push({ label: 'Preview', icon: <Eye size={14} />, onClick: () => setPreviewFile(file) });
      }
      items.push({ label: 'Download', icon: <Download size={14} />, onClick: () => handleDownload(file) });
      items.push({ label: file.isStarred ? 'Unstar' : 'Star', icon: <Star size={14} fill={file.isStarred ? 'currentColor' : 'none'} />, divider: true, onClick: () => handleToggleStar(file) });
      items.push({ label: 'Rename', icon: <Pencil size={14} />, onClick: () => setRenameFile(file) });
      items.push({ label: 'Move to', icon: <FolderInput size={14} />, onClick: () => setMoveItem({ type: 'file', id: file.id, name: file.originalName, folderId: file.folderId }) });
      items.push({ label: 'Share', icon: <Share2 size={14} />, onClick: () => setShareFile(file) });
      items.push({ label: 'Public Link', icon: <Link2 size={14} />, onClick: () => setLinkFile(file) });
      items.push({ label: 'Versions', icon: <History size={14} />, onClick: () => setVersionFile(file) });
      items.push({ label: 'Access Log', icon: <ClipboardList size={14} />, onClick: () => setAccessLogFile(file) });
      items.push({ label: 'Manage Tags', icon: <TagIcon size={14} />, onClick: () => setTagFile(file) });
      items.push({ label: 'Properties', icon: <Info size={14} />, onClick: () => setPropertiesFile(file) });
      items.push({ label: 'Delete', icon: <Trash2 size={14} />, danger: true, divider: true, onClick: () => handleDelete(file) });
      return items;
    } else {
      const folder = contextMenu.item as Folder;
      return [
        { label: 'Open', icon: <FolderOpen size={14} />, onClick: () => navigateToFolder(folder.id) },
        { label: 'Share', icon: <Share2 size={14} />, divider: true, onClick: () => setShareFolder(folder) },
        { label: 'Move to', icon: <FolderInput size={14} />, onClick: () => setMoveItem({ type: 'folder', id: folder.id, name: folder.name, folderId: folder.parentId }) },
        { label: 'Delete', icon: <Trash2 size={14} />, danger: true, divider: true, onClick: () => handleDeleteFolder(folder) },
      ];
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image size={18} className="text-pink-500" />;
    if (mimeType.startsWith('video/')) return <Film size={18} className="text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music size={18} className="text-green-500" />;
    if (mimeType.includes('pdf')) return <FileText size={18} className="text-red-500" />;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <Archive size={18} className="text-amber-500" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) return <FileSpreadsheet size={18} className="text-emerald-600" />;
    if (mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('text')) return <FileText size={18} className="text-blue-500" />;
    return <FileIcon size={18} className="text-slate-400" />;
  };

  const getFileIconBg = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'bg-pink-50 dark:bg-pink-900/20';
    if (mimeType.startsWith('video/')) return 'bg-purple-50 dark:bg-purple-900/20';
    if (mimeType.startsWith('audio/')) return 'bg-green-50 dark:bg-green-900/20';
    if (mimeType.includes('pdf')) return 'bg-red-50 dark:bg-red-900/20';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'bg-amber-50 dark:bg-amber-900/20';
    if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'bg-emerald-50 dark:bg-emerald-900/20';
    if (mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('text')) return 'bg-blue-50 dark:bg-blue-900/20';
    return 'bg-slate-50 dark:bg-slate-700';
  };

  const displayFiles = searchResults ? searchResults.files : files;
  const displayFolders = searchResults ? (searchFileType ? [] : searchResults.folders) : folders;
  const totalSelected = selectedFileIds.size + selectedFolderIds.size;

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown size={13} className="text-slate-300" />;
    return sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Files</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage and organize your documents</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition ${view === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="List view"
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition ${view === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="Grid view"
            >
              <Grid3X3 size={15} />
            </button>
          </div>
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={e => handleSortChange(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
          >
            <option value="uploadDate">Date</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="type">Type</option>
          </select>
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 transition shadow-sm"
            title={`Sort ${sortDir === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortDir === 'asc' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
          </button>
          <button
            onClick={loadFiles}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 transition shadow-sm"
          >
            <RefreshCw size={15} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 transition shadow-sm"
          >
            <FolderPlus size={15} />
            <span className="hidden sm:inline">New Folder</span>
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Upload size={15} />
            Upload
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search files and folders..."
            className="w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <select
          value={searchFileType}
          onChange={e => setSearchFileType(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        >
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="audio">Audio</option>
          <option value="application/pdf">PDF</option>
          <option value="text">Text</option>
        </select>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-xl text-sm font-medium transition ${
            showFilters || dateFrom || dateTo || sizeMin || sizeMax || selectedTagIds.length > 0
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400'
              : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <SlidersHorizontal size={14} />
          Filters
        </button>
      </div>

      {/* Advanced filter panel */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date From</label>
            <input
              type="date"
              value={stagedDateFrom}
              onChange={e => setStagedDateFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date To</label>
            <input
              type="date"
              value={stagedDateTo}
              onChange={e => setStagedDateTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Min Size (MB)</label>
            <input
              type="number"
              value={stagedSizeMin}
              onChange={e => setStagedSizeMin(e.target.value)}
              placeholder="0"
              min="0"
              className="w-28 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Max Size (MB)</label>
            <input
              type="number"
              value={stagedSizeMax}
              onChange={e => setStagedSizeMax(e.target.value)}
              placeholder="∞"
              min="0"
              className="w-28 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          {availableTags.length > 0 && (
            <div className="w-full">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => setStagedTagIds(prev =>
                      prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                    )}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition border ${
                      stagedTagIds.includes(tag.id)
                        ? 'text-white border-transparent'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                    }`}
                    style={stagedTagIds.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color } : undefined}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="w-full flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setDateFrom(stagedDateFrom);
                setDateTo(stagedDateTo);
                setSizeMin(stagedSizeMin);
                setSizeMax(stagedSizeMax);
                setSelectedTagIds(stagedTagIds);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition"
            >
              Apply Filters
            </button>
            <button
              onClick={() => {
                setStagedDateFrom(''); setStagedDateTo(''); setStagedSizeMin(''); setStagedSizeMax(''); setStagedTagIds([]);
                setDateFrom(''); setDateTo(''); setSizeMin(''); setSizeMax(''); setSelectedTagIds([]);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg transition"
            >
              <X size={12} /> Clear all
            </button>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {(dateFrom || dateTo || sizeMin || sizeMax || selectedTagIds.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {dateFrom && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full border border-blue-200 dark:border-blue-700">
              From: {dateFrom}
              <button onClick={() => { setDateFrom(''); setStagedDateFrom(''); }} className="hover:text-blue-900"><X size={10} /></button>
            </span>
          )}
          {dateTo && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full border border-blue-200 dark:border-blue-700">
              To: {dateTo}
              <button onClick={() => { setDateTo(''); setStagedDateTo(''); }} className="hover:text-blue-900"><X size={10} /></button>
            </span>
          )}
          {sizeMin && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full border border-blue-200 dark:border-blue-700">
              Min: {sizeMin}MB
              <button onClick={() => { setSizeMin(''); setStagedSizeMin(''); }} className="hover:text-blue-900"><X size={10} /></button>
            </span>
          )}
          {sizeMax && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full border border-blue-200 dark:border-blue-700">
              Max: {sizeMax}MB
              <button onClick={() => { setSizeMax(''); setStagedSizeMax(''); }} className="hover:text-blue-900"><X size={10} /></button>
            </span>
          )}
          {selectedTagIds.map(id => {
            const tag = availableTags.find(t => t.id === id);
            if (!tag) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1 px-2 py-1 text-white text-xs rounded-full" style={{ backgroundColor: tag.color }}>
                {tag.name}
                <button onClick={() => { setSelectedTagIds(prev => prev.filter(tid => tid !== id)); setStagedTagIds(prev => prev.filter(tid => tid !== id)); }} className="hover:opacity-80"><X size={10} /></button>
              </span>
            );
          })}
        </div>
      )}

      {/* Storage bar */}
      {storage && !searchResults && <div className="mb-6"><StorageBar storage={storage} /></div>}

      {/* Selection toolbar */}
      {totalSelected > 0 && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedFileIds.size > 0 && `${selectedFileIds.size} file(s)`}
            {selectedFileIds.size > 0 && selectedFolderIds.size > 0 && ', '}
            {selectedFolderIds.size > 0 && `${selectedFolderIds.size} folder(s)`}
            {' '}selected
          </span>
          <div className="w-full sm:flex-1 sm:w-auto" />
          {selectedFileIds.size > 0 && (
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition">
              <Trash2 size={13} /> Delete Files
            </button>
          )}
          {selectedFolderIds.size > 0 && (
            <button onClick={handleBulkDeleteFolders} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition">
              <Trash2 size={13} /> Delete Folders
            </button>
          )}
          {selectedFileIds.size > 0 && (
            <>
              <button onClick={() => setBulkMoveOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition">
                <FolderInput size={13} /> Move
              </button>
              <button onClick={handleBulkDownload} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-700 border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                <Download size={13} /> Download
              </button>
            </>
          )}
          <button onClick={() => { setSelectedFileIds(new Set()); setSelectedFolderIds(new Set()); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition">
            <X size={13} /> Clear
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      {!searchResults && breadcrumb.length > 0 && (
        <div className="flex items-center gap-1 mb-4 text-sm overflow-x-auto whitespace-nowrap pb-1">
          <button
            onClick={() => navigateToFolder(undefined)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition"
          >
            <Home size={14} />
            My Files
          </button>
          {breadcrumb.map((item) => (
            <span key={item.id} className="flex items-center gap-1">
              <ChevronRight size={14} className="text-slate-400" />
              <button
                onClick={() => navigateToFolder(item.id)}
                className={`font-medium transition ${
                  item.id === currentFolderId
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

      {searchResults && (
        <div className="mb-4 flex items-center gap-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isSearching ? 'Searching...' : `Found ${searchResults.files.length} file(s) and ${searchResults.folders.length} folder(s)`}
          </p>
        </div>
      )}

      {/* Content */}
      {loading || isSearching ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="spinner mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{isSearching ? 'Searching...' : 'Loading files...'}</p>
        </div>
      ) : displayFolders.length === 0 && displayFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
            <FolderOpen size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">
            {searchResults ? 'No results found' : currentFolderId ? 'This folder is empty' : 'No files yet'}
          </p>
          <p className="text-sm text-slate-400 mb-4">
            {searchResults ? 'Try a different search term' : currentFolderId ? 'Upload files or create subfolders' : 'Upload your first file to get started'}
          </p>
          {!searchResults && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 text-sm font-semibold transition-all shadow-sm"
            >
              <Upload size={15} />
              Upload Files
            </button>
          )}
        </div>
      ) : (
        <>
          {view === 'list' ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="w-10 px-3 py-3.5">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      {totalSelected > 0 && totalSelected === displayFiles.length + displayFolders.length
                        ? <CheckSquare size={16} className="text-blue-600" />
                        : <Square size={16} />}
                    </button>
                  </th>
                  <th className="text-left px-3 sm:px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSortChange('name')}>
                    <span className="inline-flex items-center gap-1">Name <SortIcon field="name" /></span>
                  </th>
                  <th className="hidden sm:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSortChange('size')}>
                    <span className="inline-flex items-center gap-1">Size <SortIcon field="size" /></span>
                  </th>
                  <th className="hidden sm:table-cell text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSortChange('uploadDate')}>
                    <span className="inline-flex items-center gap-1">Date <SortIcon field="uploadDate" /></span>
                  </th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Folders first */}
                {displayFolders.map((folder) => (
                  <tr
                    key={`folder-${folder.id}`}
                    className={`border-b border-slate-50 dark:border-slate-700 last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer ${dragOverFolderId === folder.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${selectedFolderIds.has(folder.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    onClick={(e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); e.stopPropagation(); toggleFolderSelection(folder.id); } else { navigateToFolder(folder.id); } }}
                    onContextMenu={(e) => handleContextMenu(e, 'folder', folder)}
                    onDragOver={(e) => handleDragOver(e, folder.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => { e.stopPropagation(); handleDrop(e, folder.id); }}
                  >
                    <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleFolderSelection(folder.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {selectedFolderIds.has(folder.id)
                          ? <CheckSquare size={16} className="text-blue-600" />
                          : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-3 sm:px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <FolderIcon size={18} className="text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{folder.name}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{folder.size && folder.size !== '0' ? formatBytes(parseInt(folder.size)) : '—'}</td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{new Date(folder.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setShareFolder(folder)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition"
                          title="Share folder"
                        >
                          <Share2 size={15} />
                        </button>
                        <button
                          onClick={() => setMoveItem({ type: 'folder', id: folder.id, name: folder.name, folderId: folder.parentId })}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                          title="Move folder"
                        >
                          <FolderInput size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteFolder(folder)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                          title="Delete folder"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Files */}
                {displayFiles.map((file) => (
                  <tr
                    key={file.id}
                    className={`border-b border-slate-50 dark:border-slate-700 last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-700/50 transition-colors group ${selectedFileIds.has(file.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    draggable
                    onClick={(e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); toggleFileSelection(file.id); } }}
                    onDragStart={(e) => handleDragStart(e, file.id)}
                    onDoubleClick={() => canPreview(file.mimeType) ? setPreviewFile(file) : handleDownload(file)}
                    onContextMenu={(e) => handleContextMenu(e, 'file', file)}
                  >
                    <td className="px-3 py-3.5">
                      <button
                        onClick={() => toggleFileSelection(file.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {selectedFileIds.has(file.id)
                          ? <CheckSquare size={16} className="text-blue-600" />
                          : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-3 sm:px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <FileThumbnail
                          fileId={file.id}
                          mimeType={file.mimeType}
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                          fallback={
                            <div className={`w-9 h-9 rounded-lg ${getFileIconBg(file.mimeType)} flex items-center justify-center shrink-0`}>
                              {getFileIcon(file.mimeType)}
                            </div>
                          }
                        />
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate max-w-[150px] sm:max-w-xs">{file.originalName}</span>
                        {file.fileTags && file.fileTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {file.fileTags.map(ft => (
                              <span key={ft.tagId} style={{ backgroundColor: ft.tag.color }}
                                className="inline-flex rounded-full px-1.5 py-0.5 text-[10px] text-white font-medium">
                                {ft.tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{formatBytes(file.fileSize)}</td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{new Date(file.uploadDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {canPreview(file.mimeType) && (
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition"
                            title="Preview"
                          >
                            <Eye size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleStar(file)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${file.isStarred ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                          title={file.isStarred ? 'Unstar' : 'Star'}
                        >
                          <Star size={15} fill={file.isStarred ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => setRenameFile(file)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition"
                          title="Rename"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setShareFile(file)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition"
                          title="Share"
                        >
                          <Share2 size={15} />
                        </button>
                        <button
                          onClick={() => setLinkFile(file)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition"
                          title="Public Link"
                        >
                          <Link2 size={15} />
                        </button>
                        <button
                          onClick={() => setMoveItem({ type: 'file', id: file.id, name: file.originalName, folderId: file.folderId })}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                          title="Move to"
                        >
                          <FolderInput size={15} />
                        </button>
                        <button
                          onClick={() => setVersionFile(file)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition"
                          title="Version History"
                        >
                          <History size={15} />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                          title="Download"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(file)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                          title="Move to trash"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          ) : (
          <div>
            {/* Folders grid */}
            {displayFolders.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                {displayFolders.map((folder) => (
                  <div
                    key={`folder-${folder.id}`}
                    onClick={(e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); e.stopPropagation(); toggleFolderSelection(folder.id); } else { navigateToFolder(folder.id); } }}
                    onContextMenu={(e) => handleContextMenu(e, 'folder', folder)}
                    onDragOver={(e) => handleDragOver(e, folder.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => { e.stopPropagation(); handleDrop(e, folder.id); }}
                    className={`group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 cursor-pointer hover:shadow-md transition-all ${dragOverFolderId === folder.id ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''} ${selectedFolderIds.has(folder.id) ? 'ring-2 ring-blue-500 border-blue-300 dark:border-blue-600' : ''}`}
                  >
                    {/* Selection checkbox */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFolderSelection(folder.id); }}
                      className="absolute top-2 left-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {selectedFolderIds.has(folder.id)
                        ? <CheckSquare size={16} className="text-blue-600" />
                        : <Square size={16} className="md:opacity-0 md:group-hover:opacity-100 transition-opacity" />}
                    </button>
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <FolderIcon size={24} className="text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate w-full">
                        {folder.name}
                      </span>
                      <span className="text-xs text-slate-400">{new Date(folder.createdAt).toLocaleDateString()}</span>
                      {folder.size && folder.size !== '0' && (
                        <span className="text-xs text-slate-400">{formatBytes(parseInt(folder.size))}</span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setShareFolder(folder)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition"
                        title="Share"
                      >
                        <Share2 size={13} />
                      </button>
                      <button
                        onClick={() => setMoveItem({ type: 'folder', id: folder.id, name: folder.name, folderId: folder.parentId })}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        title="Move"
                      >
                        <FolderInput size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteFolder(folder)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Files grid */}
            {displayFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {displayFiles.map((file) => (
                  <div
                    key={file.id}
                    draggable
                    onClick={(e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); toggleFileSelection(file.id); } }}
                    onDragStart={(e) => handleDragStart(e, file.id)}
                    onDoubleClick={() => canPreview(file.mimeType) ? setPreviewFile(file) : handleDownload(file)}
                    onContextMenu={(e) => handleContextMenu(e, 'file', file)}
                    className={`group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 hover:shadow-md transition-all ${selectedFileIds.has(file.id) ? 'ring-2 ring-blue-500 border-blue-300 dark:border-blue-600' : ''}`}
                  >
                    {/* Selection checkbox */}
                    <button
                      onClick={() => toggleFileSelection(file.id)}
                      className="absolute top-2 left-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {selectedFileIds.has(file.id)
                        ? <CheckSquare size={16} className="text-blue-600" />
                        : <Square size={16} className="md:opacity-0 md:group-hover:opacity-100 transition-opacity" />}
                    </button>

                    {/* File icon + name */}
                    <div className="flex flex-col items-center text-center gap-2 pt-4 pb-1">
                      <FileThumbnail
                        fileId={file.id}
                        mimeType={file.mimeType}
                        className="w-full h-20 rounded-lg object-cover"
                        fallback={
                          <div className={`w-12 h-12 rounded-xl ${getFileIconBg(file.mimeType)} flex items-center justify-center`}>
                            {getFileIcon(file.mimeType)}
                          </div>
                        }
                      />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate w-full">
                        {file.originalName}
                      </span>
                      <span className="text-xs text-slate-400">{formatBytes(file.fileSize)}</span>
                      {file.fileTags && file.fileTags.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1">
                          {file.fileTags.map(ft => (
                            <span key={ft.tagId} style={{ backgroundColor: ft.tag.color }}
                              className="inline-flex rounded-full px-1.5 py-0.5 text-[10px] text-white font-medium">
                              {ft.tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      {canPreview(file.mimeType) && (
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition"
                          title="Preview"
                        >
                          <Eye size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(file)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                        title="Download"
                      >
                        <Download size={13} />
                      </button>
                      <div className="relative" data-action-menu>
                        <button
                          onClick={() => setActionMenuFile(actionMenuFile === file.id ? null : file.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                          title="More actions"
                        >
                          <MoreHorizontal size={13} />
                        </button>
                        {actionMenuFile === file.id && (
                          <div className="absolute right-0 top-8 z-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-lg py-1 min-w-[140px]">
                            <button
                              onClick={() => { handleToggleStar(file); setActionMenuFile(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <Star size={13} fill={file.isStarred ? 'currentColor' : 'none'} className={file.isStarred ? 'text-amber-500' : ''} /> {file.isStarred ? 'Unstar' : 'Star'}
                            </button>
                            <button
                              onClick={() => { setRenameFile(file); setActionMenuFile(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <Pencil size={13} /> Rename
                            </button>
                            <button
                              onClick={() => { setShareFile(file); setActionMenuFile(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <Share2 size={13} /> Share
                            </button>
                            <button
                              onClick={() => { setLinkFile(file); setActionMenuFile(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <Link2 size={13} /> Public Link
                            </button>
                            <button
                              onClick={() => { setMoveItem({ type: 'file', id: file.id, name: file.originalName, folderId: file.folderId }); setActionMenuFile(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <FolderInput size={13} /> Move to
                            </button>
                            <button
                              onClick={() => { setVersionFile(file); setActionMenuFile(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <History size={13} /> Versions
                            </button>
                            <button
                              onClick={() => { handleDelete(file); setActionMenuFile(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Pagination */}
          {!searchResults && (
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
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="sm:hidden text-sm text-slate-600 dark:text-slate-300 mx-2">{page} / {totalPages}</span>
              <div className="hidden sm:flex gap-1 mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                  Math.max(0, page - 3),
                  Math.min(totalPages, page + 2)
                ).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition
                      ${p === page
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
              </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onUploaded={loadFiles} folderId={currentFolderId} />
      <CreateFolderModal open={showCreateFolder} onClose={() => setShowCreateFolder(false)} onCreated={loadFiles} parentId={currentFolderId} />
      <FilePreviewModal open={!!previewFile} onClose={() => setPreviewFile(null)} file={previewFile} files={files} onNavigate={setPreviewFile} />
      <ShareModal open={!!shareFile} onClose={() => { setShareFile(null); }} file={shareFile} />
      <ShareModal open={!!shareFolder} onClose={() => setShareFolder(null)} folder={shareFolder} />
      <VersionHistoryModal open={!!versionFile} onClose={() => setVersionFile(null)} file={versionFile} onVersionChange={loadFiles} />
      <RenameModal open={!!renameFile} onClose={() => setRenameFile(null)} onRenamed={loadFiles} file={renameFile} userRole={user?.role} />
      <PublicLinkModal open={!!linkFile} onClose={() => setLinkFile(null)} file={linkFile} />
      <KeyboardShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <FileAccessLogModal open={!!accessLogFile} onClose={() => setAccessLogFile(null)} file={accessLogFile} />
      <TagPickerModal open={!!tagFile} onClose={() => setTagFile(null)} file={tagFile} onTagsChanged={loadFiles} />
      <FilePropertiesModal open={!!propertiesFile} onClose={() => setPropertiesFile(null)} file={propertiesFile} folders={folders} />

      {/* Move modal for single item */}
      {moveItem && (
        <MoveToModal
          open={!!moveItem}
          onClose={() => setMoveItem(null)}
          onMoved={loadFiles}
          itemType={moveItem.type}
          itemId={moveItem.id}
          itemName={moveItem.name}
          currentFolderId={moveItem.folderId}
          excludeFolderId={moveItem.type === 'folder' ? moveItem.id : undefined}
        />
      )}

      {/* Bulk move modal */}
      <MoveToModal
        open={bulkMoveOpen}
        onClose={() => setBulkMoveOpen(false)}
        onMoved={() => { setSelectedFileIds(new Set()); loadFiles(); }}
        itemType="file"
        itemId={Array.from(selectedFileIds)}
        itemName={`${selectedFileIds.size} files`}
        currentFolderId={currentFolderId ?? null}
      />

      {/* Right-click context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={buildContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
