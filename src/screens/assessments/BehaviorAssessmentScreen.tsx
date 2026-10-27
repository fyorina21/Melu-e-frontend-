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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import AccessibleModal from '../../components/AccessibleModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { confirmAction } from '../../utils/dialogs';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import {
  getBehaviorAssessment,
  saveBehaviorAssessment,
  getTeacherStudentProfile,
  getBehaviorIncidentOptions,
  type BehaviorIncidentOptionItem,
} from '../../api/teacherExtrasApi';
import { getFormConfig } from '../../api/institutionalAdminApi';
import type { SessionStackParamList } from '../../types';
import {
  TABS,
  MASS_ITEMS,
  FAST_ITEMS,
  BEHAVIOR_PRESETS,
  INTENSITIES,
  calculateMassCategoryScores,
  calculateFastCategoryScores,
  validateTargetBehaviorCompleteness,
  type AssessmentTab,
  type MassItem,
  type FastItem,
  type BehaviorRecord,
  type StudentProfile,
  type BehaviorTargetAssessmentData,
  type FastSettingContext,
} from './behavior/behaviorTypes';
import { MassAssessmentTab } from './behavior/components/MassAssessmentTab';
import { FastAssessmentTab } from './behavior/components/FastAssessmentTab';

type Props = NativeStackScreenProps<SessionStackParamList, 'BehaviorAssessment'>;

