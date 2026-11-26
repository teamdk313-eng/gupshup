export type AppScreen =
  | 'welcome'
  | 'onboarding'
  | 'discover'
  | 'search-people'
  | 'chats'
  | 'chat'
  | 'contact-info'
  | 'profile'
  | 'edit-profile'
  | 'settings'
  | 'blocked-users'
  | 'privacy-policy'
  | 'delete-account';

export type ChatFilterTab = 'all' | 'unread' | 'pinned';

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export type MessageKind = 'text' | 'photo' | 'voice' | 'drive_file';

export interface DriveAttachmentMeta {
  fileId: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  webViewLink?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string; // 'me' or contact.id
  kind: MessageKind;
  text?: string;
  photoUrl?: string;
  photoName?: string;
  photoSize?: string;
  photoDimensions?: string;
  voiceDurationSec?: number;
  voiceWaveform?: number[];
  voiceAudioUrl?: string;
  driveFile?: DriveAttachmentMeta;
  replyToId?: string;
  replyToSnippet?: string;
  replyToSenderName?: string;
  starred?: boolean;
  timestamp: string;
  createdAtMs: number;
  status: MessageStatus;
}

export interface ContactUser {
  id: string;
  name: string;
  username: string;
  initials: string;
  avatarBgClass: string;
  avatarTextClass: string;
  avatarUrl?: string;
  bio: string;
  joinedLabel: string;
  joinedAgo: string;
  localTime: string;
  isOnline: boolean;
  lastSeenAt?: string | null;
  isNew?: boolean;
  verified?: boolean;
  mutualFriends?: number;
  roleTag?: string;
}

export interface ChatThread {
  id: string;
  contactId: string;
  unreadCount: number;
  pinned?: boolean;
  isTyping?: boolean;
  activityLabel?: string;
  lastActivityLabel: string;
  lastActivityOrder: number;
}

export interface CurrentUserProfile {
  id: 'me';
  name: string;
  username: string;
  email: string;
  bio: string;
  initials: string;
  avatarDataUrl?: string;
  joinedLabel: string;
  discoverable: boolean;
  readReceipts: boolean;
  onlineStatusVisible: boolean;
  authMode: 'google' | 'demo';
}

export interface BlockedEntry {
  userId: string;
  blockedOn: string;
}

export interface ReportRecord {
  id: string;
  targetUserId: string;
  reason: string;
  details: string;
  blockedAlso: boolean;
  submittedAt: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface ThreadInsightResult {
  summary: string;
  keyPoints: string[];
  suggestedReplies: string[];
  answerToQuery?: string;
}
