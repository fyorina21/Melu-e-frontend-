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
  return accessToken;
}

export async function loadToken(): Promise<string | null> {
  if (isDemoMode) return null;
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    accessToken = localStorage.getItem(TOKEN_KEY);
    return accessToken;
  }
  return accessToken;
}

export async function setAccessToken(token: string | null): Promise<void> {
  accessToken = token;
  if (isDemoMode) return;
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }
}