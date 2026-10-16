// test/setup.ts
//
// Vitest globals run in Node with localStorage polyfilled so the token
// store's web path can be exercised.

import { afterEach, beforeEach, vi } from 'vitest';

// `src/api/token.ts` statically imports expo-secure-store for the native
// keystore path. Expo module code reads the `__DEV__` global at import time;
// React Native injects it, but this runs in plain Node, so the import graph
// fails to evaluate without it. Must be defined before any module loads.
if (typeof (globalThis as Record<string, unknown>).__DEV__ === 'undefined') {
  (globalThis as Record<string, unknown>).__DEV__ = false;
}

// There is no keystore in Node. token.ts guards every call behind
// `Platform.OS !== 'web'`, so these are never invoked by the suite -- the stub
// only keeps the import graph loadable.
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => undefined),
  deleteItemAsync: vi.fn(async () => undefined),
}));

vi.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
}));

vi.mock('@shopify/flash-list', () => ({
  FlashList: 'FlashList',
}));

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
