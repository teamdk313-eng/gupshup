import React, { useEffect, useState } from 'react';
import type { ChatMessage, ContactUser } from '../types/gupshup';

interface ImageViewerModalProps {
  message: ChatMessage | null;
  threadPhotos: ChatMessage[];
  senderName: string;
  contacts: ContactUser[];
  onClose: () => void;
  onSelectPhoto: (msg: ChatMessage) => void;
  onReply: (msg: ChatMessage) => void;
  onToggleStar: (msg: ChatMessage) => void;
  onForward: (msg: ChatMessage, targetContactId: string) => void;
  onRequestDelete: (msg: ChatMessage) => void;
  onRequestSaveToDrive: (msg: ChatMessage) => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  message,
  threadPhotos,
  senderName,
  contacts,
  onClose,
  onSelectPhoto,
  onReply,
  onToggleStar,
  onForward,
  onRequestDelete,
  onRequestSaveToDrive,
}) => {
  const [zoomed, setZoomed] = useState(false);
  const [showForwardPicker, setShowForwardPicker] = useState(false);

  useEffect(() => {
    setZoomed(false);
    setShowForwardPicker(false);
  }, [message?.id]);

  useEffect(() => {
    if (!message) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [message, onClose]);

  if (!message || !message.photoUrl) return null;

  const currentIdx = threadPhotos.findIndex((m) => m.id === message.id);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx >= 0 && currentIdx < threadPhotos.length - 1;

  return (
    <div
      className="fixed inset-0 z-[75] bg-slate-950/95 text-white flex flex-col justify-between select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Full screen photo viewer"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-slate-950/90 to-transparent z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            aria-label="Close photo viewer"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-semibold truncate">{senderName}</div>
            <div className="text-xs text-slate-300 truncate">{message.timestamp}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRequestSaveToDrive(message)}
            className="h-9 px-3.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[17px]">cloud_upload</span>
            <span className="hidden sm:inline">Save to Drive</span>
          </button>
          <a
            href={message.photoUrl}
            download={message.photoName || 'gupshup-photo.jpg'}
            aria-label="Download photo"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
          </a>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 overflow-hidden">
        <button
          type="button"
          onClick={() => setZoomed((z) => !z)}
          className="mb-3 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-xs text-slate-200 flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">
            {zoomed ? 'zoom_out' : 'pinch'}
          </span>
          <span>{zoomed ? 'Zoomed (185%) • Tap to reset' : 'Tap or double-click to zoom'}</span>
        </button>

        <div className="relative w-full max-w-4xl max-h-[56vh] flex items-center justify-center overflow-auto rounded-2xl">
          <img
            src={message.photoUrl}
            alt={message.text || message.photoName || 'Shared photo'}
            onClick={() => setZoomed((z) => !z)}
            className={`max-h-[54vh] w-auto object-contain rounded-2xl cursor-zoom-in transition-transform duration-300 ${
              zoomed ? 'scale-[1.75] cursor-zoom-out' : 'scale-100'
            }`}
          />

          {hasPrev && (
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => onSelectPhoto(threadPhotos[currentIdx - 1])}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 flex items-center justify-center border border-white/10"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_left</span>
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => onSelectPhoto(threadPhotos[currentIdx + 1])}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 flex items-center justify-center border border-white/10"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_right</span>
            </button>
          )}
        </div>

        {/* Dots Indicator */}
        {threadPhotos.length > 1 && (
          <div className="flex items-center gap-1.5 mt-3">
            {threadPhotos.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-label={`View ${p.photoName || 'photo'}`}
                onClick={() => onSelectPhoto(p)}
                className={`h-1.5 rounded-full transition-all ${
                  p.id === message.id ? 'w-5 bg-white' : 'w-1.5 bg-white/35'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Metadata + Action Bar */}
      <div className="px-4 sm:px-6 pb-5 pt-2 max-w-2xl w-full mx-auto space-y-3 z-10">
        {showForwardPicker && (
          <div className="bg-slate-900/95 border border-white/15 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Forward photo to...</span>
              <button
                type="button"
                onClick={() => setShowForwardPicker(false)}
                className="text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
              {contacts.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onForward(message, c.id);
                    setShowForwardPicker(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-primary-container text-xs font-medium text-white transition-colors"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {(message.text || message.photoName) && (
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3.5 text-sm">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-300 mb-1">
              <span className="flex items-center gap-1.5 font-medium text-emerald-300">
                <span className="material-symbols-outlined text-[15px]">chat_bubble</span>
                <span>Attached Note</span>
              </span>
              <span>
                {message.photoSize || 'JPG'}
                {message.photoDimensions ? ` • ${message.photoDimensions}` : ''}
              </span>
            </div>
            <p className="text-slate-100 leading-relaxed">
              {message.text || message.photoName}
            </p>
          </div>
        )}

        <div className="bg-slate-900/90 border border-white/10 rounded-2xl grid grid-cols-4 divide-x divide-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowForwardPicker((v) => !v)}
            className="py-3 flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">forward</span>
            <span className="text-[11px] font-medium">Forward</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onReply(message);
              onClose();
            }}
            className="py-3 flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">reply</span>
            <span className="text-[11px] font-medium">Reply</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleStar(message)}
            className="py-3 flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors"
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                message.starred ? 'text-amber-400 icon-filled' : ''
              }`}
            >
              star
            </span>
            <span className="text-[11px] font-medium">
              {message.starred ? 'Starred' : 'Star'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onRequestDelete(message)}
            className="py-3 flex flex-col items-center justify-center gap-1 text-rose-300 hover:bg-rose-500/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
            <span className="text-[11px] font-medium">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
