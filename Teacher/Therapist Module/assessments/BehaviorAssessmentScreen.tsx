// screens/assessments/BehaviorAssessmentScreen.tsx
// SCR-TEA-003 / SCR-013: Behavior Assessment - three assessment types in
// one screen (tabbed):
//   - MASS (Motivation Assessment Scale): Likert-rated questions grouped by
//     hypothesized function (Sensory, Escape, Attention, Tangible), with
//     automatic function scoring.
//   - FAST (Functional Analysis Screening Tool): Yes/No questions grouped by
//     reinforcement mechanism, with automatic scoring.
//   - ABC Tracking Log: antecedent-behavior-consequence incident records.
// Plus an Assessment Summary (identified functions + recommendations),
// Save Draft, and Submit Assessment.

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import TopNav from '../../components/TopNav';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { saveBehaviorAssessment } from '../../api/teacherExtrasApi';
import type { SessionStackParamList } from '../../types';

type AssessmentTab = 'MASS' | 'FAST' | 'ABC';
const TABS: AssessmentTab[] = ['MASS', 'FAST', 'ABC'];

const LIKERT_OPTIONS = ['Never', 'Almost Never', 'Seldom', 'Half the Time', 'Usually', 'Almost Always', 'Always'];
const LIKERT_SCORE: Record<string, number> = {
  Never: 0,
  'Almost Never': 1,
  Seldom: 2,
  'Half the Time': 3,
  Usually: 4,
  'Almost Always': 5,
  Always: 6,
};

interface MassItem {
  id: string;
  text: string;
  function: 'Sensory' | 'Escape' | 'Attention' | 'Tangible';
}

const MASS_ITEMS: MassItem[] = [
  { id: 'M1', text: 'Would the behavior occur continuously if left alone for long periods of time?', function: 'Sensory' },
  { id: 'M2', text: 'Does the behavior occur when the person is asked to do a difficult task?', function: 'Escape' },
  { id: 'M3', text: 'Does the behavior seem to occur when the person is ignored?', function: 'Attention' },
  { id: 'M4', text: 'Does the behavior occur when a preferred item is taken away?', function: 'Tangible' },
  { id: 'M5', text: 'Does the behavior occur when the person is left alone, with no one around?', function: 'Sensory' },
  { id: 'M6', text: 'Does the behavior occur following a request to perform an undesirable task?', function: 'Escape' },
  { id: 'M7', text: 'Does the behavior occur when attention is diverted from the person?', function: 'Attention' },
  { id: 'M8', text: 'Does the behavior occur when the person is denied access to a desired item or activity?', function: 'Tangible' },
  { id: 'M9', text: 'Does the behavior occur during a task that the person does not enjoy?', function: 'Escape' },
  { id: 'M10', text: 'Does the behavior seem to be enjoyable to the person (self-stimulatory)?', function: 'Sensory' },
  { id: 'M11', text: 'Does the behavior occur to get a reaction from others?', function: 'Attention' },
  { id: 'M12', text: 'Does the behavior occur to obtain food, toys, or a specific activity?', function: 'Tangible' },
];

interface FastItem {
  id: string;
  text: string;
  category: 'Social - Positive' | 'Social - Negative' | 'Automatic - Positive' | 'Automatic - Negative';
}

const FAST_ITEMS: FastItem[] = [
  { id: 'F1', text: 'Does the behavior occur when others are present, and does attention follow?', category: 'Social - Positive' },
  { id: 'F2', text: 'Does the behavior occur to avoid or escape a task, demand, or request?', category: 'Social - Negative' },
  { id: 'F3', text: 'Does the behavior produce a rewarding sensory effect without others?', category: 'Automatic - Positive' },
  { id: 'F4', text: 'Does the behavior remove an unpleasant sensation or reduce pain?', category: 'Automatic - Negative' },
  { id: 'F5', text: 'Does the behavior typically happen when the person is alone or unoccupied?', category: 'Automatic - Positive' },
  { id: 'F6', text: 'Does the behavior occur during transitions or when demands increase?', category: 'Social - Negative' },
  { id: 'F7', text: 'Does an adult typically react by giving attention or talking to the person?', category: 'Social - Positive' },
  { id: 'F8', text: 'Is the behavior reduced when a preferred item or activity is provided freely?', category: 'Social - Positive' },
];

interface BehaviorRecord {
  id: string;
  behavior: string;
  frequency: string;
  duration: string;
  intensity: 'Low' | 'Medium' | 'High';
  trigger: string;
  consequence: string;
}

