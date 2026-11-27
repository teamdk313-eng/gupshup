import React, { useEffect, useState } from 'react';
import type { AppScreen, CurrentUserProfile } from '../types/gupshup';
import { Avatar } from './Avatar';
import { PWAInstallControl } from './PWAInstallUI';

interface AppShellProps {
  currentScreen: AppScreen;
  user: CurrentUserProfile;
  unreadTotal: number;
  globalSearchQuery: string;
  onGlobalSearchChange: (q: string) => void;
  onGlobalSearchSubmit: () => void;
  onNavigate: (screen: AppScreen) => void;
  onAppInstalled?: () => void;
  mobileTitle?: string;
  mobileBackTo?: AppScreen;
  hideMobileHeader?: boolean;
  hideMobileBottomNav?: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentScreen,
  user,
  unreadTotal,
  globalSearchQuery,
  onGlobalSearchChange,
  onGlobalSearchSubmit,
  onNavigate,
  onAppInstalled,
  mobileTitle,
  mobileBackTo,
  hideMobileHeader = false,
  hideMobileBottomNav = false,
  children,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const introTimer = window.setTimeout(() => setShowIntro(false), 1650);
    return () => window.clearTimeout(introTimer);
  }, []);

  const isDiscoverActive =
    currentScreen === 'discover' || currentScreen === 'search-people';
  const isChatsActive =
    currentScreen === 'chats' ||
    currentScreen === 'chat' ||
    currentScreen === 'contact-info';
  const isAIActive = currentScreen === 'ai-chat';
  const isProfileActive =
    currentScreen === 'profile' ||
    currentScreen === 'edit-profile' ||
    currentScreen === 'settings' ||
    currentScreen === 'blocked-users' ||
    currentScreen === 'privacy-policy' ||
    currentScreen === 'delete-account';

  return (
    <div className="min-h-[100dvh] bg-surface text-on-surface">
      {showIntro && (
        <div className="gupshup-intro fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#17145b] via-[#3025a8] to-[#087f83] text-white" aria-label="Gupshup loading" role="status">
          <div className="gupshup-intro-content flex flex-col items-center gap-4">
            <div className="gupshup-intro-logo w-24 h-24 rounded-[30px] bg-white/15 border border-white/25 shadow-2xl backdrop-blur-md flex items-center justify-center">
              <span className="material-symbols-outlined icon-filled text-[54px]">forum</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">Gupshup</div>
            <div className="gupshup-intro-loader"><span /></div>
          </div>
        </div>
      )}
      {/* Desktop Left Sidebar (lg+) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-60 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex-col justify-between py-6 px-4">
        <div className="flex flex-col gap-6">
          <button
            type="button"
            onClick={() => onNavigate('discover')}
            className="flex items-center gap-2.5 px-1 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[22px] icon-filled">chat</span>
            </div>
            <span className="text-lg font-bold text-on-surface tracking-tight">Gupshup</span>
          </button>

          <nav className="flex flex-col gap-1.5" aria-label="Primary Navigation">
            <button
              type="button"
              onClick={() => onNavigate('discover')}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-colors ${
                isDiscoverActive
                  ? 'bg-primary-container text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">explore</span>
                <span className="text-sm font-semibold">Discover</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('chats')}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-colors ${
                isChatsActive
                  ? 'bg-primary-container text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                <span className="text-sm font-semibold">Chats</span>
              </div>
              {unreadTotal > 0 && (
                <span
                  className={`min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold tabular-nums ${
                    isChatsActive
                      ? 'bg-surface-container-lowest text-primary-container'
                      : 'bg-primary-container text-on-primary'
                  }`}
                >
                  {unreadTotal}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('ai-chat')}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-colors ${
                isAIActive
                  ? 'bg-primary-container text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                <span className="text-sm font-semibold">Gupshup AI</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-colors ${
                isProfileActive
                  ? 'bg-primary-container text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">person</span>
                <span className="text-sm font-semibold">Profile</span>
              </div>
            </button>

            <PWAInstallControl variant="sidebar" onInstallAccepted={onAppInstalled} />
          </nav>
        </div>

        {/* Bottom User Card */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2.5 min-w-0 text-left flex-1"
          >
            <Avatar
              name={user.name}
              initials={user.initials}
              imageUrl={user.avatarDataUrl}
              size="sm"
              isOnline={user.onlineStatusVisible}
              bgClass="bg-primary-fixed-dim"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-on-surface truncate">{user.name}</span>
              <span className="text-[11px] text-on-surface-variant truncate">@{user.username}</span>
            </div>
          </button>
          <button
            type="button"
            aria-label="Open Settings"
            onClick={() => onNavigate('settings')}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </button>
        </div>
      </aside>

      {/* Desktop Top Bar (lg+) */}
      <header className="hidden lg:flex fixed top-0 left-60 right-0 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-30 items-center justify-between px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onGlobalSearchSubmit();
          }}
          className="relative flex items-center"
        >
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={globalSearchQuery}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            placeholder="Search messages, people..."
            className="h-10 pl-10 pr-4 rounded-xl bg-surface-container-low text-on-surface placeholder:text-on-surface-variant text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/20 w-80 transition-all"
          />
        </form>

        <div className="flex items-center gap-3 relative">
          <PWAInstallControl variant="header" onInstallAccepted={onAppInstalled} />
          <button
            type="button"
            aria-label="Search directory"
            onClick={() => onNavigate('search-people')}
            className="h-10 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-[13px] font-medium flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">person_search</span>
            <span>Find People</span>
          </button>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setShowNotifs((prev) => !prev)}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadTotal > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-container" />
            )}
          </button>
          <button
            type="button"
            aria-label="My Profile"
            onClick={() => onNavigate('profile')}
            className="rounded-full"
          >
            <Avatar
              name={user.name}
              initials={user.initials}
              imageUrl={user.avatarDataUrl}
              size="xs"
              showOnlineDot={false}
              bgClass="bg-primary"
              textClass="text-on-primary"
            />
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-72 bg-surface-container-lowest rounded-2xl shadow-xl p-4 border border-outline-variant/30 z-50 gupshup-notification-enter">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-on-surface">Notifications</span>
                <button
                  type="button"
                  onClick={() => setShowNotifs(false)}
                  className="text-xs text-primary font-medium"
                >
                  Close
                </button>
              </div>
              <p className="text-[13px] text-on-surface-variant">
                {unreadTotal > 0
                  ? `You have ${unreadTotal} unread message${unreadTotal === 1 ? '' : 's'} waiting in Chats.`
                  : 'You are all caught up across your conversations.'}
              </p>
              {unreadTotal > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifs(false);
                    onNavigate('chats');
                  }}
                  className="mt-3 w-full h-9 rounded-xl bg-primary-container text-on-primary text-xs font-semibold"
                >
                  Open Chats
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Top Header (< lg) */}
      {!hideMobileHeader && (
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 pt-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="h-14 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {mobileBackTo ? (
                <button
                  type="button"
                  aria-label="Go back"
                  onClick={() => onNavigate(mobileBackTo)}
                  className="w-11 h-11 -ml-2 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                </button>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shrink-0">
                  <span className="material-symbols-outlined text-[18px] icon-filled">chat</span>
                </div>
              )}
              <h1 className="text-lg font-semibold text-on-surface tracking-tight truncate">
                {mobileTitle ?? 'Gupshup'}
              </h1>
            </div>

            <div className="flex items-center gap-1">
              <PWAInstallControl variant="mobile-header" onInstallAccepted={onAppInstalled} />
              {currentScreen === 'discover' && (
                <button
                  type="button"
                  aria-label="Search People"
                  onClick={() => onNavigate('search-people')}
                  className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[22px]">person_search</span>
                </button>
              )}
              <button
                type="button"
                aria-label="Profile"
                onClick={() => onNavigate('profile')}
                className="w-11 h-11 flex items-center justify-center rounded-full"
              >
                <Avatar
                  name={user.name}
                  initials={user.initials}
                  imageUrl={user.avatarDataUrl}
                  size="xs"
                  showOnlineDot={false}
                  bgClass="bg-primary"
                  textClass="text-on-primary"
                />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <div
        className={`lg:pl-60 ${hideMobileHeader ? 'pt-0' : 'pt-14'} lg:pt-16 ${
          hideMobileBottomNav ? 'pb-0' : 'pb-16'
        } lg:pb-0 min-h-[100dvh]`}
      >
        <div key={currentScreen} className="gupshup-screen-enter">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Tab Bar (< lg) */}
      {!hideMobileBottomNav && (
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-1px_12px_rgba(0,0,0,0.06)] border-t border-outline-variant/20"
        >
          <div className="grid grid-cols-4 items-center h-16 px-2">
            <button
              type="button"
              onClick={() => onNavigate('discover')}
              className={`flex flex-col items-center justify-center h-12 gap-0.5 transition-colors ${
                isDiscoverActive ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] ${
                  isDiscoverActive ? 'icon-filled' : ''
                }`}
              >
                explore
              </span>
              <span className="text-[11px] font-medium">Discover</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('chats')}
              className={`relative flex flex-col items-center justify-center h-12 gap-0.5 transition-colors ${
                isChatsActive ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className={`material-symbols-outlined text-[22px] ${
                    isChatsActive ? 'icon-filled' : ''
                  }`}
                >
                  chat_bubble
                </span>
                {unreadTotal > 0 && (
                  <span className="absolute -top-1 -right-2.5 px-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-on-primary text-[10px] font-bold rounded-full tabular-nums">
                    {unreadTotal}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium">Chats</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('ai-chat')}
              className={`flex flex-col items-center justify-center h-12 gap-0.5 transition-colors ${isAIActive ? 'text-primary' : 'text-on-surface-variant'}`}
            >
              <span className={`material-symbols-outlined text-[22px] ${isAIActive ? 'icon-filled' : ''}`}>auto_awesome</span>
              <span className="text-[11px] font-medium">AI</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className={`flex flex-col items-center justify-center h-12 gap-0.5 transition-colors ${
                isProfileActive ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] ${
                  isProfileActive ? 'icon-filled' : ''
                }`}
              >
                person
              </span>
              <span className="text-[11px] font-medium">Profile</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};
