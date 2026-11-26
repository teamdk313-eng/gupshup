import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AppShell } from './components/AppShell';
import { AttachmentModal } from './components/AttachmentModal';
import { ChatsAndThreadView } from './components/ChatsAndThreadView';
import { ConfirmModal } from './components/ConfirmModal';
import { ContactInfoView } from './components/ContactInfoView';
import { DiscoverView } from './components/DiscoverView';
import { ImageViewerModal } from './components/ImageViewerModal';
import { OnboardingScreen } from './components/OnboardingScreen';
import {
  BlockedUsersView,
  DeleteAccountView,
  EditProfileView,
  MyProfileView,
  PrivacyPolicyView,
  SettingsView,
} from './components/ProfileViews';
import { ReportUserModal } from './components/ReportUserModal';
import { SearchPeopleView } from './components/SearchPeopleView';
import { WelcomeScreen } from './components/WelcomeScreen';
import {
  DEFAULT_USER_PROFILE,
  INITIAL_BLOCKED,
  INITIAL_CHATS,
  INITIAL_CONTACTS,
  INITIAL_MESSAGES_BY_CHAT,
  INITIAL_RECENT_SEARCHES,
} from './data/seedData';
import { supabase } from './lib/supabase';
import {
  getDriveConnectionState,
  signInWithGoogleSupabase,
  signOutSupabase,
  syncDriveTokenFromSession,
  uploadFileToDrive,
} from './services/googleDrive';
import type {
  AppScreen,
  BlockedEntry,
  ChatMessage,
  ChatThread,
  ContactUser,
  CurrentUserProfile,
  DriveAttachmentMeta,
  ReportRecord,
} from './types/gupshup';
import {
  extractSafeProfileFromMetadata,
  formatSupabaseAuthError,
  isProtectedScreen,
  parseAuthCallbackFromUrl,
  resolveRouteAccess,
} from './utils/authHelpers';
import {
  blockUserInList,
  computeTotalUnread,
  deleteMessageInRecord,
  getInitials,
  toggleMessageStarInRecord,
  unblockUserInList,
} from './utils/gupshupLogic';

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'primary' | 'danger';
  icon: string;
  busy?: boolean;
  action: () => Promise<void> | void;
}

interface ToastState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

