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
  if (!sessionId || !studentId || !goalId || !trial) return;
  const all = readAllStored();
  const key = `${sessionId}:${studentId}`;
  const current = all[key] || [];

  const existingIndex = current.findIndex((t) => t.id && trial.id && t.id === trial.id);
  if (existingIndex >= 0) {
    current[existingIndex] = { ...current[existingIndex], ...trial, studentGoalId: goalId };
    all[key] = current;
  } else {
    const isDup = current.some(
      (t) =>
        t.timestamp &&
        trial.timestamp &&
        t.timestamp === trial.timestamp &&
        t.promptLevel === trial.promptLevel &&
        t.studentGoalId === goalId
    );
    if (!isDup) {
      all[key] = [...current, { ...trial, studentGoalId: goalId }];
    }
  }
  writeAllStored(all);
}

export function updateTrialIdInStore(
  sessionId: string,
  studentId: string,
  oldTrialId: string,
  newTrialId: string
): void {
  if (!sessionId || !studentId || !oldTrialId || !newTrialId) return;
  const all = readAllStored();
  const key = `${sessionId}:${studentId}`;
  const current = all[key] || [];
  let updated = false;
  for (let i = 0; i < current.length; i++) {
    if (current[i].id === oldTrialId) {
      current[i].id = newTrialId;
      updated = true;
      break;
    }
  }
  if (updated) {
    all[key] = current;
    writeAllStored(all);
  }
}

export function undoTrialInStore(
  sessionId: string,
  studentId: string,
  goalId?: string,
  trialId?: string
): Trial | null {
  if (!sessionId || !studentId) return null;
  const all = readAllStored();
  const key = `${sessionId}:${studentId}`;
  const current = all[key] || [];
  if (current.length === 0) return null;

  let popped: Trial | null = null;
  // Match exact trialId first if provided
  if (trialId) {
    for (let i = current.length - 1; i >= 0; i--) {
      if (current[i].id === trialId && (!goalId || current[i].studentGoalId === goalId)) {
        popped = current.splice(i, 1)[0];
        break;
      }
    }
  } else if (goalId) {
    // Otherwise strictly match goalId
    for (let i = current.length - 1; i >= 0; i--) {
      if (current[i].studentGoalId === goalId) {
        popped = current.splice(i, 1)[0];
        break;
      }
    }
  } else {
    // Only pop if neither trialId nor goalId was provided
    popped = current.pop() || null;
  }

  if (popped) {
    all[key] = current;
    writeAllStored(all);
  }
  return popped;
}

const OFFLINE_SYNC_QUEUE_KEY = 'melue_session_offline_sync_queue';

function generateOfflineSyncIdSuffix(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for rare environments without Web Crypto.
  return `${Date.now().toString(16)}-${Math.floor(Date.now() % 100000).toString(16)}`;
}

export interface OfflineSyncItem {
  id: string;
  type: 'logTrial' | 'undoTrial' | 'recordIncident' | 'log_trial' | 'undo_trial' | 'behavior_incident';
  sessionId: string;
  studentId?: string;
  goalId?: string;
  trialId?: string;
  payload?: any;
  createdAt: number;
  retryCount: number;
}

