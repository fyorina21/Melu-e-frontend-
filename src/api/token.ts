// src/api/token.ts
//
// Token storage abstraction used by the http client.
// On web it persists via localStorage; on native it holds the token in
// memory for the lifetime of the process (swap in a secure store like
// expo-secure-store when it is added to the project).

import { Platform } from 'react-native';
import { isDemoMode } from './config/env';

const TOKEN_KEY = 'melue.auth.token';

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  if (!accessToken && typeof localStorage !== 'undefined') {
    accessToken = localStorage.getItem(TOKEN_KEY);
  }
  if (!accessToken || accessToken === 'undefined' || accessToken === 'null' || accessToken.trim() === '') {
    return null;
  }
  if (accessToken.startsWith('Bearer ')) {
    accessToken = accessToken.replace(/^Bearer\s+/i, '');
  }
  return accessToken;
}

export async function loadToken(): Promise<string | null> {
  return getAccessToken();
}

export async function setAccessToken(token: string | null): Promise<void> {
  if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
    accessToken = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    return;
  }
  const cleanToken = token.startsWith('Bearer ') ? token.replace(/^Bearer\s+/i, '') : token.trim();
  accessToken = cleanToken;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, cleanToken);
  }
}