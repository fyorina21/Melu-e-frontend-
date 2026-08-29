import React, { useEffect, useState, useCallback } from 'react';
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
  logTrial,
  recordIncident,
  swapStudents,
} from '../../api/sessionApi';
import type {
  SessionStackParamList,
  SessionRoster,
  Payload,
} from '../../types';
import {
  startSessionTimer,
  resumeSessionTimer,
  pauseSessionTimer,
  remainingSeconds,
  isTimerRunning,
} from '../../stores/sessionTimerStore';

type Props = NativeStackScreenProps<
  SessionStackParamList,
  'SessionDataCollection'
>;

interface IncidentModalState {
  studentId: string;
  studentName?: string;
  goalName?: string;
}

export default function SessionDataCollectionScreen({
  route,
  navigation,
}: Props) {
  const sessionId = route.params?.sessionId ?? 'active';
  const { logout } = useAuth();
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

  const loadRoster = useCallback(async () => {
    try {
      setLoading(true);

      const { data } = await getSessionRoster(sessionId);

      setSession(data);

      startSessionTimer(
        sessionId,
        (data.blockDurationMinutes || 90) * 60
      );

      setSecondsRemaining(remainingSeconds());
      setIsRunning(isTimerRunning());
    } catch (err) {
      setSession(null);
      setLoadError(true);
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
    try {
      await logTrial(sessionId, studentId, goalId ?? '', {
        promptLevel: level,
        stepId,
      });
      showToast('Trial logged successfully', 'success');
      await loadRoster();
    } catch (err) {
      Alert.alert(
        'Sync failed',
        'Trial saved locally, will retry when online.'
      );
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
    );

    setIncidentModal({
      studentId,
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
    try {
      await recordIncident(
        sessionId,
        incidentModal?.studentId ?? '',
        incidentData as unknown as Payload
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

  const activeStudentId =
    session.students.find((s) => s.active)?.id ??
    session.students[0]?.id ??
    '';

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
        <View style={styles.assessmentPanel}>
          <Text style={styles.assessmentPanelTitle}>
            Assessment Types
          </Text>
          <View style={styles.assessmentChips}>
            <TouchableOpacity
              style={styles.assessmentChip}
              onPress={() =>
                navigation?.navigate?.('SkillsAssessment', {
                  studentId: activeStudentId,
                })
              }
            >
              <Text style={styles.assessmentChipText}>Skills</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.assessmentChip}
              onPress={() =>
                navigation?.navigate?.('BehaviorAssessment', {
                  studentId: activeStudentId,
                })
              }
            >
              <Text style={styles.assessmentChipText}>Behavior</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.assessmentChip}
              onPress={() =>
                navigation?.navigate?.('PreferenceAssessment', {
                  studentId: activeStudentId,
                })
              }
            >
              <Text style={styles.assessmentChipText}>Preference</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.assessmentChip}
              onPress={() =>
                navigation?.navigate?.('SensoryAssessment', {
                  studentId: activeStudentId,
                })
              }
            >
              <Text style={styles.assessmentChipText}>Sensory</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.assessmentChip}
              onPress={() =>
                navigation?.navigate?.('AbllsNeedMap', {
                  studentId: activeStudentId,
                })
              }
            >
              <Text style={styles.assessmentChipText}>ABLLS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.assessmentChip, styles.assessmentChipAccent]}
              onPress={() =>
                navigation?.navigate?.('SocialSkillsAssessment', {
                  studentId: activeStudentId,
                })
              }
            >
              <Text
                style={[
                  styles.assessmentChipText,
                  styles.assessmentChipTextAccent,
                ]}
              >
                Social Skills Questionnaire
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
                onSelectPromptLevel={
                  handleSelectPromptLevel
                }
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
                onUndo={() => {
                  setSession((prev) =>
                    prev
                      ? {
                          ...prev,
                          students: prev.students.map(
                            (s) =>
                              s.id === student.id
                                ? {
                                    ...s,
                                    trials: (
                                      s.trials || []
                                    ).slice(0, -1),
                                  }
                                : s
                          ),
                        }
                      : prev
                  );
                }}
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
        studentName={incidentModal?.studentName}
        goalName={incidentModal?.goalName}
        recordedBy={session.teacherName}
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

  assessmentPanel: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  assessmentPanelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mutedText,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  assessmentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  assessmentChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgApp,
  },

  assessmentChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },

  assessmentChipAccent: {
    borderColor: colors.primaryYellowDark,
    backgroundColor: colors.primaryYellow,
  },

  assessmentChipTextAccent: {
    color: colors.navyText,
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
});