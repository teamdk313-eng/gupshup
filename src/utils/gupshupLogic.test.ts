import assert from 'node:assert/strict';
import test from 'node:test';
import type { BlockedEntry, ChatMessage, ChatThread, ContactUser } from '../types/gupshup.ts';
import {
  blockUserInList,
  computeProfileStats,
  computeTotalUnread,
  deleteMessageInRecord,
  filterChats,
  filterPeopleDirectory,
  formatDuration,
  formatFileSize,
  getInitials,
  getLastMessagePreview,
  normalizeUsernameInput,
  toggleMessageStarInRecord,
  unblockUserInList,
  validateImageFileSize,
  validateUsername,
} from './gupshupLogic.ts';

test('normalizeUsernameInput enforces lowercase and allowed characters', () => {
  assert.equal(normalizeUsernameInput('Ali_Raza!@ 99'), 'ali_raza99');
  assert.equal(normalizeUsernameInput('Sara.Malik.123456789012345'), 'sara.malik.123456789');
});

test('validateUsername detects too short, taken, and available handles', () => {
  const taken = ['saramalik', 'bilal.ahmed'];
  assert.equal(validateUsername('ab', taken).status, 'too_short');
  assert.equal(validateUsername('aliraza', taken).status, 'taken');
  assert.equal(validateUsername('saramalik', taken).status, 'taken');
  assert.equal(validateUsername('ali_raza', taken).status, 'available');
  // Allowing user's own handle during Edit Profile
  assert.equal(validateUsername('saramalik', taken, 'saramalik').status, 'available');
});

test('getInitials extracts clean 1-2 character initials', () => {
  assert.equal(getInitials('Ali Raza'), 'AR');
  assert.equal(getInitials('Sara'), 'SA');
  assert.equal(getInitials('  '), 'GU');
});

test('filterPeopleDirectory searches across name, handle, and bio', () => {
  const people: ContactUser[] = [
    {
      id: 'u1',
      name: 'Sara Malik',
      username: 'saramalik',
      initials: 'SM',
      avatarBgClass: 'bg-primary-fixed',
      avatarTextClass: 'text-on-primary-fixed',
      bio: 'Designer & coffee lover',
      joinedLabel: 'Joined Oct 2026',
      joinedAgo: 'Active now',
      localTime: '3:42 PM',
      isOnline: true,
    },
    {
      id: 'u2',
      name: 'Bilal Ahmed',
      username: 'bilal.ahmed',
      initials: 'BA',
      avatarBgClass: 'bg-secondary-container',
      avatarTextClass: 'text-on-secondary-container',
      bio: 'Distributed systems engineer',
      joinedLabel: 'Joined yesterday',
      joinedAgo: 'Joined yesterday',
      localTime: '3:42 PM',
      isOnline: true,
    },
  ];

  assert.equal(filterPeopleDirectory(people, '@sara').length, 1);
  assert.equal(filterPeopleDirectory(people, 'distributed').length, 1);
  assert.equal(filterPeopleDirectory(people, 'sa123').length, 0);
});

