import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usePermission } from '../../auth/usePermission';
import { useFocusEffect } from '@react-navigation/native';
import {
  isStudentDeleted,
  filterOutDeletedStudents,
  onDeletedStudentChanged,
} from '../../utils/deletedStudentHelper';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { secureRandomId } from '../../utils/cryptoRandom';
import StudentSessionCard from './components/StudentSessionCard';
import BehaviorIncidentModal from './components/BehaviorIncidentModal';
import type { IncidentPayload } from './components/BehaviorIncidentModal';
import {
  startSession,
  getSessionRoster,
  logTrial,
  undoLastTrial,
  recordBehaviorIncident,
  swapStudents,
} from '../../api/sessionApi';
import { studentsApi } from '../../api/resources/students';
import { getStoredIupDraft } from '../../api/programDirectorApi';
import { getStudentAssignedGoals } from './sessionEligibilityHelper';
import { getTeacherDashboard } from '../../api/teacherExtrasApi';
import { getStaffOptions, getStudentOptions } from '../../api/optionsApi';
import { getDirectorSchedule } from '../../api/directorApi';
import {
  isStudentEligibleForSession,
  registerStudentStatuses,
  getRegisteredStudentStatus,
} from '../../utils/studentLifecycleHelper';
import {
  findLoggedInTeacher,
  resolveTeacherAssignedStudentIds,
  getDirectorAssignmentsForTeacher,
  onScheduleAssignmentsChanged,
} from '../../utils/teacherScheduleHelper';
import {
  isStaffDeleted,
  filterOutDeletedStaff,
  onDeletedStaffChanged,
} from '../../utils/deletedStaffHelper';
import type { SessionStackParamList, SessionRoster, Payload, Trial } from '../../types';
import {
  startSessionTimer,
  resumeSessionTimer,
  pauseSessionTimer,
  remainingSeconds,
  isTimerRunning,
} from '../../stores/sessionTimerStore';
import {
  getStoredTrials,
  recordTrialInStore,
  undoTrialInStore,
  updateTrialIdInStore,
  recordIncidentInStore,
  removeStoredSessionIncident,
  getStoredIncidents,
  setStoredSessionStudents,
  getStoredSessionStudents,
  enqueueOfflineSync,
  getOfflineSyncQueue,
  removeOfflineSyncItem,
  incrementOfflineSyncRetry,
} from '../../stores/trialsStore';

type Props = NativeStackScreenProps<SessionStackParamList, 'SessionDataCollection'>;

interface IncidentModalState {
  studentId: string;
  studentGoalId?: string;
  studentName?: string;
  goalName?: string;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 2000, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export default function SessionDataCollectionScreen({ route, navigation }: Props) {
  const sessionId = route.params?.sessionId ?? 'active';
  const { session: authSession } = useAuth();
  const { showToast } = useToast();
  const canCreateTrial = usePermission('sessions', 'create');
  const canEditSession = usePermission('sessions', 'edit');

  const [session, setSession] = useState<SessionRoster | null>(() => {
    const initialTeacherId =
      (route.params as any)?.teacherId ||
      (typeof localStorage !== 'undefined'
        ? localStorage.getItem('melue_session_selected_teacher_id') || undefined
        : undefined);
    const stored = getStoredSessionStudents(sessionId, initialTeacherId);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return {
        teacherName: 'Teacher',
        stationName: 'Station 1',
        roomName: 'Room 101',
        blockDurationMinutes: 90,
        students: stored.map((s: any, idx: number) => ({
          id: String(s.id),
          name: String(s.name || '').trim(),
          initial: String(s.initial || (String(s.name || '').slice(0, 2) || 'ST').toUpperCase()),
          program: String(s.program || 'Regular'),
          active: idx === 0,
          goals: Array.isArray(s.goals) ? s.goals : [],
          trials: Array.isArray(s.trials) ? s.trials : [],
        })),
      };
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => !session);
  const [loadError, setLoadError] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(() => {
    const rem = remainingSeconds();
    return rem > 0 ? rem : null;
  });
  const [isRunning, setIsRunning] = useState(() => isTimerRunning());
  const [incidentModal, setIncidentModal] = useState<IncidentModalState | null>(null);
  const [localIncidents, setLocalIncidents] = useState<IncidentPayload[]>(() => {
    return (getStoredIncidents(sessionId) as unknown as IncidentPayload[]) || [];
  });

  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    return (
      (route.params as any)?.teacherId ||
      (typeof localStorage !== 'undefined'
        ? localStorage.getItem('melue_session_selected_teacher_id') || ''
        : '')
    );
  });

  const teachersRef = useRef<Array<{ id: string; name: string }>>([]);
  const selectedTeacherIdRef = useRef<string>(selectedTeacherId);
  selectedTeacherIdRef.current = selectedTeacherId;
  const fetchRequestIdRef = useRef<number>(0);
  const isFlushingSyncRef = useRef<boolean>(false);
  const initializedRef = useRef<boolean>(false);

