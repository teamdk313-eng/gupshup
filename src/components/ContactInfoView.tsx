import React from 'react';
import type { ContactUser } from '../types/gupshup';
import { Avatar } from './Avatar';

interface ContactInfoViewProps {
  contact: ContactUser;
  isBlocked: boolean;
  onBack: () => void;
  onMessage: () => void;
  onToggleBlock: () => void;
  onOpenReport: () => void;
}

export const ContactInfoView: React.FC<ContactInfoViewProps> = ({
  contact, isBlocked, onBack, onMessage, onToggleBlock, onOpenReport,
}) => {
  const publicId = `@${contact.username}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span>Back to Directory</span>
        </button>
        <span className="text-xs font-medium text-on-surface-variant">Member ID</span>
      </div>

      {isBlocked && (
        <div className="p-4 rounded-2xl bg-error-container text-on-error-container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[22px] text-error shrink-0">block</span>
            <div className="text-sm font-semibold">You blocked {publicId}</div>
          </div>
          <button type="button" onClick={onToggleBlock}
            className="h-9 px-4 rounded-xl bg-surface-container-lowest text-error text-xs font-semibold shrink-0 hover:bg-surface-container transition-colors">
            Unblock User
          </button>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 flex flex-col items-center text-center">
        <Avatar name={contact.username} initials={contact.initials} size="xl" showOnlineDot={false}
          bgClass={contact.avatarBgClass} textClass={contact.avatarTextClass} />
        <h2 className="mt-4 text-2xl font-bold text-on-surface tracking-tight">{publicId}</h2>
        <p className="text-sm text-on-surface-variant mt-1">Public Gupshup ID</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full max-w-sm">
          <button type="button" onClick={onMessage}
            className="flex-1 min-w-[140px] h-11 px-5 rounded-[14px] bg-primary-container hover:bg-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors">
            <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
            <span>Message</span>
          </button>
          <button type="button" onClick={onToggleBlock}
            className={`h-11 px-4 rounded-[14px] text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              isBlocked ? 'bg-primary-fixed text-primary hover:bg-primary-fixed-dim' : 'bg-surface-container-low hover:bg-error-container text-on-surface hover:text-error'
            }`}>
            <span className="material-symbols-outlined text-[18px]">{isBlocked ? 'check_circle' : 'block'}</span>
            <span>{isBlocked ? 'Unblock' : 'Block'}</span>
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15">
        <p className="text-sm text-on-surface-variant text-center">
          This member is identified publicly by their unique Gupshup username. Email addresses
          and private account details are not shown in the member directory.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-2 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 divide-y divide-surface-container-low">
        <button type="button" onClick={onToggleBlock}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-surface-container-low rounded-xl transition-colors">
          <span className="text-sm font-semibold text-on-surface">{isBlocked ? `Unblock ${publicId}` : `Block ${publicId}`}</span>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
        </button>
        <button type="button" onClick={onOpenReport}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-error-container/30 rounded-xl transition-colors">
          <span className="text-sm font-semibold text-error">Report {publicId}</span>
          <span className="material-symbols-outlined text-[18px] text-error">chevron_right</span>
        </button>
      </div>
    </div>
  );
};
