import React from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  icon?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'primary',
  icon = 'help',
  busy = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-on-surface/45 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-error-container text-error'
                : 'bg-primary-fixed text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[22px] icon-filled">{icon}</span>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h3 id="confirm-modal-title" className="text-lg font-semibold text-on-surface">
              {title}
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-11 px-5 rounded-[14px] bg-surface-container-low hover:bg-surface-container text-on-surface text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`h-11 px-5 rounded-[14px] text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-60 ${
              variant === 'danger'
                ? 'bg-error hover:bg-[#9c1616] text-on-error'
                : 'bg-primary-container hover:bg-primary text-on-primary'
            }`}
          >
            {busy && (
              <span className="material-symbols-outlined text-[18px] animate-spin">
                progress_activity
              </span>
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
