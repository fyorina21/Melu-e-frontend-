import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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

import type { GoalDomain, TaskAnalysisStep, TaskAnalysisTemplate } from './goaldomains/types';
import { GoalDomainsTable } from './goaldomains/components/GoalDomainsTable';
import { AddDomainFormCard } from './goaldomains/components/AddDomainFormCard';
import { TaskAnalysisTemplatesTable } from './goaldomains/components/TaskAnalysisTemplatesTable';
import { TaskAnalysisTemplateEditor } from './goaldomains/components/TaskAnalysisTemplateEditor';

export type { GoalDomain };

export default function GoalDomainDefinitionsScreen({
  navigation,
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
    const [domainRes, templateRes] = await Promise.allSettled([
      getGoalDomains(),
      getTaskAnalysisTemplates(),
    ]);

    if (domainRes.status === 'fulfilled') {
      setDomains(Array.isArray(domainRes.value.data) ? domainRes.value.data : []);
    } else {
      setDomains([]);
    }

    if (templateRes.status === 'fulfilled') {
      setTemplates(Array.isArray(templateRes.value.data) ? templateRes.value.data : []);
    } else {
      setTemplates([]);
    }

    setLoading(false);
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
    setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: val } : d)));
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
      await saveGoalDomains(domains as unknown as Payload[]);
      await loadAll();
      Alert.alert('Success', 'Goal Domains saved and updated in Goal Banks.');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to save goal domains. Please try again.';
      Alert.alert('Save Failed', msg);
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
    setFormSteps((prev) => prev.map((s) => (s.id === id ? { ...s, description } : s)));
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
      setShowTemplateEditor(false);
      setEditingTemplateId(null);
      Alert.alert('Success', 'Task Analysis template saved successfully.');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to save Task Analysis template. Please try again.';
      Alert.alert('Save Failed', msg);
    }
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
              Alert.alert('Success', `Template "${template.name}" deleted successfully.`);
            } catch (err: any) {
              const msg =
                err?.response?.data?.error || err?.message || 'Failed to delete template.';
              Alert.alert('Delete Failed', msg);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Goal Domains"
        onTabPress={(t: string) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveContainer}>
          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.badgeIcon}>
                <Feather name="layers" size={20} color={colors.navyText} />
              </View>
              <View>
                <Text style={styles.pageTitle}>Goal Domains & Task Analysis</Text>
                <Text style={styles.pageSubtitle}>
                  Unified clinical workbench for goal categories, milestones & task analysis step
                  templates
                </Text>
              </View>
            </View>
          </View>

          {/* Section Switcher Bar */}
          <View style={styles.switcherContainer}>
            <TouchableOpacity
              style={[styles.switcherBtn, activeSection === 'domains' && styles.switcherBtnActive]}
              onPress={() => setActiveSection('domains')}
              accessibilityRole="button"
              accessibilityState={{ selected: activeSection === 'domains' }}
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
              style={[
                styles.switcherBtn,
                activeSection === 'templates' && styles.switcherBtnActive,
              ]}
              onPress={() => setActiveSection('templates')}
              accessibilityRole="button"
              accessibilityState={{ selected: activeSection === 'templates' }}
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
              <GoalDomainsTable
                domains={domains}
                editingDomainId={editingDomainId}
                onMoveUp={handleMoveDomainUp}
                onMoveDown={handleMoveDomainDown}
                onToggleEdit={(id) => setEditingDomainId(editingDomainId === id ? null : id)}
                onUpdateField={handleUpdateDomainField}
                onDelete={handleDeleteDomain}
              />

              <AddDomainFormCard
                visible={showAddDomainForm}
                name={newDomainName}
                description={newDomainDesc}
                onNameChange={setNewDomainName}
                onDescriptionChange={setNewDomainDesc}
                onConfirm={handleConfirmAddDomain}
                onCancel={() => setShowAddDomainForm(false)}
                onOpen={() => setShowAddDomainForm(true)}
              />

              {/* Save Goal Domains Configuration */}
              <TouchableOpacity
                style={styles.saveConfigBtn}
                onPress={handleSaveDomains}
                accessibilityRole="button"
                accessibilityLabel="Save Goal Domains Configuration"
              >
                <Feather name="save" size={15} color={colors.navyText} />
                <Text style={styles.saveConfigBtnText}>Save Goal Domains Configuration</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* SECTION 2: TASK ANALYSIS TEMPLATES */}
          {activeSection === 'templates' && (
            <View style={{ gap: spacing.md }}>
              <TaskAnalysisTemplatesTable
                templates={templates}
                onAddNew={() => openTemplateEditor()}
                onEdit={(t) => openTemplateEditor(t)}
                onDelete={handleDeleteTemplate}
              />

              {showTemplateEditor && (
                <TaskAnalysisTemplateEditor
                  isEditing={Boolean(editingTemplateId)}
                  formName={formName}
                  formDesc={formDesc}
                  formSteps={formSteps}
                  perStepMastery={perStepMastery}
                  overallMastery={overallMastery}
                  onFormNameChange={setFormName}
                  onFormDescChange={setFormDesc}
                  onPerStepMasteryChange={setPerStepMastery}
                  onOverallMasteryChange={setOverallMastery}
                  onAddStep={addTemplateStep}
                  onUpdateStepDesc={updateTemplateStepDesc}
                  onDeleteStep={deleteTemplateStep}
                  onMoveStep={moveTemplateStep}
                  onSave={handleSaveTemplate}
                  onCancel={() => {
                    setShowTemplateEditor(false);
                    setEditingTemplateId(null);
                  }}
                />
              )}
            </View>
          )}
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 60,
    alignItems: 'center',
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 1200,
    gap: spacing.lg,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 280,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navyText,
  },
  pageSubtitle: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
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
  switcherBtnActive: {
    backgroundColor: colors.primaryYellow,
  },
  switcherBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.bodyText,
  },
  switcherBtnTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
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
  saveConfigBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
});
