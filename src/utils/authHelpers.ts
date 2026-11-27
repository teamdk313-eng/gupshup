import type { AppScreen } from '../types/gupshup';

export interface ParsedAuthCallback {
  hasCallbackParams: boolean;
  code: string | null;
  accessTokenInHash: boolean;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
}

const PROTECTED_SCREENS = new Set<AppScreen>([
  'discover',
  'search-people',
  'chats',
  'chat',
  'ai-chat',
  'contact-info',
  'profile',
  'edit-profile',
  'settings',
  'blocked-users',
  'delete-account',
]);

export function isProtectedScreen(screen: AppScreen): boolean {
  return PROTECTED_SCREENS.has(screen);
}

export function resolveRouteAccess(
  requestedScreen: AppScreen,
  hasSupabaseSession: boolean,
  isDemoPreview: boolean
): AppScreen {
  if (isProtectedScreen(requestedScreen) && !hasSupabaseSession && !isDemoPreview) {
    return 'welcome';
  }
  return requestedScreen;
}

export function parseAuthCallbackFromUrl(
  search: string,
  hash: string
): ParsedAuthCallback {
  const queryParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const hashString = hash.startsWith('#') ? hash.slice(1) : hash;
  const hashParams = new URLSearchParams(hashString);

  const code = queryParams.get('code');
  const accessTokenInHash = hashParams.has('access_token');
  const error = queryParams.get('error') || hashParams.get('error');
  const errorCode = queryParams.get('error_code') || hashParams.get('error_code');
  const errorDescription =
    queryParams.get('error_description') || hashParams.get('error_description');

  return {
    hasCallbackParams: Boolean(code || accessTokenInHash || error || errorCode),
    code,
    accessTokenInHash,
    error,
    errorCode,
    errorDescription,
  };
}

export function formatSupabaseAuthError(
  rawMessage?: string | null,
  errorCode?: string | null
): string {
  const combined = `${errorCode ?? ''} ${rawMessage ?? ''}`.toLowerCase();

  if (
    combined.includes('access_denied') ||
    combined.includes('user denied') ||
    combined.includes('cancelled') ||
    combined.includes('canceled')
  ) {
    return 'Google sign-in was cancelled. You can try again whenever you are ready.';
  }

  if (
    combined.includes('provider is not enabled') ||
    combined.includes('unsupported provider')
  ) {
    return 'Google sign-in is not enabled in your Supabase project yet. Enable Google under Authentication → Providers.';
  }

  if (combined.includes('redirect') && combined.includes('mismatch')) {
    return 'Google OAuth redirect URL mismatch. Add your Supabase callback URL in Google Cloud Console.';
  }

  if (combined.includes('invalid') && combined.includes('grant')) {
    return 'This login session expired. Please click Continue with Google again.';
  }

  if (rawMessage && rawMessage.trim().length > 0) {
    return rawMessage.replace(/\s+/g, ' ').trim();
  }

  return 'Unable to complete Google sign-in right now. Please try again.';
}

export function extractSafeProfileFromMetadata(params: {
  email?: string | null;
  metadata?: Record<string, unknown> | null;
}): {
  name: string;
  email: string;
  avatarUrl?: string;
} {
  const meta = params.metadata ?? {};
  const rawName =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    (params.email ? params.email.split('@')[0] : 'Gupshup Member');

  const rawAvatar =
    (typeof meta.avatar_url === 'string' && meta.avatar_url.trim()) ||
    (typeof meta.picture === 'string' && meta.picture.trim()) ||
    '';

  let safeAvatar: string | undefined;
  if (rawAvatar) {
    try {
      const u = new URL(rawAvatar);
      if (u.protocol === 'https:' || u.protocol === 'http:') {
        safeAvatar = u.toString();
      }
    } catch {
      safeAvatar = undefined;
    }
  }

  return {
    name: rawName,
    email: params.email?.trim() || 'user@gmail.com',
    avatarUrl: safeAvatar,
  };
}
