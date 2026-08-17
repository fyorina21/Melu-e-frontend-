// screens/programdirector/GoalBankManagementScreen.js
// SCR-PD-006: Clinical Quality Monitoring (Goal Bank management)

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import ProgramDirectorNav from './components/ProgramDirectorNav';
import { PD_ROUTE_BY_TAB } from './components/pdNavRoutes';
import { getGoalBank, createGoal, updateGoal, deactivateGoal, deleteGoal } from '../../api/programDirectorApi';
import type { ProgramDirectorStackParamList } from '../../types';

const DOMAINS = ['Communication', 'Motor', 'Social', 'Self-Help', 'Cognition'];

interface GoalBankItem {
  id: string;
  name: string;
  domain: string;
  description: string;
  goalType: string;
  masteryCriteria: string;
  active?: boolean;
}

type GoalPayload = Omit<GoalBankItem, 'id' | 'active'>;

function GoalFormModal({ visible, goal, onClose, onSave }: {
  visible: boolean;
  goal: GoalBankItem | null | undefined;
  onClose: () => void;
  onSave: (payload: GoalPayload) => void;
}) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState('standard');
  const [masteryCriteria, setMasteryCriteria] = useState('');

  useEffect(() => {
    if (goal) {
      setName(goal.name); setDomain(goal.domain); setDescription(goal.description);
      setGoalType(goal.goalType); setMasteryCriteria(goal.masteryCriteria);
    } else {
      setName(''); setDomain(DOMAINS[0]); setDescription(''); setGoalType('standard'); setMasteryCriteria('');
    }
  }, [goal, visible]);

  const handleSave = () => {
    if (!name.trim() || !description.trim() || !masteryCriteria.trim()) {
      Alert.alert('Missing info', 'Name, description, and mastery criteria are required.');
      return;
    }
    onSave({ name, domain, description, goalType, masteryCriteria });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h2}>{goal ? 'Edit Goal' : 'New Goal'}</Text>
          <ScrollView contentContainerStyle={{ gap: spacing.md }}>
            <View style={styles.field}>
              <Text style={typography.label}>Goal Name</Text>
              <TextInput style={styles.textInput} value={name} onChangeText={setName} placeholder="e.g. Identify Colors" placeholderTextColor={colors.mutedText} />
            </View>
            <View style={styles.field}>
              <Text style={typography.label}>Domain</Text>
              <View style={styles.chipRow}>
                {DOMAINS.map((d) => (
                  <TouchableOpacity key={d} style={[styles.chip, domain === d && styles.chipSelected]} onPress={() => setDomain(d)}>
                    <Text style={[styles.chipText, domain === d && styles.chipTextSelected]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.field}>
              <Text style={typography.label}>Goal Type</Text>
              <View style={styles.chipRow}>
                {['standard', 'task_analysis'].map((t) => (
                  <TouchableOpacity key={t} style={[styles.chip, goalType === t && styles.chipSelected]} onPress={() => setGoalType(t)}>
                    <Text style={[styles.chipText, goalType === t && styles.chipTextSelected]}>{t === 'standard' ? 'Standard' : 'Task Analysis'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.field}>
              <Text style={typography.label}>Description</Text>
              <TextInput style={[styles.textInput, styles.textArea]} multiline value={description} onChangeText={setDescription} placeholderTextColor={colors.mutedText} />
            </View>
            <View style={styles.field}>
              <Text style={typography.label}>Mastery Criteria</Text>
              <TextInput style={styles.textInput} value={masteryCriteria} onChangeText={setMasteryCriteria} placeholder="e.g. 80% independent across 3 sessions" placeholderTextColor={colors.mutedText} />
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{goal ? 'Save Changes' : 'Create Goal'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function GoalBankManagementScreen({ navigation }: NativeStackScreenProps<ProgramDirectorStackParamList, 'GoalBankManagement'>) {
  const [goals, setGoals] = useState<GoalBankItem[]>([]);
  const [domainFilter, setDomainFilter] = useState('All');
  const [formTarget, setFormTarget] = useState<GoalBankItem | null | undefined>(undefined); // undefined = closed, null = new, object = editing

  const load = useCallback(async () => {
    try {
      const { data } = await getGoalBank({});
      setGoals(data);
    } catch (err) {
      setGoals(DEMO_GOALS);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = goals.filter((g) => domainFilter === 'All' || g.domain === domainFilter);

  const handleSave = async (payload: GoalPayload) => {
    try {
      if (formTarget && formTarget.id) {
        await updateGoal(formTarget.id, payload);
        setGoals((prev) => prev.map((g) => (g.id === formTarget.id ? { ...g, ...payload } : g)));
      } else {
        const { data } = await createGoal(payload);
        setGoals((prev) => [...prev, data]);
      }
    } catch (err) {
      // Demo/offline fallback
      if (formTarget && formTarget.id) {
        setGoals((prev) => prev.map((g) => (g.id === formTarget.id ? { ...g, ...payload } : g)));
      } else {
        setGoals((prev) => [...prev, { id: `local-${Date.now()}`, active: true, ...payload }]);
      }
    }
    setFormTarget(undefined);
  };

  const handleDeactivate = async (goal: GoalBankItem) => {
    try { await deactivateGoal(goal.id); } catch (err) {}
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, active: false } : g)));
  };

  const handleDelete = (goal: GoalBankItem) => {
    Alert.alert('Delete this goal permanently?', 'Only allowed if not assigned to any active IUP.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteGoal(goal.id); } catch (err) {}
          setGoals((prev) => prev.filter((g) => g.id !== goal.id));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ProgramDirectorNav activeTab="Goal Bank" onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t])} />

      <View style={styles.header}>
        <Text style={typography.h1}>Goal Bank Management</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setFormTarget(null)}>
          <Feather name="plus" size={16} color={colors.navyText} />
          <Text style={styles.newBtnText}>New Goal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['All', ...DOMAINS].map((d) => (
            <TouchableOpacity key={d} style={[styles.filterChip, domainFilter === d && styles.filterChipActive]} onPress={() => setDomainFilter(d)}>
              <Text style={typography.body}>{d}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.map((g) => (
          <View key={g.id} style={[styles.goalCard, !g.active && styles.goalCardInactive]}>
            <View style={styles.goalCardHeader}>
              <Text style={typography.bodyBold}>{g.name}</Text>
              <Text style={typography.caption}>{g.domain} · {g.goalType === 'task_analysis' ? 'Task Analysis' : 'Standard'}</Text>
            </View>
            <Text style={typography.body}>{g.description}</Text>
            <Text style={typography.caption}>Mastery: {g.masteryCriteria}</Text>
            <View style={styles.goalActionsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setFormTarget(g)}>
                <Text style={styles.actionBtnText}>Edit</Text>
              </TouchableOpacity>
              {g.active !== false && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeactivate(g)}>
                  <Text style={styles.actionBtnText}>Deactivate</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(g)}>
                <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <GoalFormModal visible={formTarget !== undefined} goal={formTarget} onClose={() => setFormTarget(undefined)} onSave={handleSave} />
    </SafeAreaView>
  );
}

const DEMO_GOALS: GoalBankItem[] = [
  { id: 'g1', name: 'Identify Colors', domain: 'Cognition', description: 'Student identifies 6 target colors upon request.', goalType: 'standard', masteryCriteria: '80% independent across 3 sessions', active: true },
  { id: 'g2', name: 'Request Items', domain: 'Communication', description: 'Student requests preferred items using words/PECS.', goalType: 'standard', masteryCriteria: '90% independent across 3 sessions', active: true },
  { id: 'g3', name: 'Handwashing Sequence', domain: 'Self-Help', description: '8-step handwashing task analysis.', goalType: 'task_analysis', masteryCriteria: '100% steps independent across 3 sessions', active: true },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  newBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  newBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  filterRow: { padding: spacing.md, backgroundColor: colors.bgCard },
  filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs },
  filterChipActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  content: { padding: spacing.lg, gap: spacing.md },
  goalCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  goalCardInactive: { opacity: 0.5 },
  goalCardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  goalActionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, maxHeight: '90%' },
  field: { gap: spacing.xs },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  chipTextSelected: { color: colors.navyText },
  modalFooter: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  saveBtn: { flex: 2, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
