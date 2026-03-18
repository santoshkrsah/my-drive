import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

interface Props {
  fileId: number;
  mimeType: string;
  className?: string;
  fallback: React.ReactNode;
}

export default function FileThumbnail({ fileId, mimeType, className, fallback }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mimeType.startsWith('image/')) return;

    let cancelled = false;

    api.get(`/files/${fileId}/preview`, { responseType: 'blob' })
      .then(res => {
        if (cancelled) return;
        const blobUrl = URL.createObjectURL(res.data);
        urlRef.current = blobUrl;
        setUrl(blobUrl);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [fileId, mimeType]);

  if (!url) return <>{fallback}</>;

  return <img src={url} alt="" className={className} />;
}
