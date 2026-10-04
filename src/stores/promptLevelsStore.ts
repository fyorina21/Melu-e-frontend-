// src/stores/promptLevelsStore.ts
//
// Single source of truth for prompt-level trial ordering. The institutional
// admin configures the order on the TrialLoggingFormat screen; the live
// preview and the teacher session Trial Record read from this same store so
// every surface renders trials in the identical sequence.

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

function readPersisted(): { levels: PromptLevelConfigItem[] | null; consecutive: number; streamCount: number } {
  if (typeof localStorage === 'undefined') {
    return { levels: null, consecutive: 5, streamCount: 5 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { levels: null, consecutive: 5, streamCount: 5 };
    const parsed = JSON.parse(raw);
    const rows = parsed?.promptLevels;
    const levels = Array.isArray(rows) && rows.length > 0 ? rows.map(toItem) : null;
    const consecutive = typeof parsed?.consecutive === 'number' ? parsed.consecutive : 5;
    const streamCount = typeof parsed?.streamCount === 'number' ? parsed.streamCount : 5;
    return { levels, consecutive, streamCount };
  } catch {
    return { levels: null, consecutive: 5, streamCount: 5 };
  }
}

const initial = readPersisted();
let config: PromptLevelConfigItem[] = initial.levels ?? DEFAULT_PROMPT_LEVELS.map((c) => ({ ...c }));
let configConsecutive = initial.consecutive;
let configStreamCount = initial.streamCount;

export function getPromptLevels(): PromptLevelConfigItem[] {
  return config.map((c) => ({ ...c }));
}

export function getTrialConfig() {
  return { consecutive: configConsecutive, streamCount: configStreamCount };
}

export function setPromptLevels(next: PromptLevelConfigItem[], consecutive: number = configConsecutive, streamCount: number = configStreamCount): void {
  config = next.map((c) => ({ ...c }));
  configConsecutive = consecutive;
  configStreamCount = streamCount;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ promptLevels: config, consecutive, streamCount }));
    } catch {}
  }
}

export function syncPromptLevelsFromApi(rows: any[], consecutive: number = configConsecutive, streamCount: number = configStreamCount): PromptLevelConfigItem[] {
  if (Array.isArray(rows)) {
    const items = rows.map((r, idx) => toItem(r, idx));
    setPromptLevels(items, consecutive, streamCount);
    return items;
  }
  return getPromptLevels();
}

export function getPromptLevelOrder(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of config) {
    map[item.name] = item.order;
    if (item.name === '+') map['INDEPENDENT'] = item.order;
  }
  return map;
}