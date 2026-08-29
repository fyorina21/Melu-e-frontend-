// screens/programdirector/IupGenerationScreen.tsx
// SCR-PD-003: IUP Generation & Management

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import ExportPreviewModal from '../../components/ExportPreviewModal';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { PD_ROUTE_BY_TAB, COORDINATOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { useAuth, ROLES } from '../../context/AuthContext';
import {
  getIupCandidates,
  getIupContext,
  saveIupDraft,
  finalizeIup,
  getGoalBank,
} from '../../api/programDirectorApi';
import DynamicFormFields from '../../components/DynamicFormFields';
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
  program?: string;
  age?: number;
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

export default function IupGenerationScreen({
  navigation,
  route,
}: NativeStackScreenProps<ProgramDirectorStackParamList | CoordinatorStackParamList, 'IupGeneration'>) {
  const { session } = useAuth();
  const isCoordinator = session?.role === ROLES.COORDINATOR;

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<IupCandidate[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [context, setContext] = useState<IupContext | null>(null);
  const [goalBank, setGoalBank] = useState<GoalBankItem[]>([]);
  const [slots, setSlots] = useState<Slots>({ station1: [null, null], station2: [null, null] });
  const [activeWorkbenchTab, setActiveWorkbenchTab] = useState<'assessment' | 'goals' | 'strategies'>('goals');

  // Custom Strategies State
  const [reinforcementSchedule, setReinforcementSchedule] = useState('Fixed Ratio (FR-2)');
  const [crisisProtocol, setCrisisProtocol] = useState('Redirect to calm zone, offer deep pressure sensory mat, minimal verbal engagement.');
  const [accommodations, setAccommodations] = useState('Visual schedule, 2-minute transition warnings, preferential seating near exit.');
  const [reviewCycle, setReviewCycle] = useState('6 Weeks');
  const [customIupValues, setCustomIupValues] = useState<Record<string, any>>({});

  // Dropdown Selector State
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [searchStudentText, setSearchStudentText] = useState('');

  // Goal Selector Modal State
  const [selectorTarget, setSelectorTarget] = useState<{ station: StationKey; slotIndex: number } | null>(null);
  const [goalSearch, setGoalSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');

  // Preview & Export State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportContent, setExportContent] = useState<string | null>(null);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    let loadedCandidates: IupCandidate[] = [];
    try {
      const { data: res } = await getIupCandidates();
      loadedCandidates = Array.isArray(res) ? res : [];
    } catch {
      loadedCandidates = [];
    }
    setCandidates(loadedCandidates);

    try {
      const { data: res } = await getGoalBank({});
      setGoalBank(Array.isArray(res) ? res : []);
    } catch {
      setGoalBank([]);
    }

    const preId = (route.params as { studentId?: string })?.studentId;
    if (preId) {
      setSelectedStudentId(preId);
    } else if (loadedCandidates.length > 0) {
      setSelectedStudentId(loadedCandidates[0].id);
    }
    setLoading(false);
  }, [route.params]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedStudentId) return;
    getIupContext(selectedStudentId)
      .then(({ data }) => setContext(data))
      .catch(() => setContext(null));
  }, [selectedStudentId]);

  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.id === selectedStudentId) ?? null,
    [candidates, selectedStudentId]
  );

  const filteredCandidates = useMemo(() => {
    if (!searchStudentText.trim()) return candidates;
    return candidates.filter((c) =>
      c.name.toLowerCase().includes(searchStudentText.toLowerCase())
    );
  }, [candidates, searchStudentText]);

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
    setGoalSearch('');
  };

  const handleRemoveGoal = (station: StationKey, slotIndex: number) => {
    Alert.alert('Remove Goal', 'Remove this goal from the IUP?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          setSlots((prev) => {
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
      await saveIupDraft(selectedStudentId, {
        slots,
        reinforcementSchedule,
        crisisProtocol,
        accommodations,
        reviewCycle,
      });
      setLastSavedTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      Alert.alert('Draft Saved', 'The IUP draft has been saved successfully to the IUP Library.');
    } catch {
      Alert.alert('Error', 'Unable to save draft.');
    }
  };

  const handleFinalize = async () => {
    if (!selectedStudentId) return;
    const allAssigned = [...slots.station1, ...slots.station2].filter(Boolean);
    if (allAssigned.length === 0) {
      Alert.alert('Goal Assignment Required', 'Please assign at least one target goal before finalizing the IUP.');
      return;
    }

    Alert.alert(
      `Finalize IUP for ${context?.studentName || selectedCandidate?.name}?`,
      'This will officially activate the Individualized Unit Plan and move the student to Active Therapy status.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalize & Activate',
          style: 'default',
          onPress: async () => {
            try {
              await finalizeIup(selectedStudentId, {
                slots,
                reinforcementSchedule,
                crisisProtocol,
                accommodations,
                reviewCycle,
              });
              Alert.alert(
                'IUP Finalized & Activated',
                'The student is now in Active Therapy status. Goals are immediately available in the Teacher Session workbench.'
              );
              await loadData();
            } catch {
              Alert.alert('Error', 'Failed to finalize IUP.');
            }
          },
        },
      ]
    );
  };

  const buildExportText = () => {
    if (!context && !selectedCandidate) return '';
    const studentName = context?.studentName || selectedCandidate?.name || 'Student';
    const age = context?.age ?? selectedCandidate?.age ?? '—';
    const dob = context?.dob ?? '—';
    const prog = context?.program ?? selectedCandidate?.program ?? 'ABA Therapy';
    const enrolled = context?.enrollmentDate ?? '—';

    const lines = [
      '================================================================',
      '        MELU\'E FOUNDATION — INDIVIDUALIZED UNIT PLAN (IUP)       ',
      '================================================================',
      `STUDENT: ${studentName}`,
      `AGE: ${age}  |  DOB: ${dob}  |  PROGRAM: ${prog}`,
      `ENROLLMENT DATE: ${enrolled}`,
      `STATUS: ${selectedCandidate?.status ?? 'Active Therapy'}`,
      `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      '----------------------------------------------------------------',
      '',
      '1. CLINICAL ASSESSMENT BASELINE & SUMMARY',
      `• Skills Strengths: ${context?.skillsStrengths || 'Demonstrates strong visual matching, basic receptivity, and receptive labeling.'}`,
      `• Functional Behavior: ${context?.behaviorFunctions || 'Escape-maintained non-compliance when demand difficulty escalates; sensory seeking.'}`,
      `• Sensory Profile: ${context?.sensorySummary || 'Benefits from structured movement breaks, weighted blanket, low ambient lighting.'}`,
      `• Top Reinforcers: ${(context?.topReinforcers || ['Bubbles', 'Musical Toy', 'Token Stars', 'Praise']).join(', ')}`,
      '',
      '----------------------------------------------------------------',
      '2. GOAL ARCHITECTURE & TARGET CRITERIA',
      '',
      'STATION 1 (Basic & Foundational Skills):',
      ...slots.station1.map((g, i) =>
        g ? `  [Slot ${i + 1}] ${g.name} (${g.domain})\n         Type: ${g.goalType === 'task_analysis' ? 'Task Analysis' : 'Standard'} | Mastery: ${g.masteryCriteria}\n         Objective: ${g.description}` : `  [Slot ${i + 1}] (Unassigned)`
      ),
      '',
      'STATION 2 (Advanced & Generalization Skills):',
      ...slots.station2.map((g, i) =>
        g ? `  [Slot ${i + 1}] ${g.name} (${g.domain})\n         Type: ${g.goalType === 'task_analysis' ? 'Task Analysis' : 'Standard'} | Mastery: ${g.masteryCriteria}\n         Objective: ${g.description}` : `  [Slot ${i + 1}] (Unassigned)`
      ),
      '',
      '----------------------------------------------------------------',
      '3. IMPLEMENTATION & PROTOCOL SPECIFICATIONS',
      `• Reinforcement Schedule: ${reinforcementSchedule}`,
      `• Accommodations: ${accommodations}`,
      `• Crisis & De-escalation Protocol: ${crisisProtocol}`,
      `• Clinical Review Cycle: ${reviewCycle}`,
      '================================================================',
    ];
    return lines.join('\n');
  };

  const handleExport = () => {
    setExportContent(buildExportText());
  };

  if (loading && candidates.length === 0) return <ScreenLoader />;

  const assignedGoalCount = [...slots.station1, ...slots.station2].filter(Boolean).length;
  const filteredGoals = goalBank.filter(
    (g) =>
      (domainFilter === 'All' || g.domain === domainFilter) &&
      (!goalSearch || g.name.toLowerCase().includes(goalSearch.toLowerCase()) || g.description.toLowerCase().includes(goalSearch.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.safe}>
      {isCoordinator ? (
        <AppNavbar
          activeTab="IUP Creation & Goal Assignment"
          onTabPress={(t) =>
            t !== 'IUP Creation & Goal Assignment' &&
            navigation?.navigate?.(COORDINATOR_ROUTE_BY_TAB[t] as never)
          }
        />
      ) : (
        <AppNavbar
          activeTab="IUP Creation & Goal Assignment"
          onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t] as never)}
        />
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.headerTitleWrap}>
            <View style={styles.badgeIcon}>
              <Feather name="file-text" size={20} color={colors.navyText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pageTitle}>IUP Generation & Management</Text>
              <Text style={styles.pageSubtitle}>
                Design, customize, and finalize Individualized Behavior Intervention Plans
              </Text>
            </View>
          </View>
          <View style={styles.headerRightActions}>
            <TouchableOpacity style={styles.headerOutlineBtn} onPress={() => setPreviewOpen(true)}>
              <Feather name="eye" size={14} color={colors.navyText} />
              <Text style={styles.headerOutlineBtnText}>Preview IUP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerOutlineBtn} onPress={handleExport}>
              <Feather name="printer" size={14} color={colors.navyText} />
              <Text style={styles.headerOutlineBtnText}>Export / Print</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Student Selector Card */}
        <View style={styles.card}>
          <View style={styles.selectorHeaderRow}>
            <Text style={styles.sectionLabel}>SELECT STUDENT</Text>
            {lastSavedTimestamp && (
              <Text style={styles.lastSavedText}>
                <Feather name="check" size={11} color={colors.successGreen} /> Draft saved at {lastSavedTimestamp}
              </Text>
            )}
          </View>

          <View style={styles.dropdownTriggerRow}>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setStudentDropdownOpen((prev) => !prev)}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownTriggerLeft}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentAvatarText}>
                    {(selectedCandidate?.name || 'S').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.dropdownSelectedName}>
                    {selectedCandidate ? selectedCandidate.name : 'Choose a student...'}
                  </Text>
                  <Text style={styles.dropdownSelectedMeta}>
                    {selectedCandidate
                      ? `Status: ${selectedCandidate.status} · ${context?.program || 'Therapy'}`
                      : 'Click to select from enrollment caseload'}
                  </Text>
                </View>
              </View>
              <Feather
                name={studentDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.bodyText}
              />
            </TouchableOpacity>
          </View>

          {/* Dropdown Menu */}
          {studentDropdownOpen && (
            <View style={styles.dropdownMenu}>
              <View style={styles.dropdownSearchWrap}>
                <Feather name="search" size={14} color={colors.mutedText} />
                <TextInput
                  style={styles.dropdownSearchInput}
                  placeholder="Search students by name..."
                  placeholderTextColor={colors.mutedText}
                  value={searchStudentText}
                  onChangeText={setSearchStudentText}
                />
              </View>
              <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                {filteredCandidates.map((c) => {
                  const isSelected = c.id === selectedStudentId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                      onPress={() => {
                        setSelectedStudentId(c.id);
                        setStudentDropdownOpen(false);
                        setSearchStudentText('');
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                          {c.name}
                        </Text>
                        <Text style={styles.dropdownItemSub}>
                          {c.status} · {c.program || 'ABA Therapy'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          c.status === 'Active' ? styles.statusActive : styles.statusPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            c.status === 'Active' ? styles.statusActiveText : styles.statusPendingText,
                          ]}
                        >
                          {c.status}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Workbench Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeWorkbenchTab === 'goals' && styles.tabBtnActive]}
            onPress={() => setActiveWorkbenchTab('goals')}
          >
            <Feather
              name="target"
              size={15}
              color={activeWorkbenchTab === 'goals' ? colors.navyText : colors.bodyText}
            />
            <Text style={[styles.tabBtnText, activeWorkbenchTab === 'goals' && styles.tabBtnTextActive]}>
              Goal Assignment ({assignedGoalCount}/4)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeWorkbenchTab === 'assessment' && styles.tabBtnActive]}
            onPress={() => setActiveWorkbenchTab('assessment')}
          >
            <Feather
              name="activity"
              size={15}
              color={activeWorkbenchTab === 'assessment' ? colors.navyText : colors.bodyText}
            />
            <Text style={[styles.tabBtnText, activeWorkbenchTab === 'assessment' && styles.tabBtnTextActive]}>
              Assessment Summary
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeWorkbenchTab === 'strategies' && styles.tabBtnActive]}
            onPress={() => setActiveWorkbenchTab('strategies')}
          >
            <Feather
              name="sliders"
              size={15}
              color={activeWorkbenchTab === 'strategies' ? colors.navyText : colors.bodyText}
            />
            <Text style={[styles.tabBtnText, activeWorkbenchTab === 'strategies' && styles.tabBtnTextActive]}>
              Implementation & Protocols
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: GOAL ASSIGNMENT */}
        {activeWorkbenchTab === 'goals' && (
          <View style={styles.tabContentWrap}>
            {/* Station 1 Card */}
            <View style={styles.card}>
              <View style={styles.stationHeader}>
                <View style={styles.stationNumberBadge}>
                  <Text style={styles.stationNumberText}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Station 1 — Basic Skills</Text>
                  <Text style={styles.stationSub}>Foundational acquisition, receptive language, and early imitation</Text>
                </View>
              </View>

              <View style={styles.slotList}>
                {slots.station1.map((goal, idx) => (
                  <View key={`s1-${idx}`} style={styles.slotContainer}>
                    <Text style={styles.slotTag}>Slot {idx + 1}</Text>
                    {goal ? (
                      <View style={styles.filledGoalCard}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.goalTitleRow}>
                            <Text style={styles.goalName}>{goal.name}</Text>
                            <View style={styles.domainChip}>
                              <Text style={styles.domainChipText}>{goal.domain}</Text>
                            </View>
                            {goal.goalType === 'task_analysis' && (
                              <View style={styles.taskChip}>
                                <Text style={styles.taskChipText}>Task Analysis</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.goalDesc} numberOfLines={2}>
                            {goal.description}
                          </Text>
                          <View style={styles.masteryRow}>
                            <Feather name="check-circle" size={12} color={colors.successGreen} />
                            <Text style={styles.masteryText}>Mastery Criteria: {goal.masteryCriteria}</Text>
                          </View>
                        </View>
                        <View style={styles.goalActions}>
                          <TouchableOpacity
                            style={styles.changeGoalBtn}
                            onPress={() => setSelectorTarget({ station: 'station1', slotIndex: idx })}
                          >
                            <Feather name="refresh-cw" size={14} color={colors.navyText} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.removeGoalBtn}
                            onPress={() => handleRemoveGoal('station1', idx)}
                          >
                            <Feather name="trash-2" size={14} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.emptyGoalSlot}
                        onPress={() => setSelectorTarget({ station: 'station1', slotIndex: idx })}
                      >
                        <View style={styles.plusIconWrap}>
                          <Feather name="plus" size={16} color={colors.navyText} />
                        </View>
                        <Text style={styles.emptySlotText}>Assign Goal from Goal Bank</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* Station 2 Card */}
            <View style={styles.card}>
              <View style={styles.stationHeader}>
                <View style={[styles.stationNumberBadge, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={[styles.stationNumberText, { color: '#1E40AF' }]}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Station 2 — Advanced Skills</Text>
                  <Text style={styles.stationSub}>Expressive language, academic readiness, and generalization</Text>
                </View>
              </View>

              <View style={styles.slotList}>
                {slots.station2.map((goal, idx) => (
                  <View key={`s2-${idx}`} style={styles.slotContainer}>
                    <Text style={styles.slotTag}>Slot {idx + 1}</Text>
                    {goal ? (
                      <View style={styles.filledGoalCard}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.goalTitleRow}>
                            <Text style={styles.goalName}>{goal.name}</Text>
                            <View style={styles.domainChip}>
                              <Text style={styles.domainChipText}>{goal.domain}</Text>
                            </View>
                            {goal.goalType === 'task_analysis' && (
                              <View style={styles.taskChip}>
                                <Text style={styles.taskChipText}>Task Analysis</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.goalDesc} numberOfLines={2}>
                            {goal.description}
                          </Text>
                          <View style={styles.masteryRow}>
                            <Feather name="check-circle" size={12} color={colors.successGreen} />
                            <Text style={styles.masteryText}>Mastery Criteria: {goal.masteryCriteria}</Text>
                          </View>
                        </View>
                        <View style={styles.goalActions}>
                          <TouchableOpacity
                            style={styles.changeGoalBtn}
                            onPress={() => setSelectorTarget({ station: 'station2', slotIndex: idx })}
                          >
                            <Feather name="refresh-cw" size={14} color={colors.navyText} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.removeGoalBtn}
                            onPress={() => handleRemoveGoal('station2', idx)}
                          >
                            <Feather name="trash-2" size={14} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.emptyGoalSlot}
                        onPress={() => setSelectorTarget({ station: 'station2', slotIndex: idx })}
                      >
                        <View style={styles.plusIconWrap}>
                          <Feather name="plus" size={16} color={colors.navyText} />
                        </View>
                        <Text style={styles.emptySlotText}>Assign Goal from Goal Bank</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: ASSESSMENT SUMMARY */}
        {activeWorkbenchTab === 'assessment' && (
          <View style={styles.tabContentWrap}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Student Demographics & Intake Context</Text>
              <View style={styles.demoGrid}>
                <View style={styles.demoItem}>
                  <Text style={styles.demoLabel}>Student Name</Text>
                  <Text style={styles.demoValue}>{context?.studentName || selectedCandidate?.name || '—'}</Text>
                </View>
                <View style={styles.demoItem}>
                  <Text style={styles.demoLabel}>Age / DOB</Text>
                  <Text style={styles.demoValue}>Age {context?.age ?? selectedCandidate?.age ?? '—'} · {context?.dob || '—'}</Text>
                </View>
                <View style={styles.demoItem}>
                  <Text style={styles.demoLabel}>Program</Text>
                  <Text style={styles.demoValue}>{context?.program || selectedCandidate?.program || 'ABA Therapy'}</Text>
                </View>
                <View style={styles.demoItem}>
                  <Text style={styles.demoLabel}>Enrolled Date</Text>
                  <Text style={styles.demoValue}>{context?.enrollmentDate || '—'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Baseline Assessment Strengths & Needs</Text>

              <View style={styles.contextSection}>
                <View style={styles.contextHeaderRow}>
                  <Feather name="award" size={15} color={colors.primaryYellowDark} />
                  <Text style={styles.contextSectionTitle}>Skills & Strengths</Text>
                </View>
                <Text style={styles.contextText}>
                  {context?.skillsStrengths ||
                    'Demonstrates strong visual-spatial matching, basic receptive identification of familiar items, and cooperative response to high-preference items.'}
                </Text>
              </View>

              <View style={styles.contextSection}>
                <View style={styles.contextHeaderRow}>
                  <Feather name="alert-triangle" size={15} color="#EF4444" />
                  <Text style={styles.contextSectionTitle}>Behavioral Functions & Triggers</Text>
                </View>
                <Text style={styles.contextText}>
                  {context?.behaviorFunctions ||
                    'Primary function is escape/avoidance of novel non-preferred motor tasks. Exhibits mild vocal protest when demands escalate.'}
                </Text>
              </View>

              <View style={styles.contextSection}>
                <View style={styles.contextHeaderRow}>
                  <Feather name="star" size={15} color="#F59E0B" />
                  <Text style={styles.contextSectionTitle}>Top Reinforcement Inventory</Text>
                </View>
                <View style={styles.reinforcerChipsWrap}>
                  {(context?.topReinforcers || ['Bubbles', 'Musical Toy', 'Token Stars', 'Edible Treat', 'Spinning Wheel']).map((r, i) => (
                    <View key={i} style={styles.reinforcerChip}>
                      <Text style={styles.reinforcerRank}>#{i + 1}</Text>
                      <Text style={styles.reinforcerChipText}>{r}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.contextSection}>
                <View style={styles.contextHeaderRow}>
                  <Feather name="feather" size={15} color="#8B5CF6" />
                  <Text style={styles.contextSectionTitle}>Sensory Engagement Profile</Text>
                </View>
                <Text style={styles.contextText}>
                  {context?.sensorySummary ||
                    'Calmed by deep pressure stimulation. Benefits from scheduled 3-minute sensory gross motor movement between trial rounds.'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* TAB 3: IMPLEMENTATION STRATEGIES & PROTOCOLS */}
        {activeWorkbenchTab === 'strategies' && (
          <View style={styles.tabContentWrap}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Implementation Strategy Configuration</Text>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Reinforcement Schedule & Prompt Fading</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={reinforcementSchedule}
                  onChangeText={setReinforcementSchedule}
                  placeholder="e.g. FR-1 transitioning to VR-3 upon 80% accuracy"
                  placeholderTextColor={colors.mutedText}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Environmental Accommodations & Visual Supports</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={accommodations}
                  onChangeText={setAccommodations}
                  placeholder="e.g. Visual timer, quiet study cubicle, token board"
                  placeholderTextColor={colors.mutedText}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Crisis De-escalation Protocol</Text>
                <TextInput
                  style={[styles.fieldInput, styles.fieldTextArea]}
                  value={crisisProtocol}
                  onChangeText={setCrisisProtocol}
                  multiline
                  placeholder="Steps to take during behavioral escalation..."
                  placeholderTextColor={colors.mutedText}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Clinical Progress Review Cycle</Text>
                <View style={styles.cycleRow}>
                  {['4 Weeks', '6 Weeks', '8 Weeks', 'Quarterly'].map((cycle) => (
                    <TouchableOpacity
                      key={cycle}
                      style={[styles.cycleChip, reviewCycle === cycle && styles.cycleChipSelected]}
                      onPress={() => setReviewCycle(cycle)}
                    >
                      <Text
                        style={[styles.cycleChipText, reviewCycle === cycle && styles.cycleChipTextSelected]}
                      >
                        {cycle}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <DynamicFormFields
                formName="IUP Form"
                values={customIupValues}
                onChange={(key, val) => setCustomIupValues((prev) => ({ ...prev, [key]: val }))}
                excludeStandardLabels={[
                  'Student Name',
                  'Target Skill Domain',
                  'Baseline Mastery (%)',
                  'Target Objective',
                  'Environmental Accommodations & Visual Supports',
                  'Crisis De-escalation Protocol',
                ]}
              />
            </View>
          </View>
        )}

        {/* Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.saveDraftBtn} onPress={handleDraftSave}>
            <Feather name="save" size={15} color={colors.navyText} />
            <Text style={styles.saveDraftBtnText}>Save Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.previewBtn} onPress={() => setPreviewOpen(true)}>
            <Feather name="eye" size={15} color={colors.navyText} />
            <Text style={styles.previewBtnText}>Full Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.finalizeBtn} onPress={handleFinalize}>
            <Feather name="check-circle" size={16} color={colors.navyText} />
            <Text style={styles.finalizeBtnText}>Finalize & Activate IUP</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* GOAL SELECTOR MODAL */}
      <Modal visible={!!selectorTarget} animationType="slide" transparent onRequestClose={() => setSelectorTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Goal Bank Selection</Text>
                <Text style={styles.modalSub}>
                  Assigning to {selectorTarget?.station === 'station1' ? 'Station 1 (Basic)' : 'Station 2 (Advanced)'} · Slot {(selectorTarget?.slotIndex ?? 0) + 1}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectorTarget(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={20} color={colors.navyText} />
              </TouchableOpacity>
            </View>

            {/* Search and Domain Filters */}
            <View style={styles.modalSearchRow}>
              <Feather name="search" size={14} color={colors.mutedText} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search goals by name or skill area..."
                placeholderTextColor={colors.mutedText}
                value={goalSearch}
                onChangeText={setGoalSearch}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {['All', 'Communication', 'Motor', 'Social', 'Self-Help', 'Cognition'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.domainFilterChip, domainFilter === d && styles.domainFilterChipActive]}
                  onPress={() => setDomainFilter(d)}
                >
                  <Text
                    style={[styles.domainFilterText, domainFilter === d && styles.domainFilterTextActive]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={{ maxHeight: 360 }}>
              {filteredGoals.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={styles.goalCardOption}
                  onPress={() => handleSelectGoal(g)}
                  activeOpacity={0.7}
                >
                  <View style={styles.goalOptionHeader}>
                    <Text style={styles.goalOptionName}>{g.name}</Text>
                    <View style={styles.domainChip}>
                      <Text style={styles.domainChipText}>{g.domain}</Text>
                    </View>
                  </View>
                  <Text style={styles.goalOptionDesc}>{g.description}</Text>
                  <View style={styles.goalOptionFooter}>
                    <Text style={styles.masteryCriteriaBadge}>Mastery: {g.masteryCriteria}</Text>
                    {g.goalType === 'task_analysis' && (
                      <View style={styles.taskChip}>
                        <Text style={styles.taskChipText}>Task Analysis</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              {filteredGoals.length === 0 && (
                <View style={styles.emptyResults}>
                  <Text style={styles.emptyResultsText}>No goals found matching your search filter.</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectorTarget(null)}>
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FULL IUP PREVIEW MODAL */}
      <Modal visible={previewOpen} animationType="slide" transparent onRequestClose={() => setPreviewOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  IUP Preview — {context?.studentName || selectedCandidate?.name || 'Student'}
                </Text>
                <Text style={styles.modalSub}>Individualized Behavior Intervention Plan Document</Text>
              </View>
              <TouchableOpacity onPress={() => setPreviewOpen(false)}>
                <Feather name="x" size={20} color={colors.navyText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.sm }}>
              <View style={styles.previewCard}>
                <Text style={styles.previewSectionTitle}>Student & Demographic Baseline</Text>
                <Text style={styles.previewText}>Age: {context?.age ?? selectedCandidate?.age ?? '—'} · DOB: {context?.dob || '—'}</Text>
                <Text style={styles.previewText}>Program: {context?.program || selectedCandidate?.program || 'ABA Therapy'} · Enrolled: {context?.enrollmentDate || '—'}</Text>
              </View>

              <View style={styles.previewCard}>
                <Text style={styles.previewSectionTitle}>Clinical Assessment Summary</Text>
                <Text style={styles.previewLabel}>Skills Strengths:</Text>
                <Text style={styles.previewText}>{context?.skillsStrengths || 'Strong visual matching and receptive skills.'}</Text>
                <Text style={styles.previewLabel}>Behavioral Functions:</Text>
                <Text style={styles.previewText}>{context?.behaviorFunctions || 'Escape-maintained during task transitions.'}</Text>
                <Text style={styles.previewLabel}>Top Reinforcers:</Text>
                <Text style={styles.previewText}>{(context?.topReinforcers || ['Bubbles', 'Musical Toy', 'Token Stars']).join(', ')}</Text>
              </View>

              <View style={styles.previewCard}>
                <Text style={styles.previewSectionTitle}>Assigned Target Goals</Text>
                <Text style={styles.previewLabel}>Station 1 (Basic Skills):</Text>
                {slots.station1.map((g, i) =>
                  g ? (
                    <Text key={i} style={styles.previewGoalLine}>
                      {i + 1}. {g.name} ({g.domain}) — {g.masteryCriteria}
                    </Text>
                  ) : null
                )}
                <Text style={[styles.previewLabel, { marginTop: spacing.sm }]}>Station 2 (Advanced Skills):</Text>
                {slots.station2.map((g, i) =>
                  g ? (
                    <Text key={i} style={styles.previewGoalLine}>
                      {i + 1}. {g.name} ({g.domain}) — {g.masteryCriteria}
                    </Text>
                  ) : null
                )}
              </View>

              <View style={styles.previewCard}>
                <Text style={styles.previewSectionTitle}>Implementation & Protocols</Text>
                <Text style={styles.previewLabel}>Reinforcement Schedule:</Text>
                <Text style={styles.previewText}>{reinforcementSchedule}</Text>
                <Text style={styles.previewLabel}>Accommodations:</Text>
                <Text style={styles.previewText}>{accommodations}</Text>
                <Text style={styles.previewLabel}>Crisis Protocol:</Text>
                <Text style={styles.previewText}>{crisisProtocol}</Text>
              </View>
            </ScrollView>

            <View style={styles.previewFooter}>
              <TouchableOpacity style={styles.previewCloseBtn} onPress={() => setPreviewOpen(false)}>
                <Text style={styles.previewCloseBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.previewExportBtn}
                onPress={() => {
                  setPreviewOpen(false);
                  handleExport();
                }}
              >
                <Feather name="printer" size={14} color={colors.navyText} />
                <Text style={styles.previewExportBtnText}>Export / Print Document</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EXPORT / PRINT PREVIEW MODAL */}
      <ExportPreviewModal
        visible={!!exportContent}
        title={`IUP Document — ${context?.studentName || selectedCandidate?.name || 'Student'}`}
        filename={`${(context?.studentName || selectedCandidate?.name || 'Student').replace(/\s+/g, '_')}_IUP.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 60 },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 280 },
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
  headerRightActions: { flexDirection: 'row', gap: spacing.sm },
  headerOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerOutlineBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.bodyText, letterSpacing: 0.8 },
  selectorHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastSavedText: { fontSize: 11, color: colors.successGreen, fontWeight: '500' },

  dropdownTriggerRow: { marginTop: spacing.xs },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
  },
  dropdownTriggerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  dropdownSelectedName: { fontSize: 15, fontWeight: '700', color: colors.navyText },
  dropdownSelectedMeta: { fontSize: 12, color: colors.bodyText, marginTop: 2 },

  dropdownMenu: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  dropdownSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgApp,
  },
  dropdownSearchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.navyText,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  dropdownItemActive: { backgroundColor: '#FEF9C3' },
  dropdownItemText: { fontSize: 14, fontWeight: '600', color: colors.navyText },
  dropdownItemTextActive: { color: colors.navyText, fontWeight: '700' },
  dropdownItemSub: { fontSize: 11, color: colors.mutedText, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusActiveText: { fontSize: 10, fontWeight: '700', color: '#166534' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusPendingText: { fontSize: 10, fontWeight: '700', color: '#B45309' },

  /* Workbench Tabs */
  tabContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  tabBtnActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellowDark,
  },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: colors.bodyText },
  tabBtnTextActive: { color: colors.navyText, fontWeight: '700' },
  tabContentWrap: { gap: spacing.lg },

  /* Station Cards & Goal Slots */
  stationHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stationNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationNumberText: { fontSize: 15, fontWeight: '700', color: colors.navyText },
  stationSub: { fontSize: 12, color: colors.bodyText, marginTop: 2 },

  slotList: { gap: spacing.md },
  slotContainer: { gap: spacing.xs },
  slotTag: { fontSize: 11, fontWeight: '700', color: colors.mutedText, textTransform: 'uppercase' },
  filledGoalCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  goalName: { fontSize: 14, fontWeight: '700', color: colors.navyText },
  domainChip: { backgroundColor: '#E0E7FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  domainChipText: { fontSize: 10, fontWeight: '700', color: '#3730A3' },
  taskChip: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  taskChipText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  goalDesc: { fontSize: 12, color: colors.bodyText, marginTop: 4 },
  masteryRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  masteryText: { fontSize: 11, fontWeight: '600', color: colors.bodyText },

  goalActions: { flexDirection: 'row', gap: spacing.xs },
  changeGoalBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeGoalBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyGoalSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.bgCard,
  },
  plusIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotText: { fontSize: 13, fontWeight: '600', color: colors.navyText },

  /* Assessment Summary Tab */
  demoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  demoItem: { flexGrow: 1, minWidth: 160, backgroundColor: colors.bgApp, padding: spacing.md, borderRadius: radius.md },
  demoLabel: { fontSize: 11, fontWeight: '600', color: colors.mutedText },
  demoValue: { fontSize: 13, fontWeight: '700', color: colors.navyText, marginTop: 2 },
  contextSection: { paddingVertical: spacing.xs, gap: spacing.xs },
  contextHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  contextSectionTitle: { fontSize: 13, fontWeight: '700', color: colors.navyText },
  contextText: { fontSize: 13, color: colors.bodyText, lineHeight: 18 },
  reinforcerChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 4 },
  reinforcerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  reinforcerRank: { fontSize: 10, fontWeight: '700', color: colors.primaryYellowDark },
  reinforcerChipText: { fontSize: 12, fontWeight: '600', color: colors.navyText },

  /* Strategies Tab */
  fieldBlock: { gap: spacing.xs },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.navyText },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
    color: colors.navyText,
    fontSize: 13,
  },
  fieldTextArea: { minHeight: 80, textAlignVertical: 'top' },
  cycleRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  cycleChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgApp,
  },
  cycleChipSelected: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellowDark,
  },
  cycleChipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  cycleChipTextSelected: { color: colors.navyText, fontWeight: '700' },

  /* Bottom Actions Bar */
  bottomBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  saveDraftBtnText: { fontSize: 13, fontWeight: '700', color: colors.navyText },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  previewBtnText: { fontSize: 13, fontWeight: '700', color: colors.navyText },
  finalizeBtn: {
    flex: 1,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  finalizeBtnText: { fontSize: 14, fontWeight: '700', color: colors.navyText },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.navyText },
  modalSub: { fontSize: 12, color: colors.mutedText, marginTop: 2 },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalSearchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 13, color: colors.navyText },
  chipScroll: { maxHeight: 36 },
  domainFilterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    backgroundColor: colors.bgApp,
  },
  domainFilterChipActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellowDark,
  },
  domainFilterText: { fontSize: 11, fontWeight: '600', color: colors.bodyText },
  domainFilterTextActive: { color: colors.navyText, fontWeight: '700' },
  goalCardOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 4,
    backgroundColor: colors.bgCard,
  },
  goalOptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalOptionName: { fontSize: 14, fontWeight: '700', color: colors.navyText, flex: 1 },
  goalOptionDesc: { fontSize: 12, color: colors.bodyText },
  goalOptionFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  masteryCriteriaBadge: { fontSize: 11, color: colors.bodyText, fontWeight: '500' },
  emptyResults: { padding: spacing.xl, alignItems: 'center' },
  emptyResultsText: { fontSize: 13, color: colors.mutedText },
  closeModalBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  closeModalBtnText: { fontWeight: '600', color: colors.navyText },

  /* Preview Modal Details */
  previewCard: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  previewSectionTitle: { fontSize: 14, fontWeight: '700', color: colors.navyText, marginBottom: 4 },
  previewLabel: { fontSize: 12, fontWeight: '700', color: colors.navyText, marginTop: 4 },
  previewText: { fontSize: 12, color: colors.bodyText },
  previewGoalLine: { fontSize: 12, color: colors.navyText, paddingLeft: spacing.sm, marginTop: 2 },
  previewFooter: { flexDirection: 'row', gap: spacing.sm },
  previewCloseBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  previewCloseBtnText: { fontWeight: '600', color: colors.navyText },
  previewExportBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  previewExportBtnText: { fontWeight: '700', color: colors.navyText },
});

