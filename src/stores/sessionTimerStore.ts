// src/stores/sessionTimerStore.ts
//
// Modernized Session Timer Store implemented with Zustand.
// Exposes both the reactive `useSessionTimerStore` hook and
// procedural helpers for backwards compatibility.

import { create } from 'zustand';

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

export const useSessionTimerStore = create<SessionTimerStoreState>((set, get) => ({
  sessionId: null,
  startedAt: null,
  pausedRemaining: null,
  durationSeconds: 0,

  start: (sessionId, durationSeconds) => {
    if (get().sessionId === sessionId) return;
    set({ sessionId, startedAt: Date.now(), pausedRemaining: null, durationSeconds });
  },

  resume: (sessionId, durationSeconds) => {
    const s = get();
    if (s.sessionId !== sessionId) {
      set({ sessionId, startedAt: Date.now(), pausedRemaining: null, durationSeconds });
      return;
    }
    if (s.startedAt !== null) {
      return;
    }
    const currentRemaining = s.pausedRemaining ?? s.durationSeconds ?? durationSeconds;
    const elapsedAlready = Math.max(0, durationSeconds - currentRemaining);
    set({
      durationSeconds,
      startedAt: Date.now() - elapsedAlready * 1000,
      pausedRemaining: null,
    });
  },

  pause: () => {
    const s = get();
    if (s.sessionId === null || s.startedAt === null) return;
    set({ startedAt: null, pausedRemaining: get().remainingSeconds() });
  },

  reset: () => {
    set({ sessionId: null, startedAt: null, pausedRemaining: null, durationSeconds: 0 });
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
