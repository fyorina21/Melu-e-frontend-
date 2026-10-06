// src/api/token.ts
//
// Token storage abstraction used by the http client.
// On web it persists via localStorage; on native it holds the token in
// memory for the lifetime of the process (swap in a secure store like
// expo-secure-store when it is added to the project).

import { Platform } from 'react-native';
import { isDemoMode } from './config/env';

const TOKEN_KEY = 'melue.auth.token';
const REFRESH_TOKEN_KEY = 'melue.auth.refreshToken';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export async function loadToken(): Promise<string | null> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    accessToken = localStorage.getItem(TOKEN_KEY);
    refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    return accessToken;
  }
  return accessToken;
}

export async function setAccessToken(token: string | null): Promise<void> {
  accessToken = token;
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }
}

export async function setRefreshToken(token: string | null): Promise<void> {
  refreshToken = token;
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

/** Epoch millis of the current access token's `exp` claim, or null if unreadable. */
export function getAccessTokenExpiryMs(): number | null {
  if (!accessToken) return null;
  try {
    const base64 = accessToken.split('.')[1] ?? '';
    const json = decodeURIComponent(
      atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const exp = Number(JSON.parse(json).exp);
    return Number.isFinite(exp) ? exp * 1000 : null;
  } catch {
    return null;
  }
}