  const flushOfflineSyncQueue = useCallback(async (currentSessionId?: string) => {
    if (isFlushingSyncRef.current) return;
    const queue = getOfflineSyncQueue();
    if (!queue || queue.length === 0) return;

    isFlushingSyncRef.current = true;
    try {
      for (const item of queue) {
        if (currentSessionId && item.sessionId !== currentSessionId) continue;
        if (item.retryCount > 5) {
          removeOfflineSyncItem(item.id);
          continue;
        }

        try {
          if (item.type === 'log_trial' || item.type === 'logTrial') {
            const res = await logTrial(
              item.sessionId,
              item.studentId || '',
              item.goalId || '',
              item.payload,
            );
            const serverTrialId = (res as any)?.data?.trial?.id || (res as any)?.data?.id;
            if (serverTrialId && item.trialId && serverTrialId !== item.trialId && item.studentId) {
              updateTrialIdInStore(
                item.sessionId,
                item.studentId,
                item.trialId,
                String(serverTrialId),
              );
            }
            removeOfflineSyncItem(item.id);
          } else if (item.type === 'undo_trial' || item.type === 'undoTrial') {
            await undoLastTrial(item.sessionId, item.studentId || '', item.goalId || '');
            removeOfflineSyncItem(item.id);
          } else if (item.type === 'behavior_incident' || item.type === 'recordIncident') {
            await recordBehaviorIncident(item.sessionId, item.payload as Payload);
            removeOfflineSyncItem(item.id);
          }
        } catch {
          incrementOfflineSyncRetry(item.id);
          break;
        }
      }
    } finally {
      isFlushingSyncRef.current = false;
    }
  }, []);

  useEffect(() => {
    flushOfflineSyncQueue(sessionId);
    const handleOnline = () => {
      flushOfflineSyncQueue(sessionId);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      return () => {
        window.removeEventListener('online', handleOnline);
      };
    }
  }, [sessionId, flushOfflineSyncQueue]);

