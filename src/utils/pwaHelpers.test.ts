import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectInstallPlatform,
  detectStandaloneMode,
  isSensitiveRuntimeUrl,
  resolveInstallUiState,
} from './pwaHelpers';

test('detectStandaloneMode recognizes display-mode, iOS standalone, and Android TWA referrer', () => {
  assert.equal(detectStandaloneMode({ displayModeStandalone: true }), true);
  assert.equal(detectStandaloneMode({ navigatorStandalone: true }), true);
  assert.equal(
    detectStandaloneMode({ referrer: 'android-app://com.android.chrome/' }),
    true
  );
  assert.equal(
    detectStandaloneMode({
      displayModeStandalone: false,
      displayModeMinimalUi: false,
      navigatorStandalone: false,
      referrer: 'https://gupshup-180.pages.dev/',
    }),
    false
  );
});

test('detectInstallPlatform distinguishes Android, iOS, and desktop browsers', () => {
  assert.equal(
    detectInstallPlatform(
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36'
    ),
    'android'
  );
  assert.equal(
    detectInstallPlatform(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1'
    ),
    'ios'
  );
  assert.equal(
    detectInstallPlatform(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36'
    ),
    'desktop'
  );
});

test('resolveInstallUiState hides UI when standalone, shows prompt button only when available, and falls back to guide otherwise', () => {
  assert.equal(
    resolveInstallUiState({ isStandalone: true, hasDeferredPrompt: true }),
    'hidden'
  );
  assert.equal(
    resolveInstallUiState({ isStandalone: true, hasDeferredPrompt: false }),
    'hidden'
  );
  assert.equal(
    resolveInstallUiState({ isStandalone: false, hasDeferredPrompt: true }),
    'prompt-button'
  );
  assert.equal(
    resolveInstallUiState({ isStandalone: false, hasDeferredPrompt: false }),
    'manual-guide'
  );
});

test('isSensitiveRuntimeUrl protects Supabase, Google Auth/Drive, and API routes from caching', () => {
  assert.equal(
    isSensitiveRuntimeUrl('https://xyzproject.supabase.co/auth/v1/token'),
    true
  );
  assert.equal(
    isSensitiveRuntimeUrl('https://xyzproject.supabase.co/rest/v1/messages'),
    true
  );
  assert.equal(
    isSensitiveRuntimeUrl('https://www.googleapis.com/drive/v3/files'),
    true
  );
  assert.equal(isSensitiveRuntimeUrl('https://accounts.google.com/o/oauth2/v2/auth'), true);
  assert.equal(isSensitiveRuntimeUrl('https://gupshup-180.pages.dev/api/ai/analyze'), true);
  assert.equal(isSensitiveRuntimeUrl('https://gupshup-180.pages.dev/auth/callback?code=abc'), true);
  assert.equal(isSensitiveRuntimeUrl('https://gupshup-180.pages.dev/pwa-512x512.png'), false);
  assert.equal(isSensitiveRuntimeUrl('https://fonts.googleapis.com/css2?family=Inter'), false);
});
