import React, { useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type { InstallPlatform } from '../utils/pwaHelpers';

interface PWAInstallControlProps {
  variant: 'welcome' | 'header' | 'sidebar' | 'mobile-header' | 'settings';
  onInstallAccepted?: () => void;
}

export const PWAInstallControl: React.FC<PWAInstallControlProps> = ({
  variant,
  onInstallAccepted,
}) => {
  const { isInstallable, isInstalled, platform, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [busy, setBusy] = useState(false);

  // Never show install controls once Gupshup is running in standalone mode
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const outcome = await install();
      if (outcome === 'accepted') {
        onInstallAccepted?.();
      } else if (outcome === 'unavailable') {
        setShowGuideModal(true);
      }
    } finally {
      setBusy(false);
    }
  };

  if (variant === 'settings') {
    return (
      <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">install_mobile</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-on-surface">Install Gupshup App</h3>
              <p className="text-xs text-on-surface-variant">
                {isInstallable
                  ? 'Install Gupshup on your device for full-screen standalone launch'
                  : 'Add Gupshup to your Android or mobile home screen as an app'}
              </p>
            </div>
          </div>

          {isInstallable ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleInstallClick()}
              className="h-10 px-4 rounded-xl bg-primary-container hover:bg-primary disabled:opacity-60 text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">download</span>
              <span>Install App</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="h-10 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">add_to_home_screen</span>
              <span>How to Install</span>
            </button>
          )}
        </div>

        {!isInstallable && <InstallStepsInline platform={platform} />}

        {showGuideModal && (
          <InstallGuideModal
            platform={platform}
            onClose={() => setShowGuideModal(false)}
          />
        )}
      </div>
    );
  }

  if (variant === 'welcome') {
    return (
      <>
        {isInstallable ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleInstallClick()}
            className="w-full h-11 rounded-[14px] bg-secondary-container/75 hover:bg-secondary-container text-on-secondary-container text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[19px]">install_mobile</span>
            <span>Install App</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="w-full py-2 px-3 rounded-xl text-xs font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add_to_home_screen</span>
            <span>Add Gupshup to Android Home Screen</span>
          </button>
        )}

        {showGuideModal && (
          <InstallGuideModal
            platform={platform}
            onClose={() => setShowGuideModal(false)}
          />
        )}
      </>
    );
  }

  if (variant === 'sidebar') {
    if (!isInstallable) {
      return (
        <>
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="flex items-center justify-between px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px]">add_to_home_screen</span>
              <span className="text-sm font-semibold">Install Guide</span>
            </div>
          </button>
          {showGuideModal && (
            <InstallGuideModal
              platform={platform}
              onClose={() => setShowGuideModal(false)}
            />
          )}
        </>
      );
    }

    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleInstallClick()}
        className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-primary-fixed/80 hover:bg-primary-fixed text-on-primary-fixed transition-colors disabled:opacity-60"
      >
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-primary">install_mobile</span>
          <span className="text-sm font-semibold">Install App</span>
        </div>
      </button>
    );
  }

  if (variant === 'mobile-header') {
    if (isInstallable) {
      return (
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleInstallClick()}
          className="h-9 px-3 rounded-xl bg-primary-container text-on-primary text-xs font-semibold flex items-center gap-1 shadow-xs active:scale-[0.98] transition-all shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          <span>Install App</span>
        </button>
      );
    }

    return (
      <>
        <button
          type="button"
          aria-label="How to install Gupshup app"
          onClick={() => setShowGuideModal(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">add_to_home_screen</span>
        </button>
        {showGuideModal && (
          <InstallGuideModal
            platform={platform}
            onClose={() => setShowGuideModal(false)}
          />
        )}
      </>
    );
  }

  // variant === 'header' (Desktop top bar)
  if (!isInstallable) {
    return null;
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void handleInstallClick()}
      className="h-10 px-3.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary text-[13px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-60"
    >
      <span className="material-symbols-outlined text-[18px]">download</span>
      <span>Install App</span>
    </button>
  );
};

