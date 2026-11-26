import type { Session } from '@supabase/supabase-js';
import {
  getMissingSupabaseEnvVars,
  getSupabaseRedirectUrl,
  supabase,
} from '../lib/supabase';
import type { DriveFileItem } from '../types/gupshup';
import { formatSupabaseAuthError } from '../utils/authHelpers';

const DRIVE_SCOPES =
  'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';

// Google OAuth provider token is strictly kept in JS memory (never localStorage or sessionStorage).
let memoryAccessToken: string | null = null;
let connectedGoogleEmail: string | null = null;

export function syncDriveTokenFromSession(session: Session | null): void {
  if (!session) {
    memoryAccessToken = null;
    connectedGoogleEmail = null;
    return;
  }

  if (session.provider_token) {
    memoryAccessToken = session.provider_token;
    connectedGoogleEmail = session.user.email ?? null;
  } else if (session.user.email) {
    connectedGoogleEmail = session.user.email;
  }
}

export function getDriveConnectionState(): {
  connected: boolean;
  email: string | null;
} {
  return {
    connected: Boolean(memoryAccessToken),
    email: connectedGoogleEmail,
  };
}

export function clearDriveToken(): void {
  memoryAccessToken = null;
  connectedGoogleEmail = null;
}

async function startGoogleOAuth(scopes?: string): Promise<void> {
  if (!supabase) {
    const missing = getMissingSupabaseEnvVars().join(' and ');
    throw new Error(
      `Supabase Auth is not configured yet. Please set ${missing} in your environment variables.`
    );
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getSupabaseRedirectUrl(),
      ...(scopes ? { scopes } : {}),
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    throw new Error(formatSupabaseAuthError(error.message, error.code));
  }

  if (!data?.url) {
    throw new Error('Could not start Google sign-in via Supabase. Please try again.');
  }
}

export async function signInWithGoogleSupabase(): Promise<void> {
  // Keep primary authentication limited to standard identity scopes.
  // Google Drive permissions are requested only when the user explicitly connects Drive.
  await startGoogleOAuth();
}

export async function connectGoogleDrive(): Promise<void> {
  await startGoogleOAuth(DRIVE_SCOPES);
}

export async function signOutSupabase(): Promise<void> {
  clearDriveToken();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(formatSupabaseAuthError(error.message, error.code));
  }
}

export async function listDriveFiles(searchQuery = ''): Promise<DriveFileItem[]> {
  if (!memoryAccessToken) {
    throw new Error(
      'Google Drive is not connected in this session. Continue with Google to browse your Drive.'
    );
  }

  const sanitized = searchQuery.trim().replace(/'/g, "\\'");
  const qParts = ['trashed = false'];
  if (sanitized) {
    qParts.push(`name contains '${sanitized}'`);
  }

  const params = new URLSearchParams({
    pageSize: '20',
    orderBy: 'modifiedTime desc',
    q: qParts.join(' and '),
    fields: 'files(id,name,mimeType,size,modifiedTime,thumbnailLink,webViewLink,iconLink)',
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${memoryAccessToken}`,
    },
  });

  if (response.status === 401) {
    clearDriveToken();
    throw new Error('Google Drive session expired. Please sign in with Google again.');
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Could not load Google Drive files (${response.status}). ${errText}`.trim());
  }

  const data = (await response.json()) as { files?: DriveFileItem[] };
  return data.files ?? [];
}

export async function downloadDriveImageAsDataUrl(fileId: string): Promise<string> {
  if (!memoryAccessToken) {
    throw new Error('Google Drive session is not active.');
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${memoryAccessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Drive image (${response.status}).`);
  }

  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read Drive image data.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to decode Drive image.'));
    reader.readAsDataURL(blob);
  });
}

export async function uploadFileToDrive(params: {
  name: string;
  mimeType: string;
  blob: Blob;
  description?: string;
}): Promise<{ id: string; name: string; webViewLink?: string }> {
  if (!memoryAccessToken) {
    throw new Error('Sign in with Google first to save files to your Drive.');
  }

  const boundary = `gupshup_drive_${Date.now()}`;
  const metadata = JSON.stringify({
    name: params.name,
    mimeType: params.mimeType,
    description: params.description ?? 'Saved from Gupshup',
  });

  const bodyBlob = new Blob(
    [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
      metadata,
      `\r\n--${boundary}\r\nContent-Type: ${params.mimeType}\r\n\r\n`,
      params.blob,
      `\r\n--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${memoryAccessToken}`,
      },
      body: bodyBlob,
    }
  );

  if (response.status === 401) {
    clearDriveToken();
    throw new Error('Google Drive session expired. Please sign in with Google again.');
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Failed to save to Google Drive (${response.status}). ${errText}`.trim());
  }

  return (await response.json()) as { id: string; name: string; webViewLink?: string };
}
