// screens/programdirector/StudentCaseloadScreen.js
// SCR-PD-005: Caseload Management

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getStudentOptions, type StudentOption } from '../../api/optionsApi';
import type { ProgramDirectorStackParamList } from '../../types';

interface Goal {
  id: string;
  name: string;
  domain: string;
  description: string;
}

type GoalStatus = 'Active' | 'In Progress' | 'Mastered';
type GoalWithStatus = Goal & { status: GoalStatus; progress: number };

type SlotKey = 'station1-0' | 'station1-1' | 'station2-0' | 'station2-1';
type StudentGoals = Record<SlotKey, GoalWithStatus | null>;

const domainFilterMap: Record<string, string[]> = {
  Communication: ['Receptive Language', 'Expressive Language'],
  Motor: ['Motor Skills'],
  Social: ['Social Skills'],
  'Self-Help': ['Adaptive'],
  Cognition: ['Cognitive'],
  Play: ['Play Skills'],
  Academic: ['Academic'],
};

const allDomains = ['All', 'Communication', 'Motor', 'Social', 'Self-Help', 'Cognition', 'Play', 'Academic'];

const statusOptions: GoalStatus[] = ['Active', 'In Progress', 'Mastered'];

const statusBadgeColors: Record<GoalStatus, { bg: string; text: string }> = {
  Active: { bg: '#D1FAE5', text: '#059669' },
  'In Progress': { bg: '#FEF3C7', text: '#B45309' },
  Mastered: { bg: '#E0F2FE', text: '#0284C7' },
};

const MOCK_GOALS: Goal[] = [
  { id: 'g1', name: 'Identify Colors', domain: 'Cognitive', description: 'Student will identify primary colors when presented with visual stimuli.' },
  { id: 'g2', name: 'Follow One-Step Instructions', domain: 'Receptive Language', description: 'Student will follow simple one-step verbal directions.' },
  { id: 'g3', name: 'Request Breaks Appropriately', domain: 'Expressive Language', description: 'Student will request breaks using an appropriate communication modality.' },
  { id: 'g4', name: 'Imitate Gross Motor Movements', domain: 'Motor Skills', description: 'Student will imitate modeled gross motor actions with increasing accuracy.' },
  { id: 'g5', name: 'Turn-Taking with Peers', domain: 'Social Skills', description: 'Student will engage in reciprocal play activities taking turns with peers.' },
  { id: 'g6', name: 'Hand Washing Routine', domain: 'Adaptive', description: 'Student will complete hand washing sequence independently.' },
];

const MOCK_PROGRESS: Record<string, number> = {
  g1: 72, g2: 55, g3: 88, g4: 40, g5: 60, g6: 90,
};

const MOCK_STATUS: Record<string, GoalStatus> = {
  g1: 'Active', g2: 'In Progress', g3: 'Mastered', g4: 'In Progress',
  g5: 'Active', g6: 'Mastered',
};

function goalToWithStatus(g: Goal): GoalWithStatus {
  return { ...g, status: MOCK_STATUS[g.id] ?? 'Active', progress: MOCK_PROGRESS[g.id] ?? 50 };
}

const defaultStudentGoals: StudentGoals = {
  'station1-0': goalToWithStatus(MOCK_GOALS[0]),
  'station1-1': goalToWithStatus(MOCK_GOALS[1]),
  'station2-0': goalToWithStatus(MOCK_GOALS[2]),
  'station2-1': goalToWithStatus(MOCK_GOALS[3]),
};

const slotLabels: Record<SlotKey, string> = {
  'station1-0': 'Station 1 — Slot 1',
  'station1-1': 'Station 1 — Slot 2',
  'station2-0': 'Station 2 — Slot 1',
  'station2-1': 'Station 2 — Slot 2',
};

