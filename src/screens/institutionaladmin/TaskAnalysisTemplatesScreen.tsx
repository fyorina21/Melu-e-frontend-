import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getTaskAnalysisTemplates, saveTaskAnalysisTemplate, deleteTaskAnalysisTemplate } from '../../api/institutionalAdminApi';
import type { InstitutionalAdminStackParamList } from '../../types';

interface TaskAnalysisStep {
  id: string;
  description: string;
}

interface TaskAnalysisTemplate {
  id: string;
  name: string;
  description: string;
  steps: TaskAnalysisStep[];
  active?: boolean;
}

type TemplatePayload = {
  id?: string;
  name: string;
  description: string;
  steps: TaskAnalysisStep[];
};

function TemplateEditorModal({ visible, template, onClose, onSave }: {
  visible: boolean;
  template: TaskAnalysisTemplate | null | undefined;
  onClose: () => void;
  onSave: (payload: TemplatePayload) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<TaskAnalysisStep[]>([]);

  useEffect(() => {
    if (template) { setName(template.name); setDescription(template.description); setSteps(template.steps); }
    else { setName(''); setDescription(''); setSteps([]); }
  }, [template, visible]);

  const addStep = () => setSteps((prev) => [...prev, { id: `s-${Date.now()}`, description: '' }]);
  const updateStep = (id: string, description: string) => setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, description } : s)));
  const deleteStep = (id: string) => setSteps((prev) => prev.filter((s) => s.id !== id));
  const moveStep = (index: number, dir: number) => {
    setSteps((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Template name required'); return; }
    if (steps.length === 0) { Alert.alert('At least one step required'); return; }
    onSave({ id: template?.id, name, description, steps });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h2}>{template ? 'Edit Template' : 'New Template'}</Text>
          <ScrollView contentContainerStyle={{ gap: spacing.md }}>
            <View style={styles.field}>
              <Text style={typography.label}>Template Name</Text>
              <TextInput style={styles.textInput} value={name} onChangeText={setName} placeholder="e.g. Handwashing Sequence" placeholderTextColor={colors.mutedText} />
            </View>
            <View style={styles.field}>
              <Text style={typography.label}>Description</Text>
              <TextInput style={[styles.textInput, styles.textArea]} multiline value={description} onChangeText={setDescription} placeholderTextColor={colors.mutedText} />
            </View>
            <View style={styles.field}>
              <View style={styles.stepsHeaderRow}>
                <Text style={typography.label}>Steps</Text>
                <TouchableOpacity onPress={addStep}><Feather name="plus" size={16} color={colors.navyText} /></TouchableOpacity>
              </View>
              {steps.map((s, i) => (
                <View key={s.id} style={styles.stepRow}>
                  <View>
                    <TouchableOpacity onPress={() => moveStep(i, -1)} disabled={i === 0}><Feather name="chevron-up" size={14} color={i === 0 ? colors.mutedText : colors.navyText} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => moveStep(i, 1)} disabled={i === steps.length - 1}><Feather name="chevron-down" size={14} color={i === steps.length - 1 ? colors.mutedText : colors.navyText} /></TouchableOpacity>
                  </View>
                  <Text style={typography.caption}>{i + 1}.</Text>
                  <TextInput style={styles.stepInput} value={s.description} onChangeText={(v) => updateStep(s.id, v)} placeholder="Step description..." placeholderTextColor={colors.mutedText} />
                  <TouchableOpacity onPress={() => deleteStep(s.id)}><Feather name="trash-2" size={14} color="#EF4444" /></TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Save Template</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TaskAnalysisTemplatesScreen({ navigation }: NativeStackScreenProps<InstitutionalAdminStackParamList, 'TaskAnalysisTemplates'>) {
  const [templates, setTemplates] = useState<TaskAnalysisTemplate[]>([]);
  const [editorTarget, setEditorTarget] = useState<TaskAnalysisTemplate | null | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      const { data } = await getTaskAnalysisTemplates();
      setTemplates(data);
    } catch (err) {
      setTemplates(DEMO_TEMPLATES);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (payload: TemplatePayload) => {
    try {
      const { data } = await saveTaskAnalysisTemplate(payload.id ?? null, payload);
      setTemplates((prev) => (payload.id ? prev.map((t) => (t.id === payload.id ? data : t)) : [...prev, data]));
    } catch (err) {
      setTemplates((prev) =>
        payload.id ? prev.map((t) => (t.id === payload.id ? { ...t, ...payload } : t)) : [...prev, { ...payload, id: `local-${Date.now()}`, active: true }]
      );
    }
    setEditorTarget(undefined);
  };

  const handleDelete = (template: TaskAnalysisTemplate) => {
    Alert.alert(`Delete "${template.name}"?`, 'Cannot delete if currently in use.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteTaskAnalysisTemplate(template.id); } catch (err) {}
          setTemplates((prev) => prev.filter((t) => t.id !== template.id));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Task Analysis" onTabPress={(t) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])} />
      <View style={styles.header}>
        <Text style={typography.h1}>Task Analysis Templates</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setEditorTarget(null)}>
          <Feather name="plus" size={14} color={colors.navyText} />
          <Text style={styles.addBtnText}>Add Template</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {templates.map((t) => (
          <View key={t.id} style={styles.card}>
            <Text style={typography.bodyBold}>{t.name}</Text>
            <Text style={typography.caption}>{t.steps.length} steps</Text>
            <Text style={typography.body} numberOfLines={2}>{t.description}</Text>
            <View style={styles.cardActionsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setEditorTarget(t)}><Text style={styles.actionBtnText}>Edit</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(t)}><Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <TemplateEditorModal visible={editorTarget !== undefined} template={editorTarget} onClose={() => setEditorTarget(undefined)} onSave={handleSave} />
    </SafeAreaView>
  );
}

const DEMO_TEMPLATES: TaskAnalysisTemplate[] = [
  {
    id: 't1', name: 'Handwashing Sequence', description: '8-step handwashing task analysis.',
    steps: [
      { id: 's1', description: 'Turn on water' }, { id: 's2', description: 'Wet hands' },
      { id: 's3', description: 'Apply soap' }, { id: 's4', description: 'Rub hands together 20 sec' },
      { id: 's5', description: 'Rinse hands' }, { id: 's6', description: 'Turn off water' },
      { id: 's7', description: 'Take paper towel' }, { id: 's8', description: 'Dry hands' },
    ],
  },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  addBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  addBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  cardActionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, maxHeight: '90%' },
  field: { gap: spacing.xs },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  stepsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  stepInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm },
  modalFooter: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  saveBtn: { flex: 2, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
