// test/setup.ts
//
// Vitest globals run in Node with localStorage polyfilled so the token
// store's web path can be exercised.

import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  if (typeof localStorage === 'undefined') {
    (globalThis as Record<string, unknown>).localStorage = createMemoryStorage();
  }
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => void store.delete(key),
    setItem: (key: string, value: string) => void store.set(key, value),
  } as Storage;
}