export default function StudentCaseloadScreen({ navigation }: NativeStackScreenProps<ProgramDirectorStackParamList, 'StudentCaseload'>) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('s1');
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [studentGoals, setStudentGoals] = useState<StudentGoals>(defaultStudentGoals);
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);
  const [slotPickerGoal, setSlotPickerGoal] = useState<Goal | null>(null);
  const [newGoalModal, setNewGoalModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalDomain, setNewGoalDomain] = useState('Cognitive');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [goalBank, setGoalBank] = useState<Goal[]>(MOCK_GOALS);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    getStudentOptions()
      .then(({ data: opts }) => {
        setStudentOptions(opts);
        if (opts.length > 0 && !opts.some((o) => o.id === selectedStudentId)) {
          setSelectedStudentId(opts[0].id);
          setSelectedStudentName(opts[0].name);
        }
      })
      .catch(() => {});
  }, []);

  const filteredGoals = goalBank.filter((g) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      g.name.toLowerCase().includes(term) || g.description.toLowerCase().includes(term);
    const matchDomain =
      domainFilter === 'All' ? true : (domainFilterMap[domainFilter] ?? []).includes(g.domain);
    return matchSearch && matchDomain;
  });

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    const opt = studentOptions.find((o) => o.id === id);
    if (opt?.name) setSelectedStudentName(opt.name);
  };

  const handleRemove = (slot: SlotKey) => {
    const goal = studentGoals[slot];
    if (!goal) return;
    Alert.alert('Remove Goal', `Remove "${goal.name}" from this slot?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setStudentGoals((prev) => ({ ...prev, [slot]: null })) },
    ]);
  };

  const handleAssign = (goal: Goal) => {
    setSlotPickerGoal(goal);
    setSlotPickerOpen(true);
  };

  const handleSlotPick = (slot: SlotKey) => {
    if (!slotPickerGoal) return;
    const current = studentGoals[slot];
    if (current) {
      Alert.alert('Replace Goal', `Replace "${current.name}" with "${slotPickerGoal.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          onPress: () => {
            setStudentGoals((prev) => ({ ...prev, [slot]: goalToWithStatus(slotPickerGoal) }));
            setSlotPickerOpen(false);
            setSlotPickerGoal(null);
          },
        },
      ]);
      return;
    }
    setStudentGoals((prev) => ({ ...prev, [slot]: goalToWithStatus(slotPickerGoal) }));
    setSlotPickerOpen(false);
    setSlotPickerGoal(null);
  };

  const handleAddGoal = () => {
    if (!newGoalName.trim()) return;
    const id = `custom-${Date.now()}`;
    setGoalBank((prev) => [...prev, { id, name: newGoalName, domain: newGoalDomain, description: newGoalDescription }]);
    setNewGoalName('');
    setNewGoalDomain('Cognitive');
    setNewGoalDescription('');
    setNewGoalModal(false);
  };

  const handleSave = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const renderGoalSlot = (slot: SlotKey) => {
    const g = studentGoals[slot];
    if (!g) {
      return (
        <View key={slot} style={styles.emptySlot}>
          <Text style={styles.emptySlotText}>{slotLabels[slot]} — Empty</Text>
        </View>
      );
    }
    const badge = statusBadgeColors[g.status];
    return (
      <View key={slot} style={styles.goalSlot}>
        <View style={styles.goalSlotHeader}>
          <View style={{ flex: 1 }}>
            <Text style={typography.bodyBold} numberOfLines={1}>{g.name}</Text>
            <Text style={typography.caption}>{g.domain}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{g.status}</Text>
          </View>
        </View>
        <View style={styles.progressBlock}>
          <View style={styles.progressLabelsRow}>
            <Text style={typography.caption}>Progress</Text>
            <Text style={typography.caption}>{g.progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${g.progress}%` }]} />
          </View>
        </View>
        <View style={styles.slotActionsRow}>
          <TouchableOpacity style={[styles.slotActionBtn, styles.removeBtn]} onPress={() => handleRemove(slot)}>
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.slotActionBtn, styles.chartBtn]}
            onPress={() => navigation?.navigate?.('GraphChartView')}
          >
            <Feather name="bar-chart-2" size={12} color="#38BDF8" />
            <Text style={styles.chartBtnText}>View Progress</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Caseload" onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t])} />

      <View style={styles.header}>
        <Feather name="users" size={18} color="#38BDF8" />
        <Text style={[typography.h1, { flexShrink: 1 }]}>Caseload Management{selectedStudentName ? ` — ${selectedStudentName}` : ''}</Text>
        <Text style={styles.screenCode}>SCR-PD-005</Text>
      </View>

      {/* Student selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
        {(studentOptions.length > 0
          ? studentOptions.map((o) => ({ id: o.id, name: o.name }))
          : [{ id: 's1', name: 'Student A' }]
        ).map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.studentChip, selectedStudentId === s.id && styles.studentChipActive]}
            onPress={() => handleSelectStudent(s.id)}
          >
            <Text style={[styles.studentChipText, selectedStudentId === s.id && styles.studentChipTextActive]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Two-panel body */}
      <View style={styles.body}>
        {/* Left panel — assigned slots */}
        <View style={[styles.leftPanel, styles.panel]}>
          <Text style={typography.label}>Assigned Goals & Stations</Text>
          <ScrollView contentContainerStyle={styles.leftContent}>
            {[1, 2].map((stationNum) => (
              <View key={stationNum} style={styles.stationBlock}>
                <View style={styles.stationHeader}>
                  <View style={[styles.stationBadge, stationNum === 1 ? styles.stationBadgeBlue : styles.stationBadgeYellow]}>
                    <Text style={stationNum === 1 ? styles.stationBadgeTextWhite : styles.stationBadgeTextDark}>{stationNum}</Text>
                  </View>
                  <Text style={typography.label}>Station {stationNum}</Text>
                </View>
                <View style={styles.stationSlots}>
                  {renderGoalSlot(`station${stationNum}-0` as SlotKey)}
                  {renderGoalSlot(`station${stationNum}-1` as SlotKey)}
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            {savedFeedback ? (
              <>
                <Feather name="check-circle" size={16} color="#059669" />
                <Text style={styles.saveBtnText}>Saved!</Text>
              </>
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Right panel — goal bank */}
        <View style={[styles.rightPanel, styles.panel]}>
          <View style={styles.goalBankHeader}>
            <Text style={typography.h3}>Goal Bank</Text>
            <TouchableOpacity style={styles.addGoalBtn} onPress={() => setNewGoalModal(true)}>
              <Feather name="plus" size={14} color={colors.navyText} />
              <Text style={styles.addGoalBtnText}>Add New Goal to Bank</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBlock}>
            <View style={styles.searchWrap}>
              <Feather name="search" size={16} color={colors.mutedText} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search goals..."
                placeholderTextColor={colors.mutedText}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.domainChipsRow}>
              {allDomains.map((d) => (
                <TouchableOpacity key={d} style={[styles.filterChip, domainFilter === d && styles.filterChipActive]} onPress={() => setDomainFilter(d)}>
                  <Text style={[styles.filterChipText, domainFilter === d && styles.filterChipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.goalList}>
            {filteredGoals.length === 0 ? (
              <Text style={styles.noResults}>No goals match your search.</Text>
            ) : (
              filteredGoals.map((goal) => (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalCardBody}>
                    <View style={styles.goalCardTitleRow}>
                      <Text style={typography.bodyBold}>{goal.name}</Text>
                      <View style={styles.domainBadge}>
                        <Text style={styles.domainBadgeText}>{goal.domain}</Text>
                      </View>
                    </View>
                    <Text style={typography.caption} numberOfLines={2}>{goal.description}</Text>
                  </View>
                  <TouchableOpacity style={styles.assignBtn} onPress={() => handleAssign(goal)}>
                    <Text style={styles.assignBtnText}>Assign</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      {/* Slot picker modal */}
      <Modal visible={slotPickerOpen && slotPickerGoal !== null} transparent animationType="fade" onRequestClose={() => setSlotPickerOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.modalSheet, styles.modalNarrow]}>
            <View style={styles.modalHeader}>
              <Text style={typography.h3}>Assign Goal to Slot</Text>
              <TouchableOpacity onPress={() => setSlotPickerOpen(false)}>
                <Feather name="x" size={18} color={colors.mutedText} />
              </TouchableOpacity>
            </View>
            <Text style={typography.body}>
              Assigning: <Text style={typography.bodyBold}>{slotPickerGoal?.name}</Text>
            </Text>
            <View style={styles.slotGrid}>
              {(Object.keys(slotLabels) as SlotKey[]).map((slot) => {
                const occupied = studentGoals[slot] !== null;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotPickBtn, occupied ? styles.slotPickOccupied : styles.slotPickEmpty]}
                    onPress={() => handleSlotPick(slot)}
                  >
                    <Text style={styles.slotPickLabel}>{slotLabels[slot]}</Text>
                    <Text style={styles.slotPickSub}>{occupied ? 'Replace existing' : 'Empty'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* New goal modal */}
      <Modal visible={newGoalModal} transparent animationType="fade" onRequestClose={() => setNewGoalModal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.modalSheet, styles.modalWide]}>
            <View style={styles.modalHeader}>
              <Text style={typography.h3}>Add New Goal to Bank</Text>
              <TouchableOpacity onPress={() => setNewGoalModal(false)}>
                <Feather name="x" size={18} color={colors.mutedText} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.formFields}>
              <View style={styles.field}>
                <Text style={typography.label}>Goal Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newGoalName}
                  onChangeText={setNewGoalName}
                  placeholder="e.g. Identify Body Parts"
                  placeholderTextColor={colors.mutedText}
                />
              </View>
              <View style={styles.field}>
                <Text style={typography.label}>Domain</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {['Cognitive', 'Receptive Language', 'Expressive Language', 'Social Skills', 'Motor Skills', 'Adaptive', 'Play Skills', 'Academic'].map((d) => (
                    <TouchableOpacity key={d} style={[styles.filterChip, newGoalDomain === d && styles.filterChipActive]} onPress={() => setNewGoalDomain(d)}>
                      <Text style={[styles.filterChipText, newGoalDomain === d && styles.filterChipTextActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.field}>
                <Text style={typography.label}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  multiline
                  value={newGoalDescription}
                  onChangeText={setNewGoalDescription}
                  placeholder="Describe the goal and success criteria..."
                  placeholderTextColor={colors.mutedText}
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setNewGoalModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveGoalBtn, !newGoalName.trim() && styles.btnDisabled]}
                onPress={handleAddGoal}
                disabled={!newGoalName.trim()}
              >
                <Text style={styles.saveGoalBtnText}>Add Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  screenCode: { marginLeft: 'auto', fontSize: 11, color: colors.mutedText, fontFamily: 'monospace' },

  selectorRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.bgCard },
  studentChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
  },
  studentChipActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  studentChipText: { ...typography.bodyBold, color: colors.bodyText },
  studentChipTextActive: { color: colors.navyText },

  body: { flex: 1, flexDirection: 'row' },
  panel: { minWidth: 0 },
  leftPanel: { width: '33%', borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.bgCard },
  rightPanel: { flex: 1 },

  leftContent: { padding: spacing.md, gap: spacing.lg },
  stationBlock: { gap: spacing.sm },
  stationHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stationBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stationBadgeBlue: { backgroundColor: '#38BDF8' },
  stationBadgeYellow: { backgroundColor: colors.promptPP },
  stationBadgeTextWhite: { fontSize: 12, fontWeight: '700', color: colors.white },
  stationBadgeTextDark: { fontSize: 12, fontWeight: '700', color: colors.navyText },
  stationSlots: { gap: spacing.sm },

  emptySlot: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  emptySlotText: { ...typography.caption, textAlign: 'center' },

  goalSlot: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  goalSlotHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  statusBadgeText: { fontSize: 10, fontWeight: '600' },
  progressBlock: { gap: spacing.xs },
  progressLabelsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTrack: { height: 6, borderRadius: radius.pill, backgroundColor: colors.statusNotStartedBg, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: '#38BDF8' },
  slotActionsRow: { flexDirection: 'row', gap: spacing.xs },
  slotActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  removeBtn: { borderColor: '#FECACA' },
  removeBtnText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  chartBtn: { borderColor: '#BAE6FD' },
  chartBtnText: { fontSize: 12, fontWeight: '600', color: '#38BDF8' },

  saveBtn: {
    margin: spacing.md,
    marginTop: 0,
    paddingVertical: spacing.md,
    backgroundColor: colors.promptPP,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: colors.navyText },

  goalBankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.promptPP,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addGoalBtnText: { fontSize: 12, fontWeight: '700', color: colors.navyText },

  searchBlock: { backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, padding: spacing.md, gap: spacing.sm },
  searchWrap: { position: 'relative', justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: spacing.md },
  searchInput: {
    paddingLeft: 36,
    paddingRight: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.navyText,
    fontSize: 14,
  },
  domainChipsRow: { flexDirection: 'row', gap: spacing.xs },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgCard,
  },
  filterChipActive: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  filterChipTextActive: { color: colors.white },

  goalList: { padding: spacing.md, gap: spacing.sm },
  noResults: { ...typography.body, textAlign: 'center', marginTop: 40 },
  goalCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  goalCardBody: { flex: 1, gap: spacing.xs },
  goalCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  domainBadge: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  domainBadgeText: { fontSize: 10, fontWeight: '600', color: '#0369A1' },
  assignBtn: {
    backgroundColor: colors.navyText,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  assignBtnText: { fontSize: 12, fontWeight: '700', color: colors.white },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignSelf: 'center',
    width: '100%',
    maxHeight: '85%',
  },
  modalNarrow: { maxWidth: 400 },
  modalWide: { maxWidth: 500 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  slotPickBtn: { flexGrow: 1, flexBasis: '45%', borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, gap: 2 },
  slotPickOccupied: { borderColor: '#FED7AA', backgroundColor: '#FFF7ED' },
  slotPickEmpty: { borderColor: colors.border, backgroundColor: colors.bgApp },
  slotPickLabel: { fontSize: 13, fontWeight: '600', color: colors.navyText },
  slotPickSub: { fontSize: 12, color: colors.mutedText },

  formFields: { gap: spacing.md, paddingBottom: spacing.sm },
  field: { gap: spacing.xs },
  chipRow: { flexDirection: 'row', gap: spacing.xs },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.navyText,
    fontSize: 14,
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '600', color: colors.bodyText },
  saveGoalBtn: {
    flex: 1,
    backgroundColor: colors.promptPP,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  saveGoalBtnText: { fontWeight: '700', color: colors.navyText },
});
