import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import type { BeforeInstallPromptEvent } from './utils/pwaHelpers';

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    window.__deferredPWAInstallPrompt = event as BeforeInstallPromptEvent;
  });

  if ('serviceWorker' in navigator) {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let updateToastSent = false;

    const notifyUpdateReady = () => {
      if (updateToastSent) return;
      updateToastSent = true;
      window.dispatchEvent(new CustomEvent('gupshup:pwa-update-ready'));
    };

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) {
        notifyUpdateReady();
      }
    });

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        notifyUpdateReady();
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;

        const checkForUpdates = () => {
          if (navigator.onLine) {
            registration.update().catch(() => {});
          }
        };

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            checkForUpdates();
          }
        });

        window.setInterval(checkForUpdates, 30 * 60 * 1000);
      },
      onRegisterError(error) {
        console.warn('Service worker registration failed:', error);
      },
    });

    window.addEventListener('gupshup:apply-pwa-update', () => {
      void updateSW(true);
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
