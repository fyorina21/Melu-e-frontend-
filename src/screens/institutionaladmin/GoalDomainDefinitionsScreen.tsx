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
import { GoalDomainsHeader } from './goaldomains/components/GoalDomainsHeader';
import { GoalDomainsSectionSwitcher } from './goaldomains/components/GoalDomainsSectionSwitcher';
import { GoalDomainsTable } from './goaldomains/components/GoalDomainsTable';
import { AddDomainFormCard } from './goaldomains/components/AddDomainFormCard';
import { TaskAnalysisTemplatesTable } from './goaldomains/components/TaskAnalysisTemplatesTable';
import { TaskAnalysisTemplateEditor } from './goaldomains/components/TaskAnalysisTemplateEditor';
import {
  moveItemInList,
  validateDomainSubmission,
  validateTemplateSubmission,
} from './goaldomains/goalDomainsHelper';

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
    setDomains((prev) => moveItemInList(prev, index, 'up'));
  };

  const handleMoveDomainDown = (index: number) => {
    setDomains((prev) => moveItemInList(prev, index, 'down'));
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
    const validation = validateDomainSubmission(domains);
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.error);
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
    setFormSteps((prev) => moveItemInList(prev, index, direction));
  };

  const handleSaveTemplate = async () => {
    const validation = validateTemplateSubmission(formName, formSteps);
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.error);
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
          {/* Modular Page Header */}
          <GoalDomainsHeader />

          {/* Modular Section Switcher Bar */}
          <GoalDomainsSectionSwitcher
            activeSection={activeSection}
            domainsCount={domains.length}
            templatesCount={templates.length}
            onSelectSection={setActiveSection}
          />

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
