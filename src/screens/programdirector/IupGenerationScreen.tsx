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
import ExportPreviewModal from '../../components/ExportPreviewModal';
import AppNavbar from '../../components/AppNavbar';
import StudentAvatar from '../../components/StudentAvatar';
import ScreenLoader from '../../components/ScreenLoader';
import { PD_ROUTE_BY_TAB, COORDINATOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getIupCandidates,
  getIupLibrary,
  getIupContext,
  saveIupDraft,
  finalizeIup,
  getGoalBank,
  assignGoalToSlot,
  removeGoalFromSlot,
  getStudentCaseload,
  getStoredIupDraft,
  isCandidateInSession,
  isEligibleIupCandidate,
  IUP_LIBRARY_STORAGE_KEY,
  type IupCandidate,
} from '../../api/programDirectorApi';
import { storage } from '../../utils/storage';
import DynamicFormFields from '../../components/DynamicFormFields';
import {
  getStoredGoalDomains,
  getStoredGoalBank,
  type GoalDomain,
} from '../../stores/goalBankStore';
import { normalizeStudentId } from '../../utils/studentLifecycleHelper';
import type { ProgramDirectorStackParamList, CoordinatorStackParamList } from '../../types';

interface GoalBankItem {
  id: string;
  name: string;
  domain: string;
  description: string;
  goalType: string;
  masteryCriteria: string;
  active?: boolean;
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

interface CachedIupRecord {
  id?: string;
  studentId?: string;
  isFinalized?: boolean;
  status?: string;
  slots?: Slots | Record<string, unknown>;
  reinforcementSchedule?: string;
  crisisProtocol?: string;
  accommodations?: string;
  reviewCycle?: string;
  customFields?: Record<string, unknown>;
  saved_at?: string;
  finalizedAt?: string;
}

function isStudentIupFinalizedAndActive(
  student: { id?: string; studentId?: string; name?: string; fullName?: string },
  libraryRecords: any[] = [],
): boolean {
  const sid = String(student.id || student.studentId || '').trim();
  const sName = String(student.name || student.fullName || '')
    .toLowerCase()
    .trim();

  // 1. Check stored local draft
  if (sid) {
    const draft = getStoredIupDraft(sid) as any;
    if (draft?.isFinalized || draft?.status === 'finalized' || draft?.status === 'Active') {
      return true;
    }
  }

  // 2. Check IUP library in storage & fetched pool
  const storedLib = storage.getJSONSync<any[]>(IUP_LIBRARY_STORAGE_KEY, []) || [];
  const allRecords = [...libraryRecords, ...storedLib];

  return allRecords.some((rec) => {
    if (!rec) return false;
    const recStatus = String(rec.status || '')
      .toLowerCase()
      .trim();
    const isFinal = rec.isFinalized === true || recStatus === 'active' || recStatus === 'finalized';

    if (!isFinal || recStatus === 'archived' || recStatus === 'draft') {
      return false;
    }

    const recSid = String(rec.studentId || rec.student_id || rec.id || '').trim();
    const recName = String(rec.studentName || rec.student_name || rec.name || '')
      .toLowerCase()
      .trim();

    const idMatches =
      Boolean(sid && recSid) &&
      (sid === recSid || normalizeStudentId(sid) === normalizeStudentId(recSid));
    const nameMatches = Boolean(sName && recName) && sName === recName;

    return idMatches || nameMatches;
  });
}

export default function IupGenerationScreen({
  navigation,
  route,
}: NativeStackScreenProps<
  ProgramDirectorStackParamList | CoordinatorStackParamList,
  'IupGeneration'
>) {
  const { session } = useAuth();
  const isCoordinator = session?.role === ROLES.COORDINATOR;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<IupCandidate[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [context, setContext] = useState<IupContext | null>(null);
  const [goalBank, setGoalBank] = useState<GoalBankItem[]>([]);
  const [domains, setDomains] = useState<GoalDomain[]>(getStoredGoalDomains());
  const [slots, setSlots] = useState<Slots>({ station1: [null], station2: [null] });
  const [activeWorkbenchTab, setActiveWorkbenchTab] = useState<
    'assessment' | 'goals' | 'strategies'
  >('goals');

  // Custom Strategies State
  const [reinforcementSchedule, setReinforcementSchedule] = useState('Fixed Ratio (FR-2)');
  const [crisisProtocol, setCrisisProtocol] = useState(
    'Redirect to calm zone, offer deep pressure sensory mat, minimal verbal engagement.',
  );
  const [accommodations, setAccommodations] = useState(
    'Visual schedule, 2-minute transition warnings, preferential seating near exit.',
  );
  const [reviewCycle, setReviewCycle] = useState('6 Weeks');
  const [customIupValues, setCustomIupValues] = useState<Record<string, unknown>>({});
  const [isFinalizedRecord, setIsFinalizedRecord] = useState(false);

  // Dropdown Selector State
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [searchStudentText, setSearchStudentText] = useState('');

  // Goal Selector Modal State
  const [selectorTarget, setSelectorTarget] = useState<{
    station: StationKey;
    slotIndex: number;
  } | null>(null);
  const [goalSearch, setGoalSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');

  // Computed dynamic domain options from GoalDomainDefinitions and goal bank
  const domainOptions = useMemo(() => {
    const activeNames = domains.filter((d) => d.active !== false).map((d) => d.name);
    const goalDomains = Array.from(new Set(goalBank.map((g) => g.domain).filter(Boolean)));
    const all = Array.from(new Set([...activeNames, ...goalDomains]));
    return [
      'All',
      ...(all.length > 0
        ? all
        : ['Communication', 'Motor', 'Social', 'Self-Help', 'Cognition', 'Adaptive']),
    ];
  }, [domains, goalBank]);

  // Immediately refresh goal bank and open selector
  const handleOpenGoalSelector = useCallback(async (station: StationKey, slotIndex: number) => {
    const localGoals = getStoredGoalBank();
    const localDomains = getStoredGoalDomains();
    setGoalBank(localGoals);
    setDomains(localDomains);
    setDomainFilter('All');
    setGoalSearch('');
    setSelectorTarget({ station, slotIndex });

    try {
      const { data: res } = await getGoalBank({});
      const resObj =
        typeof res === 'object' && res !== null ? (res as Record<string, unknown>) : null;
      const loadedGoals = Array.isArray(res)
        ? (res as GoalBankItem[])
        : Array.isArray(resObj?.goals)
          ? (resObj.goals as GoalBankItem[])
          : Array.isArray(resObj?.data)
            ? (resObj.data as GoalBankItem[])
            : [];
      if (loadedGoals.length > 0) {
        setGoalBank(loadedGoals);
      }
    } catch {}
  }, []);

  // Preview & Export State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportContent, setExportContent] = useState<string | null>(null);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    let loadedCandidates: IupCandidate[] = [];
    let libraryList: any[] = [];

    const [candidatesResponse, iupLibResponse] = await Promise.allSettled([
      getIupCandidates(),
      getIupLibrary().catch(() => null),
    ]);

    if (candidatesResponse.status === 'fulfilled' && candidatesResponse.value) {
      const response = candidatesResponse.value;
      const responseObj =
        typeof response === 'object' && response !== null
          ? (response as Record<string, unknown>)
          : null;
      const raw = responseObj?.data ?? response;
      const rawObj =
        typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : null;
      loadedCandidates = Array.isArray(raw)
        ? (raw as IupCandidate[])
        : Array.isArray(rawObj?.candidates)
          ? (rawObj.candidates as IupCandidate[])
          : [];
    }

    if (iupLibResponse.status === 'fulfilled' && iupLibResponse.value) {
      const libRaw = iupLibResponse.value?.data || iupLibResponse.value?.iups;
      if (Array.isArray(libRaw)) {
        libraryList = libRaw;
      }
    }

    // Filter out students who already have a finalized and active IUP
    const eligibleCandidates = loadedCandidates
      .filter(isEligibleIupCandidate)
      .filter((c) => !isStudentIupFinalizedAndActive(c, libraryList));

    setCandidates(eligibleCandidates);

    try {
      const response = await getGoalBank({});
      const responseObj =
        typeof response === 'object' && response !== null
          ? (response as Record<string, unknown>)
          : null;
      const rawRes = responseObj?.data || responseObj?.goals || response;
      const rawResObj =
        typeof rawRes === 'object' && rawRes !== null ? (rawRes as Record<string, unknown>) : null;
      const loadedGoals = Array.isArray(rawRes)
        ? (rawRes as GoalBankItem[])
        : Array.isArray(rawResObj?.goals)
          ? (rawResObj.goals as GoalBankItem[])
          : [];
      setGoalBank(loadedGoals.length > 0 ? loadedGoals : getStoredGoalBank());
    } catch {
      setGoalBank(getStoredGoalBank());
    }

    setDomains(getStoredGoalDomains());

    const preId = (route.params as { studentId?: string })?.studentId;
    const match = preId
      ? eligibleCandidates.find(
          (c) => c.id === preId || normalizeStudentId(c.id) === normalizeStudentId(preId),
        )
      : null;

    if (match) {
      setSelectedStudentId(match.id);
    } else if (eligibleCandidates.length > 0) {
      setSelectedStudentId(eligibleCandidates[0].id);
    } else {
      setSelectedStudentId(null);
    }
    setLoading(false);
  }, [(route?.params as { studentId?: string })?.studentId]);

  useEffect(() => {
    loadData();

    const handleBankChange = async () => {
      try {
        const response = await getGoalBank({});
        const responseObj =
          typeof response === 'object' && response !== null
            ? (response as Record<string, unknown>)
            : null;
        const rawRes = responseObj?.data || responseObj?.goals || response;
        const rawResObj =
          typeof rawRes === 'object' && rawRes !== null
            ? (rawRes as Record<string, unknown>)
            : null;
        const loadedGoals = Array.isArray(rawRes)
          ? (rawRes as GoalBankItem[])
          : Array.isArray(rawResObj?.goals)
            ? (rawResObj.goals as GoalBankItem[])
            : [];
        setGoalBank(loadedGoals.length > 0 ? loadedGoals : getStoredGoalBank());
      } catch {
        setGoalBank(getStoredGoalBank());
      }
      setDomains(getStoredGoalDomains());
    };

    const handleDomainsChange = () => {
      setDomains(getStoredGoalDomains());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('melue_goal_bank_changed', handleBankChange);
      window.addEventListener('melue_goal_domains_changed', handleDomainsChange);
      return () => {
        window.removeEventListener('melue_goal_bank_changed', handleBankChange);
        window.removeEventListener('melue_goal_domains_changed', handleDomainsChange);
      };
    }
  }, [loadData]);

  // Synchronize slot goals when goal details are edited from institutional admin GoalDomainDefinitions
  useEffect(() => {
    if (goalBank.length === 0) return;
    setSlots((prev) => {
      let changed = false;
      const next: Slots = { station1: [...prev.station1], station2: [...prev.station2] };
      (['station1', 'station2'] as StationKey[]).forEach((stationKey) => {
        next[stationKey] = prev[stationKey].map((slotGoal) => {
          if (!slotGoal) return null;
          const updated = goalBank.find((g) => g.id === slotGoal.id);
          if (
            updated &&
            (updated.name !== slotGoal.name ||
              updated.domain !== slotGoal.domain ||
              updated.description !== slotGoal.description ||
              updated.masteryCriteria !== slotGoal.masteryCriteria ||
              updated.goalType !== slotGoal.goalType)
          ) {
            changed = true;
            return updated;
          }
          return slotGoal;
        });
      });
      return changed ? next : prev;
    });
  }, [goalBank]);

  useEffect(() => {
    if (!selectedStudentId) return;

    // Clear slots and fields when student changes
    setSlots({ station1: [null], station2: [null] });
    setReinforcementSchedule('Fixed Ratio (FR-2)');
    setCrisisProtocol(
      'Redirect to calm zone, offer deep pressure sensory mat, minimal verbal engagement.',
    );
    setAccommodations(
      'Visual schedule, 2-minute transition warnings, preferential seating near exit.',
    );
    setReviewCycle('6 Weeks');
    setCustomIupValues({});
    setLastSavedTimestamp(null);

    // Check if IUP is already finalized (permanent non-editable record)
    const cachedDraft = getStoredIupDraft(selectedStudentId) as CachedIupRecord | null;
    const lib = storage.getJSONSync<CachedIupRecord[]>(IUP_LIBRARY_STORAGE_KEY, []) || [];
    const inLib = lib.find(
      (item) => item.studentId === selectedStudentId || item.id === selectedStudentId,
    );
    const finalized = Boolean(
      cachedDraft?.isFinalized ||
      cachedDraft?.status === 'finalized' ||
      inLib?.isFinalized ||
      inLib?.status === 'Active',
    );
    setIsFinalizedRecord(finalized);

    // Restore cached draft or finalized library record if available
    const activeRecord = cachedDraft || inLib;
    if (activeRecord) {
      if (activeRecord.slots) {
        const slotsRecord = activeRecord.slots as Record<string, unknown>;
        const s1 = Array.isArray(slotsRecord.station1)
          ? (slotsRecord.station1 as (GoalBankItem | null)[])
          : [];
        const s2 = Array.isArray(slotsRecord.station2)
          ? (slotsRecord.station2 as (GoalBankItem | null)[])
          : [];
        setSlots({
          station1: s1.length > 0 ? s1 : [null],
          station2: s2.length > 0 ? s2 : [null],
        });
      }
      if (activeRecord.reinforcementSchedule) {
        setReinforcementSchedule(String(activeRecord.reinforcementSchedule));
      }
      if (activeRecord.crisisProtocol) {
        setCrisisProtocol(String(activeRecord.crisisProtocol));
      }
      if (activeRecord.accommodations) {
        setAccommodations(String(activeRecord.accommodations));
      }
      if (activeRecord.reviewCycle) {
        setReviewCycle(String(activeRecord.reviewCycle));
      }
      if (activeRecord.customFields) {
        setCustomIupValues(activeRecord.customFields);
      }
      if (activeRecord.saved_at || activeRecord.finalizedAt) {
        setLastSavedTimestamp(
          new Date(
            (activeRecord.saved_at || activeRecord.finalizedAt) as string,
          ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        );
      }
    }

    // Fetch context
    getIupContext(selectedStudentId)
      .then(({ data }) => setContext(data))
      .catch(() => setContext(null));

    // Fetch existing assigned goals to populate slots if not already restored from draft or library
    const currentBank = goalBank.length > 0 ? goalBank : getStoredGoalBank();
    if (currentBank.length > 0) {
      getStudentCaseload(selectedStudentId)
        .then(({ data }) => {
          if (data?.goals && !finalized) {
            setSlots((prev) => {
              // If user or activeRecord already has goals assigned in state, preserve them
              const hasExistingGoals = [...prev.station1, ...prev.station2].some(Boolean);
              if (hasExistingGoals) return prev;

              const next: Slots = {
                station1: [],
                station2: [],
              };
              data.goals.forEach((g: { id?: string; station?: number; slot?: number }) => {
                const gbGoal = currentBank.find((b) => b.id === g.id);
                if (gbGoal) {
                  const stationKey = g.station === 2 ? 'station2' : 'station1';
                  const slotIdx = typeof g.slot === 'number' ? g.slot : next[stationKey].length;
                  while (next[stationKey].length <= slotIdx) {
                    next[stationKey].push(null);
                  }
                  next[stationKey][slotIdx] = gbGoal;
                }
              });
              if (next.station1.length === 0) next.station1 = [null];
              if (next.station2.length === 0) next.station2 = [null];
              return next;
            });
          }
        })
        .catch(console.error);
    }
  }, [selectedStudentId]);

  const completedCandidates = useMemo(() => {
    return candidates
      .filter(isEligibleIupCandidate)
      .filter((c) => !isStudentIupFinalizedAndActive(c));
  }, [candidates]);

  const selectedCandidate = useMemo(
    () => completedCandidates.find((c) => c.id === selectedStudentId) || null,
    [completedCandidates, selectedStudentId],
  );

  const filteredCandidates = useMemo(() => {
    if (!searchStudentText.trim()) return completedCandidates;
    return completedCandidates.filter((c) =>
      c.name.toLowerCase().includes(searchStudentText.toLowerCase()),
    );
  }, [completedCandidates, searchStudentText]);

  const handleSelectGoal = async (goal: GoalBankItem) => {
    if (!selectorTarget || goal.active === false) return;
    const { station, slotIndex } = selectorTarget;

    if (isFinalizedRecord) {
      const msg =
        'This IUP has already been finalized and activated. It is a permanent, non-editable record.';
      if (typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Permanent Record', msg);
      return;
    }

    // Check duplicate goal assignment
    const isDuplicate = [...slots.station1, ...slots.station2].some(
      (existing) => existing && existing.id === goal.id,
    );
    if (isDuplicate) {
      const msg = `"${goal.name}" is already assigned to this student.`;
      if (typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Duplicate Goal', msg);
      return;
    }

    const currentStationSlots = [...(slots[station] || [null])];
    while (currentStationSlots.length <= slotIndex) {
      currentStationSlots.push(null);
    }
    currentStationSlots[slotIndex] = goal;

    const updatedSlots: Slots = {
      ...slots,
      [station]: currentStationSlots,
    };
    setSlots(updatedSlots);

    if (selectedStudentId) {
      try {
        const stationNumber = station === 'station1' ? 1 : 2;
        await assignGoalToSlot(selectedStudentId, {
          goalId: goal.id,
          name: goal.name,
          goalName: goal.name,
          domain: goal.domain,
          category: goal.domain,
          goalType: goal.goalType,
          masteryCriteria: goal.masteryCriteria,
          station: stationNumber,
          slot: slotIndex,
          source: 'iup_generation',
          allowMultipleGoals: true,
        });

        const targetIupId =
          selectedCandidate?.iupId || selectedCandidate?.iup_id || selectedStudentId;
        await saveIupDraft(targetIupId, {
          studentId: selectedStudentId,
          slots: updatedSlots,
          goals: [...updatedSlots.station1, ...updatedSlots.station2]
            .filter(Boolean)
            .map((g) => g?.id)
            .filter(Boolean),
          reinforcementSchedule,
          crisisProtocol,
          accommodations,
          reviewCycle,
          customFields: customIupValues,
          form_values: customIupValues,
        });
        setLastSavedTimestamp(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        );
        showToast('Goal assigned and draft saved successfully.', 'success');
      } catch (err) {
        console.error('Failed to assign goal or save draft:', err);
        showToast('Failed to save changes.', 'error');
      }
    }

    setSelectorTarget(null);
    setGoalSearch('');
  };

  const handleRemoveGoal = (station: StationKey, slotIndex: number) => {
    if (isFinalizedRecord) {
      const msg =
        'This IUP has already been finalized and activated. It is a permanent, non-editable record.';
      if (typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Permanent Record', msg);
      return;
    }

    Alert.alert('Remove Goal', 'Remove this goal from the IUP?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setSlots((prev) => {
            const next: Slots = { ...prev };
            next[station] = [...prev[station]];
            next[station][slotIndex] = null;
            return next;
          });

          if (selectedStudentId) {
            try {
              const stationNumber = station === 'station1' ? 1 : 2;
              await removeGoalFromSlot(selectedStudentId, {
                station: stationNumber,
                slot: slotIndex,
              });
            } catch (err) {
              console.error('Failed to remove goal from slot:', err);
            }
          }
        },
      },
    ]);
  };

