// src/stores/sessionTimerStore.ts
//
// Modernized Session Timer Store implemented with Zustand.
// Exposes both the reactive `useSessionTimerStore` hook and
// procedural helpers for backwards compatibility.
// Persists active session timer state to storage so page refreshes
// do not reset the timer back to zero.

import { create } from 'zustand';
import { storage } from '../utils/storage';

const SESSION_TIMER_STORAGE_KEY = 'melue_session_timer_state';

export interface SessionTimerStoreState {
  sessionId: string | null;
  startedAt: number | null;
  pausedRemaining: number | null;
  durationSeconds: number;
  start: (sessionId: string, durationSeconds: number) => void;
  resume: (sessionId: string, durationSeconds: number) => void;
  pause: () => void;
  reset: () => void;
  remainingSeconds: () => number;
  isRunning: () => boolean;
}

interface PersistedTimerState {
  sessionId: string | null;
  startedAt: number | null;
  pausedRemaining: number | null;
  durationSeconds: number;
}

function loadPersistedTimer(): PersistedTimerState {
  try {
    const raw = storage.getJSONSync<PersistedTimerState>(SESSION_TIMER_STORAGE_KEY);
    if (raw && typeof raw === 'object' && raw.sessionId) {
      const startedAt = typeof raw.startedAt === 'number' ? raw.startedAt : null;
      const pausedRemaining = typeof raw.pausedRemaining === 'number' ? raw.pausedRemaining : null;
      const durationSeconds = typeof raw.durationSeconds === 'number' ? raw.durationSeconds : 0;

      // Check if loaded timer has already expired
      if (startedAt !== null) {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        if (durationSeconds > 0 && elapsed >= durationSeconds) {
          // Expired, clear storage so we don't boot up stuck at 00:00
          storage.removeItem(SESSION_TIMER_STORAGE_KEY);
          return { sessionId: null, startedAt: null, pausedRemaining: null, durationSeconds: 0 };
        }
      } else if (pausedRemaining !== null && pausedRemaining <= 0) {
        storage.removeItem(SESSION_TIMER_STORAGE_KEY);
        return { sessionId: null, startedAt: null, pausedRemaining: null, durationSeconds: 0 };
      }

      return {
        sessionId: raw.sessionId,
        startedAt,
        pausedRemaining,
        durationSeconds,
      };
    }
  } catch {}
  return {
    sessionId: null,
    startedAt: null,
    pausedRemaining: null,
    durationSeconds: 0,
  };
}

function savePersistedTimer(state: PersistedTimerState): void {
  try {
    if (state.sessionId) {
      storage.setJSONSync(SESSION_TIMER_STORAGE_KEY, state);
    } else {
      storage.removeItem(SESSION_TIMER_STORAGE_KEY);
    }
  } catch {}
}

const initialTimerState = loadPersistedTimer();

export const useSessionTimerStore = create<SessionTimerStoreState>((set, get) => ({
  sessionId: initialTimerState.sessionId,
  startedAt: initialTimerState.startedAt,
  pausedRemaining: initialTimerState.pausedRemaining,
  durationSeconds: initialTimerState.durationSeconds,

  start: (sessionId, durationSeconds) => {
    const current = get();
    // If the same session is already active or paused and hasn't expired:
    if (current.sessionId === sessionId) {
      if (current.startedAt !== null) {
        // If timer is running and still has time left, don't restart
        if (current.remainingSeconds() > 0) {
          return;
        }
      } else if (current.pausedRemaining !== null && current.pausedRemaining > 0) {
        // If timer was paused with remaining time, preserve pause state
        return;
      }
    }
    const nextState = {
      sessionId,
      startedAt: Date.now(),
      pausedRemaining: null,
      durationSeconds,
    };
    set(nextState);
    savePersistedTimer(nextState);
  },

  resume: (sessionId, durationSeconds) => {
    const s = get();
    if (s.sessionId !== sessionId) {
      const nextState = {
        sessionId,
        startedAt: Date.now(),
        pausedRemaining: null,
        durationSeconds,
      };
      set(nextState);
      savePersistedTimer(nextState);
      return;
    }
    if (s.startedAt !== null) {
      return;
    }
    const currentRemaining = s.pausedRemaining ?? s.durationSeconds ?? durationSeconds;
    const elapsedAlready = Math.max(0, durationSeconds - currentRemaining);
    const nextState = {
      durationSeconds,
      startedAt: Date.now() - elapsedAlready * 1000,
      pausedRemaining: null,
    };
    set(nextState);
    savePersistedTimer({
      sessionId: s.sessionId,
      ...nextState,
    });
  },

  pause: () => {
    const s = get();
    if (s.sessionId === null || s.startedAt === null) return;
    const nextState = { startedAt: null, pausedRemaining: get().remainingSeconds() };
    set(nextState);
    savePersistedTimer({
      sessionId: s.sessionId,
      durationSeconds: s.durationSeconds,
      ...nextState,
    });
  },

  reset: () => {
    set({ sessionId: null, startedAt: null, pausedRemaining: null, durationSeconds: 0 });
    savePersistedTimer({
      sessionId: null,
      startedAt: null,
      pausedRemaining: null,
      durationSeconds: 0,
    });
  },

  remainingSeconds: () => {
    const s = get();
    if (s.sessionId === null) return 0;
    if (s.startedAt !== null) {
      const elapsedSeconds = Math.floor((Date.now() - s.startedAt) / 1000);
      return Math.max(0, s.durationSeconds - elapsedSeconds);
    }
    return s.pausedRemaining ?? s.durationSeconds;
  },

  isRunning: () => {
    const s = get();
    return s.sessionId !== null && s.startedAt !== null;
  },
}));

// Backward-compatible exports
export function remainingSeconds(): number {
  return useSessionTimerStore.getState().remainingSeconds();
}

export function isTimerRunning(): boolean {
  return useSessionTimerStore.getState().isRunning();
}

export function startSessionTimer(sessionId: string, durationSeconds: number): void {
  useSessionTimerStore.getState().start(sessionId, durationSeconds);
}

export function resumeSessionTimer(sessionId: string, durationSeconds: number): void {
  useSessionTimerStore.getState().resume(sessionId, durationSeconds);
}

export function pauseSessionTimer(): void {
  useSessionTimerStore.getState().pause();
}

export function resetSessionTimer(): void {
  useSessionTimerStore.getState().reset();
}
