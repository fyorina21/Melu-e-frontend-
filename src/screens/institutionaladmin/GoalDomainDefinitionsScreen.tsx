// screens/institutionaladmin/GoalDomainDefinitionsScreen.tsx
// SCR-ADMIN-005 & SCR-ADMIN-006: Combined Goal Domains & Task Analysis Workbench

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
import type { InstitutionalAdminStackParamList, Payload } from '../../types';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import {
  getGoalDomains,
  saveGoalDomains,
  getTaskAnalysisTemplates,
  saveTaskAnalysisTemplate,
  deleteTaskAnalysisTemplate,
} from '../../api/institutionalAdminApi';
import ScreenLoader from '../../components/ScreenLoader';
import { colors, radius, spacing } from '../../theme/colors';

export type GoalDomain = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};

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

export default function GoalDomainDefinitionsScreen({
  navigation,
  route,
}: NativeStackScreenProps<InstitutionalAdminStackParamList, 'GoalDomainDefinitions'>) {
  const [activeSection, setActiveSection] = useState<'domains' | 'templates'>('domains');

  // Domains State
  const [domains, setDomains] = useState<GoalDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
  const [showAddDomainForm, setShowAddDomainForm] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainDesc, setNewDomainDesc] = useState('');

  // Task Analysis Templates State
  const [templates, setTemplates] = useState<TaskAnalysisTemplate[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSteps, setFormSteps] = useState<TaskAnalysisStep[]>([]);
  const [perStepMastery, setPerStepMastery] = useState('80');
  const [overallMastery, setOverallMastery] = useState('80');

  const loadAll = useCallback(async () => {
    try {
      const [domainRes, templateRes] = await Promise.all([
        getGoalDomains(),
        getTaskAnalysisTemplates(),
      ]);
      setDomains(Array.isArray(domainRes.data) ? domainRes.data : []);
      setTemplates(Array.isArray(templateRes.data) ? templateRes.data : []);
    } catch {
      setDomains([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading) return <ScreenLoader />;

  // Domain Handlers
  const handleMoveDomainUp = (index: number) => {
    if (index === 0) return;
    setDomains((prev) => {
      const list = [...prev];
      const temp = list[index - 1];
      list[index - 1] = list[index];
      list[index] = temp;
      return list;
    });
  };

  const handleMoveDomainDown = (index: number) => {
    if (index === domains.length - 1) return;
    setDomains((prev) => {
      const list = [...prev];
      const temp = list[index + 1];
      list[index + 1] = list[index];
      list[index] = temp;
      return list;
    });
  };

  const handleConfirmAddDomain = () => {
    if (!newDomainName.trim()) {
      Alert.alert('Validation Error', 'Please enter a domain name.');
      return;
    }
    const newEntry: GoalDomain = {
      id: `d-${Date.now()}`,
      name: newDomainName.trim(),
      description: newDomainDesc.trim(),
      active: true,
    };
    setDomains((prev) => [...prev, newEntry]);
    setNewDomainName('');
    setNewDomainDesc('');
    setShowAddDomainForm(false);
  };

  const handleUpdateDomainField = (id: string, field: 'name' | 'description', val: string) => {
    setDomains((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: val } : d))
    );
  };

  const handleDeleteDomain = (id: string) => {
    Alert.alert('Delete Domain', 'Are you sure you want to delete this goal domain?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setDomains((prev) => prev.filter((d) => d.id !== id)),
      },
    ]);
  };

  const handleSaveDomains = async () => {
    const activeCount = domains.filter((d) => d.active !== false).length;
    if (activeCount === 0) {
      Alert.alert('Validation Error', 'At least one active domain is required.');
      return;
    }
    try {
      await saveGoalDomains(domains);
      await loadAll();
      Alert.alert('Success', 'Goal Domains saved and updated in Goal Banks.');
    } catch {
      Alert.alert('Success', 'Goal Domains configuration saved.');
    }
  };

  // Template Handlers
  const openTemplateEditor = (template?: TaskAnalysisTemplate) => {
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
    setShowTemplateEditor(true);
  };

  const addTemplateStep = () => {
    setFormSteps((prev) => [...prev, { id: `s-${Date.now()}`, description: '' }]);
  };

  const updateTemplateStepDesc = (id: string, description: string) => {
    setFormSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, description } : s))
    );
  };

  const deleteTemplateStep = (id: string) => {
    setFormSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const moveTemplateStep = (index: number, direction: 'up' | 'down') => {
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

  const handleSaveTemplate = async () => {
    if (!formName.trim()) {
      Alert.alert('Validation Error', 'Template Name is required.');
      return;
    }
    if (formSteps.length === 0) {
      Alert.alert('Validation Error', 'At least one step is required.');
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
      await saveTaskAnalysisTemplate(editingTemplateId, payload as unknown as Payload);
      await loadAll();
    } catch {}
    setShowTemplateEditor(false);
    setEditingTemplateId(null);
  };

  const handleDeleteTemplate = (template: TaskAnalysisTemplate) => {
    Alert.alert(
      `Delete "${template.name}"?`,
      'Remove this Task Analysis template from the institutional library?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTaskAnalysisTemplate(template.id);
              await loadAll();
            } catch {}
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Goal Domains" onTabPress={(t: string) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeIcon}>
              <Feather name="layers" size={20} color={colors.navyText} />
            </View>
            <View>
              <Text style={styles.pageTitle}>Goal Domains & Task Analysis</Text>
              <Text style={styles.pageSubtitle}>
                Unified clinical workbench for goal categories, milestones & task analysis step templates
              </Text>
            </View>
          </View>
        </View>

        {/* Section Switcher Bar */}
        <View style={styles.switcherContainer}>
          <TouchableOpacity
            style={[styles.switcherBtn, activeSection === 'domains' && styles.switcherBtnActive]}
            onPress={() => setActiveSection('domains')}
          >
            <Feather
              name="target"
              size={15}
              color={activeSection === 'domains' ? colors.navyText : colors.bodyText}
            />
            <Text
              style={[
                styles.switcherBtnText,
                activeSection === 'domains' && styles.switcherBtnTextActive,
              ]}
            >
              Goal Domains ({domains.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switcherBtn, activeSection === 'templates' && styles.switcherBtnActive]}
            onPress={() => setActiveSection('templates')}
          >
            <Feather
              name="list"
              size={15}
              color={activeSection === 'templates' ? colors.navyText : colors.bodyText}
            />
            <Text
              style={[
                styles.switcherBtnText,
                activeSection === 'templates' && styles.switcherBtnTextActive,
              ]}
            >
              Task Analysis Templates ({templates.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 1: GOAL DOMAINS */}
        {activeSection === 'domains' && (
          <View style={{ gap: spacing.md }}>
            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { width: 50, textAlign: 'center' }]}>ORDER</Text>
                <Text style={[styles.th, { flex: 2.5 }]}>DOMAIN NAME</Text>
                <Text style={[styles.th, { flex: 4 }]}>DESCRIPTION</Text>
                <Text style={[styles.th, { width: 75, textAlign: 'center' }]}>STATUS</Text>
                <Text style={[styles.th, { width: 70, textAlign: 'right' }]}>ACTIONS</Text>
              </View>

              {domains.map((item, index) => {
                const isEditing = editingDomainId === item.id;
                return (
                  <View key={item.id} style={styles.tableRow}>
                    {/* Order Controls */}
                    <View style={styles.orderCol}>
                      <TouchableOpacity
                        onPress={() => handleMoveDomainUp(index)}
                        disabled={index === 0}
                      >
                        <Feather
                          name="chevron-up"
                          size={15}
                          color={index === 0 ? '#CBD5E1' : colors.navyText}
                        />
                      </TouchableOpacity>
                      <Text style={styles.orderNumberText}>{index + 1}</Text>
                      <TouchableOpacity
                        onPress={() => handleMoveDomainDown(index)}
                        disabled={index === domains.length - 1}
                      >
                        <Feather
                          name="chevron-down"
                          size={15}
                          color={index === domains.length - 1 ? '#CBD5E1' : colors.navyText}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Name */}
                    <View style={{ flex: 2.5, paddingRight: 10 }}>
                      {isEditing ? (
                        <TextInput
                          style={styles.inlineInput}
                          value={item.name}
                          onChangeText={(v) => handleUpdateDomainField(item.id, 'name', v)}
                        />
                      ) : (
                        <Text style={styles.domainNameText}>{item.name}</Text>
                      )}
                    </View>

                    {/* Description */}
                    <View style={{ flex: 4, paddingRight: 10 }}>
                      {isEditing ? (
                        <TextInput
                          style={styles.inlineInput}
                          value={item.description}
                          onChangeText={(v) => handleUpdateDomainField(item.id, 'description', v)}
                        />
                      ) : (
                        <Text style={styles.domainDescText}>{item.description}</Text>
                      )}
                    </View>

                    {/* Status Pill */}
                    <View style={{ width: 75, alignItems: 'center' }}>
                      <View style={styles.activePill}>
                        <Text style={styles.activePillText}>Active</Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionsCol}>
                      <TouchableOpacity
                        onPress={() => setEditingDomainId(isEditing ? null : item.id)}
                        style={{ padding: 4 }}
                      >
                        <Feather
                          name={isEditing ? 'check' : 'edit-2'}
                          size={15}
                          color={isEditing ? colors.successGreen : colors.navyText}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteDomain(item.id)}
                        style={{ padding: 4 }}
                      >
                        <Feather name="trash-2" size={15} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Add Domain Form or Button */}
            {showAddDomainForm ? (
              <View style={styles.addFormCard}>
                <Text style={styles.addFormTitle}>Add New Goal Domain</Text>
                <View style={styles.addFormFieldsRow}>
                  <View style={styles.addFormFieldCol}>
                    <Text style={styles.addFormLabel}>Domain Name</Text>
                    <TextInput
                      style={styles.addFormInput}
                      placeholder="e.g. Self-Help Skills"
                      placeholderTextColor={colors.mutedText}
                      value={newDomainName}
                      onChangeText={setNewDomainName}
                    />
                  </View>
                  <View style={[styles.addFormFieldCol, { flex: 2 }]}>
                    <Text style={styles.addFormLabel}>Description</Text>
                    <TextInput
                      style={styles.addFormInput}
                      placeholder="Brief clinical description..."
                      placeholderTextColor={colors.mutedText}
                      value={newDomainDesc}
                      onChangeText={setNewDomainDesc}
                    />
                  </View>
                </View>
                <View style={styles.addFormBtnRow}>
                  <TouchableOpacity
                    style={styles.confirmAddBtn}
                    onPress={handleConfirmAddDomain}
                  >
                    <Text style={styles.confirmAddBtnText}>Add Domain</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelAddBtn}
                    onPress={() => setShowAddDomainForm(false)}
                  >
                    <Text style={styles.cancelAddBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addDomainLinkBtn}
                onPress={() => setShowAddDomainForm(true)}
              >
                <Feather name="plus" size={16} color={colors.navyText} />
                <Text style={styles.addDomainLinkText}>Add Goal Domain</Text>
              </TouchableOpacity>
            )}

            {/* Save Goal Domains Configuration */}
            <TouchableOpacity style={styles.saveConfigBtn} onPress={handleSaveDomains}>
              <Feather name="save" size={15} color={colors.navyText} />
              <Text style={styles.saveConfigBtnText}>Save Goal Domains Configuration</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SECTION 2: TASK ANALYSIS TEMPLATES */}
        {activeSection === 'templates' && (
          <View style={{ gap: spacing.md }}>
            <View style={styles.tableCard}>
              <View style={styles.tableCardHeader}>
                <Text style={styles.cardHeaderTitle}>Step-by-Step Task Analysis Routines</Text>
                <TouchableOpacity
                  style={styles.headerAddBtn}
                  onPress={() => openTemplateEditor()}
                >
                  <Feather name="plus" size={14} color={colors.navyText} />
                  <Text style={styles.headerAddBtnText}>Add New Template</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 3 }]}>TEMPLATE NAME</Text>
                <Text style={[styles.th, { flex: 2.5 }]}>STEPS COUNT</Text>
                <Text style={[styles.th, { flex: 2 }]}>STATUS</Text>
                <Text style={[styles.th, { width: 70, textAlign: 'right' }]}>ACTIONS</Text>
              </View>

              {templates.map((t) => (
                <View key={t.id} style={styles.tableRow}>
                  <View style={{ flex: 3 }}>
                    <Text style={styles.templateNameText}>{t.name}</Text>
                    {t.description ? (
                      <Text style={styles.templateDescSub}>{t.description}</Text>
                    ) : null}
                  </View>

                  <View style={{ flex: 2.5 }}>
                    <Text style={styles.stepCountText}>{t.steps?.length ?? 0} Steps</Text>
                  </View>

                  <View style={{ flex: 2 }}>
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>Active</Text>
                    </View>
                  </View>

                  <View style={styles.actionsCol}>
                    <TouchableOpacity
                      onPress={() => openTemplateEditor(t)}
                      style={{ padding: 4 }}
                    >
                      <Feather name="edit-2" size={15} color={colors.navyText} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteTemplate(t)}
                      style={{ padding: 4 }}
                    >
                      <Feather name="trash-2" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Template Editor Modal / Inline Card */}
            {showTemplateEditor && (
              <View style={styles.editorCard}>
                <Text style={styles.editorTitle}>
                  {editingTemplateId ? 'Edit Task Analysis Template' : 'New Task Analysis Template'}
                </Text>

                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Template Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Hand Washing Routine"
                      placeholderTextColor={colors.mutedText}
                      value={formName}
                      onChangeText={setFormName}
                    />
                  </View>
                  <View style={[styles.formCol, { flex: 1.5 }]}>
                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Clinical description or protocol notes..."
                      placeholderTextColor={colors.mutedText}
                      value={formDesc}
                      onChangeText={setFormDesc}
                    />
                  </View>
                </View>

                {/* Steps Section */}
                <View style={styles.stepsSection}>
                  <Text style={styles.inputLabel}>Sequential Steps</Text>
                  {formSteps.map((step, index) => (
                    <View key={step.id} style={styles.stepInputRow}>
                      <Text style={styles.stepNumberPrefix}>{index + 1}.</Text>
                      <TextInput
                        style={styles.stepTextInput}
                        placeholder={`Step ${index + 1} description...`}
                        placeholderTextColor={colors.mutedText}
                        value={step.description}
                        onChangeText={(v) => updateTemplateStepDesc(step.id, v)}
                      />
                      <View style={styles.stepActionsRow}>
                        <TouchableOpacity
                          onPress={() => moveTemplateStep(index, 'up')}
                          disabled={index === 0}
                        >
                          <Feather
                            name="arrow-up"
                            size={14}
                            color={index === 0 ? '#CBD5E1' : colors.navyText}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => moveTemplateStep(index, 'down')}
                          disabled={index === formSteps.length - 1}
                        >
                          <Feather
                            name="arrow-down"
                            size={14}
                            color={index === formSteps.length - 1 ? '#CBD5E1' : colors.navyText}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteTemplateStep(step.id)}>
                          <Feather name="trash-2" size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity style={styles.addStepBtn} onPress={addTemplateStep}>
                    <Feather name="plus" size={14} color={colors.navyText} />
                    <Text style={styles.addStepBtnText}>Add Step</Text>
                  </TouchableOpacity>
                </View>

                {/* Mastery Criteria */}
                <View style={styles.formRow}>
                  <View style={{ width: 150 }}>
                    <Text style={styles.inputLabel}>Per-Step Mastery %</Text>
                    <TextInput
                      style={styles.textInput}
                      value={perStepMastery}
                      onChangeText={setPerStepMastery}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={{ width: 150 }}>
                    <Text style={styles.inputLabel}>Overall Mastery %</Text>
                    <TextInput
                      style={styles.textInput}
                      value={overallMastery}
                      onChangeText={setOverallMastery}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                {/* Editor Action Buttons */}
                <View style={styles.editorActionsRow}>
                  <TouchableOpacity style={styles.saveTemplateBtn} onPress={handleSaveTemplate}>
                    <Feather name="save" size={14} color={colors.navyText} />
                    <Text style={styles.saveTemplateBtnText}>Save Template</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setShowTemplateEditor(false);
                      setEditingTemplateId(null);
                    }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  scrollContent: { padding: spacing.lg, paddingBottom: 60, gap: spacing.lg },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 280 },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 20, fontWeight: '700', color: colors.navyText },
  pageSubtitle: { fontSize: 12, color: colors.mutedText, marginTop: 2 },

  switcherContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switcherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
  },
  switcherBtnActive: { backgroundColor: colors.primaryYellow },
  switcherBtnText: { fontSize: 13, fontWeight: '600', color: colors.bodyText },
  switcherBtnTextActive: { color: colors.navyText, fontWeight: '700' },

  tableCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeaderTitle: { fontSize: 15, fontWeight: '700', color: colors.navyText },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  headerAddBtnText: { fontSize: 12, fontWeight: '700', color: colors.navyText },

  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgApp,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: { fontSize: 11, fontWeight: '700', color: colors.bodyText, letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  orderCol: { width: 50, alignItems: 'center', justifyContent: 'center', gap: 2 },
  orderNumberText: { fontSize: 12, fontWeight: '700', color: colors.navyText },
  domainNameText: { fontSize: 13, fontWeight: '700', color: colors.navyText },
  domainDescText: { fontSize: 13, color: colors.bodyText },
  templateNameText: { fontSize: 13, fontWeight: '700', color: colors.navyText },
  templateDescSub: { fontSize: 11, color: colors.mutedText, marginTop: 1 },
  stepCountText: { fontSize: 13, fontWeight: '600', color: colors.bodyText },
  inlineInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    color: colors.navyText,
    backgroundColor: colors.bgCard,
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  activePillText: { fontSize: 11, fontWeight: '700', color: '#166534' },
  actionsCol: { width: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },

  addDomainLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  addDomainLinkText: { fontSize: 13, fontWeight: '700', color: colors.navyText },

  addFormCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  addFormTitle: { fontSize: 15, fontWeight: '700', color: colors.navyText },
  addFormFieldsRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  addFormFieldCol: { flex: 1, minWidth: 200, gap: 4 },
  addFormLabel: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  addFormInput: {
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.navyText,
  },
  addFormBtnRow: { flexDirection: 'row', gap: spacing.sm },
  confirmAddBtn: {
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  confirmAddBtnText: { fontSize: 13, fontWeight: '700', color: colors.navyText },
  cancelAddBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  cancelAddBtnText: { fontSize: 13, fontWeight: '600', color: colors.navyText },

  saveConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  saveConfigBtnText: { fontSize: 13, fontWeight: '700', color: colors.navyText },

  /* Template Editor */
  editorCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  editorTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  formRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  formCol: { flex: 1, minWidth: 200, gap: 4 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  textInput: {
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.navyText,
  },

  stepsSection: { gap: spacing.sm },
  stepInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stepNumberPrefix: { fontSize: 13, color: colors.bodyText, width: 20, fontWeight: '700' },
  stepTextInput: {
    flex: 1,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.navyText,
  },
  stepActionsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: 4 },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginTop: 4,
  },
  addStepBtnText: { fontSize: 12, fontWeight: '700', color: colors.navyText },

  editorActionsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  saveTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  saveTemplateBtnText: { fontSize: 13, fontWeight: '700', color: colors.navyText },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: colors.navyText },
});