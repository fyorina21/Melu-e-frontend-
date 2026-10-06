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
} {
  const parsed = storage.getJSONSync<any>(STORAGE_KEY, null);
  if (!parsed) return { levels: null, consecutive: 5, streamCount: 5 };
  const rows = parsed?.promptLevels;
  const levels = Array.isArray(rows) && rows.length > 0 ? rows.map(toItem) : null;
  const consecutive = typeof parsed?.consecutive === 'number' ? parsed.consecutive : 5;
  const streamCount = typeof parsed?.streamCount === 'number' ? parsed.streamCount : 5;
  return { levels, consecutive, streamCount };
}

const initial = readPersisted();

export interface PromptLevelsState {
  promptLevels: PromptLevelConfigItem[];
  consecutive: number;
  streamCount: number;
  setPromptLevels: (
    next: PromptLevelConfigItem[],
    consecutive?: number,
    streamCount?: number,
  ) => void;
  syncFromApi: (rows: any[], consecutive?: number, streamCount?: number) => PromptLevelConfigItem[];
}

export const usePromptLevelsStore = create<PromptLevelsState>((set, get) => ({
  promptLevels: initial.levels ?? DEFAULT_PROMPT_LEVELS.map((c) => ({ ...c })),
  consecutive: initial.consecutive,
  streamCount: initial.streamCount,
  setPromptLevels: (next, consecutive = get().consecutive, streamCount = get().streamCount) => {
    storage.setJSONSync(STORAGE_KEY, { promptLevels: next, consecutive, streamCount });
    set({ promptLevels: next.map((c) => ({ ...c })), consecutive, streamCount });
  },
  syncFromApi: (rows, consecutive = get().consecutive, streamCount = get().streamCount) => {
    if (Array.isArray(rows)) {
      const items = rows.map((r, idx) => toItem(r, idx));
      get().setPromptLevels(items, consecutive, streamCount);
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
  const { consecutive, streamCount } = usePromptLevelsStore.getState();
  return { consecutive, streamCount };
}

export function setPromptLevels(
  next: PromptLevelConfigItem[],
  consecutive: number = usePromptLevelsStore.getState().consecutive,
  streamCount: number = usePromptLevelsStore.getState().streamCount,
): void {
  usePromptLevelsStore.getState().setPromptLevels(next, consecutive, streamCount);
}

export function syncPromptLevelsFromApi(
  rows: any[],
  consecutive: number = usePromptLevelsStore.getState().consecutive,
  streamCount: number = usePromptLevelsStore.getState().streamCount,
): PromptLevelConfigItem[] {
  return usePromptLevelsStore.getState().syncFromApi(rows, consecutive, streamCount);
}

export function getPromptLevelOrder(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of usePromptLevelsStore.getState().promptLevels) {
    map[item.name] = item.order;
    if (item.name === '+') map['INDEPENDENT'] = item.order;
  }
  return map;
}
