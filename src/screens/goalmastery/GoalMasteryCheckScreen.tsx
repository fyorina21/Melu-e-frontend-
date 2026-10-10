import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import client, {
  createGoalMasteryCheck,
  getMasteryCheck,
  submitGoalMasteryVerification,
} from '../../api/sessionApi';
import {
  getStudentOptions,
  getStaffOptions,
  type StudentOption,
  type StaffOption,
} from '../../api/optionsApi';
import { spacing } from '../../theme/colors';
import type { SessionStackParamList } from '../../types';
import {
  type OutcomeOption,
  type PromptType,
  type MasteryCheckData,
  type GoalOption,
  isTeacherVerificationValid,
} from './types';
import {
  MasteryHeaderPickers,
  MasteryStudentCard,
  PrimaryTeacherCard,
  TeacherVerificationCard,
  MasteryFooterActions,
} from './components';
import {
  STATUS_LABELS,
  today,
  formatDate,
  readStoredCheckId,
  writeStoredCheckId,
  clearStoredCheckId,
  unwrapBody,
  flattenGoals,
  toFormOutcome,
  payloadFor,
  canSubmitMasteryCheck,
} from './goalMasteryHelper';

type Props = NativeStackScreenProps<SessionStackParamList, 'GoalMasteryCheck'>;

