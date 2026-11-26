import type {
  BlockedEntry,
  ChatFilterTab,
  ChatMessage,
  ChatThread,
  ContactUser,
} from '../types/gupshup';

export interface UsernameValidationResult {
  normalized: string;
  status: 'too_short' | 'invalid_chars' | 'taken' | 'available';
  message: string;
}

const RESERVED_HANDLES = new Set(['aliraza', 'admin', 'ali', 'support', 'gupshup']);

export function normalizeUsernameInput(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 20);
}

export function validateUsername(
  raw: string,
  directoryHandles: string[],
  ownCurrentHandle?: string
): UsernameValidationResult {
  const normalized = raw.trim().toLowerCase();

  if (normalized.length < 3) {
    return {
      normalized,
      status: 'too_short',
      message: 'Must be at least 3 characters',
    };
  }

  if (!/^[a-z0-9._]{3,20}$/.test(normalized)) {
    return {
      normalized,
      status: 'invalid_chars',
      message: 'Lowercase letters, numbers, dot (.) and underscore (_) only',
    };
  }

  const lowerOwn = ownCurrentHandle?.trim().toLowerCase();
  const takenSet = new Set(
    directoryHandles.map((h) => h.toLowerCase()).filter((h) => h !== lowerOwn)
  );

  if ((RESERVED_HANDLES.has(normalized) && normalized !== lowerOwn) || takenSet.has(normalized)) {
    return {
      normalized,
      status: 'taken',
      message: 'That username is already taken. Try suggestions below.',
    };
  }

  return {
    normalized,
    status: 'available',
    message: `@${normalized} is available`,
  };
}

export function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'GU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function filterPeopleDirectory(people: ContactUser[], rawQuery: string): ContactUser[] {
  const q = rawQuery.trim().toLowerCase().replace(/^@/, '');
  if (!q) return people;
  return people.filter(
    (person) =>
      person.name.toLowerCase().includes(q) ||
      person.username.toLowerCase().includes(q) ||
      person.bio.toLowerCase().includes(q)
  );
}

export function filterChats(
  chats: ChatThread[],
  contactsById: Record<string, ContactUser>,
  messagesByChat: Record<string, ChatMessage[]>,
  rawQuery: string,
  tab: ChatFilterTab
): ChatThread[] {
  const q = rawQuery.trim().toLowerCase();

  return [...chats]
    .filter((chat) => {
      if (tab === 'unread' && chat.unreadCount <= 0) return false;
      if (tab === 'pinned' && !chat.pinned) return false;
      if (!q) return true;

      const contact = contactsById[chat.contactId];
      const nameMatch = contact?.name.toLowerCase().includes(q) ?? false;
      const handleMatch = contact?.username.toLowerCase().includes(q.replace(/^@/, '')) ?? false;
      const msgs = messagesByChat[chat.id] ?? [];
      const msgMatch = msgs.some(
        (m) =>
          (m.text && m.text.toLowerCase().includes(q)) ||
          (m.photoName && m.photoName.toLowerCase().includes(q)) ||
          (m.driveFile?.name.toLowerCase().includes(q) ?? false)
      );
      return nameMatch || handleMatch || msgMatch;
    })
    .sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }
      return b.lastActivityOrder - a.lastActivityOrder;
    });
}

export function computeTotalUnread(chats: ChatThread[], blocked: BlockedEntry[]): number {
  const blockedIds = new Set(blocked.map((b) => b.userId));
  return chats.reduce((sum, chat) => {
    if (blockedIds.has(chat.contactId)) return sum;
    return sum + Math.max(0, chat.unreadCount);
  }, 0);
}

export interface ProfileDerivedStats {
  activeThreads: number;
  totalMessages: number;
  sharedMediaCount: number;
  blockedCount: number;
}

export function computeProfileStats(
  chats: ChatThread[],
  messagesByChat: Record<string, ChatMessage[]>,
  blocked: BlockedEntry[]
): ProfileDerivedStats {
  let totalMessages = 0;
  let sharedMediaCount = 0;

  for (const chat of chats) {
    const list = messagesByChat[chat.id] ?? [];
    totalMessages += list.length;
    for (const msg of list) {
      if (msg.kind === 'photo' || msg.kind === 'voice' || msg.kind === 'drive_file') {
        sharedMediaCount += 1;
      }
    }
  }

  return {
    activeThreads: chats.length,
    totalMessages,
    sharedMediaCount,
    blockedCount: blocked.length,
  };
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFileSize(
  sizeBytes: number,
  maxBytes: number = MAX_IMAGE_BYTES
): { valid: boolean; error?: string } {
  if (sizeBytes <= 0) {
    return { valid: false, error: 'Selected file appears to be empty.' };
  }
  if (sizeBytes > maxBytes) {
    return { valid: false, error: 'Image is too large. Max size is 5 MB.' };
  }
  return { valid: true };
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function getLastMessagePreview(messages: ChatMessage[], isTyping?: boolean): string {
  if (isTyping) return 'typing...';
  if (!messages || messages.length === 0) return 'Say hello on Gupshup';
  const last = messages[messages.length - 1];
  if (last.kind === 'voice') {
    return `Voice message (${formatDuration(last.voiceDurationSec ?? 0)})`;
  }
  if (last.kind === 'photo') {
    return last.text ? `Photo: ${last.text}` : 'Photo';
  }
  if (last.kind === 'drive_file') {
    return `Drive file: ${last.driveFile?.name ?? 'Attachment'}`;
  }
  return last.text ?? '';
}

export function blockUserInList(
  blocked: BlockedEntry[],
  userId: string,
  blockedOnLabel: string
): BlockedEntry[] {
  if (blocked.some((entry) => entry.userId === userId)) return blocked;
  return [{ userId, blockedOn: blockedOnLabel }, ...blocked];
}

export function unblockUserInList(blocked: BlockedEntry[], userId: string): BlockedEntry[] {
  return blocked.filter((entry) => entry.userId !== userId);
}

export function toggleMessageStarInRecord(
  messagesByChat: Record<string, ChatMessage[]>,
  chatId: string,
  messageId: string
): Record<string, ChatMessage[]> {
  const list = messagesByChat[chatId];
  if (!list) return messagesByChat;
  return {
    ...messagesByChat,
    [chatId]: list.map((m) => (m.id === messageId ? { ...m, starred: !m.starred } : m)),
  };
}

export function deleteMessageInRecord(
  messagesByChat: Record<string, ChatMessage[]>,
  chatId: string,
  messageId: string
): Record<string, ChatMessage[]> {
  const list = messagesByChat[chatId];
  if (!list) return messagesByChat;
  return {
    ...messagesByChat,
    [chatId]: list.filter((m) => m.id !== messageId),
  };
}
