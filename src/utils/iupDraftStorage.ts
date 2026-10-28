import { storage } from './storage';
import type { Payload } from '../types';

export const IUP_DRAFTS_STORAGE_KEY = 'melue_iup_drafts_cache';

export function getAllStoredIupDrafts(): Record<string, Payload> {
  return storage.getJSONSync<Record<string, Payload>>(IUP_DRAFTS_STORAGE_KEY, {}) || {};
}

export function getStoredIupDraft(id: string): Payload | null {
  const all = getAllStoredIupDrafts();
  return all[id] || null;
}

export function storeIupDraftLocally(id: string, payload: Payload): void {
  try {
    const all = getAllStoredIupDrafts();
    const entry = {
      ...(all[id] || {}),
      ...payload,
      saved_at: new Date().toISOString(),
    };
    all[id] = entry;
    if (payload.studentId && typeof payload.studentId === 'string') {
      all[payload.studentId] = entry;
    }
    if (payload.student_id && typeof payload.student_id === 'string') {
      all[payload.student_id] = entry;
    }
    storage.setJSONSync(IUP_DRAFTS_STORAGE_KEY, all);
  } catch (err) {
    console.warn('Failed to cache IUP draft locally', err);
  }
}
