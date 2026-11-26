import React from 'react';
import type { ChatMessage, ContactUser } from '../types/gupshup';
import { Avatar } from './Avatar';

interface ContactInfoViewProps {
  contact: ContactUser;
  messages: ChatMessage[];
  isBlocked: boolean;
  onBack: () => void;
  onMessage: () => void;
  onToggleBlock: () => void;
  onOpenReport: () => void;
  onOpenImageViewer: (msg: ChatMessage) => void;
}

export const ContactInfoView: React.FC<ContactInfoViewProps> = ({
  contact,
  messages,
  isBlocked,
  onBack,
  onMessage,
  onToggleBlock,
  onOpenReport,
  onOpenImageViewer,
}) => {
  const sharedPhotos = messages.filter((m) => m.kind === 'photo' && m.photoUrl);
  const voiceCount = messages.filter((m) => m.kind === 'voice').length;
  const driveCount = messages.filter((m) => m.kind === 'drive_file').length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Top Breadcrumb / Back */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span>Back to Chat</span>
        </button>

        <span className="text-xs font-medium text-on-surface-variant">Contact Info</span>
      </div>

      {/* Blocked Alert Banner */}
      {isBlocked && (
        <div className="p-4 rounded-2xl bg-error-container text-on-error-container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[22px] text-error shrink-0">
              block
            </span>
            <div>
              <div className="text-sm font-semibold">You blocked {contact.name}</div>
              <p className="text-xs opacity-90 mt-0.5">
                They cannot send you messages or view your online status while blocked.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleBlock}
            className="h-9 px-4 rounded-xl bg-surface-container-lowest text-error text-xs font-semibold shrink-0 hover:bg-surface-container transition-colors"
          >
            Unblock User
          </button>
        </div>
      )}

      {/* Identity Hero Card */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 flex flex-col items-center text-center">
        <Avatar
          name={contact.name}
          initials={contact.initials}
          size="xl"
          isOnline={!isBlocked && contact.isOnline}
          showOnlineDot={!isBlocked}
          bgClass={contact.avatarBgClass}
          textClass={contact.avatarTextClass}
        />

        <div className="mt-4 flex items-center gap-1.5">
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">{contact.name}</h2>
          {contact.verified && (
            <span className="material-symbols-outlined text-[20px] text-primary icon-filled">
              verified
            </span>
          )}
        </div>

        <p className="text-sm text-on-surface-variant mt-0.5">
          @{contact.username} • {contact.joinedLabel}
        </p>

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low text-xs font-medium text-on-surface-variant">
          <span
            className={`w-2 h-2 rounded-full ${
              !isBlocked && contact.isOnline ? 'bg-secondary' : 'bg-outline'
            }`}
          />
          <span>
            {isBlocked
              ? 'Blocked'
              : contact.isOnline
                ? 'Active now'
                : `Last seen ${contact.joinedAgo}`}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full max-w-sm">
          <button
            type="button"
            onClick={onMessage}
            className="flex-1 min-w-[140px] h-11 px-5 rounded-[14px] bg-primary-container hover:bg-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
            <span>Message</span>
          </button>

          <button
            type="button"
            onClick={onToggleBlock}
            className={`h-11 px-4 rounded-[14px] text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              isBlocked
                ? 'bg-primary-fixed text-primary hover:bg-primary-fixed-dim'
                : 'bg-surface-container-low hover:bg-error-container text-on-surface hover:text-error'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isBlocked ? 'check_circle' : 'block'}
            </span>
            <span>{isBlocked ? 'Unblock' : 'Block'}</span>
          </button>
        </div>
      </div>

      {/* About & Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15">
          <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
            Bio
          </div>
          <p className="text-sm text-on-surface leading-relaxed">{contact.bio}</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-on-surface-variant">Local Time</span>
            <span className="font-semibold text-on-surface">{contact.localTime}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-on-surface-variant">Shared Media</span>
            <span className="font-semibold text-on-surface tabular-nums">
              {sharedPhotos.length} photos • {voiceCount} voice
              {driveCount > 0 ? ` • ${driveCount} Drive` : ''}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-on-surface-variant">Focus Area</span>
            <span className="font-semibold text-on-surface">
              {contact.roleTag ?? 'Gupshup Member'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Shared Media */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-semibold text-on-surface">
            Shared Photos ({sharedPhotos.length})
          </h3>
          <span className="text-xs text-on-surface-variant">Tap any photo to inspect</span>
        </div>

        {sharedPhotos.length === 0 ? (
          <div className="py-6 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl">
            No photos shared in this conversation yet.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {sharedPhotos.map((photoMsg) => (
              <button
                key={photoMsg.id}
                type="button"
                onClick={() => onOpenImageViewer(photoMsg)}
                className="aspect-square rounded-xl overflow-hidden bg-surface-container-low group relative focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <img
                  src={photoMsg.photoUrl}
                  alt={photoMsg.photoName || 'Shared photo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Safety Actions */}
      <div className="bg-surface-container-lowest rounded-2xl p-2 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 divide-y divide-surface-container-low">
        <button
          type="button"
          onClick={onToggleBlock}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-surface-container-low rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-error">block</span>
            <div>
              <div className="text-sm font-semibold text-on-surface">
                {isBlocked ? `Unblock ${contact.name}` : `Block ${contact.name}`}
              </div>
              <div className="text-xs text-on-surface-variant">
                {isBlocked
                  ? 'Allow messages and status visibility again'
                  : 'Prevent this person from messaging you'}
              </div>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            chevron_right
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenReport}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-error-container/30 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-error">flag</span>
            <div>
              <div className="text-sm font-semibold text-error">Report {contact.name}</div>
              <div className="text-xs text-on-surface-variant">
                Flag spam, harassment, or safety concerns
              </div>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-error">chevron_right</span>
        </button>
      </div>
    </div>
  );
};
