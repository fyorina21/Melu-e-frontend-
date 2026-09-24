// src/stores/promptLevelsStore.ts
//
// Single source of truth for prompt-level trial ordering. The institutional
// admin configures the order on the TrialLoggingFormat screen; the live
// preview and the teacher session Trial Record read from this same store so
// every surface renders trials in the identical sequence.
//
// State is persisted to the mock database (localStorage on web) so the
// configured order survives reloads and role switches.

import { mockDb } from '../api/mock/db';

export interface PromptLevelConfigItem {
  id: string;
  name: string;
  color: string;
  order: number;
  status: 'Active';
}

const CONFIG_ID = 'trialLogging';

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

function readPersisted(): PromptLevelConfigItem[] | null {
  try {
    const saved = mockDb.findById('adminConfigs', CONFIG_ID);
    const rows = (saved?.value as { promptLevels?: Array<Record<string, unknown>> } | undefined)?.promptLevels;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return rows.map(toItem);
  } catch {
    return null;
  }
}

let config: PromptLevelConfigItem[] = readPersisted() ?? DEFAULT_PROMPT_LEVELS.map((c) => ({ ...c }));
let configConsecutive = 5;
let configStreamCount = 5;

try {
  const saved = mockDb.findById('adminConfigs', CONFIG_ID);
  if (saved?.value) {
    if (typeof (saved.value as any).consecutive === 'number') {
      configConsecutive = (saved.value as any).consecutive;
    }
    if (typeof (saved.value as any).streamCount === 'number') {
      configStreamCount = (saved.value as any).streamCount;
    }
  }
} catch {
  // best effort
}

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
  try {
    const existing = mockDb.findById('adminConfigs', CONFIG_ID);
    const value = { promptLevels: config, consecutive, streamCount };
    if (existing) {
      mockDb.updateById('adminConfigs', CONFIG_ID, { value });
    } else {
      mockDb.insert('adminConfigs', { id: CONFIG_ID, value });
    }
  } catch {
    // Persistence is best-effort in demo mode.
  }
}

export function getPromptLevelOrder(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of config) {
    map[item.name] = item.order;
    if (item.name === '+') map['INDEPENDENT'] = item.order;
  }
  return map;
}