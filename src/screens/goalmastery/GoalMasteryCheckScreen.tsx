import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import StudentAvatar from '../../components/StudentAvatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import client, { createGoalMasteryCheck, getMasteryCheck, submitGoalMasteryVerification } from '../../api/sessionApi';
import { getStudentOptions, getStaffOptions, type StudentOption, type StaffOption } from '../../api/optionsApi';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'GoalMasteryCheck'>;
type OutcomeOption = 'novel_person' | 'novel_environment' | 'both' | 'failed';
type PromptType = '' | 'Full Physical (FP)' | 'Partial Physical (PP)' | 'Gestural (G)';

interface PrimaryTeacherData {
  name: string;
  criteriaMet: string;
  dateAchieved: string;
  totalTrials: number | string;
  independenceRate: string;
  notes?: string;
}

interface VerificationTeacher {
  name: string;
  date: string;
  outcome?: OutcomeOption | null;
  promptUsed?: PromptType;
  notes?: string;
}

interface MasteryCheckData {
  studentId?: string;
  goalId?: string;
  studentName: string;
  goalName: string;
  station: string;
  dateInitiated: string;
  initiatedBy: string;
  initiatedByRole: string;
  statusLabel: string;
  primaryTeacher: PrimaryTeacherData;
  teacherB: VerificationTeacher;
  teacherC: VerificationTeacher;
}

interface GoalOption {
  id: string;
  name: string;
  progress?: number;
}

const OUTCOME_OPTIONS: { id: OutcomeOption; label: string }[] = [
  { id: 'novel_person', label: 'Independent with Novel Person' },
  { id: 'novel_environment', label: 'Independent in Novel Environment' },
  { id: 'both', label: 'Both' },
  { id: 'failed', label: 'Failed - Required Prompt' },
];

const PROMPT_OPTIONS: PromptType[] = [
  'Full Physical (FP)',
  'Partial Physical (PP)',
  'Gestural (G)',
];

const STATUS_LABELS: Record<string, string> = {
  pending_verifications: 'Pending Verifications',
  pending_approval: 'Pending Director Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const today = () => new Date().toISOString().split('T')[0];

const formatDate = (value?: string | null) => {
  if (!value) return today();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString().split('T')[0];
};

// Backend has no lookup route for "the check of this student goal", so the
// id returned by POST /student_goals/:id/mastery_checks is persisted here
// and reused by load() / submit to fetch the check by id.
const checkKey = (studentId: string, goalId: string) => `gmc_check_${studentId}_${goalId}`;

const readStoredCheckId = (studentId: string, goalId: string): string | null => {
  if (!studentId || !goalId || typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(checkKey(studentId, goalId));
  } catch {
    return null;
  }
};

const writeStoredCheckId = (studentId: string, goalId: string, id: string) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(checkKey(studentId, goalId), id);
  } catch {}
};

const clearStoredCheckId = (studentId: string, goalId: string) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(checkKey(studentId, goalId));
  } catch {}
};

// GET /students/:id (and the teacher/coordinator profile fallbacks) all
// respond { success, data: {...} } — peel the envelope before reading.
function unwrapBody(res: { data?: unknown }): Record<string, any> | null {
  const body = res?.data as Record<string, any> | undefined;
  if (!body || typeof body !== 'object') return null;
  if (body.data && typeof body.data === 'object') return body.data as Record<string, any>;
  return body;
}

// current_goals_summary is an array of { station, goals } entries; flatten
// it into the goal dropdown list and keep station names for display.
const flattenGoals = (summary: unknown) => {
  const entries = Array.isArray(summary)
    ? (summary as { station?: { name?: string }; goals?: { id: string | number; goal_name?: string; progress_percent?: number }[] }[])
    : [];
  const goals: GoalOption[] = [];
  const stationByGoal: Record<string, string> = {};
  entries.forEach((entry) => {
    (entry.goals || []).forEach((g) => {
      const id = String(g.id);
      goals.push({ id, name: g.goal_name || 'Goal', progress: g.progress_percent });
      stationByGoal[id] = entry.station?.name || '';
    });
  });
  return { goals, stationByGoal };
};

// Backend only stores success | fail; "failed" maps to fail, every other
// form outcome is a success variant.
const toApiOutcome = (outcome: OutcomeOption) => (outcome === 'failed' ? 'fail' : 'success');
const toFormOutcome = (outcome?: string | null): OutcomeOption | null =>
  outcome === 'fail' ? 'failed' : outcome === 'success' ? 'both' : null;

