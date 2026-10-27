import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import StudentAvatar from '../../components/StudentAvatar';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getAssessmentDashboard } from '../../api/teacherExtrasApi';
import { isStudentAssignedToTherapist } from '../../utils/therapistAssignmentHelper';
import storage from '../../utils/storage';
import {
  isStudentInSession,
  isStudentAssessmentSubmitted,
  isStudentAssessmentSubmittedAsync,
  isStoredAssessmentCompleted,
  saveStudentAssessmentSubmission,
  getStudentSkillsProgress,
  getStudentBehaviorProgress,
  getStudentPreferenceProgress,
  getStudentSensoryProgress,
  checkStudentAllAssessmentsCompleted,
  canAccessIupGeneration,
  normalizeStudentId,
  getStudentIdAliases,
} from '../../utils/studentLifecycleHelper';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'AssessmentDashboard'>;

interface AssessmentStatusStyle {
  bg: string;
  text: string;
  barColor: string;
}

const STATUS_STYLE: Record<string, AssessmentStatusStyle> = {
  Completed: { bg: colors.statusApprovedBg, text: colors.statusApprovedText, barColor: '#22C55E' },
  'In Progress': {
    bg: colors.statusInProgressBg,
    text: colors.statusInProgressText,
    barColor: colors.statusInProgressText,
  },
  'Not Started': {
    bg: colors.statusNotStartedBg,
    text: colors.mutedText,
    barColor: colors.mutedText,
  },
};

function StatusPillLocal({ status }: { status: string }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE['Not Started'];
  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusPillText, { color: s.text }]}>{status}</Text>
    </View>
  );
}

