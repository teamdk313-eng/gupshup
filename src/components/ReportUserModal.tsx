import React, { useEffect, useState } from 'react';
import type { ContactUser } from '../types/gupshup';
import { Avatar } from './Avatar';

interface ReportUserModalProps {
  open: boolean;
  contact: ContactUser | null;
  alreadyBlocked: boolean;
  onClose: () => void;
  onSubmitReport: (payload: {
    targetUserId: string;
    reason: string;
    details: string;
    blockAlso: boolean;
  }) => void;
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or unwanted promotions' },
  { id: 'harassment', label: 'Harassment, bullying, or threats' },
  { id: 'impersonation', label: 'Fake account or impersonation' },
  { id: 'inappropriate', label: 'Inappropriate or unsafe media' },
  { id: 'other', label: 'Something else' },
];

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  open,
  contact,
  alreadyBlocked,
  onClose,
  onSubmitReport,
}) => {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [blockAlso, setBlockAlso] = useState(!alreadyBlocked);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('spam');
      setDetails('');
      setBlockAlso(!alreadyBlocked);
      setSubmitted(false);
    }
  }, [open, alreadyBlocked]);

  if (!open || !contact) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = REPORT_REASONS.find((r) => r.id === reason)?.label ?? reason;
    onSubmitReport({
      targetUserId: contact.id,
      reason: chosen,
      details: details.trim(),
      blockAlso,
    });
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-on-surface/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="w-full sm:max-w-lg bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 flex items-center justify-between border-b border-surface-container-low">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[22px] text-error">flag</span>
            <h3 id="report-modal-title" className="text-lg font-semibold text-on-surface">
              Report {contact.name}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close report dialog"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary-container text-secondary flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[30px] icon-filled">
                check_circle
              </span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-on-surface">Report submitted</h4>
              <p className="text-sm text-on-surface-variant mt-1 max-w-sm mx-auto">
                Thank you for keeping Gupshup safe. Our trust team will review your report for{' '}
                <span className="font-semibold text-on-surface">@{contact.username}</span>
                {blockAlso ? ', and they have been blocked from contacting you.' : '.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-6 rounded-[14px] bg-primary-container text-on-primary text-sm font-semibold"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-container-low">
              <Avatar
                name={contact.name}
                initials={contact.initials}
                size="sm"
                showOnlineDot={false}
                bgClass={contact.avatarBgClass}
                textClass={contact.avatarTextClass}
              />
              <div>
                <div className="text-sm font-semibold text-on-surface">{contact.name}</div>
                <div className="text-xs text-on-surface-variant">@{contact.username}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Why are you reporting this account?
              </div>
              <div className="space-y-2">
                {REPORT_REASONS.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                      reason === item.id
                        ? 'border-primary bg-primary-fixed/30'
                        : 'border-outline-variant/25 hover:bg-surface-container-low'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={item.id}
                      checked={reason === item.id}
                      onChange={() => setReason(item.id)}
                      className="accent-[#4f46e5] w-4 h-4"
                    />
                    <span className="text-sm font-medium text-on-surface">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="report-details"
                  className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Additional context (optional)
                </label>
                <span className="text-xs text-on-surface-variant tabular-nums">
                  {details.length}/500
                </span>
              </div>
              <textarea
                id="report-details"
                rows={3}
                maxLength={500}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Share anything helpful for our review team..."
                className="w-full p-3.5 rounded-xl bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary-container/25 resize-none"
              />
            </div>

            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-low cursor-pointer">
              <input
                type="checkbox"
                checked={blockAlso}
                onChange={(e) => setBlockAlso(e.target.checked)}
                className="accent-[#4f46e5] w-4 h-4 rounded"
              />
              <div>
                <div className="text-sm font-semibold text-on-surface">
                  Also block {contact.name}
                </div>
                <div className="text-xs text-on-surface-variant">
                  They won&apos;t be able to send you messages
                </div>
              </div>
            </label>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-5 rounded-[14px] bg-surface-container-low hover:bg-surface-container text-on-surface text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-11 px-5 rounded-[14px] bg-error hover:bg-[#9c1616] text-on-error text-sm font-semibold transition-colors"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
