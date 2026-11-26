import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  BlockedEntry,
  ChatFilterTab,
  ChatMessage,
  ChatThread,
  ContactUser,
  CurrentUserProfile,
  ThreadInsightResult,
} from '../types/gupshup';
import { VoicePlaybackController } from '../utils/audioPlayer';
import {
  filterChats,
  formatDuration,
  formatFileSize,
  getLastMessagePreview,
} from '../utils/gupshupLogic';
import { Avatar } from './Avatar';

interface ChatsAndThreadViewProps {
  mode: 'chats' | 'chat';
  user: CurrentUserProfile;
  chats: ChatThread[];
  contacts: ContactUser[];
  contactsById: Record<string, ContactUser>;
  messagesByChat: Record<string, ChatMessage[]>;
  blocked: BlockedEntry[];
  activeChatId: string | null;
  replyTarget: ChatMessage | null;
  onClearReplyTarget: () => void;
  onSetReplyTarget: (msg: ChatMessage) => void;
  onSelectChat: (chatId: string) => void;
  onBackToInbox: () => void;
  onNavigateDiscover: () => void;
  onOpenContactInfo: (contactId: string) => void;
  onTogglePinChat: (chatId: string) => void;
  onToggleBlockUser: (contactId: string) => void;
  onOpenReportUser: (contactId: string) => void;
  onSendText: (chatId: string, text: string, simulateFailure?: boolean) => void;
  onRetryFailedMessage: (chatId: string, messageId: string) => void;
  onSendVoice: (
    chatId: string,
    payload: { durationSec: number; waveform: number[]; audioUrl?: string }
  ) => void;
  onPresenceActivity?: (
    recipientId: string | null,
    activity: 'typing' | 'recording' | 'sending_photo' | null
  ) => void;
  onOpenAttachmentModal: () => void;
  onOpenImageViewer: (msg: ChatMessage) => void;
  onRequestBackupToDrive: (chatId: string) => void;
}

const EMOJI_CHOICES = ['😀', '👋', '✨', '🔥', '☕', '❤️', '🙌', '👍', '🎉', '💡'];

type RecordingState = 'idle' | 'recording' | 'paused' | 'preview';

