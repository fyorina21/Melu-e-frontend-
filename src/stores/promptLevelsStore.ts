// src/stores/promptLevelsStore.ts
//
// Single source of truth for prompt-level trial ordering.
// Modernized as a Zustand store backed by unified KeyValueStorage.

import { create } from 'zustand';
import { storage } from '../utils/storage';

export interface PromptLevelConfigItem {
  id: string;
  name: string;
  color: string;
  order: number;
  status: 'Active';
}

const STORAGE_KEY = 'melue_prompt_levels_config';

const DEFAULT_PROMPT_LEVELS: PromptLevelConfigItem[] = [
  { id: 'pl-1', name: 'FP', color: '#E5484D', order: 1, status: 'Active' },
  { id: 'pl-2', name: 'PP', color: '#F5A623', order: 2, status: 'Active' },
  { id: 'pl-3', name: 'G', color: '#30A46C', order: 3, status: 'Active' },
  { id: 'pl-4', name: '+', color: '#0091FF', order: 4, status: 'Active' },
];

function toItem(row: Record<string, unknown>, index: number): PromptLevelConfigItem {
  return {
    id: typeof row.id === 'string' && row.id ? row.id : `pl-${index + 1}`,
    name: String(row.name ?? row.label ?? ''),
    color: String(row.color ?? '#64748B'),
    order:
      typeof row.order === 'number'
        ? row.order
        : typeof row.displayOrder === 'number'
          ? row.displayOrder
          : index + 1,
    status: 'Active',
  };
}

function readPersisted(): {
  levels: PromptLevelConfigItem[] | null;
  consecutive: number;
  streamCount: number;
  layout: 'Horizontal' | 'Vertical' | 'Card Grid';
  independence: number;
  autoSuggest: boolean;
} {
  const parsed = storage.getJSONSync<any>(STORAGE_KEY, null);
  if (!parsed) {
    return {
      levels: null,
      consecutive: 5,
      streamCount: 5,
      layout: 'Horizontal',
      independence: 80,
      autoSuggest: true,
    };
  }
  const rows = parsed?.promptLevels;
  const levels = Array.isArray(rows) && rows.length > 0 ? rows.map(toItem) : null;
  const consecutive = typeof parsed?.consecutive === 'number' ? parsed.consecutive : 5;
  const streamCount = typeof parsed?.streamCount === 'number' ? parsed.streamCount : 5;
  const layout = parsed?.layout || 'Horizontal';
  const independence = typeof parsed?.independence === 'number' ? parsed.independence : 80;
  const autoSuggest = parsed?.autoSuggest !== false;
  return { levels, consecutive, streamCount, layout, independence, autoSuggest };
}

const initial = readPersisted();

export interface PromptLevelsState {
  promptLevels: PromptLevelConfigItem[];
  consecutive: number;
  streamCount: number;
  layout: 'Horizontal' | 'Vertical' | 'Card Grid';
  independence: number;
  autoSuggest: boolean;
  setPromptLevels: (
    next: PromptLevelConfigItem[],
    consecutive?: number,
    streamCount?: number,
    layout?: 'Horizontal' | 'Vertical' | 'Card Grid',
    independence?: number,
    autoSuggest?: boolean,
  ) => void;
  syncFromApi: (
    rows: any[],
    consecutive?: number,
    streamCount?: number,
    layout?: 'Horizontal' | 'Vertical' | 'Card Grid',
    independence?: number,
    autoSuggest?: boolean,
  ) => PromptLevelConfigItem[];
}

export const usePromptLevelsStore = create<PromptLevelsState>((set, get) => ({
  promptLevels: initial.levels ?? DEFAULT_PROMPT_LEVELS.map((c) => ({ ...c })),
  consecutive: initial.consecutive,
  streamCount: initial.streamCount,
  layout: initial.layout,
  independence: initial.independence,
  autoSuggest: initial.autoSuggest,
  setPromptLevels: (
    next,
    consecutive = get().consecutive,
    streamCount = get().streamCount,
    layout = get().layout,
    independence = get().independence,
    autoSuggest = get().autoSuggest,
  ) => {
    storage.setJSONSync(STORAGE_KEY, {
      promptLevels: next,
      consecutive,
      streamCount,
      layout,
      independence,
      autoSuggest,
    });
    set({
      promptLevels: next.map((c) => ({ ...c })),
      consecutive,
      streamCount,
      layout,
      independence,
      autoSuggest,
    });
  },
  syncFromApi: (
    rows,
    consecutive = get().consecutive,
    streamCount = get().streamCount,
    layout = get().layout,
    independence = get().independence,
    autoSuggest = get().autoSuggest,
  ) => {
    if (Array.isArray(rows)) {
      const items = rows.map((r, idx) => toItem(r, idx));
      get().setPromptLevels(items, consecutive, streamCount, layout, independence, autoSuggest);
      return items;
    }
    return get().promptLevels;
  },
}));

// Backward-compatible exports
export function getPromptLevels(): PromptLevelConfigItem[] {
  return usePromptLevelsStore.getState().promptLevels.map((c) => ({ ...c }));
}

export function getTrialConfig() {
  const { consecutive, streamCount, layout, independence, autoSuggest } =
    usePromptLevelsStore.getState();
  return { consecutive, streamCount, layout, independence, autoSuggest };
}

export function setPromptLevels(
  next: PromptLevelConfigItem[],
  consecutive: number = usePromptLevelsStore.getState().consecutive,
  streamCount: number = usePromptLevelsStore.getState().streamCount,
  layout: 'Horizontal' | 'Vertical' | 'Card Grid' = usePromptLevelsStore.getState().layout,
  independence: number = usePromptLevelsStore.getState().independence,
  autoSuggest: boolean = usePromptLevelsStore.getState().autoSuggest,
): void {
  usePromptLevelsStore
    .getState()
    .setPromptLevels(next, consecutive, streamCount, layout, independence, autoSuggest);
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('melue_prompt_levels_changed', {
          detail: {
            promptLevels: next,
            consecutive,
            streamCount,
            layout,
            independence,
            autoSuggest,
          },
        }),
      );
    } catch {}
  }
}

export function syncPromptLevelsFromApi(
  rows: any[],
  consecutive: number = usePromptLevelsStore.getState().consecutive,
  streamCount: number = usePromptLevelsStore.getState().streamCount,
  layout: 'Horizontal' | 'Vertical' | 'Card Grid' = usePromptLevelsStore.getState().layout,
  independence: number = usePromptLevelsStore.getState().independence,
  autoSuggest: boolean = usePromptLevelsStore.getState().autoSuggest,
): PromptLevelConfigItem[] {
  return usePromptLevelsStore
    .getState()
    .syncFromApi(rows, consecutive, streamCount, layout, independence, autoSuggest);
}

export function getPromptLevelOrder(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of usePromptLevelsStore.getState().promptLevels) {
    map[item.name] = item.order;
    if (item.name === '+') map['INDEPENDENT'] = item.order;
  }
  return map;
}