export default function GoalMasteryCheckScreen({ route, navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { session: authSession } = useAuth();
  const { showToast } = useToast();
  const urlSid =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('studentId')
      : null;
  const urlGid =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('goalId')
      : null;
  const localSid =
    typeof localStorage !== 'undefined' ? localStorage.getItem('last_assessment_student_id') : null;

  const initialSid = route?.params?.studentId || urlSid || localSid || '';
  const initialGid = route?.params?.goalId || urlGid || '';

  const [activeStudentId, setActiveStudentId] = useState<string>(initialSid);
  const [activeGoalId, setActiveGoalId] = useState<string>(initialGid);
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [goalOptions, setGoalOptions] = useState<GoalOption[]>([]);

  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [goalDropdownOpen, setGoalDropdownOpen] = useState(false);

  const [data, setData] = useState<MasteryCheckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Teacher B Form State
  const [teacherBOutcome, setTeacherBOutcome] = useState<OutcomeOption | null>(null);
  const [teacherBPrompt, setTeacherBPrompt] = useState<PromptType>('');
  const [teacherBNotes, setTeacherBNotes] = useState('');
  const [teacherBLocked, setTeacherBLocked] = useState(false);
  const [showTeacherBPromptDropdown, setShowTeacherBPromptDropdown] = useState(false);

  // Teacher C Form State
  const [teacherCOutcome, setTeacherCOutcome] = useState<OutcomeOption | null>(null);
  const [teacherCPrompt, setTeacherCPrompt] = useState<PromptType>('');
  const [teacherCNotes, setTeacherCNotes] = useState('');
  const [teacherCLocked, setTeacherCLocked] = useState(false);
  const [showTeacherCPromptDropdown, setShowTeacherCPromptDropdown] = useState(false);

  const [touched, setTouched] = useState(false);

  const loggedInTeacherName = authSession?.userName || data?.primaryTeacher?.name || 'Rosa Delgado';

  // 1. Fetch available students list
  useEffect(() => {
    let active = true;
    getStudentOptions()
      .then(({ data: students }) => {
        if (!active) return;
        const list = Array.isArray(students) ? students : [];
        setStudentOptions(list);
        if (!activeStudentId && list.length > 0) {
          setActiveStudentId(list[0].id);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [activeStudentId]);

  // 2. Load student profile, staff, mastery check
  const load = useCallback(async () => {
    if (!activeStudentId) return;
    setLoading(true);
    try {
      const profile = unwrapBody(await client.get(`/students/${activeStudentId}`));
      if (!profile) {
        setLoadError(true);
        return;
      }

      const { goals, stationByGoal } = flattenGoals(profile.current_goals_summary);
      setGoalOptions(goals);

      let gid = activeGoalId;
      if (!gid || !goals.some((g) => g.id === gid)) gid = goals[0]?.id || '';
      if (gid && gid !== activeGoalId) setActiveGoalId(gid);
      const goal = goals.find((g) => g.id === gid);

      let staff: StaffOption[] = [];
      try {
        staff = ((await getStaffOptions()).data as StaffOption[]) || [];
      } catch {}
      const otherTeachers = staff.filter(
        (s) =>
          String(s.role || '')
            .toLowerCase()
            .includes('teacher') &&
          s.name &&
          s.name !== loggedInTeacherName,
      );
      const teacherB = otherTeachers[0];
      const teacherC = otherTeachers[1];
      const staffNameOf = (id: unknown) =>
        staff.find((s) => String(s.id) === String(id))?.name || '';

      let check: Record<string, any> | null = null;
      let verifications: Record<string, any>[] = [];
      let trials: Record<string, any>[] = [];
      const storedId = readStoredCheckId(activeStudentId, gid);
      if (storedId) {
        try {
          const body = (await getMasteryCheck(storedId)).data as Record<string, any>;
          check = body?.mastery_check || null;
          verifications = Array.isArray(body?.verifications) ? body.verifications : [];
          trials = Array.isArray(body?.trials) ? body.trials : [];
        } catch {
          clearStoredCheckId(activeStudentId, gid);
        }
      }

      const verificationFor = (option?: StaffOption) =>
        check && option
          ? verifications.find((v) => String(v.verifying_teacher_id) === String(option.id))
          : undefined;
      const vB = verificationFor(teacherB);
      const vC = verificationFor(teacherC);

      if (vB) {
        setTeacherBOutcome(toFormOutcome(vB.outcome));
        setTeacherBPrompt(String(vB.prompt_used || '') as PromptType);
        setTeacherBNotes(String(vB.notes || ''));
      }
      if (vC) {
        setTeacherCOutcome(toFormOutcome(vC.outcome));
        setTeacherCPrompt(String(vC.prompt_used || '') as PromptType);
        setTeacherCNotes(String(vC.notes || ''));
      }
      setTeacherBLocked(!!vB);
      setTeacherCLocked(!!vC);

      const iVerified = verifications.some(
        (v) => staffNameOf(v.verifying_teacher_id) === loggedInTeacherName,
      );
      const advanced = !!check && String(check.status) !== 'pending_verifications';
      setIsSubmitted(iVerified || advanced);

      const initiatorName =
        (check && staffNameOf(check.initiating_teacher_id)) || loggedInTeacherName;
      const initiatorRole = staff.find((s) => s.name === initiatorName)?.role || 'teacher';

      setData({
        studentId: activeStudentId,
        goalId: gid || undefined,
        studentName: String(profile.full_name || profile.name || ''),
        goalName: goal?.name || '—',
        station: (gid && stationByGoal[gid]) || '—',
        dateInitiated: check ? formatDate(check.created_at) : '—',
        initiatedBy: initiatorName,
        initiatedByRole: initiatorRole.charAt(0).toUpperCase() + initiatorRole.slice(1),
        statusLabel:
          (check && STATUS_LABELS[String(check.status)]) ||
          (check ? String(check.status) : 'Draft'),
        primaryTeacher: {
          name: loggedInTeacherName,
          criteriaMet: goal?.name || '—',
          dateAchieved: '—',
          totalTrials: check ? trials.length : '—',
          independenceRate: goal?.progress != null ? `${Math.round(goal.progress)}%` : '—',
          notes: check?.rejection_reason ? String(check.rejection_reason) : '',
        },
        teacherB: {
          name: teacherB?.name || 'Teacher B',
          date: vB ? formatDate(vB.created_at) : today(),
        },
        teacherC: {
          name: teacherC?.name || 'Teacher C',
          date: vC ? formatDate(vC.created_at) : today(),
        },
      });
      setLoadError(false);

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          localStorage.setItem('last_assessment_student_id', activeStudentId);
          const url = `/GoalMasteryCheck?studentId=${encodeURIComponent(activeStudentId)}${gid ? `&goalId=${encodeURIComponent(gid)}` : ''}`;
          window.history.replaceState(null, '', url);
        } catch {}
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [activeStudentId, activeGoalId, loggedInTeacherName]);

  useEffect(() => {
    if (activeStudentId) {
      load();
    }
  }, [load, activeStudentId, activeGoalId]);

  // Validation Logic
  const isTeacherBValid = useMemo(
    () => isTeacherVerificationValid(teacherBOutcome, teacherBPrompt),
    [teacherBOutcome, teacherBPrompt],
  );

  const isTeacherCValid = useMemo(
    () => isTeacherVerificationValid(teacherCOutcome, teacherCPrompt),
    [teacherCOutcome, teacherCPrompt],
  );

  const canSubmit = useMemo(
    () =>
      canSubmitMasteryCheck(
        teacherBLocked,
        isTeacherBValid,
        teacherCLocked,
        isTeacherCValid,
        isSubmitted,
        submitting,
      ),
    [teacherBLocked, isTeacherBValid, teacherCLocked, isTeacherCValid, isSubmitted, submitting],
  );

  const handleCancel = () => {
    if (touched && !isSubmitted) {
      Alert.alert('Discard changes?', 'Any entered data will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation?.goBack?.(),
        },
      ]);
    } else {
      navigation?.goBack?.();
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !activeStudentId || !activeGoalId) return;

    const pending: Record<string, any>[] = [];
    if (!teacherBLocked && teacherBOutcome) {
      pending.push(payloadFor(teacherBOutcome, teacherBPrompt, teacherBNotes));
    }
    if (!teacherCLocked && teacherCOutcome) {
      pending.push(payloadFor(teacherCOutcome, teacherCPrompt, teacherCNotes));
    }
    if (pending.length === 0) {
      showToast('There are no pending verifications to submit.', 'info');
      return;
    }

    setSubmitting(true);
    let created = false;
    try {
      let checkId = readStoredCheckId(activeStudentId, activeGoalId);
      if (!checkId) {
        const res = await createGoalMasteryCheck(activeGoalId);
        const createdId = (res.data as Record<string, any> | undefined)?.mastery_check?.id;
        if (!createdId) throw new Error('Could not start the mastery check.');
        checkId = String(createdId);
        writeStoredCheckId(activeStudentId, activeGoalId, checkId);
        created = true;
      }

      const results = await Promise.allSettled(
        pending.map((payload) => submitGoalMasteryVerification(checkId, payload)),
      );

      const failures = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => (r.reason as Error)?.message || 'Submission failed.');
      const successCount = results.length - failures.length;

      await load();

      if (successCount === pending.length) {
        showToast(
          pending.length === 2
            ? 'Verifications submitted and notification sent to Director.'
            : 'Verification submitted.',
          'success',
        );
      } else if (successCount > 0) {
        showToast(
          `${successCount} of ${pending.length} verifications recorded. ${failures[0]}`,
          'error',
        );
      } else {
        const head = created ? 'Mastery check initiated, but ' : '';
        const detail = failures[0] || 'verifications could not be submitted.';
        const hint = /your own/i.test(detail)
          ? ' Two teachers other than the initiator must sign in to verify.'
          : '';
        showToast(`${head}${detail}${hint}`, 'error');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed.';
      showToast(created ? `Mastery check started, but submission failed: ${msg}` : msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) return <ScreenError onRetry={load} />;
  if (loading && !data) return <ScreenLoader />;
  if (!data) return <ScreenLoader />;

  const currentStatus = data.statusLabel || 'Draft';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack?.()}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Feather name="arrow-left" size={16} color="#334155" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goal Mastery Check</Text>

        <MasteryHeaderPickers
          studentOptions={studentOptions}
          goalOptions={goalOptions}
          activeStudentId={activeStudentId}
          activeGoalId={activeGoalId}
          defaultStudentName={data.studentName}
          defaultGoalName={data.goalName}
          studentDropdownOpen={studentDropdownOpen}
          goalDropdownOpen={goalDropdownOpen}
          onToggleStudentDropdown={() => {
            setGoalDropdownOpen(false);
            setStudentDropdownOpen((prev) => !prev);
          }}
          onToggleGoalDropdown={() => {
            setStudentDropdownOpen(false);
            setGoalDropdownOpen((prev) => !prev);
          }}
          onSelectStudent={(id) => {
            setActiveStudentId(id);
            setStudentDropdownOpen(false);
          }}
          onSelectGoal={(id) => {
            setActiveGoalId(id);
            setGoalDropdownOpen(false);
          }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.responsiveContainer, isTablet && styles.responsiveContainerTablet]}>
          {/* Student Information Card */}
          <MasteryStudentCard data={data} currentStatus={currentStatus} isSubmitted={isSubmitted} />

          {/* 3 Columns Section */}
          <View style={styles.columnsRow}>
            {/* Primary Teacher (A) Card */}
            <PrimaryTeacherCard
              teacherName={loggedInTeacherName}
              primaryData={data.primaryTeacher}
            />

            {/* Second Teacher (B) Verification Card */}
            <TeacherVerificationCard
              teacher={data.teacherB}
              outcome={teacherBOutcome}
              prompt={teacherBPrompt}
              notes={teacherBNotes}
              showPromptDropdown={showTeacherBPromptDropdown}
              isSubmitted={isSubmitted}
              isLocked={teacherBLocked}
              onOutcomeChange={(opt) => {
                setTouched(true);
                setTeacherBOutcome(opt);
                if (opt !== 'failed') setTeacherBPrompt('');
              }}
              onPromptChange={(prompt) => {
                setTeacherBPrompt(prompt);
                setShowTeacherBPromptDropdown(false);
              }}
              onNotesChange={(notes) => {
                setTouched(true);
                setTeacherBNotes(notes);
              }}
              onTogglePromptDropdown={() => setShowTeacherBPromptDropdown((prev) => !prev)}
            />

            {/* Third Teacher (C) Verification Card */}
            <TeacherVerificationCard
              teacher={data.teacherC}
              outcome={teacherCOutcome}
              prompt={teacherCPrompt}
              notes={teacherCNotes}
              showPromptDropdown={showTeacherCPromptDropdown}
              isSubmitted={isSubmitted}
              isLocked={teacherCLocked}
              onOutcomeChange={(opt) => {
                setTouched(true);
                setTeacherCOutcome(opt);
                if (opt !== 'failed') setTeacherCPrompt('');
              }}
              onPromptChange={(prompt) => {
                setTeacherCPrompt(prompt);
                setShowTeacherCPromptDropdown(false);
              }}
              onNotesChange={(notes) => {
                setTouched(true);
                setTeacherCNotes(notes);
              }}
              onTogglePromptDropdown={() => setShowTeacherCPromptDropdown((prev) => !prev)}
            />
          </View>

          {/* Footer Actions */}
          <MasteryFooterActions
            canSubmit={canSubmit}
            isSubmitted={isSubmitted}
            submitting={submitting}
            onCancel={handleCancel}
            onSubmit={handleSubmit}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  content: {
    padding: spacing.md,
    alignItems: 'center',
  },
  responsiveContainer: {
    width: '100%',
    gap: spacing.md,
  },
  responsiveContainerTablet: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
  columnsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
});
