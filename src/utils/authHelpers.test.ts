import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractSafeProfileFromMetadata,
  formatSupabaseAuthError,
  isProtectedScreen,
  parseAuthCallbackFromUrl,
  resolveRouteAccess,
} from './authHelpers';

test('isProtectedScreen and resolveRouteAccess enforce protected route boundaries', () => {
  assert.equal(isProtectedScreen('welcome'), false);
  assert.equal(isProtectedScreen('onboarding'), false);
  assert.equal(isProtectedScreen('privacy-policy'), false);

  assert.equal(isProtectedScreen('discover'), true);
  assert.equal(isProtectedScreen('chats'), true);
  assert.equal(isProtectedScreen('profile'), true);
  assert.equal(isProtectedScreen('settings'), true);
  assert.equal(isProtectedScreen('delete-account'), true);

  // Unauthenticated and not in Quick Start demo preview -> blocked back to welcome
  assert.equal(resolveRouteAccess('chats', false, false), 'welcome');
  assert.equal(resolveRouteAccess('profile', false, false), 'welcome');
  assert.equal(resolveRouteAccess('privacy-policy', false, false), 'privacy-policy');

  // Authenticated Supabase session -> allowed
  assert.equal(resolveRouteAccess('chats', true, false), 'chats');
  assert.equal(resolveRouteAccess('settings', true, false), 'settings');

  // Quick Start demo preview -> allowed for preview UI without faking Supabase session
  assert.equal(resolveRouteAccess('discover', false, true), 'discover');
});

test('parseAuthCallbackFromUrl parses PKCE codes, hash tokens, and OAuth errors cleanly', () => {
  const pkce = parseAuthCallbackFromUrl('?code=abc-123', '');
  assert.equal(pkce.hasCallbackParams, true);
  assert.equal(pkce.code, 'abc-123');
  assert.equal(pkce.error, null);

  const cancelled = parseAuthCallbackFromUrl(
    '?error=access_denied&error_description=User+denied+access',
    ''
  );
  assert.equal(cancelled.hasCallbackParams, true);
  assert.equal(cancelled.error, 'access_denied');
  assert.equal(cancelled.errorDescription, 'User denied access');

  const hashErr = parseAuthCallbackFromUrl('', '#error=server_error&error_code=500');
  assert.equal(hashErr.hasCallbackParams, true);
  assert.equal(hashErr.error, 'server_error');
  assert.equal(hashErr.errorCode, '500');

  const clean = parseAuthCallbackFromUrl('', '');
  assert.equal(clean.hasCallbackParams, false);
});

test('formatSupabaseAuthError maps OAuth errors to user-friendly non-Firebase messages', () => {
  const cancelled = formatSupabaseAuthError('User denied access', 'access_denied');
  assert.match(cancelled, /cancelled/i);
  assert.doesNotMatch(cancelled, /firebase/i);

  const disabled = formatSupabaseAuthError('Unsupported provider: provider is not enabled');
  assert.match(disabled, /Supabase project/i);

  const fallback = formatSupabaseAuthError(null, null);
  assert.match(fallback, /Unable to complete Google sign-in/i);
});

test('extractSafeProfileFromMetadata rejects unsafe avatar URLs and resolves display names', () => {
  const valid = extractSafeProfileFromMetadata({
    email: 'ali@example.com',
    metadata: {
      full_name: 'Ali Raza',
      avatar_url: 'https://lh3.googleusercontent.com/a/photo.jpg',
    },
  });
  assert.equal(valid.name, 'Ali Raza');
  assert.equal(valid.email, 'ali@example.com');
  assert.equal(valid.avatarUrl, 'https://lh3.googleusercontent.com/a/photo.jpg');

  const unsafe = extractSafeProfileFromMetadata({
    email: 'ali@example.com',
    metadata: {
      avatar_url: 'javascript:alert(1)',
    },
  });
  assert.equal(unsafe.name, 'ali');
  assert.equal(unsafe.avatarUrl, undefined);
});
