// test/setup.ts
//
// Vitest globals run in Node with localStorage polyfilled so the token
// store's web path can be exercised.

import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  // Node ships a non-functional `localStorage` global (object), so guard on
  // usability, not just typeof. Force the in-memory polyfill so every test
  // sees a working, isolated storage.
  replaceUnusableLocalStorage();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function replaceUnusableLocalStorage(): void {
  const existing = (globalThis as Record<string, unknown>).localStorage as Storage | undefined;
  if (existing && typeof existing.getItem === 'function') return;
  (globalThis as Record<string, unknown>).localStorage = createMemoryStorage();
}

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