export default function GoalMasteryCheckScreen({ route, navigation }: Props) {
  const { session: authSession } = useAuth();
  const { showToast } = useToast();
  const urlSid = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('studentId') : null;
  const urlGid = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('goalId') : null;
  const localSid = typeof localStorage !== 'undefined' ? localStorage.getItem('last_assessment_student_id') : null;

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
    return () => { active = false; };
  }, [activeStudentId]);

  // 2. Load everything for the active student + goal in one pass:
  // student profile (goals/station), staff options (Teacher B/C), and any
  // persisted mastery check + its verifications.
  const load = useCallback(async () => {
    if (!activeStudentId) return;
    setLoading(true);
    try {
      // GET /students/:id is the compatible source for this screen: it is the
      // only profile route that returns current_goals_summary (the teacher
      // and coordinator profile routes respond without any goals).
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
        (s) => String(s.role || '').toLowerCase().includes('teacher') && s.name && s.name !== loggedInTeacherName
      );
      const teacherB = otherTeachers[0];
      const teacherC = otherTeachers[1];
      const staffNameOf = (id: unknown) => staff.find((s) => String(s.id) === String(id))?.name || '';

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

      const iVerified = verifications.some((v) => staffNameOf(v.verifying_teacher_id) === loggedInTeacherName);
      const advanced = !!check && String(check.status) !== 'pending_verifications';
      setIsSubmitted(iVerified || advanced);

      const initiatorName = (check && staffNameOf(check.initiating_teacher_id)) || loggedInTeacherName;
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
        statusLabel: (check && STATUS_LABELS[String(check.status)]) || (check ? String(check.status) : 'Draft'),
        primaryTeacher: {
          name: loggedInTeacherName,
          criteriaMet: goal?.name || '—',
          dateAchieved: '—',
          totalTrials: check ? trials.length : '—',
          independenceRate: goal?.progress != null ? `${Math.round(goal.progress)}%` : '—',
          notes: check?.rejection_reason ? String(check.rejection_reason) : '',
        },
        teacherB: { name: teacherB?.name || 'Teacher B', date: vB ? formatDate(vB.created_at) : today() },
        teacherC: { name: teacherC?.name || 'Teacher C', date: vC ? formatDate(vC.created_at) : today() },
      });
      setLoadError(false);

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          localStorage.setItem('last_assessment_student_id', activeStudentId);
          const url = `/GoalMasteryCheck?studentId=${encodeURIComponent(activeStudentId)}${gid ? `&goalId=${encodeURIComponent(gid)}` : ''}`;
          window.history.replaceState(null, '', url);
        } catch {}
      }
    } catch (err) {
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
  const isTeacherBValid = teacherBOutcome && (
    teacherBOutcome !== 'failed' || (teacherBOutcome === 'failed' && teacherBPrompt !== '')
  );

  const isTeacherCValid = teacherCOutcome && (
    teacherCOutcome !== 'failed' || (teacherCOutcome === 'failed' && teacherCPrompt !== '')
  );

  const canSubmit =
    (teacherBLocked || isTeacherBValid) &&
    (teacherCLocked || isTeacherCValid) &&
    !isSubmitted &&
    !submitting;

  const handleCancel = () => {
    if (touched && !isSubmitted) {
      Alert.alert('Discard changes?', 'Any entered data will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation?.goBack?.() },
      ]);
    } else {
      navigation?.goBack?.();
    }
  };

  const payloadFor = (outcome: OutcomeOption, prompt: PromptType, notes: string): Record<string, any> => ({
    outcome: toApiOutcome(outcome),
    ...(outcome === 'failed' ? { prompt_used: prompt } : {}),
    notes,
  });

  const handleSubmit = async () => {
    if (!canSubmit || !activeStudentId || !activeGoalId) return;

    // A column that already has a recorded verification is locked and must
    // not be re-sent (the backend rejects duplicates with a 422).
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
      // The backend has no GET-by-student+goal route; reuse the persisted
      // check id when we have one, otherwise initiate a new check.
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
        pending.map((payload) => submitGoalMasteryVerification(checkId, payload))
      );

      const failures = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => ((r.reason as Error)?.message) || 'Submission failed.');
      const successCount = results.length - failures.length;

      await load();

      if (successCount === pending.length) {
        showToast(
          pending.length === 2
            ? 'Verifications submitted and notification sent to Director.'
            : 'Verification submitted.',
          'success'
        );
      } else if (successCount > 0) {
        showToast(`${successCount} of ${pending.length} verifications recorded. ${failures[0]}`, 'error');
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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
          <Feather name="arrow-left" size={16} color="#334155" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goal Mastery Check</Text>

        <View style={styles.headerPickersRow}>
          {/* Student Selector */}
          {studentOptions.length > 1 && (
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => {
                  setGoalDropdownOpen(false);
                  setStudentDropdownOpen(!studentDropdownOpen);
                }}
              >
                <Feather name="user" size={14} color="#0284C7" />
                <Text style={styles.pickerBtnText} numberOfLines={1}>
                  {studentOptions.find((s) => s.id === activeStudentId)?.name || data.studentName}
                </Text>
                <Feather name="chevron-down" size={14} color="#64748B" />
              </TouchableOpacity>
              {studentDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {studentOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.dropdownItem, opt.id === activeStudentId && styles.dropdownItemSelected]}
                      onPress={() => {
                        setActiveStudentId(opt.id);
                        setStudentDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, opt.id === activeStudentId && styles.dropdownItemTextSelected]}>
                        {opt.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Goal Selector */}
          {goalOptions.length > 1 && (
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => {
                  setStudentDropdownOpen(false);
                  setGoalDropdownOpen(!goalDropdownOpen);
                }}
              >
                <Feather name="target" size={14} color="#0284C7" />
                <Text style={styles.pickerBtnText} numberOfLines={1}>
                  {goalOptions.find((g) => g.id === activeGoalId)?.name || data.goalName}
                </Text>
                <Feather name="chevron-down" size={14} color="#64748B" />
              </TouchableOpacity>
              {goalDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {goalOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.dropdownItem, opt.id === activeGoalId && styles.dropdownItemSelected]}
                      onPress={() => {
                        setActiveGoalId(opt.id);
                        setGoalDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, opt.id === activeGoalId && styles.dropdownItemTextSelected]}>
                        {opt.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Student Information Card */}
        <View style={styles.studentCard}>
          <View style={styles.studentInfoLeft}>
            <StudentAvatar
              name={data.studentName}
              studentId={data.studentId}
              photoUrl={(data as any).photoUrl || (data as any).headshotUrl || (data as any).photo}
              size={56}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text style={styles.studentName}>{data.studentName}</Text>
              <Text style={styles.metaDetail}>Goal: <Text style={styles.metaValue}>{data.goalName}</Text></Text>
              <Text style={styles.metaDetail}>Station: <Text style={styles.metaValue}>{data.station}</Text></Text>
            </View>
          </View>

          <View style={styles.studentInfoRight}>
            <View style={styles.initMetaRow}>
              <View>
                <Text style={styles.metaLabel}>Date Initiated</Text>
                <Text style={styles.metaValueText}>{data.dateInitiated}</Text>
              </View>
              <View>
                <Text style={styles.metaLabel}>Initiated By</Text>
                <Text style={styles.metaValueText}>{data.initiatedBy}</Text>
                <Text style={styles.metaSubText}>({data.initiatedByRole})</Text>
              </View>
            </View>
            <View style={[styles.statusPill, isSubmitted && styles.pendingPill]}>
              <Text style={styles.statusPillText}>{currentStatus}</Text>
            </View>
          </View>
        </View>

        {/* 3 Columns Section */}
        <View style={styles.columnsRow}>
          {/* Primary Teacher (A) Card */}
          <View style={[styles.columnCard, styles.primaryTeacherCard]}>
            <View style={styles.primaryCardHeader}>
              <Text style={styles.primaryCardTitle}>{loggedInTeacherName} (Primary)</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.teacherNameRow}>
                <Feather name="user" size={16} color="#64748B" />
                <Text style={styles.teacherNameText}>{loggedInTeacherName}</Text>
              </View>

              <View style={styles.badge100}>
                <Text style={styles.badge100Text}>
                  {data.primaryTeacher.independenceRate || '100%'} Independence Achieved
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Criteria Met:</Text>
                <Text style={styles.detailValue}>{data.primaryTeacher.criteriaMet}</Text>
              </View>

              <Text style={styles.detailLine}><Text style={styles.boldLabel}>Date Achieved:</Text> {data.primaryTeacher.dateAchieved}</Text>
              <Text style={styles.detailLine}><Text style={styles.boldLabel}>Total Trials:</Text> {data.primaryTeacher.totalTrials}</Text>
              <Text style={styles.detailLine}><Text style={styles.boldLabel}>Independence:</Text> {data.primaryTeacher.independenceRate}</Text>

              <Text style={styles.notesLabel}>Notes</Text>
              <View style={styles.readOnlyNotes}>
                <Text style={styles.notesText}>{data.primaryTeacher.notes || 'No session notes recorded.'}</Text>
              </View>
            </View>
          </View>

          {/* Second Teacher Verification Card */}
          <View style={styles.columnCard}>
            <View style={styles.standardCardHeader}>
              <Text style={styles.standardCardTitle}>{data.teacherB.name} Verification</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.teacherNameRow}>
                <Feather name="user" size={16} color="#64748B" />
                <Text style={styles.teacherNameText}>{data.teacherB.name}</Text>
              </View>

              <Text style={styles.fieldLabel}>Outcome <Text style={styles.required}>*</Text></Text>
              <View style={styles.radioGroup}>
                {OUTCOME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    disabled={isSubmitted}
                    style={styles.radioOption}
                    onPress={() => {
                      setTouched(true);
                      setTeacherBOutcome(opt.id);
                      if (opt.id !== 'failed') setTeacherBPrompt('');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radioCircle, teacherBOutcome === opt.id && styles.radioCircleSelected]}>
                      {teacherBOutcome === opt.id && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text style={styles.radioLabel}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {teacherBOutcome === 'failed' && (
                <View style={styles.dropdownContainer}>
                  <Text style={styles.fieldLabel}>Prompt Used <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity
                    disabled={isSubmitted}
                    style={styles.selectBox}
                    onPress={() => setShowTeacherBPromptDropdown(!showTeacherBPromptDropdown)}
                  >
                    <Text style={[styles.selectText, !teacherBPrompt && styles.placeholderText]}>
                      {teacherBPrompt || 'Select prompt'}
                    </Text>
                    <Feather name="chevron-down" size={16} color="#64748B" />
                  </TouchableOpacity>

                  {showTeacherBPromptDropdown && !isSubmitted && (
                    <View style={styles.dropdownMenu}>
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => { setTeacherBPrompt(''); setShowTeacherBPromptDropdown(false); }}
                      >
                        <Text style={styles.dropdownItemTextPlaceholder}>Select prompt</Text>
                      </TouchableOpacity>
                      {PROMPT_OPTIONS.map((prompt) => (
                        <TouchableOpacity
                          key={prompt}
                          style={[styles.dropdownItem, teacherBPrompt === prompt && styles.dropdownItemSelected]}
                          onPress={() => {
                            setTeacherBPrompt(prompt);
                            setShowTeacherBPromptDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{prompt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={styles.textInput}
                multiline
                editable={!isSubmitted}
                value={teacherBNotes}
                onChangeText={(v) => { setTouched(true); setTeacherBNotes(v); }}
                placeholder="Enter verification notes..."
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.cardFooterDate}>Date: {data.teacherB.date}</Text>
            </View>
          </View>

          {/* Third Teacher Verification Card */}
          <View style={styles.columnCard}>
            <View style={styles.standardCardHeader}>
              <Text style={styles.standardCardTitle}>{data.teacherC.name} Verification</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.teacherNameRow}>
                <Feather name="user" size={16} color="#64748B" />
                <Text style={styles.teacherNameText}>{data.teacherC.name}</Text>
              </View>

              <Text style={styles.fieldLabel}>Outcome <Text style={styles.required}>*</Text></Text>
              <View style={styles.radioGroup}>
                {OUTCOME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    disabled={isSubmitted}
                    style={styles.radioOption}
                    onPress={() => {
                      setTouched(true);
                      setTeacherCOutcome(opt.id);
                      if (opt.id !== 'failed') setTeacherCPrompt('');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radioCircle, teacherCOutcome === opt.id && styles.radioCircleSelected]}>
                      {teacherCOutcome === opt.id && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text style={styles.radioLabel}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {teacherCOutcome === 'failed' && (
                <View style={styles.dropdownContainer}>
                  <Text style={styles.fieldLabel}>Prompt Used <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity
                    disabled={isSubmitted}
                    style={styles.selectBox}
                    onPress={() => setShowTeacherCPromptDropdown(!showTeacherCPromptDropdown)}
                  >
                    <Text style={[styles.selectText, !teacherCPrompt && styles.placeholderText]}>
                      {teacherCPrompt || 'Select prompt'}
                    </Text>
                    <Feather name="chevron-down" size={16} color="#64748B" />
                  </TouchableOpacity>

                  {showTeacherCPromptDropdown && !isSubmitted && (
                    <View style={styles.dropdownMenu}>
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => { setTeacherCPrompt(''); setShowTeacherCPromptDropdown(false); }}
                      >
                        <Text style={styles.dropdownItemTextPlaceholder}>Select prompt</Text>
                      </TouchableOpacity>
                      {PROMPT_OPTIONS.map((prompt) => (
                        <TouchableOpacity
                          key={prompt}
                          style={[styles.dropdownItem, teacherCPrompt === prompt && styles.dropdownItemSelected]}
                          onPress={() => {
                            setTeacherCPrompt(prompt);
                            setShowTeacherCPromptDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{prompt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={styles.textInput}
                multiline
                editable={!isSubmitted}
                value={teacherCNotes}
                onChangeText={(v) => { setTouched(true); setTeacherCNotes(v); }}
                placeholder="Enter verification notes..."
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.cardFooterDate}>Date: {data.teacherC.date}</Text>
            </View>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>{isSubmitted ? 'Close' : 'Cancel'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, canSubmit && styles.submitBtnActive, isSubmitted && styles.submitBtnDisabled]}
            disabled={!canSubmit}
            onPress={handleSubmit}
          >
            <Text style={[styles.submitBtnText, canSubmit && styles.submitBtnTextActive]}>
              {submitting ? 'Submitting…' : isSubmitted ? 'Submitted for Review' : 'Submit for Review'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  
  headerPickersRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerContainer: { position: 'relative', zIndex: 110 },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    maxWidth: 180,
  },
  pickerBtnText: { fontSize: 12, fontWeight: '600', color: '#1E293B', flexShrink: 1 },

  content: { padding: 24, gap: 20, maxWidth: 1200, alignSelf: 'center', width: '100%' },

  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  studentName: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  metaDetail: { fontSize: 13, color: '#64748B' },
  metaValue: { color: '#334155', fontWeight: '500' },

  studentInfoRight: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  initMetaRow: { flexDirection: 'row', gap: 24 },
  metaLabel: { fontSize: 11, color: '#64748B', marginBottom: 2 },
  metaValueText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  metaSubText: { fontSize: 11, color: '#64748B' },
  statusPill: { backgroundColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  pendingPill: { backgroundColor: '#FDE047' },
  statusPillText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },

  columnsRow: { flexDirection: 'row', gap: 16 },
  columnCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  primaryTeacherCard: { backgroundColor: '#FEFCE8', borderColor: '#FDE047' },
  primaryCardHeader: { backgroundColor: '#FACC15', paddingVertical: 12, alignItems: 'center' },
  primaryCardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  standardCardHeader: { backgroundColor: '#F1F5F9', paddingVertical: 12, alignItems: 'center' },
  standardCardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },

  cardBody: { padding: 16, gap: 12, flex: 1 },
  teacherNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  teacherNameText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },

  badge100: { backgroundColor: '#BFDBFE', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, alignSelf: 'flex-start' },
  badge100Text: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },

  detailSection: { marginTop: 4 },
  detailLabel: { fontSize: 12, fontWeight: '700', color: '#334155' },
  detailValue: { fontSize: 12, color: '#475569' },
  detailLine: { fontSize: 12, color: '#475569' },
  boldLabel: { fontWeight: '700', color: '#334155' },

  notesLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  readOnlyNotes: { minHeight: 80, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, padding: 8 },
  notesText: { fontSize: 12, color: '#334155' },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginTop: 4 },
  required: { color: '#EF4444' },

  radioGroup: { gap: 10 },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#64748B', alignItems: 'center', justifyContent: 'center' },
  radioCircleSelected: { borderColor: '#0284C7' },
  radioInnerDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0284C7' },
  radioLabel: { fontSize: 13, color: '#1E293B', fontWeight: '500' },

  dropdownContainer: { position: 'relative', zIndex: 10 },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  selectText: { fontSize: 13, color: '#0F172A' },
  placeholderText: { color: '#64748B' },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    marginTop: 4,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 5,
        }),
    zIndex: 200,
    minWidth: 160,
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12 },
  dropdownItemSelected: { backgroundColor: '#E0F2FE' },
  dropdownItemText: { fontSize: 13, color: '#0F172A' },
  dropdownItemTextSelected: { fontWeight: '700', color: '#0284C7' },
  dropdownItemTextPlaceholder: { fontSize: 13, color: '#64748B' },

  textInput: { minHeight: 70, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, padding: 8, fontSize: 13, textAlignVertical: 'top', backgroundColor: '#FFFFFF' },
  cardFooterDate: { fontSize: 12, color: '#64748B', marginTop: 'auto', paddingTop: 8 },

  footerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10, minWidth: 100, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  submitBtn: { backgroundColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center' },
  submitBtnActive: { backgroundColor: '#FACC15' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  submitBtnTextActive: { color: '#1E293B' },
});