function InstallStepsInline({ platform }: { platform: InstallPlatform }) {
  if (platform === 'ios') {
    return (
      <div className="p-3.5 rounded-2xl bg-surface-container-low text-xs text-on-surface-variant space-y-1">
        <div className="font-semibold text-on-surface">Install on iPhone or iPad (Safari):</div>
        <p>
          1. Tap the <strong>Share</strong> icon in Safari&apos;s toolbar. 2. Tap{' '}
          <strong>Add to Home Screen</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-2xl bg-surface-container-low text-xs text-on-surface-variant space-y-1">
      <div className="font-semibold text-on-surface">Install on Android Chrome:</div>
      <p>
        1. Open Chrome&apos;s <strong>⋮</strong> menu in the top right. 2. Tap{' '}
        <strong>Install app</strong> or <strong>Add to Home screen</strong>.
      </p>
    </div>
  );
}

const InstallGuideModal: React.FC<{
  platform: InstallPlatform;
  onClose: () => void;
}> = ({ platform, onClose }) => {
  const [selectedTab, setSelectedTab] = useState<'android' | 'ios' | 'desktop'>(
    platform === 'ios' ? 'ios' : 'android'
  );

  return (
    <div
      className="fixed inset-0 z-[80] bg-on-surface/45 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-guide-title"
    >
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/20 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">install_mobile</span>
            </div>
            <div>
              <h2 id="install-guide-title" className="text-lg font-bold text-on-surface">
                Install Gupshup
              </h2>
              <p className="text-xs text-on-surface-variant">
                Use Gupshup like a standalone mobile app
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close install instructions"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-surface-container-low">
          {(
            [
              { id: 'android', label: 'Android Chrome' },
              { id: 'ios', label: 'iOS Safari' },
              { id: 'desktop', label: 'Desktop' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id)}
              className={`h-8 rounded-lg text-xs font-semibold transition-colors ${
                selectedTab === tab.id
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {selectedTab === 'android' && (
          <ol className="space-y-2.5 text-sm text-on-surface-variant">
            <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container-low/70">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <span>
                Open this site in <strong>Google Chrome</strong> on your Android phone.
              </span>
            </li>
            <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container-low/70">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <span>
                Tap the <strong>⋮</strong> menu icon in the top-right corner of Chrome.
              </span>
            </li>
            <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container-low/70">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary text-xs font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <span>
                Tap <strong>&ldquo;Install app&rdquo;</strong> or{' '}
                <strong>&ldquo;Add to Home screen&rdquo;</strong>, then confirm{' '}
                <strong>Install</strong>.
              </span>
            </li>
          </ol>
        )}

        {selectedTab === 'ios' && (
          <ol className="space-y-2.5 text-sm text-on-surface-variant">
            <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container-low/70">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <span>
                Open Gupshup in <strong>Safari</strong> on your iPhone or iPad.
              </span>
            </li>
            <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container-low/70">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <span>
                Tap the <strong>Share</strong> button in Safari&apos;s toolbar.
              </span>
            </li>
            <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container-low/70">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary text-xs font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <span>
                Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>, then tap{' '}
                <strong>Add</strong>.
              </span>
            </li>
          </ol>
        )}

        {selectedTab === 'desktop' && (
          <ol className="space-y-2.5 text-sm text-on-surface-variant">
            <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container-low/70">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <span>
                In <strong>Chrome</strong> or <strong>Edge</strong>, look for the{' '}
                <strong>Install</strong> icon on the right side of the address bar.
              </span>
            </li>
            <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container-low/70">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <span>
                Or open <strong>⋮ → Cast, save, and share → Install page as app</strong>.
              </span>
            </li>
          </ol>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-[14px] bg-primary-container hover:bg-primary text-on-primary text-sm font-semibold transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[95] px-3.5 py-2 rounded-xl bg-inverse-surface text-inverse-on-surface shadow-lg flex items-center gap-2 text-xs font-medium max-w-[92vw]"
    >
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
      <span className="truncate">
        Offline mode — Connect to internet for login and live messages
      </span>
    </div>
  );
};
