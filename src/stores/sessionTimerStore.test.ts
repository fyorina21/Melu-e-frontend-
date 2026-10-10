import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  startSessionTimer,
  pauseSessionTimer,
  resumeSessionTimer,
  remainingSeconds,
  resetSessionTimer,
  isTimerRunning,
} from './sessionTimerStore';

describe('sessionTimerStore', () => {
  beforeEach(() => {
    vi.useRealTimers();
    resetSessionTimer();
  });

  it('initializes and computes remaining time accurately', () => {
    vi.useFakeTimers();
    const now = 1000000;
    vi.setSystemTime(now);

    startSessionTimer('sess-1', 600);
    expect(isTimerRunning()).toBe(true);
    expect(remainingSeconds()).toBe(600);

    // Fast-forward 120 seconds
    vi.advanceTimersByTime(120 * 1000);
    expect(remainingSeconds()).toBe(480);
  });

  it('correctly calculates elapsed time from pausedRemaining when resuming', () => {
    vi.useFakeTimers();
    const now = 1000000;
    vi.setSystemTime(now);

    // Start 600-second timer
    startSessionTimer('sess-1', 600);

    // Advance 150 seconds (450 remaining)
    vi.advanceTimersByTime(150 * 1000);
    expect(remainingSeconds()).toBe(450);

    // Pause timer
    pauseSessionTimer();
    expect(isTimerRunning()).toBe(false);
    expect(remainingSeconds()).toBe(450);

    // Advance time while paused (say, 5 minutes)
    vi.advanceTimersByTime(300 * 1000);
    // While paused, remaining seconds should STILL be 450
    expect(remainingSeconds()).toBe(450);

    // Resume session timer
    resumeSessionTimer('sess-1', 600);
    expect(isTimerRunning()).toBe(true);
    // Crucial check: immediately upon resume, remaining must still be 450 (NOT 600)
    expect(remainingSeconds()).toBe(450);

    // Advance another 50 seconds
    vi.advanceTimersByTime(50 * 1000);
    expect(remainingSeconds()).toBe(400);

    // Pause and resume again
    pauseSessionTimer();
    vi.advanceTimersByTime(200 * 1000);
    expect(remainingSeconds()).toBe(400);

    resumeSessionTimer('sess-1', 600);
    expect(remainingSeconds()).toBe(400);

    vi.advanceTimersByTime(400 * 1000);
    expect(remainingSeconds()).toBe(0);
  });

  it('resets when resuming a different session id', () => {
    vi.useFakeTimers();
    const now = 1000000;
    vi.setSystemTime(now);

    startSessionTimer('sess-1', 600);
    vi.advanceTimersByTime(200 * 1000);
    pauseSessionTimer();

    // Resume with a different session ID
    resumeSessionTimer('sess-2', 500);
    expect(isTimerRunning()).toBe(true);
    expect(remainingSeconds()).toBe(500);
  });
});
