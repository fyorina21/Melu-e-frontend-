// screens/institutionaladmin/TaskAnalysisTemplatesScreen.js
// SCR-ADMIN-006: Task Analysis Templates

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { InstitutionalAdminStackParamList } from '../../types';
import {
  getTaskAnalysisTemplates,
  saveTaskAnalysisTemplate,
  deleteTaskAnalysisTemplate,
} from '../../api/institutionalAdminApi';
import { Payload } from '../../types';

interface TaskAnalysisStep {
  id: string;
  description: string;
}

interface TaskAnalysisTemplate {
  id: string;
  name: string;
  description: string;
  steps: TaskAnalysisStep[];
  perStepMastery?: number;
  overallMastery?: number;
  active?: boolean;
}

const DEMO_TEMPLATES: TaskAnalysisTemplate[] = [
  {
    id: 't1',
    name: 'Hand Washing',
    description: '8-step handwashing task analysis.',
    active: true,
    perStepMastery: 80,
    overallMastery: 80,
    steps: [
      { id: 's1', description: 'Turn on water' },
      { id: 's2', description: 'Wet hands' },
      { id: 's3', description: 'Apply soap' },
      { id: 's4', description: 'Rub hands together 20 sec' },
      { id: 's5', description: 'Rinse hands' },
      { id: 's6', description: 'Turn off water' },
      { id: 's7', description: 'Take paper towel' },
      { id: 's8', description: 'Dry hands' },
    ],
  },
  {
    id: 't2',
    name: 'Tooth Brushing',
    description: '6-step toothbrushing task analysis.',
    active: true,
    perStepMastery: 80,
    overallMastery: 80,
    steps: Array(6).fill(null).map((_, i) => ({ id: `tb-${i}`, description: `Step ${i + 1}...` })),
  },
  {
    id: 't3',
    name: 'Getting Dressed',
    description: '10-step morning dressing sequence.',
    active: true,
    perStepMastery: 80,
    overallMastery: 80,
    steps: Array(10).fill(null).map((_, i) => ({ id: `gd-${i}`, description: `Step ${i + 1}...` })),
  },
];

