// screens/programdirector/StudentCaseloadScreen.tsx
// SCR-PD-005: Caseload Management & Goal Assignment

import React, { useEffect, useState, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import StudentAvatar from '../../components/StudentAvatar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getStudentOptions, type StudentOption } from '../../api/optionsApi';
import {
  getGoalBank,
  getStudentCaseload,
  assignGoalToSlot,
  removeGoalFromSlot,
  createGoal,
} from '../../api/programDirectorApi';
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
  Communication: ['Communication', 'Receptive Language', 'Expressive Language'],
  Motor: ['Motor', 'Motor Skills'],
  Social: ['Social', 'Social Skills'],
  'Self-Help': ['Self-Help', 'Adaptive', 'Self Care'],
  Cognition: ['Cognition', 'Cognitive'],
  Play: ['Play', 'Play Skills'],
  Academic: ['Academic'],
};

const allDomains = [
  'All',
  'Communication',
  'Motor',
  'Social',
  'Self-Help',
  'Cognition',
  'Play',
  'Academic',
];

const domainBadgeColors: Record<string, { bg: string; text: string; border: string }> = {
  Communication: { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
  'Receptive Language': { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
  'Expressive Language': { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
  Motor: { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' },
  'Motor Skills': { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' },
  Social: { bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF' },
  'Social Skills': { bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF' },
  'Self-Help': { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA' },
  Adaptive: { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA' },
  Cognition: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  Cognitive: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  Play: { bg: '#FCE7F3', text: '#BE185D', border: '#FBCFE8' },
  'Play Skills': { bg: '#FCE7F3', text: '#BE185D', border: '#FBCFE8' },
  Academic: { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE' },
};

const statusBadgeColors: Record<GoalStatus, { bg: string; text: string }> = {
  Active: { bg: '#DCFCE7', text: '#166534' },
  'In Progress': { bg: '#FEF3C7', text: '#B45309' },
  Mastered: { bg: '#DBEAFE', text: '#1E40AF' },
};

function goalToWithStatus(
  g: Goal,
  status: GoalStatus = 'Active',
  progress = 0
): GoalWithStatus {
  return { ...g, status, progress };
}

const emptyStudentGoals: StudentGoals = {
  'station1-0': null,
  'station1-1': null,
  'station2-0': null,
  'station2-1': null,
};

const slotLabels: Record<SlotKey, { label: string; station: number; slot: number }> = {
  'station1-0': { label: 'Station 1 — Slot 1', station: 1, slot: 1 },
  'station1-1': { label: 'Station 1 — Slot 2', station: 1, slot: 2 },
  'station2-0': { label: 'Station 2 — Slot 1', station: 2, slot: 1 },
  'station2-1': { label: 'Station 2 — Slot 2', station: 2, slot: 2 },
};

export default function StudentCaseloadScreen({
  navigation,
}: NativeStackScreenProps<ProgramDirectorStackParamList, 'StudentCaseload'>) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [studentGoals, setStudentGoals] = useState<StudentGoals>(emptyStudentGoals);
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);
  const [slotPickerGoal, setSlotPickerGoal] = useState<Goal | null>(null);
  const [newGoalModal, setNewGoalModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalDomain, setNewGoalDomain] = useState('Cognitive');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [goalBank, setGoalBank] = useState<Goal[]>([]);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Fetch goal bank and student options
  useEffect(() => {
    getGoalBank({})
      .then(({ data }) => {
        const rawGoals = Array.isArray(data) ? data : data?.goals || [];
        setGoalBank(
          rawGoals.map((g: any) => ({
            id: String(g.id),
            name: g.name || g.title || '',
            domain: g.domain || g.domainName || g.goal_domain?.name || 'Cognitive',
            description: g.description || '',
          }))
        );
      })
      .catch(() => {});

    getStudentOptions()
      .then(({ data: opts }) => {
        const list = Array.isArray(opts) ? opts : [];
        setStudentOptions(list);
        if (list.length > 0) {
          setSelectedStudentId(list[0].id);
          setSelectedStudentName(list[0].name);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch the selected student's assigned goals
  useEffect(() => {
    if (!selectedStudentId) return;

    getStudentCaseload(selectedStudentId)
      .then(({ data }) => {
        if (!data) return;

        const slots: StudentGoals = { ...emptyStudentGoals };
        const rawSlots = data.slots || data.studentGoals || data;

        (['station1-0', 'station1-1', 'station2-0', 'station2-1'] as SlotKey[]).forEach((key) => {
          const item = rawSlots[key];
          if (item) {
            slots[key] = {
              id: String(item.id || item.goalId),
              name: item.name || item.goalName || '',
              domain: item.domain || 'Cognitive',
              description: item.description || '',
              status: (item.status as GoalStatus) || 'Active',
              progress: Number(item.progress ?? 0),
            };
          }
        });

        // Also check if data.goals array format is used
        if (Array.isArray(data.goals)) {
          data.goals.forEach((g: any) => {
            const st = g.station === 2 ? 'station2' : 'station1';
            const sl = typeof g.slot === 'number' ? g.slot : 0;
            const slotKey = `${st}-${sl}` as SlotKey;
            if (slots[slotKey] === null) {
              slots[slotKey] = {
                id: String(g.id),
                name: g.name || g.title || '',
                domain: g.domain || 'Cognitive',
                description: g.description || '',
                status: (g.status as GoalStatus) || 'Active',
                progress: Number(g.progress ?? 0),
              };
            }
          });
        }

        setStudentGoals(slots);
      })
      .catch(() => {});
  }, [selectedStudentId]);

  const filteredGoals = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return goalBank.filter((g) => {
      const matchSearch =
        !term ||
        g.name.toLowerCase().includes(term) ||
        g.description.toLowerCase().includes(term);

      const matchDomain =
        domainFilter === 'All'
          ? true
          : (domainFilterMap[domainFilter] ?? [domainFilter]).some(
              (d) => d.toLowerCase() === g.domain.toLowerCase()
            );

      return matchSearch && matchDomain;
    });
  }, [goalBank, searchTerm, domainFilter]);

  const assignedGoalCount = useMemo(() => {
    return Object.values(studentGoals).filter(Boolean).length;
  }, [studentGoals]);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    const opt = studentOptions.find((o) => o.id === id);
    if (opt?.name) {
      setSelectedStudentName(opt.name);
    }
  };

  const handleRemove = async (slot: SlotKey) => {
    const goal = studentGoals[slot];
    if (!goal) return;

    Alert.alert(
      'Remove Goal',
      `Remove "${goal.name}" from ${slotLabels[slot].label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (selectedStudentId) {
              await removeGoalFromSlot(selectedStudentId, {
                slot,
                goalId: goal.id,
              }).catch(() => {});
            }
            setStudentGoals((prev) => ({
              ...prev,
              [slot]: null,
            }));
          },
        },
      ]
    );
  };

  const handleAssign = (goal: Goal) => {
    setSlotPickerGoal(goal);
    setSlotPickerOpen(true);
  };

  const handleSlotPick = async (slot: SlotKey) => {
    if (!slotPickerGoal) return;

    const current = studentGoals[slot];
    const newGoalWithStatus: GoalWithStatus = goalToWithStatus(slotPickerGoal, 'Active', 0);

    const applySlotAssignment = async () => {
      if (selectedStudentId) {
        const info = slotLabels[slot];
        await assignGoalToSlot(selectedStudentId, {
          slot,
          station: info.station,
          slotIndex: info.slot - 1,
          goalId: slotPickerGoal.id,
        }).catch(() => {});
      }
      setStudentGoals((prev) => ({
        ...prev,
        [slot]: newGoalWithStatus,
      }));
      setSlotPickerOpen(false);
      setSlotPickerGoal(null);
    };

    if (current) {
      Alert.alert(
        'Replace Assigned Goal',
        `Replace "${current.name}" with "${slotPickerGoal.name}" in ${slotLabels[slot].label}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', onPress: applySlotAssignment },
        ]
      );
    } else {
      await applySlotAssignment();
    }
  };

  const handleAddGoal = async () => {
    if (!newGoalName.trim()) return;

    try {
      const res = await createGoal({
        name: newGoalName,
        domain: newGoalDomain,
        description: newGoalDescription,
      });
      const created = res.data;
      setGoalBank((prev) => [
        ...prev,
        {
          id: String(created?.id ?? Date.now()),
          name: created?.name ?? newGoalName,
          domain: created?.domain ?? newGoalDomain,
          description: created?.description ?? newGoalDescription,
        },
      ]);
    } catch {
      setGoalBank((prev) => [
        ...prev,
        {
          id: `custom-${Date.now()}`,
          name: newGoalName,
          domain: newGoalDomain,
          description: newGoalDescription,
        },
      ]);
    }

    setNewGoalName('');
    setNewGoalDomain('Cognitive');
    setNewGoalDescription('');
    setNewGoalModal(false);
  };

  const handleSave = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const renderGoalSlot = (slot: SlotKey) => {
    const g = studentGoals[slot];
    const info = slotLabels[slot];

    if (!g) {
      return (
        <View key={slot} style={styles.emptySlot}>
          <View style={styles.emptySlotIconCircle}>
            <Feather name="plus" size={14} color={colors.mutedText} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emptySlotTitle}>Slot {info.slot} — Unassigned</Text>
            <Text style={styles.emptySlotSub}>Choose a goal from the Goal Bank to assign</Text>
          </View>
        </View>
      );
    }

    const badge = statusBadgeColors[g.status] || statusBadgeColors.Active;
    const domainStyle = domainBadgeColors[g.domain] || {
      bg: '#F1F5F9',
      text: '#475569',
      border: '#E2E8F0',
    };

    return (
      <View key={slot} style={styles.goalSlot}>
        <View style={styles.goalSlotHeader}>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.slotTagText}>Slot {info.slot}</Text>
              <View
                style={[
                  styles.domainBadge,
                  { backgroundColor: domainStyle.bg, borderColor: domainStyle.border },
                ]}
              >
                <Text style={[styles.domainBadgeText, { color: domainStyle.text }]}>{g.domain}</Text>
              </View>
            </View>
            <Text style={styles.goalSlotName} numberOfLines={2}>
              {g.name}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{g.status}</Text>
          </View>
        </View>

        {g.description ? (
          <Text style={styles.goalSlotDesc} numberOfLines={2}>
            {g.description}
          </Text>
        ) : null}

        {/* Progress bar */}
        <View style={styles.progressBlock}>
          <View style={styles.progressLabelsRow}>
            <Text style={styles.progressLabelText}>Mastery Progress</Text>
            <Text style={styles.progressValueText}>{g.progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, g.progress))}%` }]} />
          </View>
        </View>

        {/* Slot Actions */}
        <View style={styles.slotActionsRow}>
          <TouchableOpacity
            style={[styles.slotActionBtn, styles.removeBtn]}
            onPress={() => handleRemove(slot)}
          >
            <Feather name="trash-2" size={13} color="#EF4444" />
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.slotActionBtn, styles.chartBtn]}
            onPress={() => navigation?.navigate?.('GraphChartView' as never)}
          >
            <Feather name="trending-up" size={13} color="#0284C7" />
            <Text style={styles.chartBtnText}>Progress Chart</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSlotPickerModal = () => {
    const isVisible = slotPickerOpen && slotPickerGoal !== null;
    if (!isVisible) return null;

    const modalContent = (
      <View style={styles.overlay}>
        <View style={[styles.modalSheet, styles.modalNarrow]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Assign Goal to Slot</Text>
              <Text style={styles.modalSub}>Select a station and slot for this goal</Text>
            </View>
            <TouchableOpacity onPress={() => setSlotPickerOpen(false)} style={styles.modalCloseBtn}>
              <Feather name="x" size={18} color={colors.navyText} />
            </TouchableOpacity>
          </View>

          {slotPickerGoal && (
            <View style={styles.goalSelectedBanner}>
              <Feather name="target" size={16} color="#0284C7" />
              <View style={{ flex: 1 }}>
                <Text style={styles.goalSelectedName}>{slotPickerGoal.name}</Text>
                <Text style={styles.goalSelectedDomain}>{slotPickerGoal.domain}</Text>
              </View>
            </View>
          )}

          <Text style={styles.selectSlotPrompt}>Choose Destination Slot:</Text>

          <View style={styles.slotGrid}>
            {(Object.keys(slotLabels) as SlotKey[]).map((slot) => {
              const info = slotLabels[slot];
              const occupied = studentGoals[slot] !== null;
              const currentGoal = studentGoals[slot];

              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.slotPickBtn, occupied ? styles.slotPickOccupied : styles.slotPickEmpty]}
                  onPress={() => handleSlotPick(slot)}
                >
                  <View style={styles.slotPickHeaderRow}>
                    <View
                      style={[
                        styles.stationBadgeSmall,
                        info.station === 1 ? styles.station1Badge : styles.station2Badge,
                      ]}
                    >
                      <Text
                        style={
                          info.station === 1
                            ? styles.stationBadgeTextWhiteSmall
                            : styles.stationBadgeTextDarkSmall
                        }
                      >
                        {info.station}
                      </Text>
                    </View>
                    <Text style={styles.slotPickLabel}>{info.label}</Text>
                  </View>

                  {occupied ? (
                    <View style={styles.slotCurrentGoalBox}>
                      <Text style={styles.slotCurrentGoalLabel}>Currently assigned:</Text>
                      <Text style={styles.slotCurrentGoalName} numberOfLines={1}>
                        {currentGoal?.name}
                      </Text>
                      <Text style={styles.slotReplaceWarning}>(Click to replace)</Text>
                    </View>
                  ) : (
                    <View style={styles.slotEmptyBox}>
                      <Feather name="plus-circle" size={14} color="#10B981" />
                      <Text style={styles.slotEmptyText}>Available for Assignment</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );

    if (Platform.OS === 'web') {
      return (
        <View style={styles.webModalOverlay}>
          {modalContent}
        </View>
      );
    }

    return (
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSlotPickerOpen(false)}
      >
        {modalContent}
      </Modal>
    );
  };

  const renderNewGoalModal = () => {
    if (!newGoalModal) return null;

    const modalContent = (
      <View style={styles.overlay}>
        <View style={[styles.modalSheet, styles.modalWide]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Add New Goal to Bank</Text>
              <Text style={styles.modalSub}>Create a reusable ABA target goal</Text>
            </View>
            <TouchableOpacity onPress={() => setNewGoalModal(false)} style={styles.modalCloseBtn}>
              <Feather name="x" size={18} color={colors.navyText} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formFields}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Goal Title *</Text>
              <TextInput
                style={styles.textInput}
                value={newGoalName}
                onChangeText={setNewGoalName}
                placeholder="e.g. Expressive Identification of Common Objects"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Target Skill Domain</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {[
                  'Cognitive',
                  'Receptive Language',
                  'Expressive Language',
                  'Social Skills',
                  'Motor Skills',
                  'Adaptive',
                  'Play Skills',
                  'Academic',
                ].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.filterChip, newGoalDomain === d && styles.filterChipActive]}
                    onPress={() => setNewGoalDomain(d)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        newGoalDomain === d && styles.filterChipTextActive,
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Goal Description & Mastery Criteria</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                multiline
                value={newGoalDescription}
                onChangeText={setNewGoalDescription}
                placeholder="Detail the target behavior, prompting hierarchy, and mastery threshold (e.g., 80% accuracy over 3 consecutive sessions)..."
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
              <Feather name="plus" size={15} color={colors.navyText} />
              <Text style={styles.saveGoalBtnText}>Add to Goal Bank</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );

    if (Platform.OS === 'web') {
      return (
        <View style={styles.webModalOverlay}>
          {modalContent}
        </View>
      );
    }

    return (
      <Modal
        visible={newGoalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setNewGoalModal(false)}
      >
        {modalContent}
      </Modal>
    );
  };

  const selectedStudentObj = studentOptions.find((s) => s.id === selectedStudentId);

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Caseload"
        onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t] as never)}
      />

      {/* Page Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <View style={styles.headerIconCircle}>
            <Feather name="folder" size={20} color="#0284C7" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Student Caseload Management</Text>
            <Text style={styles.headerSubtitle}>
              Assign and balance target skills across therapy stations
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <View style={styles.assignedCountBadge}>
            <Feather name="target" size={14} color="#0369A1" />
            <Text style={styles.assignedCountText}>{assignedGoalCount} / 4 Goals Assigned</Text>
          </View>
        </View>
      </View>

      {/* Student Horizontal Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorHeaderLabel}>Select Student Caseload:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectorRow}
        >
          {(studentOptions.length > 0
            ? studentOptions
            : [{ id: 's1', name: 'Demo Student', age: 6, program: 'Comprehensive ABA' }]
          ).map((s) => {
            const isSelected = selectedStudentId === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.studentChip, isSelected && styles.studentChipActive]}
                onPress={() => handleSelectStudent(s.id)}
              >
                <StudentAvatar
                  name={s.name}
                  studentId={s.id}
                  size={26}
                  style={{ marginRight: 6 }}
                />
                <View>
                  <Text style={[styles.studentChipText, isSelected && styles.studentChipTextActive]}>
                    {s.name}
                  </Text>
                  {s.program ? (
                    <Text style={[styles.studentChipSub, isSelected && styles.studentChipSubActive]}>
                      {s.program}
                    </Text>
                  ) : null}
                </View>
                {isSelected && (
                  <View style={styles.activeCheckDot}>
                    <Feather name="check" size={10} color="#166534" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Two-panel Body */}
      <View style={styles.body}>
        {/* Left Panel: Assigned Stations & Slots */}
        <View style={styles.leftPanel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelHeaderTitle}>Assigned Station Slots</Text>
              <Text style={styles.panelHeaderSubtitle}>
                {selectedStudentName || 'Active Student'}
              </Text>
            </View>
            <View style={styles.stationCountPill}>
              <Text style={styles.stationCountPillText}>2 Stations</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.leftContent} showsVerticalScrollIndicator={false}>
            {/* Station 1 */}
            <View style={styles.stationCard}>
              <View style={styles.stationHeader}>
                <View style={[styles.stationNumberBadge, styles.station1Badge]}>
                  <Text style={styles.stationNumberTextWhite}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stationTitle}>Station 1 — Foundational Skills</Text>
                  <Text style={styles.stationSub}>Receptive language, imitation, matching</Text>
                </View>
              </View>

              <View style={styles.stationSlots}>
                {renderGoalSlot('station1-0')}
                {renderGoalSlot('station1-1')}
              </View>
            </View>

            {/* Station 2 */}
            <View style={styles.stationCard}>
              <View style={styles.stationHeader}>
                <View style={[styles.stationNumberBadge, styles.station2Badge]}>
                  <Text style={styles.stationNumberTextDark}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stationTitle}>Station 2 — Advanced & Generalization</Text>
                  <Text style={styles.stationSub}>Expressive language, social & academic</Text>
                </View>
              </View>

              <View style={styles.stationSlots}>
                {renderGoalSlot('station2-0')}
                {renderGoalSlot('station2-1')}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Save Action */}
          <View style={styles.leftFooter}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              {savedFeedback ? (
                <>
                  <Feather name="check-circle" size={16} color="#166534" />
                  <Text style={styles.saveBtnTextSuccess}>Changes Saved Successfully!</Text>
                </>
              ) : (
                <>
                  <Feather name="save" size={16} color={colors.navyText} />
                  <Text style={styles.saveBtnText}>Save Assignments</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Panel: Goal Bank Browser */}
        <View style={styles.rightPanel}>
          <View style={styles.goalBankHeader}>
            <View>
              <Text style={styles.panelHeaderTitle}>Goal Bank</Text>
              <Text style={styles.panelHeaderSubtitle}>
                Browse standard ABA goals and assign to station slots
              </Text>
            </View>

            <TouchableOpacity style={styles.addGoalBtn} onPress={() => setNewGoalModal(true)}>
              <Feather name="plus-circle" size={14} color={colors.navyText} />
              <Text style={styles.addGoalBtnText}>New Goal</Text>
            </TouchableOpacity>
          </View>

          {/* Search & Domain Filter */}
          <View style={styles.searchBlock}>
            <View style={styles.searchWrap}>
              <Feather name="search" size={16} color={colors.mutedText} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search goals by title or description..."
                placeholderTextColor={colors.mutedText}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              {searchTerm ? (
                <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.searchClearBtn}>
                  <Feather name="x" size={14} color={colors.mutedText} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.domainChipsRow}
            >
              {allDomains.map((d) => {
                const isActive = domainFilter === d;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setDomainFilter(d)}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Goals List */}
          <ScrollView contentContainerStyle={styles.goalList} showsVerticalScrollIndicator={true}>
            {filteredGoals.length === 0 ? (
              <View style={styles.noResultsWrap}>
                <Feather name="inbox" size={32} color={colors.mutedText} />
                <Text style={styles.noResultsTitle}>No Goals Found</Text>
                <Text style={styles.noResultsSub}>
                  Try adjusting your search keyword or selected domain filter
                </Text>
              </View>
            ) : (
              filteredGoals.map((goal) => {
                const domainStyle = domainBadgeColors[goal.domain] || {
                  bg: '#F1F5F9',
                  text: '#475569',
                  border: '#E2E8F0',
                };
                return (
                  <View key={goal.id} style={styles.goalCard}>
                    <View style={styles.goalCardBody}>
                      <View style={styles.goalCardTitleRow}>
                        <Text style={styles.goalCardName}>{goal.name}</Text>
                        <View
                          style={[
                            styles.domainBadge,
                            { backgroundColor: domainStyle.bg, borderColor: domainStyle.border },
                          ]}
                        >
                          <Text style={[styles.domainBadgeText, { color: domainStyle.text }]}>
                            {goal.domain}
                          </Text>
                        </View>
                      </View>

                      {goal.description ? (
                        <Text style={styles.goalCardDesc} numberOfLines={3}>
                          {goal.description}
                        </Text>
                      ) : null}
                    </View>

                    <TouchableOpacity style={styles.assignBtn} onPress={() => handleAssign(goal)}>
                      <Feather name="plus" size={14} color={colors.white} />
                      <Text style={styles.assignBtnText}>Assign</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>

      {/* Slot Picker Modal */}
      {renderSlotPickerModal()}

      {/* Add New Goal Modal */}
      {renderNewGoalModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyText,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  assignedCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  assignedCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },

  /* Student Selector */
  selectorContainer: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  selectorHeaderLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mutedText,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: 4,
  },
  studentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
  },
  studentChipActive: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FACC15',
  },
  studentChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  studentChipTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
  studentChipSub: {
    fontSize: 10,
    color: colors.mutedText,
  },
  studentChipSubActive: {
    color: '#854D0E',
  },
  activeCheckDot: {
    marginLeft: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Body Layout */
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    width: '38%',
    maxWidth: 480,
    minWidth: 320,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.bgApp,
    display: 'flex',
    flexDirection: 'column',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: colors.bgApp,
    display: 'flex',
    flexDirection: 'column',
  },

  /* Panel Headers */
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  panelHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  panelHeaderSubtitle: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  stationCountPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  stationCountPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mutedText,
  },

  /* Station Cards */
  leftContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  stationCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }
      : { elevation: 1 }),
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stationNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  station1Badge: {
    backgroundColor: '#0284C7',
  },
  station2Badge: {
    backgroundColor: '#F59E0B',
  },
  stationNumberTextWhite: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  stationNumberTextDark: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  stationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  stationSub: {
    fontSize: 11,
    color: colors.mutedText,
  },
  stationSlots: {
    gap: spacing.sm,
  },

  /* Goal Slots */
  emptySlot: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F8FAFC',
  },
  emptySlotIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.bodyText,
  },
  emptySlotSub: {
    fontSize: 11,
    color: colors.mutedText,
  },

  goalSlot: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  goalSlotHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  slotTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  goalSlotName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
    marginTop: 2,
  },
  goalSlotDesc: {
    fontSize: 11,
    color: colors.bodyText,
    lineHeight: 16,
  },

  domainBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  domainBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* Progress Bar */
  progressBlock: {
    gap: 3,
    marginTop: 2,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabelText: {
    fontSize: 10,
    color: colors.mutedText,
    fontWeight: '600',
  },
  progressValueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  progressTrack: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: '#0284C7',
  },

  /* Slot Actions */
  slotActionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  slotActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  removeBtn: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  chartBtn: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  chartBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },

  /* Left Footer Save */
  leftFooter: {
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    paddingVertical: spacing.md,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
  saveBtnTextSuccess: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },

  /* Goal Bank (Right Panel) */
  goalBankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addGoalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },

  searchBlock: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  searchWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 38,
    paddingRight: 36,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
    color: colors.navyText,
    fontSize: 13,
  },
  searchClearBtn: {
    position: 'absolute',
    right: spacing.md,
    padding: 4,
  },

  domainChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: colors.bgCard,
  },
  filterChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.bodyText,
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },

  goalList: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  noResultsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: spacing.xs,
  },
  noResultsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
    marginTop: spacing.sm,
  },
  noResultsSub: {
    fontSize: 12,
    color: colors.mutedText,
    textAlign: 'center',
  },

  goalCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)' }
      : { elevation: 1 }),
  },
  goalCardBody: {
    flex: 1,
    gap: 4,
  },
  goalCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  goalCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  goalCardDesc: {
    fontSize: 12,
    color: colors.bodyText,
    lineHeight: 17,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.navyText,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  assignBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },

  /* Modals */
  webModalOverlay: {
    ...(Platform.OS === 'web'
      ? {
          position: 'fixed' as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }
      : {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }),
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxHeight: '85%',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)' }
      : { elevation: 6 }),
  },
  modalNarrow: {
    maxWidth: 460,
  },
  modalWide: {
    maxWidth: 540,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  modalSub: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },

  goalSelectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  goalSelectedName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  goalSelectedDomain: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  selectSlotPrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  slotGrid: {
    gap: spacing.sm,
  },
  slotPickBtn: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: 6,
  },
  slotPickOccupied: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
  },
  slotPickEmpty: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  slotPickHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stationBadgeSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationBadgeTextWhiteSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  stationBadgeTextDarkSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  slotPickLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  slotCurrentGoalBox: {
    gap: 2,
    paddingLeft: 24,
  },
  slotCurrentGoalLabel: {
    fontSize: 10,
    color: '#9A3412',
    fontWeight: '600',
  },
  slotCurrentGoalName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
  slotReplaceWarning: {
    fontSize: 10,
    color: '#EA580C',
    fontStyle: 'italic',
  },
  slotEmptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 24,
  },
  slotEmptyText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },

  /* New Goal Form */
  formFields: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.navyText,
    fontSize: 13,
    backgroundColor: colors.bgApp,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  modalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
  },
  cancelBtnText: {
    fontWeight: '600',
    color: colors.bodyText,
    fontSize: 13,
  },
  saveGoalBtn: {
    flex: 1.5,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  saveGoalBtnText: {
    fontWeight: '700',
    color: colors.navyText,
    fontSize: 13,
  },
});