function getCurrentTimeLabel(): string {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const VALID_APP_SCREENS: AppScreen[] = [
  'discover',
  'search-people',
  'chats',
  'chat',
  'contact-info',
  'profile',
  'edit-profile',
  'settings',
  'blocked-users',
  'privacy-policy',
  'delete-account',
];

function parseRequestedScreenFromUrl(): {
  requested: AppScreen | null;
  isAutostartDemo: boolean;
} {
  if (typeof window === 'undefined') {
    return { requested: null, isAutostartDemo: false };
  }
  const params = new URLSearchParams(window.location.search);
  const isAutostartDemo = params.get('autostart') === '1';
  const queryScreen = params.get('screen') as AppScreen | null;
  const pathSlug = window.location.pathname.replace(/^\/+|\/+$/g, '') as AppScreen;

  const candidate =
    queryScreen && VALID_APP_SCREENS.includes(queryScreen)
      ? queryScreen
      : VALID_APP_SCREENS.includes(pathSlug)
        ? pathSlug
        : null;

  return {
    requested: candidate,
    isAutostartDemo,
  };
}

function resolveInitialScreen(): AppScreen {
  const { requested, isAutostartDemo } = parseRequestedScreenFromUrl();
  if (isAutostartDemo) {
    return requested ?? 'discover';
  }
  if (requested === 'privacy-policy') {
    return 'privacy-policy';
  }
  return 'welcome';
}

export default function App() {
  const initialUrlState = useMemo(() => parseRequestedScreenFromUrl(), []);
  const [screen, setScreen] = useState<AppScreen>(resolveInitialScreen);
  const [privacyBackTarget, setPrivacyBackTarget] = useState<AppScreen>('settings');
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [isDemoPreview, setIsDemoPreview] = useState<boolean>(initialUrlState.isAutostartDemo);
  const [authResolving, setAuthResolving] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !supabase) return false;
    const cb = parseAuthCallbackFromUrl(window.location.search, window.location.hash);
    return cb.hasCallbackParams || window.location.pathname === '/auth/callback';
  });
  const [authError, setAuthError] = useState<string | null>(null);

  const [user, setUser] = useState<CurrentUserProfile>(() => ({ ...DEFAULT_USER_PROFILE }));
  const [contacts] = useState<ContactUser[]>(() => [...INITIAL_CONTACTS]);
  const [chats, setChats] = useState<ChatThread[]>(() => [...INITIAL_CHATS]);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, ChatMessage[]>>(() => ({
    ...INITIAL_MESSAGES_BY_CHAT,
  }));
  const [blocked, setBlocked] = useState<BlockedEntry[]>(() => [...INITIAL_BLOCKED]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => [
    ...INITIAL_RECENT_SEARCHES,
  ]);
  const [reports, setReports] = useState<ReportRecord[]>([]);

  const [activeChatId, setActiveChatId] = useState<string>('chat-sara');
  const [selectedContactId, setSelectedContactId] = useState<string>('sara');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);

  // Modals & Drawers
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [viewerMessage, setViewerMessage] = useState<ChatMessage | null>(null);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  // Google Drive connection state mirror
  const [driveState, setDriveState] = useState(() => getDriveConnectionState());

  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (message: string, actionLabel?: string, onAction?: () => void) => {
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
      setToast({ message, actionLabel, onAction });
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 4200);
    },
    []
  );

  const contactsById = useMemo(() => {
    const map: Record<string, ContactUser> = {};
    for (const c of contacts) map[c.id] = c;
    return map;
  }, [contacts]);

  const directoryHandles = useMemo(() => contacts.map((c) => c.username), [contacts]);
  const unreadTotal = useMemo(() => computeTotalUnread(chats, blocked), [chats, blocked]);

  const refreshDriveState = useCallback(() => {
    setDriveState(getDriveConnectionState());
  }, []);

  const applySupabaseSession = useCallback(
    (session: Session | null, options?: { fromCallback?: boolean }) => {
      setSupabaseSession(session);
      syncDriveTokenFromSession(session);
      refreshDriveState();

      if (!session) {
        return;
      }

      setIsDemoPreview(false);
      setAuthError(null);

      const profile = extractSafeProfileFromMetadata({
        email: session.user.email,
        metadata: session.user.user_metadata as Record<string, unknown> | undefined,
      });

      const handleKey = `gupshup_username_${session.user.id}`;
      let savedHandle: string | null = null;
      try {
        savedHandle = window.localStorage.getItem(handleKey);
      } catch {
        savedHandle = null;
      }

      setUser((prev) => ({
        ...prev,
        name: profile.name,
        initials: getInitials(profile.name),
        email: profile.email,
        username: savedHandle || prev.username,
        avatarDataUrl: profile.avatarUrl ?? prev.avatarDataUrl,
        authMode: 'google',
      }));

      setScreen((prevScreen) => {
        if (options?.fromCallback) {
          return savedHandle ? 'discover' : 'onboarding';
        }
        if (prevScreen === 'welcome') {
          if (initialUrlState.requested && isProtectedScreen(initialUrlState.requested)) {
            return initialUrlState.requested;
          }
          return savedHandle ? 'discover' : 'discover';
        }
        return prevScreen;
      });
    },
    [initialUrlState.requested, refreshDriveState]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cb = parseAuthCallbackFromUrl(window.location.search, window.location.hash);
    const isCallbackPath = window.location.pathname === '/auth/callback';

    if (cb.error || cb.errorDescription) {
      setAuthError(
        formatSupabaseAuthError(cb.errorDescription || cb.error, cb.errorCode || cb.error)
      );
      setAuthResolving(false);
      setScreen('welcome');
      window.history.replaceState({}, '', '/');
      return;
    }

    if (!supabase) {
      setAuthResolving(false);
      if (isCallbackPath) {
        setAuthError(
          'Supabase Auth is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
        );
        window.history.replaceState({}, '', '/');
      }
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setAuthError(formatSupabaseAuthError(error.message, error.code));
          setScreen('welcome');
        } else if (data.session) {
          applySupabaseSession(data.session, {
            fromCallback: isCallbackPath || cb.hasCallbackParams,
          });
        } else {
          setSupabaseSession(null);
          syncDriveTokenFromSession(null);
          refreshDriveState();
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : null;
        setAuthError(formatSupabaseAuthError(msg));
      })
      .finally(() => {
        if (!active) return;
        setAuthResolving(false);
        if (isCallbackPath || cb.hasCallbackParams) {
          window.history.replaceState({}, '', '/');
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'SIGNED_OUT') {
        setSupabaseSession(null);
        setIsDemoPreview(false);
        syncDriveTokenFromSession(null);
        refreshDriveState();
        setUser({ ...DEFAULT_USER_PROFILE });
        setScreen('welcome');
        return;
      }

      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        applySupabaseSession(session, {
          fromCallback: event === 'SIGNED_IN' && (isCallbackPath || cb.hasCallbackParams),
        });
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [applySupabaseSession, refreshDriveState]);

  /* --------------------------- Auth & Navigation --------------------------- */
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    await signInWithGoogleSupabase();
  };

  const handleDemoSignIn = () => {
    setAuthError(null);
    setIsDemoPreview(true);
    setUser((prev) => ({ ...prev, authMode: 'demo' }));
    setScreen('onboarding');
  };

  const handleCompleteOnboarding = (chosenUsername: string) => {
    if (supabaseSession?.user.id) {
      try {
        window.localStorage.setItem(
          `gupshup_username_${supabaseSession.user.id}`,
          chosenUsername
        );
      } catch {
        // Ignore storage errors
      }
    }
    setUser((prev) => ({ ...prev, username: chosenUsername }));
    setScreen('discover');
    showToast(`Welcome to Gupshup, @${chosenUsername}!`);
  };

  const handleConnectDrive = async (): Promise<boolean> => {
    await signInWithGoogleSupabase();
    return false;
  };

  const handleDisconnectDrive = async () => {
    await signOutSupabase();
    setSupabaseSession(null);
    setIsDemoPreview(false);
    refreshDriveState();
    setScreen('welcome');
    showToast('Signed out from Google & Supabase');
  };

  const navigateTo = (next: AppScreen) => {
    const guarded = resolveRouteAccess(next, Boolean(supabaseSession), isDemoPreview);
    if (guarded === 'privacy-policy') {
      setPrivacyBackTarget(screen === 'welcome' || screen === 'onboarding' ? screen : 'settings');
    }
    setScreen(guarded);
  };

  /* ---------------------------- Chat Management ---------------------------- */
  const ensureThreadForContact = (contactId: string): string => {
    const existing = chats.find((c) => c.contactId === contactId);
    if (existing) return existing.id;

    const newId = `chat-${contactId}`;
    const maxOrder = chats.reduce((max, c) => Math.max(max, c.lastActivityOrder), 0);
    const newThread: ChatThread = {
      id: newId,
      contactId,
      unreadCount: 0,
      pinned: false,
      lastActivityLabel: 'Just now',
      lastActivityOrder: maxOrder + 10,
    };
    setChats((prev) => [newThread, ...prev]);
    setMessagesByChat((prev) => ({ ...prev, [newId]: prev[newId] ?? [] }));
    return newId;
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setReplyTarget(null);
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c)));
    setScreen('chat');
  };

  const handleStartChatWithContact = (contactId: string) => {
    const threadId = ensureThreadForContact(contactId);
    handleSelectChat(threadId);
  };

  const handleOpenContactInfo = (contactId: string) => {
    setSelectedContactId(contactId);
    setScreen('contact-info');
  };

  const appendMessage = (chatId: string, msg: ChatMessage) => {
    setMessagesByChat((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] ?? []), msg],
    }));
    const maxOrder = chats.reduce((max, c) => Math.max(max, c.lastActivityOrder), 0);
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              unreadCount: 0,
              lastActivityLabel: msg.timestamp,
              lastActivityOrder: maxOrder + 10,
            }
          : c
      )
    );
  };

  const buildReplyFields = () => {
    if (!replyTarget) return {};
    const senderName =
      replyTarget.senderId === 'me'
        ? 'You'
        : contactsById[replyTarget.senderId]?.name ?? 'Contact';
    const snippet =
      replyTarget.text ||
      replyTarget.photoName ||
      replyTarget.driveFile?.name ||
      'Voice message';
    return {
      replyToId: replyTarget.id,
      replyToSenderName: senderName,
      replyToSnippet: snippet,
    };
  };

  const handleSendText = (chatId: string, text: string, simulateFailure = false) => {
    const now = Date.now();
    const msg: ChatMessage = {
      id: `m-${now}`,
      chatId,
      senderId: 'me',
      kind: 'text',
      text,
      timestamp: getCurrentTimeLabel(),
      createdAtMs: now,
      status: simulateFailure ? 'failed' : user.readReceipts ? 'delivered' : 'sent',
      ...buildReplyFields(),
    };
    appendMessage(chatId, msg);
    setReplyTarget(null);
  };

  const handleRetryFailedMessage = (chatId: string, messageId: string) => {
    setMessagesByChat((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] ?? []).map((m) =>
        m.id === messageId ? { ...m, status: 'delivered' } : m
      ),
    }));
    showToast('Message delivered');
  };

  const handleSendPhoto = (payload: {
    photoUrl: string;
    photoName: string;
    photoSize: string;
    photoDimensions?: string;
    caption: string;
  }) => {
    if (!activeChatId) return;
    const now = Date.now();
    const msg: ChatMessage = {
      id: `m-photo-${now}`,
      chatId: activeChatId,
      senderId: 'me',
      kind: 'photo',
      photoUrl: payload.photoUrl,
      photoName: payload.photoName,
      photoSize: payload.photoSize,
      photoDimensions: payload.photoDimensions,
      text: payload.caption || undefined,
      timestamp: getCurrentTimeLabel(),
      createdAtMs: now,
      status: 'delivered',
      ...buildReplyFields(),
    };
    appendMessage(activeChatId, msg);
    setReplyTarget(null);
  };

  const handleSendDriveFile = (payload: {
    driveFile: DriveAttachmentMeta;
    caption: string;
  }) => {
    if (!activeChatId) return;
    const now = Date.now();
    const msg: ChatMessage = {
      id: `m-drive-${now}`,
      chatId: activeChatId,
      senderId: 'me',
      kind: 'drive_file',
      driveFile: payload.driveFile,
      text: payload.caption || undefined,
      timestamp: getCurrentTimeLabel(),
      createdAtMs: now,
      status: 'delivered',
      ...buildReplyFields(),
    };
    appendMessage(activeChatId, msg);
    setReplyTarget(null);
  };

  const handleSendVoice = (
    chatId: string,
    payload: { durationSec: number; waveform: number[]; audioUrl?: string }
  ) => {
    const now = Date.now();
    const msg: ChatMessage = {
      id: `m-voice-${now}`,
      chatId,
      senderId: 'me',
      kind: 'voice',
      voiceDurationSec: payload.durationSec,
      voiceWaveform: payload.waveform,
      voiceAudioUrl: payload.audioUrl,
      timestamp: getCurrentTimeLabel(),
      createdAtMs: now,
      status: 'delivered',
      ...buildReplyFields(),
    };
    appendMessage(chatId, msg);
    setReplyTarget(null);
  };

  const handleTogglePinChat = (chatId: string) => {
    const target = chats.find((c) => c.id === chatId);
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, pinned: !c.pinned } : c)));
    showToast(target?.pinned ? 'Chat unpinned' : 'Chat pinned to top');
  };

  /* --------------------------- Safety & Actions ---------------------------- */
  const handleToggleBlockUser = (contactId: string) => {
    const contact = contactsById[contactId];
    const currentlyBlocked = blocked.some((b) => b.userId === contactId);
    if (currentlyBlocked) {
      setBlocked((prev) => unblockUserInList(prev, contactId));
      showToast(`Unblocked ${contact?.name ?? 'user'}`);
    } else {
      const todayLabel = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
      setBlocked((prev) => blockUserInList(prev, contactId, todayLabel));
      showToast(`Blocked ${contact?.name ?? 'user'}`);
    }
  };

  const handleUnblockWithUndo = (userId: string) => {
    const existing = blocked.find((b) => b.userId === userId);
    const contact = contactsById[userId];
    setBlocked((prev) => unblockUserInList(prev, userId));
    showToast(`Unblocked ${contact?.name ?? 'user'}`, 'Undo', () => {
      if (existing) {
        setBlocked((prev) => blockUserInList(prev, existing.userId, existing.blockedOn));
      }
    });
  };

  const handleSubmitReport = (payload: {
    targetUserId: string;
    reason: string;
    details: string;
    blockAlso: boolean;
  }) => {
    const record: ReportRecord = {
      id: `rep-${Date.now()}`,
      targetUserId: payload.targetUserId,
      reason: payload.reason,
      details: payload.details,
      blockedAlso: payload.blockAlso,
      submittedAt: new Date().toISOString(),
    };
    setReports((prev) => [record, ...prev]);
    if (payload.blockAlso) {
      const todayLabel = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
      setBlocked((prev) => blockUserInList(prev, payload.targetUserId, todayLabel));
    }
  };

  /* ------------------------ Image Viewer & Drive Saves --------------------- */
  const handleToggleStar = (msg: ChatMessage) => {
    setMessagesByChat((prev) => toggleMessageStarInRecord(prev, msg.chatId, msg.id));
    setViewerMessage((prev) => (prev && prev.id === msg.id ? { ...prev, starred: !prev.starred } : prev));
    showToast(msg.starred ? 'Removed star' : 'Message starred');
  };

  const handleForwardPhoto = (msg: ChatMessage, targetContactId: string) => {
    const targetThreadId = ensureThreadForContact(targetContactId);
    const now = Date.now();
    const forwarded: ChatMessage = {
      id: `m-fwd-${now}`,
      chatId: targetThreadId,
      senderId: 'me',
      kind: 'photo',
      photoUrl: msg.photoUrl,
      photoName: msg.photoName,
      photoSize: msg.photoSize,
      photoDimensions: msg.photoDimensions,
      text: msg.text,
      timestamp: getCurrentTimeLabel(),
      createdAtMs: now,
      status: 'delivered',
    };
    appendMessage(targetThreadId, forwarded);
    const contactName = contactsById[targetContactId]?.name ?? 'contact';
    showToast(`Forwarded photo to ${contactName}`);
  };

  const handleRequestDeleteMessage = (msg: ChatMessage) => {
    setConfirmState({
      open: true,
      title: 'Delete this photo?',
      description: 'This will remove the photo from your conversation stream.',
      confirmLabel: 'Delete Photo',
      variant: 'danger',
      icon: 'delete',
      action: () => {
        setMessagesByChat((prev) => deleteMessageInRecord(prev, msg.chatId, msg.id));
        if (viewerMessage?.id === msg.id) setViewerMessage(null);
        showToast('Photo removed from conversation');
      },
    });
  };

  const executeDriveUploadWithConsent = async (uploadFn: () => Promise<string>) => {
    if (!getDriveConnectionState().connected) {
      const connected = await handleConnectDrive();
      if (!connected) {
        throw new Error('Google Drive connection is required before saving files.');
      }
    }
    const uploadedName = await uploadFn();
    showToast(`Saved "${uploadedName}" to Google Drive`);
  };

  const handleRequestSavePhotoToDrive = (msg: ChatMessage) => {
    if (!msg.photoUrl) return;
    const filename = msg.photoName || `gupshup-photo-${Date.now()}.jpg`;
    setConfirmState({
      open: true,
      title: 'Save photo to Google Drive?',
      description: `Gupshup will upload "${filename}" to your connected Google Drive account.`,
      confirmLabel: 'Save to Google Drive',
      variant: 'primary',
      icon: 'cloud_upload',
      action: async () => {
        await executeDriveUploadWithConsent(async () => {
          const resp = await fetch(msg.photoUrl!);
          const blob = await resp.blob();
          const uploaded = await uploadFileToDrive({
            name: filename,
            mimeType: blob.type || 'image/jpeg',
            blob,
            description: msg.text || 'Photo saved from Gupshup chat',
          });
          return uploaded.name;
        });
      },
    });
  };

  const handleRequestBackupSingleChat = (chatId: string) => {
    const thread = chats.find((c) => c.id === chatId);
    const contact = thread ? contactsById[thread.contactId] : null;
    const filename = `gupshup-chat-${contact?.username ?? chatId}.json`;
    setConfirmState({
      open: true,
      title: 'Save conversation to Google Drive?',
      description: `Export your conversation with ${contact?.name ?? 'this contact'} as "${filename}" to your Google Drive.`,
      confirmLabel: 'Upload Backup',
      variant: 'primary',
      icon: 'cloud_upload',
      action: async () => {
        await executeDriveUploadWithConsent(async () => {
          const payload = {
            exportedAt: new Date().toISOString(),
            owner: `@${user.username}`,
            contact: contact ? { name: contact.name, username: contact.username } : null,
            messages: messagesByChat[chatId] ?? [],
          };
          const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: 'application/json',
          });
          const uploaded = await uploadFileToDrive({
            name: filename,
            mimeType: 'application/json',
            blob,
            description: `Gupshup conversation backup with ${contact?.name ?? 'contact'}`,
          });
          return uploaded.name;
        });
      },
    });
  };

  const handleRequestBackupAllChats = () => {
    const filename = `gupshup-backup-${user.username}.json`;
    setConfirmState({
      open: true,
      title: 'Back up all chats to Google Drive?',
      description: `This will upload "${filename}" containing ${chats.length} conversation threads to your Google Drive.`,
      confirmLabel: 'Upload Full Backup',
      variant: 'primary',
      icon: 'backup',
      action: async () => {
        await executeDriveUploadWithConsent(async () => {
          const payload = {
            exportedAt: new Date().toISOString(),
            account: { name: user.name, username: user.username, email: user.email },
            chats,
            messagesByChat,
          };
          const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: 'application/json',
          });
          const uploaded = await uploadFileToDrive({
            name: filename,
            mimeType: 'application/json',
            blob,
            description: 'Gupshup full conversation backup',
          });
          return uploaded.name;
        });
      },
    });
  };

  const handleRequestSignOut = () => {
    setConfirmState({
      open: true,
      title: 'Sign out of Gupshup?',
      description: 'You can sign back in anytime from the welcome screen.',
      confirmLabel: 'Sign Out',
      variant: 'danger',
      icon: 'logout',
      action: async () => {
        await signOutSupabase();
        setSupabaseSession(null);
        setIsDemoPreview(false);
        refreshDriveState();
        setUser({ ...DEFAULT_USER_PROFILE });
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          window.history.replaceState({}, '', '/');
        }
        setScreen('welcome');
        showToast('Signed out');
      },
    });
  };

  const handleAccountDeletedReset = async () => {
    if (supabaseSession?.user.id) {
      try {
        window.localStorage.removeItem(`gupshup_username_${supabaseSession.user.id}`);
      } catch {
        // Ignore storage errors
      }
    }
    await signOutSupabase().catch(() => {});
    setSupabaseSession(null);
    setIsDemoPreview(false);
    refreshDriveState();
    setUser({ ...DEFAULT_USER_PROFILE });
    setChats([...INITIAL_CHATS]);
    setMessagesByChat({ ...INITIAL_MESSAGES_BY_CHAT });
    setBlocked([...INITIAL_BLOCKED]);
    setRecentSearches([...INITIAL_RECENT_SEARCHES]);
    setReports([]);
    setScreen('welcome');
  };

  const runConfirmModalAction = async () => {
    if (!confirmState) return;
    setConfirmState((prev) => (prev ? { ...prev, busy: true } : null));
    try {
      await confirmState.action();
      setConfirmState(null);
    } catch (err) {
      setConfirmState(null);
      showToast(err instanceof Error ? err.message : 'Action could not be completed.');
    }
  };

  const effectiveScreen = resolveRouteAccess(
    screen,
    Boolean(supabaseSession),
    isDemoPreview
  );

  /* --------------------------- Pre-Auth Screens ---------------------------- */
  if (effectiveScreen === 'welcome') {
    return (
      <>
        <WelcomeScreen
          onGoogleSignIn={handleGoogleSignIn}
          onDemoSignIn={handleDemoSignIn}
          onOpenPrivacy={() => navigateTo('privacy-policy')}
          authError={authError}
          isAuthResolving={authResolving}
        />
        {toast && <ToastBanner toast={toast} onDismiss={() => setToast(null)} />}
      </>
    );
  }

  if (effectiveScreen === 'onboarding') {
    return (
      <>
        <OnboardingScreen
          user={user}
          directoryHandles={directoryHandles}
          onBack={() => setScreen('welcome')}
          onComplete={handleCompleteOnboarding}
          onOpenPrivacy={() => navigateTo('privacy-policy')}
        />
        {toast && <ToastBanner toast={toast} onDismiss={() => setToast(null)} />}
      </>
    );
  }

  if (
    screen === 'privacy-policy' &&
    (privacyBackTarget === 'welcome' || privacyBackTarget === 'onboarding')
  ) {
    return (
      <div className="min-h-screen bg-surface py-6">
        <PrivacyPolicyView onBack={() => setScreen(privacyBackTarget)} />
      </div>
    );
  }

  /* --------------------------- Authenticated Shell ------------------------- */
  const activeContactForContactInfo =
    contactsById[selectedContactId] ?? contacts[0];
  const threadIdForContactInfo =
    chats.find((c) => c.contactId === activeContactForContactInfo.id)?.id ??
    `chat-${activeContactForContactInfo.id}`;
  const messagesForContactInfo = messagesByChat[threadIdForContactInfo] ?? [];

  const activeThreadContact =
    chats.find((c) => c.id === activeChatId)?.contactId ?? 'sara';
  const recipientName = contactsById[activeThreadContact]?.name ?? 'Contact';
  const threadPhotos = (messagesByChat[activeChatId] ?? []).filter(
    (m) => m.kind === 'photo' && m.photoUrl
  );

  const mobileTitles: Partial<Record<AppScreen, string>> = {
    discover: 'Discover',
    'search-people': 'Search People',
    chats: 'Messages',
    'contact-info': 'Contact Info',
    profile: 'My Profile',
    'edit-profile': 'Edit Profile',
    settings: 'Settings',
    'blocked-users': 'Blocked Users',
    'privacy-policy': 'Privacy Policy',
    'delete-account': 'Delete Account',
  };

  const mobileBackTargets: Partial<Record<AppScreen, AppScreen>> = {
    'search-people': 'discover',
    'contact-info': 'chat',
    'edit-profile': 'profile',
    settings: 'profile',
    'blocked-users': 'settings',
    'privacy-policy': 'settings',
    'delete-account': 'settings',
  };

  return (
    <>
      <AppShell
        currentScreen={screen}
        user={user}
        unreadTotal={unreadTotal}
        globalSearchQuery={globalSearchQuery}
        onGlobalSearchChange={setGlobalSearchQuery}
        onGlobalSearchSubmit={() => setScreen('search-people')}
        onNavigate={navigateTo}
        mobileTitle={mobileTitles[screen]}
        mobileBackTo={mobileBackTargets[screen]}
        hideMobileHeader={screen === 'chat'}
        hideMobileBottomNav={screen === 'chat'}
      >
        {screen === 'discover' && (
          <DiscoverView
            contacts={contacts}
            blocked={blocked}
            onStartChat={handleStartChatWithContact}
            onOpenContactInfo={handleOpenContactInfo}
            onOpenSearchPeople={() => setScreen('search-people')}
          />
        )}

        {screen === 'search-people' && (
          <SearchPeopleView
            contacts={contacts}
            blocked={blocked}
            recentSearches={recentSearches}
            initialQuery={globalSearchQuery}
            onAddRecentSearch={(term) =>
              setRecentSearches((prev) =>
                [term, ...prev.filter((t) => t !== term)].slice(0, 6)
              )
            }
            onRemoveRecentSearch={(term) =>
              setRecentSearches((prev) => prev.filter((t) => t !== term))
            }
            onClearRecentSearches={() => setRecentSearches([])}
            onStartChat={handleStartChatWithContact}
            onOpenContactInfo={handleOpenContactInfo}
            onBack={() => setScreen('discover')}
          />
        )}

        {(screen === 'chats' || screen === 'chat') && (
          <ChatsAndThreadView
            mode={screen}
            user={user}
            chats={chats}
            contacts={contacts}
            contactsById={contactsById}
            messagesByChat={messagesByChat}
            blocked={blocked}
            activeChatId={activeChatId}
            replyTarget={replyTarget}
            onClearReplyTarget={() => setReplyTarget(null)}
            onSetReplyTarget={(msg) => setReplyTarget(msg)}
            onSelectChat={handleSelectChat}
            onBackToInbox={() => setScreen('chats')}
            onNavigateDiscover={() => setScreen('discover')}
            onOpenContactInfo={handleOpenContactInfo}
            onTogglePinChat={handleTogglePinChat}
            onToggleBlockUser={handleToggleBlockUser}
            onOpenReportUser={(id) => setReportTargetId(id)}
            onSendText={handleSendText}
            onRetryFailedMessage={handleRetryFailedMessage}
            onSendVoice={handleSendVoice}
            onOpenAttachmentModal={() => setAttachmentOpen(true)}
            onOpenImageViewer={(msg) => setViewerMessage(msg)}
            onRequestBackupToDrive={handleRequestBackupSingleChat}
          />
        )}

        {screen === 'contact-info' && (
          <ContactInfoView
            contact={activeContactForContactInfo}
            messages={messagesForContactInfo}
            isBlocked={blocked.some((b) => b.userId === activeContactForContactInfo.id)}
            onBack={() => setScreen('chat')}
            onMessage={() => handleStartChatWithContact(activeContactForContactInfo.id)}
            onToggleBlock={() => handleToggleBlockUser(activeContactForContactInfo.id)}
            onOpenReport={() => setReportTargetId(activeContactForContactInfo.id)}
            onOpenImageViewer={(msg) => setViewerMessage(msg)}
          />
        )}

        {screen === 'profile' && (
          <MyProfileView
            user={user}
            chats={chats}
            messagesByChat={messagesByChat}
            blocked={blocked}
            onNavigate={navigateTo}
            onUpdateAvatar={(dataUrl) => {
              setUser((prev) => ({ ...prev, avatarDataUrl: dataUrl }));
              showToast('Profile photo updated');
            }}
            onCopyHandle={() => {
              navigator.clipboard?.writeText(`@${user.username}`).catch(() => {});
              showToast(`Copied @${user.username} to clipboard`);
            }}
          />
        )}

        {screen === 'edit-profile' && (
          <EditProfileView
            user={user}
            directoryHandles={directoryHandles}
            onSave={(updates) => {
              setUser((prev) => ({ ...prev, ...updates }));
              setScreen('profile');
              showToast('Profile changes saved');
            }}
            onCancel={() => setScreen('profile')}
          />
        )}

        {screen === 'settings' && (
          <SettingsView
            user={user}
            blockedCount={blocked.length}
            driveConnected={driveState.connected}
            driveEmail={driveState.email}
            onNavigate={navigateTo}
            onToggleSetting={(key) =>
              setUser((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            onConnectDrive={handleConnectDrive}
            onDisconnectDrive={handleDisconnectDrive}
            onRequestBackupAllChatsToDrive={handleRequestBackupAllChats}
            onRequestSignOut={handleRequestSignOut}
          />
        )}

        {screen === 'blocked-users' && (
          <BlockedUsersView
            blocked={blocked}
            contactsById={contactsById}
            onUnblock={handleUnblockWithUndo}
            onBack={() => setScreen('settings')}
          />
        )}

        {screen === 'privacy-policy' && (
          <PrivacyPolicyView onBack={() => setScreen('settings')} />
        )}

        {screen === 'delete-account' && (
          <DeleteAccountView
            user={user}
            onCancel={() => setScreen('settings')}
            onAccountDeleted={() => void handleAccountDeletedReset()}
          />
        )}
      </AppShell>

      {/* Modals */}
      <AttachmentModal
        open={attachmentOpen}
        recipientName={recipientName}
        onClose={() => setAttachmentOpen(false)}
        onConnectDrive={handleConnectDrive}
        onSendPhoto={handleSendPhoto}
        onSendDriveFile={handleSendDriveFile}
      />

      <ImageViewerModal
        message={viewerMessage}
        threadPhotos={threadPhotos}
        senderName={
          viewerMessage?.senderId === 'me'
            ? user.name
            : contactsById[viewerMessage?.senderId ?? '']?.name ?? recipientName
        }
        contacts={contacts.filter((c) => !blocked.some((b) => b.userId === c.id))}
        onClose={() => setViewerMessage(null)}
        onSelectPhoto={(msg) => setViewerMessage(msg)}
        onReply={(msg) => setReplyTarget(msg)}
        onToggleStar={handleToggleStar}
        onForward={handleForwardPhoto}
        onRequestDelete={handleRequestDeleteMessage}
        onRequestSaveToDrive={handleRequestSavePhotoToDrive}
      />

      <ReportUserModal
        open={Boolean(reportTargetId)}
        contact={reportTargetId ? contactsById[reportTargetId] ?? null : null}
        alreadyBlocked={
          reportTargetId ? blocked.some((b) => b.userId === reportTargetId) : false
        }
        onClose={() => setReportTargetId(null)}
        onSubmitReport={(payload) => {
          handleSubmitReport(payload);
          if (reports.length >= 0) {
            showToast('Safety report submitted');
          }
        }}
      />

      <ConfirmModal
        open={Boolean(confirmState?.open)}
        title={confirmState?.title ?? ''}
        description={confirmState?.description ?? ''}
        confirmLabel={confirmState?.confirmLabel ?? 'Confirm'}
        variant={confirmState?.variant ?? 'primary'}
        icon={confirmState?.icon ?? 'help'}
        busy={Boolean(confirmState?.busy)}
        onConfirm={() => void runConfirmModalAction()}
        onCancel={() => setConfirmState(null)}
      />

      {toast && <ToastBanner toast={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}

function ToastBanner({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[90] px-4 py-3 rounded-2xl bg-inverse-surface text-inverse-on-surface shadow-xl flex items-center gap-3 text-sm max-w-[92vw]"
    >
      <span className="truncate font-medium">{toast.message}</span>
      {toast.actionLabel && toast.onAction && (
        <button
          type="button"
          onClick={() => {
            toast.onAction?.();
            onDismiss();
          }}
          className="text-primary-fixed font-bold hover:underline shrink-0"
        >
          {toast.actionLabel}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="text-inverse-on-surface/70 hover:text-inverse-on-surface shrink-0"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}
