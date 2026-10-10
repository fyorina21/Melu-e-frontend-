// src/screens/assessments/BehaviorAssessmentScreen.tsx
// SCR-TEA-003: Behavior Assessment (MASS / FAST / ABC)

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import {
  getBehaviorAssessment,
  saveBehaviorAssessment,
  getTeacherStudentProfile,
} from '../../api/teacherExtrasApi';
import type { SessionStackParamList } from '../../types';
import {
  BEHAVIOR_PRESETS,
  MASS_ITEMS,
  FAST_ITEMS,
  calculateMassTotals,
  calculateMassMaxFunction,
  calculateFastTotals,
  calculateFastMaxCategory,
  type AssessmentTab,
  type BehaviorRecord,
  type StudentProfile,
} from './behavior/behaviorTypes';
import {
  BehaviorAssessmentHeader,
  MassAssessmentTab,
  FastAssessmentTab,
  AbcTrackingTab,
  BehaviorSummaryCard,
  BehaviorActionsFooter,
} from './behavior/components';

type Props = NativeStackScreenProps<SessionStackParamList, 'BehaviorAssessment'>;

export default function BehaviorAssessmentScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { studentId } = route.params;
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [tab, setTab] = useState<AssessmentTab>('MASS');
  const [massAnswers, setMassAnswers] = useState<Record<string, string>>({});
  const [fastAnswers, setFastAnswers] = useState<Record<string, boolean>>({});
  const [records, setRecords] = useState<BehaviorRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BehaviorRecord>({
    id: '',
    behavior: BEHAVIOR_PRESETS[0],
    frequency: '',
    duration: '',
    intensity: 'Medium',
    trigger: '',
    consequence: '',
  });

  const load = useCallback(async () => {
    try {
      const { data: res } = await getTeacherStudentProfile(studentId);
      setProfile(res);
    } catch {
      setProfile(null);
    }
    try {
      const { data: saved } = await getBehaviorAssessment(studentId);
      const savedData = (saved?.data ?? {}) as {
        massAnswers?: Record<string, string>;
        fastAnswers?: Record<string, boolean>;
        records?: BehaviorRecord[];
      };
      setMassAnswers(savedData.massAnswers ?? {});
      setFastAnswers(savedData.fastAnswers ?? {});
      setRecords(savedData.records ?? []);
    } catch {
      setMassAnswers({});
      setFastAnswers({});
      setRecords([]);
    }
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const setMassAnswer = (id: string, value: string) =>
    setMassAnswers((prev) => ({ ...prev, [id]: value }));

  const setFastAnswer = (id: string, value: boolean) =>
    setFastAnswers((prev) => ({ ...prev, [id]: value }));

  const massAnswered = useMemo(
    () => MASS_ITEMS.filter((i) => massAnswers[i.id]).length,
    [massAnswers],
  );

  const fastAnswered = useMemo(
    () => FAST_ITEMS.filter((i) => fastAnswers[i.id] !== undefined).length,
    [fastAnswers],
  );

  const massFunctionTotals = useMemo(() => calculateMassTotals(massAnswers), [massAnswers]);

  const massMaxFunction = useMemo(
    () => calculateMassMaxFunction(massFunctionTotals),
    [massFunctionTotals],
  );

  const fastCategoryTotals = useMemo(() => calculateFastTotals(fastAnswers), [fastAnswers]);

  const fastMaxCategory = useMemo(
    () => calculateFastMaxCategory(fastCategoryTotals),
    [fastCategoryTotals],
  );

  const identifiedFunction = tab === 'MASS' ? massMaxFunction : fastMaxCategory;

  const saveRecord = () => {
    if (!draft.frequency.trim()) {
      Alert.alert('Frequency required');
      return;
    }
    if (editingId) {
      setRecords((prev) => prev.map((r) => (r.id === editingId ? { ...draft, id: editingId } : r)));
      setEditingId(null);
    } else {
      setRecords((prev) => [...prev, { ...draft, id: `local-${Date.now()}` }]);
    }
    setDraft({
      ...draft,
      id: '',
      frequency: '',
      duration: '',
      trigger: '',
      consequence: '',
    });
  };

  const startEdit = (record: BehaviorRecord) => {
    setEditingId(record.id);
    setDraft({ ...record });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({
      id: '',
      behavior: BEHAVIOR_PRESETS[0],
      frequency: '',
      duration: '',
      intensity: 'Medium',
      trigger: '',
      consequence: '',
    });
  };

  const removeRecord = (id: string) => setRecords((prev) => prev.filter((r) => r.id !== id));

  const persist = async (payload: Record<string, unknown>, message: string, goBack: boolean) => {
    try {
      await saveBehaviorAssessment(studentId, payload);
      await load().catch(() => {});
      Alert.alert('Assessment saved', message);
      if (goBack) {
        navigation?.navigate?.('AssessmentSummaryReport' as any, { studentId } as any);
      }
    } catch {
      Alert.alert('Error', 'Failed to save behavior assessment.');
    }
  };

  const handleSaveDraft = () =>
    persist(
      { tab, massAnswers, fastAnswers, records, status: 'draft' },
      'Behavior assessment draft saved (MASS + FAST + ABC).',
      false,
    );

  const handleSubmit = () => {
    if (massAnswered === 0 && fastAnswered === 0 && records.length === 0) {
      Alert.alert(
        'Nothing to submit',
        'Score at least one MASS or FAST question, or add an ABC incident before submitting.',
      );
      return;
    }
    Alert.alert(
      'Submit behavior assessment?',
      'This will send the completed assessment for Program Director review.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () =>
            persist(
              { tab, massAnswers, fastAnswers, records, status: 'submitted' },
              'Behavior assessment submitted for review.',
              true,
            ),
        },
      ],
    );
  };

  if (loading) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Assessments"
        onTabPress={(navTab) => handleTeacherTabPress(navigation, navTab)}
      />

      <BehaviorAssessmentHeader
        studentName={profile?.fullName || 'Student'}
        activeTab={tab}
        onTabChange={setTab}
        onBack={() => navigation?.goBack?.()}
      />

      <ScrollView contentContainerStyle={[styles.content, isTablet && styles.tabletContent]}>
        <View style={[styles.contentWrapper, isTablet && styles.tabletWrapper]}>
          {tab === 'MASS' && (
            <MassAssessmentTab
              massAnswers={massAnswers}
              functionTotals={massFunctionTotals}
              identifiedFunction={identifiedFunction}
              onSetAnswer={setMassAnswer}
            />
          )}

          {tab === 'FAST' && (
            <FastAssessmentTab
              fastAnswers={fastAnswers}
              categoryTotals={fastCategoryTotals}
              identifiedFunction={identifiedFunction}
              onSetAnswer={setFastAnswer}
            />
          )}

          {tab === 'ABC' && (
            <AbcTrackingTab
              records={records}
              draft={draft}
              editingId={editingId}
              onDraftChange={setDraft}
              onSaveRecord={saveRecord}
              onStartEdit={startEdit}
              onCancelEdit={cancelEdit}
              onRemoveRecord={removeRecord}
            />
          )}

          <BehaviorSummaryCard
            massAnswered={massAnswered}
            fastAnswered={fastAnswered}
            recordsCount={records.length}
            identifiedFunction={identifiedFunction}
          />

          <BehaviorActionsFooter onSaveDraft={handleSaveDraft} onSubmit={handleSubmit} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  tabletContent: {
    padding: spacing.xl,
  },
  contentWrapper: {
    width: '100%',
    gap: spacing.lg,
  },
  tabletWrapper: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
});
