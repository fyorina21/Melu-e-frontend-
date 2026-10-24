// src/utils/storage.ts
//
// Unified KeyValueStorage abstraction supporting Web (localStorage),
// Native (expo-secure-store), and in-memory fallback.
// Safe in private browsing, SSR, and cross-platform runtimes.

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getSync(key: string): string | null;
  setSync(key: string, value: string): void;
  removeSync(key: string): void;
  getJSON<T>(key: string, fallback?: T): Promise<T | null>;
  setJSON<T>(key: string, value: T): Promise<void>;
  getJSONSync<T>(key: string, fallback?: T): T | null;
  setJSONSync<T>(key: string, value: T): void;
}

const memoryStore = new Map<string, string>();

function isWebLocalStorageAvailable(): boolean {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') {
    return false;
  }
  try {
    const probe = '__melue_storage_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function toSecureKey(key: string): string {
  const sanitized = (key || '').replace(/[^a-zA-Z0-9._-]/g, '_');
  return sanitized || 'melue_default_key';
}

class UnifiedStorage implements KeyValueStorage {
  private get hasLocalStorage(): boolean {
    return isWebLocalStorageAvailable();
  }

  // --- Async Methods ---

  async getItem(key: string): Promise<string | null> {
    if (this.hasLocalStorage) {
      try {
        const val = localStorage.getItem(key);
        if (val !== null) {
          memoryStore.set(key, val);
          return val;
        }
      } catch {
        return memoryStore.get(key) ?? null;
      }
    }

    if (Platform.OS !== 'web') {
      try {
        const val = await SecureStore.getItemAsync(toSecureKey(key));
        if (val !== null) {
          memoryStore.set(key, val);
          return val;
        }
        return memoryStore.get(key) ?? null;
      } catch {
        return memoryStore.get(key) ?? null;
      }
    }

    return memoryStore.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    memoryStore.set(key, value);

    if (this.hasLocalStorage) {
      try {
        localStorage.setItem(key, value);
      } catch {
        // storage quota exceeded or disabled
      }
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(toSecureKey(key), value);
      } catch {
        // secure store unavailable
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    memoryStore.delete(key);

    if (this.hasLocalStorage) {
      try {
        localStorage.removeItem(key);
      } catch {}
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        await SecureStore.deleteItemAsync(toSecureKey(key));
      } catch {}
    }
  }

  // --- Synchronous Helpers (Web / In-Memory) ---

  getSync(key: string): string | null {
    if (this.hasLocalStorage) {
      try {
        const val = localStorage.getItem(key);
        if (val !== null) {
          memoryStore.set(key, val);
          return val;
        }
      } catch {}
    }
    return memoryStore.get(key) ?? null;
  }

  setSync(key: string, value: string): void {
    memoryStore.set(key, value);
    if (this.hasLocalStorage) {
      try {
        localStorage.setItem(key, value);
      } catch {}
    } else if (Platform.OS !== 'web') {
      try {
        SecureStore.setItemAsync(toSecureKey(key), value).catch(() => {});
      } catch {}
    }
  }

  removeSync(key: string): void {
    memoryStore.delete(key);
    if (this.hasLocalStorage) {
      try {
        localStorage.removeItem(key);
      } catch {}
    } else if (Platform.OS !== 'web') {
      try {
        SecureStore.deleteItemAsync(toSecureKey(key)).catch(() => {});
      } catch {}
    }
  }

  // --- JSON Helpers ---

  async getJSON<T>(key: string, fallback: T | null = null): Promise<T | null> {
    const raw = await this.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  async setJSON<T>(key: string, value: T): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  }

  getJSONSync<T>(key: string, fallback: T | null = null): T | null {
    const raw = this.getSync(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  setJSONSync<T>(key: string, value: T): void {
    this.setSync(key, JSON.stringify(value));
  }
}

export const storage: KeyValueStorage = new UnifiedStorage();
export default storage;