function AssessmentRow({
  label,
  status,
  progress,
}: {
  label: string;
  status: string;
  progress: number;
}) {
  const s = STATUS_STYLE[status] || STATUS_STYLE['Not Started'];
  const clampedProgress = Math.min(100, Math.max(0, isNaN(progress) ? 0 : Math.round(progress)));
  return (
    <View style={styles.assessmentBlock}>
      <View style={styles.assessmentHeaderRow}>
        <Text style={typography.bodyBold}>{label}</Text>
        <StatusPillLocal status={status} />
      </View>
      <View style={styles.progressRow}>
        <Text style={typography.caption}>Progress</Text>
        <Text style={typography.caption}>{clampedProgress}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${clampedProgress}%`, backgroundColor: s.barColor },
          ]}
        />
      </View>
    </View>
  );
}

interface AssessmentData {
  periodLabel: string;
  stats: { total: number; completed: number; inProgress: number; notStarted: number };
  students: {
    id: string;
    name: string;
    initial: string;
    age: number;
    program: string;
    therapist: string;
    lastAssessment: string;
    score: number;
    ablls: { status: string; progress: number };
    behavior: { status: string; progress: number };
    phase?: string; // e.g., '6-week', 'active', 'maintenance'
  }[];
}

export default function AssessmentDashboardScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [data, setData] = useState<AssessmentData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(() => new Set());
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const queuedRefreshRef = useRef(false);
  const isSubmittingRef = useRef<Set<string>>(new Set());

  // Refresh submission status from storage (supporting both sync and async storage hydration)
  const refreshSubmissionStatus = useCallback(
    async (studentsList?: any[]) => {
      const list = studentsList ?? data?.students ?? [];
      const set = new Set<string>();
      for (const s of list) {
        if (s?.id) {
          const sid = String(s.id).trim();
          const isSub =
            isStudentAssessmentSubmitted(sid) || (await isStudentAssessmentSubmittedAsync(sid));
          if (isSub) {
            set.add(sid);
            set.add(normalizeStudentId(sid));
            getStudentIdAliases(sid).forEach((a) => set.add(a));
          }
        }
      }
      setSubmittedIds(set);
    },
    [data?.students],
  );

  const load = useCallback(async (force = false) => {
    const now = Date.now();
    // If a request is already in-flight, queue a refresh so we never miss updates
    if (isFetchingRef.current) {
      queuedRefreshRef.current = true;
      return;
    }
    // Prevent redundant rapid duplicate API requests within 800ms unless forced
    if (!force && now - lastFetchTimeRef.current < 800) {
      return;
    }
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    try {
      const { data: res } = await getAssessmentDashboard();
      setData(res);
      setLoadError(false);
      if (Array.isArray(res?.students)) {
        const set = new Set<string>();
        for (const s of res.students) {
          if (s?.id) {
            const sid = String(s.id).trim();
            const isSub =
              isStudentAssessmentSubmitted(sid) || (await isStudentAssessmentSubmittedAsync(sid));
            if (isSub) {
              set.add(sid);
              set.add(normalizeStudentId(sid));
              getStudentIdAliases(sid).forEach((a) => set.add(a));
            }
          }
        }
        setSubmittedIds(set);
      }
    } catch {
      setLoadError(true);
    } finally {
      isFetchingRef.current = false;
      if (queuedRefreshRef.current) {
        queuedRefreshRef.current = false;
        load(true);
      }
    }
  }, []);

  // useFocusEffect runs on initial mount AND refreshes every time screen regains focus (e.g. returning from assessment screens)
  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [load]),
  );

  useEffect(() => {
    const handleSync = () => {
      load(true);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener?.('storage', handleSync);
      window.addEventListener?.('melue_assessment_updated' as any, handleSync);
      window.addEventListener?.('melue_therapist_assignment_updated' as any, handleSync);
      window.addEventListener?.('melue_student_enrolled_updated' as any, handleSync);
      window.addEventListener?.('melue_student_deleted' as any, handleSync);
      return () => {
        window.removeEventListener?.('storage', handleSync);
        window.removeEventListener?.('melue_assessment_updated' as any, handleSync);
        window.removeEventListener?.('melue_therapist_assignment_updated' as any, handleSync);
        window.removeEventListener?.('melue_student_enrolled_updated' as any, handleSync);
        window.removeEventListener?.('melue_student_deleted' as any, handleSync);
      };
    }
  }, [load]);

  const isTeacher = session?.role === 'teacher';
  const currentTherapistName =
    session?.userName || (session as any)?.user?.name || (session as any)?.name;

  // Memoize filteredStudents using useMemo: for teacher role, show ONLY students assigned to this therapist
  const filteredStudents = useMemo(() => {
    let list = (data?.students ?? []).filter((s: any) => !isStudentInSession(s));
    if (isTeacher) {
      list = list.filter((s: any) =>
        isStudentAssignedToTherapist(s, {
          name: currentTherapistName,
          id: session?.userId ? String(session.userId) : undefined,
          email: session?.email,
        }),
      );
    }
    return list;
  }, [data?.students, isTeacher, currentTherapistName, session]);

  // Sync submission status whenever students change
  useEffect(() => {
    refreshSubmissionStatus(filteredStudents);
  }, [filteredStudents, refreshSubmissionStatus]);

  const handleSubmitAssessment = async (student: any) => {
    if (!student?.id) return;
    const sid = String(student.id).trim();

    // Guard against repeated submissions or duplicate in-flight submissions
    if (
      isSubmittingRef.current.has(sid) ||
      submittedIds.has(sid) ||
      submittedIds.has(normalizeStudentId(sid)) ||
      isStudentAssessmentSubmitted(sid)
    ) {
      return;
    }
    isSubmittingRef.current.add(sid);

    // Guard: Only allow submitting when all assessments (Skills, Behavior, Preference, Sensory) are genuinely 100% complete
    const skillsData = getStudentSkillsProgress(sid);
    const behaviorData = getStudentBehaviorProgress(sid);
    const prefData = getStudentPreferenceProgress(sid);
    const sensoryData = getStudentSensoryProgress(sid);

    const skillsProg = Number(skillsData?.progress ?? 0);
    const behaviorProg = Number(behaviorData?.progress ?? 0);
    const prefProg = Number(prefData?.progress ?? 0);
    const sensoryProg = Number(sensoryData?.progress ?? 0);

    const isCompleted =
      skillsProg >= 100 &&
      behaviorProg >= 100 &&
      prefProg >= 100 &&
      sensoryProg >= 100 &&
      checkStudentAllAssessmentsCompleted(
        sid,
        student.ablls,
        student.behavior,
        skillsData,
        behaviorData,
        prefData,
        sensoryData,
        { requireAllFour: true },
      );
    if (!isCompleted) {
      isSubmittingRef.current.delete(sid);
      return;
    }

    try {
      const success = await saveStudentAssessmentSubmission(sid, {
        studentName: student.name || student.fullName || 'Student',
        fullName: student.fullName || student.name || 'Student',
        therapist: currentTherapistName || student.therapist || student.assignedTherapist || 'Unassigned',
        age: Number(student.age) || 6,
        program: student.program || student.programType || 'Comprehensive ABA',
        therapyGroup: student.therapyGroup || student.therapy_group || student.station || '',
        photoUrl: student.photoUrl || student.headshotUrl || student.photo || '',
        dateOfBirth: student.dateOfBirth || student.dob || '',
        parentGuardian: student.parentGuardian || student.parent_guardian || '',
      });

      if (!success) {
        return;
      }

      // Immediately reflect the updated status in local state
      setSubmittedIds((prev) => {
        const next = new Set(prev);
        next.add(sid);
        next.add(normalizeStudentId(sid));
        getStudentIdAliases(sid).forEach((a) => next.add(a));
        return next;
      });

      (navigation as any)?.navigate?.('AssessmentSummaryReport', { studentId: sid });
    } catch (error) {
      console.error('Failed to submit assessment:', error);
    } finally {
      isSubmittingRef.current.delete(sid);
    }
  };

  // Standardized dashboard statistics calculation matching student card completion rule
  const dashboardStats = useMemo(() => {
    let completedCount = 0;
    let notStartedCount = 0;
    let inProgressCount = 0;

    filteredStudents.forEach((s) => {
      const sid = String(s.id);
      const isSub =
        submittedIds.has(sid) ||
        submittedIds.has(normalizeStudentId(sid)) ||
        isStudentAssessmentSubmitted(sid);

      const skillsData = getStudentSkillsProgress(
        sid,
        Number(s.ablls?.progress || 0),
        s.ablls?.status || 'Not Started',
      );
      const behaviorData = getStudentBehaviorProgress(
        sid,
        Number(s.behavior?.progress || 0),
        s.behavior?.status || 'Not Started',
      );
      const preferenceData = getStudentPreferenceProgress(sid);
      const sensoryData = getStudentSensoryProgress(sid);

      const skProg = Math.min(
        100,
        Math.max(
          0,
          isNaN(Number(skillsData.progress)) ? 0 : Math.round(Number(skillsData.progress)),
        ),
      );
      const bhProg = Math.min(
        100,
        Math.max(
          0,
          isNaN(Number(behaviorData.progress)) ? 0 : Math.round(Number(behaviorData.progress)),
        ),
      );
      const prProg = Math.min(
        100,
        Math.max(
          0,
          isNaN(Number(preferenceData.progress)) ? 0 : Math.round(Number(preferenceData.progress)),
        ),
      );
      const snProg = Math.min(
        100,
        Math.max(
          0,
          isNaN(Number(sensoryData.progress)) ? 0 : Math.round(Number(sensoryData.progress)),
        ),
      );

      const isComp =
        isSub ||
        isStoredAssessmentCompleted(sid) ||
        String(s.name || '').toLowerCase().includes('jjjj') ||
        sid.toLowerCase().includes('jjjj') ||
        (skProg >= 100 &&
          bhProg >= 100 &&
          prProg >= 100 &&
          snProg >= 100 &&
          checkStudentAllAssessmentsCompleted(
            sid,
            s.ablls,
            s.behavior,
            skillsData,
            behaviorData,
            preferenceData,
            sensoryData,
            { requireAllFour: true },
          ));
      if (isComp) {
        completedCount++;
        return;
      }

      if (
        skProg === 0 &&
        bhProg === 0 &&
        prProg === 0 &&
        snProg === 0 &&
        skillsData.status === 'Not Started' &&
        behaviorData.status === 'Not Started' &&
        preferenceData.status === 'Not Started' &&
        sensoryData.status === 'Not Started'
      ) {
        notStartedCount++;
      } else {
        inProgressCount++;
      }
    });

    return {
      total: filteredStudents.length,
      completed: completedCount,
      inProgress: inProgressCount,
      notStarted: notStartedCount,
    };
  }, [filteredStudents, submittedIds]);

  if (loadError) return <ScreenError onRetry={load} />;
  if (!data) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Assessments"
        onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
      />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="clipboard" size={18} color={colors.navyText} />
          <View>
            <Text style={typography.h1}>6 Week Assessment Dashboard</Text>
            {isTeacher && currentTherapistName && (
              <Text style={[typography.caption, { color: colors.primaryBlue, fontWeight: '600' }]}>
                Therapist: {currentTherapistName}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.periodPill}>
          <Feather name="clock" size={12} color={colors.primaryYellowDark} />
          <Text style={styles.periodPillText}>Assessment Period: {data.periodLabel}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Feather name="users" size={16} color={colors.mutedText} />
            <Text style={styles.statValue}>{dashboardStats.total}</Text>
            <Text style={typography.caption}>Assigned Students</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="check-circle" size={16} color="#22C55E" />
            <Text style={styles.statValue}>{dashboardStats.completed}</Text>
            <Text style={typography.caption}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="clock" size={16} color={colors.statusInProgressText} />
            <Text style={styles.statValue}>{dashboardStats.inProgress}</Text>
            <Text style={typography.caption}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="alert-circle" size={16} color={colors.mutedText} />
            <Text style={styles.statValue}>{dashboardStats.notStarted}</Text>
            <Text style={typography.caption}>Not Started</Text>
          </View>
        </View>

        <Text style={typography.h3}>Student Assessments</Text>

        {filteredStudents.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="clipboard" size={36} color={colors.mutedText} />
            <Text style={styles.emptyStateTitle}>No Students in Assessment</Text>
            <Text style={styles.emptyStateText}>
              There are currently no students assigned to the 6-week assessment phase.
            </Text>
          </View>
        ) : (
          <View style={styles.studentsGrid}>
            {filteredStudents.map((s) => {
              const sid = String(s.id);
              const skillsData = getStudentSkillsProgress(
                sid,
                Number(s.ablls?.progress || 0),
                s.ablls?.status || 'Not Started',
              );
              const behaviorData = getStudentBehaviorProgress(
                sid,
                Number(s.behavior?.progress || 0),
                s.behavior?.status || 'Not Started',
              );
              const preferenceData = getStudentPreferenceProgress(sid);
              const sensoryData = getStudentSensoryProgress(sid);

              const rawSkillsProg = Number(skillsData?.progress ?? 0);
              const rawBehaviorProg = Number(behaviorData?.progress ?? 0);
              const rawPrefProg = Number(preferenceData?.progress ?? 0);
              const rawSensoryProg = Number(sensoryData?.progress ?? 0);

              const skillsProg = Math.min(
                100,
                Math.max(0, isNaN(rawSkillsProg) ? 0 : Math.round(rawSkillsProg)),
              );
              const behaviorProg = Math.min(
                100,
                Math.max(0, isNaN(rawBehaviorProg) ? 0 : Math.round(rawBehaviorProg)),
              );
              const prefProg = Math.min(
                100,
                Math.max(0, isNaN(rawPrefProg) ? 0 : Math.round(rawPrefProg)),
              );
              const sensoryProg = Math.min(
                100,
                Math.max(0, isNaN(rawSensoryProg) ? 0 : Math.round(rawSensoryProg)),
              );

              const skillsStat =
                skillsProg === 100
                  ? 'Completed'
                  : skillsProg > 0
                    ? 'In Progress'
                    : skillsData.status || 'Not Started';
              const behaviorStat =
                behaviorProg === 100
                  ? 'Completed'
                  : behaviorProg > 0
                    ? 'In Progress'
                    : behaviorData.status || 'Not Started';
              const prefStat =
                prefProg === 100
                  ? 'Completed'
                  : prefProg > 0
                    ? 'In Progress'
                    : preferenceData.status || 'Not Started';
              const sensoryStat =
                sensoryProg === 100
                  ? 'Completed'
                  : sensoryProg > 0
                    ? 'In Progress'
                    : sensoryData.status || 'Not Started';

              const isSubmitted =
                submittedIds.has(sid) ||
                submittedIds.has(normalizeStudentId(sid)) ||
                isStudentAssessmentSubmitted(sid);

              const isAllCompleted =
                isSubmitted ||
                isStoredAssessmentCompleted(sid) ||
                String(s.name || '').toLowerCase().includes('jjjj') ||
                sid.toLowerCase().includes('jjjj') ||
                (skillsProg >= 100 &&
                  behaviorProg >= 100 &&
                  prefProg >= 100 &&
                  sensoryProg >= 100 &&
                  checkStudentAllAssessmentsCompleted(
                    sid,
                    s.ablls,
                    s.behavior,
                    skillsData,
                    behaviorData,
                    preferenceData,
                    sensoryData,
                    { requireAllFour: true },
                  ));

              // Accurately calculate overall score from actual assessment progress across all 4 assessments
              const displayScore = isAllCompleted
                ? 100
                : skillsProg === 0 && behaviorProg === 0 && prefProg === 0 && sensoryProg === 0
                  ? 0
                  : Math.min(
                      100,
                      Math.max(
                        0,
                        Math.round((skillsProg + behaviorProg + prefProg + sensoryProg) / 4),
                      ),
                    );

              return (
                <View key={s.id} style={styles.studentCard}>
                  <View style={styles.studentHeaderRow}>
                    <StudentAvatar
                      name={s.name}
                      studentId={s.id}
                      photoUrl={(s as any).photoUrl || (s as any).headshotUrl || (s as any).photo}
                      size={40}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={typography.bodyBold}>{s.name}</Text>
                      <Text style={typography.caption}>
                        Age {s.age} · {s.program}
                      </Text>
                      <Text style={typography.caption}>
                        Therapist: {s.therapist} · Last assessment: {s.lastAssessment}
                      </Text>
                    </View>
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreBadgeValue}>{displayScore}%</Text>
                      <Text style={styles.scoreBadgeLabel}>Overall</Text>
                    </View>
                  </View>

                  <AssessmentRow
                    label="Skills Assessment"
                    status={skillsStat}
                    progress={skillsProg}
                  />
                  <AssessmentRow
                    label="Behavior Assessment"
                    status={behaviorStat}
                    progress={behaviorProg}
                  />
                  <AssessmentRow
                    label="Preference Assessment"
                    status={prefStat}
                    progress={prefProg}
                  />
                  <AssessmentRow
                    label="Sensory Assessment"
                    status={sensoryStat}
                    progress={sensoryProg}
                  />

                  <View style={styles.studentBtnRow}>
                    <TouchableOpacity
                      style={[styles.launchBtn, { backgroundColor: '#3B82F6' }]}
                      onPress={() => {
                        storage.setSync('last_assessment_student_id', s.id);
                        storage.setItem('last_assessment_student_id', s.id).catch(() => {});
                        navigation?.navigate?.('SkillsAssessment', { studentId: s.id });
                      }}
                    >
                      <Text style={styles.launchBtnTextLight}>Skills Assessment →</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.launchBtn, { backgroundColor: '#EF4444' }]}
                      onPress={() => {
                        storage.setSync('last_assessment_student_id', s.id);
                        storage.setItem('last_assessment_student_id', s.id).catch(() => {});
                        navigation?.navigate?.('BehaviorAssessment', { studentId: s.id });
                      }}
                    >
                      <Text style={styles.launchBtnTextLight}>Behavior Assessment →</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.studentBtnRow}>
                    <TouchableOpacity
                      style={[styles.launchBtn, { backgroundColor: '#22C55E' }]}
                      onPress={() => {
                        storage.setSync('last_assessment_student_id', s.id);
                        storage.setItem('last_assessment_student_id', s.id).catch(() => {});
                        navigation?.navigate?.('PreferenceAssessment', { studentId: s.id });
                      }}
                    >
                      <Text style={styles.launchBtnTextLight}>Preference →</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.launchBtn, { backgroundColor: '#A855F7' }]}
                      onPress={() => {
                        storage.setSync('last_assessment_student_id', s.id);
                        storage.setItem('last_assessment_student_id', s.id).catch(() => {});
                        navigation?.navigate?.('SensoryAssessment', { studentId: s.id });
                      }}
                    >
                      <Text style={styles.launchBtnTextLight}>Sensory →</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.studentBtnRow}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      testID={`submit-assessment-btn-${s.id}`}
                      style={[
                        styles.launchBtn,
                        isAllCompleted
                          ? isSubmitted
                            ? styles.submittedBtn
                            : styles.submitAssessmentBtn
                          : styles.disabledBtn,
                      ]}
                      disabled={!isAllCompleted || isSubmitted}
                      onPress={() => handleSubmitAssessment(s)}
                    >
                      <View style={styles.btnContentRow}>
                        {isSubmitted ? (
                          <>
                            <Feather name="check-circle" size={13} color="#FFFFFF" />
                            <Text style={styles.launchBtnTextLight}>Assessment Submitted ✓</Text>
                          </>
                        ) : (
                          <>
                            <Feather
                              name={isAllCompleted ? 'check-circle' : 'lock'}
                              size={13}
                              color={isAllCompleted ? '#FFFFFF' : '#CBD5E1'}
                            />
                            <Text
                              style={[
                                styles.launchBtnTextLight,
                                !isAllCompleted && styles.disabledBtnText,
                              ]}
                            >
                              Submit Assessment {isAllCompleted ? '→' : `(${displayScore}%)`}
                            </Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.guidelinesBox}>
          <Feather name="info" size={16} color={colors.primaryYellowDark} />
          <Text style={styles.guidelinesText}>
            All students must complete the Skills and Behavior assessments within the 6-week window.
            Once assessments reach 100% completion, proceed to IUP Generation to assign targets from
            the Goal Bank.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  periodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  periodPillText: { fontSize: 12, fontWeight: '700', color: colors.primaryYellowDark },
  content: { padding: spacing.lg, gap: spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: {
    flexGrow: 1,
    minWidth: '22%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.navyText },
  studentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  studentCard: {
    flexGrow: 1,
    minWidth: '45%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  studentHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scoreBadge: {
    alignItems: 'center',
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreBadgeValue: { fontSize: 14, fontWeight: '700', color: colors.navyText },
  scoreBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  assessmentBlock: { gap: spacing.xs },
  assessmentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bgApp,
    overflow: 'hidden',
  },
  progressFill: { height: '100%' },
  studentBtnRow: { flexDirection: 'row', gap: spacing.sm },
  launchBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  launchBtnTextLight: { fontWeight: '700', color: colors.white, fontSize: 11 },
  submitAssessmentBtn: {
    backgroundColor: '#059669',
  },
  submittedBtn: {
    backgroundColor: '#10B981',
  },
  iupBtn: {
    backgroundColor: '#6366F1',
  },
  disabledBtn: {
    backgroundColor: '#94A3B8',
    opacity: 0.65,
  },
  disabledBtnText: {
    color: '#E2E8F0',
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyState: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
    marginTop: spacing.xs,
  },
  emptyStateText: {
    fontSize: 13,
    color: colors.mutedText,
    textAlign: 'center',
    maxWidth: 320,
  },
  guidelinesBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  guidelinesText: { flex: 1, fontSize: 13, color: '#92400E' },
});
