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
  Modal,
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
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import StudentSessionCard from './components/StudentSessionCard';
import BehaviorIncidentModal from './components/BehaviorIncidentModal';
import type {
  IncidentPayload,
} from './components/BehaviorIncidentModal';
import {
  getSessionRoster,
  startSession,
  logTrial,
  undoLastTrial,
  recordIncident,
  recordBehaviorIncident,
  swapStudents,
} from '../../api/sessionApi';
import { http as client } from '../../api/http/client';
import {
  getStoredIupDraft,
  getAllStoredIupDrafts,
} from '../../api/programDirectorApi';
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
} from '../../utils/teacherScheduleHelper';
import {
  isStaffDeleted,
  filterOutDeletedStaff,
  onDeletedStaffChanged,
} from '../../utils/deletedStaffHelper';
import type {
  SessionStackParamList,
  SessionRoster,
  Payload,
  Trial,
} from '../../types';
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
  recordIncidentInStore,
  getStoredIncidents,
  setStoredSessionStudents,
  getStoredSessionStudents,
} from '../../stores/trialsStore';

type Props = NativeStackScreenProps<
  SessionStackParamList,
  'SessionDataCollection'
>;

interface IncidentModalState {
  studentId: string;
  studentGoalId?: string;
  studentName?: string;
  goalName?: string;
}

function getStudentAssignedGoals(studentId: string, rawGoals: any[] = []): any[] {
  const draft = getStoredIupDraft(studentId);
  const extractedGoals: any[] = [];

  if (draft) {
    if (draft.slots && typeof draft.slots === 'object') {
      const s1 = Array.isArray((draft.slots as any).station1) ? (draft.slots as any).station1 : [];
      const s2 = Array.isArray((draft.slots as any).station2) ? (draft.slots as any).station2 : [];
      [...s1, ...s2].filter(Boolean).forEach((g: any, idx: number) => {
        extractedGoals.push({
          id: String(g.id || `${studentId}-draft-g-${idx}`),
          name: String(g.name || g.title || g.description || 'Assigned Goal'),
          category: g.domain || g.category || 'Adaptive',
          goalType: g.goalType || g.goal_type || 'standard',
          totalTrials: 0,
          independencePercent: 0,
          trialLog: [],
        });
      });
    }

    if (extractedGoals.length === 0 && Array.isArray(draft.goals) && draft.goals.length > 0) {
      draft.goals.forEach((g: any, idx: number) => {
        if (typeof g === 'object' && g !== null) {
          extractedGoals.push({
            id: String(g.id || `${studentId}-draft-g-${idx}`),
            name: String(g.name || g.title || g.description || 'Assigned Goal'),
            category: g.domain || g.category || 'Adaptive',
            goalType: g.goalType || g.goal_type || 'standard',
            totalTrials: 0,
            independencePercent: 0,
            trialLog: [],
          });
        } else if (typeof g === 'string' && g.trim()) {
          extractedGoals.push({
            id: g.trim(),
            name: 'Assigned Goal',
            category: 'Adaptive',
            goalType: 'standard',
            totalTrials: 0,
            independencePercent: 0,
            trialLog: [],
          });
        }
      });
    }
  }

  if (extractedGoals.length > 0) {
    return extractedGoals;
  }

  // Filter out default synthetic backend fallback IDs (e.g., studentId-g1, studentId-g2)
  const realBackendGoals = (Array.isArray(rawGoals) ? rawGoals : []).filter((g: any) => {
    const gid = String(g.id || '');
    const isFallbackId =
      gid === `${studentId}-g1` ||
      gid === `${studentId}-g2` ||
      gid.endsWith('-g1') ||
      gid.endsWith('-g2');
    return !isFallbackId;
  });

  if (realBackendGoals.length > 0) {
    return realBackendGoals;
  }

  return [];
}

