// src/stores/trialsStore.ts
//
// Persistent local store for session trials. Ensures that trials recorded
// during a data collection session are immediately stored, updated, and
// reversible via Undo, without relying on backend session round-trips
// which may not serialize trial logs in the roster response.

import type { Trial, SessionIncident } from '../types';

const STORAGE_KEY = 'melue_session_trials_cache';

interface StoredTrialMap {
  // Key format: `${sessionId}:${studentId}` or `${sessionId}`
  [sessionStudentKey: string]: Trial[];
}

function readAllStored(): StoredTrialMap {
  if (typeof localStorage === 'undefined') {
    return {};
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function writeAllStored(data: StoredTrialMap): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to persist session trials to localStorage', err);
  }
}

export function getStoredTrials(
  sessionId: string,
  studentId: string,
  goalId?: string
): Trial[] {
  const all = readAllStored();
  const key = `${sessionId}:${studentId}`;
  const list = all[key] || [];
  if (!goalId) return list;
  return list.filter((t) => !t.studentGoalId || t.studentGoalId === goalId);
}

export function recordTrialInStore(
  sessionId: string,
  studentId: string,
  goalId: string,
  trial: Trial
): void {
  const all = readAllStored();
  const key = `${sessionId}:${studentId}`;
  const current = all[key] || [];
  all[key] = [...current, trial];
  writeAllStored(all);
}

export function undoTrialInStore(
  sessionId: string,
  studentId: string,
  goalId?: string
): Trial | null {
  const all = readAllStored();
  const key = `${sessionId}:${studentId}`;
  const current = all[key] || [];
  if (current.length === 0) return null;

  let popped: Trial | null = null;
  if (!goalId) {
    popped = current.pop() || null;
    all[key] = current;
  } else {
    for (let i = current.length - 1; i >= 0; i--) {
      if (!current[i].studentGoalId || current[i].studentGoalId === goalId) {
        popped = current.splice(i, 1)[0];
        break;
      }
    }
    all[key] = current;
  }

  writeAllStored(all);
  return popped;
}

export function clearStoredTrials(sessionId?: string): void {
  if (typeof localStorage === 'undefined') return;
  if (!sessionId) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  const all = readAllStored();
  const prefix = `${sessionId}:`;
  const next: StoredTrialMap = {};
  for (const k of Object.keys(all)) {
    if (!k.startsWith(prefix)) {
      next[k] = all[k];
    }
  }
  writeAllStored(next);
}

const INCIDENTS_STORAGE_KEY = 'melue_session_incidents_cache';

export function getStoredIncidents(sessionId: string): SessionIncident[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INCIDENTS_STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) || {};
    return all[sessionId] || [];
  } catch {
    return [];
  }
}

export function recordIncidentInStore(sessionId: string, incident: SessionIncident): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(INCIDENTS_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[sessionId] = [...(all[sessionId] || []), incident];
    localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.warn('Failed to store incident in localStorage', err);
  }
}
