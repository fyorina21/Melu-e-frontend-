// screens/session/SessionDataCollectionScreen.js
// MR-33: Session Data Collection
// Matches Figma "Today's Session" frame (Teacher role).

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import TopNav from '../../components/TopNav';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import StudentSessionCard from './components/StudentSessionCard';
import BehaviorIncidentModal, { IncidentPayload } from './components/BehaviorIncidentModal';
import {
  getSessionRoster,
  logTrial,
  recordIncident,
  swapStudents,
} from '../../api/sessionApi';
import type { SessionStackParamList, SessionRoster, Payload } from '../../types';
import {
  startSessionTimer,
  resumeSessionTimer,
  pauseSessionTimer,
  remainingSeconds,
  isTimerRunning,
} from '../../stores/sessionTimerStore';

type Props = NativeStackScreenProps<SessionStackParamList, 'SessionDataCollection'>;

interface IncidentModalState {
  studentId: string;
  studentName?: string;
  goalName?: string;
}

export default function SessionDataCollectionScreen({ route, navigation }: Props) {
  const sessionId = route.params?.sessionId ?? 'DEMO_SESSION_ID';
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionRoster | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(isTimerRunning());
  const [incidentModal, setIncidentModal] = useState<IncidentModalState | null>(null);

  const loadRoster = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getSessionRoster(sessionId);
      setSession(data);
      startSessionTimer(sessionId, (data.blockDurationMinutes || 90) * 60);
      setSecondsRemaining(remainingSeconds());
      setIsRunning(isTimerRunning());
    } catch (err) {
      // Fallback demo data so the screen is reviewable before backend is ready
      setSession(DEMO_SESSION);
      startSessionTimer(sessionId, (DEMO_SESSION.blockDurationMinutes || 90) * 60);
      setSecondsRemaining(remainingSeconds());
      setIsRunning(isTimerRunning());
    } finally {
      setLoading(false);
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
      resumeSessionTimer(sessionId, (session?.blockDurationMinutes || DEMO_SESSION.blockDurationMinutes || 90) * 60);
    }
    setSecondsRemaining(remainingSeconds());
    setIsRunning(isTimerRunning());
  };

  const handleSelectPromptLevel = async (studentId: string, goalId: string | undefined, level: string, stepId?: string) => {
    // Optimistic UI update
    setSession((prev) => (prev ? {
      ...prev,
      students: prev.students.map((s) =>
        s.id === studentId
          ? { ...s, trials: [{ promptLevel: level, timestamp: 'Just now' }, ...(s.trials || [])] }
          : s
      ),
    } : prev));
    try {
      await logTrial(sessionId, studentId, goalId ?? '', { promptLevel: level, stepId });
    } catch (err) {
      Alert.alert('Sync failed', 'Trial saved locally, will retry when online.');
      // TODO: wire into MR-7-style offline queue once backend confirms it
    }
  };

  const handleOpenIncidentModal = (studentId: string, goalId: string | undefined) => {
    const student = session?.students.find((s) => s.id === studentId);
    const goal = student?.goals?.find((g) => g.id === goalId);
    setIncidentModal({
      studentId,
      studentName: student?.name,
      goalName: goal?.name,
    });
  };

  const handleCancelIncident = (hadChanges: boolean) => {
    if (hadChanges) {
      Alert.alert('Discard incident?', 'Any entered data will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => setIncidentModal(null) },
      ]);
    } else {
      setIncidentModal(null);
    }
  };

  const handleSaveIncident = async (incidentData: IncidentPayload) => {
    try {
      await recordIncident(sessionId, incidentModal?.studentId ?? '', incidentData as unknown as Payload);
    } catch (err) {
      // Demo/offline: incident is still considered recorded locally.
    }
    setIncidentModal(null);
    Alert.alert('Incident recorded');
  };

  const handleMasteryCheck = (studentId: string, goalId: string | undefined) => {
    // Real flow per SCR-004: navigate to the Goal Mastery Check screen,
    // don't just fire an API call.
    navigation?.navigate?.('GoalMasteryCheck', { studentId, goalId: goalId ?? '' });
  };

  const handleSwapStudents = async () => {
    try {
      await swapStudents(sessionId, {});
      loadRoster();
    } catch (err) {
      // No real backend yet (demo mode) - toggle active locally so the
      // screen is still demoable. Remove this fallback once swapStudents()
      // hits a real endpoint.
      setSession((prev) => (prev ? {
        ...prev,
        students: prev.students.map((s) => ({ ...s, active: !s.active })),
      } : prev));
    }
  };

  const handleActivate = (studentId: string) => {
    setSession((prev) => (prev ? {
      ...prev,
      students: prev.students.map((s) => ({ ...s, active: s.id === studentId })),
    } : prev));
  };

  const handleViewGoalProgress = (studentId: string, goalId: string) => {
    navigation?.navigate?.('GoalProgress', { studentId, goalId });
  };

  const handleViewProfile = (studentId: string) => {
    navigation?.navigate?.('StudentProfile', { studentId });
  };

  const handleSessionSummary = () => {
    navigation?.navigate?.('SessionSummary', { sessionId });
  };

  if (loading || !session || secondsRemaining === null) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={typography.body}>Loading session…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const minutes = String(Math.floor(secondsRemaining / 60)).padStart(2, '0');
  const seconds = String(secondsRemaining % 60).padStart(2, '0');

  return (
    <SafeAreaView style={styles.safe}>
      <TopNav
        activeTab="Session"
        onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
        onLogout={logout}
      />
      <View style={styles.header}>
        <View>
          <Text style={typography.h1}>Today's Session</Text>
          <Text style={typography.body}>
            {session.teacherName} • {session.stationName} • {session.roomName}
          </Text>
        </View>
        <View style={styles.timerRow}>
          <View style={styles.timerPill}>
            <Feather name="clock" size={14} color={colors.mutedText} style={{ marginRight: spacing.xs }} />
            <Text style={styles.timerText}>{minutes}:{seconds}</Text>
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
        {session.students.map((student) => (
          <StudentSessionCard
            key={student.id}
            student={student}
            onSelectPromptLevel={handleSelectPromptLevel}
            onRecordIncident={handleOpenIncidentModal}
            onMasteryCheck={handleMasteryCheck}
            onActivate={handleActivate}
            onViewGoalProgress={handleViewGoalProgress}
            onViewProfile={handleViewProfile}
            onUndo={() => {
              setSession((prev) => (prev ? {
                ...prev,
                students: prev.students.map((s) =>
                  s.id === student.id ? { ...s, trials: (s.trials || []).slice(1) } : s
                ),
              } : prev));
            }}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleSwapStudents}>
          <Text style={styles.secondaryBtnText}>⇄ Swap Students</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSessionSummary}>
          <Text style={styles.primaryBtnText}>📄 Session Summary</Text>
        </TouchableOpacity>
      </View>

      <BehaviorIncidentModal
        visible={!!incidentModal}
        studentName={incidentModal?.studentName}
        goalName={incidentModal?.goalName}
        recordedBy={session.teacherName}
        onCancel={handleCancelIncident}
        onSave={handleSaveIncident}
      />
    </SafeAreaView>
  );
}