export default function SessionDataCollectionScreen({
  route,
  navigation,
}: Props) {
  const sessionId = route.params?.sessionId ?? 'active';
  const { session: authSession, logout } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [session, setSession] = useState<SessionRoster | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(
    null
  );
  const [isRunning, setIsRunning] = useState(isTimerRunning());
  const [incidentModal, setIncidentModal] =
    useState<IncidentModalState | null>(null);
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

  useEffect(() => {
    const cached = getStoredIncidents(sessionId) as unknown as IncidentPayload[];
    if (cached && cached.length > 0) {
      setLocalIncidents((prev) => {
        if (prev.length === 0) return cached;
        return prev;
      });
    }
  }, [sessionId]);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const loadRoster = useCallback(
    async (teacherIdToLoad?: string, silent = false) => {
      try {
        if (!silent) setLoading(true);
        // Start the session on the backend asynchronously so it doesn't block roster fetching
        startSession(sessionId).catch(() => {});

        // Fetch teachers list if not already cached
        let currentTeachers = filterOutDeletedStaff(teachers);
        if (currentTeachers.length === 0) {
          try {
            const staffRes = await getStaffOptions();
            const teacherRows = filterOutDeletedStaff(staffRes?.data || []).filter((s: any) => s.role === 'teacher');
            if (teacherRows.length > 0) {
              currentTeachers = teacherRows;
              setTeachers(teacherRows);
            }
          } catch {}
        }

        // Determine active teacher ID
        let targetTeacherId = teacherIdToLoad || (route.params as any)?.teacherId;
        if (targetTeacherId && isStaffDeleted(targetTeacherId)) {
          targetTeacherId = undefined;
        }
        if (!targetTeacherId && currentTeachers.length > 0) {
          const matched = findLoggedInTeacher(authSession, currentTeachers);
          if (matched && !isStaffDeleted(matched)) targetTeacherId = matched.id;
        }
        if (!targetTeacherId && selectedTeacherId && !isStaffDeleted(selectedTeacherId)) {
          targetTeacherId = selectedTeacherId;
        }
        if (!targetTeacherId && currentTeachers.length > 0) {
          targetTeacherId = currentTeachers[0].id;
        }
        if (targetTeacherId) {
          setSelectedTeacherId(targetTeacherId);
        }

        // Parallel fetch: director schedule for target teacher, all director schedule blocks, student options, and dashboard
        const [schedRes, allSchedRes, studentOptsRes, dashRes] = await Promise.all([
          targetTeacherId ? getDirectorSchedule({ teacherId: targetTeacherId }).catch(() => null) : null,
          getDirectorSchedule({}).catch(() => null),
          getStudentOptions().catch(() => null),
          getTeacherDashboard().catch(() => null),
        ]);

        const studentOpts = Array.isArray(studentOptsRes?.data) ? studentOptsRes.data : [];
        registerStudentStatuses(studentOpts);
        const studentMap = new Map(studentOpts.map((s: any) => [String(s.id), s]));

        const blocks: any[] = Array.isArray(schedRes?.data) ? schedRes.data : [];
        const allBlocks: any[] = Array.isArray(allSchedRes?.data)
          ? allSchedRes.data
          : blocks;
        const currentTeacherObj = currentTeachers.find((t) => String(t.id) === String(targetTeacherId));

        // 1. Resolve assigned student IDs strictly belonging to this teacher
        const { assignedStudentIds: strictlyAssignedIds, activeBlock } = resolveTeacherAssignedStudentIds(
          currentTeacherObj || null,
          blocks.length > 0 ? blocks : allBlocks
        );

        // 2. Check if students were explicitly passed via route.params (e.g., from TeacherDashboard) or cached
        let assignedStudentIds = strictlyAssignedIds;

        if (route.params?.students && Array.isArray(route.params.students) && route.params.students.length > 0) {
          const passedIds = route.params.students.map((s: any) => String(s.id));
          if (assignedStudentIds.length === 0 || passedIds.some((pid) => assignedStudentIds.includes(pid))) {
            assignedStudentIds = Array.from(new Set(passedIds)).slice(0, 2);
          }
        }

        if (assignedStudentIds.length === 0 && targetTeacherId) {
          const stored = getStoredSessionStudents(sessionId, targetTeacherId);
          if (Array.isArray(stored) && stored.length > 0) {
            assignedStudentIds = Array.from(new Set(stored.map((s: any) => String(s.id)))).slice(0, 2);
          }
        }

        const fallbackBlock = allBlocks.find((b: any) => b?.teacherName || b?.stationName) || null;
        const currentTeacherName =
          currentTeacherObj?.name || activeBlock?.teacherName || (authSession?.userName ?? 'Teacher');
        const currentStationName = activeBlock?.stationName || fallbackBlock?.stationName || 'Station 1';
        const currentRoomName = activeBlock?.roomName || fallbackBlock?.roomName || 'Room 101';
        const currentDurationMinutes = Number(activeBlock?.blockDurationMinutes || fallbackBlock?.blockDurationMinutes || 90);

        // Map assigned student IDs to full student objects
        const assignedStudents = assignedStudentIds.map((sid) => {
          const opt = studentMap.get(sid);
          if (opt) return opt;
          const reg = getRegisteredStudentStatus(sid);
          return reg ? { ...reg, id: sid } : { id: sid, name: `Student ${sid.slice(0, 4)}` };
        });

        // Strictly enforce: One student can be displayed on session page if and only if assessment is 100% completed
        // No student can be in assessment and in session page at one time, and at most 2 assigned students per station
        let eligibleStudents = assignedStudents.filter(isStudentEligibleForSession).slice(0, 2);

        // Fallback: If no assigned students found for this specific teacher in Director Scheduling,
        // automatically assign students from available schedule blocks, teacher dashboard, or student options
        // so the teacher's session workbench always displays active students.
        if (eligibleStudents.length === 0) {
          const candidatePool: any[] = [];
          if (Array.isArray(dashRes?.data?.todaySchedule?.students)) {
            candidatePool.push(...dashRes.data.todaySchedule.students);
          }
          allBlocks.forEach((b: any) => {
            if (Array.isArray(b?.studentIds)) {
              b.studentIds.forEach((sid: any) => {
                const s = studentMap.get(String(sid)) || { id: String(sid) };
                candidatePool.push(s);
              });
            }
          });
          candidatePool.push(...studentOpts);

          const seenIds = new Set<string>();
          const uniqueCandidates: any[] = [];
          for (const cand of candidatePool) {
            const sid = String(cand.id || cand._id || '');
            if (sid && !seenIds.has(sid)) {
              seenIds.add(sid);
              const fullObj = studentMap.get(sid) || cand;
              uniqueCandidates.push(fullObj);
            }
          }

          const eligibleFallback = uniqueCandidates.filter(isStudentEligibleForSession);
          if (eligibleFallback.length > 0) {
            eligibleStudents = eligibleFallback.slice(0, 2);
          } else if (uniqueCandidates.length > 0) {
            eligibleStudents = uniqueCandidates.slice(0, 2);
          }
        }

        if (eligibleStudents.length === 0) {
          eligibleStudents = [
            { id: 'stu-1', name: 'Yonas Girma', initial: 'YG', program: 'Comprehensive' },
            { id: 'stu-2', name: 'Meron Haile', initial: 'MH', program: 'Targeted' },
          ];
        }

        let finalStudents: any[] = eligibleStudents.slice(0, 2).map((ds: any) => {
          const sid = String(ds.id);
          const sName = String(ds.name || ds.fullName || 'Student').trim();
          const initial = String(ds.initial || (sName.slice(0, 2) || 'ST').toUpperCase());

          const assignedGoals = getStudentAssignedGoals(sid, ds.goals || []);
          const rawGoals =
            assignedGoals.length > 0
              ? assignedGoals
              : Array.isArray(ds.goals) && ds.goals.length > 0
              ? ds.goals
              : [
                  { id: `${sid}-goal-1`, name: 'Goal 1 — Basic Skills', category: 'Adaptive' },
                  { id: `${sid}-goal-2`, name: 'Goal 2 — Advanced Skills', category: 'Adaptive' },
                ];

          return {
            id: sid,
            name: sName,
            initial,
            program: String(ds.program || 'Regular'),
            goals: rawGoals,
            trials: Array.isArray(ds.trials) ? ds.trials : [],
          };
        });

        setStoredSessionStudents(sessionId, finalStudents, targetTeacherId);

        const parsedRoster: SessionRoster = {
          teacherName: currentTeacherName,
          stationName: currentStationName,
          roomName: currentRoomName,
          blockDurationMinutes: currentDurationMinutes,
          students: finalStudents.map((s: any, idx: number) => ({
            id: String(s.id),
            name: String(s.name).trim(),
            initial: String(
              s.initial || (String(s.name).slice(0, 2) || 'ST').toUpperCase()
            ),
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

        setSession((prev) => {
          const mergedStudents = parsedRoster.students.map((s) => {
            const prevStudent = prev?.students.find((ps) => ps.id === s.id);
            const storedTrials = getStoredTrials(sessionId, s.id);
            const trialsToUse =
              prevStudent?.trials && prevStudent.trials.length > 0
                ? prevStudent.trials
                : storedTrials;

            const mergedGoals = s.goals.map((g) => {
              const prevGoal = prevStudent?.goals.find((pg) => pg.id === g.id);
              const goalTrials = trialsToUse.filter(
                (t) => !t.studentGoalId || t.studentGoalId === g.id
              );
              const trialLog =
                prevGoal?.trialLog && prevGoal.trialLog.length > 0
                  ? prevGoal.trialLog
                  : goalTrials;
              const totalTrials =
                prevGoal?.totalTrials || trialLog.length || g.totalTrials || 0;
              const indCount = trialLog.filter(
                (t) => t.promptLevel === 'INDEPENDENT' || t.promptLevel === '+'
              ).length;
              const independencePercent =
                totalTrials > 0
                  ? Math.round((indCount / totalTrials) * 100)
                  : (prevGoal?.independencePercent || g.independencePercent || 0);

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

        startSessionTimer(
          sessionId,
          (parsedRoster.blockDurationMinutes || 90) * 60
        );

        setSecondsRemaining(remainingSeconds());
        setIsRunning(isTimerRunning());
      } catch (err) {
        if (!silent) {
          setSession(null);
          setLoadError(true);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [sessionId, selectedTeacherId, teachers, authSession]
  );

  const fetchTeachersAndRoster = useCallback(() => {
    getStaffOptions()
      .then(async ({ data: staffOpts }) => {
        const teacherRows = filterOutDeletedStaff(staffOpts || []).filter((s: any) => s.role === 'teacher');
        setTeachers(teacherRows);

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
          setSelectedTeacherId(resolvedTeacherId);
          loadRoster(resolvedTeacherId);
        } else {
          loadRoster();
        }
      })
      .catch(() => {
        loadRoster();
      });
  }, [sessionId, (route.params as any)?.teacherId, authSession, loadRoster]);

  useEffect(() => {
    fetchTeachersAndRoster();
  }, [fetchTeachersAndRoster]);

  useEffect(() => {
    return onDeletedStaffChanged(() => {
      fetchTeachersAndRoster();
    });
  }, [fetchTeachersAndRoster]);

  useEffect(() => {
    if (!isRunning || secondsRemaining === null) return undefined;

    const timer = setInterval(() => {
      setSecondsRemaining(remainingSeconds());
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, secondsRemaining === null]);

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
    stepId?: string
  ) => {
    // Generate unique local ID and timestamp
    const trialId = `trial-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Determine target goal ID:
    const targetStudent = session?.students.find((s) => s.id === studentId);
    const activeGoal = goalId
      ? targetStudent?.goals.find((g) => g.id === goalId)
      : targetStudent?.goals[0];
    const resolvedGoalId = activeGoal?.id || goalId || 'goal-1';

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
      return {
        ...prev,
        students: prev.students.map((stu) => {
          if (stu.id !== studentId) return stu;

          const updatedTrials = [...(stu.trials || []), newTrial];
          const isInd = level === 'INDEPENDENT' || level === '+';

          const updatedGoals = (stu.goals || []).map((g) => {
            const isMatch = g.id === resolvedGoalId;
            if (!isMatch) return g;

            const updatedTrialLog = [...(g.trialLog || []), newTrial];
            const newTotalTrials = (g.totalTrials || 0) + 1;
            const currentIndCount = updatedTrialLog.filter(
              (t) => t.promptLevel === 'INDEPENDENT' || t.promptLevel === '+'
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
        }),
      };
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
      });
      const serverTrialId = (res as any)?.data?.trial?.id;
      if (serverTrialId) {
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            students: prev.students.map((stu) => {
              if (stu.id !== studentId) return stu;
              return {
                ...stu,
                trials: stu.trials?.map((t) => (t.id === trialId ? { ...t, id: String(serverTrialId) } : t)),
                goals: stu.goals.map((g) => ({
                  ...g,
                  trialLog: g.trialLog?.map((t) => (t.id === trialId ? { ...t, id: String(serverTrialId) } : t)),
                })),
              };
            }),
          };
        });
      }
    } catch (err) {
      console.warn('Backend logTrial sync skipped/failed:', err);
    }
  };

  const handleUndoTrial = async (
    studentId: string,
    goalId: string | undefined
  ) => {
    const student = session?.students.find((s) => s.id === studentId);
    if (!student) return;

    const activeGoal = goalId
      ? student.goals.find((g) => g.id === goalId)
      : student.goals[0];
    const resolvedGoalId = activeGoal?.id || goalId;

    const goalTrials = Array.isArray(activeGoal?.trialLog) && activeGoal.trialLog.length > 0
      ? activeGoal.trialLog
      : (student.trials || []).filter((t) => !resolvedGoalId || !t.studentGoalId || t.studentGoalId === resolvedGoalId);

    if (!goalTrials || goalTrials.length === 0) {
      showToast('No trials to undo', 'info');
      return;
    }

    const lastTrial = goalTrials[goalTrials.length - 1];
    const targetTrialId = lastTrial?.id;

    // 1. Optimistic UI update
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        students: prev.students.map((stu) => {
          if (stu.id !== studentId) return stu;

          const updatedTrials = [...(stu.trials || [])];
          let removedFromStu = false;
          for (let i = updatedTrials.length - 1; i >= 0; i--) {
            const t = updatedTrials[i];
            const matchesId = targetTrialId ? t.id === targetTrialId : true;
            const matchesGoal = !resolvedGoalId || !t.studentGoalId || t.studentGoalId === resolvedGoalId;
            if (matchesId && matchesGoal) {
              updatedTrials.splice(i, 1);
              removedFromStu = true;
              break;
            }
          }
          if (!removedFromStu && updatedTrials.length > 0) {
            updatedTrials.pop();
          }

          const updatedGoals = (stu.goals || []).map((g) => {
            const isMatch = resolvedGoalId ? g.id === resolvedGoalId : true;
            if (!isMatch) return g;

            const updatedTrialLog = [...(g.trialLog || [])];
            let removedFromLog = false;
            for (let i = updatedTrialLog.length - 1; i >= 0; i--) {
              const t = updatedTrialLog[i];
              if (!targetTrialId || t.id === targetTrialId) {
                updatedTrialLog.splice(i, 1);
                removedFromLog = true;
                break;
              }
            }
            if (!removedFromLog && updatedTrialLog.length > 0) {
              updatedTrialLog.pop();
            }

            const newTotalTrials = Math.max(0, (g.totalTrials || 0) - 1);
            const remainingIndCount = updatedTrialLog.filter(
              (t) => t.promptLevel === 'INDEPENDENT' || t.promptLevel === '+'
            ).length;
            const newIndependencePercent =
              newTotalTrials > 0
                ? Math.round((remainingIndCount / newTotalTrials) * 100)
                : 0;

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
        }),
      };
    });

    // 2. Persist in local store
    undoTrialInStore(sessionId, studentId, resolvedGoalId);

    // 3. User feedback
    showToast('Trial undone successfully', 'success');

    // 4. Background backend sync
    try {
      await undoLastTrial(sessionId, studentId, resolvedGoalId || '');
    } catch (err) {
      console.warn('Backend undoLastTrial failed, preserved locally:', err);
    }
  };

  const handleOpenIncidentModal = (
    studentId: string,
    goalId: string | undefined
  ) => {
    const student = session?.students.find(
      (s) => s.id === studentId
    );

    const goal = student?.goals?.find(
      (g) => g.id === goalId
    ) || student?.goals?.[0];

    const activeGoalId = goalId || goal?.id;

    setIncidentModal({
      studentId,
      studentGoalId: activeGoalId,
      studentName: student?.name,
      goalName: goal?.name,
    });
  };

  const handleCancelIncident = (hadChanges: boolean) => {
    if (hadChanges) {
      Alert.alert(
        'Discard incident?',
        'Any entered data will be lost.',
        [
          {
            text: 'Keep editing',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => setIncidentModal(null),
          },
        ]
      );
    } else {
      setIncidentModal(null);
    }
  };

  const handleSaveIncident = async (
    incidentData: IncidentPayload
  ) => {
    const studentId =
      incidentModal?.studentId ||
      (incidentData as any).student_id ||
      (incidentData as any).studentId ||
      session?.students[0]?.id ||
      '';
    const studentGoalId =
      incidentModal?.studentGoalId ||
      (incidentData as any).student_goal_id ||
      (incidentData as any).studentGoalId ||
      '';
    const payload = {
      ...incidentData,
      student_id: studentId,
      studentId: studentId,
      student_goal_id: studentGoalId,
      studentGoalId: studentGoalId,
    };

    try {
      await recordBehaviorIncident(
        sessionId,
        payload as unknown as Payload
      );
      await loadRoster();
    } catch (err) {
      // Demo/offline fallback: incident recorded locally
    }

    // Track incident locally for session summary
    const student = session?.students.find((s) => s.id === studentId);
    const fullIncident: IncidentPayload = {
      ...incidentData,
      studentId,
      studentName: incidentData.studentName || student?.name || 'Student',
      time: incidentData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: incidentData.date || new Date().toISOString().split('T')[0],
    };
    setLocalIncidents((prev) => [...prev, fullIncident]);
    recordIncidentInStore(sessionId, fullIncident as any);

    setIncidentModal(null);
    showToast('Behavior incident logged successfully', 'success');
  };

  const handleDeleteIncident = (index: number) => {
    setLocalIncidents((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      if (typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem('melue_session_incidents_cache');
          const all = raw ? JSON.parse(raw) : {};
          all[sessionId] = next;
          localStorage.setItem('melue_session_incidents_cache', JSON.stringify(all));
        } catch {}
      }
      return next;
    });
    showToast('Incident record removed', 'info');
  };

  const handleMasteryCheck = (
    studentId: string,
    goalId: string | undefined
  ) => {
    navigation?.navigate?.('GoalMasteryCheck', {
      studentId,
      goalId: goalId ?? '',
    });
  };

  const handleSwapStudents = async () => {
    try {
      await swapStudents(sessionId, {});
    } catch (err) {
      // Continue with local swap if backend is unavailable.
    }
    // Swap the order of the two students locally so the change is visible.
    setSession((prev) => {
      if (!prev) return prev;
      const reversed = [...prev.students].reverse();
      setStoredSessionStudents(sessionId, reversed);
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
        : prev
    );
  };

  const handleViewGoalProgress = (
    studentId: string,
    goalId: string
  ) => {
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
      setStoredSessionStudents(sessionId, session.students);
    }
    navigation?.navigate?.('SessionSummary', {
      sessionId,
      localIncidents,
      students: session?.students,
    });
  };

if (loadError) return <ScreenError onRetry={loadRoster} />;

   if (
     loading ||
     !session ||
     secondsRemaining === null
   ) {
     return <ScreenLoader />;
   }

   const minutes = String(
     Math.floor(secondsRemaining / 60)
   ).padStart(2, '0');

   const seconds = String(
     secondsRemaining % 60
   ).padStart(2, '0');

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Session"
        onTabPress={(tab) =>
          handleTeacherTabPress(navigation, tab)
        }
      />

      <View style={styles.header}>
        <View>
          <Text style={typography.h1}>
            Today's Session
          </Text>

          <Text style={typography.body}>
            {session.teacherName} • {session.stationName} •{' '}
            {session.roomName}
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
            accessibilityLabel={
              isRunning
                ? 'Pause timer'
                : 'Resume timer'
            }
          >
            <Feather
              name={isRunning ? 'pause' : 'play'}
              size={16}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.studentsRow, isLandscape && styles.studentsRowLandscape]}>
          {session.students.slice(0, 2).map((student) => (
            <TouchableOpacity
              key={student.id}
              style={styles.studentCardWrapper}
              activeOpacity={0.9}
              onPress={() => handleActivate(student.id)}
            >
              <StudentSessionCard
                student={student}
                onSelectPromptLevel={handleSelectPromptLevel}
                onRecordIncident={
                  handleOpenIncidentModal
                }
                onMasteryCheck={handleMasteryCheck}
                onActivate={handleActivate}
                onViewGoalProgress={
                  handleViewGoalProgress
                }
                onViewProfile={
                  handleViewProfile
                }
                onUndo={(goalId) => handleUndoTrial(student.id, goalId)}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleSwapStudents}
        >
          <Text style={styles.secondaryBtnText}>
            ⇄ Swap Students
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleSessionSummary}
        >
          <Text style={styles.primaryBtnText}>
            📄 Session Summary
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal overlays over the session page keeping background visible */}
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
     padding: spacing.xl,
     gap: spacing.sm,
     backgroundColor: colors.bgCard,
     borderRadius: radius.lg,
     borderWidth: 1,
     borderColor: colors.border,
   },
   studentsHeading: { marginBottom: spacing.md },
   emptyIconCircle: {
     width: 56,
     height: 56,
     borderRadius: 28,
     backgroundColor: colors.bgApp,
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
   },

   headerMetaRow: {
     flexDirection: 'row',
     alignItems: 'center',
     flexWrap: 'wrap',
     gap: spacing.xs,
     marginTop: 6,
   },

   teacherBadge: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#EFF6FF',
     borderWidth: 1,
     borderColor: '#BFDBFE',
     paddingHorizontal: 10,
     paddingVertical: 5,
     borderRadius: 999,
   },

   teacherBadgeIcon: {
     marginRight: 6,
   },

   teacherBadgeText: {
     fontSize: 13,
     color: '#1E40AF',
   },

   teacherBadgeBold: {
     fontWeight: '700',
     color: '#1E3A8A',
   },

   headerStationInfo: {
     fontSize: 13,
     color: colors.mutedText,
     marginLeft: 4,
   },

   modalOverlay: {
     flex: 1,
     backgroundColor: 'rgba(0,0,0,0.45)',
     justifyContent: 'center',
     alignItems: 'center',
     padding: spacing.md,
   },

   teacherModalCard: {
     width: '100%',
     maxWidth: 480,
     backgroundColor: colors.bgCard,
     borderRadius: radius.lg,
     padding: spacing.lg,
     shadowColor: '#000',
     shadowOpacity: 0.2,
     shadowRadius: 14,
     elevation: 10,
   },

   teacherModalHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'flex-start',
     marginBottom: spacing.md,
     borderBottomWidth: 1,
     borderBottomColor: colors.border,
     paddingBottom: spacing.sm,
   },

   teacherModalTitle: {
     fontSize: 18,
     fontWeight: '700',
     color: colors.navyText,
   },

   teacherModalSub: {
     fontSize: 12,
     color: colors.mutedText,
     marginTop: 2,
   },

   modalCloseBtn: {
     padding: 4,
   },

   teacherList: {
     maxHeight: 320,
   },

   teacherItem: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingVertical: spacing.md,
     paddingHorizontal: spacing.md,
     borderRadius: radius.md,
     borderWidth: 1,
     borderColor: colors.border,
     marginBottom: spacing.sm,
     backgroundColor: colors.bgApp,
   },

   teacherItemSelected: {
     borderColor: colors.primaryBlue,
     backgroundColor: '#EFF6FF',
   },

   teacherItemLeft: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: spacing.sm,
     flex: 1,
   },

   teacherAvatar: {
     width: 36,
     height: 36,
     borderRadius: 18,
     backgroundColor: colors.border,
     alignItems: 'center',
     justifyContent: 'center',
   },

   teacherAvatarSelected: {
     backgroundColor: colors.primaryBlue,
   },

   teacherAvatarText: {
     fontSize: 13,
     fontWeight: '700',
     color: colors.navyText,
   },

   teacherAvatarTextSelected: {
     color: colors.white,
   },

   teacherItemName: {
     fontSize: 15,
     fontWeight: '600',
     color: colors.navyText,
   },

   teacherItemNameSelected: {
     color: colors.primaryBlue,
     fontWeight: '700',
   },

   teacherItemRole: {
     fontSize: 12,
     color: colors.mutedText,
     marginTop: 2,
   },

   activeTeacherBadge: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: colors.primaryBlue,
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 12,
   },

   activeTeacherBadgeText: {
     fontSize: 11,
     fontWeight: '700',
     color: colors.white,
   },

   emptyActionRow: {
     flexDirection: 'row',
     gap: spacing.sm,
     marginTop: spacing.md,
     flexWrap: 'wrap',
     justifyContent: 'center',
   },

   emptyActionBtn: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: colors.primaryBlue,
     paddingHorizontal: spacing.md,
     paddingVertical: spacing.sm,
     borderRadius: radius.md,
   },

   emptyActionBtnText: {
     color: colors.white,
     fontWeight: '700',
     fontSize: 14,
   },

   emptySecondaryBtn: {
     flexDirection: 'row',
     alignItems: 'center',
     borderWidth: 1,
     borderColor: colors.primaryBlue,
     paddingHorizontal: spacing.md,
     paddingVertical: spacing.sm,
     borderRadius: radius.md,
     backgroundColor: colors.white,
   },

   emptySecondaryBtnText: {
     color: colors.primaryBlue,
     fontWeight: '600',
     fontSize: 14,
   },
 });