  const handleAddSlot = (station: StationKey) => {
    if (isFinalizedRecord) {
      const msg =
        'This IUP has already been finalized and activated. It is a permanent, non-editable record.';
      if (typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Permanent Record', msg);
      return;
    }
    setSlots((prev) => {
      const nextIndex = prev[station].length;
      const next = {
        ...prev,
        [station]: [...prev[station], null],
      };
      setTimeout(() => {
        handleOpenGoalSelector(station, nextIndex);
      }, 50);
      return next;
    });
  };

  const handleRemoveSlot = (station: StationKey, slotIndex: number) => {
    if (isFinalizedRecord) {
      const msg =
        'This IUP has already been finalized and activated. It is a permanent, non-editable record.';
      if (typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Permanent Record', msg);
      return;
    }
    const hadGoal = Boolean(slots[station]?.[slotIndex]);
    setSlots((prev) => {
      const list = prev[station];
      if (list.length <= 1) {
        return {
          ...prev,
          [station]: [null],
        };
      }
      return {
        ...prev,
        [station]: list.filter((_, idx) => idx !== slotIndex),
      };
    });

    if (hadGoal && selectedStudentId) {
      const stationNumber = station === 'station1' ? 1 : 2;
      removeGoalFromSlot(selectedStudentId, {
        station: stationNumber,
        slot: slotIndex,
      }).catch((err) => {
        console.error('Failed to remove goal from slot:', err);
      });
    }
  };

  const hasAssignedGoal = (slots.station1?.some(Boolean) || slots.station2?.some(Boolean)) ?? false;

  const handlePreviewOpen = () => {
    if (!hasAssignedGoal) {
      showToast('Please assign at least one target goal to preview the IUP.', 'error');
      return;
    }
    setPreviewOpen(true);
  };

  const handleDraftSave = async () => {
    if (!selectedStudentId) return;
    if (isFinalizedRecord) {
      showToast('This finalized IUP is permanent and non-editable.', 'info');
      return;
    }
    if (!hasAssignedGoal) {
      showToast('Please assign at least one target goal before saving draft.', 'error');
      return;
    }

    try {
      const targetIupId =
        selectedCandidate?.iupId || selectedCandidate?.iup_id || selectedStudentId;
      await saveIupDraft(targetIupId, {
        studentId: selectedStudentId,
        slots,
        goals: [...slots.station1, ...slots.station2]
          .filter(Boolean)
          .map((g) => g?.id)
          .filter(Boolean),
        reinforcementSchedule,
        crisisProtocol,
        accommodations,
        reviewCycle,
        customFields: customIupValues,
        form_values: customIupValues,
      });
      setLastSavedTimestamp(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      );
      showToast('The IUP draft has been saved successfully.', 'success');
    } catch {
      showToast('Unable to save draft.', 'error');
    }
  };

  const handleFinalize = async () => {
    if (!selectedStudentId) return;
    if (isFinalizedRecord) {
      showToast('This IUP has already been finalized and activated.', 'info');
      return;
    }

    const allAssigned = [...slots.station1, ...slots.station2].filter(Boolean);
    if (allAssigned.length === 0) {
      const msg = 'Please assign at least one target goal before finalizing the IUP.';
      if (typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Goal Assignment Required', msg);
      }
      return;
    }

    const doFinalize = async () => {
      try {
        const targetIupId =
          selectedCandidate?.iupId || selectedCandidate?.iup_id || selectedStudentId;
        const studentName = context?.studentName || selectedCandidate?.name || 'Student';
        const program = context?.program || selectedCandidate?.program || 'ABA Therapy';

        await finalizeIup(targetIupId, {
          studentId: selectedStudentId,
          studentName,
          program,
          slots,
          goals: allAssigned.map((g) => g?.id).filter(Boolean),
          reinforcementSchedule,
          crisisProtocol,
          accommodations,
          reviewCycle,
          customFields: customIupValues,
          form_values: customIupValues,
          isFinalized: true,
          isPermanent: true,
          editable: false,
          status: 'finalized',
        });
        setIsFinalizedRecord(true);
        showToast(
          `IUP for ${studentName} has been finalized and activated successfully.`,
          'success',
        );
        Alert.alert(
          'IUP Finalized & Activated',
          `The Individualized Unit Plan for ${studentName} has been finalized and activated. It has been moved to the IUP Library.`,
          [
            {
              text: 'View in IUP Library',
              onPress: () => navigation?.navigate?.('IupLibrary' as never),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ],
        );

        // Remove finalized student from IUP Generation page
        setCandidates((prev) => {
          const remaining = prev.filter(
            (c) =>
              c.id !== selectedStudentId &&
              normalizeStudentId(c.id) !== normalizeStudentId(selectedStudentId) &&
              c.name.toLowerCase().trim() !== studentName.toLowerCase().trim(),
          );
          if (remaining.length > 0) {
            setSelectedStudentId(remaining[0].id);
          } else {
            setSelectedStudentId(null);
          }
          return remaining;
        });
      } catch {
        showToast('Failed to finalize IUP.', 'error');
      }
    };

    if (typeof window !== 'undefined' && window.confirm) {
      const ok = window.confirm(
        `Finalize IUP for ${context?.studentName || selectedCandidate?.name}?\n\nThis will officially activate the Individualized Unit Plan and move the student to Active Therapy status.`,
      );
      if (ok) doFinalize();
    } else {
      Alert.alert(
        `Finalize IUP for ${context?.studentName || selectedCandidate?.name}?`,
        'This will officially activate the Individualized Unit Plan and move the student to Active Therapy status.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Finalize & Activate', style: 'default', onPress: doFinalize },
        ],
      );
    }
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
      "        MELU'E FOUNDATION — INDIVIDUALIZED UNIT PLAN (IUP)       ",
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
        g
          ? `  [Slot ${i + 1}] ${g.name} (${g.domain})\n         Type: ${g.goalType === 'task_analysis' ? 'Task Analysis' : 'Standard'} | Mastery: ${g.masteryCriteria}\n         Objective: ${g.description}`
          : `  [Slot ${i + 1}] (Unassigned)`,
      ),
      '',
      'STATION 2 (Advanced & Generalization Skills):',
      ...slots.station2.map((g, i) =>
        g
          ? `  [Slot ${i + 1}] ${g.name} (${g.domain})\n         Type: ${g.goalType === 'task_analysis' ? 'Task Analysis' : 'Standard'} | Mastery: ${g.masteryCriteria}\n         Objective: ${g.description}`
          : `  [Slot ${i + 1}] (Unassigned)`,
      ),
      '',
      '----------------------------------------------------------------',
      '3. IMPLEMENTATION & PROTOCOL SPECIFICATIONS',
      `• Reinforcement Schedule: ${reinforcementSchedule}`,
      `• Accommodations: ${accommodations}`,
      `• Crisis & De-escalation Protocol: ${crisisProtocol}`,
      `• Clinical Review Cycle: ${reviewCycle}`,
      ...(Object.keys(customIupValues).length > 0
        ? [
            '',
            '----------------------------------------------------------------',
            '4. ADDITIONAL INSTITUTIONAL FIELDS',
            ...Object.entries(customIupValues).map(
              ([k, v]) =>
                `• ${k}: ${typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v || '—')}`,
            ),
          ]
        : []),
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
      g.active !== false &&
      (domainFilter === 'All' || g.domain === domainFilter) &&
      (!goalSearch ||
        g.name.toLowerCase().includes(goalSearch.toLowerCase()) ||
        g.description.toLowerCase().includes(goalSearch.toLowerCase())),
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
            <TouchableOpacity
              style={[styles.headerOutlineBtn, !hasAssignedGoal && { opacity: 0.5 }]}
              onPress={handlePreviewOpen}
              disabled={!hasAssignedGoal}
              accessibilityState={{ disabled: !hasAssignedGoal }}
            >
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
            {Boolean(lastSavedTimestamp) && (
              <Text style={styles.lastSavedText}>
                <Feather name="check" size={11} color={colors.successGreen} /> Draft saved at{' '}
                {lastSavedTimestamp}
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
                <StudentAvatar
                  name={selectedCandidate?.name}
                  studentId={selectedCandidate?.id}
                  photoUrl={
                    selectedCandidate?.photoUrl ||
                    selectedCandidate?.headshotUrl ||
                    selectedCandidate?.photo
                  }
                  size={36}
                  style={{ marginRight: 10 }}
                />
                <View>
                  <Text style={styles.dropdownSelectedName}>
                    {selectedCandidate ? selectedCandidate.name : 'Choose a student...'}
                  </Text>
                  <Text style={styles.dropdownSelectedMeta}>
                    {selectedCandidate
                      ? `${isCandidateInSession(selectedCandidate) ? 'In Session' : 'Ready for IUP'} · ${context?.program || selectedCandidate.program || 'Therapy'}`
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
                {filteredCandidates.length === 0 ? (
                  <Text style={styles.dropdownEmptyText}>
                    No students ready for IUP or in session
                  </Text>
                ) : (
                  filteredCandidates.map((c) => {
                    const isSelected = c.id === selectedStudentId;
                    const inSession = isCandidateInSession(c);
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
                        <StudentAvatar
                          name={c.name}
                          studentId={c.id}
                          photoUrl={c.photoUrl || c.headshotUrl || c.photo}
                          size={32}
                          style={{ marginRight: 8 }}
                        />
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
                            {inSession ? 'In Session' : 'Ready for IUP'} ·{' '}
                            {c.program || 'ABA Therapy'}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            inSession ? styles.statusActive : styles.statusReadyIup,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              inSession ? styles.statusActiveText : styles.statusReadyIupText,
                            ]}
                          >
                            {inSession ? 'In Session' : 'Ready for IUP'}
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

        {/* Finalized Banner if record is permanent & active */}
        {isFinalizedRecord && (
          <View style={styles.finalizedBanner}>
            <Feather name="lock" size={14} color="#1E40AF" />
            <Text style={styles.finalizedBannerText}>
              Finalized & Active IUP — Saved to IUP Library as a permanent, non-editable record.
            </Text>
          </View>
        )}

        {!selectedCandidate ? (
          <View style={styles.emptyWorkbenchCard}>
            <View style={styles.emptyWorkbenchIcon}>
              <Feather name="check-circle" size={32} color={colors.successGreen} />
            </View>
            <Text style={styles.emptyWorkbenchTitle}>No Students Awaiting IUP Generation</Text>
            <Text style={styles.emptyWorkbenchSub}>
              All eligible students currently have finalized and activated IUPs. You can review,
              search, and export permanent plans in the IUP Library.
            </Text>
            <TouchableOpacity
              style={styles.goToLibraryBtn}
              onPress={() => navigation?.navigate?.('IupLibrary' as never)}
              accessibilityRole="button"
              accessibilityLabel="View IUP Library"
            >
              <Feather name="book-open" size={15} color={colors.navyText} />
              <Text style={styles.goToLibraryBtnText}>Go to IUP Library</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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
                <Text
                  style={[
                    styles.tabBtnText,
                    activeWorkbenchTab === 'goals' && styles.tabBtnTextActive,
                  ]}
                >
                  Goal Assignment ({assignedGoalCount})
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
                onPress={() => setActiveWorkbenchTab('strategies')}
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
                      <View style={styles.stationTitleRow}>
                        <Text style={styles.cardTitle}>Station 1 — Basic Skills</Text>
                        <View style={styles.stationCountBadge}>
                          <Text style={styles.stationCountBadgeText}>
                            {slots.station1.filter(Boolean).length} / {slots.station1.length}{' '}
                            Assigned
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.stationSub}>
                        Foundational acquisition, receptive language, and early imitation
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addSlotHeaderBtn}
                      onPress={() => handleAddSlot('station1')}
                      accessibilityRole="button"
                      accessibilityLabel="Add Goal to Station 1"
                    >
                      <Feather name="plus" size={13} color={colors.navyText} />
                      <Text style={styles.addSlotHeaderBtnText}>Add Goal</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.slotList}>
                    {slots.station1.map((goal, idx) => (
                      <View key={`s1-${idx}`} style={styles.slotContainer}>
                        <View style={styles.slotHeaderRow}>
                          <Text style={styles.slotTag}>Slot {idx + 1}</Text>
                          {slots.station1.length > 1 && (
                            <TouchableOpacity
                              style={styles.removeSlotBtn}
                              onPress={() => handleRemoveSlot('station1', idx)}
                              accessibilityRole="button"
                              accessibilityLabel={`Remove Station 1 Slot ${idx + 1}`}
                            >
                              <Feather name="x" size={13} color={colors.mutedText} />
                              <Text style={styles.removeSlotBtnText}>Remove Slot</Text>
                            </TouchableOpacity>
                          )}
                        </View>
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
                                <Feather
                                  name="check-circle"
                                  size={12}
                                  color={colors.successGreen}
                                />
                                <Text style={styles.masteryText}>
                                  Mastery Criteria: {goal.masteryCriteria}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.goalActions}>
                              <TouchableOpacity
                                style={styles.changeGoalBtn}
                                onPress={() => handleOpenGoalSelector('station1', idx)}
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
                            onPress={() => handleOpenGoalSelector('station1', idx)}
                          >
                            <View style={styles.plusIconWrap}>
                              <Feather name="plus" size={16} color={colors.navyText} />
                            </View>
                            <Text style={styles.emptySlotText}>Assign Goal from Goal Bank</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.addSlotFooterBtn}
                      onPress={() => handleAddSlot('station1')}
                      accessibilityRole="button"
                      accessibilityLabel="Add Goal to Station 1"
                    >
                      <Feather name="plus-circle" size={15} color={colors.navyText} />
                      <Text style={styles.addSlotFooterBtnText}>+ Add Goal to Station 1</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Station 2 Card */}
                <View style={styles.card}>
                  <View style={styles.stationHeader}>
                    <View style={[styles.stationNumberBadge, { backgroundColor: '#DBEAFE' }]}>
                      <Text style={[styles.stationNumberText, { color: '#1E40AF' }]}>2</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.stationTitleRow}>
                        <Text style={styles.cardTitle}>Station 2 — Advanced Skills</Text>
                        <View style={styles.stationCountBadge}>
                          <Text style={styles.stationCountBadgeText}>
                            {slots.station2.filter(Boolean).length} / {slots.station2.length}{' '}
                            Assigned
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.stationSub}>
                        Expressive language, academic readiness, and generalization
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addSlotHeaderBtn}
                      onPress={() => handleAddSlot('station2')}
                      accessibilityRole="button"
                      accessibilityLabel="Add Goal to Station 2"
                    >
                      <Feather name="plus" size={13} color={colors.navyText} />
                      <Text style={styles.addSlotHeaderBtnText}>Add Goal</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.slotList}>
                    {slots.station2.map((goal, idx) => (
                      <View key={`s2-${idx}`} style={styles.slotContainer}>
                        <View style={styles.slotHeaderRow}>
                          <Text style={styles.slotTag}>Slot {idx + 1}</Text>
                          {slots.station2.length > 1 && (
                            <TouchableOpacity
                              style={styles.removeSlotBtn}
                              onPress={() => handleRemoveSlot('station2', idx)}
                              accessibilityRole="button"
                              accessibilityLabel={`Remove Station 2 Slot ${idx + 1}`}
                            >
                              <Feather name="x" size={13} color={colors.mutedText} />
                              <Text style={styles.removeSlotBtnText}>Remove Slot</Text>
                            </TouchableOpacity>
                          )}
                        </View>
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
                                <Feather
                                  name="check-circle"
                                  size={12}
                                  color={colors.successGreen}
                                />
                                <Text style={styles.masteryText}>
                                  Mastery Criteria: {goal.masteryCriteria}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.goalActions}>
                              <TouchableOpacity
                                style={styles.changeGoalBtn}
                                onPress={() => handleOpenGoalSelector('station2', idx)}
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
                            onPress={() => handleOpenGoalSelector('station2', idx)}
                          >
                            <View style={styles.plusIconWrap}>
                              <Feather name="plus" size={16} color={colors.navyText} />
                            </View>
                            <Text style={styles.emptySlotText}>Assign Goal from Goal Bank</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.addSlotFooterBtn}
                      onPress={() => handleAddSlot('station2')}
                      accessibilityRole="button"
                      accessibilityLabel="Add Goal to Station 2"
                    >
                      <Feather name="plus-circle" size={15} color={colors.navyText} />
                      <Text style={styles.addSlotFooterBtnText}>+ Add Goal to Station 2</Text>
                    </TouchableOpacity>
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
                      <Text style={styles.contextSectionTitle}>
                        Behavioral Functions & Triggers
                      </Text>
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
                      onChangeText={setReinforcementSchedule}
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
                          style={[
                            styles.cycleChip,
                            reviewCycle === cycle && styles.cycleChipSelected,
                          ]}
                          onPress={() => setReviewCycle(cycle)}
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
              <TouchableOpacity
                style={[
                  styles.saveDraftBtn,
                  (isFinalizedRecord || !hasAssignedGoal) && { opacity: 0.5 },
                ]}
                onPress={handleDraftSave}
                disabled={isFinalizedRecord || !hasAssignedGoal}
                accessibilityState={{ disabled: isFinalizedRecord || !hasAssignedGoal }}
              >
                <Feather
                  name={isFinalizedRecord ? 'lock' : 'save'}
                  size={15}
                  color={colors.navyText}
                />
                <Text style={styles.saveDraftBtnText}>
                  {isFinalizedRecord ? 'Draft Locked' : 'Save Draft'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.previewBtn, !hasAssignedGoal && { opacity: 0.5 }]}
                onPress={handlePreviewOpen}
                disabled={!hasAssignedGoal}
                accessibilityState={{ disabled: !hasAssignedGoal }}
              >
                <Feather name="eye" size={15} color={colors.navyText} />
                <Text style={styles.previewBtnText}>Full Preview</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.finalizeBtn, isFinalizedRecord && { backgroundColor: '#E2E8F0' }]}
                onPress={handleFinalize}
                disabled={isFinalizedRecord}
              >
                <Feather
                  name={isFinalizedRecord ? 'lock' : 'check-circle'}
                  size={16}
                  color={colors.navyText}
                />
                <Text style={styles.finalizeBtnText}>
                  {isFinalizedRecord ? 'Finalized & Active' : 'Finalize & Activate IUP'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* GOAL SELECTOR MODAL */}
      <Modal
        visible={!!selectorTarget}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectorTarget(null)}
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
                onPress={() => setSelectorTarget(null)}
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
                onChangeText={setGoalSearch}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {domainOptions.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.domainFilterChip,
                    domainFilter === d && styles.domainFilterChipActive,
                  ]}
                  onPress={() => setDomainFilter(d)}
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
                  <Text style={styles.emptyResultsText}>
                    No goals found matching your search filter.
                  </Text>
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
      <Modal
        visible={previewOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPreviewOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  IUP Preview — {context?.studentName || selectedCandidate?.name || 'Student'}
                </Text>
                <Text style={styles.modalSub}>
                  Individualized Behavior Intervention Plan Document
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPreviewOpen(false)}>
                <Feather name="x" size={20} color={colors.navyText} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 420 }}
              contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.sm }}
            >
              <View style={styles.previewCard}>
                <Text style={styles.previewSectionTitle}>Student & Demographic Baseline</Text>
                <Text style={styles.previewText}>
                  Age: {context?.age ?? selectedCandidate?.age ?? '—'} · DOB: {context?.dob || '—'}
                </Text>
                <Text style={styles.previewText}>
                  Program: {context?.program || selectedCandidate?.program || 'ABA Therapy'} ·
                  Enrolled: {context?.enrollmentDate || '—'}
                </Text>
              </View>

              <View style={styles.previewCard}>
                <Text style={styles.previewSectionTitle}>Clinical Assessment Summary</Text>
                <Text style={styles.previewLabel}>Skills Strengths:</Text>
                <Text style={styles.previewText}>
                  {context?.skillsStrengths || 'Strong visual matching and receptive skills.'}
                </Text>
                <Text style={styles.previewLabel}>Behavioral Functions:</Text>
                <Text style={styles.previewText}>
                  {context?.behaviorFunctions || 'Escape-maintained during task transitions.'}
                </Text>
                <Text style={styles.previewLabel}>Top Reinforcers:</Text>
                <Text style={styles.previewText}>
                  {(context?.topReinforcers || ['Bubbles', 'Musical Toy', 'Token Stars']).join(
                    ', ',
                  )}
                </Text>
              </View>

              <View style={styles.previewCard}>
                <Text style={styles.previewSectionTitle}>Assigned Target Goals</Text>
                <Text style={styles.previewLabel}>Station 1 (Basic Skills):</Text>
                {slots.station1.map((g, i) =>
                  g ? (
                    <Text key={i} style={styles.previewGoalLine}>
                      {i + 1}. {g.name} ({g.domain}) — {g.masteryCriteria}
                    </Text>
                  ) : null,
                )}
                <Text style={[styles.previewLabel, { marginTop: spacing.sm }]}>
                  Station 2 (Advanced Skills):
                </Text>
                {slots.station2.map((g, i) =>
                  g ? (
                    <Text key={i} style={styles.previewGoalLine}>
                      {i + 1}. {g.name} ({g.domain}) — {g.masteryCriteria}
                    </Text>
                  ) : null,
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

              {Object.keys(customIupValues).length > 0 && (
                <View style={styles.previewCard}>
                  <Text style={styles.previewSectionTitle}>Additional Institutional Fields</Text>
                  {Object.entries(customIupValues).map(([k, v]) => (
                    <View key={k} style={{ marginBottom: 4 }}>
                      <Text style={styles.previewLabel}>{k}:</Text>
                      <Text style={styles.previewText}>
                        {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v || '—')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.previewFooter}>
              <TouchableOpacity
                style={styles.previewCloseBtn}
                onPress={() => setPreviewOpen(false)}
              >
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
  finalizedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radius.md,
    padding: 12,
  },
  finalizedBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  headerTitleWrap: {
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
  selectorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
  dropdownEmptyText: {
    padding: spacing.md,
    fontSize: 13,
    color: colors.mutedText,
    textAlign: 'center',
  },
  dropdownItemText: { fontSize: 14, fontWeight: '600', color: colors.navyText },
  dropdownItemTextActive: { color: colors.navyText, fontWeight: '700' },
  dropdownItemSub: { fontSize: 11, color: colors.mutedText, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusActiveText: { fontSize: 10, fontWeight: '700', color: '#166534' },
  statusReadyIup: { backgroundColor: '#DBEAFE' },
  statusReadyIupText: { fontSize: 10, fontWeight: '700', color: '#1E40AF' },
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
  goalsIntroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  goalsIntroIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalsIntroTitle: { fontSize: 13, fontWeight: '700', color: '#1E40AF' },
  goalsIntroText: { fontSize: 12, color: '#3B82F6', marginTop: 2, lineHeight: 17 },

  stationHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  stationCountBadge: {
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  stationCountBadgeText: { fontSize: 11, fontWeight: '700', color: colors.bodyText },

  addSlotHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryYellow,
    borderWidth: 1,
    borderColor: colors.primaryYellowDark,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  addSlotHeaderBtnText: { fontSize: 12, fontWeight: '700', color: colors.navyText },

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
  slotHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeSlotBtnText: { fontSize: 11, color: colors.mutedText, fontWeight: '500' },
  slotTag: { fontSize: 11, fontWeight: '700', color: colors.mutedText, textTransform: 'uppercase' },
  addSlotFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgApp,
    marginTop: spacing.xs,
  },
  addSlotFooterBtnText: { fontSize: 13, fontWeight: '700', color: colors.navyText },
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
  domainChip: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  domainChipText: { fontSize: 10, fontWeight: '700', color: '#3730A3' },
  taskChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
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
  demoItem: {
    flexGrow: 1,
    minWidth: 160,
    backgroundColor: colors.bgApp,
    padding: spacing.md,
    borderRadius: radius.md,
  },
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
  manageGoalsLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryYellow,
    marginRight: spacing.sm,
  },
  manageGoalsLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navyText,
  },
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
  emptyWorkbenchCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  emptyWorkbenchIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWorkbenchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyText,
    textAlign: 'center',
  },
  emptyWorkbenchSub: {
    fontSize: 14,
    color: colors.mutedText,
    textAlign: 'center',
    maxWidth: 480,
    lineHeight: 20,
  },
  goToLibraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  goToLibraryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
});