const BEHAVIOR_PRESETS = ['Aggression', 'Self-injury', 'Tantrum', 'Elopement', 'Non-compliance', 'Property destruction', 'Repetitive behaviors'];
const INTENSITIES = ['Low', 'Medium', 'High'] as const;

type Props = NativeStackScreenProps<SessionStackParamList, 'BehaviorAssessment'>;

export default function BehaviorAssessmentScreen({ navigation, route }: Props) {
  const { logout } = useAuth();
  const { studentId } = route.params;
  const [tab, setTab] = useState<AssessmentTab>('MASS');
  const [massAnswers, setMassAnswers] = useState<Record<string, string>>({});
  const [fastAnswers, setFastAnswers] = useState<Record<string, boolean>>({});
  const [records, setRecords] = useState<BehaviorRecord[]>(DEMO_RECORDS);
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

  const setMassAnswer = (id: string, value: string) => setMassAnswers((prev) => ({ ...prev, [id]: value }));
  const setFastAnswer = (id: string, value: boolean) => setFastAnswers((prev) => ({ ...prev, [id]: value }));

  const massAnswered = MASS_ITEMS.filter((i) => massAnswers[i.id]).length;
  const fastAnswered = FAST_ITEMS.filter((i) => fastAnswers[i.id] !== undefined).length;

  const massFunctionTotals = (() => {
    const totals: Record<string, number> = { Sensory: 0, Escape: 0, Attention: 0, Tangible: 0 };
    MASS_ITEMS.forEach((i) => {
      if (massAnswers[i.id]) totals[i.function] += LIKERT_SCORE[massAnswers[i.id]] || 0;
    });
    return totals;
  })();

  const massMaxFunction = (Object.keys(massFunctionTotals) as Array<keyof typeof massFunctionTotals>).reduce(
    (max, k) => (massFunctionTotals[k] > massFunctionTotals[max] ? k : max),
    'Sensory' as keyof typeof massFunctionTotals
  );

  const fastCategoryTotals = (() => {
    const totals: Record<string, number> = { 'Social - Positive': 0, 'Social - Negative': 0, 'Automatic - Positive': 0, 'Automatic - Negative': 0 };
    FAST_ITEMS.forEach((i) => {
      if (fastAnswers[i.id]) totals[i.category] += 1;
    });
    return totals;
  })();

  const fastMaxCategory = (Object.keys(fastCategoryTotals) as Array<keyof typeof fastCategoryTotals>).reduce(
    (max, k) => (fastCategoryTotals[k] > fastCategoryTotals[max] ? k : max),
    'Social - Positive' as keyof typeof fastCategoryTotals
  );

  const identifiedFunction = tab === 'MASS' ? massMaxFunction : fastMaxCategory;

  const saveRecord = () => {
    if (!draft.frequency.trim()) { Alert.alert('Frequency required'); return; }
    if (editingId) {
      setRecords((prev) => prev.map((r) => (r.id === editingId ? { ...draft, id: editingId } : r)));
      setEditingId(null);
    } else {
      setRecords((prev) => [...prev, { ...draft, id: `local-${Date.now()}` }]);
    }
    setDraft({ ...draft, id: '', frequency: '', duration: '', trigger: '', consequence: '' });
  };

  const startEdit = (record: BehaviorRecord) => {
    setEditingId(record.id);
    setDraft({ ...record });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ id: '', behavior: BEHAVIOR_PRESETS[0], frequency: '', duration: '', intensity: 'Medium', trigger: '', consequence: '' });
  };

  const removeRecord = (id: string) => setRecords((prev) => prev.filter((r) => r.id !== id));

  const persist = async (payload: Record<string, unknown>, message: string, goBack: boolean) => {
    try {
      await saveBehaviorAssessment(studentId, payload);
    } catch (err) {}
    Alert.alert('Assessment saved', message, goBack ? [{ text: 'Done', onPress: () => navigation?.goBack?.() }] : undefined);
  };

  const handleSaveDraft = () =>
    persist({ tab, massAnswers, fastAnswers, records, status: 'draft' }, 'Behavior assessment draft saved (MASS + FAST + ABC).', false);

  const handleSubmit = () => {
    if (massAnswered === 0 && fastAnswered === 0 && records.length === 0) {
      Alert.alert('Nothing to submit', 'Score at least one MASS or FAST question, or add an ABC incident before submitting.');
      return;
    }
    Alert.alert('Submit behavior assessment?', 'This will send the completed assessment for Program Director review.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', onPress: () => persist({ tab, massAnswers, fastAnswers, records, status: 'submitted' }, 'Behavior assessment submitted for review.', true) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopNav activeTab="Assessments" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} onLogout={logout} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="alert-triangle" size={18} color={colors.navyText} />
          <View>
            <Text style={typography.h1}>Behavior Assessment</Text>
            <Text style={typography.caption}>SCR-TEA-003 — MASS / FAST / ABC · Student A</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'ABC' ? 'ABC Tracking' : t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'MASS' && (
          <View style={styles.card}>
            <Text style={typography.h3}>MASS — Motivation Assessment Scale</Text>
            <Text style={typography.caption}>Rate each statement: how often the behavior occurs in that situation.</Text>
            {MASS_ITEMS.map((item) => (
              <View key={item.id} style={styles.itemBlock}>
                <Text style={typography.body}><Text style={typography.bodyBold}>{item.id}.</Text> {item.text}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.likertRow}>
                    {LIKERT_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.likertBtn, massAnswers[item.id] === opt && styles.likertBtnActive]}
                        onPress={() => setMassAnswer(item.id, opt)}
                      >
                        <Text style={[styles.likertText, massAnswers[item.id] === opt && styles.likertTextActive]}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ))}
            <View style={styles.functionBox}>
              <Text style={typography.label}>Function Totals</Text>
              {Object.entries(massFunctionTotals).map(([fn, total]) => (
                <View key={fn} style={styles.functionRow}>
                  <Text style={[typography.body, fn === identifiedFunction && { fontWeight: '700', color: colors.navyText }]}>{fn}</Text>
                  <Text style={typography.bodyBold}>{total}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 'FAST' && (
          <View style={styles.card}>
            <Text style={typography.h3}>FAST — Functional Analysis Screening Tool</Text>
            <Text style={typography.caption}>Answer Yes or No for each statement.</Text>
            {FAST_ITEMS.map((item) => (
              <View key={item.id} style={styles.itemBlock}>
                <Text style={typography.body}><Text style={typography.bodyBold}>{item.id}.</Text> {item.text}</Text>
                <View style={styles.yesNoRow}>
                  {[true, false].map((value) => (
                    <TouchableOpacity
                      key={String(value)}
                      style={[styles.yesNoBtn, fastAnswers[item.id] === value && styles.yesNoBtnActive]}
                      onPress={() => setFastAnswer(item.id, value)}
                    >
                      <Text style={[styles.yesNoText, fastAnswers[item.id] === value && styles.yesNoTextActive]}>{value ? 'Yes' : 'No'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
            <View style={styles.functionBox}>
              <Text style={typography.label}>Category Scores (Yes counts)</Text>
              {Object.entries(fastCategoryTotals).map(([cat, total]) => (
                <View key={cat} style={styles.functionRow}>
                  <Text style={[typography.body, cat === identifiedFunction && { fontWeight: '700', color: colors.navyText }]}>{cat}</Text>
                  <Text style={typography.bodyBold}>{total}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 'ABC' && (
          <>
            <View style={styles.card}>
              <Text style={typography.h3}>{editingId ? 'Edit Behavior Record (ABC)' : 'Add Behavior Record (ABC)'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {BEHAVIOR_PRESETS.map((b) => (
                  <TouchableOpacity key={b} style={[styles.chip, draft.behavior === b && styles.chipSelected]} onPress={() => setDraft({ ...draft, behavior: b })}>
                    <Text style={[styles.chipText, draft.behavior === b && styles.chipTextSelected]}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.field}><Text style={typography.label}>Frequency</Text><TextInput style={styles.textInput} placeholder="e.g. 3 times" placeholderTextColor={colors.mutedText} value={draft.frequency} onChangeText={(t) => setDraft({ ...draft, frequency: t })} /></View>
              <View style={styles.field}><Text style={typography.label}>Duration</Text><TextInput style={styles.textInput} placeholder="e.g. 5 minutes" placeholderTextColor={colors.mutedText} value={draft.duration} onChangeText={(t) => setDraft({ ...draft, duration: t })} /></View>
              <View style={styles.field}>
                <Text style={typography.label}>Intensity</Text>
                <View style={styles.ratingRow}>
                  {INTENSITIES.map((i) => (
                    <TouchableOpacity key={i} style={[styles.ratingBtn, draft.intensity === i && styles.ratingBtnActive]} onPress={() => setDraft({ ...draft, intensity: i })}>
                      <Text style={[styles.ratingText, draft.intensity === i && styles.ratingTextActive]}>{i}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.field}><Text style={typography.label}>Trigger (Antecedent)</Text><TextInput style={styles.textInput} placeholder="What happened before?" placeholderTextColor={colors.mutedText} value={draft.trigger} onChangeText={(t) => setDraft({ ...draft, trigger: t })} /></View>
              <View style={styles.field}><Text style={typography.label}>Consequence</Text><TextInput style={styles.textInput} placeholder="What happened after?" placeholderTextColor={colors.mutedText} value={draft.consequence} onChangeText={(t) => setDraft({ ...draft, consequence: t })} /></View>
              <View style={styles.addRow}>
                <TouchableOpacity style={styles.addBtn} onPress={saveRecord}>
                  <Feather name={editingId ? 'check' : 'plus'} size={14} color={colors.navyText} />
                  <Text style={styles.addBtnText}>{editingId ? 'Update Record' : 'Add Record'}</Text>
                </TouchableOpacity>
                {editingId && (
                  <TouchableOpacity style={[styles.addBtn, styles.cancelBtn]} onPress={cancelEdit}>
                    <Feather name="x" size={14} color={colors.navyText} />
                    <Text style={styles.addBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={typography.h3}>Records · {records.length}</Text>
            {records.map((r) => (
              <View key={r.id} style={styles.card}>
                <View style={styles.recordHeader}>
                  <Text style={typography.bodyBold}>{r.behavior}</Text>
                  <View style={styles.recordActions}>
                    <TouchableOpacity onPress={() => startEdit(r)}><Feather name="edit-2" size={14} color={colors.navyText} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => removeRecord(r.id)}><Feather name="trash-2" size={14} color="#EF4444" /></TouchableOpacity>
                  </View>
                </View>
                <Text style={typography.caption}>{r.frequency} · {r.duration} · {r.intensity} intensity</Text>
                {r.trigger ? <Text style={typography.body}>Trigger: {r.trigger}</Text> : null}
                {r.consequence ? <Text style={typography.body}>Consequence: {r.consequence}</Text> : null}
              </View>
            ))}
          </>
        )}

        <View style={styles.card}>
          <Text style={typography.h3}>Assessment Summary</Text>
          <Text style={typography.body}>MASS: {massAnswered}/{MASS_ITEMS.length} answered · FAST: {fastAnswered}/{FAST_ITEMS.length} answered · ABC: {records.length} incidents</Text>
          {(massAnswered > 0 || fastAnswered > 0) && (
            <View style={styles.summaryBox}>
              <Text style={typography.bodyBold}>Identified function: {identifiedFunction}</Text>
              <Text style={typography.caption}>
                Recommendation: prioritize antecedent manipulations and reinforcement strategies that address the {identifiedFunction} function, and continue ABC tracking to confirm patterns.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={handleSaveDraft}>
            <Feather name="save" size={16} color={colors.navyText} />
            <Text style={styles.actionBtnText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={handleSubmit}>
            <Feather name="check-circle" size={16} color={colors.navyText} />
            <Text style={styles.actionBtnText}>Submit Assessment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DEMO_RECORDS: BehaviorRecord[] = [
  { id: 'b1', behavior: 'Tantrum', frequency: '3 times', duration: '5 minutes', intensity: 'High', trigger: 'Asked to clean toys', consequence: 'Calmed after verbal prompting' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tabsRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.bgCard },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.bgApp, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.bodyText },
  tabTextActive: { color: colors.navyText, fontWeight: '700' },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  itemBlock: { gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  likertRow: { flexDirection: 'row', gap: spacing.sm },
  likertBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  likertBtnActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  likertText: { fontSize: 11, fontWeight: '600', color: colors.bodyText },
  likertTextActive: { color: colors.navyText },
  yesNoRow: { flexDirection: 'row', gap: spacing.sm },
  yesNoBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  yesNoBtnActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  yesNoText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  yesNoTextActive: { color: colors.navyText },
  functionBox: { backgroundColor: colors.bgApp, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  functionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryBox: { backgroundColor: colors.statusPendingBg, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.xs, backgroundColor: colors.bgApp },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  chipTextSelected: { color: colors.navyText },
  field: { gap: spacing.xs },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText, backgroundColor: colors.bgApp },
  ratingRow: { flexDirection: 'row', gap: spacing.sm },
  ratingBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  ratingBtnActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  ratingText: { fontSize: 12, color: colors.bodyText },
  ratingTextActive: { color: colors.navyText, fontWeight: '700' },
  addBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md },
  addRow: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { backgroundColor: colors.bgApp, borderWidth: 1, borderColor: colors.border, flex: 1 },
  addBtnText: { fontWeight: '700', color: colors.navyText },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recordActions: { flexDirection: 'row', gap: spacing.lg },
  btnRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, paddingVertical: spacing.md },
  actionBtnPrimary: { backgroundColor: colors.primaryYellow },
  actionBtnSecondary: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  actionBtnText: { fontWeight: '700', color: colors.navyText },
});
