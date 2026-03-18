import { useEffect } from 'react';

interface ShortcutConfig {
  onDelete?: () => void;
  onSelectAll?: () => void;
  onEscape?: () => void;
  onEnter?: () => void;
  onNewFolder?: () => void;
  onHelp?: () => void;
}

export function useKeyboardShortcuts(config: ShortcutConfig, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && config.onDelete) {
        config.onDelete();
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && config.onSelectAll) {
        config.onSelectAll();
        e.preventDefault();
      }
      if (e.key === 'Escape' && config.onEscape) {
        config.onEscape();
      }
      if (e.key === 'Enter' && config.onEnter) {
        config.onEnter();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'N' || e.key === 'n') && config.onNewFolder) {
        config.onNewFolder();
        e.preventDefault();
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && config.onHelp) {
        config.onHelp();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [config, enabled]);
}
