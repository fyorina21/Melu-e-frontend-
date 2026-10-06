interface SessionTimerState {
  sessionId: string | null;
  startedAt: number | null;
  pausedRemaining: number | null;
  durationSeconds: number;
}

let state: SessionTimerState = {
  sessionId: null,
  startedAt: null,
  pausedRemaining: null,
  durationSeconds: 0,
};

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
  if (state.sessionId === sessionId) return;
  state = { sessionId, startedAt: Date.now(), pausedRemaining: null, durationSeconds };
}

export function resumeSessionTimer(sessionId: string, durationSeconds: number): void {
  if (state.sessionId !== sessionId) {
    state = { sessionId, startedAt: Date.now(), pausedRemaining: null, durationSeconds };
    return;
  }
  if (state.startedAt !== null) {
    // Timer is already running
    return;
  }
  const currentRemaining = state.pausedRemaining ?? state.durationSeconds ?? durationSeconds;
  const elapsedAlready = Math.max(0, durationSeconds - currentRemaining);
  state = {
    ...state,
    durationSeconds,
    startedAt: Date.now() - elapsedAlready * 1000,
    pausedRemaining: null,
  };
}

export function pauseSessionTimer(): void {
  if (state.sessionId === null || state.startedAt === null) return;
  state = { ...state, startedAt: null, pausedRemaining: remainingSeconds() };
}

export function resetSessionTimer(): void {
  state = { sessionId: null, startedAt: null, pausedRemaining: null, durationSeconds: 0 };
}
