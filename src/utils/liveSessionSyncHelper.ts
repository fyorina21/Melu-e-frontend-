// src/utils/liveSessionSyncHelper.ts
import { storage } from './storage';
import { filterOutDeletedStaff } from './deletedStaffHelper';

export const LIVE_SESSION_STORAGE_KEY = 'melue_live_sessions_registry';
export const LIVE_SESSIONS_CHANGED_EVENT = 'melue_live_sessions_changed';

export interface StoredLiveSession {
  id: string;
  teacherId: string;
  teacherName: string;
  stationName: string;
  roomName: string;
  studentIds: string[];
  studentNames: string[];
  students: Array<{ id: string; name: string }>;
  startedAt: number;
  durationMinutes: number;
  status: 'on-track' | 'needs-attention' | 'overdue';
  sessionStatus: 'in_progress' | 'completed';
  trialsCount?: number;
  incidentsCount?: number;
}

type LiveSessionListener = () => void;
const internalListeners = new Set<LiveSessionListener>();

export function notifyLiveSessionsChanged(): void {
  // Notify internal subscriber set (runs in Node/test & Browser)
  internalListeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });

  // Notify window event listeners across tabs if running in browser
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent(LIVE_SESSIONS_CHANGED_EVENT));
    } catch {}
  }
}

export function getLocalLiveSessions(): StoredLiveSession[] {
  try {
    const list = storage.getJSONSync<StoredLiveSession[]>(LIVE_SESSION_STORAGE_KEY) || [];
    if (!Array.isArray(list)) return [];
    return filterOutDeletedStaff(list).filter(
      (s) => s.sessionStatus === 'in_progress' || !s.sessionStatus,
    );
  } catch {
    return [];
  }
}

export function registerLiveSession(session: {
  id?: string;
  teacherId?: string;
  teacherName: string;
  stationName?: string;
  roomName?: string;
  students: Array<{ id: string; name: string } | string>;
  startedAt?: number;
  durationMinutes?: number;
  status?: 'on-track' | 'needs-attention' | 'overdue';
}): StoredLiveSession {
  const current = getLocalLiveSessions();
  const sessionId = session.id || `live-${session.teacherId || 'sess'}`;
  const startedAt = session.startedAt || Date.now();

  const studentDetails: Array<{ id: string; name: string }> = (session.students || []).map((st) => {
    if (typeof st === 'string') {
      return { id: st, name: st };
    }
    return {
      id: String(st.id || st.name),
      name: String(st.name || st.id),
    };
  });

  const studentNames = studentDetails.map((sd) => sd.name);
  const studentIds = studentDetails.map((sd) => sd.id);

  const entry: StoredLiveSession = {
    id: sessionId,
    teacherId: session.teacherId || '',
    teacherName: session.teacherName || 'Teacher',
    stationName: session.stationName || 'Station 1',
    roomName: session.roomName || 'Room 1',
    studentIds,
    studentNames,
    students: studentDetails,
    startedAt,
    durationMinutes: session.durationMinutes || 90,
    status: session.status || 'on-track',
    sessionStatus: 'in_progress',
    trialsCount: 0,
    incidentsCount: 0,
  };

  // Replace or add session for this teacher/session ID
  const filtered = current.filter(
    (s) => s.id !== sessionId && (!session.teacherId || s.teacherId !== session.teacherId),
  );
  filtered.push(entry);

  try {
    storage.setJSONSync(LIVE_SESSION_STORAGE_KEY, filtered);
  } catch {}

  notifyLiveSessionsChanged();
  return entry;
}

export function unregisterLiveSession(sessionId: string, teacherId?: string): void {
  const current = getLocalLiveSessions();
  const remaining = current.filter((s) => {
    if (s.id === sessionId) return false;
    if (teacherId && s.teacherId === teacherId) return false;
    return true;
  });

  try {
    storage.setJSONSync(LIVE_SESSION_STORAGE_KEY, remaining);
  } catch {}

  notifyLiveSessionsChanged();
}

export function clearAllLiveSessions(): void {
  try {
    storage.removeItem(LIVE_SESSION_STORAGE_KEY);
    storage.setJSONSync(LIVE_SESSION_STORAGE_KEY, []);
  } catch {}
  notifyLiveSessionsChanged();
}

export function subscribeToLiveSessions(callback: () => void): () => void {
  internalListeners.add(callback);

  let removeWindowListener = () => {};
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    const handler = () => callback();
    window.addEventListener(LIVE_SESSIONS_CHANGED_EVENT, handler);
    window.addEventListener('storage', handler);
    removeWindowListener = () => {
      window.removeEventListener(LIVE_SESSIONS_CHANGED_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }

  return () => {
    internalListeners.delete(callback);
    removeWindowListener();
  };
}