export default function BehaviorAssessmentScreen({ navigation, route }: Props) {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const urlSid =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('studentId')
      : null;
  const localSid =
    typeof localStorage !== 'undefined' ? localStorage.getItem('last_assessment_student_id') : null;
  const rawId = route?.params?.studentId || urlSid || localSid || 'student-a';
  const studentId = rawId === 'stu-1' ? 'student-a' : rawId;

  useEffect(() => {
    if (typeof localStorage !== 'undefined' && studentId) {
      try {
        localStorage.setItem('last_assessment_student_id', studentId);
      } catch {}
    }
  }, [studentId]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [massItems, setMassItems] = useState<MassItem[]>(MASS_ITEMS);
  const [fastItems, setFastItems] = useState<FastItem[]>(FAST_ITEMS);
  const [tab, setTab] = useState<AssessmentTab>('MASS');

  // Multi-target behaviors state
  const [targetBehaviors, setTargetBehaviors] = useState<BehaviorTargetAssessmentData[]>([
    {
      id: 'default-1',
      behaviorName: 'Aggression',
      definition: 'Physical or verbal acts directed toward others',
      massAnswers: {},
      fastAnswers: {},
      abcNotes: '',
    },
  ]);
  const [selectedBehaviorIndex, setSelectedBehaviorIndex] = useState<number>(0);
  const [showAddBehaviorModal, setShowAddBehaviorModal] = useState(false);
  const [selectedCatalogBehavior, setSelectedCatalogBehavior] = useState<{
    name: string;
    definition: string;
    category?: string;
  } | null>(null);
  const [behaviorCatalogSearch, setBehaviorCatalogSearch] = useState('');
  const [institutionalBehaviors, setInstitutionalBehaviors] = useState<
    BehaviorIncidentOptionItem[]
  >([]);

  // ABC Catalog behaviors list combining institutional options and standard presets
  const catalogBehaviors = useMemo(() => {
    const list: Array<{ name: string; definition: string; category: string }> = [];
    const seen = new Set<string>();

    if (Array.isArray(institutionalBehaviors) && institutionalBehaviors.length > 0) {
      institutionalBehaviors.forEach((item) => {
        const name = (item?.name || '').trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          list.push({
            name,
            definition: item.definition || `Institutional catalog behavior: ${name}`,
            category: item.default_category || 'Institutional',
          });
        }
      });
    }

    BEHAVIOR_PRESETS.forEach((preset) => {
      const name = String(preset).trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({
          name,
          definition: `Institutional preset behavior: ${preset}`,
          category: 'Standard',
        });
      }
    });

    return list;
  }, [institutionalBehaviors]);

  const filteredCatalogBehaviors = useMemo(() => {
    const q = behaviorCatalogSearch.trim().toLowerCase();
    if (!q) return catalogBehaviors;
    return catalogBehaviors.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.definition.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q),
    );
  }, [catalogBehaviors, behaviorCatalogSearch]);

  const openAddBehaviorModal = useCallback(() => {
    setBehaviorCatalogSearch('');
    // Automatically select the first behavior from the catalog that hasn't already been added
    const firstAvailable = catalogBehaviors.find(
      (b) => !targetBehaviors.some((tb) => tb.behaviorName.toLowerCase() === b.name.toLowerCase()),
    );
    setSelectedCatalogBehavior(firstAvailable || (catalogBehaviors[0] ?? null));
    setShowAddBehaviorModal(true);
  }, [catalogBehaviors, targetBehaviors]);

  // Submit with Enter key while modal is active
  useEffect(() => {
    if (!showAddBehaviorModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (
          selectedCatalogBehavior &&
          !targetBehaviors.some(
            (b) => b.behaviorName.toLowerCase() === selectedCatalogBehavior.name.toLowerCase(),
          )
        ) {
          handleAddTargetBehavior(selectedCatalogBehavior.name, selectedCatalogBehavior.definition);
        }
      } else if (e.key === 'Escape') {
        setShowAddBehaviorModal(false);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showAddBehaviorModal, selectedCatalogBehavior, targetBehaviors]);

  // ABC Records
  const [records, setRecords] = useState<BehaviorRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BehaviorRecord>({
    id: '',
    behavior: BEHAVIOR_PRESETS[0],
    frequency: '',
    duration: '',
    intensity: 'Medium',
    trigger: '',
    consequence: '',
  });

  const load = useCallback(async () => {
    try {
      const { data: res } = await getTeacherStudentProfile(studentId);
      setProfile(res);
    } catch {
      setProfile(null);
    }

    // Load active ABC catalog options for institutional behaviors
    try {
      const options = await getBehaviorIncidentOptions();
      if (options && Array.isArray(options.behaviors) && options.behaviors.length > 0) {
        setInstitutionalBehaviors(options.behaviors);
      }
    } catch {
      // Fallback presets handled via default UI
    }

    try {
      const { data: cfg } = await getFormConfig('Behavioral Assessment');
      if (cfg && Array.isArray(cfg.fields) && cfg.fields.length > 0) {
        const visibleFields = cfg.fields.filter((f: any) => f.visible !== false);
        const mFields = visibleFields.filter(
          (f: any) =>
            (f.section && f.section.toUpperCase().includes('MASS')) || /^M\d+/i.test(f.id),
        );
        const fFields = visibleFields.filter(
          (f: any) =>
            (f.section && f.section.toUpperCase().includes('FAST')) || /^F\d+/i.test(f.id),
        );

        if (mFields.length >= 51) {
          // If all 51 form builder fields configured, update questions
          setMassItems(MASS_ITEMS);
        }
        if (fFields.length >= 27) {
          setFastItems(FAST_ITEMS);
        }
      }
    } catch {}

    try {
      const { data: saved } = await getBehaviorAssessment(studentId);
      const savedData = (saved?.data ?? {}) as any;

      if (Array.isArray(savedData.target_behaviors) && savedData.target_behaviors.length > 0) {
        const parsedBehaviors: BehaviorTargetAssessmentData[] = savedData.target_behaviors.map(
          (b: any, idx: number) => ({
            id: b.id || `target-${idx}-${Date.now()}`,
            behaviorName: b.behavior_name || b.behaviorName || `Target ${idx + 1}`,
            definition: b.definition || b.behaviorDefinition || '',
            massAnswers: b.mass_responses || b.massAnswers || {},
            fastAnswers: b.fast_responses || b.fastAnswers || {},
            abcNotes: b.abc_notes || b.abcNotes || '',
            dominantFunction: b.dominant_function,
            hypothesizedFunction: b.hypothesized_function,
            status: b.status,
          }),
        );
        setTargetBehaviors(parsedBehaviors);
      } else if (savedData.massAnswers || savedData.fastAnswers) {
        setTargetBehaviors([
          {
            id: 'legacy-1',
            behaviorName: 'Aggression',
            definition: 'Physical or verbal acts directed toward others',
            massAnswers: savedData.massAnswers || {},
            fastAnswers: savedData.fastAnswers || {},
            abcNotes: '',
          },
        ]);
      }
      setRecords(savedData.records ?? []);
    } catch {
      setRecords([]);
    }
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = (e: any) => {
      const name = (e?.detail?.formName || '').toLowerCase();
      if (name.includes('behavior') && !name.includes('incident')) {
        load();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('melue_form_config_changed', handler);
      return () => window.removeEventListener('melue_form_config_changed', handler);
    }
  }, [load]);

  // Current active target behavior
  const activeBehaviorIndex = Math.min(
    Math.max(0, selectedBehaviorIndex),
    Math.max(0, targetBehaviors.length - 1),
  );
  const activeBehavior: BehaviorTargetAssessmentData = targetBehaviors[activeBehaviorIndex] || {
    id: 'default',
    behaviorName: 'Behavior 1',
    definition: '',
    massAnswers: {},
    fastAnswers: {},
    abcNotes: '',
  };

  const handleSetMassAnswer = (itemId: string, value: string) => {
    setTargetBehaviors((prev) => {
      const copy = [...prev];
      const cur = { ...copy[activeBehaviorIndex] };
      cur.massAnswers = { ...cur.massAnswers, [itemId]: value };
      copy[activeBehaviorIndex] = cur;
      return copy;
    });
  };

  const handleSetFastAnswer = (itemId: string, value: boolean) => {
    setTargetBehaviors((prev) => {
      const copy = [...prev];
      const cur = { ...copy[activeBehaviorIndex] };
      cur.fastAnswers = { ...cur.fastAnswers, [itemId]: value };
      copy[activeBehaviorIndex] = cur;
      return copy;
    });
  };

  const handleToggleSettingContext = (ctx: FastSettingContext) => {
    setTargetBehaviors((prev) => {
      const copy = [...prev];
      const cur = { ...copy[activeBehaviorIndex] };
      const currentCtx = cur.settingContext || [];
      const updatedCtx = currentCtx.includes(ctx)
        ? currentCtx.filter((c) => c !== ctx)
        : [...currentCtx, ctx];
      cur.settingContext = updatedCtx;
      copy[activeBehaviorIndex] = cur;
      return copy;
    });
  };

  const handleUpdateActiveAbcNotes = (text: string) => {
    setTargetBehaviors((prev) => {
      const copy = [...prev];
      const cur = { ...copy[activeBehaviorIndex] };
      cur.abcNotes = text;
      copy[activeBehaviorIndex] = cur;
      return copy;
    });
  };

  // Fix 1: Target Behavior State Management & Immediate Backend Persistence
  const handleAddTargetBehavior = async (name: string, definition?: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Behavior Name Required', 'Please provide a name for the target behavior.');
      return;
    }
    if (targetBehaviors.some((b) => b.behaviorName.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Duplicate Behavior', 'This behavior is already added to the assessment.');
      return;
    }

    const newBehavior: BehaviorTargetAssessmentData = {
      id: `target-${Date.now()}`,
      behaviorName: trimmed,
      definition: (definition || '').trim(),
      massAnswers: {},
      fastAnswers: {},
      abcNotes: '',
      status: 'draft',
    };

    const updatedBehaviors = [...targetBehaviors, newBehavior];
    setTargetBehaviors(updatedBehaviors);
    setSelectedBehaviorIndex(updatedBehaviors.length - 1);
    setShowAddBehaviorModal(false);
    setSelectedCatalogBehavior(null);
    setBehaviorCatalogSearch('');

    // Immediately persist to backend and storage so it never vanishes upon reload/re-render
    try {
      await saveBehaviorAssessment(studentId, {
        tab,
        target_behaviors: updatedBehaviors.map((b) => ({
          behavior_name: b.behaviorName,
          definition: b.definition,
          mass_responses: b.massAnswers || {},
          fast_responses: b.fastAnswers || {},
          abc_notes: b.abcNotes || '',
          status: 'draft',
        })),
        massAnswers: newBehavior.massAnswers,
        fastAnswers: newBehavior.fastAnswers,
        records,
        status: 'draft',
        is_submitting: false,
      });
    } catch (err) {
      console.warn('Failed to immediately persist added behavior', err);
    }
  };

  const handleRemoveTargetBehavior = (indexToRemove: number) => {
    const behaviorToRemove = targetBehaviors[indexToRemove];
    if (!behaviorToRemove) return;

    if (targetBehaviors.length <= 1) {
      confirmAction({
        title: 'Reset Target Behavior',
        message: `Are you sure you want to remove "${behaviorToRemove.behaviorName}"? This will reset the target behavior and clear its questionnaire responses.`,
        confirmLabel: 'Reset',
        destructive: true,
        onConfirm: async () => {
          const blankBehavior: BehaviorTargetAssessmentData = {
            id: `target-${Date.now()}`,
            behaviorName: 'Target Behavior 1',
            definition: '',
            massAnswers: {},
            fastAnswers: {},
            abcNotes: '',
            status: 'draft',
          };
          const updated = [blankBehavior];
          setTargetBehaviors(updated);
          setSelectedBehaviorIndex(0);

          try {
            await saveBehaviorAssessment(studentId, {
              tab,
              target_behaviors: updated.map((b) => ({
                behavior_name: b.behaviorName,
                definition: b.definition,
                mass_responses: b.massAnswers || {},
                fast_responses: b.fastAnswers || {},
                abc_notes: b.abcNotes || '',
                status: 'draft',
              })),
              massAnswers: {},
              fastAnswers: {},
              records,
              status: 'draft',
              is_submitting: false,
            });
            showToast('Target behavior reset', 'info');
          } catch (err) {
            console.warn('Failed to persist behavior reset', err);
          }
        },
      });
      return;
    }

    confirmAction({
      title: 'Remove Target Behavior',
      message: `Are you sure you want to remove "${behaviorToRemove.behaviorName}" and its questionnaire responses?`,
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        const updated = targetBehaviors.filter((_, idx) => idx !== indexToRemove);
        setTargetBehaviors(updated);
        setSelectedBehaviorIndex((prev) => Math.max(0, Math.min(prev, updated.length - 1)));

        try {
          await saveBehaviorAssessment(studentId, {
            tab,
            target_behaviors: updated.map((b) => ({
              behavior_name: b.behaviorName,
              definition: b.definition,
              mass_responses: b.massAnswers || {},
              fast_responses: b.fastAnswers || {},
              abc_notes: b.abcNotes || '',
              status: 'draft',
            })),
            massAnswers: updated[0]?.massAnswers || {},
            fastAnswers: updated[0]?.fastAnswers || {},
            records,
            status: 'draft',
            is_submitting: false,
          });
          showToast(`Removed "${behaviorToRemove.behaviorName}"`, 'info');
        } catch (err) {
          console.warn('Failed to persist behavior removal', err);
        }
      },
    });
  };

  // Calculations for active behavior
  const activeMassScores = useMemo(() => {
    return calculateMassCategoryScores(activeBehavior.massAnswers || {});
  }, [activeBehavior.massAnswers]);

  const activeFastScores = useMemo(() => {
    return calculateFastCategoryScores(activeBehavior.fastAnswers || {});
  }, [activeBehavior.fastAnswers]);

  const activeMassAnswered = useMemo(() => {
    return massItems.filter((i) => {
      const val =
        activeBehavior.massAnswers?.[i.id] ??
        activeBehavior.massAnswers?.[String(i.questionNumber)];
      return val !== undefined && val !== null && val !== '';
    }).length;
  }, [massItems, activeBehavior.massAnswers]);

  const activeFastAnswered = useMemo(() => {
    return fastItems.filter((i) => {
      const val =
        activeBehavior.fastAnswers?.[i.id] ??
        activeBehavior.fastAnswers?.[String(i.questionNumber)];
      return val !== undefined && val !== null && val !== '';
    }).length;
  }, [fastItems, activeBehavior.fastAnswers]);

  // ABC Handlers
  const saveRecord = () => {
    if (!draft.frequency.trim()) {
      Alert.alert('Frequency required', 'Please enter a frequency for the behavior incident.');
      return;
    }
    if (editingId) {
      setRecords((prev) => prev.map((r) => (r.id === editingId ? { ...draft, id: editingId } : r)));
      setEditingId(null);
    } else {
      setRecords((prev) => [...prev, { ...draft, id: `local-${Date.now()}` }]);
    }
    setDraft({ ...draft, id: '', frequency: '', duration: '', trigger: '', consequence: '' });
  };

  const startEdit = (record: BehaviorRecord) => {
    setEditingId(record.id);
    setDraft({ ...record });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({
      id: '',
      behavior: BEHAVIOR_PRESETS[0],
      frequency: '',
      duration: '',
      intensity: 'Medium',
      trigger: '',
      consequence: '',
    });
  };

  const removeRecord = (id: string) => setRecords((prev) => prev.filter((r) => r.id !== id));

  // Persistence handler
  const persist = async (payload: Record<string, unknown>, message: string, goBack: boolean) => {
    setSaving(true);
    try {
      const aliasSid =
        studentId === 'stu-1' ? 'student-a' : studentId === 'student-a' ? 'stu-1' : null;
      await saveBehaviorAssessment(studentId, payload);
      if (aliasSid) {
        await saveBehaviorAssessment(aliasSid, payload);
      }
      await load();
      showToast(message, 'success');
      if (goBack) {
        if (navigation?.navigate) {
          navigation.navigate('AssessmentDashboard' as never);
        } else {
          navigation?.goBack?.();
        }
      }
    } catch {
      showToast('Failed to save behavior assessment.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Requirement 4: Save Draft Handler (non-blocking)
  const handleSaveDraft = () => {
    const totalPossible = targetBehaviors.length * (massItems.length + fastItems.length);
    let totalAnswered = 0;
    targetBehaviors.forEach((b) => {
      totalAnswered += massItems.filter((i) => {
        const val = b.massAnswers?.[i.id] ?? b.massAnswers?.[String(i.questionNumber)];
        return val !== undefined && val !== null && val !== '';
      }).length;
      totalAnswered += fastItems.filter((i) => {
        const val = b.fastAnswers?.[i.id] ?? b.fastAnswers?.[String(i.questionNumber)];
        return val !== undefined && val !== null && val !== '';
      }).length;
    });

    const progress =
      totalPossible > 0 ? Math.min(100, Math.round((totalAnswered / totalPossible) * 100)) : 0;

    const payload = {
      tab,
      target_behaviors: targetBehaviors.map((b) => ({
        behavior_name: b.behaviorName,
        definition: b.definition,
        mass_responses: b.massAnswers || {},
        fast_responses: b.fastAnswers || {},
        abc_notes: b.abcNotes || '',
        status: 'draft',
      })),
      massAnswers: activeBehavior.massAnswers || {},
      fastAnswers: activeBehavior.fastAnswers || {},
      records,
      status: 'draft',
      is_submitting: false,
      progress,
    };

    persist(
      payload,
      `Draft saved successfully (${progress}% completed). Unanswered questions can be completed later.`,
      false,
    );
  };

  // Requirement 4: Submit Assessment Handler with validation
  // Requirement: Submit Assessment Handler (allowing partial responses since not all questions may apply)
  const handleSubmit = () => {
    const totalPossible = targetBehaviors.length * (massItems.length + fastItems.length);
    let totalAnswered = 0;
    targetBehaviors.forEach((b) => {
      totalAnswered += massItems.filter((i) => {
        const val = b.massAnswers?.[i.id] ?? b.massAnswers?.[String(i.questionNumber)];
        return val !== undefined && val !== null && val !== '';
      }).length;
      totalAnswered += fastItems.filter((i) => {
        const val = b.fastAnswers?.[i.id] ?? b.fastAnswers?.[String(i.questionNumber)];
        return val !== undefined && val !== null && val !== '';
      }).length;
    });

    const isPartial = totalAnswered < totalPossible;
    const message = isPartial
      ? `You have answered ${totalAnswered} questions across ${targetBehaviors.length} target behavior(s). Questions left blank will be recorded as not applicable.\n\nAre you sure you want to submit? It will be marked as complete on your dashboard, and you can still open and modify it anytime before final submission of all 4 assessments.`
      : 'Are you sure you want to submit the Behavior Assessment? It will be marked as complete on your dashboard, and you can still open and modify it anytime before final submission of all 4 assessments.';

    confirmAction({
      title: 'Submit Behavior Assessment?',
      message,
      confirmLabel: 'Submit Assessment',
      onConfirm: async () => {
        const payload = {
          tab,
          target_behaviors: targetBehaviors.map((b) => ({
            behavior_name: b.behaviorName,
            definition: b.definition,
            mass_responses: b.massAnswers || {},
            fast_responses: b.fastAnswers || {},
            abc_notes: b.abcNotes || '',
            status: 'completed',
          })),
          massAnswers: activeBehavior.massAnswers || {},
          fastAnswers: activeBehavior.fastAnswers || {},
          records,
          status: 'completed',
          is_submitting: true,
          progress: 100,
        };

        await persist(payload, 'Behavior assessment submitted for review (100%).', true);
      },
    });
  };

  if (loading) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Assessments" onTabPress={(t) => handleTeacherTabPress(navigation, t)} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Compact Header Bar */}
        <View style={styles.compactHeaderBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack?.()}
            accessibilityRole="button"
            accessibilityLabel="Back to Assessments"
          >
            <Feather name="arrow-left" size={16} color="#334155" />
            <Text style={styles.backText}>Back to Assessments</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleRow}>
            <Feather name="alert-triangle" size={15} color={colors.navyText} />
            <Text style={styles.headerTitle}>Behavior Assessment</Text>
            <View style={styles.studentBadge}>
              <Text style={styles.studentBadgeText}>{profile?.fullName || 'Student'}</Text>
            </View>
          </View>
        </View>

        {/* Compact Target Behaviors Strip */}
        <View style={styles.behaviorSelectorStrip}>
          <Text style={styles.behaviorSelectorTitle}>Targets ({targetBehaviors.length}):</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.behaviorChipsScroll}
          >
            {targetBehaviors.map((b, idx) => {
              const isSelected = idx === activeBehaviorIndex;
              const answeredM = massItems.filter((i) => {
                const val = b.massAnswers?.[i.id] ?? b.massAnswers?.[String(i.questionNumber)];
                return val !== undefined && val !== null && val !== '';
              }).length;
              const answeredF = fastItems.filter((i) => {
                const val = b.fastAnswers?.[i.id] ?? b.fastAnswers?.[String(i.questionNumber)];
                return val !== undefined && val !== null && val !== '';
              }).length;
              const isDone = answeredM === massItems.length && answeredF === fastItems.length;

              return (
                <View
                  key={b.id || idx}
                  style={[styles.behaviorChip, isSelected && styles.behaviorChipActive]}
                >
                  <TouchableOpacity
                    style={styles.behaviorChipContent}
                    onPress={() => setSelectedBehaviorIndex(idx)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${b.behaviorName}`}
                  >
                    {isDone ? (
                      <Feather name="check-circle" size={12} color="#16A34A" />
                    ) : (
                      <Feather
                        name="clock"
                        size={12}
                        color={isSelected ? colors.navyText : colors.mutedText}
                      />
                    )}
                    <Text
                      style={[styles.behaviorChipText, isSelected && styles.behaviorChipTextActive]}
                    >
                      {b.behaviorName}
                    </Text>
                    <Text style={styles.chipProgressText}>
                      ({answeredM}/{massItems.length} M · {answeredF}/{fastItems.length} F)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleRemoveTargetBehavior(idx);
                    }}
                    style={styles.chipRemoveBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${b.behaviorName}`}
                  >
                    <Feather
                      name="x"
                      size={13}
                      color={isSelected ? colors.navyText : colors.mutedText}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.addBehaviorBtn}
              onPress={openAddBehaviorModal}
              accessibilityRole="button"
              accessibilityLabel="Add Target Behavior"
            >
              <Feather name="plus" size={13} color={colors.navyText} />
              <Text style={styles.addBehaviorText}>Add Target</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Compact Sub Tabs: MASS, FAST, ABC */}
        <View style={styles.tabsRow}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'MASS'
                  ? `MASS-II (${activeMassAnswered}/${massItems.length})`
                  : t === 'FAST'
                    ? `FAST (${activeFastAnswered}/${fastItems.length})`
                    : `ABC Notes (${records.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Streamlined Active Behavior Banner */}
        <View style={styles.activeBehaviorBanner}>
          <View style={styles.activeBannerTopRow}>
            <View style={styles.activeBannerNameGroup}>
              <Text style={styles.activeBehaviorBannerLabel}>Active Target:</Text>
              <Text style={styles.activeBehaviorBannerName}>{activeBehavior.behaviorName}</Text>
              {activeBehavior.definition ? (
                <Text style={styles.activeBehaviorBannerDefInline} numberOfLines={1}>
                  — {activeBehavior.definition}
                </Text>
              ) : null}
            </View>
            <View style={styles.behaviorStatusBadge}>
              <Text style={styles.behaviorStatusText}>
                {activeMassAnswered === massItems.length && activeFastAnswered === fastItems.length
                  ? 'Complete'
                  : 'In Progress'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab 1: Authentic MAS-II Assessment */}
        {tab === 'MASS' && (
          <MassAssessmentTab
            behaviorName={activeBehavior.behaviorName}
            massAnswers={activeBehavior.massAnswers || {}}
            onSetAnswer={handleSetMassAnswer}
            items={massItems}
          />
        )}

        {/* Tab 2: Authentic FAST Assessment */}
        {tab === 'FAST' && (
          <FastAssessmentTab
            behaviorName={activeBehavior.behaviorName}
            fastAnswers={activeBehavior.fastAnswers || {}}
            onSetAnswer={handleSetFastAnswer}
            items={fastItems}
            settingContext={activeBehavior.settingContext || []}
            onToggleSettingContext={handleToggleSettingContext}
          />
        )}

        {/* Tab 3: ABC Incidents & Behavior Notes */}
        {tab === 'ABC' && (
          <>
            {/* Behavior-Specific ABC Observational Notes */}
            <View style={styles.card}>
              <Text style={typography.h3}>
                ABC Observational Notes & Hypotheses for {activeBehavior.behaviorName}
              </Text>
              <Text style={typography.caption}>
                Record behavioral observations, setting events, and clinical notes specific to{' '}
                {activeBehavior.behaviorName}.
              </Text>
              <TextInput
                style={[styles.textInput, styles.notesArea]}
                placeholder={`Enter ongoing clinical notes or setting factors for ${activeBehavior.behaviorName}...`}
                placeholderTextColor={colors.mutedText}
                multiline
                numberOfLines={4}
                value={activeBehavior.abcNotes || ''}
                onChangeText={handleUpdateActiveAbcNotes}
              />
            </View>

            {/* General Incident Logger */}
            <View style={styles.card}>
              <Text style={typography.h3}>
                {editingId ? 'Edit Incident Record (ABC)' : 'Log New Incident Record (ABC)'}
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {BEHAVIOR_PRESETS.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.chip, draft.behavior === b && styles.chipSelected]}
                    onPress={() => setDraft({ ...draft, behavior: b })}
                  >
                    <Text
                      style={[styles.chipText, draft.behavior === b && styles.chipTextSelected]}
                    >
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.field}>
                <Text style={typography.label}>Frequency</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 3 times"
                  placeholderTextColor={colors.mutedText}
                  value={draft.frequency}
                  onChangeText={(t) => setDraft({ ...draft, frequency: t })}
                />
              </View>

              <View style={styles.field}>
                <Text style={typography.label}>Duration</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 5 minutes"
                  placeholderTextColor={colors.mutedText}
                  value={draft.duration}
                  onChangeText={(t) => setDraft({ ...draft, duration: t })}
                />
              </View>

              <View style={styles.field}>
                <Text style={typography.label}>Intensity</Text>
                <View style={styles.ratingRow}>
                  {INTENSITIES.map((i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.ratingBtn, draft.intensity === i && styles.ratingBtnActive]}
                      onPress={() => setDraft({ ...draft, intensity: i })}
                    >
                      <Text
                        style={[
                          styles.ratingText,
                          draft.intensity === i && styles.ratingTextActive,
                        ]}
                      >
                        {i}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={typography.label}>Trigger (Antecedent)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="What happened before?"
                  placeholderTextColor={colors.mutedText}
                  value={draft.trigger}
                  onChangeText={(t) => setDraft({ ...draft, trigger: t })}
                />
              </View>

              <View style={styles.field}>
                <Text style={typography.label}>Consequence</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="What happened after?"
                  placeholderTextColor={colors.mutedText}
                  value={draft.consequence}
                  onChangeText={(t) => setDraft({ ...draft, consequence: t })}
                />
              </View>

              <View style={styles.addRow}>
                <TouchableOpacity style={styles.addBtn} onPress={saveRecord}>
                  <Feather name={editingId ? 'check' : 'plus'} size={14} color={colors.navyText} />
                  <Text style={styles.addBtnText}>
                    {editingId ? 'Update Record' : 'Add Record'}
                  </Text>
                </TouchableOpacity>
                {editingId && (
                  <TouchableOpacity style={[styles.addBtn, styles.cancelBtn]} onPress={cancelEdit}>
                    <Feather name="x" size={14} color={colors.navyText} />
                    <Text style={styles.addBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={typography.h3}>Incident Records ({records.length})</Text>
            {records.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No ABC incident records recorded yet.</Text>
              </View>
            ) : (
              records.map((r) => (
                <View key={r.id} style={styles.card}>
                  <View style={styles.recordHeader}>
                    <Text style={typography.bodyBold}>{r.behavior}</Text>
                    <View style={styles.recordActions}>
                      <TouchableOpacity onPress={() => startEdit(r)}>
                        <Feather name="edit-2" size={14} color={colors.navyText} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeRecord(r.id)}>
                        <Feather name="trash-2" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={typography.caption}>
                    {r.frequency} · {r.duration} · {r.intensity} intensity
                  </Text>
                  {r.trigger ? <Text style={typography.body}>Trigger: {r.trigger}</Text> : null}
                  {r.consequence ? (
                    <Text style={typography.body}>Consequence: {r.consequence}</Text>
                  ) : null}
                </View>
              ))
            )}
          </>
        )}

        {/* Multi-Behavior Summary Overview */}
        <View style={styles.card}>
          <Text style={typography.h3}>Assessment Summary by Target Behavior</Text>
          <Text style={typography.caption}>
            Review computed function rankings and maintaining variables across all evaluated target
            behaviors.
          </Text>

          {targetBehaviors.map((b, idx) => {
            const mCount = massItems.filter((i) => {
              const val = b.massAnswers?.[i.id] ?? b.massAnswers?.[String(i.questionNumber)];
              return val !== undefined && val !== null && val !== '';
            }).length;
            const fCount = fastItems.filter((i) => {
              const val = b.fastAnswers?.[i.id] ?? b.fastAnswers?.[String(i.questionNumber)];
              return val !== undefined && val !== null && val !== '';
            }).length;

            const bMassScores = calculateMassCategoryScores(b.massAnswers || {});
            const bFastScores = calculateFastCategoryScores(b.fastAnswers || {});

            return (
              <View key={b.id || idx} style={styles.behaviorSummaryCard}>
                <View style={styles.behaviorSummaryRow}>
                  <View>
                    <Text style={styles.behaviorSummaryTitle}>{b.behaviorName}</Text>
                    {b.definition ? (
                      <Text style={styles.behaviorSummaryDef}>{b.definition}</Text>
                    ) : null}
                  </View>
                  <View style={styles.summaryBadgeRow}>
                    <View style={styles.miniBadge}>
                      <Text style={styles.miniBadgeText}>
                        MASS: {mCount}/{massItems.length}
                      </Text>
                    </View>
                    <View style={styles.miniBadge}>
                      <Text style={styles.miniBadgeText}>
                        FAST: {fCount}/{fastItems.length}
                      </Text>
                    </View>
                  </View>
                </View>

                {(mCount > 0 || fCount > 0) && (
                  <View style={styles.summaryBox}>
                    {mCount > 0 && (
                      <View style={styles.summaryLine}>
                        <Text style={styles.summaryLineLabel}>MAS-II Primary Function:</Text>
                        <Text style={styles.summaryLineValue}>
                          {bMassScores.primaryMaintainingVariable} (Mean:{' '}
                          {bMassScores.scores[bMassScores.primaryMaintainingVariable]?.mean.toFixed(
                            2,
                          )}
                          )
                        </Text>
                      </View>
                    )}
                    {fCount > 0 && (
                      <View style={styles.summaryLine}>
                        <Text style={styles.summaryLineLabel}>FAST Dominant Variable:</Text>
                        <Text style={styles.summaryLineValue}>
                          {bFastScores.dominantVariables.join(', ') || 'None flagged'} (
                          {bFastScores.maxPercentage}%)
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Action Handlers: Save Draft & Submit Assessment */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary, saving && { opacity: 0.7 }]}
            onPress={handleSaveDraft}
            disabled={saving}
          >
            <Feather name="save" size={16} color={colors.navyText} />
            <Text style={styles.actionBtnText}>{saving ? 'Saving...' : 'Save Draft'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary, saving && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={saving}
          >
            <Feather name="check-circle" size={16} color={colors.navyText} />
            <Text style={styles.actionBtnText}>
              {saving ? 'Submitting...' : 'Submit Assessment'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal to add target behavior: Behaviors Catalog Table */}
      <AccessibleModal
        visible={showAddBehaviorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddBehaviorModal(false)}
        accessibilityLabel="Add Target Behavior"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={typography.h3}>Add Target Behavior</Text>
                <Text style={typography.caption}>
                  Select a behavior from the institutional catalog. Press Enter ↵ to add.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddBehaviorModal(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Feather name="x" size={20} color={colors.navyText} />
              </TouchableOpacity>
            </View>

            {/* Catalog Filter / Search */}
            <View style={styles.catalogSearchRow}>
              <Feather name="search" size={15} color={colors.mutedText} />
              <TextInput
                style={styles.catalogSearchInput}
                placeholder="Search behavior by name or definition... (Press Enter ↵ to add)"
                placeholderTextColor={colors.mutedText}
                value={behaviorCatalogSearch}
                onChangeText={setBehaviorCatalogSearch}
                onSubmitEditing={() => {
                  if (
                    selectedCatalogBehavior &&
                    !targetBehaviors.some(
                      (b) =>
                        b.behaviorName.toLowerCase() === selectedCatalogBehavior.name.toLowerCase(),
                    )
                  ) {
                    handleAddTargetBehavior(
                      selectedCatalogBehavior.name,
                      selectedCatalogBehavior.definition,
                    );
                  }
                }}
                returnKeyType="done"
              />
              {Boolean(behaviorCatalogSearch) && (
                <TouchableOpacity onPress={() => setBehaviorCatalogSearch('')} hitSlop={6}>
                  <Feather name="x-circle" size={14} color={colors.mutedText} />
                </TouchableOpacity>
              )}
            </View>

            {/* Behaviors Table */}
            <View style={styles.catalogTableContainer}>
              {/* Table Column Headers */}
              <View style={styles.catalogTableHeader}>
                <View style={styles.colSelect}>
                  <Text style={styles.catalogTableHeaderText}>SELECT</Text>
                </View>
                <View style={styles.colName}>
                  <Text style={styles.catalogTableHeaderText}>BEHAVIOR NAME</Text>
                </View>
                <View style={styles.colDef}>
                  <Text style={styles.catalogTableHeaderText}>OPERATIONAL DEFINITION</Text>
                </View>
                <View style={styles.colCategory}>
                  <Text style={styles.catalogTableHeaderText}>CATEGORY</Text>
                </View>
              </View>

              {/* Table Rows */}
              <ScrollView style={styles.catalogTableBody} showsVerticalScrollIndicator={true}>
                {filteredCatalogBehaviors.map((item) => {
                  const isSelected =
                    selectedCatalogBehavior?.name.toLowerCase() === item.name.toLowerCase();
                  const isAlreadyAdded = targetBehaviors.some(
                    (b) => b.behaviorName.toLowerCase() === item.name.toLowerCase(),
                  );

                  return (
                    <TouchableOpacity
                      key={item.name}
                      style={[
                        styles.catalogTableRow,
                        isSelected && styles.catalogTableRowSelected,
                        isAlreadyAdded && styles.catalogTableRowAdded,
                      ]}
                      disabled={isAlreadyAdded}
                      onPress={() => setSelectedCatalogBehavior(item)}
                      activeOpacity={0.7}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected, disabled: isAlreadyAdded }}
                    >
                      {/* Select Column (Radio Indicator or Added Checkmark) */}
                      <View style={styles.colSelect}>
                        {isAlreadyAdded ? (
                          <View style={styles.addedBadge}>
                            <Feather name="check" size={12} color="#059669" />
                            <Text style={styles.addedBadgeText}>Added</Text>
                          </View>
                        ) : isSelected ? (
                          <View style={styles.selectedRadioActive}>
                            <View style={styles.selectedRadioDot} />
                          </View>
                        ) : (
                          <View style={styles.selectedRadioInactive} />
                        )}
                      </View>

                      {/* Behavior Name Column */}
                      <View style={styles.colName}>
                        <Text
                          style={[
                            styles.catalogItemName,
                            isSelected && styles.catalogItemNameSelected,
                            isAlreadyAdded && styles.catalogItemNameAdded,
                          ]}
                        >
                          {item.name}
                        </Text>
                        {isSelected && (
                          <View style={styles.selectedBadge}>
                            <Text style={styles.selectedBadgeText}>Selected</Text>
                          </View>
                        )}
                      </View>

                      {/* Operational Definition Column */}
                      <View style={styles.colDef}>
                        <Text
                          style={[
                            styles.catalogItemDef,
                            isSelected && styles.catalogItemDefSelected,
                            isAlreadyAdded && styles.catalogItemDefAdded,
                          ]}
                          numberOfLines={2}
                        >
                          {item.definition}
                        </Text>
                      </View>

                      {/* Category Column */}
                      <View style={styles.colCategory}>
                        <View
                          style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                        >
                          <Text
                            style={[
                              styles.categoryPillText,
                              isSelected && styles.categoryPillTextSelected,
                            ]}
                          >
                            {item.category}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {filteredCatalogBehaviors.length === 0 && (
                  <View style={styles.emptyCatalog}>
                    <Text style={styles.emptyCatalogText}>
                      No institutional behaviors found matching "{behaviorCatalogSearch}".
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Modal Footer Actions */}
            <View style={styles.modalActions}>
              <View style={styles.enterHintRow}>
                <Text style={styles.enterHintText}>
                  💡 Press <Text style={styles.enterKeyBadge}>Enter ↵</Text> to add
                </Text>
              </View>
              <View style={styles.modalActionsButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setShowAddBehaviorModal(false)}
                >
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    styles.modalBtnConfirm,
                    (!selectedCatalogBehavior ||
                      targetBehaviors.some(
                        (b) =>
                          b.behaviorName.toLowerCase() ===
                          selectedCatalogBehavior.name.toLowerCase(),
                      )) &&
                      styles.modalBtnDisabled,
                  ]}
                  disabled={
                    !selectedCatalogBehavior ||
                    targetBehaviors.some(
                      (b) =>
                        b.behaviorName.toLowerCase() === selectedCatalogBehavior.name.toLowerCase(),
                    )
                  }
                  onPress={() => {
                    if (selectedCatalogBehavior) {
                      handleAddTargetBehavior(
                        selectedCatalogBehavior.name,
                        selectedCatalogBehavior.definition,
                      );
                    }
                  }}
                >
                  <Feather name="plus-circle" size={16} color={colors.navyText} />
                  <Text style={styles.modalBtnConfirmText}>
                    {selectedCatalogBehavior
                      ? `Add "${selectedCatalogBehavior.name}"`
                      : 'Add Target Behavior'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </AccessibleModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  compactHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: 4 },
  backText: { fontSize: 13, color: '#334155', fontWeight: '600' },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navyText,
  },
  studentBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginLeft: 2,
  },
  studentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navyText,
  },
  behaviorSelectorStrip: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  behaviorSelectorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
    flexShrink: 0,
  },
  addBehaviorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.pill,
  },
  addBehaviorText: { fontSize: 11, fontWeight: '700', color: colors.navyText },
  behaviorChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  behaviorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingLeft: spacing.sm,
    paddingRight: 6,
    paddingVertical: 3,
    backgroundColor: colors.bgApp,
  },
  behaviorChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  behaviorChipContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  behaviorChipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  behaviorChipTextActive: { color: colors.navyText, fontWeight: '700' },
  chipProgressText: { fontSize: 10, color: colors.mutedText },
  chipRemoveBtn: {
    marginLeft: 4,
    padding: 3,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBehaviorBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeBannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeBannerNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  activeBehaviorBannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.mutedText,
  },
  activeBehaviorBannerName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navyText,
  },
  activeBehaviorBannerDefInline: {
    fontSize: 11,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  behaviorStatusBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  behaviorStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.navyText,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    backgroundColor: colors.bgCard,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  tabActive: { backgroundColor: colors.primaryYellow },
  tabText: { fontSize: 12, color: colors.mutedText, fontWeight: '600' },
  tabTextActive: { color: colors.navyText, fontWeight: '700' },
  content: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  notesArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  behaviorSummaryCard: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  behaviorSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  behaviorSummaryTitle: { fontSize: 15, fontWeight: '700', color: colors.navyText },
  behaviorSummaryDef: { fontSize: 12, color: colors.mutedText, marginTop: 2 },
  summaryBadgeRow: { flexDirection: 'row', gap: 6 },
  miniBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  miniBadgeText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLineLabel: {
    fontSize: 12,
    color: colors.mutedText,
    fontWeight: '600',
  },
  summaryLineValue: {
    fontSize: 12,
    color: colors.navyText,
    fontWeight: '700',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 13, color: colors.bodyText },
  chipTextSelected: { fontWeight: '700', color: colors.navyText },
  field: { gap: spacing.xs },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.bodyText,
    backgroundColor: colors.bgCard,
  },
  defInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  ratingRow: { flexDirection: 'row', gap: spacing.sm },
  ratingBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  ratingBtnActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  ratingText: { fontSize: 13, color: colors.bodyText },
  ratingTextActive: { fontWeight: '700', color: colors.navyText },
  addRow: { flexDirection: 'row', gap: spacing.sm },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
  },
  cancelBtn: { backgroundColor: colors.bgApp, borderWidth: 1, borderColor: colors.border },
  addBtnText: { fontSize: 13, fontWeight: '700', color: colors.navyText },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordActions: { flexDirection: 'row', gap: spacing.sm },
  emptyCard: {
    backgroundColor: colors.bgApp,
    padding: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  emptyText: { color: colors.mutedText, fontSize: 13 },
  btnRow: { flexDirection: 'row', gap: spacing.md },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  actionBtnPrimary: { backgroundColor: colors.primaryYellow },
  actionBtnSecondary: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: colors.navyText },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '95%',
    maxWidth: 720,
    maxHeight: '90%',
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  catalogSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  catalogSearchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.navyText,
    paddingVertical: spacing.xs,
  },
  catalogTableContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
  },
  catalogTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catalogTableHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.mutedText,
    letterSpacing: 0.5,
  },
  catalogTableBody: {
    maxHeight: 320,
  },
  catalogTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  catalogTableRowSelected: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  catalogTableRowAdded: {
    backgroundColor: '#F8FAFC',
    opacity: 0.65,
  },
  colSelect: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colName: {
    width: 170,
    paddingRight: spacing.sm,
    justifyContent: 'center',
  },
  colDef: {
    flex: 1,
    minWidth: 160,
    paddingRight: spacing.sm,
    justifyContent: 'center',
  },
  colCategory: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  catalogItemNameSelected: {
    fontWeight: '800',
    color: '#1D4ED8',
  },
  catalogItemNameAdded: {
    color: colors.mutedText,
  },
  catalogItemDef: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  catalogItemDefSelected: {
    color: '#1E40AF',
    fontWeight: '500',
  },
  catalogItemDefAdded: {
    color: colors.mutedText,
  },
  selectedRadioActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  selectedRadioInactive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  selectedBadge: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  selectedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E40AF',
    textTransform: 'uppercase',
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  addedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  categoryPill: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  categoryPillSelected: {
    backgroundColor: '#E0E7FF',
    borderColor: '#C7D2FE',
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  categoryPillTextSelected: {
    color: '#4338CA',
    fontWeight: '700',
  },
  emptyCatalog: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCatalogText: {
    fontSize: 12,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  enterHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enterHintText: {
    fontSize: 12,
    color: colors.mutedText,
  },
  enterKeyBadge: {
    fontWeight: '700',
    color: colors.navyText,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  modalActionsButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalBtnCancel: { backgroundColor: colors.bgApp, borderWidth: 1, borderColor: colors.border },
  modalBtnCancelText: { fontSize: 13, fontWeight: '600', color: colors.mutedText },
  modalBtnConfirm: { backgroundColor: colors.primaryYellow },
  modalBtnConfirmText: { fontSize: 13, fontWeight: '700', color: colors.navyText },
  modalBtnDisabled: {
    opacity: 0.45,
  },
});
