import { useState, useEffect } from 'react';

type ViewMode = 'list' | 'grid';

export function useViewPreference() {
  const [view, setView] = useState<ViewMode>(() => {
    return (localStorage.getItem('fileViewMode') as ViewMode) || 'list';
  });

  useEffect(() => {
    localStorage.setItem('fileViewMode', view);
  }, [view]);

  return { view, setView };
}
