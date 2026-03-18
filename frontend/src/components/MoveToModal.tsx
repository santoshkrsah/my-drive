import { useState, useEffect } from 'react';
import { folderApi, fileApi } from '../services/api';
import { FolderInput, X, ChevronRight, Home, Folder as FolderIcon } from 'lucide-react';

interface FolderNode {
  id: number;
  name: string;
  parentId: number | null;
  children: FolderNode[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onMoved: () => void;
  itemType: 'file' | 'folder';
  itemId: number | number[];
  itemName: string;
  currentFolderId: number | null;
  excludeFolderId?: number;
}

function buildTree(folders: { id: number; name: string; parentId: number | null }[], excludeId?: number): FolderNode[] {
  const map = new Map<number, FolderNode>();
  const roots: FolderNode[] = [];

  const filtered = excludeId ? excludeDescendants(folders, excludeId) : folders;

  for (const f of filtered) {
    map.set(f.id, { ...f, children: [] });
  }
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function excludeDescendants(folders: { id: number; name: string; parentId: number | null }[], excludeId: number) {
  const excludeSet = new Set<number>([excludeId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of folders) {
      if (f.parentId !== null && excludeSet.has(f.parentId) && !excludeSet.has(f.id)) {
        excludeSet.add(f.id);
        changed = true;
      }
    }
  }
  return folders.filter(f => !excludeSet.has(f.id));
}

function TreeNode({ node, selected, onSelect, expanded, onToggle }: {
  node: FolderNode;
  selected: number | null;
  onSelect: (id: number) => void;
  expanded: Set<number>;
  onToggle: (id: number) => void;
}) {
  const isExpanded = expanded.has(node.id);
  const isSelected = selected === node.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
        onClick={() => onSelect(node.id)}
      >
        {node.children.length > 0 ? (
          <button onClick={e => { e.stopPropagation(); onToggle(node.id); }} className="p-0.5">
            <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        ) : <span className="w-5" />}
        <FolderIcon size={16} className="text-amber-500" />
        <span className="truncate">{node.name}</span>
      </div>
      {isExpanded && node.children.length > 0 && (
        <div className="ml-5">
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} selected={selected} onSelect={onSelect} expanded={expanded} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MoveToModal({ open, onClose, onMoved, itemType, itemId, itemName, currentFolderId, excludeFolderId }: Props) {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setLoading(true);
      setSelected(null);
      setError('');
      folderApi.allFolders().then(res => {
        const tree = buildTree(res.data, excludeFolderId);
        setFolders(tree);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [open, excludeFolderId]);

  if (!open) return null;

  const handleMove = async () => {
    setMoving(true);
    setError('');
    try {
      const targetId = selected; // null means root
      if (Array.isArray(itemId)) {
        await fileApi.bulkMove(itemId, targetId);
      } else if (itemType === 'file') {
        await fileApi.move(itemId, targetId);
      } else {
        await folderApi.move(itemId, targetId);
      }
      onMoved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Move failed');
    } finally {
      setMoving(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isBulk = Array.isArray(itemId);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <FolderInput size={18} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Move {isBulk ? `${(itemId as number[]).length} items` : itemType}</h2>
            {!isBulk && <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[250px]">{itemName}</p>}
          </div>
          <button onClick={onClose} className="ml-auto p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
          {error && <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl">{error}</div>}
          {loading ? (
            <div className="flex justify-center py-8"><div className="spinner" /></div>
          ) : (
            <div className="space-y-0.5">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${selected === null ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
                onClick={() => setSelected(null)}
              >
                <span className="w-5" />
                <Home size={16} className="text-slate-500 dark:text-slate-400" />
                <span>My Files (Root)</span>
              </div>
              {folders.map(node => (
                <TreeNode key={node.id} node={node} selected={selected} onSelect={setSelected} expanded={expanded} onToggle={toggleExpand} />
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={moving || (selected === currentFolderId)}
            className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-sm"
          >
            {moving ? 'Moving...' : 'Move Here'}
          </button>
        </div>
      </div>
    </div>
  );
}
