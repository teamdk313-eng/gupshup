import React, { useEffect, useRef, useState } from 'react';
import type { DriveAttachmentMeta, DriveFileItem } from '../types/gupshup';
import {
  downloadDriveImageAsDataUrl,
  getDriveConnectionState,
  listDriveFiles,
} from '../services/googleDrive';
import { formatFileSize, validateImageFileSize } from '../utils/gupshupLogic';

interface AttachmentModalProps {
  open: boolean;
  recipientName: string;
  onClose: () => void;
  onConnectDrive: () => Promise<boolean>;
  onSendPhoto: (payload: {
    photoUrl: string;
    photoName: string;
    photoSize: string;
    photoDimensions?: string;
    caption: string;
  }) => void;
  onSendDriveFile: (payload: {
    driveFile: DriveAttachmentMeta;
    caption: string;
  }) => void;
}

export const AttachmentModal: React.FC<AttachmentModalProps> = ({
  open,
  recipientName,
  onClose,
  onConnectDrive,
  onSendPhoto,
  onSendDriveFile,
}) => {
  const [activeTab, setActiveTab] = useState<'photo' | 'drive'>('photo');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [dimensions, setDimensions] = useState<string | undefined>(undefined);
  const [caption, setCaption] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Google Drive state
  const [driveConnected, setDriveConnected] = useState(getDriveConnectionState().connected);
  const [driveEmail, setDriveEmail] = useState<string | null>(getDriveConnectionState().email);
  const [driveQuery, setDriveQuery] = useState('');
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveBusyConnect, setDriveBusyConnect] = useState(false);
  const [selectedDriveDoc, setSelectedDriveDoc] = useState<DriveFileItem | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const state = getDriveConnectionState();
    setDriveConnected(state.connected);
    setDriveEmail(state.email);
    setErrorMsg(null);
    setUploadProgress(null);
  }, [open]);

  const loadDriveList = async (search = '') => {
    setDriveLoading(true);
    setErrorMsg(null);
    try {
      const files = await listDriveFiles(search);
      setDriveFiles(files);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not fetch Google Drive files.');
    } finally {
      setDriveLoading(false);
    }
  };

  useEffect(() => {
    if (open && activeTab === 'drive' && driveConnected) {
      void loadDriveList(driveQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab, driveConnected]);

  if (!open) return null;

  const resetSelection = () => {
    setPreviewUrl(null);
    setSelectedDriveDoc(null);
    setFileName('');
    setFileSize('');
    setDimensions(undefined);
    setCaption('');
    setErrorMsg(null);
    setUploadProgress(null);
  };

  const handleClose = () => {
    resetSelection();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validation = validateImageFileSize(file.size);
    if (!validation.valid) {
      setErrorMsg(validation.error ?? 'Invalid image file.');
      return;
    }

    setErrorMsg(null);
    setSelectedDriveDoc(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const dataUrl = reader.result;
      const img = new Image();
      img.onload = () => {
        setDimensions(`${img.naturalWidth} × ${img.naturalHeight} px`);
      };
      img.src = dataUrl;
      setPreviewUrl(dataUrl);
      setFileName(file.name);
      setFileSize(formatFileSize(file.size));
    };
    reader.readAsDataURL(file);
  };

  const handleConnectDriveClick = async () => {
    setDriveBusyConnect(true);
    setErrorMsg(null);
    try {
      const ok = await onConnectDrive();
      const state = getDriveConnectionState();
      setDriveConnected(ok && state.connected);
      setDriveEmail(state.email);
      if (ok && state.connected) {
        await loadDriveList(driveQuery);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Google Drive connection failed.');
    } finally {
      setDriveBusyConnect(false);
    }
  };

  const handleSelectDriveItem = async (item: DriveFileItem) => {
    setErrorMsg(null);
    if (item.mimeType.startsWith('image/')) {
      setDriveLoading(true);
      try {
        const dataUrl = await downloadDriveImageAsDataUrl(item.id);
        setSelectedDriveDoc(null);
        setPreviewUrl(dataUrl);
        setFileName(item.name);
        setFileSize(item.size ? formatFileSize(Number(item.size)) : 'Drive Image');
        setDimensions('Google Drive');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Could not download Drive image.');
      } finally {
        setDriveLoading(false);
      }
    } else {
      setPreviewUrl(null);
      setSelectedDriveDoc(item);
    }
  };

  const handleConfirmSend = () => {
    if (previewUrl) {
      setUploadProgress(40);
      setTimeout(() => {
        setUploadProgress(100);
        onSendPhoto({
          photoUrl: previewUrl,
          photoName: fileName || 'photo.jpg',
          photoSize: fileSize || '1.2 MB',
          photoDimensions: dimensions,
          caption: caption.trim(),
        });
        resetSelection();
        onClose();
      }, 180);
      return;
    }

    if (selectedDriveDoc) {
      onSendDriveFile({
        driveFile: {
          fileId: selectedDriveDoc.id,
          name: selectedDriveDoc.name,
          mimeType: selectedDriveDoc.mimeType,
          sizeBytes: selectedDriveDoc.size ? Number(selectedDriveDoc.size) : undefined,
          webViewLink: selectedDriveDoc.webViewLink,
        },
        caption: caption.trim(),
      });
      resetSelection();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-on-surface/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attach-modal-title"
    >
      <div className="w-full sm:max-w-lg bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Drag Handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-outline-variant/60" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-surface-container-low">
          <div>
            <h3 id="attach-modal-title" className="text-lg font-semibold text-on-surface">
              Send a photo or file
            </h3>
            <p className="text-xs text-on-surface-variant">
              Sharing with {recipientName} • Max 5 MB per photo
            </p>
          </div>
          <button
            type="button"
            aria-label="Close attachment modal"
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 pt-3">
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface-container-low">
            <button
              type="button"
              onClick={() => {
                setActiveTab('photo');
                setErrorMsg(null);
              }}
              className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'photo'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">photo_library</span>
              <span>Photo & Camera</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('drive');
                setErrorMsg(null);
              }}
              className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'drive'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">cloud</span>
              <span>Google Drive</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-4 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-error shrink-0">
                error
              </span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Selected Preview (Photo or Drive Doc) */}
          {previewUrl ? (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/20">
                <img
                  src={previewUrl}
                  alt={fileName || 'Selected preview'}
                  className="w-full max-h-64 object-contain bg-slate-950/5"
                />
                <button
                  type="button"
                  onClick={resetSelection}
                  className="absolute top-2.5 right-2.5 h-8 px-3 rounded-full bg-on-surface/75 text-on-primary text-xs font-semibold flex items-center gap-1 hover:bg-on-surface"
                >
                  <span className="material-symbols-outlined text-[15px]">refresh</span>
                  <span>Change</span>
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
                <span className="truncate font-medium text-on-surface">{fileName}</span>
                <span className="shrink-0 ml-2">
                  {fileSize}
                  {dimensions ? ` • ${dimensions}` : ''}
                </span>
              </div>
            </div>
          ) : selectedDriveDoc ? (
            <div className="p-4 rounded-2xl bg-surface-container-low border border-primary/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">description</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-on-surface truncate">
                    {selectedDriveDoc.name}
                  </div>
                  <div className="text-xs text-on-surface-variant truncate">
                    {selectedDriveDoc.mimeType}
                    {selectedDriveDoc.size
                      ? ` • ${formatFileSize(Number(selectedDriveDoc.size))}`
                      : ''}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={resetSelection}
                className="text-xs font-semibold text-primary hover:underline shrink-0"
              >
                Change
              </button>
            </div>
          ) : activeTab === 'photo' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-5 rounded-2xl bg-surface-container-low hover:bg-primary-fixed/40 border border-outline-variant/20 flex flex-col items-center justify-center gap-2 text-center transition-colors group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                </div>
                <span className="text-sm font-semibold text-on-surface">Take Photo</span>
                <span className="text-xs text-on-surface-variant">Use device camera</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="p-5 rounded-2xl bg-surface-container-low hover:bg-primary-fixed/40 border border-outline-variant/20 flex flex-col items-center justify-center gap-2 text-center transition-colors group"
              >
                <div className="w-12 h-12 rounded-2xl bg-secondary-container text-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">
                    add_photo_alternate
                  </span>
                </div>
                <span className="text-sm font-semibold text-on-surface">Choose from Gallery</span>
                <span className="text-xs text-on-surface-variant">JPG, PNG, WebP up to 5 MB</span>
              </button>
            </div>
          ) : !driveConnected ? (
            <div className="p-6 rounded-2xl bg-surface-container-low text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[26px]">cloud_sync</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-on-surface">
                  Browse your Google Drive
                </h4>
                <p className="text-xs text-on-surface-variant mt-1 max-w-xs mx-auto">
                  Connect Google Drive to attach photos or documents directly inside this chat.
                </p>
              </div>
              <button
                type="button"
                disabled={driveBusyConnect}
                onClick={handleConnectDriveClick}
                className="h-10 px-5 rounded-xl bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-60 transition-colors"
              >
                {driveBusyConnect && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                )}
                <span>Connect Google Drive</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Connected as {driveEmail || 'Google User'}</span>
                <button
                  type="button"
                  onClick={() => void loadDriveList(driveQuery)}
                  className="text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  <span>Refresh</span>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void loadDriveList(driveQuery);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={driveQuery}
                  onChange={(e) => setDriveQuery(e.target.value)}
                  placeholder="Search your Drive files..."
                  className="flex-1 h-10 px-3.5 rounded-xl bg-surface-container-low text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/25"
                />
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-primary-fixed text-primary text-xs font-semibold"
                >
                  Search
                </button>
              </form>

              <div className="max-h-56 overflow-y-auto rounded-2xl border border-outline-variant/20 divide-y divide-surface-container-low">
                {driveLoading ? (
                  <div className="p-6 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px] animate-spin text-primary">
                      progress_activity
                    </span>
                    <span>Loading Google Drive files...</span>
                  </div>
                ) : driveFiles.length === 0 ? (
                  <div className="p-6 text-center text-xs text-on-surface-variant">
                    No matching files found in your Google Drive.
                  </div>
                ) : (
                  driveFiles.map((file) => {
                    const isImg = file.mimeType.startsWith('image/');
                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => void handleSelectDriveItem(file)}
                        className="w-full p-3 flex items-center justify-between gap-3 text-left hover:bg-surface-container-low transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isImg
                                ? 'bg-secondary-container text-secondary'
                                : 'bg-primary-fixed text-primary'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {isImg ? 'image' : 'description'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-on-surface truncate">
                              {file.name}
                            </div>
                            <div className="text-[11px] text-on-surface-variant truncate">
                              {file.size ? formatFileSize(Number(file.size)) : file.mimeType}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-primary shrink-0">Select</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Caption Input + Progress */}
          {(previewUrl || selectedDriveDoc) && (
            <div className="space-y-2">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption (optional)..."
                className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary-container/25"
              />
              {uploadProgress !== null && (
                <div className="h-1.5 w-full rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full bg-primary-container transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-container-low flex items-center justify-end gap-2.5 bg-surface-container-lowest">
          <button
            type="button"
            onClick={handleClose}
            className="h-11 px-5 rounded-[14px] bg-surface-container-low hover:bg-surface-container text-on-surface text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!previewUrl && !selectedDriveDoc}
            onClick={handleConfirmSend}
            className="h-11 px-5 rounded-[14px] bg-primary-container hover:bg-primary disabled:opacity-40 text-on-primary text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            <span>{selectedDriveDoc ? 'Send Drive File' : 'Send Photo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
