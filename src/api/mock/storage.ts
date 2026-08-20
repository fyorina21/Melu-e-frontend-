// src/api/mock/storage.ts
//
// Persistence adapter for the demo database.
//
// Mirrors the pattern already used by src/api/token.ts: on web the store is
// backed by localStorage; on native it falls back to an in-memory Map for
// the lifetime of the process. The database layer depends only on this
// small interface, so a real secure store can be swapped in later without
// touching the rest of the mock.

import { Platform } from 'react-native';

export interface MockStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

const memory = new Map<string, string>();

function createMemoryStorage(): MockStorage {
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => void memory.set(key, value),
    removeItem: (key) => void memory.delete(key),
    clear: () => void memory.clear(),
  };
}

/** Locates a usable localStorage, or null when none is available. */
function backingStorage(): Storage | null {
  const globalStorage = (globalThis as Record<string, unknown>).localStorage as
    | Storage
    | null
    | undefined;
  if (globalStorage && typeof globalStorage.getItem === 'function') return globalStorage;
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      return localStorage;
    }
  } catch {
    // localStorage access can throw in restricted webviews.
  }
  return null;
}

const memoryStorage = createMemoryStorage();

/**
 * Best-available storage. On web (browser or react-native-web) this is
 * real localStorage, which survives reloads; the backing store is resolved
 * lazily on every call so a store installed after module load still works.
 * On bare native it degrades to an in-memory map shared for the process.
 */
export function getMockStorage(): MockStorage {
  if (Platform.OS === 'web') {
    const gateway: MockStorage = {
      getItem: (key) => backingStorage()?.getItem(key) ?? memoryStorage.getItem(key),
      setItem: (key, value) => {
        const backing = backingStorage();
        if (backing) backing.setItem(key, value);
        else memoryStorage.setItem(key, value);
      },
      removeItem: (key) => {
        const backing = backingStorage();
        if (backing) backing.removeItem(key);
        else memoryStorage.removeItem(key);
      },
      clear: () => {
        const backing = backingStorage();
        if (backing) backing.clear();
        else memoryStorage.clear();
      },
    };
    return gateway;
  }
  return memoryStorage;
}