  useEffect(() => {
    const cached = getStoredIncidents(sessionId) as unknown as IncidentPayload[];
    if (cached && cached.length > 0) {
      setLocalIncidents(cached);
    }
  }, [sessionId]);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const loadRoster = useCallback(
    async (teacherIdToLoad?: string, silent = false) => {
      const requestId = ++fetchRequestIdRef.current;
      try {
        if (!silent && !session) {
          setLoading(true);
          setLoadError(false);
        }
        // Start the session on the backend asynchronously without blocking roster load
        startSession(sessionId).catch(() => {});

        // Fetch teachers list if not already cached
        let currentTeachers = filterOutDeletedStaff(
          teachersRef.current.length > 0 ? teachersRef.current : teachers,
        );
        if (currentTeachers.length === 0) {
          try {
            const staffRes = await withTimeout<any>(
              getStaffOptions().catch(() => null),
              2000,
              null,
            );
            const teacherRows: Array<{ id: string; name: string }> = (
              filterOutDeletedStaff(staffRes?.data || []) as any[]
            ).filter((s: any) => s.role === 'teacher');
            if (teacherRows.length > 0) {
              currentTeachers = teacherRows;
              teachersRef.current = teacherRows;
              setTeachers(teacherRows);
            }
          } catch {}
        }

        // Determine active target teacher ID
        let targetTeacherId = teacherIdToLoad || (route.params as any)?.teacherId;
        if (targetTeacherId && isStaffDeleted(targetTeacherId)) {
          targetTeacherId = undefined;
        }
        if (!targetTeacherId && currentTeachers.length > 0) {
          const matched = findLoggedInTeacher(authSession, currentTeachers);
          if (matched && !isStaffDeleted(matched)) targetTeacherId = matched.id;
        }
        if (
          !targetTeacherId &&
          selectedTeacherIdRef.current &&
          !isStaffDeleted(selectedTeacherIdRef.current)
        ) {
          targetTeacherId = selectedTeacherIdRef.current;
        }
        if (!targetTeacherId && currentTeachers.length > 0) {
          targetTeacherId = currentTeachers[0].id;
        }
        if (targetTeacherId && targetTeacherId !== selectedTeacherIdRef.current) {
          selectedTeacherIdRef.current = targetTeacherId;
          setSelectedTeacherId(targetTeacherId);
          if (typeof localStorage !== 'undefined') {
            try {
              localStorage.setItem('melue_session_selected_teacher_id', targetTeacherId);
            } catch {}
          }
        }

        // Parallel fetch with fast 2000ms timeout
        const [schedRes, allSchedRes, studentOptsRes, dashRes, sessionRosterRes] =
          await Promise.all([
            targetTeacherId
              ? withTimeout(
                  getDirectorSchedule({ teacherId: targetTeacherId }).catch(() => null),
                  2000,
                  null,
                )
              : null,
            withTimeout(
              getDirectorSchedule({}).catch(() => null),
              2000,
              null,
            ),
            withTimeout(
              getStudentOptions().catch(() => null),
              2000,
              null,
            ),
            withTimeout(
              getTeacherDashboard().catch(() => null),
              2000,
              null,
            ),
            withTimeout(
              getSessionRoster(sessionId).catch(() => null),
              2000,
              null,
            ),
          ]);

        if (requestId !== fetchRequestIdRef.current) return;

        const studentOpts = Array.isArray(studentOptsRes?.data) ? studentOptsRes.data : [];
        registerStudentStatuses(studentOpts);
        const studentMap = new Map(studentOpts.map((s: any) => [String(s.id), s]));

        const sessionRosterStudents: any[] = Array.isArray(sessionRosterRes?.data?.students)
          ? sessionRosterRes.data.students
          : [];

        // Build goals map from session roster
        const studentGoalsMap = new Map<string, any[]>();
        sessionRosterStudents.forEach((s: any) => {
          if (s?.id && Array.isArray(s?.goals)) {
            studentGoalsMap.set(String(s.id), s.goals);
          }
        });

        const blocks: any[] = Array.isArray(schedRes?.data) ? schedRes.data : [];
        const allBlocks: any[] = Array.isArray(allSchedRes?.data) ? allSchedRes.data : blocks;
        const currentTeacherObj = currentTeachers.find(
          (t) => String(t.id) === String(targetTeacherId),
        );

        // 1. Resolve assigned student IDs strictly belonging to this teacher
        const { assignedStudentIds: strictlyAssignedIds, activeBlock } =
          resolveTeacherAssignedStudentIds(
            currentTeacherObj || null,
            blocks.length > 0 ? blocks : allBlocks,
          );

        // Check if director has explicit assignments for this teacher
        const directorAssignedIds = targetTeacherId
          ? getDirectorAssignmentsForTeacher(targetTeacherId)
          : null;

        // 2. Check if students were explicitly assigned or passed for this specific teacher
        let assignedStudentIds = strictlyAssignedIds.filter((sid) => !isStudentDeleted(sid));

        if (directorAssignedIds !== null) {
          assignedStudentIds = directorAssignedIds
            .filter((sid) => !isStudentDeleted(sid))
            .slice(0, 2);
        } else if (
          route.params?.students &&
          Array.isArray(route.params.students) &&
          route.params.students.length > 0
        ) {
          const passedTeacherId = (route.params as any)?.teacherId;
          if (!passedTeacherId || String(passedTeacherId) === String(targetTeacherId)) {
            const passedIds = route.params.students.map((s: any) => String(s.id));
            if (
              assignedStudentIds.length === 0 ||
              passedIds.some((pid) => assignedStudentIds.includes(pid))
            ) {
              assignedStudentIds = Array.from(new Set(passedIds)).slice(0, 2);
            }
          }
        }

        // Check teacher-scoped stored session students (which preserves swapped order)
        let storedOrder: string[] | null = null;
        if (targetTeacherId) {
          const stored = getStoredSessionStudents(sessionId, targetTeacherId);
          if (Array.isArray(stored)) {
            if (assignedStudentIds.length === 0 && stored.length > 0) {
              assignedStudentIds = Array.from(new Set(stored.map((s: any) => String(s.id)))).slice(
                0,
                2,
              );
            }
            if (stored.length > 0) {
              storedOrder = stored.map((s: any) => String(s.id));
            }
          }
        }

        // Fallback to session roster only if no specific teacher was requested, or for non-active sessions with explicit roster
        if (assignedStudentIds.length === 0 && sessionRosterStudents.length > 0) {
          if (!targetTeacherId || sessionId !== 'active') {
            assignedStudentIds = sessionRosterStudents.map((s: any) => String(s.id)).slice(0, 2);
          }
        }

        const fallbackBlock = allBlocks.find((b: any) => b?.teacherName || b?.stationName) || null;
        const currentTeacherName =
          currentTeacherObj?.name ||
          activeBlock?.teacherName ||
          (authSession?.userName ?? 'Teacher');
        const currentStationName =
          activeBlock?.stationName || fallbackBlock?.stationName || 'Station 1';
        const currentRoomName = activeBlock?.roomName || fallbackBlock?.roomName || 'Room 101';
        const currentDurationMinutes = Number(
          activeBlock?.blockDurationMinutes || fallbackBlock?.blockDurationMinutes || 90,
        );

        // Filter assigned students strictly by session eligibility
        const eligibleStudents: any[] = [];
        for (const sid of assignedStudentIds) {
          if (isStudentDeleted(sid)) continue;
          const opt = studentMap.get(sid);
          const reg = getRegisteredStudentStatus(sid);
          const fromRoster = sessionRosterStudents.find((s: any) => String(s.id) === sid);
          const base = opt || reg || fromRoster || { id: sid, name: `Student ${sid.slice(0, 4)}` };

          const candidate = {
            ...base,
            id: sid,
            sessionAssigned: true,
          };

          if (!isStudentDeleted(candidate) && isStudentEligibleForSession(candidate)) {
            eligibleStudents.push({
              ...candidate,
              status: 'in_session',
            });
          }
        }

        // Limit strictly to at most 2 students per station
        const cappedStudents = filterOutDeletedStudents(eligibleStudents).slice(0, 2);

        // Fetch real backend student detail goals for assigned students if not present in draft or roster
        const studentProfileMap = new Map<string, any>();
        await Promise.all(
          cappedStudents.map(async (ds: any) => {
            const sid = String(ds.id);
            try {
              const detailRes = await withTimeout(
                studentsApi.show(sid).catch(() => null),
                1500,
                null,
              );
              const sData = (detailRes as any)?.data || detailRes;
              if (sData) {
                studentProfileMap.set(sid, sData);
              }
              if (!studentGoalsMap.has(sid) && (!ds.goals || ds.goals.length === 0)) {
                const extracted: any[] = [];
                if (Array.isArray(sData?.current_goals_summary)) {
                  sData.current_goals_summary.forEach((group: any) => {
                    if (Array.isArray(group?.goals)) {
                      group.goals.forEach((g: any) => {
                        extracted.push({
                          id: String(g.id),
                          name: String(g.goal_name || g.name || 'Assigned Goal'),
                          category: group?.station?.name || 'Adaptive',
                          goalType: 'standard',
                          totalTrials: 0,
                          independencePercent: Number(g.progress_percent || 0),
                          trialLog: [],
                        });
                      });
                    }
                  });
                }
                if (extracted.length > 0) {
                  studentGoalsMap.set(sid, extracted);
                }
              }
            } catch {}
          }),
        );

        if (requestId !== fetchRequestIdRef.current) return;

        // Map into full session student models without synthesizing mock goals
        let finalStudents: any[] = cappedStudents.map((ds: any) => {
          const sid = String(ds.id);
          const profile = studentProfileMap.get(sid);
          const sName = String(
            profile?.full_name || profile?.name || ds.name || ds.fullName || 'Student',
          ).trim();
          const initial = String(ds.initial || (sName.slice(0, 2) || 'ST').toUpperCase());
          const program = String(
            profile?.program_type || profile?.program || ds.program || 'Regular',
          );

          const rawGoals = studentGoalsMap.get(sid) || ds.goals || [];
          const assignedGoals = getStudentAssignedGoals(sid, rawGoals);

          return {
            id: sid,
            name: sName,
            initial,
            program,
            goals: assignedGoals,
            trials: Array.isArray(ds.trials) ? ds.trials : [],
          };
        });

        // If a swapped order was saved for this teacher, preserve it!
        if (storedOrder && storedOrder.length === finalStudents.length) {
          const sorted = [...finalStudents].sort((a, b) => {
            const idxA = storedOrder!.indexOf(String(a.id));
            const idxB = storedOrder!.indexOf(String(b.id));
            return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
          });
          if (sorted.length === finalStudents.length) {
            finalStudents = sorted;
          }
        }

        // Persist the teacher-specific student roster
        setStoredSessionStudents(sessionId, finalStudents, targetTeacherId);

        const parsedRoster: SessionRoster = {
          teacherName: currentTeacherName,
          stationName: currentStationName,
          roomName: currentRoomName,
          blockDurationMinutes: currentDurationMinutes,
          students: finalStudents.map((s: any, idx: number) => ({
            id: String(s.id),
            name: String(s.name).trim(),
            initial: String(s.initial || (String(s.name).slice(0, 2) || 'ST').toUpperCase()),
            program: String(s.program || 'Regular'),
            active: idx === 0,
            goals: Array.isArray(s.goals)
              ? s.goals.map((g: any) => ({
                  id: String(g.id),
                  name: String(g.name || 'Goal'),
                  category: g.category || g.domain || 'Adaptive',
                  goalType: g.goalType || g.goal_type || 'standard',
                  totalTrials: Number(g.totalTrials || 0),
                  independencePercent: Number(g.independencePercent || 0),
                  trialLog: Array.isArray(g.trialLog) ? g.trialLog : [],
                }))
              : [],
            trials: Array.isArray(s.trials) ? s.trials : [],
          })),
        };

        if (parsedRoster.students.length > 0 && !parsedRoster.students.some((s) => s.active)) {
          parsedRoster.students[0].active = true;
        }

        if (requestId !== fetchRequestIdRef.current) return;

        setSession((prev) => {
          if (requestId !== fetchRequestIdRef.current) return prev;
          const mergedStudents = parsedRoster.students.map((s) => {
            const prevStudent = prev?.students.find((ps) => ps.id === s.id);
            const storedTrials = getStoredTrials(sessionId, s.id);
            const trialsToUse =
              prevStudent?.trials && prevStudent.trials.length > 0
                ? prevStudent.trials
                : storedTrials;

            const mergedGoals = s.goals.map((g) => {
              const prevGoal = prevStudent?.goals.find((pg) => pg.id === g.id);
              const goalTrials = trialsToUse.filter((t) => t.studentGoalId === g.id);
              const trialLog =
                prevGoal?.trialLog && prevGoal.trialLog.length > 0 ? prevGoal.trialLog : goalTrials;
              const totalTrials = prevGoal?.totalTrials || trialLog.length || g.totalTrials || 0;
              const indCount = trialLog.filter(
                (t) => t.promptLevel === 'INDEPENDENT' || t.promptLevel === '+',
              ).length;
              const independencePercent =
                totalTrials > 0
                  ? Math.round((indCount / totalTrials) * 100)
                  : prevGoal?.independencePercent || g.independencePercent || 0;

              return {
                ...g,
                totalTrials,
                independencePercent,
                trialLog,
              };
            });

            return {
              ...s,
              trials: trialsToUse,
              goals: mergedGoals,
            };
          });

          parsedRoster.students = mergedStudents.slice(0, 2);

          if (prev && parsedRoster.students.length > 0) {
            const activeStudentId = prev.students.find((s) => s.active)?.id;
            if (activeStudentId && parsedRoster.students.some((s) => s.id === activeStudentId)) {
              parsedRoster.students = parsedRoster.students.map((s) => ({
                ...s,
                active: s.id === activeStudentId,
              }));
            }
          }
          return parsedRoster;
        });

        // Start session timer safely (no-op if already running or paused for this sessionId)
        startSessionTimer(sessionId, (parsedRoster.blockDurationMinutes || 90) * 60);

        if (requestId !== fetchRequestIdRef.current) return;
        setSecondsRemaining(remainingSeconds());
        setIsRunning(isTimerRunning());
        setLoadError(false);

        // Flush offline sync queue in the background
        flushOfflineSyncQueue(sessionId).catch(() => {});
      } catch (err) {
        if (requestId === fetchRequestIdRef.current && !silent) {
          setSession(null);
          setLoadError(true);
        }
      } finally {
        if (requestId === fetchRequestIdRef.current && !silent) {
          setLoading(false);
        }
      }
    },
    [sessionId, authSession, flushOfflineSyncQueue],
  );

