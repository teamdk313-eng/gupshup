import { useCallback, useEffect, useState } from 'react';
import {
  type BeforeInstallPromptEvent,
  detectInstallPlatform,
  detectStandaloneMode,
  type InstallPlatform,
  resolveInstallUiState,
} from '../utils/pwaHelpers';

function readIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return detectStandaloneMode({
    displayModeStandalone: window.matchMedia('(display-mode: standalone)').matches,
    displayModeMinimalUi: window.matchMedia('(display-mode: minimal-ui)').matches,
    navigatorStandalone: (window.navigator as unknown as { standalone?: boolean }).standalone === true,
    referrer: typeof document !== 'undefined' ? document.referrer : '',
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.__deferredPWAInstallPrompt ?? null;
  });
  const [isInstalled, setIsInstalled] = useState<boolean>(readIsStandalone);
  const [platform, setPlatform] = useState<InstallPlatform>(() =>
    typeof navigator !== 'undefined' ? detectInstallPlatform(navigator.userAgent) : 'desktop'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsInstalled(readIsStandalone());
    setPlatform(detectInstallPlatform(window.navigator.userAgent));

    if (window.__deferredPWAInstallPrompt && !deferredPrompt) {
      setDeferredPrompt(window.__deferredPWAInstallPrompt);
    }

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      setIsInstalled(readIsStandalone());
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      window.__deferredPWAInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      window.__deferredPWAInstallPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    standaloneQuery.addEventListener?.('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneQuery.removeEventListener?.('change', handleDisplayModeChange);
    };
  }, [deferredPrompt]);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const activePrompt = deferredPrompt ?? window.__deferredPWAInstallPrompt ?? null;
    if (!activePrompt) return 'unavailable';

    await activePrompt.prompt();
    const { outcome } = await activePrompt.userChoice;
    if (outcome === 'accepted') {
      window.__deferredPWAInstallPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
      return 'accepted';
    }
    // Deferred prompt can only be used once per event in Chromium
    window.__deferredPWAInstallPrompt = null;
    setDeferredPrompt(null);
    return 'dismissed';
  }, [deferredPrompt]);

  const uiMode = resolveInstallUiState({
    isStandalone: isInstalled,
    hasDeferredPrompt: Boolean(deferredPrompt),
  });

  return {
    isInstallable: uiMode === 'prompt-button',
    isInstalled,
    uiMode,
    platform,
    install,
  };
}
