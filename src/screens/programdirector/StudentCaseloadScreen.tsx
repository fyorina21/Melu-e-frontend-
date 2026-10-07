import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
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
import {
  type Goal,
  type GoalStatus,
  type GoalWithStatus,
  type SlotKey,
  type StudentGoals,
  domainFilterMap,
  emptyStudentGoals,
  goalToWithStatus,
} from './caseload/caseloadTypes';
import { StudentSelectorRow } from './caseload/components/StudentSelectorRow';
import { StationGoalsPanel } from './caseload/components/StationGoalsPanel';
import { GoalBankPanel } from './caseload/components/GoalBankPanel';
import { SlotPickerModal } from './caseload/components/SlotPickerModal';
import { NewGoalModal } from './caseload/components/NewGoalModal';

type Props = NativeStackScreenProps<ProgramDirectorStackParamList, 'StudentCaseload'>;

export default function StudentCaseloadScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [mobileTab, setMobileTab] = useState<'slots' | 'bank'>('slots');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [studentGoals, setStudentGoals] = useState<StudentGoals>(emptyStudentGoals);
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);
  const [slotPickerGoal, setSlotPickerGoal] = useState<Goal | null>(null);
  const [newGoalModalOpen, setNewGoalModalOpen] = useState(false);
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
          })),
        );
      })
      .catch(() => {});

    getStudentOptions()
      .then(({ data: opts }) => {
        setStudentOptions(opts);
        if (opts.length > 0) {
          setSelectedStudentId(opts[0].id);
          setSelectedStudentName(opts[0].name);
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

        setStudentGoals(slots);
      })
      .catch(() => {});
  }, [selectedStudentId]);

  const filteredGoals = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return goalBank.filter((g) => {
      const matchSearch =
        g.name.toLowerCase().includes(term) || g.description.toLowerCase().includes(term);

      const matchDomain =
        domainFilter === 'All' ? true : (domainFilterMap[domainFilter] ?? []).includes(g.domain);

      return matchSearch && matchDomain;
    });
  }, [goalBank, searchTerm, domainFilter]);

  const handleSelectStudent = useCallback(
    (id: string) => {
      setSelectedStudentId(id);
      const opt = studentOptions.find((o) => o.id === id);
      if (opt?.name) {
        setSelectedStudentName(opt.name);
      }
    },
    [studentOptions],
  );

  const handleRemoveGoal = useCallback(
    async (slot: SlotKey) => {
      const goal = studentGoals[slot];
      if (!goal) return;

      Alert.alert('Remove Goal', `Remove "${goal.name}" from this slot?`, [
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
      ]);
    },
    [studentGoals, selectedStudentId],
  );

  const handleAssignGoal = useCallback((goal: Goal) => {
    setSlotPickerGoal(goal);
    setSlotPickerOpen(true);
  }, []);

  const handleSlotPick = useCallback(
    async (slot: SlotKey) => {
      if (!slotPickerGoal) return;

      const current = studentGoals[slot];
      const newGoalWithStatus: GoalWithStatus = goalToWithStatus(slotPickerGoal, 'Active', 0);

      if (current) {
        Alert.alert('Replace Goal', `Replace "${current.name}" with "${slotPickerGoal.name}"?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            onPress: async () => {
              if (selectedStudentId) {
                await assignGoalToSlot(selectedStudentId, {
                  slot,
                  goalId: slotPickerGoal.id,
                }).catch(() => {});
              }
              setStudentGoals((prev) => ({
                ...prev,
                [slot]: newGoalWithStatus,
              }));
              setSlotPickerOpen(false);
              setSlotPickerGoal(null);
            },
          },
        ]);
        return;
      }

      if (selectedStudentId) {
        await assignGoalToSlot(selectedStudentId, {
          slot,
          goalId: slotPickerGoal.id,
        }).catch(() => {});
      }

      setStudentGoals((prev) => ({
        ...prev,
        [slot]: newGoalWithStatus,
      }));

      setSlotPickerOpen(false);
      setSlotPickerGoal(null);
    },
    [slotPickerGoal, studentGoals, selectedStudentId],
  );

  const handleAddGoal = useCallback(
    async (goalData: { name: string; domain: string; description: string }) => {
      try {
        const res = await createGoal(goalData);
        const created = res.data;
        setGoalBank((prev) => [
          ...prev,
          {
            id: String(created?.id ?? Date.now()),
            name: created?.name ?? goalData.name,
            domain: created?.domain ?? goalData.domain,
            description: created?.description ?? goalData.description,
          },
        ]);
      } catch {
        setGoalBank((prev) => [
          ...prev,
          {
            id: `custom-${Date.now()}`,
            name: goalData.name,
            domain: goalData.domain,
            description: goalData.description,
          },
        ]);
      }
      setNewGoalModalOpen(false);
    },
    [],
  );

  const handleSave = useCallback(() => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  }, []);

  const handleViewProgress = useCallback(() => {
    navigation?.navigate?.('GraphChartView');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Caseload"
        onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t])}
      />

      <View style={styles.header}>
        <Feather name="users" size={18} color="#38BDF8" />
        <Text style={[typography.h1, { flexShrink: 1 }]}>
          Caseload Management{selectedStudentName ? ` — ${selectedStudentName}` : ''}
        </Text>
        <Text style={styles.screenCode}>SCR-PD-005</Text>
      </View>

      <StudentSelectorRow
        students={studentOptions}
        selectedStudentId={selectedStudentId}
        onSelectStudent={handleSelectStudent}
      />

      {!isTablet && (
        <View style={styles.mobileTabBar}>
          <TouchableOpacity
            style={[styles.mobileTabBtn, mobileTab === 'slots' && styles.mobileTabBtnActive]}
            onPress={() => setMobileTab('slots')}
          >
            <Text
              style={[
                styles.mobileTabBtnText,
                mobileTab === 'slots' && styles.mobileTabBtnTextActive,
              ]}
            >
              Assigned Slots
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mobileTabBtn, mobileTab === 'bank' && styles.mobileTabBtnActive]}
            onPress={() => setMobileTab('bank')}
          >
            <Text
              style={[
                styles.mobileTabBtnText,
                mobileTab === 'bank' && styles.mobileTabBtnTextActive,
              ]}
            >
              Goal Bank
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.body, !isTablet && styles.bodyMobile]}>
        {(isTablet || mobileTab === 'slots') && (
          <View style={[styles.leftPanel, !isTablet && styles.fullPanel]}>
            <StationGoalsPanel
              studentGoals={studentGoals}
              savedFeedback={savedFeedback}
              onRemove={handleRemoveGoal}
              onViewProgress={handleViewProgress}
              onSave={handleSave}
            />
          </View>
        )}

        {(isTablet || mobileTab === 'bank') && (
          <View style={[styles.rightPanel, !isTablet && styles.fullPanel]}>
            <GoalBankPanel
              goals={filteredGoals}
              searchTerm={searchTerm}
              domainFilter={domainFilter}
              onSearchChange={setSearchTerm}
              onDomainFilterChange={setDomainFilter}
              onAddNewGoal={() => setNewGoalModalOpen(true)}
              onAssignGoal={handleAssignGoal}
            />
          </View>
        )}
      </View>

      <SlotPickerModal
        visible={slotPickerOpen}
        goal={slotPickerGoal}
        studentGoals={studentGoals}
        onSelectSlot={handleSlotPick}
        onClose={() => {
          setSlotPickerOpen(false);
          setSlotPickerGoal(null);
        }}
      />

      <NewGoalModal
        visible={newGoalModalOpen}
        onSaveGoal={handleAddGoal}
        onClose={() => setNewGoalModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  screenCode: {
    marginLeft: 'auto',
    fontSize: 11,
    color: colors.mutedText,
    fontFamily: 'monospace',
  },
  mobileTabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mobileTabBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  mobileTabBtnActive: {
    borderBottomColor: colors.navyText,
  },
  mobileTabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedText,
  },
  mobileTabBtnTextActive: {
    color: colors.navyText,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  bodyMobile: {
    flexDirection: 'column',
  },
  leftPanel: {
    width: '40%',
    minWidth: 320,
    maxWidth: 460,
  },
  rightPanel: {
    flex: 1,
  },
  fullPanel: {
    width: '100%',
    maxWidth: '100%',
    flex: 1,
  },
});
