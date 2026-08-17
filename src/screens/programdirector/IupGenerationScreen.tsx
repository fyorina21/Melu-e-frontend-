// screens/programdirector/IupGenerationScreen.js
// SCR-PD-003: IUP Generation & Management

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import ProgramDirectorNav from './components/ProgramDirectorNav';
import { PD_ROUTE_BY_TAB } from './components/pdNavRoutes';
import CoordinatorNav from '../coordinator/components/CoordinatorNav';
import { useAuth, ROLES } from '../../context/AuthContext';
import { getIupCandidates, getIupContext, saveIupDraft, finalizeIup, getGoalBank } from '../../api/programDirectorApi';
import type { ProgramDirectorStackParamList, CoordinatorStackParamList } from '../../types';

interface GoalBankItem {
  id: string;
  name: string;
  domain: string;
  description: string;
  goalType: string;
  masteryCriteria: string;
}

interface IupCandidate {
  id: string;
  name: string;
  status: string;
}

function IupPreviewModal({ visible, student, context, slots, onClose, onExport }: {
  visible: boolean;
  student: IupCandidate | null;
  context: IupContext | null;
  slots: Slots;
  onClose: () => void;
  onExport: () => void;
}) {
  if (!student || !context) return null;
  const allSlots = [...slots.station1, ...slots.station2];
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <View style={styles.previewHeader}>
            <View style={{ flex: 1 }}>
              <Text style={typography.h2}>IUP Preview — {context.studentName}</Text>
              <Text style={typography.caption}>Individualized Behavior Intervention Plan (printable format)</Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close preview">
              <Feather name="x" size={20} color={colors.navyText} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 400 }}>
            <Text style={[typography.h3, styles.previewSection]}>Student Information</Text>
            <Text style={typography.body}>Age {context.age} · DOB {context.dob}</Text>
            <Text style={typography.body}>{context.program} · Enrolled {context.enrollmentDate}</Text>

            <Text style={[typography.h3, styles.previewSection]}>Assessment Summary</Text>
            <Text style={typography.bodyBold}>Skills strengths:</Text>
            <Text style={typography.body}>{context.skillsStrengths}</Text>
            <Text style={typography.bodyBold}>Behavior functions:</Text>
            <Text style={typography.body}>{context.behaviorFunctions}</Text>
            <Text style={typography.bodyBold}>Reinforcement strategies (top 5):</Text>
            <Text style={typography.body}>{context.topReinforcers.join(', ')}</Text>
            <Text style={typography.bodyBold}>Sensory engagement:</Text>
            <Text style={typography.body}>{context.sensorySummary}</Text>

            <Text style={[typography.h3, styles.previewSection]}>Goal Assignment</Text>
            <Text style={typography.label}>Station 1 (Basic Skills)</Text>
            {slots.station1.map((g, i) => g ? <Text key={i} style={typography.body}>{i + 1}. {g.name} ({g.domain}) — {g.masteryCriteria}</Text> : null)}
            <Text style={[typography.label, { marginTop: spacing.sm }]}>Station 2 (Advanced Skills)</Text>
            {slots.station2.map((g, i) => g ? <Text key={i} style={typography.body}>{i + 1}. {g.name} ({g.domain}) — {g.masteryCriteria}</Text> : null)}
            <Text style={[typography.caption, { marginTop: spacing.md }]}>
              {allSlots.filter(Boolean).length} of 4 goal slots assigned · Status: {student.status}
            </Text>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.footerBtn} onPress={onClose}>
              <Text style={styles.footerBtnText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn} onPress={onExport}>
              <Feather name="share-2" size={14} color={colors.navyText} />
              <Text style={styles.exportBtnText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface IupContext {
  studentName: string;
  age: number;
  dob: string;
  program: string;
  enrollmentDate: string;
  skillsStrengths: string;
  behaviorFunctions: string;
  topReinforcers: string[];
  sensorySummary: string;
}

type StationKey = 'station1' | 'station2';
type Slots = Record<StationKey, (GoalBankItem | null)[]>;

function GoalSlot({ stationLabel, slotIndex, goal, onAdd, onRemove }: {
  stationLabel: string;
  slotIndex: number;
  goal: GoalBankItem | null;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.slot}>
      <Text style={typography.label}>{stationLabel} · Slot {slotIndex + 1}</Text>
      {goal ? (
        <View style={styles.filledSlot}>
          <View style={{ flex: 1 }}>
            <Text style={typography.bodyBold}>{goal.name}</Text>
            <Text style={typography.caption}>{goal.domain} · {goal.goalType === 'task_analysis' ? 'Task Analysis' : 'Standard'}</Text>
            <Text style={typography.caption}>{goal.masteryCriteria}</Text>
          </View>
          <TouchableOpacity onPress={onRemove}>
            <Feather name="trash-2" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.emptySlot} onPress={onAdd}>
          <Feather name="plus" size={16} color={colors.mutedText} />
          <Text style={typography.body}>Add Goal</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function GoalSelectorModal({ visible, goals, onClose, onSelect }: {
  visible: boolean;
  goals: GoalBankItem[];
  onClose: () => void;
  onSelect: (goal: GoalBankItem) => void;
}) {
  const [domainFilter, setDomainFilter] = useState('All');
  const domains = ['All', 'Communication', 'Motor', 'Social', 'Self-Help', 'Cognition'];
  const filtered = goals.filter((g) => domainFilter === 'All' || g.domain === domainFilter);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h3}>Select a Goal</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {domains.map((d) => (
                <TouchableOpacity key={d} style={[styles.chip, domainFilter === d && styles.chipSelected]} onPress={() => setDomainFilter(d)}>
                  <Text style={[styles.chipText, domainFilter === d && styles.chipTextSelected]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <ScrollView style={{ maxHeight: 320 }}>
            {filtered.map((g) => (
              <TouchableOpacity key={g.id} style={styles.goalCard} onPress={() => onSelect(g)}>
                <Text style={typography.bodyBold}>{g.name}</Text>
                <Text style={typography.caption}>{g.domain}</Text>
                <Text style={typography.body} numberOfLines={2}>{g.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function IupGenerationScreen({ navigation, route }: NativeStackScreenProps<ProgramDirectorStackParamList | CoordinatorStackParamList, 'IupGeneration'>) {
  const { session } = useAuth();
  const isCoordinator = session?.role === ROLES.COORDINATOR;
  const [candidates, setCandidates] = useState<IupCandidate[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [context, setContext] = useState<IupContext | null>(null);
  const [goalBank, setGoalBank] = useState<GoalBankItem[]>([]);
  const [slots, setSlots] = useState<Slots>({ station1: [null, null], station2: [null, null] });
  const [selectorTarget, setSelectorTarget] = useState<{ station: StationKey; slotIndex: number } | null>(null); // { station, slotIndex }
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportContent, setExportContent] = useState<string | null>(null);

  const load = useCallback(async () => {
    let loadedCandidates: IupCandidate[] = [];
    try {
      const { data } = await getIupCandidates();
      loadedCandidates = data;
    } catch (err) {
      loadedCandidates = DEMO_CANDIDATES;
    }
    setCandidates(loadedCandidates);
    try {
      const { data } = await getGoalBank({});
      setGoalBank(data);
    } catch (err) {
      setGoalBank(DEMO_GOAL_BANK);
    }
    const pre = route.params?.studentId;
    if (pre) {
      setSelectedStudentId(pre);
    } else if (loadedCandidates.length > 0) {
      setSelectedStudentId((prev) => prev ?? loadedCandidates[0].id);
    }
  }, [route.params?.studentId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selectedStudentId) return;
    getIupContext(selectedStudentId).then(({ data }) => setContext(data)).catch(() => setContext(DEMO_CONTEXT));
  }, [selectedStudentId]);

  const handleSelectGoal = (goal: GoalBankItem) => {
    if (!selectorTarget) return;
    const { station, slotIndex } = selectorTarget;
    setSlots((prev) => {
      const next: Slots = { ...prev };
      next[station] = [...prev[station]];
      next[station][slotIndex] = goal;
      return next;
    });
    setSelectorTarget(null);
  };

  const handleRemoveGoal = (station: StationKey, slotIndex: number) => {
    Alert.alert('Remove this goal from the IUP?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setSlots((prev) => {
          const next: Slots = { ...prev };
          next[station] = [...prev[station]];
          next[station][slotIndex] = null;
          return next;
        }),
      },
    ]);
  };

  const handleDraftSave = async () => {
    if (!selectedStudentId) return;
    try {
      await saveIupDraft(selectedStudentId, { slots });
    } catch (err) {}
    setCandidates((prev) => prev.map((c) => (c.id === selectedStudentId ? { ...c, status: 'IUP Draft' } : c)));
    Alert.alert('Draft saved', 'The IUP draft has been saved and appears in the IUP Library.');
  };

  const handlePreview = () => setPreviewOpen(true);

  const buildExportText = () => {
    if (!context) return '';
    const allSlots = [...slots.station1, ...slots.station2];
    const lines = [
      `Melu'e Foundation — Individualized Behavior Intervention Plan (IUP)`,
      `Student: ${context.studentName}`,
      `Age: ${context.age} · DOB: ${context.dob} · Program: ${context.program} · Enrolled: ${context.enrollmentDate}`,
      `Status: ${selectedCandidate?.status ?? 'Draft'}`,
      '',
      'ASSESSMENT SUMMARY',
      `Skills strengths: ${context.skillsStrengths}`,
      `Behavior functions: ${context.behaviorFunctions}`,
      `Reinforcement strategies (top 5): ${context.topReinforcers.join(', ')}`,
      `Sensory engagement: ${context.sensorySummary}`,
      '',
      'GOAL ASSIGNMENT',
      'Station 1 (Basic Skills):',
      ...slots.station1.map((g, i) => g ? `  ${i + 1}. ${g.name} (${g.domain}) — ${g.masteryCriteria}` : `  ${i + 1}. —`),
      'Station 2 (Advanced Skills):',
      ...slots.station2.map((g, i) => g ? `  ${i + 1}. ${g.name} (${g.domain}) — ${g.masteryCriteria}` : `  ${i + 1}. —`),
      '',
      `Total goals: ${allSlots.filter(Boolean).length} of 4`,
      '',
      `Generated ${new Date().toLocaleDateString()}`,
    ];
    return lines.join('\n');
  };

  const handleExport = () => setExportContent(buildExportText());

  const selectedCandidate = candidates.find((c) => c.id === selectedStudentId) ?? null;

  const handleFinalize = async () => {
    if (!selectedStudentId) return;
    const hasAnyGoal = [...slots.station1, ...slots.station2].some(Boolean);
    if (!hasAnyGoal) {
      Alert.alert('At least one goal required', 'Assign at least one goal before finalizing.');
      return;
    }
    Alert.alert(
      `Finalize this IUP for ${context?.studentName}?`,
      'This will move the student to Active Therapy status.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalize',
          onPress: async () => {
            try {
              await finalizeIup(selectedStudentId, { slots });
            } catch (err) {}
            setCandidates((prev) => prev.map((c) => (c.id === selectedStudentId ? { ...c, status: 'Active Therapy' } : c)));
            Alert.alert('IUP Finalized', 'Student moved to Active Therapy. Goals are now visible in the Teacher session screen.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {isCoordinator ? (
        <CoordinatorNav activeTab="Schedule" onTabPress={(t) => t !== 'Schedule' && navigation?.navigate?.(coordinatorRouteForTab(t) as never)} />
      ) : (
        <ProgramDirectorNav activeTab="IUP" onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t] as never)} />
      )}

      <View style={styles.header}>
        <Text style={typography.h1}>IUP Generation & Management</Text>
      </View>

      <View style={styles.selectorRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {candidates.map((c) => (
            <TouchableOpacity key={c.id} style={[styles.studentChip, selectedStudentId === c.id && styles.studentChipActive]} onPress={() => setSelectedStudentId(c.id)}>
              <Text style={[typography.bodyBold, selectedStudentId === c.id && { color: colors.navyText }]}>{c.name}</Text>
              <Text style={typography.caption}>{c.status}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {!context ? (
        <View style={styles.emptyState}>
          <Text style={typography.body}>Select a student above to start their IUP.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={typography.h3}>{context.studentName}</Text>
            <Text style={typography.caption}>Age {context.age} · DOB {context.dob} · {context.program} · Enrolled {context.enrollmentDate}</Text>
          </View>

          <View style={styles.card}>
            <Text style={typography.h3}>Assessment Summary (Context)</Text>
            <Text style={typography.bodyBold}>Skills strengths:</Text>
            <Text style={typography.body}>{context.skillsStrengths}</Text>
            <Text style={typography.bodyBold}>Behavior functions:</Text>
            <Text style={typography.body}>{context.behaviorFunctions}</Text>
            <Text style={typography.bodyBold}>Top 5 reinforcers:</Text>
            <Text style={typography.body}>{context.topReinforcers.join(', ')}</Text>
            <Text style={typography.bodyBold}>Sensory engagement:</Text>
            <Text style={typography.body}>{context.sensorySummary}</Text>
          </View>

          <View style={styles.card}>
            <Text style={typography.h3}>Goal Assignment</Text>
            <Text style={typography.caption}>Station 1 (Basic Skills)</Text>
            {slots.station1.map((goal, i) => (
              <GoalSlot
                key={`s1-${i}`}
                stationLabel="Station 1"
                slotIndex={i}
                goal={goal}
                onAdd={() => setSelectorTarget({ station: 'station1', slotIndex: i })}
                onRemove={() => handleRemoveGoal('station1', i)}
              />
            ))}
            <Text style={[typography.caption, { marginTop: spacing.md }]}>Station 2 (Advanced Skills)</Text>
            {slots.station2.map((goal, i) => (
              <GoalSlot
                key={`s2-${i}`}
                stationLabel="Station 2"
                slotIndex={i}
                goal={goal}
                onAdd={() => setSelectorTarget({ station: 'station2', slotIndex: i })}
                onRemove={() => handleRemoveGoal('station2', i)}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {context && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerBtn} onPress={handleDraftSave}>
            <Text style={styles.footerBtnText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerBtn} onPress={handlePreview}>
            <Text style={styles.footerBtnText}>Preview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerBtn} onPress={handleExport}>
            <Text style={styles.footerBtnText}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.finalizeBtn} onPress={handleFinalize}>
            <Text style={styles.finalizeBtnText}>Finalize IUP</Text>
          </TouchableOpacity>
        </View>
      )}

      <GoalSelectorModal
        visible={!!selectorTarget}
        goals={goalBank}
        onClose={() => setSelectorTarget(null)}
        onSelect={handleSelectGoal}
      />

      <IupPreviewModal
        visible={previewOpen}
        student={selectedCandidate}
        context={context}
        slots={slots}
        onClose={() => setPreviewOpen(false)}
        onExport={handleExport}
      />

      <ExportPreviewModal
        visible={!!exportContent}
        title="IUP Export"
        filename={`${context?.studentName?.replace(/\s+/g, '_') ?? 'Student'}_IUP_${new Date().toISOString().slice(0, 10)}.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

const DEMO_CANDIDATES: IupCandidate[] = [
  { id: 'student-c', name: 'Student C', status: 'Ready for IUP' },
  { id: 'student-d', name: 'Student D', status: 'IUP Draft' },
];

function coordinatorRouteForTab(tab: string): keyof CoordinatorStackParamList {
  return ({
    Dashboard: 'CoordinatorDashboard',
    'Live Sessions': 'LiveSessionMonitoring',
    Review: 'SessionSummaryReview',
    Progress: 'CoordinatorStudentProgress',
    Schedule: 'CoordinatorSchedule',
    Parents: 'CoordinatorParentCommunication',
    Enrollment: 'StudentEnrollment',
    Workload: 'WorkloadDashboard',
    Rooms: 'RoomResourceScheduling',
    Notifications: 'Notifications',
  } as Record<string, keyof CoordinatorStackParamList>)[tab];
}
const DEMO_CONTEXT: IupContext = {
  studentName: 'Student C',
  age: 5,
  dob: '2021-03-14',
  program: 'Pooled-Out',
  enrollmentDate: '2025-09-01',
  skillsStrengths: 'Receptive language, gross motor, imitation.',
  behaviorFunctions: 'Escape/avoidance during transitions (primary), attention-seeking (secondary).',
  topReinforcers: ['Bubbles', 'Tablet time', 'Music', 'Blocks', 'Swing'],
  sensorySummary: 'Enjoyed swinging and deep pressure; refused loud noises and textured play.',
};
const DEMO_GOAL_BANK: GoalBankItem[] = [
  { id: 'g1', name: 'Identify Colors', domain: 'Cognition', description: 'Student identifies 6 target colors upon request.', goalType: 'standard', masteryCriteria: '80% independent across 3 sessions' },
  { id: 'g2', name: 'Request Items', domain: 'Communication', description: 'Student requests preferred items using words/PECS.', goalType: 'standard', masteryCriteria: '90% independent across 3 sessions' },
  { id: 'g3', name: 'Handwashing Sequence', domain: 'Self-Help', description: '8-step handwashing task analysis.', goalType: 'task_analysis', masteryCriteria: '100% steps independent across 3 sessions' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  selectorRow: { padding: spacing.md, backgroundColor: colors.bgCard },
  studentChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.bgApp, marginRight: spacing.sm },
  studentChipActive: { backgroundColor: colors.primaryYellow },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  slot: { marginTop: spacing.sm, gap: spacing.xs },
  emptySlot: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, justifyContent: 'center' },
  filledSlot: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bgApp, borderRadius: radius.md, padding: spacing.md },
  footer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.border },
  footerBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  footerBtnText: { fontWeight: '600', color: colors.navyText, fontSize: 12 },
  finalizeBtn: { flex: 2, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  finalizeBtnText: { fontWeight: '700', color: colors.navyText },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, maxHeight: '85%' },
  modalFooter: { flexDirection: 'row', gap: spacing.sm },
  previewHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  previewSection: { marginTop: spacing.md },
  exportBtn: { flex: 2, flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md },
  exportBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  chipRow: { flexDirection: 'row', gap: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  chipTextSelected: { color: colors.navyText },
  goalCard: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  cancelBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
});
