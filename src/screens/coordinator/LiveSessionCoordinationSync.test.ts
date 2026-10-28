import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerLiveSession,
  unregisterLiveSession,
  clearAllLiveSessions,
  getLocalLiveSessions,
  subscribeToLiveSessions,
  LIVE_SESSION_STORAGE_KEY,
} from '../../utils/liveSessionSyncHelper';
import { getActiveSessions } from '../../api/coordinatorApi';
import { mapActiveSession } from './livesession/types';

describe('Live Session Coordination & Synchronization', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAllLiveSessions();
    vi.restoreAllMocks();
  });

  it('Requirement 1 & 2: displays actual teacher and only their assigned students', async () => {
    // Teacher Abeba starts session for her assigned students
    const abebaSession = registerLiveSession({
      id: 'session-abeba-1',
      teacherId: 'teacher-101',
      teacherName: 'Abeba Tadesse',
      stationName: 'Station 1 · Early Learners',
      roomName: 'Room 1A',
      students: [
        { id: 'stud-1', name: 'Amir Hassan' },
        { id: 'stud-2', name: 'Tigist Bekele' },
      ],
      startedAt: Date.now() - 120000, // 2 minutes ago
      durationMinutes: 90,
    });

    // Check active sessions returned by coordinator API
    const res = await getActiveSessions({});
    expect(res.data).toHaveLength(1);

    const live = res.data[0];
    expect(live.teacherName).toBe('Abeba Tadesse');
    expect(live.therapistName).toBe('Abeba Tadesse');
    expect(live.studentNames).toEqual(['Amir Hassan', 'Tigist Bekele']);
    expect(live.studentCount).toBe(2);

    // Map to session row
    const mapped = mapActiveSession(live);
    expect(mapped.teacher).toBe('Abeba Tadesse');
    expect(mapped.students).toEqual(['Amir Hassan', 'Tigist Bekele']);
    expect(mapped.station).toBe('Station 1 · Early Learners');
    expect(mapped.room).toBe('Room 1A');
  });

  it('Requirement 3 & 4: started from Teacher page, calculates correct timer elapsed time', async () => {
    const startedAt = Date.now() - 65000; // 65 seconds ago
    registerLiveSession({
      id: 'session-dawit-1',
      teacherId: 'teacher-102',
      teacherName: 'Dawit Bekele',
      stationName: 'Station 2',
      roomName: 'Room 2B',
      students: [{ id: 'stud-3', name: 'Saron Tekle' }],
      startedAt,
      durationMinutes: 90,
    });

    const res = await getActiveSessions({});
    expect(res.data).toHaveLength(1);
    const live = res.data[0];
    expect(live.teacherName).toBe('Dawit Bekele');
    expect(live.elapsed_seconds).toBeGreaterThanOrEqual(64);
    expect(live.timer).toBeGreaterThanOrEqual(64);

    const mapped = mapActiveSession(live);
    expect(mapped.timer).toBeGreaterThanOrEqual(64);
  });

  it('Requirement 5: does not display sessions as live if they have ended or completed', async () => {
    registerLiveSession({
      id: 'session-selam-1',
      teacherId: 'teacher-103',
      teacherName: 'Selam Tesfaye',
      stationName: 'Station 3',
      roomName: 'Room 3C',
      students: [{ id: 'stud-4', name: 'Yonas Girma' }],
      startedAt: Date.now() - 30000,
    });

    let res = await getActiveSessions({});
    expect(res.data).toHaveLength(1);

    // Teacher ends / submits summary
    unregisterLiveSession('session-selam-1');

    res = await getActiveSessions({});
    expect(res.data).toHaveLength(0);
  });

  it('Requirement 6: updates coordinator in real-time without duplicate sessions', async () => {
    let notified = 0;
    const unsubscribe = subscribeToLiveSessions(() => {
      notified++;
    });

    // 1. Teacher starts session
    registerLiveSession({
      id: 'session-abeba-1',
      teacherId: 'teacher-101',
      teacherName: 'Abeba Tadesse',
      stationName: 'Station 1',
      roomName: 'Room 1A',
      students: [{ id: 'stud-1', name: 'Amir Hassan' }],
    });

    expect(notified).toBeGreaterThanOrEqual(1);
    let sessions = getLocalLiveSessions();
    expect(sessions).toHaveLength(1);

    // 2. Starting same teacher session replaces old one without duplicate
    registerLiveSession({
      id: 'session-abeba-1',
      teacherId: 'teacher-101',
      teacherName: 'Abeba Tadesse',
      stationName: 'Station 1',
      roomName: 'Room 1A',
      students: [
        { id: 'stud-1', name: 'Amir Hassan' },
        { id: 'stud-2', name: 'Tigist Bekele' },
      ],
    });

    sessions = getLocalLiveSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].studentNames).toEqual(['Amir Hassan', 'Tigist Bekele']);

    // 3. Ending session notifies coordinator
    unregisterLiveSession('session-abeba-1');
    expect(getLocalLiveSessions()).toHaveLength(0);

    unsubscribe();
  });

  it('Requirement 6b: preserves independent start times for different teachers and does not reset to 0 on refresh', async () => {
    // Teacher Dawit started 10 minutes ago
    const dawitStart = Date.now() - 600000;
    registerLiveSession({
      id: 'session-dawit',
      teacherId: 'teacher-dawit',
      teacherName: 'Dawit Bekele',
      stationName: 'Station 2',
      roomName: 'Room 2B',
      students: [{ id: 'stud-dawit', name: 'Saron Tekle' }],
      startedAt: dawitStart,
    });

    // Teacher Selam started 3 minutes ago
    const selamStart = Date.now() - 180000;
    registerLiveSession({
      id: 'session-selam',
      teacherId: 'teacher-selam',
      teacherName: 'Selam Tesfaye',
      stationName: 'Station 3',
      roomName: 'Room 3C',
      students: [{ id: 'stud-selam', name: 'Yonas Girma' }],
      startedAt: selamStart,
    });

    // Fetch as coordinator (like page refresh)
    const res = await getActiveSessions({});
    expect(res.data).toHaveLength(2);

    const dawitSession = res.data.find((s: any) => s.teacherName === 'Dawit Bekele');
    const selamSession = res.data.find((s: any) => s.teacherName === 'Selam Tesfaye');

    expect(dawitSession).toBeDefined();
    expect(selamSession).toBeDefined();

    // Verify Dawit's elapsed timer is around 600s, not 0
    expect(dawitSession.elapsed_seconds).toBeGreaterThanOrEqual(599);
    expect(dawitSession.timer).toBeGreaterThanOrEqual(599);

    // Verify Selam's elapsed timer is around 180s, different from Dawit's
    expect(selamSession.elapsed_seconds).toBeGreaterThanOrEqual(179);
    expect(selamSession.elapsed_seconds).toBeLessThan(300);

    // Map both
    const mappedDawit = mapActiveSession(dawitSession);
    const mappedSelam = mapActiveSession(selamSession);
    expect(mappedDawit.timer).toBeGreaterThanOrEqual(599);
    expect(mappedSelam.timer).toBeGreaterThanOrEqual(179);
    expect(mappedDawit.startedAt).toBe(dawitStart);
    expect(mappedSelam.startedAt).toBe(selamStart);
  });
});
