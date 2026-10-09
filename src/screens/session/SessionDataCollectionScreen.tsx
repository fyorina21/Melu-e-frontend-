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

function checkStudentEligibility(
  rawStatus: string,
  hasAssignedGoal: boolean
): boolean {
  const s = rawStatus.toLowerCase().trim();

  // Exclude students whose status is in assessment, draft, pending review, registered, discharged, etc.
  if (
    s === 'in_assessment' ||
    s === 'in assessment' ||
    s === 'assessment' ||
    s === 'draft' ||
    s === 'registered' ||
    s === 'pending_review' ||
    s === 'pending review' ||
    s === 'withdrawn' ||
    s === 'discharged' ||
    s === 'archived'
  ) {
    return false;
  }

  const isInSession =
    s === 'in session' ||
    s === 'in_session' ||
    s === 'active' ||
    s === 'active therapy' ||
    s === 'active_therapy' ||
    s === 'session_assigned' ||
    s === 'session assigned' ||
    s === 'in_progress' ||
    s === 'in progress';

  const isReadyForIup =
    s === 'ready for iup' ||
    s === 'ready_for_iup' ||
    s === 'assessment_complete' ||
    s === 'assessment complete' ||
    s === 'assessment completed';

  // "only be the ones that are in ready for iup status and who are assigned goal or in session status"
  if (isInSession) {
    return true;
  }

  if (isReadyForIup && hasAssignedGoal) {
    return true;
  }

  // If status is empty/unknown but student specifically has an assigned goal from draft and is not excluded
  if (!s && hasAssignedGoal) {
    return true;
  }

  return false;
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
  const [localIncidents, setLocalIncidents] = useState<IncidentPayload[]>([]);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const loadRoster = useCallback(async (silent = false) => {
    try {
      // Start the session on the backend asynchronously so it doesn't block roster fetching
      startSession(sessionId).catch(() => {});

      const { data } = await getSessionRoster(sessionId);

      // Fetch student options and pipeline in parallel to ensure accurate status info
      const [optionsRes, pipelineRes] = await Promise.all([
        client.get<any[]>('/options/students').catch(() => null),
        client.get<any>('/program_director/assessment_pipeline').catch(() => null),
      ]);

      const studentMetaMap = new Map<
        string,
        { id: string; name: string; status: string; program?: string }
      >();

      if (Array.isArray(optionsRes?.data)) {
        optionsRes.data.forEach((s: any) => {
          const id = String(s.id || s.student_id || s.studentId);
          if (id) {
            studentMetaMap.set(id, {
              id,
              name: String(s.name || '').trim(),
              status: String(s.status || '').toLowerCase().trim(),
              program: s.program,
            });
          }
        });
      }

      const pipeList = Array.isArray(pipelineRes?.data?.pipeline)
        ? pipelineRes.data.pipeline
        : Array.isArray(pipelineRes?.data?.students)
        ? pipelineRes.data.students
        : Array.isArray(pipelineRes?.data)
        ? pipelineRes.data
        : [];

      pipeList.forEach((p: any) => {
        const id = String(p.student_id || p.id);
        if (!id) return;
        const existing = studentMetaMap.get(id);
        const st = String(p.status || p.stage || '').toLowerCase().trim();
        if (existing) {
          if (st) existing.status = st;
        } else {
          studentMetaMap.set(id, {
            id,
            name: String(p.student_name || p.name || 'Student').trim(),
            status: st,
          });
        }
      });

      const rosterRaw = Array.isArray(data?.students)
        ? data.students
        : Array.isArray(data)
        ? data
        : [];

      const eligibleStudents: any[] = [];
      const seenStudentIds = new Set<string>();

      // 1. Process students from backend roster
      rosterRaw.forEach((s: any) => {
        const sid = String(s.id);
        const meta = studentMetaMap.get(sid);
        const rawStatus = meta?.status || String(s.status || '').toLowerCase().trim();
        const assignedGoals = getStudentAssignedGoals(sid, s.goals);
        const hasAssigned = assignedGoals.length > 0;

        if (checkStudentEligibility(rawStatus, hasAssigned)) {
          seenStudentIds.add(sid);
          const sName = String(s.name || s.fullName || meta?.name || 'Student').trim();
          const goalsToUse =
            assignedGoals.length > 0
              ? assignedGoals
              : Array.isArray(s.goals)
              ? s.goals
              : [];

          eligibleStudents.push({
            id: sid,
            name: sName,
            initial: String(s.initial || (sName.slice(0, 2) || 'ST').toUpperCase()),
            program: String(s.program || meta?.program || 'Regular'),
            goals: goalsToUse,
            trials: Array.isArray(s.trials) ? s.trials : [],
          });
        }
      });

      // 2. If roster didn't yield enough eligible students (e.g. backend roster returned dummy in-assessment students),
      // include eligible students from drafts/candidates up to session limit (max 2)
      if (eligibleStudents.length < 2) {
        const allDrafts = getAllStoredIupDrafts();
        const draftStudentIds = Object.keys(allDrafts);
        const candidateIds = Array.from(
          new Set([...draftStudentIds, ...Array.from(studentMetaMap.keys())])
        );

        for (const cid of candidateIds) {
          if (eligibleStudents.length >= 2) break;
          if (seenStudentIds.has(cid)) continue;

          const meta = studentMetaMap.get(cid);
          const draft = getStoredIupDraft(cid);
          const draftStatus = draft?.status
            ? String(draft.status).toLowerCase().trim()
            : '';
          const rawStatus = meta?.status || draftStatus || '';
          const assignedGoals = getStudentAssignedGoals(cid, []);
          const hasAssigned = assignedGoals.length > 0;

          if (checkStudentEligibility(rawStatus, hasAssigned)) {
            seenStudentIds.add(cid);
            const studentName =
              meta?.name ||
              (draft?.studentName
                ? String(draft.studentName)
                : `Student ${cid.slice(0, 4)}`);
            eligibleStudents.push({
              id: cid,
              name: studentName,
              initial: (studentName.slice(0, 2) || 'ST').toUpperCase(),
              program: meta?.program || 'Regular',
              goals: assignedGoals,
              trials: [],
            });
          }
        }
      }

      const parsedRoster: SessionRoster = {
        teacherName: data?.teacherName || 'Teacher',
        stationName: data?.stationName || 'Station 1',
        roomName: data?.roomName || 'Room 101',
        blockDurationMinutes: Number(data?.blockDurationMinutes || 90),
        students: eligibleStudents.map((s: any, idx: number) => ({
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

        parsedRoster.students = mergedStudents;

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
  }, [sessionId]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

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
    const studentId = incidentModal?.studentId || (incidentData as any).student_id || (incidentData as any).studentId || '';
    const studentGoalId = incidentModal?.studentGoalId || (incidentData as any).student_goal_id || (incidentData as any).studentGoalId || '';
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
    const student = session?.students.find(
      (s) => s.id === incidentModal?.studentId
    );
    const fullIncident = {
      ...incidentData,
      studentName: student?.name ?? 'Unknown Student',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setLocalIncidents((prev) => [...prev, fullIncident]);
    recordIncidentInStore(sessionId, fullIncident as any);

    setIncidentModal(null);
    showToast('Behavior incident logged successfully', 'success');
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
    setSession((prev) =>
      prev
        ? { ...prev, students: [...prev.students].reverse() }
        : prev
    );
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
    navigation?.navigate?.('SessionSummary', {
      sessionId,
      localIncidents,
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

   if (session.students.length === 0) {
     return (
       <SafeAreaView style={styles.safe}>
         <AppNavbar activeTab="Session" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

         <View style={styles.header}>
           <View>
             <Text style={typography.h1}>Today's Session</Text>
             <Text style={typography.body}>
               {session.teacherName} • {session.stationName} •{' '}
               {session.roomName}
             </Text>
           </View>
         </View>

         <ScrollView contentContainerStyle={styles.scrollContent}>
           <Text style={[typography.h2, styles.studentsHeading]}>Students</Text>
           <View style={styles.emptyContainer}>
             <View style={styles.emptyIconCircle}>
               <Feather name="users" size={26} color={colors.mutedText} />
             </View>
             <Text style={styles.emptyTitle}>No student assigned yet</Text>
             <Text style={styles.emptyText}>
               A student appears here once their assessment is completed and an IUP goal has been assigned.
             </Text>
           </View>
         </ScrollView>
       </SafeAreaView>
     );
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
          {session.students.map((student) => (
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
 });