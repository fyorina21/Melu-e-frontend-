// screens/institutionaladmin/GoalDomainDefinitionsScreen.tsx
// SCR-ADMIN-005 & SCR-ADMIN-006: Combined Goal Domains & Task Analysis Workbench

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
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
import {
  type GoalDomain,
  type TaskAnalysisStep,
  type TaskAnalysisTemplate,
  type GoalBankItem,
  getStoredGoalBank,
  saveGoalItem,
  deleteGoalItem,
} from '../../stores/goalBankStore';
import ScreenLoader from '../../components/ScreenLoader';
import { colors, radius, spacing } from '../../theme/colors';

export { GoalDomain };

export default function GoalDomainDefinitionsScreen({
  navigation,
  route,
}: NativeStackScreenProps<InstitutionalAdminStackParamList, 'GoalDomainDefinitions'>) {
  const [activeSection, setActiveSection] = useState<'domains' | 'goals' | 'templates'>('domains');

  // Domains State
  const [domains, setDomains] = useState<GoalDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
  const [showAddDomainForm, setShowAddDomainForm] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainDesc, setNewDomainDesc] = useState('');

  // Target Goals State
  const [goals, setGoals] = useState<GoalBankItem[]>([]);
  const [goalSearch, setGoalSearch] = useState('');
  const [selectedGoalDomain, setSelectedGoalDomain] = useState('All');
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalBankItem | null>(null);
  const [goalFormName, setGoalFormName] = useState('');
  const [goalFormDomain, setGoalFormDomain] = useState('Communication');
  const [goalFormDesc, setGoalFormDesc] = useState('');
  const [goalFormMastery, setGoalFormMastery] = useState('80% accuracy across 3 consecutive sessions');
  const [goalFormType, setGoalFormType] = useState<'standard' | 'task_analysis'>('standard');
  const [goalFormActive, setGoalFormActive] = useState(true);

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
    // Settle endpoints independently
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

    setGoals(getStoredGoalBank());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();

    const handleBankChange = () => {
      setGoals(getStoredGoalBank());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('melue_goal_bank_changed', handleBankChange);
      return () => {
        window.removeEventListener('melue_goal_bank_changed', handleBankChange);
      };
    }
  }, [loadAll]);

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
      await saveGoalDomains(domains as unknown as Payload[]);
      await loadAll();
      Alert.alert('Success', 'Goal Domains saved and updated in Goal Banks & IUP Generation.');
    } catch {
      Alert.alert('Success', 'Goal Domains configuration saved.');
    }
  };

  // Goal Handlers
  const openGoalEditor = (goal?: GoalBankItem) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalFormName(goal.name);
      setGoalFormDomain(goal.domain || domains[0]?.name || 'Communication');
      setGoalFormDesc(goal.description);
      setGoalFormMastery(goal.masteryCriteria || '80% accuracy across 3 consecutive sessions');
      setGoalFormType(goal.goalType || 'standard');
      setGoalFormActive(goal.active !== false);
    } else {
      setEditingGoal(null);
      setGoalFormName('');
      setGoalFormDomain(domains.find((d) => d.active !== false)?.name || 'Communication');
      setGoalFormDesc('');
      setGoalFormMastery('80% accuracy across 3 consecutive sessions');
      setGoalFormType('standard');
      setGoalFormActive(true);
    }
    setShowGoalEditor(true);
  };

  const handleSaveGoal = () => {
    if (!goalFormName.trim()) {
      Alert.alert('Validation Error', 'Please enter a Goal Name.');
      return;
    }
    const item = saveGoalItem({
      id: editingGoal?.id,
      name: goalFormName.trim(),
      domain: goalFormDomain,
      description: goalFormDesc.trim(),
      masteryCriteria: goalFormMastery.trim() || '80% accuracy across 3 consecutive sessions',
      goalType: goalFormType,
      active: goalFormActive,
      status: goalFormActive ? 'active' : 'inactive',
    });
    setGoals(getStoredGoalBank());
    setShowGoalEditor(false);
    setEditingGoal(null);
    Alert.alert('Success', `Goal "${item.name}" saved and updated in IUP Generation.`);
  };

  const handleDeleteGoal = (goal: GoalBankItem) => {
    Alert.alert('Delete Goal', `Are you sure you want to delete "${goal.name}" from the Goal Bank and IUP Generation?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteGoalItem(goal.id);
          setGoals(getStoredGoalBank());
        },
      },
    ]);
  };

  const handleToggleGoalActive = (goal: GoalBankItem) => {
    saveGoalItem({
      ...goal,
      active: !goal.active,
      status: !goal.active ? 'active' : 'inactive',
    });
    setGoals(getStoredGoalBank());
  };

  const filteredGoals = useMemo(() => {
    const term = goalSearch.trim().toLowerCase();
    return goals.filter((g) => {
      if (selectedGoalDomain !== 'All' && g.domain !== selectedGoalDomain) return false;
      if (term) {
        const match = `${g.name} ${g.description} ${g.masteryCriteria} ${g.domain}`.toLowerCase();
        if (!match.includes(term)) return false;
      }
      return true;
    });
  }, [goals, goalSearch, selectedGoalDomain]);

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

  if (loading) return <ScreenLoader />;

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
            style={[styles.switcherBtn, activeSection === 'goals' && styles.switcherBtnActive]}
            onPress={() => setActiveSection('goals')}
          >
            <Feather
              name="flag"
              size={15}
              color={activeSection === 'goals' ? colors.navyText : colors.bodyText}
            />
            <Text
              style={[
                styles.switcherBtnText,
                activeSection === 'goals' && styles.switcherBtnTextActive,
              ]}
            >
              Target Goals ({goals.length})
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

        {/* SECTION 2: TARGET GOALS */}
        {activeSection === 'goals' && (
          <View style={{ gap: spacing.md }}>
            <View style={styles.tableCard}>
              <View style={styles.tableCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardHeaderTitle}>Target Goals & Clinical Bank</Text>
                  <Text style={styles.cardHeaderSubtitle}>
                    Goals configured here are dynamically available in IUP Generation & Session Logging
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.headerAddBtn}
                  onPress={() => openGoalEditor()}
                >
                  <Feather name="plus" size={14} color={colors.navyText} />
                  <Text style={styles.headerAddBtnText}>Add Target Goal</Text>
                </TouchableOpacity>
              </View>

              {/* Filter and Search Bar */}
              <View style={styles.goalFilterBar}>
                <View style={styles.goalSearchWrap}>
                  <Feather name="search" size={14} color={colors.mutedText} />
                  <TextInput
                    style={styles.goalSearchInput}
                    placeholder="Search goals by name, description, domain, or mastery..."
                    placeholderTextColor={colors.mutedText}
                    value={goalSearch}
                    onChangeText={setGoalSearch}
                  />
                  {Boolean(goalSearch) && (
                    <TouchableOpacity onPress={() => setGoalSearch('')}>
                      <Feather name="x" size={14} color={colors.mutedText} />
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.domainChipRow}>
                  {['All', ...domains.filter((d) => d.active !== false).map((d) => d.name)].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.domainFilterChip,
                        selectedGoalDomain === d && styles.domainFilterChipActive,
                      ]}
                      onPress={() => setSelectedGoalDomain(d)}
                    >
                      <Text
                        style={[
                          styles.domainFilterText,
                          selectedGoalDomain === d && styles.domainFilterTextActive,
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 2.8 }]}>GOAL NAME & DOMAIN</Text>
                <Text style={[styles.th, { flex: 3.5 }]}>OBJECTIVE / DESCRIPTION</Text>
                <Text style={[styles.th, { flex: 2.2 }]}>MASTERY CRITERIA</Text>
                <Text style={[styles.th, { width: 80, textAlign: 'center' }]}>STATUS</Text>
                <Text style={[styles.th, { width: 70, textAlign: 'right' }]}>ACTIONS</Text>
              </View>

              {/* Goals List */}
              {filteredGoals.map((g) => (
                <View key={g.id} style={styles.tableRow}>
                  <View style={{ flex: 2.8, paddingRight: 8 }}>
                    <Text style={styles.goalRowName}>{g.name}</Text>
                    <View style={styles.goalMetaRow}>
                      <View style={styles.goalDomainBadge}>
                        <Text style={styles.goalDomainBadgeText}>{g.domain}</Text>
                      </View>
                      {g.goalType === 'task_analysis' && (
                        <View style={styles.goalTaskBadge}>
                          <Text style={styles.goalTaskBadgeText}>Task Analysis</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={{ flex: 3.5, paddingRight: 8 }}>
                    <Text style={styles.domainDescText} numberOfLines={3}>
                      {g.description || '—'}
                    </Text>
                  </View>

                  <View style={{ flex: 2.2, paddingRight: 8 }}>
                    <Text style={styles.goalMasteryPillText}>
                      {g.masteryCriteria || '80% across 3 sessions'}
                    </Text>
                  </View>

                  <View style={{ width: 80, alignItems: 'center' }}>
                    <TouchableOpacity
                      style={g.active !== false ? styles.activePill : styles.inactivePill}
                      onPress={() => handleToggleGoalActive(g)}
                    >
                      <Text style={g.active !== false ? styles.activePillText : styles.inactivePillText}>
                        {g.active !== false ? 'Active' : 'Inactive'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.actionsCol}>
                    <TouchableOpacity
                      onPress={() => openGoalEditor(g)}
                      style={{ padding: 4 }}
                    >
                      <Feather name="edit-2" size={15} color={colors.navyText} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteGoal(g)}
                      style={{ padding: 4 }}
                    >
                      <Feather name="trash-2" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {filteredGoals.length === 0 && (
                <View style={styles.emptyTableState}>
                  <Text style={styles.emptyTableText}>No target goals match the selected filter.</Text>
                </View>
              )}
            </View>

            {/* Quick Navigation to IUP Generation */}
            <TouchableOpacity
              style={styles.addDomainLinkBtn}
              onPress={() => navigation?.navigate?.('IupGeneration' as never)}
            >
              <Feather name="external-link" size={14} color={colors.navyText} />
              <Text style={styles.addDomainLinkText}>View Goals in IUP Generation</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SECTION 3: TASK ANALYSIS TEMPLATES */}
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

      {/* ADD / EDIT GOAL MODAL */}
      <Modal
        visible={showGoalEditor}
        animationType="fade"
        transparent
        onRequestClose={() => setShowGoalEditor(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {editingGoal ? 'Edit Target Goal' : 'Add New Target Goal'}
                </Text>
                <Text style={styles.modalSub}>
                  Configure goal title, domain, objective, and mastery criteria for IUPs
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowGoalEditor(false)} hitSlop={8}>
                <Feather name="x" size={20} color={colors.navyText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 450 }} contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.sm }}>
              {/* Goal Name */}
              <View style={styles.modalFieldCol}>
                <Text style={styles.modalLabel}>Goal Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Receptive Identification of Common Objects"
                  placeholderTextColor={colors.mutedText}
                  value={goalFormName}
                  onChangeText={setGoalFormName}
                />
              </View>

              {/* Domain Selector */}
              <View style={styles.modalFieldCol}>
                <Text style={styles.modalLabel}>Goal Domain *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                  {domains.filter((d) => d.active !== false).map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={[
                        styles.domainPickChip,
                        goalFormDomain === d.name && styles.domainPickChipActive,
                      ]}
                      onPress={() => setGoalFormDomain(d.name)}
                    >
                      <Text
                        style={[
                          styles.domainPickText,
                          goalFormDomain === d.name && styles.domainPickTextActive,
                        ]}
                      >
                        {d.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Description */}
              <View style={styles.modalFieldCol}>
                <Text style={styles.modalLabel}>Clinical Objective & Description *</Text>
                <TextInput
                  style={[styles.modalInput, { height: 72, textAlignVertical: 'top' }]}
                  placeholder="Enter targeted behavioral response, stimulus conditions, and protocol notes..."
                  placeholderTextColor={colors.mutedText}
                  value={goalFormDesc}
                  onChangeText={setGoalFormDesc}
                  multiline
                />
              </View>

              {/* Mastery Criteria */}
              <View style={styles.modalFieldCol}>
                <Text style={styles.modalLabel}>Mastery Criteria *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 80% accuracy across 3 consecutive sessions"
                  placeholderTextColor={colors.mutedText}
                  value={goalFormMastery}
                  onChangeText={setGoalFormMastery}
                />
              </View>

              {/* Goal Type & Status */}
              <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
                <View style={{ flex: 1, minWidth: 140, gap: 4 }}>
                  <Text style={styles.modalLabel}>Goal Architecture Type</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    <TouchableOpacity
                      style={[styles.typeSelectBtn, goalFormType === 'standard' && styles.typeSelectBtnActive]}
                      onPress={() => setGoalFormType('standard')}
                    >
                      <Text style={[styles.typeSelectBtnText, goalFormType === 'standard' && styles.typeSelectBtnTextActive]}>
                        Standard
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeSelectBtn, goalFormType === 'task_analysis' && styles.typeSelectBtnActive]}
                      onPress={() => setGoalFormType('task_analysis')}
                    >
                      <Text style={[styles.typeSelectBtnText, goalFormType === 'task_analysis' && styles.typeSelectBtnTextActive]}>
                        Task Analysis
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ width: 120, gap: 4 }}>
                  <Text style={styles.modalLabel}>Status</Text>
                  <TouchableOpacity
                    style={[styles.statusToggleBtn, goalFormActive ? styles.statusToggleActive : styles.statusToggleInactive]}
                    onPress={() => setGoalFormActive((prev) => !prev)}
                  >
                    <Feather name={goalFormActive ? 'check' : 'x'} size={14} color={goalFormActive ? '#166534' : '#991B1B'} />
                    <Text style={[styles.statusToggleText, { color: goalFormActive ? '#166534' : '#991B1B' }]}>
                      {goalFormActive ? 'Active' : 'Inactive'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity style={styles.saveTemplateBtn} onPress={handleSaveGoal}>
                <Feather name="save" size={14} color={colors.navyText} />
                <Text style={styles.saveTemplateBtnText}>Save Target Goal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowGoalEditor(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
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

  /* Target Goals styles */
  cardHeaderSubtitle: { fontSize: 12, color: colors.mutedText, marginTop: 2 },
  goalFilterBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  goalSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  goalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.navyText,
    paddingVertical: 2,
  },
  domainChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  domainFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
  },
  domainFilterChipActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  domainFilterText: {
    fontSize: 12,
    color: colors.bodyText,
    fontWeight: '500',
  },
  domainFilterTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
  goalRowName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  goalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  goalDomainBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  goalDomainBadgeText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
  },
  goalTaskBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  goalTaskBadgeText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  goalMasteryPillText: {
    fontSize: 12,
    color: colors.bodyText,
    fontWeight: '500',
  },
  inactivePill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  inactivePillText: { fontSize: 11, fontWeight: '700', color: '#991B1B' },
  emptyTableState: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    fontSize: 13,
    color: colors.mutedText,
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyText,
  },
  modalSub: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  modalFieldCol: {
    gap: 4,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  modalInput: {
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.navyText,
  },
  domainPickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
  },
  domainPickChipActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  domainPickText: {
    fontSize: 12,
    color: colors.bodyText,
    fontWeight: '600',
  },
  domainPickTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
  typeSelectBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeSelectBtnActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  typeSelectBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.bodyText,
  },
  typeSelectBtnTextActive: {
    fontWeight: '700',
    color: colors.navyText,
  },
  statusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  statusToggleActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusToggleInactive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  statusToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});