import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { fileApi } from '../services/api';
import type { FileItem } from '../types';
import { Eye, X, Download, FileIcon, ChevronLeft, ChevronRight, Music } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  file: FileItem | null;
  files?: FileItem[];
  onNavigate?: (file: FileItem) => void;
}

function isOfficeMime(mimeType: string) {
  const m = mimeType.toLowerCase();
  return (
    m.includes('wordprocessingml') ||
    m === 'application/msword' ||
    m.includes('spreadsheetml') ||
    m === 'application/vnd.ms-excel' ||
    m.includes('opendocument.spreadsheet')
  );
}

function canFetchPreview(mimeType: string) {
  const m = mimeType.toLowerCase();
  return (
    m.startsWith('image/') ||
    m === 'application/pdf' ||
    m.startsWith('video/') ||
    m.startsWith('audio/') ||
    m.startsWith('text/') ||
    m === 'application/json' ||
    m === 'application/xml'
  );
}

export default function FilePreviewModal({ open, onClose, file, files, onNavigate }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentIndex = files && file ? files.findIndex(f => f.id === file.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = files ? currentIndex < files.length - 1 : false;

  const handlePrev = useCallback(() => {
    if (files && hasPrev && onNavigate) onNavigate(files[currentIndex - 1]);
  }, [files, hasPrev, currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (files && hasNext && onNavigate) onNavigate(files[currentIndex + 1]);
  }, [files, hasNext, currentIndex, onNavigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, handlePrev, handleNext, onClose]);

  useEffect(() => {
    if (!open || !file) {
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
      setTextContent(null);
      setHtmlContent(null);
      setError('');
      return;
    }

    const mime = file.mimeType;
    const office = isOfficeMime(mime);
    const native = canFetchPreview(mime);

    if (!office && !native) {
      setLoading(false);
      return;
    }

    let revoked = false;

    const fetchPreview = async () => {
      setLoading(true);
      setError('');
      try {
        if (office) {
          const response = await fileApi.officePreview(file.id);
          if (!revoked) setHtmlContent(response.data as string);
        } else {
          const isText =
            mime.startsWith('text/') ||
            mime === 'application/json' ||
            mime === 'application/xml';

          const response = await api.get(`/files/${file.id}/preview`, { responseType: 'blob' });
          if (!revoked) {
            if (isText) {
              const text = await (response.data as Blob).text();
              setTextContent(text);
            } else {
              const url = URL.createObjectURL(new Blob([response.data], { type: mime }));
              setPreviewUrl(url);
            }
          }
        }
      } catch (err: any) {
        if (!revoked) {
          // 415 = file type not convertible — silently fall through to "not available" card
          if (err.response?.status !== 415) {
            setError(err.response?.data?.error || 'Failed to load preview');
          }
        }
      } finally {
        if (!revoked) setLoading(false);
      }
    };

    fetchPreview();

    return () => {
      revoked = true;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file?.id]);

  if (!open || !file) return null;

  const mime = file.mimeType;
  const isImage = mime.startsWith('image/');
  const isPdf = mime === 'application/pdf';
  const isVideo = mime.startsWith('video/');
  const isAudio = mime.startsWith('audio/');
  const isText = mime.startsWith('text/') || mime === 'application/json' || mime === 'application/xml';
  const isOffice = isOfficeMime(mime);

  const handleDownload = async () => {
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

  const showNav = files && files.length > 1 && onNavigate;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col modal-enter" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg shrink-0">
              <Eye size={20} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{file.originalName}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>{mime}</span>
                {showNav && (
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[11px] font-medium">
                    {currentIndex + 1} of {files!.length}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showNav && (
              <>
                <button onClick={handlePrev} disabled={!hasPrev}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed text-slate-500 dark:text-slate-400"
                  title="Previous (←)">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={handleNext} disabled={!hasNext}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed text-slate-500 dark:text-slate-400"
                  title="Next (→)">
                  <ChevronRight size={18} />
                </button>
              </>
            )}
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
              <Download size={15} />
              Download
            </button>
            <button onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition text-slate-400 dark:text-slate-500">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="spinner mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading preview…</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          ) : isImage && previewUrl ? (
            <img src={previewUrl} alt={file.originalName} className="max-w-full max-h-[65vh] object-contain rounded-lg" />
          ) : isPdf && previewUrl ? (
            <iframe src={previewUrl} title={file.originalName}
              className="w-full h-[65vh] rounded-lg border border-slate-200 dark:border-slate-600" />
          ) : isVideo && previewUrl ? (
            <video src={previewUrl} controls className="max-w-full max-h-[65vh] rounded-lg" />
          ) : isAudio && previewUrl ? (
            <div className="flex flex-col items-center gap-6 py-8 w-full max-w-md">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg">
                <Music size={40} className="text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-xs">{file.originalName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{mime}</p>
              </div>
              <audio src={previewUrl} controls className="w-full" />
            </div>
          ) : isText && textContent !== null ? (
            <pre className="w-full text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-auto text-left whitespace-pre-wrap break-words max-h-[60vh] max-w-full font-mono">
              {textContent}
            </pre>
          ) : isOffice && htmlContent ? (
            <iframe
              srcDoc={htmlContent}
              title={file.originalName}
              sandbox="allow-scripts"
              className="w-full h-[65vh] rounded-lg border border-slate-200 dark:border-slate-600 bg-white"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                <FileIcon size={28} className="text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">Preview not available</p>
              <p className="text-sm text-slate-400 mb-4">This file type cannot be previewed in the browser</p>
              <button onClick={handleDownload}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 text-sm font-semibold transition-all shadow-sm">
                <Download size={15} />
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
