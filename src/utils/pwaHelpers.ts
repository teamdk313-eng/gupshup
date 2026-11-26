export type InstallPlatform = 'android' | 'ios' | 'desktop';

export type InstallUiMode = 'hidden' | 'prompt-button' | 'manual-guide';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

declare global {
  interface Window {
    __deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function detectStandaloneMode(options: {
  displayModeStandalone?: boolean;
  displayModeMinimalUi?: boolean;
  navigatorStandalone?: boolean;
  referrer?: string;
}): boolean {
  if (options.displayModeStandalone || options.displayModeMinimalUi) {
    return true;
  }
  if (options.navigatorStandalone === true) {
    return true;
  }
  if (options.referrer && options.referrer.startsWith('android-app://')) {
    return true;
  }
  return false;
}

export function detectInstallPlatform(userAgent: string): InstallPlatform {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios';
  }
  if (/android/.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

export function resolveInstallUiState(params: {
  isStandalone: boolean;
  hasDeferredPrompt: boolean;
}): InstallUiMode {
  if (params.isStandalone) {
    return 'hidden';
  }
  if (params.hasDeferredPrompt) {
    return 'prompt-button';
  }
  return 'manual-guide';
}

export function isSensitiveRuntimeUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString, 'https://gupshup-180.pages.dev');
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    if (pathname.startsWith('/api/') || pathname.startsWith('/auth/')) {
      return true;
    }
    if (host.endsWith('.supabase.co') || host.endsWith('.supabase.in')) {
      return true;
    }
    if (
      host === 'accounts.google.com' ||
      host === 'oauth2.googleapis.com' ||
      (host.endsWith('googleapis.com') &&
        (pathname.startsWith('/drive/') ||
          pathname.startsWith('/oauth2/') ||
          pathname.startsWith('/userinfo/')))
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