test('filterChats sorts pinned first and filters by unread, pinned, and search query', () => {
  const contacts: Record<string, ContactUser> = {
    u1: {
      id: 'u1',
      name: 'Sara Malik',
      username: 'saramalik',
      initials: 'SM',
      avatarBgClass: '',
      avatarTextClass: '',
      bio: '',
      joinedLabel: '',
      joinedAgo: '',
      localTime: '',
      isOnline: true,
    },
    u2: {
      id: 'u2',
      name: 'Bilal Ahmed',
      username: 'bilal.ahmed',
      initials: 'BA',
      avatarBgClass: '',
      avatarTextClass: '',
      bio: '',
      joinedLabel: '',
      joinedAgo: '',
      localTime: '',
      isOnline: true,
    },
  };

  const chats: ChatThread[] = [
    { id: 'c1', contactId: 'u1', unreadCount: 2, pinned: false, lastActivityLabel: '2:41 PM', lastActivityOrder: 100 },
    { id: 'c2', contactId: 'u2', unreadCount: 0, pinned: true, lastActivityLabel: '1:15 PM', lastActivityOrder: 80 },
  ];

  const messagesByChat: Record<string, ChatMessage[]> = {
    c1: [{ id: 'm1', chatId: 'c1', senderId: 'u1', kind: 'text', text: 'Roadmap ready', timestamp: '2:41 PM', createdAtMs: 1, status: 'read' }],
    c2: [{ id: 'm2', chatId: 'c2', senderId: 'u2', kind: 'text', text: 'See you soon', timestamp: '1:15 PM', createdAtMs: 1, status: 'read' }],
  };

  const all = filterChats(chats, contacts, messagesByChat, '', 'all');
  assert.equal(all[0].id, 'c2'); // Pinned appears first
  assert.equal(filterChats(chats, contacts, messagesByChat, '', 'unread').map((c) => c.id).join(','), 'c1');
  assert.equal(filterChats(chats, contacts, messagesByChat, 'roadmap', 'all').map((c) => c.id).join(','), 'c1');
});

test('computeTotalUnread ignores blocked contacts and computeProfileStats counts media accurately', () => {
  const chats: ChatThread[] = [
    { id: 'c1', contactId: 'u1', unreadCount: 2, lastActivityLabel: 'Now', lastActivityOrder: 10 },
    { id: 'c2', contactId: 'u2', unreadCount: 3, lastActivityLabel: '1h', lastActivityOrder: 5 },
  ];
  const blocked: BlockedEntry[] = [{ userId: 'u2', blockedOn: 'Oct 14, 2026' }];
  assert.equal(computeTotalUnread(chats, blocked), 2);

  const messages: Record<string, ChatMessage[]> = {
    c1: [
      { id: 'm1', chatId: 'c1', senderId: 'u1', kind: 'text', text: 'Hi', timestamp: '10:00 AM', createdAtMs: 1, status: 'read' },
      { id: 'm2', chatId: 'c1', senderId: 'me', kind: 'photo', photoUrl: '/a.jpg', timestamp: '10:01 AM', createdAtMs: 2, status: 'read' },
    ],
    c2: [
      { id: 'm3', chatId: 'c2', senderId: 'u2', kind: 'voice', voiceDurationSec: 14, timestamp: '10:02 AM', createdAtMs: 3, status: 'delivered' },
    ],
  };

  const stats = computeProfileStats(chats, messages, blocked);
  assert.deepEqual(stats, {
    activeThreads: 2,
    totalMessages: 3,
    sharedMediaCount: 2,
    blockedCount: 1,
  });
});

test('validateImageFileSize, formatDuration, formatFileSize, and message state transitions work deterministically', () => {
  assert.equal(validateImageFileSize(3.8 * 1024 * 1024).valid, true);
  assert.equal(validateImageFileSize(5.5 * 1024 * 1024).valid, false);
  assert.equal(formatDuration(9), '0:09');
  assert.equal(formatDuration(74), '1:14');
  assert.equal(formatFileSize(3.2 * 1024 * 1024), '3.2 MB');
  assert.equal(formatFileSize(420 * 1024), '420 KB');

  const blocked = blockUserInList([], 'u3', 'Nov 25, 2026');
  assert.equal(blocked.length, 1);
  assert.equal(unblockUserInList(blocked, 'u3').length, 0);

  const record: Record<string, ChatMessage[]> = {
    c1: [
      { id: 'm1', chatId: 'c1', senderId: 'u1', kind: 'voice', voiceDurationSec: 23, timestamp: '10:17 AM', createdAtMs: 1, status: 'read', starred: false },
    ],
  };
  assert.equal(getLastMessagePreview(record.c1), 'Voice message (0:23)');
  const starred = toggleMessageStarInRecord(record, 'c1', 'm1');
  assert.equal(starred.c1[0].starred, true);
  const deleted = deleteMessageInRecord(starred, 'c1', 'm1');
  assert.equal(deleted.c1.length, 0);
});
