import React, { useEffect, useRef, useState } from 'react';
import { PRIVACY_SECTIONS } from '../data/seedData';
import type {
  AppScreen,
  BlockedEntry,
  ChatMessage,
  ChatThread,
  ContactUser,
  CurrentUserProfile,
} from '../types/gupshup';
import {
  computeProfileStats,
  getInitials,
  normalizeUsernameInput,
  validateImageFileSize,
  validateUsername,
} from '../utils/gupshupLogic';
import { Avatar } from './Avatar';
import { PWAInstallControl } from './PWAInstallUI';

/* -------------------------------------------------------------------------- */
/* 1. MY PROFILE VIEW                                                         */
/* -------------------------------------------------------------------------- */
interface MyProfileViewProps {
  user: CurrentUserProfile;
  chats: ChatThread[];
  messagesByChat: Record<string, ChatMessage[]>;
  blocked: BlockedEntry[];
  onNavigate: (screen: AppScreen) => void;
  onUpdateAvatar: (dataUrl: string) => void;
  onCopyHandle: () => void;
}

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  user,
  chats,
  messagesByChat,
  blocked,
  onNavigate,
  onUpdateAvatar,
  onCopyHandle,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const stats = computeProfileStats(chats, messagesByChat, blocked);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const check = validateImageFileSize(file.size);
    if (!check.valid) {
      setAvatarError(check.error ?? 'Image too large.');
      return;
    }
    setAvatarError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onUpdateAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Banner + Profile Header Card */}
      <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15">
        <div className="h-32 sm:h-40 bg-gradient-to-r from-[#4f46e5] via-[#3525cd] to-[#006b5f] relative">
          <button
            type="button"
            onClick={() => onNavigate('edit-profile')}
            className="absolute top-4 right-4 h-9 px-3.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative -mt-12 w-fit">
                <div className="p-1 rounded-full bg-surface-container-lowest shadow-md">
                  <Avatar
                    name={user.name}
                    initials={user.initials}
                    imageUrl={user.avatarDataUrl}
                    size="xl"
                    showOnlineDot={false}
                    bgClass="bg-primary-fixed-dim"
                    textClass="text-primary"
                  />
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  aria-label="Upload profile photo"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary-container text-on-primary shadow-md border-2 border-surface-container-lowest flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                </button>
              </div>

              <div className="pt-1 sm:pt-3">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface">{user.name}</h2>
                  <span className="material-symbols-outlined text-[18px] text-primary icon-filled">
                    verified
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span>@{user.username}</span>
                  <span>•</span>
                  <span className="text-xs">{user.joinedLabel}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:pt-3">
              <button
                type="button"
                onClick={onCopyHandle}
                className="h-10 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">share</span>
                <span>Share Profile</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="h-10 px-4 rounded-xl bg-primary-fixed hover:bg-primary-container text-primary hover:text-on-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">settings</span>
                <span>Settings</span>
              </button>
            </div>
          </div>

          {avatarError && (
            <p className="mt-3 text-xs text-error font-medium">{avatarError}</p>
          )}

          <p className="mt-4 text-sm text-on-surface leading-relaxed max-w-2xl">
            {user.bio || 'No bio added yet.'}
          </p>
        </div>
      </div>

      {/* Live Derived Stats (Strictly real counts from app state) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Threads', value: stats.activeThreads, icon: 'forum' },
          { label: 'Messages', value: stats.totalMessages, icon: 'chat_bubble' },
          { label: 'Shared Media', value: stats.sharedMediaCount, icon: 'perm_media' },
          { label: 'Blocked Users', value: stats.blockedCount, icon: 'block' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15"
          >
            <div className="flex items-center justify-between text-on-surface-variant mb-1.5">
              <span className="text-xs font-medium">{stat.label}</span>
              <span className="material-symbols-outlined text-[18px] text-primary">
                {stat.icon}
              </span>
            </div>
            <div className="text-2xl font-bold text-on-surface tabular-nums">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Access Menu */}
      <div className="bg-surface-container-lowest rounded-2xl divide-y divide-surface-container-low shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 overflow-hidden">
        {[
          {
            screen: 'edit-profile' as AppScreen,
            icon: 'manage_accounts',
            title: 'Edit Profile',
            subtitle: 'Update your display name, @username, bio, and avatar',
          },
          {
            screen: 'settings' as AppScreen,
            icon: 'tune',
            title: 'Account & Google Drive Settings',
            subtitle: 'Manage Google Drive backups, read receipts, and visibility',
          },
          {
            screen: 'blocked-users' as AppScreen,
            icon: 'person_off',
            title: `Blocked Users (${blocked.length})`,
            subtitle: 'Review or unblock people you restricted',
          },
          {
            screen: 'privacy-policy' as AppScreen,
            icon: 'shield',
            title: 'Privacy Policy',
            subtitle: 'How Gupshup protects and handles your data',
          },
          {
            screen: 'delete-account' as AppScreen,
            icon: 'delete_forever',
            title: 'Delete Account',
            subtitle: 'Permanently erase your account and message history',
            danger: true,
          },
        ].map((item) => (
          <button
            key={item.screen}
            type="button"
            onClick={() => onNavigate(item.screen)}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface-container-low/70 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.danger
                    ? 'bg-error-container text-error'
                    : 'bg-primary-fixed/60 text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              </div>
              <div>
                <div
                  className={`text-sm font-semibold ${
                    item.danger ? 'text-error' : 'text-on-surface'
                  }`}
                >
                  {item.title}
                </div>
                <div className="text-xs text-on-surface-variant">{item.subtitle}</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              chevron_right
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. EDIT PROFILE VIEW                                                       */
/* -------------------------------------------------------------------------- */
interface EditProfileViewProps {
  user: CurrentUserProfile;
  directoryHandles: string[];
  onSave: (updates: Partial<CurrentUserProfile>) => Promise<void>;
  onCancel: () => void;
}

export const EditProfileView: React.FC<EditProfileViewProps> = ({
  user,
  directoryHandles,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(user.avatarDataUrl);
  const [discoverable, setDiscoverable] = useState(user.discoverable);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const validation = validateUsername(username, directoryHandles, user.username);
  const canSave = name.trim().length > 0 && validation.status === 'available';

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const check = validateImageFileSize(file.size);
    if (!check.valid) {
      setErrorMsg(check.error ?? 'Image too large');
      return;
    }
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setAvatarDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || isSaving) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onSave({
        name: name.trim(),
        initials: getInitials(name),
        username: validation.normalized,
        bio: bio.trim(),
        avatarDataUrl,
        discoverable,
      });
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Unable to save your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Back to Profile"
          className="w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-center text-on-surface hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Edit Profile</h2>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Only your unique @username is shown in the public member directory.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 space-y-6"
      >
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar
            name={name || user.name}
            initials={getInitials(name || user.name)}
            imageUrl={avatarDataUrl}
            size="xl"
            showOnlineDot={false}
            bgClass="bg-primary-fixed-dim"
            textClass="text-primary"
          />
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="h-9 px-4 rounded-xl bg-primary-fixed text-primary text-xs font-semibold hover:bg-primary-fixed-dim transition-colors"
              >
                Upload New Photo
              </button>
              {avatarDataUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarDataUrl(undefined)}
                  className="h-9 px-3 rounded-xl bg-surface-container-low text-error text-xs font-semibold"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-on-surface-variant">JPG or PNG, up to 5 MB.</p>
            {errorMsg && <p className="text-xs text-error font-medium">{errorMsg}</p>}
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-1.5">
          <label htmlFor="edit-display-name" className="text-xs font-semibold text-on-surface">
            Display Name
          </label>
          <input
            id="edit-display-name"
            type="text"
            required
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/25"
          />
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <label htmlFor="edit-username" className="text-xs font-semibold text-on-surface">
            Username
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-sm font-semibold text-on-surface-variant">@</span>
            <input
              id="edit-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(normalizeUsernameInput(e.target.value))}
              className="w-full h-11 pl-8 pr-4 rounded-xl bg-surface-container-low text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/25"
            />
          </div>
          <p
            className={`text-xs font-medium ${
              validation.status === 'available' ? 'text-secondary' : 'text-error'
            }`}
          >
            {validation.message}
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="edit-bio" className="text-xs font-semibold text-on-surface">
              Bio
            </label>
            <span className="text-xs text-on-surface-variant tabular-nums">{bio.length}/120</span>
          </div>
          <textarea
            id="edit-bio"
            rows={3}
            maxLength={120}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-surface-container-low text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/25 resize-none"
          />
        </div>

        {/* Verified Email (Read Only) */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-on-surface">Verified Email</span>
          <div className="h-11 px-4 rounded-xl bg-surface-container-low/60 text-sm text-on-surface-variant flex items-center justify-between">
            <span>{user.email}</span>
            <span className="text-xs font-semibold text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] icon-filled">verified</span>
              Verified
            </span>
          </div>
        </div>

        {/* Discoverability Toggle */}
        <label className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-low cursor-pointer">
          <div>
            <div className="text-sm font-semibold text-on-surface">
              Discoverable in People Directory
            </div>
            <div className="text-xs text-on-surface-variant">
              Allow other Gupshup members to find you by name or @username
            </div>
          </div>
          <input
            type="checkbox"
            checked={discoverable}
            onChange={(e) => setDiscoverable(e.target.checked)}
            className="w-5 h-5 accent-[#4f46e5]"
          />
        </label>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 px-5 rounded-[14px] bg-surface-container-low hover:bg-surface-container text-on-surface text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave || isSaving}
            className="h-11 px-6 rounded-[14px] bg-primary-container hover:bg-primary disabled:opacity-45 text-on-primary text-sm font-semibold transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. SETTINGS VIEW                                                           */
/* -------------------------------------------------------------------------- */
interface SettingsViewProps {
  user: CurrentUserProfile;
  blockedCount: number;
  driveConnected: boolean;
  driveEmail: string | null;
  onNavigate: (screen: AppScreen) => void;
  onToggleSetting: (key: 'readReceipts' | 'onlineStatusVisible' | 'discoverable') => void;
  onConnectDrive: () => Promise<boolean>;
  onDisconnectDrive: () => Promise<void>;
  onRequestBackupAllChatsToDrive: () => void;
  onRequestSignOut: () => void;
  onAppInstalled?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  blockedCount,
  driveConnected,
  driveEmail,
  onNavigate,
  onToggleSetting,
  onConnectDrive,
  onDisconnectDrive,
  onRequestBackupAllChatsToDrive,
  onRequestSignOut,
  onAppInstalled,
}) => {
  const [driveBusy, setDriveBusy] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  const handleConnect = async () => {
    setDriveBusy(true);
    setDriveError(null);
    try {
      await onConnectDrive();
    } catch (err) {
      setDriveError(err instanceof Error ? err.message : 'Unable to connect Google Drive.');
    } finally {
      setDriveBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate('profile')}
          aria-label="Back to Profile"
          className="w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-center text-on-surface hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Settings</h2>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Manage privacy, Google Drive sync, and account safety
          </p>
        </div>
      </div>

      {/* Google Drive Integration Card */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">cloud_sync</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-on-surface">Google Drive Sync</h3>
              <p className="text-xs text-on-surface-variant">
                {driveConnected
                  ? `Connected as ${driveEmail || user.email}`
                  : 'Connect your Google account to browse Drive files and back up chats'}
              </p>
            </div>
          </div>

          {driveConnected ? (
            <button
              type="button"
              onClick={() => void onDisconnectDrive()}
              className="h-9 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold shrink-0"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              disabled={driveBusy}
              onClick={() => void handleConnect()}
              className="h-10 px-4 rounded-xl bg-primary-container hover:bg-primary disabled:opacity-60 text-on-primary text-xs font-semibold flex items-center gap-1.5 shrink-0"
            >
              {driveBusy && (
                <span className="material-symbols-outlined text-[15px] animate-spin">
                  progress_activity
                </span>
              )}
              <span>Connect Google Drive</span>
            </button>
          )}
        </div>

        {driveError && (
          <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs">
            {driveError}
          </div>
        )}

        <div className="pt-2 border-t border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-on-surface">Export Conversation Backup</div>
            <div className="text-xs text-on-surface-variant">
              Save a JSON snapshot of your Gupshup threads to your Google Drive
            </div>
          </div>
          <button
            type="button"
            onClick={onRequestBackupAllChatsToDrive}
            className="h-9 px-4 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">backup</span>
            <span>Back Up to Drive</span>
          </button>
        </div>
      </div>

      {/* Android & Mobile App Installation Card */}
      <PWAInstallControl variant="settings" onInstallAccepted={onAppInstalled} />

      {/* Privacy Toggles */}
      <div className="bg-surface-container-lowest rounded-3xl divide-y divide-surface-container-low shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 overflow-hidden">
        {[
          {
            key: 'onlineStatusVisible' as const,
            title: 'Show Online Status',
            subtitle: 'Let contacts see when you are active on Gupshup',
            checked: user.onlineStatusVisible,
          },
          {
            key: 'readReceipts' as const,
            title: 'Read Receipts',
            subtitle: 'Show double blue checkmarks when you read messages',
            checked: user.readReceipts,
          },
          {
            key: 'discoverable' as const,
            title: 'Public Directory Listing',
            subtitle: 'Appear in Discover and People Search results',
            checked: user.discoverable,
          },
        ].map((item) => (
          <label
            key={item.key}
            className="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-container-low/50"
          >
            <div>
              <div className="text-sm font-semibold text-on-surface">{item.title}</div>
              <div className="text-xs text-on-surface-variant">{item.subtitle}</div>
            </div>
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onToggleSetting(item.key)}
              className="w-5 h-5 accent-[#4f46e5]"
            />
          </label>
        ))}
      </div>

      {/* Links & Danger Zone */}
      <div className="bg-surface-container-lowest rounded-3xl divide-y divide-surface-container-low shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 overflow-hidden">
        <button
          type="button"
          onClick={() => onNavigate('blocked-users')}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface-container-low"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
              block
            </span>
            <span className="text-sm font-semibold text-on-surface">
              Blocked Users ({blockedCount})
            </span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            chevron_right
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('privacy-policy')}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface-container-low"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
              policy
            </span>
            <span className="text-sm font-semibold text-on-surface">Privacy Policy</span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            chevron_right
          </span>
        </button>

        <button
          type="button"
          onClick={onRequestSignOut}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface-container-low"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
              logout
            </span>
            <span className="text-sm font-semibold text-on-surface">Sign Out</span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            chevron_right
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('delete-account')}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-error-container/30"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-error">
              delete_forever
            </span>
            <span className="text-sm font-semibold text-error">Delete Account</span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-error">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. BLOCKED USERS VIEW                                                      */
/* -------------------------------------------------------------------------- */
interface BlockedUsersViewProps {
  blocked: BlockedEntry[];
  contactsById: Record<string, ContactUser>;
  onUnblock: (userId: string) => void;
  onBack: () => void;
}

export const BlockedUsersView: React.FC<BlockedUsersViewProps> = ({
  blocked,
  contactsById,
  onUnblock,
  onBack,
}) => {
  const [query, setQuery] = useState('');

  const rows = blocked
    .map((entry) => ({
      entry,
      contact: contactsById[entry.userId],
    }))
    .filter(({ contact }) => {
      if (!contact) return false;
      const q = query.trim().toLowerCase().replace(/^@/, '');
      if (!q) return true;
      return (
        contact.name.toLowerCase().includes(q) || contact.username.toLowerCase().includes(q)
      );
    });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Settings"
            className="w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-center text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              Blocked Users ({blocked.length})
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Blocked accounts cannot message you or see when you are online
            </p>
          </div>
        </div>
      </div>

      {blocked.length > 0 && (
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter blocked users..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container-lowest border border-outline-variant/25 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/25"
          />
        </div>
      )}

      {rows.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-10 text-center shadow-[0_1px_4px_rgba(11,28,48,0.04)]">
          <div className="w-14 h-14 rounded-2xl bg-secondary-container text-secondary flex items-center justify-center mx-auto mb-3.5">
            <span className="material-symbols-outlined text-[28px]">verified_user</span>
          </div>
          <h3 className="text-base font-semibold text-on-surface">
            {blocked.length === 0 ? 'No blocked users' : 'No matching blocked users'}
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">
            {blocked.length === 0
              ? "You haven't blocked anyone."
              : 'Try clearing the search filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl divide-y divide-surface-container-low shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 overflow-hidden">
          {rows.map(({ entry, contact }) => (
            <div
              key={entry.userId}
              className="p-4 flex items-center justify-between gap-3 hover:bg-surface-container-low/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  name={contact.name}
                  initials={contact.initials}
                  size="md"
                  showOnlineDot={false}
                  bgClass={contact.avatarBgClass}
                  textClass={contact.avatarTextClass}
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-on-surface truncate">
                    {contact.name}
                  </div>
                  <div className="text-xs text-on-surface-variant truncate">
                    @{contact.username} • Blocked on {entry.blockedOn}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onUnblock(entry.userId)}
                className="h-9 px-4 rounded-xl bg-primary-fixed hover:bg-primary-container text-primary hover:text-on-primary text-xs font-semibold shrink-0 transition-colors"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. PRIVACY POLICY VIEW                                                     */
/* -------------------------------------------------------------------------- */
interface PrivacyPolicyViewProps {
  onBack: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBack }) => {
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(PRIVACY_SECTIONS[0].id);

  const visibleSections = PRIVACY_SECTIONS.filter((sec) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return sec.title.toLowerCase().includes(q) || sec.body.toLowerCase().includes(q);
  });

  const scrollToSection = (id: string) => {
    setActiveId(id);
    const el = document.getElementById(`privacy-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5">
          <span>Settings</span>
          <span>›</span>
          <span>Legal &amp; Compliance</span>
          <span>›</span>
          <span className="text-on-surface font-semibold">Privacy Policy</span>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="h-9 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/25 text-xs font-semibold text-on-surface hover:bg-surface-container-low flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Settings</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15">
        <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
          Privacy Policy
        </h2>
        <p className="text-sm text-on-surface-variant mt-2 max-w-2xl">
          A straightforward, honest explanation of what information Gupshup collects, how it is
          used, and how your privacy is protected.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
        {/* Sticky TOC */}
        <aside className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 lg:sticky lg:top-20 space-y-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[17px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search policy sections..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-surface-container-low text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary-container/25"
            />
          </div>

          <nav className="space-y-1">
            {PRIVACY_SECTIONS.map((sec, idx) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between text-left transition-colors ${
                  activeId === sec.id
                    ? 'bg-primary-container text-on-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <span className="truncate">
                  {idx + 1}. {sec.title}
                </span>
                {activeId === sec.id && (
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Policy Cards */}
        <div className="space-y-4">
          {visibleSections.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center text-sm text-on-surface-variant">
              No policy sections matched &ldquo;{search}&rdquo;.
            </div>
          ) : (
            visibleSections.map((sec) => (
              <section
                key={sec.id}
                id={`privacy-${sec.id}`}
                onMouseEnter={() => setActiveId(sec.id)}
                className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 scroll-mt-24"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-primary-fixed text-primary text-xs font-bold tabular-nums">
                    {sec.number}
                  </span>
                  <h3 className="text-lg font-bold text-on-surface">{sec.title}</h3>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">{sec.body}</p>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 6. DELETE ACCOUNT VIEW                                                     */
/* -------------------------------------------------------------------------- */
interface DeleteAccountViewProps {
  user: CurrentUserProfile;
  onCancel: () => void;
  onAccountDeleted: () => void;
}

export const DeleteAccountView: React.FC<DeleteAccountViewProps> = ({
  user,
  onCancel,
  onAccountDeleted,
}) => {
  const [phrase, setPhrase] = useState('');
  const [phase, setPhase] = useState<'confirm' | 'processing' | 'done'>('confirm');
  const [stepIdx, setStepIdx] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  const canDelete = phrase === 'DELETE';

  const startPurge = () => {
    if (!canDelete) return;
    setPhase('processing');
    setStepIdx(1);
    let current = 1;
    timerRef.current = window.setInterval(() => {
      current += 1;
      if (current <= 3) {
        setStepIdx(current);
      } else {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        setPhase('done');
      }
    }, 550);
  };

  if (phase === 'processing') {
    const steps = [
      'Revoking active sessions & Google tokens',
      'Purging direct chats, photos, and voice notes',
      `Releasing @${user.username} handle`,
    ];
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-error-container text-error flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[32px] animate-spin">
            progress_activity
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Deleting your account...</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Please wait while we erase your Gupshup data.
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-5 text-left space-y-3 border border-outline-variant/20">
          {steps.map((label, idx) => {
            const done = stepIdx > idx;
            const active = stepIdx === idx;
            return (
              <div key={label} className="flex items-center gap-3 text-sm">
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    done
                      ? 'text-secondary icon-filled'
                      : active
                        ? 'text-primary animate-spin'
                        : 'text-outline'
                  }`}
                >
                  {done ? 'check_circle' : active ? 'progress_activity' : 'radio_button_unchecked'}
                </span>
                <span className={done ? 'text-on-surface font-medium' : 'text-on-surface-variant'}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-secondary-container text-secondary flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[32px] icon-filled">check_circle</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Account deleted</h2>
          <p className="text-sm text-on-surface-variant mt-1.5">
            Your Gupshup profile, @{user.username} handle, and message history have been
            permanently erased.
          </p>
        </div>
        <button
          type="button"
          onClick={onAccountDeleted}
          className="h-11 px-6 rounded-[14px] bg-primary-container text-on-primary text-sm font-semibold"
        >
          Back to Welcome
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
        <button type="button" onClick={onCancel} className="hover:text-on-surface">
          ← Settings
        </button>
        <span>/</span>
        <span>Danger Zone</span>
        <span>/</span>
        <span className="text-error font-semibold">Delete Account</span>
      </div>

      <div>
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[28px] text-error">gpp_maybe</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Delete Account
          </h2>
        </div>
        <p className="text-sm text-on-surface-variant mt-1">
          Permanently remove your account, messages, and profile data from Gupshup.
        </p>
      </div>

      {/* Warning Banner */}
      <div className="p-5 rounded-2xl bg-error-container/70 border border-error/20 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-error text-on-error flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[20px]">warning</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-error">Permanent Account Deletion</h3>
          <p className="text-xs sm:text-sm text-on-error-container mt-1 leading-relaxed">
            This action cannot be undone. Once confirmed, all your personal data, direct chats,
            and media records will be immediately erased.
          </p>
        </div>
      </div>

      {/* User Identity Summary */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            name={user.name}
            initials={user.initials}
            imageUrl={user.avatarDataUrl}
            size="md"
            isOnline={false}
            bgClass="bg-primary-fixed-dim"
            textClass="text-primary"
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-on-surface truncate">{user.name}</div>
            <div className="text-xs text-on-surface-variant truncate">
              @{user.username} • {user.email}
            </div>
          </div>
        </div>
        <span className="text-xs font-medium text-on-surface-variant hidden sm:inline">
          {user.joinedLabel}
        </span>
      </div>

      {/* 4 Categories Scheduled for Purge */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-on-surface">Data scheduled for purge</span>
          <span className="px-2 py-0.5 rounded-full bg-error-container text-error text-[10px] font-bold uppercase">
            4 Categories
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              icon: 'badge',
              title: 'Profile & Handle',
              desc: `Releases @${user.username} and wipes your bio and photo.`,
            },
            {
              icon: 'chat',
              title: 'Chat History & Messages',
              desc: 'Removes all 1-to-1 conversation threads and text logs.',
            },
            {
              icon: 'perm_media',
              title: 'Media, Files & Voice Notes',
              desc: 'Clears shared photos, Drive references, and voice clips.',
            },
            {
              icon: 'group_off',
              title: 'Contacts & Block Lists',
              desc: 'Clears saved searches, pins, and safety block entries.',
            },
          ].map((cat) => (
            <div
              key={cat.title}
              className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 space-y-1.5"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                <span className="material-symbols-outlined text-[16px] text-error">{cat.icon}</span>
                <span>{cat.title}</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">{cat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Phrase */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="delete-confirm-phrase" className="text-sm font-semibold text-on-surface">
            To verify, type <span className="text-error font-bold">DELETE</span> below:
          </label>
          <span className="px-2 py-0.5 rounded bg-surface-container-low text-[10px] font-bold text-on-surface-variant uppercase">
            Case Sensitive
          </span>
        </div>

        <div className="relative flex items-center">
          <input
            id="delete-confirm-phrase"
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full h-11 px-4 pr-10 rounded-xl bg-surface-container-low text-sm font-semibold text-on-surface outline-none focus:ring-2 focus:ring-error/30"
          />
          {canDelete && (
            <span className="material-symbols-outlined absolute right-3 text-secondary text-[20px] icon-filled">
              check_circle
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 px-5 rounded-[14px] bg-surface-container-low hover:bg-surface-container text-on-surface text-sm font-semibold"
        >
          Keep My Account (Cancel)
        </button>
        <button
          type="button"
          disabled={!canDelete}
          onClick={startPurge}
          className="h-11 px-6 rounded-[14px] bg-error hover:bg-[#9c1616] disabled:opacity-40 text-on-error text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">delete_forever</span>
          <span>Permanently Delete My Account</span>
        </button>
      </div>
    </div>
  );
};
