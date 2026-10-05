// src/api/token.ts
//
// Token storage abstraction used by the http client.
//
// Storage is selected per platform:
//   - web    -> `localStorage`, so a reload keeps the session
//   - native -> `expo-secure-store` (keychain / keystore), so the session
//               survives an app restart; overridable via
//               `setNativeStorageBackend`
//   - if persistent access is unavailable, process memory as a last resort
//
// Native runtimes have no `localStorage`; touching it there is a hard
// ReferenceError, so the web backend is only ever constructed behind a
// `Platform.OS === 'web'` guard. Storage can also be present but throw
// (blocked cookies, private mode, quota), so every access is defensive.

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'melue.auth.token';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

let accessToken: string | null = null;

function createWebStorage(): KeyValueStorage | null {
  if (Platform.OS !== 'web') return null;

  try {
    if (typeof localStorage === 'undefined') return null;

    // Probe once: some environments expose the object but throw on access.
    const probe = '__melue_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
  } catch {
    return null;
  }

  return {
    async getItem(key) {
      return localStorage.getItem(key);
    },
    async setItem(key, value) {
      localStorage.setItem(key, value);
    },
    async removeItem(key) {
      localStorage.removeItem(key);
    },
  };
}

/**
 * In-memory backend used on native when no persistent store is registered, and
 * as a last-resort fallback if persistent access throws.
 */
const memoryStorage: KeyValueStorage = {
  async getItem(key) {
    return key === TOKEN_KEY ? accessToken : null;
  },
  async setItem(key, value) {
    if (key === TOKEN_KEY) accessToken = value;
  },
  async removeItem(key) {
    if (key === TOKEN_KEY) accessToken = null;
  },
};

/**
 * Persistent native backend backed by the device keychain / keystore via
 * expo-secure-store. Only constructed on native: the module is a no-op that
 * throws when called on web, so the platform guard is required, not stylistic.
 * SecureStore keys allow alphanumerics, ".", "-" and "_", which TOKEN_KEY fits.
 */
function createSecureStoreStorage(): KeyValueStorage | null {
  if (Platform.OS === 'web') return null;

  return {
    async getItem(key) {
      return SecureStore.getItemAsync(key);
    },
    async setItem(key, value) {
      await SecureStore.setItemAsync(key, value);
    },
    async removeItem(key) {
      await SecureStore.deleteItemAsync(key);
    },
  };
}

const secureStoreStorage = createSecureStoreStorage();

let nativeBackend: KeyValueStorage | null = null;

/**
 * Register a native backend to override the built-in SecureStore one.
 * Useful for tests, or to swap in a different keystore.
 */
export function setNativeStorageBackend(backend: KeyValueStorage | null): void {
  nativeBackend = backend;
}

function resolveStorage(): KeyValueStorage {
  return createWebStorage() ?? nativeBackend ?? secureStoreStorage ?? memoryStorage;
}

export function getAccessToken(): string | null {
  if (!accessToken && Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    accessToken = localStorage.getItem(TOKEN_KEY);
  }

  if (
    !accessToken ||
    accessToken === 'undefined' ||
    accessToken === 'null' ||
    accessToken.trim() === ''
  ) {
    return null;
  }

  if (accessToken.startsWith('Bearer ')) {
    accessToken = accessToken.replace(/^Bearer\s+/i, '');
  }

  return accessToken;
}

export async function loadToken(): Promise<string | null> {
  try {
    accessToken = await resolveStorage().getItem(TOKEN_KEY);
  } catch (err) {
    console.warn('Failed to read stored auth token:', err);
  }

  return getAccessToken();
}

export async function setAccessToken(token: string | null): Promise<void> {
  if (
    !token ||
    token === 'undefined' ||
    token === 'null' ||
    token.trim() === ''
  ) {
    accessToken = null;

    try {
      await resolveStorage().removeItem(TOKEN_KEY);
    } catch (err) {
      console.warn('Failed to remove stored auth token:', err);
    }

    return;
  }

  const cleanToken = token.startsWith('Bearer ')
    ? token.replace(/^Bearer\s+/i, '')
    : token.trim();

  accessToken = cleanToken;

  try {
    await resolveStorage().setItem(TOKEN_KEY, cleanToken);
  } catch (err) {
    console.warn('Failed to persist auth token:', err);
  }
}