export default function TaskAnalysisTemplatesScreen({
  navigation,
}: NativeStackScreenProps<InstitutionalAdminStackParamList, 'TaskAnalysisTemplates'>) {
  const [templates, setTemplates] = useState<TaskAnalysisTemplate[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Form Panel State
  const [showEditor, setShowEditor] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSteps, setFormSteps] = useState<TaskAnalysisStep[]>([]);
  const [perStepMastery, setPerStepMastery] = useState('80');
  const [overallMastery, setOverallMastery] = useState('80');

  const load = useCallback(async () => {
    try {
      const { data } = await getTaskAnalysisTemplates();
      setTemplates(data && data.length > 0 ? data : DEMO_TEMPLATES);
    } catch (err) {
      setTemplates(DEMO_TEMPLATES);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Open Editor (For Create or Edit)
  const openEditor = (template?: TaskAnalysisTemplate) => {
    if (template) {
      setEditingTemplateId(template.id);
      setFormName(template.name);
      setFormDesc(template.description);
      setFormSteps(template.steps ?? []);
      setPerStepMastery(String(template.perStepMastery ?? 80));
      setOverallMastery(String(template.overallMastery ?? 80));
    } else {
      setEditingTemplateId(null);
      setFormName('');
      setFormDesc('');
      setFormSteps([{ id: `s-${Date.now()}`, description: '' }]);
      setPerStepMastery('80');
      setOverallMastery('80');
    }
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingTemplateId(null);
  };

  // Step Array Handlers
  const addStep = () => {
    setFormSteps((prev) => [...prev, { id: `s-${Date.now()}`, description: '' }]);
  };

  const updateStepDesc = (id: string, description: string) => {
    setFormSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, description } : s))
    );
  };

  const deleteStep = (id: string) => {
    setFormSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formSteps.length) return;
    setFormSteps((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  // Save Payload Handler
  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Template Name is required');
      return;
    }
    if (formSteps.length === 0) {
      Alert.alert('At least one step is required');
      return;
    }

    const payload: TaskAnalysisTemplate = {
      id: editingTemplateId ?? `local-${Date.now()}`,
      name: formName.trim(),
      description: formDesc.trim(),
      steps: formSteps,
      perStepMastery: Number(perStepMastery),
      overallMastery: Number(overallMastery),
      active: true,
    };

    try {
      await updateTemplate(payload.id, payload as unknown as Payload);
      setTemplates((prev) =>
        editingTemplateId
          ? prev.map((t) => (t.id === editingTemplateId ? payload : t))
          : [...prev, payload]
      );
    } catch (err) {
      setTemplates((prev) =>
        editingTemplateId
          ? prev.map((t) => (t.id === editingTemplateId ? payload : t))
          : [...prev, payload]
      );
    }
    closeEditor();
  };

  // Delete Template Handler
  const handleDeleteTemplate = (template: TaskAnalysisTemplate) => {
    Alert.alert(
      `Delete "${template.name}"?`,
      'Cannot delete if currently in active clinical use.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTaskAnalysisTemplate(template.id);
            } catch (err) {
              // Fallback local state delete
            }
            setTemplates((prev) => prev.filter((t) => t.id !== template.id));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header & Breadcrumb */}
        <View style={styles.topHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.breadcrumbTitle}>Task Analysis Templates</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SCR-ADMIN-006</Text>
            </View>
          </View>
          <View style={styles.breadcrumbRow}>
            <Feather name="settings" size={12} color="#64748B" />
            <Text style={styles.breadcrumbText}>
              {' '}
              Clinical Configuration / Task Analysis Templates
            </Text>
          </View>
        </View>

        {/* Page Title & Subtitle */}
        <View style={styles.pageHeader}>
          <Text style={styles.mainTitle}>Task Analysis Templates</Text>
          <Text style={styles.subtitle}>
            SCR-ADMIN-006 · Manage step-by-step task analysis templates
          </Text>
        </View>

        {/* Templates Table Card */}
        <View style={styles.tableCard}>
          {/* Card Top Title Bar */}
          <View style={styles.tableCardHeader}>
            <Text style={styles.cardHeaderTitle}>Templates</Text>
            <TouchableOpacity
              style={styles.headerAddBtn}
              onPress={() => openEditor()}
            >
              <Feather name="plus" size={14} color="#0284C7" />
              <Text style={styles.headerAddBtnText}>Add Template</Text>
            </TouchableOpacity>
          </View>

          {/* Table Header Row */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { flex: 3 }]}>TEMPLATE NAME</Text>
            <Text style={[styles.th, { flex: 2.5 }]}>STEPS</Text>
            <Text style={[styles.th, { flex: 2 }]}>STATUS</Text>
            <Text style={[styles.th, { width: 70, textAlign: 'right' }]}>ACTIONS</Text>
          </View>

          {/* Table Body */}
          {templates.map((t) => (
            <View key={t.id} style={styles.tableRow}>
              <View style={{ flex: 3 }}>
                <Text style={styles.templateNameText}>{t.name}</Text>
              </View>

              <View style={{ flex: 2.5 }}>
                <Text style={styles.stepCountText}>{t.steps?.length ?? 0} steps</Text>
              </View>

              <View style={{ flex: 2 }}>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Active</Text>
                </View>
              </View>

              <View style={styles.actionsCol}>
                <TouchableOpacity
                  onPress={() => openEditor(t)}
                  style={{ padding: 4 }}
                >
                  <Feather name="edit-2" size={15} color="#94A3B8" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteTemplate(t)}
                  style={{ padding: 4 }}
                >
                  <Feather name="trash-2" size={15} color="#F87171" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Inline Template Editor Form Panel */}
        {showEditor && (
          <View style={styles.editorCard}>
            <Text style={styles.editorTitle}>
              {editingTemplateId ? 'Edit Template' : 'New Template'}
            </Text>

            {/* Template Name & Description */}
            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.inputLabel}>Template Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Shoe Tying"
                  placeholderTextColor="#94A3B8"
                  value={formName}
                  onChangeText={setFormName}
                />
              </View>
              <View style={[styles.formCol, { flex: 1.5 }]}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Brief description..."
                  placeholderTextColor="#94A3B8"
                  value={formDesc}
                  onChangeText={setFormDesc}
                />
              </View>
            </View>

            {/* Steps Input Section */}
            <View style={styles.stepsSection}>
              <Text style={styles.inputLabel}>Steps</Text>

              {formSteps.map((step, index) => (
                <View key={step.id} style={styles.stepInputRow}>
                  <Text style={styles.stepNumberPrefix}>{index + 1}.</Text>

                  <TextInput
                    style={styles.stepTextInput}
                    placeholder={`Step ${index + 1}...`}
                    placeholderTextColor="#94A3B8"
                    value={step.description}
                    onChangeText={(v) => updateStepDesc(step.id, v)}
                  />

                  {/* Reorder and Delete Step Icons */}
                  <View style={styles.stepActionsRow}>
                    <TouchableOpacity
                      onPress={() => moveStep(index, 'up')}
                      disabled={index === 0}
                    >
                      <Feather
                        name="arrow-up"
                        size={14}
                        color={index === 0 ? '#CBD5E1' : '#64748B'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => moveStep(index, 'down')}
                      disabled={index === formSteps.length - 1}
                    >
                      <Feather
                        name="arrow-down"
                        size={14}
                        color={index === formSteps.length - 1 ? '#CBD5E1' : '#64748B'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => deleteStep(step.id)}>
                      <Feather name="trash-2" size={14} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addStepBtn} onPress={addStep}>
                <Feather name="plus" size={14} color="#0284C7" />
                <Text style={styles.addStepBtnText}>Add Step</Text>
              </TouchableOpacity>
            </View>

            {/* Per-Step & Overall Mastery Input Row */}
            <View style={styles.formRow}>
              <View style={{ width: 140 }}>
                <Text style={styles.inputLabel}>Per-Step Mastery %</Text>
                <TextInput
                  style={styles.textInput}
                  value={perStepMastery}
                  onChangeText={setPerStepMastery}
                  keyboardType="number-pad"
                />
              </View>

              <View style={{ width: 140 }}>
                <Text style={styles.inputLabel}>Overall Mastery %</Text>
                <TextInput
                  style={styles.textInput}
                  value={overallMastery}
                  onChangeText={setOverallMastery}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.editorActionsRow}>
              <TouchableOpacity style={styles.saveTemplateBtn} onPress={handleSave}>
                <Feather name="save" size={14} color="#0F172A" />
                <Text style={styles.saveTemplateBtnText}>Save Template</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={closeEditor}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 24, paddingBottom: 60, gap: 18 },

  topHeader: { marginBottom: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breadcrumbTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  breadcrumbRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  breadcrumbText: { fontSize: 12, color: '#64748B' },

  pageHeader: { marginBottom: 4 },
  mainTitle: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },

  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerAddBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },

  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  templateNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepCountText: {
    fontSize: 13,
    color: '#475569',
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  actionsCol: {
    width: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },

  /* Editor Panel Styles */
  editorCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 20,
    gap: 16,
  },
  editorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formCol: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },

  stepsSection: {
    gap: 8,
  },
  stepInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepNumberPrefix: {
    fontSize: 13,
    color: '#64748B',
    width: 18,
  },
  stepTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  stepActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  addStepBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },

  editorActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  saveTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FACC15',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  saveTemplateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
});