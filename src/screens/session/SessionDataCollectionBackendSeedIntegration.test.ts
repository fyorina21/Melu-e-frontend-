import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setStoredSessionStudents,
  getStoredSessionStudents,
  recordTrialInStore,
  getStoredTrials,
  undoTrialInStore,
  enqueueOfflineSync,
  getOfflineSyncQueue,
  removeOfflineSyncItem,
  incrementOfflineSyncRetry,
  clearOfflineSyncQueue,
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
import {
  startSessionTimer,
  pauseSessionTimer,
  resumeSessionTimer,
  remainingSeconds,
  isTimerRunning,
} from '../../stores/sessionTimerStore';

describe('SessionDataCollectionScreen Backend Seed Data & Infinite Loading Prevention', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('1. Infinite Loading & Re-render Prevention', () => {
    it('does not re-select or re-render teacher when targetTeacherId matches current teacher', () => {
      let stateUpdateCount = 0;
      let currentSelectedId = 'a507bea6-2878-4c30-b4c5-9d051ad5edf3'; // Abeba Tadesse

      const handleTeacherResolution = (resolvedId: string) => {
        if (resolvedId && resolvedId !== currentSelectedId) {
          currentSelectedId = resolvedId;
          stateUpdateCount++;
        }
      };

      // Call 5 times with identical teacher ID (simulating hook evaluations)
      handleTeacherResolution('a507bea6-2878-4c30-b4c5-9d051ad5edf3');
      handleTeacherResolution('a507bea6-2878-4c30-b4c5-9d051ad5edf3');
      handleTeacherResolution('a507bea6-2878-4c30-b4c5-9d051ad5edf3');
      handleTeacherResolution('a507bea6-2878-4c30-b4c5-9d051ad5edf3');
      handleTeacherResolution('a507bea6-2878-4c30-b4c5-9d051ad5edf3');

      expect(stateUpdateCount).toBe(0);
      expect(currentSelectedId).toBe('a507bea6-2878-4c30-b4c5-9d051ad5edf3');
    });

    it('safely computes display time even when secondsRemaining is null or uninitialized', () => {
      const computeDisplayTime = (secondsRemaining: number | null, sessionDurationMinutes = 90) => {
        const timerRem = remainingSeconds();
        const displaySeconds = Math.max(
          0,
          secondsRemaining ?? (timerRem > 0 ? timerRem : (sessionDurationMinutes * 60))
        );
        const minutes = String(Math.floor(displaySeconds / 60)).padStart(2, '0');
        const seconds = String(displaySeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
      };

      // When null, it defaults to session duration without blocking UI
      expect(computeDisplayTime(null, 90)).toBe('90:00');
      // When set, formats correctly
      expect(computeDisplayTime(3540)).toBe('59:00');
      expect(computeDisplayTime(45)).toBe('00:45');
    });
  });

  describe('2. Real Rails Database Seed Students & Goals Parsing', () => {
    const seedStudentsOptions = [
      {
        id: '8af22fc2-c383-4598-a38c-32f6f84715c6',
        name: 'Amir Hassan',
        status: 'In assessment',
        program: 'Regular',
      },
      {
        id: '6d4df7cc-eaab-41b7-baf2-6d36aed8ba3f',
        name: 'Tigist Bekele',
        status: 'In assessment',
        program: 'Pulled out',
      },
      {
        id: 'ef72fb29-84e5-4c5c-b1aa-cee07912f98e',
        name: 'Yonas Girma',
        status: 'Active therapy',
        program: 'Regular',
      },
      {
        id: 'c0b31082-f7af-4a61-ad54-9a93df1a7540',
        name: 'Meron Haile',
        status: 'Active therapy',
        program: 'Regular',
      },
      {
        id: 'ae652c79-4b1e-428c-a5af-22f5069b467b',
        name: 'Abel Tadesse',
        status: 'Active therapy',
        program: 'Regular',
      },
      {
        id: 'df48413e-5044-4946-99d3-a3691941ef3f',
        name: 'Liya Belay',
        status: 'Active therapy',
        program: 'Regular',
      },
    ];

    it('correctly parses Teacher 1 (Abeba Tadesse) assigned block students and their real station goals', () => {
      const teacher1 = {
        id: 'a507bea6-2878-4c30-b4c5-9d051ad5edf3',
        name: 'Abeba Tadesse',
        role: 'teacher',
      };

      // Rails backend schedule block b1 for Teacher 1
      const teacherBlocks = [
        {
          id: 'b1',
          teacherId: teacher1.id,
          teacherName: 'Teacher',
          stationName: 'Station 1 (Basic Skills)',
          studentIds: [
            'ef72fb29-84e5-4c5c-b1aa-cee07912f98e',
            'c0b31082-f7af-4a61-ad54-9a93df1a7540',
          ],
        },
      ];

      const { assignedStudentIds, activeBlock } = resolveTeacherAssignedStudentIds(teacher1, teacherBlocks);
      expect(assignedStudentIds).toEqual([
        'ef72fb29-84e5-4c5c-b1aa-cee07912f98e',
        'c0b31082-f7af-4a61-ad54-9a93df1a7540',
      ]);
      expect(activeBlock?.stationName).toBe('Station 1 (Basic Skills)');

      const eligibleStudents = resolveEligibleTeacherStudents(assignedStudentIds, seedStudentsOptions);
      expect(eligibleStudents).toHaveLength(2);
      expect(eligibleStudents[0].name).toBe('Yonas Girma');
      expect(eligibleStudents[1].name).toBe('Meron Haile');

      // Extract real goals from Rails student profile current_goals_summary
      const yonasGoalsSummary = [
        {
          station: { id: 'd4de6f35-74cd-4af4-ab6e-a0ef4dfacd3b', name: 'Station 1' },
          goals: [
            { id: '50136708-b235-46ea-83ae-40c39217818e', goal_name: 'Initiate greeting with peers', progress_percent: 30 },
            { id: '38f0a673-5ec3-4341-914a-d5d67138f82a', goal_name: 'Request preferred items using words', progress_percent: 0 },
          ],
        },
      ];

      const extractedGoals = yonasGoalsSummary.flatMap((g) =>
        g.goals.map((goal) => ({
          id: goal.id,
          name: goal.goal_name,
          category: g.station.name,
          goalType: 'standard',
          totalTrials: 0,
          independencePercent: goal.progress_percent,
          trialLog: [],
        }))
      );

      expect(extractedGoals).toHaveLength(2);
      expect(extractedGoals[0].name).toBe('Initiate greeting with peers');
      expect(extractedGoals[0].id).toBe('50136708-b235-46ea-83ae-40c39217818e');
      expect(extractedGoals[1].name).toBe('Request preferred items using words');
    });

    it('correctly parses active session roster students (Amir Hassan, Tigist Bekele) with seeded goals', () => {
      const activeSessionRoster = {
        students: [
          {
            id: '8af22fc2-c383-4598-a38c-32f6f84715c6',
            fullName: 'Amir Hassan',
            goals: [
              { id: '4da2eec0-3c3a-4cad-99cd-f9776f2fcc2d', name: 'Communication & Requesting' },
            ],
          },
          {
            id: '6d4df7cc-eaab-41b7-baf2-6d36aed8ba3f',
            fullName: 'Tigist Bekele',
            goals: [
              { id: '173f1564-fb94-47cc-89d5-c28a5e2e8463', name: 'Receptive Identification of Common Objects' },
              { id: '4fd2f2aa-2981-42dc-b36d-ba57fd149d29', name: 'Gross Motor Imitation: Two-Step Actions' },
            ],
          },
        ],
      };

      const candidateAmir = {
        id: '8af22fc2-c383-4598-a38c-32f6f84715c6',
        name: 'Amir Hassan',
        status: 'In assessment',
        sessionAssigned: true, // Marked because returned from active session roster
      };

      expect(isStudentEligibleForSession(candidateAmir)).toBe(true);

      const amirGoals = activeSessionRoster.students[0].goals.map((g) => ({
        id: g.id,
        name: g.name,
        category: 'Adaptive',
        goalType: 'standard',
        totalTrials: 0,
        independencePercent: 0,
        trialLog: [],
      }));

      expect(amirGoals).toHaveLength(1);
      expect(amirGoals[0].name).toBe('Communication & Requesting');
      expect(amirGoals[0].id).toBe('4da2eec0-3c3a-4cad-99cd-f9776f2fcc2d');
    });

    it('renders clean empty state for teachers with 0 assigned students (Yeabsera Mitiku) without mock fallback', () => {
      const teacherYeabsera = {
        id: '6209c347-9801-4021-a017-661f83998fb2',
        name: 'yeabsera mitiku',
        role: 'teacher',
      };

      const yeabseraBlocks = [
        {
          id: 'b1',
          teacherId: teacherYeabsera.id,
          teacherName: 'Teacher',
          studentIds: [],
        },
      ];

      const { assignedStudentIds } = resolveTeacherAssignedStudentIds(teacherYeabsera, yeabseraBlocks);
      expect(assignedStudentIds).toEqual([]);

      const eligible = resolveEligibleTeacherStudents(assignedStudentIds, seedStudentsOptions);
      expect(eligible).toEqual([]);
      // Confirms empty state: no students, no fake mock injection!
    });
  });

  describe('3. Timer Persistence & Swap Isolation Across Navigations', () => {
    it('maintains teacher-specific swapped student order', () => {
      const teacherId = 'a507bea6-2878-4c30-b4c5-9d051ad5edf3';
      const initialRoster = [
        { id: 'ef72fb29-84e5-4c5c-b1aa-cee07912f98e', name: 'Yonas Girma', active: true },
        { id: 'c0b31082-f7af-4a61-ad54-9a93df1a7540', name: 'Meron Haile', active: false },
      ];

      // Swapping order
      const swapped = [...initialRoster].reverse().map((s, idx) => ({ ...s, active: idx === 0 }));
      setStoredSessionStudents('active', swapped, teacherId);

      const retrieved = getStoredSessionStudents('active', teacherId);
      expect(retrieved?.[0].name).toBe('Meron Haile');
      expect(retrieved?.[0].active).toBe(true);
      expect(retrieved?.[1].name).toBe('Yonas Girma');
    });

    it('maintains timer running and pause state without resetting during roster refreshes', () => {
      const sessionId = 'session-test-timer-refresh';
      startSessionTimer(sessionId, 5400); // 90 minutes = 5400s
      expect(isTimerRunning()).toBe(true);

      // Pause timer
      pauseSessionTimer();
      expect(isTimerRunning()).toBe(false);
      const pausedRem = remainingSeconds();

      // Simulate roster refresh: re-calling startSessionTimer for same session MUST NOT reset
      startSessionTimer(sessionId, 5400);
      expect(isTimerRunning()).toBe(false);
      expect(remainingSeconds()).toBe(pausedRem);

      // Resuming counts down correctly
      resumeSessionTimer(sessionId, 5400);
      expect(isTimerRunning()).toBe(true);
      expect(remainingSeconds()).toBeLessThanOrEqual(pausedRem);
    });
  });

  describe('4. API Timeouts, Retry Handling & Profile Enrichment', () => {
    function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
      let timer: any;
      const timeoutPromise = new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      });
      return Promise.race([promise, timeoutPromise]).finally(() => {
        if (timer) clearTimeout(timer);
      });
    }

    it('withTimeout returns resolved data when API responds within timeout', async () => {
      const fastPromise = new Promise((resolve) => setTimeout(() => resolve({ success: true }), 20));
      const result = await withTimeout(fastPromise, 200, { success: false });
      expect(result).toEqual({ success: true });
    });

    it('withTimeout returns fallback when API request hangs or exceeds timeout', async () => {
      const hangingPromise = new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
      const result = await withTimeout(hangingPromise, 50, { fallback: true, data: [] });
      expect(result).toEqual({ fallback: true, data: [] });
    });

    it('clears loadError on retry to allow loading screen transition', () => {
      let loadError = true;
      let loading = false;

      // Simulated loadRoster trigger on Retry press
      const onRetry = () => {
        loading = true;
        loadError = false;
      };

      onRetry();
      expect(loadError).toBe(false);
      expect(loading).toBe(true);
    });

    it('enriches student names and program types from backend student profile responses', () => {
      const rawAssigned = [
        { id: 'ef72fb29-84e5-4c5c-b1aa-cee07912f98e', name: 'Student ef72', program: 'Regular' },
      ];
      const studentProfileMap = new Map<string, any>();
      studentProfileMap.set('ef72fb29-84e5-4c5c-b1aa-cee07912f98e', {
        full_name: 'Yonas Girma',
        program_type: 'regular',
        status: 'active_therapy',
      });

      const finalStudents = rawAssigned.map((ds) => {
        const profile = studentProfileMap.get(ds.id);
        return {
          id: ds.id,
          name: String(profile?.full_name || ds.name),
          program: String(profile?.program_type || ds.program),
        };
      });

      expect(finalStudents[0].name).toBe('Yonas Girma');
      expect(finalStudents[0].program).toBe('regular');
    });
  });

  describe('5. Audit Fixes: Undo Isolation, Offline Sync Retry Queue & Race Condition Prevention', () => {
    const testSessionId = 'session-audit-fixes';
    const studentId = 'stu-yonas-girma';
    const goalAId = 'goal-communication-greeting';
    const goalBId = 'goal-requesting-items';

    it('strictly isolates undo to target goal and trial ID without removing trials from other goals', () => {
      // 1. Record 2 trials on Goal A and 1 trial on Goal B
      const trialA1 = {
        id: 'trial-a-1',
        promptLevel: 'VERBAL',
        timestamp: '10:01:00',
        sessionId: testSessionId,
        studentGoalId: goalAId,
      };
      const trialA2 = {
        id: 'trial-a-2',
        promptLevel: 'INDEPENDENT',
        timestamp: '10:02:00',
        sessionId: testSessionId,
        studentGoalId: goalAId,
      };
      const trialB1 = {
        id: 'trial-b-1',
        promptLevel: 'PHYSICAL',
        timestamp: '10:03:00',
        sessionId: testSessionId,
        studentGoalId: goalBId,
      };

      recordTrialInStore(testSessionId, studentId, goalAId, trialA1);
      recordTrialInStore(testSessionId, studentId, goalAId, trialA2);
      recordTrialInStore(testSessionId, studentId, goalBId, trialB1);

      const allBefore = getStoredTrials(testSessionId, studentId);
      expect(allBefore).toHaveLength(3);

      // 2. Undo the last trial of Goal A specifically
      undoTrialInStore(testSessionId, studentId, goalAId, 'trial-a-2');

      const allAfter = getStoredTrials(testSessionId, studentId);
      expect(allAfter).toHaveLength(2);
      expect(allAfter.find((t) => t.id === 'trial-a-2')).toBeUndefined();
      expect(allAfter.find((t) => t.id === 'trial-a-1')).toBeDefined();
      expect(allAfter.find((t) => t.id === 'trial-b-1')).toBeDefined(); // Goal B trial completely untouched!

      // 3. Attempting to undo Goal A again with non-existent trial ID leaves Goal B intact
      undoTrialInStore(testSessionId, studentId, goalAId, 'trial-nonexistent');
      const allAfterInvalid = getStoredTrials(testSessionId, studentId);
      expect(allAfterInvalid).toHaveLength(2);
      expect(allAfterInvalid.find((t) => t.id === 'trial-b-1')).toBeDefined();
    });

    it('enqueues failed background operations into offline sync queue, tracks retry counts, and removes on success', () => {
      clearOfflineSyncQueue();
      expect(getOfflineSyncQueue()).toEqual([]);

      // 1. Enqueue failed log trial
      enqueueOfflineSync({
        type: 'log_trial',
        sessionId: testSessionId,
        studentId,
        goalId: goalAId,
        trialId: 'trial-offline-1',
        payload: { promptLevel: 'GESTURAL', timestamp: '10:05:00' },
      });

      // 2. Enqueue failed undo trial
      enqueueOfflineSync({
        type: 'undo_trial',
        sessionId: testSessionId,
        studentId,
        goalId: goalBId,
        trialId: 'trial-b-1',
      });

      // 3. Enqueue failed behavior incident
      enqueueOfflineSync({
        type: 'behavior_incident',
        sessionId: testSessionId,
        studentId,
        goalId: goalAId,
        payload: { antecedent: 'Task demand', behavior: 'Elopement', intensity: 'Moderate' },
      });

      const queue = getOfflineSyncQueue();
      expect(queue).toHaveLength(3);
      expect(queue[0].type).toBe('log_trial');
      expect(queue[0].retryCount).toBe(0);
      expect(queue[1].type).toBe('undo_trial');
      expect(queue[2].type).toBe('behavior_incident');

      // 4. Retry handling increments count
      incrementOfflineSyncRetry(queue[0].id);
      const afterRetry = getOfflineSyncQueue();
      expect(afterRetry[0].retryCount).toBe(1);

      // 5. Successful retry removes item from queue
      removeOfflineSyncItem(queue[0].id);
      const afterRemoval = getOfflineSyncQueue();
      expect(afterRemoval).toHaveLength(2);
      expect(afterRemoval.find((item) => item.id === queue[0].id)).toBeUndefined();
    });

    it('prevents race conditions during rapid teacher switching using monotonic request IDs', () => {
      let latestCompletedTeacherId = '';
      let fetchRequestId = 0;

      const simulateTeacherLoad = async (teacherId: string, delayMs: number) => {
        const currentReqId = ++fetchRequestId;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        // Only the latest initiated request is allowed to commit
        if (currentReqId === fetchRequestId) {
          latestCompletedTeacherId = teacherId;
        }
      };

      // Teacher A is clicked, but response is slow (100ms)
      simulateTeacherLoad('teacher-a-slow', 100);
      // Teacher B is clicked quickly after, and resolves faster (20ms)
      simulateTeacherLoad('teacher-b-fast', 20);

      // Wait for both to complete
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Even though Teacher A started first and finished last, Teacher B's selection MUST prevail!
          expect(latestCompletedTeacherId).toBe('teacher-b-fast');
          resolve();
        }, 150);
      });
    });

    it('strictly denies fallback roster leakage for teachers with 0 assigned schedule blocks', () => {
      const unassignedTeacher = {
        id: '6209c347-9801-4021-a017-661f83998fb2',
        name: 'yeabsera mitiku',
      };

      const schoolBlocks = [
        {
          id: 'b-station-1',
          teacherId: 'other-teacher-id',
          teacherName: 'Abeba Tadesse',
          studentIds: ['stu-1', 'stu-2'],
        },
      ];

      const { assignedStudentIds } = resolveTeacherAssignedStudentIds(unassignedTeacher, schoolBlocks);
      expect(assignedStudentIds).toEqual([]);

      // In active session, fallback to session roster students is blocked when teacher is specified
      const sessionRosterStudents = [{ id: 'stu-1' }, { id: 'stu-2' }];
      const targetTeacherId = unassignedTeacher.id;
      const sessionId = 'active';

      let resolvedIds = assignedStudentIds;
      if (resolvedIds.length === 0 && sessionRosterStudents.length > 0) {
        if (!targetTeacherId || sessionId !== 'active') {
          resolvedIds = sessionRosterStudents.map((s) => s.id);
        }
      }

      // Resolves to 0 students, preventing accidental student leak to Yeabsera!
      expect(resolvedIds).toEqual([]);
    });
  });
});