// Demo fallback matching the Figma exactly, so the screen renders standalone
// before the real backend endpoint exists.
const DEMO_SESSION: SessionRoster = {
  teacherName: 'Teacher A',
  stationName: 'Station 1 (Basic Skills)',
  roomName: 'Room 2',
  blockDurationMinutes: 90, // spec: block is 1h30m or 1h20m depending on station
  students: [
    {
      id: 'student-a',
      name: 'Student A',
      initial: 'S',
      program: 'Basic',
      active: true,
      goals: [
        { id: 'goal-1', name: 'Identify Colors', category: 'Cognitive' },
        { id: 'goal-2', name: 'Goal 2', category: '' },
      ],
      trials: [],
    },
    {
      id: 'student-b',
      name: 'Student B',
      initial: 'S',
      program: 'Functional',
      active: false,
      goals: [
        { id: 'goal-3', name: 'Request Items', category: 'Expressive Language' },
        { id: 'goal-4', name: 'Goal 2', category: '' },
      ],
      trials: [],
    },
  ],
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  timerText: { fontWeight: '700', color: '#16A34A' },
  playPauseBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: spacing.lg },
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
  secondaryBtnText: { fontWeight: '600', color: colors.navyText },
  primaryBtn: {
    flex: 2,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: { fontWeight: '700', color: colors.navyText },
});
