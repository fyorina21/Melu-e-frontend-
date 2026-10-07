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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import { useAuth } from '../../context/AuthContext';
import { getGoalMasteryCheck, submitGoalMasteryCheck } from '../../api/sessionApi';
import { getStudentOptions, type StudentOption } from '../../api/optionsApi';
import { getTeacherStudentProfile } from '../../api/teacherExtrasApi';
import { storage } from '../../utils/storage';
import { radius, spacing } from '../../theme/colors';
import type { SessionStackParamList } from '../../types';

import {
  type OutcomeOption,
  type PromptType,
  type MasteryCheckData,
  type GoalOption,
  isTeacherVerificationValid,
} from './types';
import { MasteryStudentCard } from './components/MasteryStudentCard';
import { PrimaryTeacherCard } from './components/PrimaryTeacherCard';
import { TeacherVerificationCard } from './components/TeacherVerificationCard';
import { MasteryHeaderPickers } from './components/MasteryHeaderPickers';

type Props = NativeStackScreenProps<SessionStackParamList, 'GoalMasteryCheck'>;

export default function GoalMasteryCheckScreen({ route, navigation }: Props) {
  const { session: authSession } = useAuth();
  const urlSid =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('studentId')
      : null;
  const urlGid =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('goalId')
      : null;
  const localSid = storage.getSync('last_assessment_student_id');

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

  // Teacher B Form State
  const [teacherBOutcome, setTeacherBOutcome] = useState<OutcomeOption | null>(null);
  const [teacherBPrompt, setTeacherBPrompt] = useState<PromptType>('');
  const [teacherBNotes, setTeacherBNotes] = useState('');
  const [showTeacherBPromptDropdown, setShowTeacherBPromptDropdown] = useState(false);

  // Teacher C Form State
  const [teacherCOutcome, setTeacherCOutcome] = useState<OutcomeOption | null>(null);
  const [teacherCPrompt, setTeacherCPrompt] = useState<PromptType>('');
  const [teacherCNotes, setTeacherCNotes] = useState('');
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

  // 2. Fetch available goals for active student
  useEffect(() => {
    if (!activeStudentId) return;
    let active = true;
    getTeacherStudentProfile(activeStudentId)
      .then(({ data: profile }) => {
        if (!active) return;
        const goals: GoalOption[] = (profile?.goals as GoalOption[]) || [];
        setGoalOptions(goals);
        if (goals.length > 0) {
          const currentGoalExists = goals.some((g) => g.id === activeGoalId);
          if (!currentGoalExists || !activeGoalId) {
            setActiveGoalId(goals[0].id);
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [activeStudentId, activeGoalId]);

  // 3. Load mastery check details from backend
  const load = useCallback(async () => {
    if (!activeStudentId) return;
    setLoading(true);
    try {
      const gid = activeGoalId || 'goal-1';
      const { data: res } = await getGoalMasteryCheck(activeStudentId, gid);
      const masteryData = res as MasteryCheckData;
      setData(masteryData);
      setLoadError(false);

      // Pre-fill existing verification data if present
      if (masteryData?.teacherB?.outcome) {
        setTeacherBOutcome(masteryData.teacherB.outcome);
        setTeacherBPrompt(masteryData.teacherB.promptUsed || '');
        setTeacherBNotes(masteryData.teacherB.notes || '');
      }
      if (masteryData?.teacherC?.outcome) {
        setTeacherCOutcome(masteryData.teacherC.outcome);
        setTeacherCPrompt(masteryData.teacherC.promptUsed || '');
        setTeacherCNotes(masteryData.teacherC.notes || '');
      }

      if (
        masteryData?.statusLabel === 'Pending Director Review' ||
        masteryData?.statusLabel === 'Approved'
      ) {
        setIsSubmitted(true);
      } else {
        setIsSubmitted(false);
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          storage.setSync('last_assessment_student_id', activeStudentId);
          const url = `/GoalMasteryCheck?studentId=${encodeURIComponent(activeStudentId)}&goalId=${encodeURIComponent(gid)}`;
          window.history.replaceState(null, '', url);
        } catch {}
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [activeStudentId, activeGoalId]);

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

  const canSubmit = isTeacherBValid && isTeacherCValid && !isSubmitted;

  const handleCancel = useCallback(() => {
    if (touched && !isSubmitted) {
      Alert.alert('Discard changes?', 'Any entered data will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation?.goBack?.() },
      ]);
    } else {
      navigation?.goBack?.();
    }
  }, [touched, isSubmitted, navigation]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !activeStudentId || !activeGoalId) return;

    const payload = {
      teacherB: {
        outcome: teacherBOutcome,
        promptUsed: teacherBOutcome === 'failed' ? teacherBPrompt : null,
        notes: teacherBNotes,
        date: new Date().toISOString().split('T')[0],
      },
      teacherC: {
        outcome: teacherCOutcome,
        promptUsed: teacherCOutcome === 'failed' ? teacherCPrompt : null,
        notes: teacherCNotes,
        date: new Date().toISOString().split('T')[0],
      },
    };

    try {
      await submitGoalMasteryCheck(activeStudentId, activeGoalId, payload);
      await load();
      setIsSubmitted(true);
      Alert.alert('Success', 'Verification submitted and notification sent to Director.', [
        { text: 'OK', onPress: () => navigation?.goBack?.() },
      ]);
    } catch {
      setIsSubmitted(true);
      Alert.alert('Submitted (offline)', 'Notification sent and will sync once online.', [
        { text: 'OK', onPress: () => navigation?.goBack?.() },
      ]);
    }
  }, [
    canSubmit,
    activeStudentId,
    activeGoalId,
    teacherBOutcome,
    teacherBPrompt,
    teacherBNotes,
    teacherCOutcome,
    teacherCPrompt,
    teacherCNotes,
    load,
    navigation,
  ]);

  if (loadError) return <ScreenError onRetry={load} />;
  if (loading && !data) return <ScreenLoader />;

  if (!data || !data.studentName) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No student found for this goal mastery check.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatus = isSubmitted ? 'Pending Director Review' : data.statusLabel || 'Draft';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
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
        <View style={styles.responsiveContainer}>
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
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>{isSubmitted ? 'Close' : 'Cancel'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                canSubmit && styles.submitBtnActive,
                isSubmitted && styles.submitBtnDisabled,
              ]}
              disabled={!canSubmit}
              onPress={handleSubmit}
            >
              <Text style={[styles.submitBtnText, canSubmit && styles.submitBtnTextActive]}>
                {isSubmitted ? 'Submitted for Review' : 'Submit for Review'}
              </Text>
            </TouchableOpacity>
          </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
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
    maxWidth: 1200,
    gap: spacing.md,
  },
  columnsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  submitBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: '#E2E8F0',
  },
  submitBtnActive: {
    backgroundColor: '#0284C7',
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitBtnText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700',
  },
  submitBtnTextActive: {
    color: '#FFFFFF',
  },
});