export function getOfflineSyncQueue(): OfflineSyncItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function enqueueOfflineSync(
  item: Omit<OfflineSyncItem, 'id' | 'createdAt' | 'retryCount'>
): OfflineSyncItem {
  const newItem: OfflineSyncItem = {
    ...item,
    id: `sync-${Date.now()}-${generateOfflineSyncIdSuffix()}`,
    createdAt: Date.now(),
    retryCount: 0,
  };
  if (typeof localStorage !== 'undefined') {
    try {
      const queue = getOfflineSyncQueue();
      queue.push(newItem);
      localStorage.setItem(OFFLINE_SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch {}
  }
  return newItem;
}

export function removeOfflineSyncItem(id: string): void {
  if (typeof localStorage === 'undefined' || !id) return;
  try {
    const queue = getOfflineSyncQueue().filter((item) => item.id !== id);
    localStorage.setItem(OFFLINE_SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export function incrementOfflineSyncRetry(id: string): void {
  if (typeof localStorage === 'undefined' || !id) return;
  try {
    const queue = getOfflineSyncQueue().map((item) =>
      item.id === id ? { ...item, retryCount: item.retryCount + 1 } : item
    );
    localStorage.setItem(OFFLINE_SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export function clearOfflineSyncQueue(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(OFFLINE_SYNC_QUEUE_KEY);
  } catch {}
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
  if (typeof localStorage === 'undefined' || !sessionId) return [];
  try {
    const raw = localStorage.getItem(INCIDENTS_STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) || {};
    const list = all[sessionId] || [];
    const seen = new Set<string>();
    const result: SessionIncident[] = [];
    for (const item of list) {
      const idKey = (item as any).id || `${(item as any).date}-${(item as any).time}-${(item as any).behavior}-${(item as any).studentId}`;
      if (!seen.has(idKey)) {
        seen.add(idKey);
        result.push(item);
      }
    }
    return result;
  } catch {
    return [];
  }
}

export function recordIncidentInStore(sessionId: string, incident: SessionIncident): void {
  if (!sessionId || !incident) return;
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(INCIDENTS_STORAGE_KEY);
      const all = raw ? JSON.parse(raw) : {};
      const current = all[sessionId] || [];
      const incidentId = (incident as any).id;

      const existingIndex = current.findIndex(
        (i: any) =>
          (i.id && incidentId && i.id === incidentId) ||
          (i.date === (incident as any).date &&
            i.time === (incident as any).time &&
            i.studentId === (incident as any).studentId &&
            i.behavior === (incident as any).behavior)
      );

      if (existingIndex >= 0) {
        current[existingIndex] = { ...current[existingIndex], ...incident };
        all[sessionId] = current;
      } else {
        all[sessionId] = [...current, incident];
      }
      localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(all));
    } catch (err) {
      console.warn('Failed to store incident in localStorage', err);
    }
  }
  // Automatically also save into ABC incidents store for http://localhost:8081/AbcLog
  recordAbcIncidentInStore(incident);
}

export function removeStoredSessionIncident(sessionId: string, incidentIdOrIndex: string | number): void {
  if (typeof localStorage === 'undefined' || !sessionId) return;
  try {
    const raw = localStorage.getItem(INCIDENTS_STORAGE_KEY);
    if (!raw) return;
    const all = JSON.parse(raw) || {};
    const list: any[] = all[sessionId] || [];
    let removedId: string | null = null;

    if (typeof incidentIdOrIndex === 'number') {
      if (incidentIdOrIndex >= 0 && incidentIdOrIndex < list.length) {
        removedId = list[incidentIdOrIndex]?.id || null;
        list.splice(incidentIdOrIndex, 1);
      }
    } else {
      removedId = String(incidentIdOrIndex);
      all[sessionId] = list.filter((i: any) => String(i.id) !== removedId);
    }
    all[sessionId] = list;
    localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(all));

    if (removedId) {
      removeStoredAbcIncident(removedId);
    }
  } catch {}
}

const ABC_STORAGE_KEY = 'melue_abc_incidents_cache';

export function normalizeAbcIncident(incident: any): any {
  if (!incident) return null;
  const incidentId =
    incident.id ||
    `abc-inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    ...incident,
    id: incidentId,
    date: incident.date || new Date().toISOString().split('T')[0],
    time: incident.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    studentId: incident.studentId || incident.student_id || '',
    studentName: incident.studentName || 'Student',
    location: incident.location || incident['Location'] || incident.customFields?.['Location'] || incident.customFields?.['b_loc'] || '',
    behavior: incident.behavior || incident['Behavior Type'] || incident['Behavior'] || incident.customFields?.['Behavior Type'] || incident.customFields?.['b_beh'] || '',
    intensity: incident.intensity || incident['Intensity'] || incident.customFields?.['Intensity'] || incident.customFields?.['b_int'] || '',
    frequency: incident.frequency || incident['Duration (mins)'] || incident['Duration'] || incident['Frequency'] || incident.duration || '1',
    category: incident.category || incident['Category'] || 'General',
    antecedent: incident.antecedent || incident['Antecedent / Trigger'] || incident['Antecedent'] || incident.customFields?.['Antecedent / Trigger'] || incident.customFields?.['b_ant'] || '',
    consequence: incident.consequence || incident['Consequence / Action Taken'] || incident['Consequence'] || incident.customFields?.['Consequence / Action Taken'] || incident.customFields?.['b_con'] || '',
    notes: incident.notes || incident.additionalNotes || incident['Notes & Observations'] || incident['Note'] || incident.customFields?.['Notes & Observations'] || '',
    teacher: incident.teacher || incident.recordedBy || 'Rosa Delgado',
  };
}

export function recordAbcIncidentInStore(incident: any): void {
  if (typeof localStorage === 'undefined' || !incident) return;
  try {
    const raw = localStorage.getItem(ABC_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const arr = Array.isArray(list) ? list : [];

    const normalizedIncident = normalizeAbcIncident(incident);
    const incidentId = normalizedIncident.id;

    // Replace if exists, else prepend
    const existingIndex = arr.findIndex((item: any) => item.id === incidentId);
    if (existingIndex >= 0) {
      arr[existingIndex] = normalizedIncident;
    } else {
      arr.unshift(normalizedIncident);
    }

    localStorage.setItem(ABC_STORAGE_KEY, JSON.stringify(arr));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('melue_abc_updated', { detail: normalizedIncident }));
    }
  } catch (err) {
    console.warn('Failed to record ABC incident in store', err);
  }
}

export function getStoredAbcIncidents(studentId?: string, studentName?: string): any[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ABC_STORAGE_KEY);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const arr = Array.isArray(list) ? [...list] : [];

    // Also pull from session incidents cache so any previously recorded incidents are present
    try {
      const sessRaw = localStorage.getItem(INCIDENTS_STORAGE_KEY);
      if (sessRaw) {
        const sessObj = JSON.parse(sessRaw) || {};
        const seenIds = new Set(arr.map((x) => x.id || `${x.date}-${x.time}-${x.behavior}`));
        Object.values(sessObj).forEach((sessList: any) => {
          if (Array.isArray(sessList)) {
            sessList.forEach((item) => {
              const norm = normalizeAbcIncident(item);
              if (norm) {
                const key = norm.id || `${norm.date}-${norm.time}-${norm.behavior}`;
                if (!seenIds.has(key)) {
                  seenIds.add(key);
                  arr.push(norm);
                }
              }
            });
          }
        });
      }
    } catch {}

    if (!studentId && !studentName) return arr;

    const normTargetName = (studentName || '').trim().toLowerCase();

    return arr.filter((item: any) => {
      const matchId = studentId && (String(item.studentId) === String(studentId) || String(item.student_id) === String(studentId));
      if (matchId) return true;

      const itemStudentName = (item.studentName || '').trim().toLowerCase();
      if (normTargetName && itemStudentName && (itemStudentName === normTargetName || itemStudentName.includes(normTargetName) || normTargetName.includes(itemStudentName))) {
        return true;
      }
      return false;
    });
  } catch {
    return [];
  }
}

export function removeStoredAbcIncident(incidentId: string): void {
  if (typeof localStorage === 'undefined' || !incidentId) return;
  try {
    const raw = localStorage.getItem(ABC_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const filtered = list.filter((item: any) => String(item.id) !== String(incidentId));
        localStorage.setItem(ABC_STORAGE_KEY, JSON.stringify(filtered));
      }
    }

    // Also remove from session incidents cache if present
    try {
      const sessRaw = localStorage.getItem(INCIDENTS_STORAGE_KEY);
      if (sessRaw) {
        const sessObj = JSON.parse(sessRaw) || {};
        let changed = false;
        Object.keys(sessObj).forEach((k) => {
          if (Array.isArray(sessObj[k])) {
            const beforeLen = sessObj[k].length;
            sessObj[k] = sessObj[k].filter((item: any) => String(item.id) !== String(incidentId));
            if (sessObj[k].length !== beforeLen) changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(sessObj));
        }
      }
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('melue_abc_updated', { detail: { id: incidentId, deleted: true } }));
    }
  } catch {}
}

const STUDENTS_STORAGE_KEY = 'melue_session_students_cache';

export function setStoredSessionStudents(sessionId: string = 'active', students: any[], teacherId?: string): void {
  if (typeof localStorage === 'undefined' || !Array.isArray(students)) return;
  try {
    const raw = localStorage.getItem(STUDENTS_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[sessionId] = students;
    if (teacherId) {
      map[`${sessionId}_${teacherId}`] = students;
      map[`teacher_${teacherId}`] = students;
    } else {
      map['active'] = students;
    }
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export function getStoredSessionStudents(sessionId: string = 'active', teacherId?: string): any[] | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    if (teacherId) {
      const scoped = map[`${sessionId}_${teacherId}`] || map[`teacher_${teacherId}`];
      if (Array.isArray(scoped)) return scoped;
    }
    const list = map[sessionId] || map['active'];
    return Array.isArray(list) && list.length > 0 ? list : null;
  } catch {
    return null;
  }
}