  const fetchTeachersAndRoster = useCallback(async () => {
    try {
      const staffRes = await withTimeout<any>(
        getStaffOptions().catch(() => null),
        4000,
        null,
      );
      const teacherRows: Array<{ id: string; name: string }> = (
        filterOutDeletedStaff(staffRes?.data || []) as any[]
      ).filter((s: any) => s.role === 'teacher');
      setTeachers(teacherRows);
      teachersRef.current = teacherRows;

      let initialId = (route.params as any)?.teacherId;
      if (initialId && isStaffDeleted(initialId)) initialId = undefined;

      if (!initialId) {
        const matched = findLoggedInTeacher(authSession, teacherRows);
        if (matched && !isStaffDeleted(matched)) initialId = matched.id;
      }

      if (!initialId && typeof localStorage !== 'undefined') {
        const storedId = localStorage.getItem('melue_session_selected_teacher_id') || undefined;
        if (storedId && !isStaffDeleted(storedId)) initialId = storedId;
      }

      const resolvedTeacherId = initialId || teacherRows[0]?.id || '';
      if (resolvedTeacherId) {
        selectedTeacherIdRef.current = resolvedTeacherId;
        setSelectedTeacherId(resolvedTeacherId);
      }
      await loadRoster(resolvedTeacherId);
    } catch {
      await loadRoster();
    }
  }, [sessionId, (route.params as any)?.teacherId, authSession, loadRoster]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchTeachersAndRoster();
    }
  }, [fetchTeachersAndRoster]);

  useEffect(() => {
    return onDeletedStaffChanged(() => {
      loadRoster(selectedTeacherIdRef.current, true);
    });
  }, [loadRoster]);

  useEffect(() => {
    return onScheduleAssignmentsChanged(() => {
      loadRoster(selectedTeacherIdRef.current, true);
    });
  }, [loadRoster]);

  useEffect(() => {
    return onDeletedStudentChanged(() => {
      loadRoster(selectedTeacherIdRef.current, true);
    });
  }, [loadRoster]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStudentDeleted = () => {
      loadRoster(selectedTeacherIdRef.current, true);
    };
    window.addEventListener('melue_student_deleted', handleStudentDeleted);
    window.addEventListener('melue_session_updated', handleStudentDeleted);
    return () => {
      window.removeEventListener('melue_student_deleted', handleStudentDeleted);
      window.removeEventListener('melue_session_updated', handleStudentDeleted);
    };
  }, [loadRoster]);

  useFocusEffect(
    useCallback(() => {
      loadRoster(selectedTeacherIdRef.current, true);
    }, [loadRoster]),
  );

  useEffect(() => {
    if (!isRunning) return undefined;

    const timer = setInterval(() => {
      setSecondsRemaining(remainingSeconds());
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  const handleToggleTimer = () => {
    if (isRunning) {
      pauseSessionTimer();
    } else {
      resumeSessionTimer(sessionId, (session?.blockDurationMinutes || 90) * 60);
    }

    setSecondsRemaining(remainingSeconds());
    setIsRunning(isTimerRunning());
  };

  const handleSelectPromptLevel = async (
    studentId: string,
    goalId: string | undefined,
    level: string,
    stepId?: string,
  ) => {
    if (!canCreateTrial) {
      showToast('You do not have permission to record trials.', 'error');
      return;
    }
    const targetStudent = session?.students.find((s) => s.id === studentId);
    if (!targetStudent) {
      showToast('Student is not in this session', 'error');
      return;
    }

    const activeGoal = goalId
      ? targetStudent.goals.find((g) => g.id === goalId)
      : targetStudent.goals[0];

    if (!activeGoal || !activeGoal.id) {
      showToast('No active goal assigned to record trial', 'info');
      return;
    }

    const resolvedGoalId = activeGoal.id;
    const trialId = secureRandomId('trial');
    const timeStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newTrial: Trial = {
      id: trialId,
      promptLevel: level,
      timestamp: timeStr,
      sessionId,
      studentGoalId: resolvedGoalId,
    };

    // 1. Optimistic UI update
    setSession((prev) => {
      if (!prev) return prev;
      const updatedStudents = prev.students.map((stu) => {
        if (stu.id !== studentId) return stu;

        const updatedTrials = [...(stu.trials || []), newTrial];
        const isInd = level === 'INDEPENDENT' || level === '+';

        const updatedGoals = (stu.goals || []).map((g) => {
          if (g.id !== resolvedGoalId) return g;

          const updatedTrialLog = [...(g.trialLog || []), newTrial];
          const newTotalTrials = (g.totalTrials || 0) + 1;
          const currentIndCount = updatedTrialLog.filter(
            (t) => t.promptLevel === 'INDEPENDENT' || t.promptLevel === '+',
          ).length;
          const newIndependencePercent = Math.round((currentIndCount / newTotalTrials) * 100);

          let updatedSteps = g.steps;
          if (stepId && Array.isArray(g.steps)) {
            updatedSteps = g.steps.map((st) => {
              if (st.id !== stepId) return st;
              const stepTotal = (st.totalTrials || 0) + 1;
              const stepSuccess = (st.successCount || 0) + (isInd ? 1 : 0);
              return {
                ...st,
                totalTrials: stepTotal,
                successCount: stepSuccess,
                independencePercent: Math.round((stepSuccess / stepTotal) * 100),
              };
            });
          }

          return {
            ...g,
            totalTrials: newTotalTrials,
            independencePercent: newIndependencePercent,
            trialLog: updatedTrialLog,
            steps: updatedSteps,
          };
        });

        return {
          ...stu,
          trials: updatedTrials,
          goals: updatedGoals,
        };
      });

      setStoredSessionStudents(sessionId, updatedStudents, selectedTeacherId);
      return { ...prev, students: updatedStudents };
    });

    // 2. Persist in local store
    recordTrialInStore(sessionId, studentId, resolvedGoalId, newTrial);

    // 3. User feedback
    showToast('Trial recorded successfully', 'success');

    // 4. Background sync with backend
    try {
      const res = await logTrial(sessionId, studentId, resolvedGoalId, {
        promptLevel: level,
        stepId,
        clientEventId: trialId,
        timestamp: timeStr,
      });
      const serverTrialId = (res as any)?.data?.trial?.id || (res as any)?.data?.id;
      if (serverTrialId && serverTrialId !== trialId) {
        updateTrialIdInStore(sessionId, studentId, trialId, String(serverTrialId));
        setSession((prev) => {
          if (!prev) return prev;
          const updatedStudents = prev.students.map((stu) => {
            if (stu.id !== studentId) return stu;
            return {
              ...stu,
              trials: stu.trials?.map((t) =>
                t.id === trialId ? { ...t, id: String(serverTrialId) } : t,
              ),
              goals: stu.goals.map((g) => ({
                ...g,
                trialLog: g.trialLog?.map((t) =>
                  t.id === trialId ? { ...t, id: String(serverTrialId) } : t,
                ),
              })),
            };
          });
          setStoredSessionStudents(sessionId, updatedStudents, selectedTeacherId);
          return { ...prev, students: updatedStudents };
        });
      }
    } catch (err) {
      console.warn('Backend logTrial sync deferred (offline/cached):', err);
      enqueueOfflineSync({
        type: 'log_trial',
        sessionId,
        studentId,
        goalId: resolvedGoalId,
        trialId,
        payload: {
          promptLevel: level,
          stepId,
          clientEventId: trialId,
          timestamp: timeStr,
        },
      });
    }
  };

  const handleUndoTrial = async (studentId: string, goalId: string | undefined) => {
    if (!canEditSession) {
      showToast('You do not have permission to modify trial records.', 'error');
      return;
    }
    const student = session?.students.find((s) => s.id === studentId);
    if (!student) return;

    const activeGoal = goalId ? student.goals.find((g) => g.id === goalId) : student.goals[0];

    if (!activeGoal || !activeGoal.id) {
      showToast('No active goal assigned', 'info');
      return;
    }

    const resolvedGoalId = activeGoal.id;
    const goalTrials =
      Array.isArray(activeGoal.trialLog) && activeGoal.trialLog.length > 0
        ? activeGoal.trialLog
        : (student.trials || []).filter((t) => t.studentGoalId === resolvedGoalId);

    if (!goalTrials || goalTrials.length === 0) {
      showToast('No trials to undo', 'info');
      return;
    }

    const lastTrial = goalTrials[goalTrials.length - 1];
    const targetTrialId = lastTrial?.id;

    // 1. Optimistic UI update
    setSession((prev) => {
      if (!prev) return prev;
      const updatedStudents = prev.students.map((stu) => {
        if (stu.id !== studentId) return stu;

        const updatedTrials = [...(stu.trials || [])];
        for (let i = updatedTrials.length - 1; i >= 0; i--) {
          const t = updatedTrials[i];
          const matchesId = targetTrialId ? t.id === targetTrialId : false;
          const matchesGoal = t.studentGoalId === resolvedGoalId;
          if (matchesId || (matchesGoal && !targetTrialId)) {
            updatedTrials.splice(i, 1);
            break;
          }
        }

        const updatedGoals = (stu.goals || []).map((g) => {
          if (g.id !== resolvedGoalId) return g;

          const updatedTrialLog = [...(g.trialLog || [])];
          for (let i = updatedTrialLog.length - 1; i >= 0; i--) {
            const t = updatedTrialLog[i];
            if (!targetTrialId || t.id === targetTrialId) {
              updatedTrialLog.splice(i, 1);
              break;
            }
          }

          const newTotalTrials = Math.max(0, (g.totalTrials || 0) - 1);
          const remainingIndCount = updatedTrialLog.filter(
            (t) => t.promptLevel === 'INDEPENDENT' || t.promptLevel === '+',
          ).length;
          const newIndependencePercent =
            newTotalTrials > 0 ? Math.round((remainingIndCount / newTotalTrials) * 100) : 0;

          return {
            ...g,
            totalTrials: newTotalTrials,
            independencePercent: newIndependencePercent,
            trialLog: updatedTrialLog,
          };
        });

        return {
          ...stu,
          trials: updatedTrials,
          goals: updatedGoals,
        };
      });

      setStoredSessionStudents(sessionId, updatedStudents, selectedTeacherId);
      return { ...prev, students: updatedStudents };
    });

    // 2. Persist in local store with targetTrialId and strict goal isolation
    undoTrialInStore(sessionId, studentId, resolvedGoalId, targetTrialId);

    // 3. User feedback
    showToast('Trial undone successfully', 'success');

    // 4. Background backend sync with offline retry enqueue
    try {
      await undoLastTrial(sessionId, studentId, resolvedGoalId);
    } catch (err) {
      console.warn('Backend undoLastTrial deferred (offline/cached):', err);
      enqueueOfflineSync({
        type: 'undo_trial',
        sessionId,
        studentId,
        goalId: resolvedGoalId,
        trialId: targetTrialId,
      });
    }
  };

  const handleOpenIncidentModal = (studentId: string, goalId: string | undefined) => {
    const student = session?.students.find((s) => s.id === studentId);
    if (!student) {
      showToast('Student is not in session', 'error');
      return;
    }

    const goal = student.goals?.find((g) => g.id === goalId) || student.goals?.[0];

    setIncidentModal({
      studentId,
      studentGoalId: goal?.id,
      studentName: student.name,
      goalName: goal?.name,
    });
  };

  const handleCancelIncident = (hadChanges: boolean) => {
    if (hadChanges) {
      Alert.alert('Discard incident?', 'Any entered data will be lost.', [
        {
          text: 'Keep editing',
          style: 'cancel',
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => setIncidentModal(null),
        },
      ]);
    } else {
      setIncidentModal(null);
    }
  };

  const handleSaveIncident = async (incidentData: IncidentPayload) => {
    const studentId = incidentModal?.studentId || incidentData.studentId || incidentData.student_id;

    const student = session?.students.find((s) => s.id === studentId);
    if (!studentId || !student) {
      showToast('Cannot record incident: student is invalid or not in session', 'error');
      return;
    }

    const studentGoalId =
      incidentModal?.studentGoalId ||
      incidentData.studentGoalId ||
      incidentData.student_goal_id ||
      '';

    const incidentId = incidentData.id || secureRandomId('inc');

    const fullIncident: IncidentPayload = {
      ...incidentData,
      id: incidentId,
      studentId,
      student_id: studentId,
      studentName: incidentData.studentName || student.name || 'Student',
      studentGoalId,
      student_goal_id: studentGoalId,
      goalName: incidentModal?.goalName || incidentData.goalName,
      date: incidentData.date || new Date().toISOString().split('T')[0],
      time:
        incidentData.time ||
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      teacher: incidentData.teacher || authSession?.userName || session?.teacherName || 'Teacher',
    };

    // 1. Update local state avoiding duplicates
    setLocalIncidents((prev) => {
      const existingIdx = prev.findIndex((i: any) => i.id === incidentId);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = fullIncident;
        return copy;
      }
      return [...prev, fullIncident];
    });

    // 2. Persist in local storage and mirror to ABC log store
    recordIncidentInStore(sessionId, fullIncident as any);

    // 3. User feedback and close modal
    setIncidentModal(null);
    showToast('Behavior incident logged successfully', 'success');

    // 4. Background sync with backend
    try {
      await recordBehaviorIncident(sessionId, fullIncident as unknown as Payload);
    } catch (err) {
      console.warn('Backend recordBehaviorIncident failed, safely preserved locally:', err);
      enqueueOfflineSync({
        type: 'behavior_incident',
        sessionId,
        studentId,
        goalId: studentGoalId,
        payload: fullIncident,
      });
    }
  };

  const handleDeleteIncident = (incidentIdOrIndex: string | number) => {
    setLocalIncidents((prev) => {
      let next: IncidentPayload[];
      let targetId: string | null = null;
      if (typeof incidentIdOrIndex === 'number') {
        next = [...prev];
        targetId = (next[incidentIdOrIndex] as any)?.id || null;
        next.splice(incidentIdOrIndex, 1);
      } else {
        targetId = incidentIdOrIndex;
        next = prev.filter((i: any) => String(i.id) !== String(incidentIdOrIndex));
      }
      removeStoredSessionIncident(sessionId, targetId || incidentIdOrIndex);
      return next;
    });
    showToast('Incident record removed', 'info');
  };

  const handleMasteryCheck = (studentId: string, goalId: string | undefined) => {
    navigation?.navigate?.('GoalMasteryCheck', {
      studentId,
      goalId: goalId ?? '',
    });
  };

  const handleSwapStudents = async () => {
    if (!session || session.students.length < 2) {
      showToast('Need at least 2 students to swap', 'info');
      return;
    }
    try {
      await swapStudents(sessionId, {
        studentIds: session.students.map((s) => s.id).reverse(),
        teacherId: selectedTeacherId,
      });
    } catch (err) {
      // Continue with local swap if backend is unavailable.
    }

    // Swap the order of the two students locally and persist with teacher scope
    setSession((prev) => {
      if (!prev) return prev;
      const reversed = [...prev.students].reverse();
      reversed.forEach((s, idx) => {
        s.active = idx === 0;
      });
      setStoredSessionStudents(sessionId, reversed, selectedTeacherId);
      return { ...prev, students: reversed };
    });
    showToast('Students swapped successfully', 'success');
  };

  const handleActivate = (studentId: string) => {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            students: prev.students.map((s) => ({
              ...s,
              active: s.id === studentId,
            })),
          }
        : prev,
    );
  };

  const handleViewGoalProgress = (studentId: string, goalId: string) => {
    navigation?.navigate?.('GoalProgress', {
      studentId,
      goalId,
    });
  };

  const handleViewProfile = (studentId: string) => {
    navigation?.navigate?.('StudentProfile', {
      studentId,
    });
  };

  const handleSessionSummary = () => {
    if (session?.students && session.students.length > 0) {
      setStoredSessionStudents(sessionId, session.students, selectedTeacherId);
    }
    navigation?.navigate?.('SessionSummary', {
      sessionId,
      localIncidents,
      students: session?.students,
    });
  };

  if (loadError) {
    return (
      <ScreenError
        onRetry={() => {
          loadRoster(selectedTeacherIdRef.current);
        }}
      />
    );
  }

  if (loading && !session) {
    return <ScreenLoader />;
  }

  if (!session) {
    return <ScreenLoader />;
  }

  const timerRem = remainingSeconds();
  const safeSeconds = Math.max(
    0,
    secondsRemaining ?? (timerRem > 0 ? timerRem : (session?.blockDurationMinutes || 90) * 60),
  );
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
  const seconds = String(safeSeconds % 60).padStart(2, '0');

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Session" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerTitleRow}>
            <Text style={typography.h1}>Today's Session</Text>
          </View>

          <Text style={typography.body}>
            {session.teacherName} • {session.stationName} • {session.roomName}
          </Text>
        </View>

        <View style={styles.timerRow}>
          <View style={styles.timerPill}>
            <Feather
              name="clock"
              size={14}
              color={colors.mutedText}
              style={{ marginRight: spacing.xs }}
            />
            <Text style={styles.timerText}>
              {minutes}:{seconds}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.playPauseBtn}
            onPress={handleToggleTimer}
            accessibilityLabel={isRunning ? 'Pause timer' : 'Resume timer'}
          >
            <Feather name={isRunning ? 'pause' : 'play'} size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {session.students.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="users" size={28} color={colors.mutedText} />
            </View>
            <Text style={styles.emptyTitle}>No Students Assigned</Text>
            <Text style={styles.emptyText}>
              No eligible students are currently scheduled or assigned to this station for{' '}
              {session.teacherName}.
            </Text>
          </View>
        ) : (
          <View style={[styles.studentsRow, isLandscape && styles.studentsRowLandscape]}>
            {filterOutDeletedStudents(session.students || [])
              .slice(0, 2)
              .map((student) => (
                <TouchableOpacity
                  key={student.id}
                  style={styles.studentCardWrapper}
                  activeOpacity={0.9}
                  onPress={() => handleActivate(student.id)}
                >
                  <StudentSessionCard
                    student={student}
                    onSelectPromptLevel={handleSelectPromptLevel}
                    onRecordIncident={handleOpenIncidentModal}
                    onMasteryCheck={handleMasteryCheck}
                    onActivate={handleActivate}
                    onViewGoalProgress={handleViewGoalProgress}
                    onViewProfile={handleViewProfile}
                    onUndo={(goalId) => handleUndoTrial(student.id, goalId)}
                  />
                </TouchableOpacity>
              ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.secondaryBtn, session.students.length < 2 && styles.btnDisabled]}
          disabled={session.students.length < 2}
          onPress={handleSwapStudents}
        >
          <Text
            style={[styles.secondaryBtnText, session.students.length < 2 && styles.btnTextDisabled]}
          >
            ⇄ Swap Students
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSessionSummary}>
          <Text style={styles.primaryBtnText}>📄 Session Summary</Text>
        </TouchableOpacity>
      </View>

      {/* Behavior Incident Modal */}
      <BehaviorIncidentModal
        visible={!!incidentModal}
        studentId={incidentModal?.studentId}
        studentGoalId={incidentModal?.studentGoalId}
        studentName={incidentModal?.studentName}
        goalName={incidentModal?.goalName}
        recordedBy={authSession?.userName || session?.teacherName || 'Rosa Delgado'}
        onCancel={handleCancelIncident}
        onSave={handleSaveIncident}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: 4,
  },

  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },

  timerText: {
    fontWeight: '700',
    color: '#16A34A',
  },

  playPauseBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    padding: spacing.lg,
  },

  studentsRow: {
    flexDirection: 'column',
    gap: spacing.md,
    width: '100%',
  },

  studentsRowLandscape: {
    flexDirection: 'row',
  },

  studentCardWrapper: {
    flex: 1,
  },

  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  btnDisabled: {
    opacity: 0.5,
    backgroundColor: colors.bgApp,
  },

  btnTextDisabled: {
    color: colors.mutedText,
  },

  secondaryBtnText: {
    fontWeight: '600',
    color: colors.navyText,
  },

  primaryBtn: {
    flex: 2,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  primaryBtnText: {
    fontWeight: '700',
    color: colors.navyText,
  },

  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl * 1.5,
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },

  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyText,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 420,
  },
});
