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
import { useFocusEffect } from '@react-navigation/native';
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
  getStoredIupDraft,
  getStoredCaseloadMap,
  IUP_LIBRARY_STORAGE_KEY,
} from '../../api/programDirectorApi';
import storage from '../../utils/storage';
import { onMasteryChecksChanged } from '../../stores/goalMasteryStore';
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
  const [masterGoalBank, setMasterGoalBank] = useState<Goal[]>([]);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Fetch master goal bank catalog and student options
  useEffect(() => {
    getGoalBank({})
      .then(({ data }) => {
        const rawGoals = Array.isArray(data) ? data : (data as any)?.goals || [];
        setMasterGoalBank(
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
  const loadCaseload = useCallback(() => {
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

  useEffect(() => {
    loadCaseload();
  }, [loadCaseload]);

  useFocusEffect(
    useCallback(() => {
      loadCaseload();
    }, [loadCaseload]),
  );

  useEffect(() => {
    const unsubMastery = onMasteryChecksChanged(() => {
      loadCaseload();
    });

    const handleCaseloadSync = () => {
      loadCaseload();
    };

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('melue_caseload_updated', handleCaseloadSync);
    }

    return () => {
      unsubMastery();
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('melue_caseload_updated', handleCaseloadSync);
      }
    };
  }, [loadCaseload]);

  // In the Goal Bank, display only the goals assigned to the specific student during IUP Creation/Generation
  const studentGoalsForBank = useMemo(() => {
    if (!selectedStudentId) return [];

    const map = new Map<string, Goal>();

    // 1. From active/cached IUP draft for this specific student
    const draft = getStoredIupDraft(selectedStudentId);
    if (draft?.slots) {
      const draftSlots = (draft.slots as any) || {};
      const s1 = Array.isArray(draftSlots.station1) ? draftSlots.station1 : [];
      const s2 = Array.isArray(draftSlots.station2) ? draftSlots.station2 : [];
      [...s1, ...s2].filter(Boolean).forEach((g: any) => {
        const id = String(g.id || g.goalId || g.goal_id);
        if (id && !map.has(id)) {
          map.set(id, {
            id,
            name: g.name || g.title || 'Assigned Goal',
            domain: g.domain || g.domainName || 'Cognitive',
            description: g.description || '',
          });
        }
      });
    }

    if (Array.isArray(draft?.goals)) {
      draft.goals.forEach((g: any) => {
        const id = typeof g === 'string' ? g : String(g?.id || g?.goalId);
        if (id && !map.has(id)) {
          const master = masterGoalBank.find((b) => b.id === id);
          map.set(id, {
            id,
            name: (typeof g === 'object' && g.name) || master?.name || 'Assigned Goal',
            domain: (typeof g === 'object' && g.domain) || master?.domain || 'Cognitive',
            description: (typeof g === 'object' && g.description) || master?.description || '',
          });
        }
      });
    }

    // 2. From finalized IUP library for this specific student
    const lib = storage.getJSONSync<any[]>(IUP_LIBRARY_STORAGE_KEY, []) || [];
    const studentRecords = lib.filter(
      (item) =>
        item.studentId === selectedStudentId ||
        item.id === selectedStudentId ||
        item.student_id === selectedStudentId,
    );
    studentRecords.forEach((item) => {
      const itemSlots = (item.slots as any) || {};
      const s1 = Array.isArray(itemSlots.station1) ? itemSlots.station1 : [];
      const s2 = Array.isArray(itemSlots.station2) ? itemSlots.station2 : [];
      [...s1, ...s2].filter(Boolean).forEach((g: any) => {
        const id = String(g.id || g.goalId || g.goal_id);
        if (id && !map.has(id)) {
          map.set(id, {
            id,
            name: g.name || g.title || 'Assigned Goal',
            domain: g.domain || g.domainName || 'Cognitive',
            description: g.description || '',
          });
        }
      });

      if (Array.isArray(item?.goals)) {
        item.goals.forEach((g: any) => {
          const id = typeof g === 'string' ? g : String(g?.id || g?.goalId);
          if (id && !map.has(id)) {
            const master = masterGoalBank.find((b) => b.id === id);
            map.set(id, {
              id,
              name: (typeof g === 'object' && g.name) || master?.name || 'Assigned Goal',
              domain: (typeof g === 'object' && g.domain) || master?.domain || 'Cognitive',
              description: (typeof g === 'object' && g.description) || master?.description || '',
            });
          }
        });
      }
    });

    // 3. From caseload slot assignments for this specific student
    const caseloadMap = getStoredCaseloadMap();
    const studentSlots = caseloadMap[selectedStudentId] || {};
    Object.values(studentSlots).forEach((g: any) => {
      if (g) {
        const id = String(g.id || g.goalId);
        if (id && !map.has(id)) {
          map.set(id, {
            id,
            name: g.name || 'Assigned Goal',
            domain: g.domain || 'Cognitive',
            description: g.description || '',
          });
        }
      }
    });

    return Array.from(map.values());
  }, [selectedStudentId, masterGoalBank, studentGoals]);

  const filteredGoals = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return studentGoalsForBank.filter((g) => {
      const matchSearch =
        g.name.toLowerCase().includes(term) || g.description.toLowerCase().includes(term);

      const matchDomain =
        domainFilter === 'All' ? true : (domainFilterMap[domainFilter] ?? []).includes(g.domain);

      return matchSearch && matchDomain;
    });
  }, [studentGoalsForBank, searchTerm, domainFilter]);

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

  const handleAssignGoal = useCallback(
    (goal: Goal) => {
      // Check duplicate goal assignment
      const alreadyAssigned = Object.values(studentGoals).some(
        (g) => g && (g.id === goal.id || g.name === goal.name),
      );
      if (alreadyAssigned) {
        Alert.alert('Duplicate Goal', `"${goal.name}" is already assigned to this student.`);
        return;
      }

      setSlotPickerGoal(goal);
      setSlotPickerOpen(true);
    },
    [studentGoals],
  );

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
                  name: slotPickerGoal.name,
                  domain: slotPickerGoal.domain,
                  description: slotPickerGoal.description,
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

      // Enforce maximum of 2 active assigned goals per student
      const activeCount = Object.keys(studentGoals).filter(
        (k) =>
          studentGoals[k as SlotKey] !== null && studentGoals[k as SlotKey]?.status !== 'Mastered',
      ).length;

      if (activeCount >= 2) {
        Alert.alert(
          'Two-Goal Limit Reached',
          'Each student can have a maximum of two active assigned goals at a time. Please replace an existing goal or remove one to free up a slot.',
        );
        return;
      }

      if (selectedStudentId) {
        try {
          await assignGoalToSlot(selectedStudentId, {
            slot,
            goalId: slotPickerGoal.id,
            name: slotPickerGoal.name,
            domain: slotPickerGoal.domain,
            description: slotPickerGoal.description,
          });
        } catch (err: any) {
          Alert.alert('Assignment Error', err?.message || 'Failed to assign goal.');
          return;
        }
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

      <View style={{ zIndex: 100, position: 'relative' }}>
        <StudentSelectorRow
          students={studentOptions}
          selectedStudentId={selectedStudentId}
          onSelectStudent={handleSelectStudent}
        />
      </View>

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
