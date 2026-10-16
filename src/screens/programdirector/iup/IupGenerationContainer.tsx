import React, { useEffect, useState, useMemo } from 'react';
import { Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth, ROLES } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { getActiveRole } from '../../../api/token';
import {
  assignGoalToSlot,
  removeGoalFromSlot,
  getStudentCaseload,
} from '../../../api/programDirectorApi';
import {
  useIupCandidatesQuery,
  useIupContextQuery,
  useGoalBankQuery,
  useSaveIupDraftMutation,
  useFinalizeIupMutation,
} from '../../../hooks';
import ScreenLoader from '../../../components/ScreenLoader';
import { routeMapForRole } from '../../../components/appNavConfig';
import type { ProgramDirectorStackParamList, CoordinatorStackParamList } from '../../../types';

import IupGenerationPresenter, {
  type GoalBankItem,
  type IupCandidate,
  type IupContext,
  type StationKey,
  type Slots,
} from './IupGenerationPresenter';

export type IupGenerationContainerProps = NativeStackScreenProps<
  ProgramDirectorStackParamList | CoordinatorStackParamList,
  'IupGeneration'
>;

export default function IupGenerationContainer({ navigation, route }: IupGenerationContainerProps) {
  const auth = useAuth();
  const session = auth?.session;
  const currentRole = session?.role || getActiveRole() || 'coordinator';
  const isCoordinator =
    currentRole === ROLES.COORDINATOR ||
    currentRole === 'coordinator' ||
    currentRole === 'therapy_coordinator';
  const { showToast } = useToast();

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slots>({ station1: [null, null], station2: [null, null] });
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
  const [customIupValues, setCustomIupValues] = useState<Record<string, any>>({});

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

  // Preview & Export State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportContent, setExportContent] = useState<string | null>(null);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);

  // TanStack React Query Hooks
  const { data: candidatesData, isLoading: candidatesLoading } = useIupCandidatesQuery();
  const { data: goalBankData } = useGoalBankQuery();
  const { data: contextData } = useIupContextQuery(selectedStudentId);
  const saveDraftMutation = useSaveIupDraftMutation();
  const finalizeMutation = useFinalizeIupMutation();

  const candidates: IupCandidate[] = useMemo(() => {
    return Array.isArray(candidatesData) ? candidatesData : [];
  }, [candidatesData]);

  const goalBank: GoalBankItem[] = useMemo(() => {
    return Array.isArray(goalBankData) ? goalBankData : [];
  }, [goalBankData]);

  const context: IupContext | null = (contextData as IupContext) || null;

  useEffect(() => {
    const preId = (route.params as { studentId?: string })?.studentId;
    if (preId) {
      setSelectedStudentId(preId);
    } else if (candidates.length > 0 && !selectedStudentId) {
      setSelectedStudentId(candidates[0].id);
    }
  }, [route.params, candidates, selectedStudentId]);

  useEffect(() => {
    if (!selectedStudentId) return;

    setSlots({ station1: [null, null], station2: [null, null] });
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

    if (goalBank.length > 0) {
      getStudentCaseload(selectedStudentId)
        .then(({ data }) => {
          if (data?.goals) {
            setSlots((_prev) => {
              const next: Slots = { station1: [null, null], station2: [null, null] };
              data.goals.forEach((g: any) => {
                const gbGoal = goalBank.find((b) => b.id === g.id);
                if (gbGoal) {
                  const stationKey = g.station === 2 ? 'station2' : 'station1';
                  const slotIndex =
                    typeof g.slot === 'number' ? g.slot : next[stationKey][0] === null ? 0 : 1;
                  if (slotIndex >= 0 && slotIndex <= 1) {
                    next[stationKey][slotIndex] = gbGoal;
                  }
                }
              });
              return next;
            });
          }
        })
        .catch(console.error);
    }
  }, [selectedStudentId, goalBank]);

  const completedCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const statusLower = (c.status || '').toLowerCase();
      const assessStatusLower = (c.assessmentStatus || '').toLowerCase();
      if (statusLower.includes('in assessment') || assessStatusLower.includes('in assessment')) {
        return false;
      }
      return (
        c.assessmentStatus === '100% Complete' ||
        c.assessmentProgress === 100 ||
        c.status === 'Ready for IUP' ||
        c.hasAssessmentData === true
      );
    });
  }, [candidates]);

  const selectedCandidate = useMemo(
    () => completedCandidates.find((c) => c.id === selectedStudentId) ?? null,
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

    setSlots((prev) => {
      const next: Slots = { ...prev };
      next[station] = [...prev[station]];
      next[station][slotIndex] = goal;
      return next;
    });
    setSelectorTarget(null);

    if (selectedStudentId) {
      try {
        const stationNumber = station === 'station1' ? 1 : 2;
        await assignGoalToSlot(selectedStudentId, {
          goal_id: goal.id,
          station: stationNumber,
          slot: slotIndex,
        });
      } catch (err) {
        console.error('Failed to persist goal assignment:', err);
      }
    }
  };

  const handleRemoveGoal = (station: StationKey, slotIndex: number) => {
    Alert.alert('Remove Goal', 'Are you sure you want to remove this target goal from the slot?', [
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

  const handleDraftSave = async () => {
    if (!selectedStudentId) return;
    try {
      const targetIupId =
        selectedCandidate?.iupId || (selectedCandidate as any)?.iup_id || selectedStudentId;
      await saveDraftMutation.mutateAsync({
        iupId: targetIupId,
        payload: {
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
        },
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
    const allAssigned = [...slots.station1, ...slots.station2].filter(Boolean);
    if (allAssigned.length === 0) {
      if (typeof window !== 'undefined') {
        window.alert('Please assign at least one target goal before finalizing the IUP.');
      } else {
        Alert.alert(
          'Goal Assignment Required',
          'Please assign at least one target goal before finalizing the IUP.',
        );
      }
      return;
    }

    const doFinalize = async () => {
      try {
        const targetIupId =
          selectedCandidate?.iupId || (selectedCandidate as any)?.iup_id || selectedStudentId;
        await finalizeMutation.mutateAsync({
          iupId: targetIupId,
          payload: {
            slots,
            goals: allAssigned.map((g) => g?.id).filter(Boolean),
            reinforcementSchedule,
            crisisProtocol,
            accommodations,
            reviewCycle,
            customFields: customIupValues,
            form_values: customIupValues,
          },
        });
        showToast(
          'IUP Finalized & Activated. Goals are now in the Teacher Session workbench.',
          'success',
        );
        navigation?.navigate?.('SessionDataCollection' as never);
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

  if (candidatesLoading && candidates.length === 0) return <ScreenLoader />;

  const filteredGoals = goalBank.filter(
    (g) =>
      g.active !== false &&
      (domainFilter === 'All' || g.domain === domainFilter) &&
      (!goalSearch ||
        g.name.toLowerCase().includes(goalSearch.toLowerCase()) ||
        g.description.toLowerCase().includes(goalSearch.toLowerCase())),
  );

  return (
    <IupGenerationPresenter
      candidates={candidates}
      completedCandidates={completedCandidates}
      filteredCandidates={filteredCandidates}
      selectedCandidate={selectedCandidate}
      selectedStudentId={selectedStudentId}
      context={context}
      slots={slots}
      activeWorkbenchTab={activeWorkbenchTab}
      reinforcementSchedule={reinforcementSchedule}
      crisisProtocol={crisisProtocol}
      accommodations={accommodations}
      reviewCycle={reviewCycle}
      customIupValues={customIupValues}
      studentDropdownOpen={studentDropdownOpen}
      searchStudentText={searchStudentText}
      selectorTarget={selectorTarget}
      goalSearch={goalSearch}
      domainFilter={domainFilter}
      filteredGoals={filteredGoals}
      previewOpen={previewOpen}
      exportContent={exportContent}
      lastSavedTimestamp={lastSavedTimestamp}
      onSelectStudent={(id) => {
        setSelectedStudentId(id);
        setStudentDropdownOpen(false);
        setSearchStudentText('');
      }}
      onToggleDropdown={() => setStudentDropdownOpen((prev) => !prev)}
      onSearchStudent={setSearchStudentText}
      onTabChange={setActiveWorkbenchTab}
      onOpenGoalSelector={(station, slotIndex) => setSelectorTarget({ station, slotIndex })}
      onCloseGoalSelector={() => setSelectorTarget(null)}
      onSelectGoal={handleSelectGoal}
      onRemoveGoal={handleRemoveGoal}
      onDraftSave={handleDraftSave}
      onFinalize={handleFinalize}
      onOpenPreview={() => setPreviewOpen(true)}
      onClosePreview={() => setPreviewOpen(false)}
      onExport={handleExport}
      onCloseExport={() => setExportContent(null)}
      onReinforcementScheduleChange={setReinforcementSchedule}
      onCrisisProtocolChange={setCrisisProtocol}
      onAccommodationsChange={setAccommodations}
      onReviewCycleChange={setReviewCycle}
      onCustomIupValuesChange={(key, val) =>
        setCustomIupValues((prev) => ({ ...prev, [key]: val }))
      }
      onGoalSearchChange={setGoalSearch}
      onDomainFilterChange={setDomainFilter}
      onNavbarTabPress={(t) => {
        if (t === 'IUP Creation & Goal Assignment') return;
        const routeMap = routeMapForRole(
          currentRole ?? (isCoordinator ? 'coordinator' : 'program_director'),
        );
        const target = routeMap?.[t];
        if (target) navigation?.navigate?.(target as never);
      }}
    />
  );
}
