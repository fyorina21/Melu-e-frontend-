import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import ExportPreviewModal from '../../../components/ExportPreviewModal';
import AppNavbar from '../../../components/AppNavbar';
import DynamicFormFields from '../../../components/DynamicFormFields';

export interface GoalBankItem {
  id: string;
  name: string;
  domain: string;
  description: string;
  goalType: string;
  masteryCriteria: string;
  active?: boolean;
}

export interface IupCandidate {
  id: string;
  studentId?: string;
  iupId?: string;
  name: string;
  status: string;
  program?: string;
  age?: number;
  assessmentProgress?: number;
  assessmentStatus?: string;
  hasAssessmentData?: boolean;
}

export interface IupContext {
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

export type StationKey = 'station1' | 'station2';
export type Slots = Record<StationKey, (GoalBankItem | null)[]>;

export interface IupGenerationPresenterProps {
  candidates: IupCandidate[];
  completedCandidates: IupCandidate[];
  filteredCandidates: IupCandidate[];
  selectedCandidate: IupCandidate | null;
  selectedStudentId: string | null;
  context: IupContext | null;
  slots: Slots;
  activeWorkbenchTab: 'assessment' | 'goals' | 'strategies';
  reinforcementSchedule: string;
  crisisProtocol: string;
  accommodations: string;
  reviewCycle: string;
  customIupValues: Record<string, any>;
  studentDropdownOpen: boolean;
  searchStudentText: string;
  selectorTarget: { station: StationKey; slotIndex: number } | null;
  goalSearch: string;
  domainFilter: string;
  filteredGoals: GoalBankItem[];
  previewOpen: boolean;
  exportContent: string | null;
  lastSavedTimestamp: string | null;
  onSelectStudent: (id: string) => void;
  onToggleDropdown: () => void;
  onSearchStudent: (text: string) => void;
  onTabChange: (tab: 'assessment' | 'goals' | 'strategies') => void;
  onOpenGoalSelector: (station: StationKey, slotIndex: number) => void;
  onCloseGoalSelector: () => void;
  onSelectGoal: (goal: GoalBankItem) => void;
  onRemoveGoal: (station: StationKey, slotIndex: number) => void;
  onDraftSave: () => void;
  onFinalize: () => void;
  onOpenPreview: () => void;
  onClosePreview: () => void;
  onExport: () => void;
  onCloseExport: () => void;
  onReinforcementScheduleChange: (val: string) => void;
  onCrisisProtocolChange: (val: string) => void;
  onAccommodationsChange: (val: string) => void;
  onReviewCycleChange: (val: string) => void;
  onCustomIupValuesChange: (key: string, val: any) => void;
  onGoalSearchChange: (text: string) => void;
  onDomainFilterChange: (domain: string) => void;
  onNavbarTabPress: (tab: string) => void;
}

export default function IupGenerationPresenter({
  completedCandidates: _completedCandidates,
  filteredCandidates,
  selectedCandidate,
  selectedStudentId,
  context,
  slots,
  activeWorkbenchTab,
  reinforcementSchedule,
  crisisProtocol,
  accommodations,
  reviewCycle,
  customIupValues,
  studentDropdownOpen,
  searchStudentText,
  selectorTarget,
  goalSearch,
  domainFilter,
  filteredGoals,
  previewOpen,
  exportContent,
  lastSavedTimestamp,
  onSelectStudent,
  onToggleDropdown,
  onSearchStudent,
  onTabChange,
  onOpenGoalSelector,
  onCloseGoalSelector,
  onSelectGoal,
  onRemoveGoal,
  onDraftSave,
  onFinalize,
  onOpenPreview,
  onClosePreview,
  onExport,
  onCloseExport,
  onReinforcementScheduleChange,
  onCrisisProtocolChange,
  onAccommodationsChange,
  onReviewCycleChange,
  onCustomIupValuesChange,
  onGoalSearchChange,
  onDomainFilterChange,
  onNavbarTabPress,
}: IupGenerationPresenterProps) {
  const assignedGoalCount = [...slots.station1, ...slots.station2].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="IUP Creation & Goal Assignment" onTabPress={onNavbarTabPress} />

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
            <TouchableOpacity style={styles.headerOutlineBtn} onPress={onOpenPreview}>
              <Feather name="eye" size={14} color={colors.navyText} />
              <Text style={styles.headerOutlineBtnText}>Preview IUP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerOutlineBtn} onPress={onExport}>
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
                <Feather name="check" size={11} color={colors.successGreen} /> Draft saved at{' '}
                {lastSavedTimestamp}
              </Text>
            )}
          </View>

          <View style={styles.dropdownTriggerRow}>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={onToggleDropdown}
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
                      ? `${selectedCandidate.assessmentStatus ?? selectedCandidate.status} · ${context?.program || 'Therapy'}`
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
                  onChangeText={onSearchStudent}
                />
              </View>
              <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                {filteredCandidates.length === 0 ? (
                  <Text style={styles.dropdownEmptyText}>No students ready for IUP</Text>
                ) : (
                  filteredCandidates.map((c) => {
                    const isSelected = c.id === selectedStudentId;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                        onPress={() => onSelectStudent(c.id)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.dropdownItemText,
                              isSelected && styles.dropdownItemTextActive,
                            ]}
                          >
                            {c.name}
                          </Text>
                          <Text style={styles.dropdownItemSub}>
                            {c.assessmentStatus ?? c.status} · {c.program || 'ABA Therapy'}
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
                              c.status === 'Active'
                                ? styles.statusActiveText
                                : styles.statusPendingText,
                            ]}
                          >
                            {c.status}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Workbench Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeWorkbenchTab === 'goals' && styles.tabBtnActive]}
            onPress={() => onTabChange('goals')}
          >
            <Feather
              name="target"
              size={15}
              color={activeWorkbenchTab === 'goals' ? colors.navyText : colors.bodyText}
            />
            <Text
              style={[styles.tabBtnText, activeWorkbenchTab === 'goals' && styles.tabBtnTextActive]}
            >
              Goal Assignment ({assignedGoalCount}/4)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeWorkbenchTab === 'assessment' && styles.tabBtnActive]}
            onPress={() => onTabChange('assessment')}
          >
            <Feather
              name="activity"
              size={15}
              color={activeWorkbenchTab === 'assessment' ? colors.navyText : colors.bodyText}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeWorkbenchTab === 'assessment' && styles.tabBtnTextActive,
              ]}
            >
              Assessment Summary
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeWorkbenchTab === 'strategies' && styles.tabBtnActive]}
            onPress={() => onTabChange('strategies')}
          >
            <Feather
              name="sliders"
              size={15}
              color={activeWorkbenchTab === 'strategies' ? colors.navyText : colors.bodyText}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeWorkbenchTab === 'strategies' && styles.tabBtnTextActive,
              ]}
            >
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
                  <Text style={styles.stationSub}>
                    Foundational acquisition, receptive language, and early imitation
                  </Text>
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
                            <Text style={styles.masteryText}>
                              Mastery Criteria: {goal.masteryCriteria}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.goalActions}>
                          <TouchableOpacity
                            style={styles.changeGoalBtn}
                            onPress={() => onOpenGoalSelector('station1', idx)}
                          >
                            <Feather name="refresh-cw" size={14} color={colors.navyText} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.removeGoalBtn}
                            onPress={() => onRemoveGoal('station1', idx)}
                          >
                            <Feather name="trash-2" size={14} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.emptyGoalSlot}
                        onPress={() => onOpenGoalSelector('station1', idx)}
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
                  <Text style={styles.stationSub}>
                    Expressive language, academic readiness, and generalization
                  </Text>
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
                            <Text style={styles.masteryText}>
                              Mastery Criteria: {goal.masteryCriteria}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.goalActions}>
                          <TouchableOpacity
                            style={styles.changeGoalBtn}
                            onPress={() => onOpenGoalSelector('station2', idx)}
                          >
                            <Feather name="refresh-cw" size={14} color={colors.navyText} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.removeGoalBtn}
                            onPress={() => onRemoveGoal('station2', idx)}
                          >
                            <Feather name="trash-2" size={14} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.emptyGoalSlot}
                        onPress={() => onOpenGoalSelector('station2', idx)}
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
                  <Text style={styles.demoValue}>
                    {context?.studentName || selectedCandidate?.name || '—'}
                  </Text>
                </View>
                <View style={styles.demoItem}>
                  <Text style={styles.demoLabel}>Age / DOB</Text>
                  <Text style={styles.demoValue}>
                    Age {context?.age ?? selectedCandidate?.age ?? '—'} · {context?.dob || '—'}
                  </Text>
                </View>
                <View style={styles.demoItem}>
                  <Text style={styles.demoLabel}>Program</Text>
                  <Text style={styles.demoValue}>
                    {context?.program || selectedCandidate?.program || 'ABA Therapy'}
                  </Text>
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
                  {(
                    context?.topReinforcers || [
                      'Bubbles',
                      'Musical Toy',
                      'Token Stars',
                      'Edible Treat',
                      'Spinning Wheel',
                    ]
                  ).map((r, i) => (
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
                  onChangeText={onReinforcementScheduleChange}
                  placeholder="e.g. FR-1 transitioning to VR-3 upon 80% accuracy"
                  placeholderTextColor={colors.mutedText}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  Environmental Accommodations & Visual Supports
                </Text>
                <TextInput
                  style={styles.fieldInput}
                  value={accommodations}
                  onChangeText={onAccommodationsChange}
                  placeholder="e.g. Visual timer, quiet study cubicle, token board"
                  placeholderTextColor={colors.mutedText}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Crisis De-escalation Protocol</Text>
                <TextInput
                  style={[styles.fieldInput, styles.fieldTextArea]}
                  value={crisisProtocol}
                  onChangeText={onCrisisProtocolChange}
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
                      onPress={() => onReviewCycleChange(cycle)}
                    >
                      <Text
                        style={[
                          styles.cycleChipText,
                          reviewCycle === cycle && styles.cycleChipTextSelected,
                        ]}
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
                onChange={onCustomIupValuesChange}
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
          <TouchableOpacity style={styles.saveDraftBtn} onPress={onDraftSave}>
            <Feather name="save" size={15} color={colors.navyText} />
            <Text style={styles.saveDraftBtnText}>Save Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.previewBtn} onPress={onOpenPreview}>
            <Feather name="eye" size={15} color={colors.navyText} />
            <Text style={styles.previewBtnText}>Full Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.finalizeBtn} onPress={onFinalize}>
            <Feather name="check-circle" size={16} color={colors.navyText} />
            <Text style={styles.finalizeBtnText}>Finalize & Activate IUP</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* GOAL SELECTOR MODAL */}
      <Modal
        visible={!!selectorTarget}
        animationType="slide"
        transparent
        onRequestClose={onCloseGoalSelector}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Goal Bank Selection</Text>
                <Text style={styles.modalSub}>
                  Assigning to{' '}
                  {selectorTarget?.station === 'station1'
                    ? 'Station 1 (Basic)'
                    : 'Station 2 (Advanced)'}{' '}
                  · Slot {(selectorTarget?.slotIndex ?? 0) + 1}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onCloseGoalSelector}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
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
                onChangeText={onGoalSearchChange}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {['All', 'Communication', 'Motor', 'Social', 'Self-Help', 'Cognition'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.domainFilterChip,
                    domainFilter === d && styles.domainFilterChipActive,
                  ]}
                  onPress={() => onDomainFilterChange(d)}
                >
                  <Text
                    style={[
                      styles.domainFilterText,
                      domainFilter === d && styles.domainFilterTextActive,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Goal Bank List */}
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {filteredGoals.length === 0 ? (
                <View style={styles.modalEmptyWrap}>
                  <Text style={styles.modalEmptyText}>No active goals match the search</Text>
                </View>
              ) : (
                filteredGoals.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={styles.modalGoalItem}
                    onPress={() => onSelectGoal(g)}
                  >
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={styles.modalGoalName}>{g.name}</Text>
                        <View style={styles.domainChip}>
                          <Text style={styles.domainChipText}>{g.domain}</Text>
                        </View>
                      </View>
                      <Text style={styles.modalGoalDesc} numberOfLines={2}>
                        {g.description}
                      </Text>
                      <Text style={styles.modalGoalMastery}>
                        Target Mastery: {g.masteryCriteria}
                      </Text>
                    </View>
                    <Feather name="plus-circle" size={18} color={colors.navyText} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EXPORT / PRINT PREVIEW MODAL */}
      <ExportPreviewModal
        visible={previewOpen || !!exportContent}
        title={`Individualized Unit Plan — ${context?.studentName || selectedCandidate?.name || 'Student'}`}
        filename={`IUP_${(context?.studentName || selectedCandidate?.name || 'Student').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`}
        content={exportContent || ''}
        formId="FRM-IUP-001"
        revisionNumber="Rev 1.8 · 2026-09-19"
        pageNumber={1}
        totalPages={2}
        onClose={() => {
          onClosePreview();
          onCloseExport();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navyText,
  },
  pageSubtitle: {
    fontSize: 13,
    color: colors.bodyText,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  headerOutlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  selectorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.5,
  },
  lastSavedText: {
    fontSize: 12,
    color: colors.successGreen,
    fontWeight: '600',
  },
  dropdownTriggerRow: {
    position: 'relative',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  dropdownSelectedName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  dropdownSelectedMeta: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 1,
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  dropdownSearchInput: {
    fontSize: 13,
    color: colors.navyText,
    flex: 1,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: {
    backgroundColor: '#FEF9C3',
    borderRadius: radius.xs ?? radius.sm,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navyText,
  },
  dropdownItemTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
  dropdownEmptyText: {
    fontSize: 13,
    color: colors.mutedText,
    textAlign: 'center',
    paddingVertical: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#FEF08A',
    borderColor: '#FACC15',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.bodyText,
  },
  tabBtnTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
  tabContentWrap: {
    marginBottom: spacing.md,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.md,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stationNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navyText,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  stationSub: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  slotList: {
    gap: 12,
  },
  slotContainer: {
    gap: 4,
  },
  slotTag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  filledGoalCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    padding: 12,
    gap: 12,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
  domainChip: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  domainChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  taskChip: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  taskChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  goalDesc: {
    fontSize: 12,
    color: colors.bodyText,
    marginBottom: 6,
    lineHeight: 18,
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  masteryText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.successGreen,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 6,
  },
  changeGoalBtn: {
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  removeGoalBtn: {
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emptyGoalSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingVertical: 18,
  },
  plusIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
  },
  demoItem: {
    minWidth: 180,
    flex: 1,
  },
  demoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  demoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navyText,
    marginTop: 2,
  },
  contextSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  contextHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  contextSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  contextText: {
    fontSize: 13,
    color: colors.bodyText,
    lineHeight: 20,
  },
  reinforcerChipsWrap: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  reinforcerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  reinforcerRank: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  reinforcerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.navyText,
  },
  fieldTextArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  cycleRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  cycleChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  cycleChipSelected: {
    backgroundColor: '#FEF08A',
  },
  cycleChipText: {
    fontSize: 12,
    color: colors.bodyText,
    fontWeight: '600',
  },
  cycleChipTextSelected: {
    color: colors.navyText,
    fontWeight: '700',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  saveDraftBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  previewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  finalizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF08A',
    borderWidth: 1,
    borderColor: '#FACC15',
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  finalizeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navyText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    width: '100%',
    maxWidth: 620,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  modalSearchInput: {
    fontSize: 13,
    color: colors.navyText,
    flex: 1,
  },
  chipScroll: {
    maxHeight: 36,
    marginBottom: 12,
  },
  domainFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  domainFilterChipActive: {
    backgroundColor: '#FEF08A',
  },
  domainFilterText: {
    fontSize: 12,
    color: colors.bodyText,
    fontWeight: '600',
  },
  domainFilterTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
  modalGoalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalGoalName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
  modalGoalDesc: {
    fontSize: 12,
    color: colors.bodyText,
    marginTop: 2,
  },
  modalGoalMastery: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
  modalEmptyWrap: {
    padding: 30,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 13,
    color: colors.mutedText,
  },
});