export const ChatsAndThreadView: React.FC<ChatsAndThreadViewProps> = ({
  mode,
  user,
  chats,
  contacts,
  contactsById,
  messagesByChat,
  blocked,
  activeChatId,
  replyTarget,
  onClearReplyTarget,
  onSetReplyTarget,
  onSelectChat,
  onBackToInbox,
  onNavigateDiscover,
  onOpenContactInfo,
  onTogglePinChat,
  onToggleBlockUser,
  onOpenReportUser,
  onSendText,
  onRetryFailedMessage,
  onSendVoice,
  onPresenceActivity,
  onOpenAttachmentModal,
  onOpenImageViewer,
  onRequestBackupToDrive,
}) => {
  const [inboxQuery, setInboxQuery] = useState('');
  const [filterTab, setFilterTab] = useState<ChatFilterTab>('all');
  const [draft, setDraft] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  const [simulateNextFail, setSimulateNextFail] = useState(false);

  // Voice playback state
  const playerRef = useRef<VoicePlaybackController | null>(null);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const [playElapsedSec, setPlayElapsedSec] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);

  // Voice recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingSec, setRecordingSec] = useState(0);
  const [recordedWaveform, setRecordedWaveform] = useState<number[]>([8, 14, 18, 12, 20, 14]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | undefined>(undefined);
  const [micWarning, setMicWarning] = useState<string | null>(null);
  const recTimerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);
  const typingTimerRef = useRef<number | null>(null);

  // Gemini 4 Carbon High Thinking Mode drawer
  const [showInsights, setShowInsights] = useState(false);
  const [insightQuestion, setInsightQuestion] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [insightResult, setInsightResult] = useState<ThreadInsightResult | null>(null);

  const threadEndRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);

  const blockedIds = useMemo(() => new Set(blocked.map((b) => b.userId)), [blocked]);

  useEffect(() => {
    playerRef.current = new VoicePlaybackController();
    return () => {
      playerRef.current?.stop();
      if (recTimerRef.current !== null) window.clearInterval(recTimerRef.current);
    };
  }, []);

  const filteredInbox = useMemo(
    () => filterChats(chats, contactsById, messagesByChat, inboxQuery, filterTab),
    [chats, contactsById, messagesByChat, inboxQuery, filterTab]
  );

  const activeThread = useMemo(
    () => chats.find((c) => c.id === activeChatId) ?? filteredInbox[0] ?? chats[0] ?? null,
    [chats, activeChatId, filteredInbox]
  );

  const activeContact = activeThread ? contactsById[activeThread.contactId] : null;
  const activeMessages = activeThread ? messagesByChat[activeThread.id] ?? [] : [];
  const isContactBlocked = activeContact ? blockedIds.has(activeContact.id) : false;

  // Reset per-thread transient UI on thread change
  useEffect(() => {
    setShowThreadMenu(false);
    setShowEmojiPicker(false);
    setShowInsights(false);
    setInsightResult(null);
    setInsightError(null);
    setInsightQuestion('');
    setMicWarning(null);
    if (typingTimerRef.current !== null) window.clearTimeout(typingTimerRef.current);
    onPresenceActivity?.(null, null);
  }, [activeThread?.id]);

  useEffect(() => {
    if (replyTarget) {
      composerInputRef.current?.focus();
    }
  }, [replyTarget]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeMessages.length, activeThread?.id]);

  const stopRecordingTimer = () => {
    if (recTimerRef.current !== null) {
      window.clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
  };

  const startRecordingTimer = () => {
    stopRecordingTimer();
    recTimerRef.current = window.setInterval(() => {
      setRecordingSec((s) => s + 1);
      setRecordedWaveform((prev) => [
        ...prev.slice(-17),
        8 + Math.floor(Math.random() * 18),
      ]);
    }, 1000);
  };

  const handleStartRecording = async () => {
    setMicWarning(null);
    setRecordedAudioUrl(undefined);
    setRecordingSec(0);
    setRecordedWaveform([10, 16, 12, 22, 14, 18, 10]);
    recordedChunksRef.current = [];
    recordedBlobRef.current = null;

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function' || typeof MediaRecorder === 'undefined') {
      setMicWarning('اس براؤزر میں وائس ریکارڈنگ دستیاب نہیں۔ Chrome یا کسی جدید براؤزر میں کوشش کریں۔');
      setRecordingState('idle');
      return;
    }

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedMime = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4']
        .find((mime) => MediaRecorder.isTypeSupported(mime));
      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) recordedChunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        stream?.getTracks().forEach((track) => track.stop());
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          recordedBlobRef.current = blob;
          setRecordedAudioUrl(URL.createObjectURL(blob));
        }
      };
      recorder.start();
      if (activeThread) onPresenceActivity?.(activeThread.contactId, 'recording');
      setRecordingState('recording');
      startRecordingTimer();
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      onPresenceActivity?.(null, null);
      setMicWarning(error instanceof Error ? error.message : 'مائیکروفون کی اجازت نہیں ملی۔');
      setRecordingState('idle');
    }
  };

  const handlePauseOrResumeRecording = () => {
    if (recordingState === 'recording') {
      stopRecordingTimer();
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
      setRecordingState('paused');
    } else if (recordingState === 'paused') {
      if (mediaRecorderRef.current?.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      setRecordingState('recording');
      startRecordingTimer();
    }
  };

  const handleStopToPreview = () => {
    stopRecordingTimer();
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === 'recording' ||
        mediaRecorderRef.current.state === 'paused')
    ) {
      mediaRecorderRef.current.stop();
    }
    setRecordingState('preview');
    onPresenceActivity?.(null, null);
  };

  const handleCancelRecording = () => {
    stopRecordingTimer();
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
    setRecordingState('idle');
    setRecordingSec(0);
    setRecordedAudioUrl(undefined);
    recordedBlobRef.current = null;
    setMicWarning(null);
    onPresenceActivity?.(null, null);
  };

  const handleSendRecordedVoice = async () => {
    if (!activeThread) return;
    const finalSec = Math.max(1, recordingSec);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        recorder.addEventListener('stop', () => resolve(), { once: true });
        recorder.stop();
      });
    }
    stopRecordingTimer();
    const blob = recordedBlobRef.current;
    if (!blob || !blob.size) {
      setMicWarning('وائس ریکارڈنگ محفوظ نہیں ہوئی۔ دوبارہ ریکارڈ کریں۔');
      return;
    }
    const audioUrl = URL.createObjectURL(blob);
    onPresenceActivity?.(null, null);
    onSendVoice(activeThread.id, {
      durationSec: finalSec,
      waveform: recordedWaveform,
      audioUrl,
    });
    setRecordingState('idle');
    setRecordingSec(0);
    setRecordedAudioUrl(undefined);
    recordedBlobRef.current = null;
    setMicWarning(null);
  };

  const handleToggleVoicePlay = (msg: ChatMessage) => {
    const controller = playerRef.current;
    if (!controller) return;
    if (playingMsgId === msg.id) {
      controller.stop();
      setPlayingMsgId(null);
      setPlayElapsedSec(0);
      return;
    }

    setPlayingMsgId(msg.id);
    setPlayElapsedSec(0);
    controller.play({
      id: msg.id,
      audioUrl: msg.voiceAudioUrl,
      durationSec: msg.voiceDurationSec ?? 12,
      playbackRate,
      onProgress: (elapsed) => setPlayElapsedSec(elapsed),
      onEnded: () => {
        setPlayingMsgId(null);
        setPlayElapsedSec(0);
      },
    });
  };

  const handleCyclePlaybackRate = () => {
    const next: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(next);
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!activeThread) return;
    onPresenceActivity?.(activeThread.contactId, value.trim() ? 'typing' : null);
    if (typingTimerRef.current !== null) window.clearTimeout(typingTimerRef.current);
    if (value.trim()) {
      typingTimerRef.current = window.setTimeout(() => {
        onPresenceActivity?.(null, null);
        typingTimerRef.current = null;
      }, 1800);
    }
  };

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || isContactBlocked) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (typingTimerRef.current !== null) window.clearTimeout(typingTimerRef.current);
    onPresenceActivity?.(null, null);
    onSendText(activeThread.id, trimmed, simulateNextFail);
    setDraft('');
    setSimulateNextFail(false);
    setShowEmojiPicker(false);
  };

  const handleRunThreadInsights = async (customQuery?: string) => {
    if (!activeThread || !activeContact) return;
    setInsightLoading(true);
    setInsightError(null);
    try {
      const payloadMessages = activeMessages.map((m) => ({
        sender: m.senderId === 'me' ? user.name : activeContact.name,
        timestamp: m.timestamp,
        content:
          m.kind === 'photo'
            ? `[Photo: ${m.photoName || 'image'}] ${m.text || ''}`
            : m.kind === 'voice'
              ? `[Voice note (${formatDuration(m.voiceDurationSec ?? 0)})]`
              : m.kind === 'drive_file'
                ? `[Drive file: ${m.driveFile?.name || 'file'}] ${m.text || ''}`
                : m.text || '',
      }));

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: activeContact.name,
          contactHandle: activeContact.username,
          messages: payloadMessages,
          question: customQuery ?? insightQuestion.trim(),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as ThreadInsightResult & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || `Analysis failed with status ${res.status}`);
      }
      setInsightResult(data);
    } catch (err) {
      setInsightError(
        err instanceof Error ? err.message : 'Unable to run Thread Insights right now.'
      );
    } finally {
      setInsightLoading(false);
    }
  };

  const showInboxPane = mode === 'chats';
  const showThreadPane = mode === 'chat';

  return (
    <div
      className={`${
        mode === 'chat' ? 'h-[100dvh] max-h-[100dvh]' : 'h-[calc(100dvh-3.5rem-4rem)]'
      } lg:h-[calc(100vh-4rem)] flex min-w-0 w-full bg-surface overflow-hidden`}
    >
      {/* LEFT PANE: INBOX LIST */}
      <section
        aria-label="Conversations Inbox"
        className={`${
          showInboxPane ? 'flex' : 'hidden lg:flex'
        } w-full lg:w-[360px] xl:w-[380px] shrink-0 flex-col bg-surface-container-lowest border-r border-outline-variant/20 h-full`}
      >
        {/* Inbox Header */}
        <div className="px-4 pt-4 pb-3 space-y-3 border-b border-surface-container-low">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface tracking-tight">Messages</h2>
            <button
              type="button"
              onClick={onNavigateDiscover}
              aria-label="Start new chat"
              className="h-8 px-3 rounded-xl bg-primary-fixed hover:bg-primary-container text-primary hover:text-on-primary text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">edit_square</span>
              <span>New</span>
            </button>
          </div>

          {/* Search Inbox */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={inboxQuery}
              onChange={(e) => setInboxQuery(e.target.value)}
              placeholder="Search chats or messages..."
              className="w-full h-10 pl-9 pr-8 rounded-xl bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary-container/20"
            />
            {inboxQuery && (
              <button
                type="button"
                aria-label="Clear chat filter"
                onClick={() => setInboxQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'pinned', label: 'Pinned' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterTab === tab.id
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Contacts Horizontal Strip */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {contacts
              .filter((c) => !blockedIds.has(c.id))
              .slice(0, 6)
              .map((person) => {
                const threadForPerson = chats.find((ch) => ch.contactId === person.id);
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() =>
                      threadForPerson
                        ? onSelectChat(threadForPerson.id)
                        : onOpenContactInfo(person.id)
                    }
                    className="flex flex-col items-center gap-1 shrink-0 w-14 group"
                  >
                    <Avatar
                      name={person.name}
                      initials={person.initials}
                      size="sm"
                      isOnline={person.isOnline}
                      bgClass={person.avatarBgClass}
                      textClass={person.avatarTextClass}
                    />
                    <span className="text-[11px] font-medium text-on-surface-variant group-hover:text-on-surface truncate w-full text-center">
                      {person.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-surface-container-low/70">
          {filteredInbox.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[24px]">forum</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-on-surface">
                  {filterTab === 'unread'
                    ? 'No unread conversations'
                    : filterTab === 'pinned'
                      ? 'No pinned chats yet'
                      : 'No chats match your search'}
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Start a conversation with anyone on Gupshup Discover.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInboxQuery('');
                  setFilterTab('all');
                  if (chats.length === 0) onNavigateDiscover();
                }}
                className="h-9 px-4 rounded-xl bg-primary-container text-on-primary text-xs font-semibold"
              >
                {chats.length === 0 ? 'Go to Discover' : 'Show All Chats'}
              </button>
            </div>
          ) : (
            filteredInbox.map((thread) => {
              const contact = contactsById[thread.contactId];
              if (!contact) return null;
              const isSelected = activeThread?.id === thread.id;
              const isBlocked = blockedIds.has(contact.id);
              const threadMsgs = messagesByChat[thread.id] ?? [];
              const lastMsg = threadMsgs[threadMsgs.length - 1];
              const preview = isBlocked
                ? 'Contact blocked'
                : getLastMessagePreview(threadMsgs, thread.isTyping);

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => onSelectChat(thread.id)}
                  className={`w-full px-4 py-3.5 flex items-center gap-3 text-left transition-colors relative ${
                    isSelected
                      ? 'bg-primary-fixed/35 lg:border-l-[3px] lg:border-primary'
                      : 'hover:bg-surface-container-low/70'
                  }`}
                >
                  <Avatar
                    name={contact.name}
                    initials={contact.initials}
                    size="md"
                    isOnline={!isBlocked && contact.isOnline}
                    showOnlineDot={!isBlocked}
                    bgClass={contact.avatarBgClass}
                    textClass={contact.avatarTextClass}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-sm font-semibold text-on-surface truncate">
                          {contact.name}
                        </span>
                        {thread.pinned && (
                          <span
                            title="Pinned"
                            className="material-symbols-outlined text-[14px] text-primary shrink-0"
                          >
                            push_pin
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] shrink-0 ${
                          thread.unreadCount > 0 && !isBlocked
                            ? 'text-primary font-semibold'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        {lastMsg?.timestamp ?? thread.lastActivityLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="flex items-center gap-1 min-w-0 text-xs text-on-surface-variant">
                        {lastMsg?.senderId === 'me' && !thread.isTyping && (
                          <span
                            className={`material-symbols-outlined text-[14px] shrink-0 ${
                              lastMsg.status === 'read'
                                ? 'text-primary'
                                : lastMsg.status === 'failed'
                                  ? 'text-error'
                                  : 'text-on-surface-variant'
                            }`}
                          >
                            {lastMsg.status === 'failed'
                              ? 'error'
                              : lastMsg.status === 'sent'
                                ? 'done'
                                : 'done_all'}
                          </span>
                        )}
                        <span
                          className={`truncate ${
                            thread.isTyping ? 'text-secondary font-medium italic' : ''
                          }`}
                        >
                          {preview}
                        </span>
                      </div>

                      {thread.unreadCount > 0 && !isBlocked && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary-container text-on-primary text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* RIGHT PANE: ACTIVE CHAT THREAD */}
      <section
        aria-label="Active Conversation"
        className={`${
          showThreadPane ? 'flex' : 'hidden lg:flex'
        } flex-1 flex-col bg-surface h-full min-h-0 min-w-0 relative`}
      >
        {!activeThread || !activeContact ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-primary-fixed text-primary flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px] icon-filled">chat</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">Select a conversation</h3>
            <p className="text-sm text-on-surface-variant mt-1 max-w-sm">
              Pick a thread from the left or find someone new on Discover.
            </p>
            <button
              type="button"
              onClick={onNavigateDiscover}
              className="mt-5 h-11 px-5 rounded-[14px] bg-primary-container text-on-primary text-sm font-semibold"
            >
              Browse Discover
            </button>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <header className="h-16 px-4 sm:px-6 bg-surface-container-lowest border-b border-outline-variant/20 flex items-center justify-between gap-3 shrink-0 z-20">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  aria-label="Back to Chats"
                  onClick={onBackToInbox}
                  className="lg:hidden w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenContactInfo(activeContact.id)}
                  className="flex items-center gap-3 min-w-0 text-left group"
                >
                  <Avatar
                    name={activeContact.name}
                    initials={activeContact.initials}
                    size="sm"
                    isOnline={!isContactBlocked && activeContact.isOnline}
                    showOnlineDot={!isContactBlocked}
                    bgClass={activeContact.avatarBgClass}
                    textClass={activeContact.avatarTextClass}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm sm:text-base font-semibold text-on-surface group-hover:text-primary truncate transition-colors">
                        {activeContact.name}
                      </span>
                      {activeContact.verified && (
                        <span className="material-symbols-outlined text-[15px] text-primary icon-filled shrink-0">
                          verified
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-on-surface-variant">
                      {isContactBlocked
                        ? 'blocked'
                        : activeThread.isTyping
                          ? (activeThread.activityLabel || 'typing...')
                          : activeContact.isOnline
                            ? 'online'
                            : activeContact.lastSeenAt
                              ? `last seen ${new Date(activeContact.lastSeenAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                              : `@${activeContact.username}`}
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-1.5 relative">
                <button
                  type="button"
                  onClick={() => setShowInsights((s) => !s)}
                  className={`h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    showInsights
                      ? 'bg-primary-container text-on-primary'
                      : 'bg-primary-fixed/60 hover:bg-primary-fixed text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">psychology</span>
                  <span className="hidden sm:inline">Insights</span>
                </button>

                <button
                  type="button"
                  aria-label="Conversation options"
                  onClick={() => setShowThreadMenu((v) => !v)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>

                {showThreadMenu && (
                  <div className="absolute right-0 top-11 w-60 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/25 py-1.5 z-50">
                    <button
                      type="button"
                      onClick={() => {
                        setShowThreadMenu(false);
                        onOpenContactInfo(activeContact.id);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">info</span>
                      <span>Contact Info</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowThreadMenu(false);
                        onTogglePinChat(activeThread.id);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">push_pin</span>
                      <span>{activeThread.pinned ? 'Unpin Chat' : 'Pin Chat'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowThreadMenu(false);
                        onRequestBackupToDrive(activeThread.id);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                      <span>Save Chat to Drive</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowThreadMenu(false);
                        setSimulateNextFail((prev) => !prev);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-on-surface hover:bg-surface-container-low flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[18px]">wifi_off</span>
                        <span>Test Retry State</span>
                      </span>
                      {simulateNextFail && (
                        <span className="text-[11px] font-bold text-error">ON</span>
                      )}
                    </button>
                    <div className="my-1 border-t border-surface-container-low" />
                    <button
                      type="button"
                      onClick={() => {
                        setShowThreadMenu(false);
                        onToggleBlockUser(activeContact.id);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-error hover:bg-error-container/30 flex items-center gap-2.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">block</span>
                      <span>{isContactBlocked ? 'Unblock User' : 'Block User'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowThreadMenu(false);
                        onOpenReportUser(activeContact.id);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-error hover:bg-error-container/30 flex items-center gap-2.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">flag</span>
                      <span>Report User</span>
                    </button>
                  </div>
                )}
              </div>
            </header>

            {/* High Thinking Mode Insights Drawer */}
            {showInsights && (
              <div className="bg-surface-container-lowest border-b border-outline-variant/25 px-4 sm:px-6 py-4 space-y-3 shadow-sm z-10">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">
                      psychology
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-on-surface">
                        Thread Insights • High Thinking Mode
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        Deep reasoning summary & reply suggestions for this thread
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInsights(false)}
                    className="text-xs font-semibold text-on-surface-variant hover:text-on-surface"
                  >
                    Hide
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleRunThreadInsights();
                  }}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <input
                    type="text"
                    value={insightQuestion}
                    onChange={(e) => setInsightQuestion(e.target.value)}
                    placeholder="Ask a complex question about this chat (or leave blank to catch up)..."
                    className="flex-1 h-10 px-3.5 rounded-xl bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary-container/25"
                  />
                  <button
                    type="submit"
                    disabled={insightLoading}
                    className="h-10 px-4 rounded-xl bg-primary-container hover:bg-primary disabled:opacity-60 text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                  >
                    {insightLoading && (
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                    )}
                    <span>{insightLoading ? 'Thinking...' : 'Analyze Thread'}</span>
                  </button>
                </form>

                {insightError && (
                  <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] text-error shrink-0">
                      error
                    </span>
                    <span>{insightError}</span>
                  </div>
                )}

                {insightResult && (
                  <div className="p-4 rounded-2xl bg-surface-container-low space-y-3 text-sm">
                    {insightResult.answerToQuery && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                          Direct Answer
                        </div>
                        <p className="text-on-surface leading-relaxed">
                          {insightResult.answerToQuery}
                        </p>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                        Summary
                      </div>
                      <p className="text-on-surface leading-relaxed">{insightResult.summary}</p>
                    </div>
                    {insightResult.keyPoints?.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                          Key Takeaways
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-on-surface-variant">
                          {insightResult.keyPoints.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insightResult.suggestedReplies?.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                          Suggested Replies (Tap to insert)
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {insightResult.suggestedReplies.map((reply, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setDraft(reply);
                                composerInputRef.current?.focus();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/25 hover:border-primary text-xs font-medium text-on-surface text-left transition-colors"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Message Stream */}
            <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain px-3 sm:px-6 py-4 sm:py-5 space-y-2.5">
              {/* Date Pill */}
              <div className="flex justify-center my-2">
                <span className="px-3 py-1 rounded-full bg-surface-container-low text-[11px] font-semibold text-on-surface-variant">
                  Today
                </span>
              </div>

              {activeMessages.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-on-surface-variant">
                    Say hello to <span className="font-semibold text-on-surface">{activeContact.name}</span>!
                  </p>
                </div>
              ) : (
                activeMessages.map((msg, idx) => {
                  const isMe = msg.senderId === 'me';
                  const prevSameSender =
                    idx > 0 && activeMessages[idx - 1].senderId === msg.senderId;
                  const isPlaying = playingMsgId === msg.id;
                  const duration = msg.voiceDurationSec ?? 12;
                  const progressPct = isPlaying
                    ? Math.min(100, (playElapsedSec / Math.max(1, duration)) * 100)
                    : 0;

                  const cornerClass = isMe
                    ? prevSameSender
                      ? 'rounded-2xl rounded-tr-sm'
                      : 'rounded-2xl rounded-br-sm'
                    : prevSameSender
                      ? 'rounded-2xl rounded-tl-sm'
                      : 'rounded-2xl rounded-bl-sm';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[calc(100%-0.5rem)] sm:max-w-[70%] min-w-0 group relative ${
                          msg.kind === 'photo' ? 'p-1.5' : 'px-4 py-2.5'
                        } ${cornerClass} ${
                          isMe
                            ? 'bg-primary-container text-on-primary shadow-xs'
                            : 'bg-surface-container-lowest text-on-surface shadow-[0_1px_3px_rgba(11,28,48,0.05)]'
                        }`}
                      >
                        {/* Reply Quote Banner */}
                        {msg.replyToSnippet && (
                          <div
                            className={`mb-2 px-2.5 py-1.5 rounded-lg text-xs border-l-2 ${
                              isMe
                                ? 'bg-white/15 border-white/70 text-white/95'
                                : 'bg-surface-container-low border-primary text-on-surface-variant'
                            }`}
                          >
                            <div className="font-semibold text-[11px]">
                              {msg.replyToSenderName || 'Reply'}
                            </div>
                            <div className="truncate">{msg.replyToSnippet}</div>
                          </div>
                        )}

                        {/* Photo Bubble */}
                        {msg.kind === 'photo' && msg.photoUrl && (
                          <div className="space-y-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenImageViewer(msg)}
                              className="block rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/40"
                            >
                              <img
                                src={msg.photoUrl}
                                alt={msg.text || msg.photoName || 'Shared photo'}
                                className="max-h-72 w-full object-cover hover:brightness-95 transition-all"
                              />
                            </button>
                            {msg.text && (
                              <p className="px-2 pb-1 text-sm leading-relaxed">{msg.text}</p>
                            )}
                          </div>
                        )}

                        {/* Voice Note Bubble */}
                        {msg.kind === 'voice' && (
                          <div className="flex items-center gap-2 sm:gap-3 w-full min-w-0 max-w-full py-0.5">
                            <button
                              type="button"
                              aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
                              onClick={() => handleToggleVoicePlay(msg)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                isMe
                                  ? 'bg-white/20 hover:bg-white/30 text-white'
                                  : 'bg-primary-fixed hover:bg-primary-container text-primary hover:text-white'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[22px] icon-filled">
                                {isPlaying ? 'pause' : 'play_arrow'}
                              </span>
                            </button>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-[3px] h-7">
                                {(msg.voiceWaveform ?? [10, 16, 12, 20, 14, 18, 10, 14, 18, 12]).map(
                                  (barHeight, bIdx, arr) => {
                                    const barPct = ((bIdx + 1) / arr.length) * 100;
                                    const filled = isPlaying && barPct <= progressPct;
                                    return (
                                      <span
                                        key={bIdx}
                                        className={`flex-1 rounded-full transition-colors ${
                                          filled
                                            ? isMe
                                              ? 'bg-white'
                                              : 'bg-primary'
                                            : isMe
                                              ? 'bg-white/40'
                                              : 'bg-outline-variant/60'
                                        }`}
                                        style={{ height: `${Math.max(4, Math.min(26, barHeight))}px` }}
                                      />
                                    );
                                  }
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[11px] opacity-85 tabular-nums">
                                <span>
                                  {isPlaying
                                    ? formatDuration(playElapsedSec)
                                    : formatDuration(duration)}
                                </span>
                                <button
                                  type="button"
                                  onClick={handleCyclePlaybackRate}
                                  className={`px-1.5 py-0.5 rounded font-semibold ${
                                    isMe ? 'bg-white/20' : 'bg-surface-container-low text-primary'
                                  }`}
                                >
                                  {playbackRate}x
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Google Drive Document Bubble */}
                        {msg.kind === 'drive_file' && msg.driveFile && (
                          <div className="space-y-1.5">
                            <div
                              className={`p-3 rounded-xl flex items-center gap-3 ${
                                isMe ? 'bg-white/15' : 'bg-surface-container-low'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[22px] shrink-0">
                                cloud_done
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold truncate">
                                  {msg.driveFile.name}
                                </div>
                                <div className="text-[11px] opacity-80 truncate">
                                  Google Drive • {formatFileSize(msg.driveFile.sizeBytes)}
                                </div>
                              </div>
                            </div>
                            {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                          </div>
                        )}

                        {/* Plain Text Bubble */}
                        {msg.kind === 'text' && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>
                        )}

                        {/* Timestamp + Status Row */}
                        <div
                          className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${
                            msg.kind === 'photo' ? 'px-2 pb-1' : ''
                          } ${isMe ? 'text-white/75' : 'text-on-surface-variant'}`}
                        >
                          {msg.starred && (
                            <span className="material-symbols-outlined text-[12px] text-amber-300 icon-filled">
                              star
                            </span>
                          )}
                          <span>{msg.timestamp}</span>
                          {isMe && (
                            <span className="material-symbols-outlined text-[14px]">
                              {msg.status === 'failed'
                                ? 'error'
                                : msg.status === 'sent'
                                  ? 'done'
                                  : 'done_all'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Reply / Retry Row */}
                      <div className="flex items-center gap-2 mt-0.5 px-1">
                        {msg.status === 'failed' && (
                          <button
                            type="button"
                            onClick={() => onRetryFailedMessage(activeThread.id, msg.id)}
                            className="text-[11px] font-semibold text-error hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[13px]">refresh</span>
                            <span>Not delivered • Tap to retry</span>
                          </button>
                        )}
                        {msg.status !== 'failed' && (
                          <button
                            type="button"
                            onClick={() => onSetReplyTarget(msg)}
                            className="text-[11px] font-medium text-on-surface-variant/0 group-hover:text-on-surface-variant hover:text-primary focus:text-primary transition-colors"
                          >
                            Reply
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Bottom Composer / Blocked / Voice Recording Bar */}
            {isContactBlocked ? (
              <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px] text-error">block</span>
                  <span>
                    You blocked <strong className="text-on-surface">{activeContact.name}</strong>.
                    Unblock to send messages.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleBlockUser(activeContact.id)}
                  className="h-10 px-4 rounded-xl bg-primary-container text-on-primary text-xs font-semibold shrink-0"
                >
                  Unblock {activeContact.name.split(' ')[0]}
                </button>
              </div>
            ) : recordingState !== 'idle' ? (
              <div className="p-3 sm:p-4 bg-surface-container-lowest border-t border-outline-variant/20 space-y-2">
                {micWarning && (
                  <div className="text-[11px] text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg">
                    {micWarning}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Discard voice recording"
                    onClick={handleCancelRecording}
                    className="w-11 h-11 rounded-full bg-error-container text-error flex items-center justify-center shrink-0 hover:bg-error hover:text-on-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>

                  <div className="flex-1 h-12 px-4 rounded-2xl bg-surface-container-low flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          recordingState === 'recording'
                            ? 'bg-error animate-pulse'
                            : 'bg-on-surface-variant'
                        }`}
                      />
                      <span className="text-sm font-semibold text-on-surface tabular-nums">
                        {formatDuration(recordingSec)}
                      </span>
                      <span className="text-xs text-on-surface-variant hidden sm:inline">
                        {recordingState === 'recording'
                          ? 'Recording...'
                          : recordingState === 'paused'
                            ? 'Paused'
                            : 'Ready to send'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 h-6">
                      {recordedWaveform.slice(-12).map((h, i) => (
                        <span
                          key={i}
                          className="w-1 rounded-full bg-primary/70 transition-all"
                          style={{ height: `${Math.max(4, Math.min(22, h))}px` }}
                        />
                      ))}
                    </div>
                  </div>

                  {recordingState !== 'preview' ? (
                    <>
                      <button
                        type="button"
                        aria-label={recordingState === 'recording' ? 'Pause recording' : 'Resume'}
                        onClick={handlePauseOrResumeRecording}
                        className="w-11 h-11 rounded-full bg-surface-container text-on-surface flex items-center justify-center shrink-0"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {recordingState === 'recording' ? 'pause' : 'mic'}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label="Preview recording"
                        onClick={handleStopToPreview}
                        className="w-11 h-11 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0"
                      >
                        <span className="material-symbols-outlined text-[20px]">stop</span>
                      </button>
                    </>
                  ) : null}

                  <button
                    type="button"
                    aria-label="Send voice message"
                    onClick={handleSendRecordedVoice}
                    className="h-11 px-4 rounded-full bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 sm:p-4 pb-safe bg-surface-container-lowest border-t border-outline-variant/20 space-y-2 relative w-full min-w-0">
                {replyTarget && (
                  <div className="px-3.5 py-2 rounded-xl bg-surface-container-low border-l-3 border-primary flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-primary">
                        Replying to{' '}
                        {replyTarget.senderId === 'me' ? 'yourself' : activeContact.name}
                      </div>
                      <div className="text-xs text-on-surface-variant truncate">
                        {replyTarget.text ||
                          replyTarget.photoName ||
                          replyTarget.driveFile?.name ||
                          'Voice note'}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Cancel reply"
                      onClick={onClearReplyTarget}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                )}

                {showEmojiPicker && (
                  <div className="absolute bottom-20 right-4 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/25 p-2.5 flex items-center gap-1 z-30">
                    {EMOJI_CHOICES.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => {
                          setDraft((d) => d + em);
                          composerInputRef.current?.focus();
                        }}
                        className="w-9 h-9 rounded-xl hover:bg-surface-container text-lg flex items-center justify-center transition-colors"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSubmitText} className="flex items-center gap-1.5 sm:gap-2 w-full min-w-0">
                  <button
                    type="button"
                    aria-label="Send photo or file"
                    onClick={onOpenAttachmentModal}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary flex items-center justify-center shrink-0 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[22px]">add_photo_alternate</span>
                  </button>

                  <div className="flex-1 min-w-0 h-12 rounded-2xl bg-surface-container-low flex items-center px-2.5 sm:px-3.5 gap-1.5 sm:gap-2 focus-within:ring-2 focus-within:ring-primary-container/25">
                    <input
                      ref={composerInputRef}
                      type="text"
                      value={draft}
                      onChange={(e) => handleDraftChange(e.target.value)}
                      placeholder={
                        simulateNextFail
                          ? 'Type a message (failure test active)...'
                          : `Message ${activeContact.name.split(' ')[0]}...`
                      }
                      className="flex-1 min-w-0 w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none"
                    />
                    <button
                      type="button"
                      aria-label="Insert emoji"
                      onClick={() => setShowEmojiPicker((v) => !v)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">mood</span>
                    </button>
                  </div>

                  {draft.trim().length > 0 ? (
                    <button
                      type="submit"
                      aria-label="Send message"
                      className="w-11 h-11 rounded-full bg-primary-container hover:bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">send</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Record voice message"
                    onClick={() => void handleStartRecording()}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary-fixed hover:bg-primary-container text-primary hover:text-on-primary flex items-center justify-center shrink-0 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[21px]">mic</span>
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
