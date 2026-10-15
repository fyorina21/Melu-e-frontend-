// src/stores/sessionTimerStore.ts
//
// Persistent timer store for session data collection.
// Preserves pause/resume state and remaining time across roster refreshes and screen navigation.

const TIMER_STORAGE_KEY = 'melue_session_timer_state';

interface SessionTimerState {
  sessionId: string | null;
  startedAt: number | null;
  pausedRemaining: number | null;
  durationSeconds: number;
}

function loadStoredState(): SessionTimerState {
  if (typeof localStorage === 'undefined') {
    return { sessionId: null, startedAt: null, pausedRemaining: null, durationSeconds: 0 };
  }
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return { sessionId: null, startedAt: null, pausedRemaining: null, durationSeconds: 0 };
    const parsed = JSON.parse(raw);
    return {
      sessionId: parsed.sessionId || null,
      startedAt: typeof parsed.startedAt === 'number' ? parsed.startedAt : null,
      pausedRemaining: typeof parsed.pausedRemaining === 'number' ? parsed.pausedRemaining : null,
      durationSeconds: typeof parsed.durationSeconds === 'number' ? parsed.durationSeconds : 0,
    };
  } catch {
    return { sessionId: null, startedAt: null, pausedRemaining: null, durationSeconds: 0 };
  }
}

function persistState(s: SessionTimerState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (s.sessionId === null) {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } else {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(s));
    }
  } catch {}
}

let state: SessionTimerState = loadStoredState();

export function remainingSeconds(): number {
  if (state.sessionId === null) return 0;
  if (state.startedAt !== null) {
    const elapsedSeconds = Math.floor((Date.now() - state.startedAt) / 1000);
    return Math.max(0, state.durationSeconds - elapsedSeconds);
  }
  return state.pausedRemaining ?? state.durationSeconds;
}

export function isTimerRunning(): boolean {
  return state.sessionId !== null && state.startedAt !== null;
}

export function startSessionTimer(sessionId: string, durationSeconds: number): void {
  // If already tracking this session (running or paused), do not reset during roster refreshes
  if (state.sessionId === sessionId) {
    return;
  }

  // Check if persisted in localStorage for this sessionId
  const saved = loadStoredState();
  if (saved.sessionId === sessionId) {
    state = saved;
    return;
  }

  const initialDuration = durationSeconds > 0 ? durationSeconds : 5400;
  state = {
    sessionId,
    startedAt: Date.now(),
    pausedRemaining: null,
    durationSeconds: initialDuration,
  };
  persistState(state);
}

export function resumeSessionTimer(sessionId: string, durationSeconds: number): void {
  if (state.sessionId !== sessionId) {
    startSessionTimer(sessionId, durationSeconds);
    return;
  }

  // Count down from the pausedRemaining time, not the original total duration!
  const currentRemaining =
    state.pausedRemaining !== null
      ? state.pausedRemaining
      : state.startedAt !== null
      ? remainingSeconds()
      : durationSeconds > 0
      ? durationSeconds
      : state.durationSeconds;

  state = {
    sessionId,
    startedAt: Date.now(),
    pausedRemaining: null,
    durationSeconds: currentRemaining,
  };
  persistState(state);
}

export function pauseSessionTimer(): void {
  if (state.sessionId === null || state.startedAt === null) return;
  const rem = remainingSeconds();
  state = {
    ...state,
    startedAt: null,
    pausedRemaining: rem,
  };
  persistState(state);
}

export function resetSessionTimer(sessionId?: string): void {
  if (!sessionId || state.sessionId === sessionId) {
    state = { sessionId: null, startedAt: null, pausedRemaining: null, durationSeconds: 0 };
    persistState(state);
  }
}
