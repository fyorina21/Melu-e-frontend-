import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  startSessionTimer,
  pauseSessionTimer,
  resumeSessionTimer,
  resetSessionTimer,
  remainingSeconds,
  isTimerRunning,
} from '../../stores/sessionTimerStore';
import {
  recordTrialInStore,
  getStoredTrials,
  undoTrialInStore,
  updateTrialIdInStore,
  clearStoredTrials,
  recordIncidentInStore,
  getStoredIncidents,
  removeStoredSessionIncident,
  getStoredAbcIncidents,
  setStoredSessionStudents,
  getStoredSessionStudents,
} from '../../stores/trialsStore';
import {
  isStudentEligibleForSession,
  registerStudentStatuses,
} from '../../utils/studentLifecycleHelper';
import {
  findLoggedInTeacher,
  resolveTeacherAssignedStudentIds,
  resolveEligibleTeacherStudents,
} from '../../utils/teacherScheduleHelper';
import { logTrial, undoLastTrial, recordBehaviorIncident } from '../../api/sessionApi';

describe('SessionDataCollectionScreen Fixes Verification', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    resetSessionTimer();
    clearStoredTrials();
  });

  describe('1. Student assignments & Ineligible Student Prevention', () => {
    it('strictly prevents in_assessment students from appearing in session', () => {
      const studentAssessment = {
        id: 'stu-in-assess',
        name: 'Assessment Kid',
        status: 'in_assessment',
        assessmentProgress: 40,
      };
      const studentEligible = {
        id: 'stu-eligible',
        name: 'Eligible Kid',
        status: 'active_therapy',
        assessmentProgress: 100,
      };

      expect(isStudentEligibleForSession(studentAssessment)).toBe(false);
      expect(isStudentEligibleForSession(studentEligible)).toBe(true);
    });

    it('isolates teacher assignments with zero student leakage to unassigned teachers', () => {
      const teachers = [
        { id: 't-abeba', name: 'Abeba Tadesse' },
        { id: 't-dawit', name: 'Dawit Bekele' },
      ];
      const blocks = [
        {
          id: 'b-1',
          teacherId: 't-abeba',
          teacherName: 'Abeba Tadesse',
          studentIds: ['stu-abeba-1', 'stu-abeba-2'],
        },
      ];

      const dawitTeacher = teachers[1];
      const { assignedStudentIds } = resolveTeacherAssignedStudentIds(dawitTeacher, blocks);

      // Dawit has NO assigned students
      expect(assignedStudentIds).toEqual([]);

      // Must not leak Abeba's students
      expect(assignedStudentIds).not.toContain('stu-abeba-1');
      expect(assignedStudentIds).not.toContain('stu-abeba-2');
    });

    it('enforces maximum 2 students per station/workbench', () => {
      const teacher = { id: 't-1', name: 'Teacher 1' };
      const blocks = [
        {
          id: 'b-1',
          teacherId: 't-1',
          studentIds: ['s1', 's2', 's3', 's4'],
        },
      ];

      const { assignedStudentIds } = resolveTeacherAssignedStudentIds(teacher, blocks);
      expect(assignedStudentIds.length).toBeLessThanOrEqual(2);
      expect(assignedStudentIds).toEqual(['s1', 's2']);
    });
  });

  describe('2. Timer State & Refresh Preservation', () => {
    it('starts timer and preserves remaining duration during roster refresh', () => {
      const sessionId = 'session-timer-test';
      startSessionTimer(sessionId, 5400); // 90 mins

      expect(isTimerRunning()).toBe(true);
      const initialRemaining = remainingSeconds();
      expect(initialRemaining).toBeGreaterThanOrEqual(5398);
      expect(initialRemaining).toBeLessThanOrEqual(5400);

      // Roster refreshes (e.g. loadRoster called again)
      startSessionTimer(sessionId, 5400);

      // Must NOT reset the timer
      expect(isTimerRunning()).toBe(true);
      expect(remainingSeconds()).toBe(initialRemaining);
    });

    it('preserves pause state during roster refreshes and resume preserves elapsed time', () => {
      const sessionId = 'session-pause-test';
      startSessionTimer(sessionId, 3000);

      pauseSessionTimer();
      expect(isTimerRunning()).toBe(false);
      const pausedRemaining = remainingSeconds();

      // Roster refresh while paused
      startSessionTimer(sessionId, 3000);
      expect(isTimerRunning()).toBe(false);
      expect(remainingSeconds()).toBe(pausedRemaining);

      // Resume timer
      resumeSessionTimer(sessionId, 3000);
      expect(isTimerRunning()).toBe(true);
      // Remaining seconds starts counting from pausedRemaining, NOT resetting to 3000!
      expect(remainingSeconds()).toBeLessThanOrEqual(pausedRemaining);
    });
  });

  describe('3. Trial Tracking, Undo & Deduplication', () => {
    it('records trial in local store and prevents duplicate identical records', () => {
      const sessionId = 'sess-trials-1';
      const studentId = 'stu-1';
      const goalId = 'goal-101';

      const trial1 = {
        id: 'trial-abc-1',
        promptLevel: 'PP',
        timestamp: '10:00:00 AM',
        sessionId,
        studentGoalId: goalId,
      };

      recordTrialInStore(sessionId, studentId, goalId, trial1);
      const stored = getStoredTrials(sessionId, studentId, goalId);
      expect(stored.length).toBe(1);
      expect(stored[0].id).toBe('trial-abc-1');

      // Attempt to record duplicate with same ID
      recordTrialInStore(sessionId, studentId, goalId, trial1);
      const storedAfterDup = getStoredTrials(sessionId, studentId, goalId);
      expect(storedAfterDup.length).toBe(1);
    });

    it('updates trial ID when server synchronizes without duplicating records', () => {
      const sessionId = 'sess-trials-sync';
      const studentId = 'stu-1';
      const goalId = 'goal-101';

      const localTrial = {
        id: 'client-trial-999',
        promptLevel: 'INDEPENDENT',
        timestamp: '10:15:00 AM',
        sessionId,
        studentGoalId: goalId,
      };

      recordTrialInStore(sessionId, studentId, goalId, localTrial);
      expect(getStoredTrials(sessionId, studentId, goalId)[0].id).toBe('client-trial-999');

      // Backend returns real server trial ID
      updateTrialIdInStore(sessionId, studentId, 'client-trial-999', 'server-trial-888');

      const updatedStored = getStoredTrials(sessionId, studentId, goalId);
      expect(updatedStored.length).toBe(1);
      expect(updatedStored[0].id).toBe('server-trial-888');
    });

    it('undo removes the last recorded trial for the specific goal', () => {
      const sessionId = 'sess-undo';
      const studentId = 'stu-1';
      const goalId1 = 'g-1';
      const goalId2 = 'g-2';

      recordTrialInStore(sessionId, studentId, goalId1, {
        id: 't1',
        promptLevel: '+',
        timestamp: '10:00:00 AM',
        studentGoalId: goalId1,
      });
      recordTrialInStore(sessionId, studentId, goalId2, {
        id: 't2',
        promptLevel: 'G',
        timestamp: '10:01:00 AM',
        studentGoalId: goalId2,
      });
      recordTrialInStore(sessionId, studentId, goalId1, {
        id: 't3',
        promptLevel: 'PP',
        timestamp: '10:02:00 AM',
        studentGoalId: goalId1,
      });

      // Undo last trial for goalId1
      const undone = undoTrialInStore(sessionId, studentId, goalId1);
      expect(undone?.id).toBe('t3');

      // Goal 1 should now have only t1
      const g1Trials = getStoredTrials(sessionId, studentId, goalId1);
      expect(g1Trials.map((t) => t.id)).toEqual(['t1']);

      // Goal 2 should remain intact with t2
      const g2Trials = getStoredTrials(sessionId, studentId, goalId2);
      expect(g2Trials.map((t) => t.id)).toEqual(['t2']);
    });
  });

  describe('4. Incidents Handling & Deletion Consistency', () => {
    it('records incident locally and mirrors to ABC log', () => {
      const sessionId = 'sess-inc-1';
      const incident = {
        id: 'inc-100',
        studentId: 'stu-y',
        studentName: 'Yonas G',
        behavior: 'Elopement',
        time: '11:00 AM',
        date: '2026-10-14',
      };

      recordIncidentInStore(sessionId, incident as any);

      const sessionIncidents = getStoredIncidents(sessionId);
      expect(sessionIncidents.length).toBe(1);
      expect(sessionIncidents[0].id).toBe('inc-100');

      const abcIncidents = getStoredAbcIncidents('stu-y');
      expect(abcIncidents.some((i) => i.id === 'inc-100')).toBe(true);
    });

    it('consistently removes incident from both session incidents and ABC log', () => {
      const sessionId = 'sess-inc-del';
      const incident = {
        id: 'inc-to-delete',
        studentId: 'stu-y',
        studentName: 'Yonas G',
        behavior: 'Tantrum',
        time: '11:15 AM',
        date: '2026-10-14',
      };

      recordIncidentInStore(sessionId, incident as any);
      expect(getStoredIncidents(sessionId).some((i) => i.id === 'inc-to-delete')).toBe(true);
      expect(getStoredAbcIncidents('stu-y').some((i) => i.id === 'inc-to-delete')).toBe(true);

      removeStoredSessionIncident(sessionId, 'inc-to-delete');

      expect(getStoredIncidents(sessionId).some((i) => i.id === 'inc-to-delete')).toBe(false);
      expect(getStoredAbcIncidents('stu-y').some((i) => i.id === 'inc-to-delete')).toBe(false);
    });
  });

  describe('5. Teacher Assignments & Swapping Persistence', () => {
    it('preserves teacher-scoped student order after swapping', () => {
      const teacherId = 't-abeba';
      const sessionId = 'session-swap-test';
      const students = [
        { id: 'stu-1', name: 'Yonas', active: true },
        { id: 'stu-2', name: 'Meron', active: false },
      ];

      setStoredSessionStudents(sessionId, students, teacherId);

      const retrievedOriginal = getStoredSessionStudents(sessionId, teacherId);
      expect(retrievedOriginal?.map((s) => s.id)).toEqual(['stu-1', 'stu-2']);

      // Swap students
      const swapped = [...students].reverse();
      setStoredSessionStudents(sessionId, swapped, teacherId);

      const retrievedSwapped = getStoredSessionStudents(sessionId, teacherId);
      expect(retrievedSwapped?.map((s) => s.id)).toEqual(['stu-2', 'stu-1']);
    });
  });

  describe('6. API Validation Safeguards', () => {
    it('throws error when logTrial is called without studentId or goalId', async () => {
      await expect(logTrial('sess-1', '', 'goal-1', { promptLevel: '+' })).rejects.toThrow(
        /valid studentId/i
      );
      await expect(logTrial('sess-1', 'stu-1', '', { promptLevel: '+' })).rejects.toThrow(
        /valid goalId/i
      );
    });

    it('throws error when undoLastTrial is called without studentId', async () => {
      await expect(undoLastTrial('sess-1', '', 'goal-1')).rejects.toThrow(/valid studentId/i);
    });

    it('throws error when recordBehaviorIncident is called without studentId', async () => {
      await expect(recordBehaviorIncident('sess-1', { behavior: 'Aggression' })).rejects.toThrow(
        /valid studentId/i
      );
    });
  });
});
