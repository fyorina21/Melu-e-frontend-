import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import {
  getBehaviorAssessment,
  saveBehaviorAssessment,
  getTeacherStudentProfile,
} from '../../api/teacherExtrasApi';
import { getFormConfig } from '../../api/institutionalAdminApi';
import storage from '../../utils/storage';
import { normalizeStudentId, getStudentIdAliases } from '../../utils/studentLifecycleHelper';
import type { SessionStackParamList } from '../../types';
import {
  TABS,
  LIKERT_OPTIONS,
  MASS_ITEMS,
  FAST_ITEMS,
  BEHAVIOR_PRESETS,
  INTENSITIES,
  calculateMassTotals,
  calculateFastTotals,
  getTopMassFunctions,
  getTopFastCategories,
  type AssessmentTab,
  type MassItem,
  type FastItem,
  type BehaviorRecord,
  type StudentProfile,
  type MassFunction,
  type FastCategory,
} from './behavior/behaviorTypes';

function inferMassFunction(id: string, text: string): MassFunction {
  const t = (text || '').toLowerCase();
  if (t.includes('alone') || t.includes('sensory') || t.includes('stimulat')) return 'Sensory';
  if (
    t.includes('difficult') ||
    t.includes('escape') ||
    t.includes('undesirable') ||
    t.includes('not enjoy')
  )
    return 'Escape';
  if (t.includes('ignored') || t.includes('attention') || t.includes('reaction'))
    return 'Attention';
  if (
    t.includes('item') ||
    t.includes('tangible') ||
    t.includes('food') ||
    t.includes('toy') ||
    t.includes('access')
  )
    return 'Tangible';
  return 'Sensory';
}

function inferFastCategory(id: string, text: string): FastCategory {
  const t = (text || '').toLowerCase();
  if (
    t.includes('avoid') ||
    t.includes('escape') ||
    t.includes('demand') ||
    t.includes('transition')
  )
    return 'Social - Negative';
  if (
    t.includes('alone') ||
    t.includes('unoccupied') ||
    (t.includes('rewarding') && t.includes('sensory'))
  )
    return 'Automatic - Positive';
  if (t.includes('unpleasant') || t.includes('pain')) return 'Automatic - Negative';
  return 'Social - Positive';
}

type Props = NativeStackScreenProps<SessionStackParamList, 'BehaviorAssessment'>;

export default function BehaviorAssessmentScreen({ navigation, route }: Props) {
  const urlSid =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('studentId')
      : null;
  const localSid = storage.getSync('last_assessment_student_id');
  const rawId = route?.params?.studentId || urlSid || localSid || 'student-a';
  const studentId = normalizeStudentId(rawId);

  useEffect(() => {
    if (studentId) {
      try {
        storage.setSync('last_assessment_student_id', studentId);
        storage.setItem('last_assessment_student_id', studentId).catch(() => {});
      } catch {}
    }
  }, [studentId]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [massItems, setMassItems] = useState<MassItem[]>(MASS_ITEMS);
  const [fastItems, setFastItems] = useState<FastItem[]>(FAST_ITEMS);
  const [tab, setTab] = useState<AssessmentTab>('MASS');
  const [massAnswers, setMassAnswers] = useState<Record<string, string>>({});
  const [fastAnswers, setFastAnswers] = useState<Record<string, boolean>>({});
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

  const activeLoadRef = useRef(0);

  const load = useCallback(async () => {
    const fetchId = ++activeLoadRef.current;
    setLoading(true);

    try {
      const { data: res } = await getTeacherStudentProfile(studentId);
      if (fetchId === activeLoadRef.current) {
        setProfile(res || null);
      }
    } catch {
      if (fetchId === activeLoadRef.current) {
        setProfile(null);
      }
    }

    try {
      const { data: cfg } = await getFormConfig('Behavioral Assessment');
      if (
        fetchId === activeLoadRef.current &&
        cfg &&
        Array.isArray(cfg.fields) &&
        cfg.fields.length > 0
      ) {
        const visibleFields = cfg.fields.filter(
          (f: any) => f && f.visible !== false && (f.id || f.label || f.text),
        );
        const mFields = visibleFields.filter(
          (f: any) =>
            (f.section && f.section.toUpperCase().includes('MASS')) || /^M\d+/i.test(String(f.id)),
        );
        const fFields = visibleFields.filter(
          (f: any) =>
            (f.section && f.section.toUpperCase().includes('FAST')) || /^F\d+/i.test(String(f.id)),
        );

        if (mFields.length > 0) {
          const parsed = mFields
            .map((f: any, idx: number) => {
              const id = String(f.id || `M${idx + 1}`);
              const text = String(f.label || f.text || '').trim();
              const validFn = ['Sensory', 'Escape', 'Attention', 'Tangible'].includes(f.level)
                ? (f.level as MassFunction)
                : inferMassFunction(id, text);
              return { id, text, function: validFn };
            })
            .filter((item: MassItem) => item.text.length > 0);

          if (parsed.length > 0) {
            setMassItems(parsed);
          }
        }

        if (fFields.length > 0) {
          const parsed = fFields
            .map((f: any, idx: number) => {
              const id = String(f.id || `F${idx + 1}`);
              const text = String(f.label || f.text || '').trim();
              const validCat = [
                'Social - Positive',
                'Social - Negative',
                'Automatic - Positive',
                'Automatic - Negative',
              ].includes(f.level)
                ? (f.level as FastCategory)
                : inferFastCategory(id, text);
              return { id, text, category: validCat };
            })
            .filter((item: FastItem) => item.text.length > 0);

          if (parsed.length > 0) {
            setFastItems(parsed);
          }
        }
      }
    } catch {}

    try {
      const aliases = getStudentIdAliases(studentId);
      let savedData: any = null;

      // 1. Try studentId API
      try {
        const { data: saved } = await getBehaviorAssessment(studentId);
        savedData = (saved as any)?.data ?? saved;
      } catch {}

      // 2. Fallback to alias API
      if (
        !savedData ||
        (!savedData.massAnswers &&
          !savedData.fastAnswers &&
          (!savedData.records || savedData.records.length === 0))
      ) {
        for (const alias of aliases) {
          if (alias !== studentId) {
            try {
              const { data: aliasSaved } = await getBehaviorAssessment(alias);
              const candidate = (aliasSaved as any)?.data ?? aliasSaved;
              if (
                candidate &&
                (candidate.massAnswers ||
                  candidate.fastAnswers ||
                  (candidate.records && candidate.records.length > 0))
              ) {
                savedData = candidate;
                break;
              }
            } catch {}
          }
        }
      }

      // 3. Fallback to unified storage
      if (
        !savedData ||
        (!savedData.massAnswers &&
          !savedData.fastAnswers &&
          (!savedData.records || savedData.records.length === 0))
      ) {
        for (const sid of [studentId, ...aliases]) {
          const localData = storage.getJSONSync<any>(`melue_behavior_assessment_${sid}`);
          if (
            localData &&
            (localData.massAnswers ||
              localData.fastAnswers ||
              (localData.records && localData.records.length > 0))
          ) {
            savedData = localData;
            break;
          }
        }
      }

      if (fetchId === activeLoadRef.current) {
        const rawRecords = Array.isArray(savedData?.records)
          ? savedData.records
          : Array.isArray(savedData?.incidents)
            ? savedData.incidents
            : [];

        const validRecords: BehaviorRecord[] = rawRecords.map((r: any, idx: number) => ({
          id: String(r.id || `rec-${Date.now()}-${idx}`),
          behavior: String(r.behavior || BEHAVIOR_PRESETS[0]),
          frequency: String(r.frequency || ''),
          duration: String(r.duration || ''),
          intensity: (['Low', 'Medium', 'High'].includes(r.intensity) ? r.intensity : 'Medium') as
            'Low' | 'Medium' | 'High',
          trigger: String(r.trigger || r.antecedent || ''),
          consequence: String(r.consequence || ''),
        }));

        setMassAnswers(
          typeof savedData?.massAnswers === 'object' && savedData.massAnswers !== null
            ? savedData.massAnswers
            : {},
        );
        setFastAnswers(
          typeof savedData?.fastAnswers === 'object' && savedData.fastAnswers !== null
            ? savedData.fastAnswers
            : {},
        );
        setRecords(validRecords);
        if (savedData?.tab && TABS.includes(savedData.tab)) {
          setTab(savedData.tab);
        }
      }
    } catch {
      if (fetchId === activeLoadRef.current) {
        setMassAnswers({});
        setFastAnswers({});
        setRecords([]);
      }
    } finally {
      if (fetchId === activeLoadRef.current) {
        setLoading(false);
      }
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = (e: any) => {
      const name = (e?.detail?.formName || '').toLowerCase();
      if (name.includes('behavior') && !name.includes('incident')) {
        getFormConfig('Behavioral Assessment')
          .then(({ data: cfg }) => {
            if (cfg && Array.isArray(cfg.fields) && cfg.fields.length > 0) {
              const visibleFields = cfg.fields.filter(
                (f: any) => f && f.visible !== false && (f.id || f.label || f.text),
              );
              const mFields = visibleFields.filter(
                (f: any) =>
                  (f.section && f.section.toUpperCase().includes('MASS')) ||
                  /^M\d+/i.test(String(f.id)),
              );
              const fFields = visibleFields.filter(
                (f: any) =>
                  (f.section && f.section.toUpperCase().includes('FAST')) ||
                  /^F\d+/i.test(String(f.id)),
              );

              if (mFields.length > 0) {
                const parsed = mFields
                  .map((f: any, idx: number) => {
                    const id = String(f.id || `M${idx + 1}`);
                    const text = String(f.label || f.text || '').trim();
                    const validFn = ['Sensory', 'Escape', 'Attention', 'Tangible'].includes(f.level)
                      ? (f.level as MassFunction)
                      : inferMassFunction(id, text);
                    return { id, text, function: validFn };
                  })
                  .filter((item: MassItem) => item.text.length > 0);
                if (parsed.length > 0) setMassItems(parsed);
              }

              if (fFields.length > 0) {
                const parsed = fFields
                  .map((f: any, idx: number) => {
                    const id = String(f.id || `F${idx + 1}`);
                    const text = String(f.label || f.text || '').trim();
                    const validCat = [
                      'Social - Positive',
                      'Social - Negative',
                      'Automatic - Positive',
                      'Automatic - Negative',
                    ].includes(f.level)
                      ? (f.level as FastCategory)
                      : inferFastCategory(id, text);
                    return { id, text, category: validCat };
                  })
                  .filter((item: FastItem) => item.text.length > 0);
                if (parsed.length > 0) setFastItems(parsed);
              }
            }
          })
          .catch(() => {});
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('melue_form_config_changed', handler);
      return () => window.removeEventListener('melue_form_config_changed', handler);
    }
  }, []);

  if (loading) return <ScreenLoader />;

  const syncDraftToStorage = (
    currentRecords: BehaviorRecord[],
    currentMass: Record<string, string>,
    currentFast: Record<string, boolean>,
  ) => {
    const totalQuestions = massItems.length + fastItems.length;
    const answeredCount =
      massItems.filter((i) => currentMass[i.id]).length +
      fastItems.filter((i) => currentFast[i.id] !== undefined).length;
    const progress =
      totalQuestions > 0
        ? Math.max(0, Math.min(100, Math.round((answeredCount / totalQuestions) * 100)))
        : 0;
    const status =
      progress === 100
        ? 'completed'
        : progress > 0 || currentRecords.length > 0
          ? 'in_progress'
          : 'draft';

    const payload = {
      tab,
      massAnswers: currentMass,
      fastAnswers: currentFast,
      records: currentRecords,
      status,
      progress,
      updatedAt: new Date().toISOString(),
    };

    const aliases = getStudentIdAliases(studentId);
    for (const sid of [studentId, ...aliases]) {
      try {
        storage.setJSONSync(`melue_behavior_assessment_${sid}`, payload);
        storage.setJSON(`melue_behavior_assessment_${sid}`, payload).catch(() => {});
      } catch {}
    }
  };

  const setMassAnswer = (id: string, value: string) => {
    setMassAnswers((prev) => {
      const next = { ...prev, [id]: value };
      syncDraftToStorage(records, next, fastAnswers);
      return next;
    });
  };

  const setFastAnswer = (id: string, value: boolean) => {
    setFastAnswers((prev) => {
      const next = { ...prev, [id]: value };
      syncDraftToStorage(records, massAnswers, next);
      return next;
    });
  };

  const massAnswered = massItems.filter((i) => massAnswers[i.id]).length;
  const fastAnswered = fastItems.filter((i) => fastAnswers[i.id] !== undefined).length;

  const massFunctionTotals = calculateMassTotals(massAnswers, massItems);
  const topMassFunctions = getTopMassFunctions(massFunctionTotals);
  const primaryMassFunction = topMassFunctions.length > 0 ? topMassFunctions.join(' / ') : 'None';

  const fastCategoryTotals = calculateFastTotals(fastAnswers, fastItems);
  const topFastCategories = getTopFastCategories(fastCategoryTotals);
  const primaryFastCategory = topFastCategories.length > 0 ? topFastCategories.join(' / ') : 'None';

  const identifiedFunction =
    tab === 'MASS'
      ? primaryMassFunction
      : tab === 'FAST'
        ? primaryFastCategory
        : topMassFunctions.length > 0 && topFastCategories.length > 0
          ? `${primaryMassFunction} · ${primaryFastCategory}`
          : topMassFunctions.length > 0
            ? primaryMassFunction
            : primaryFastCategory;

  const summaryIdentifiedFunction =
    topMassFunctions.length > 0 && topFastCategories.length > 0
      ? `${primaryMassFunction} (MASS) · ${primaryFastCategory} (FAST)`
      : topMassFunctions.length > 0
        ? primaryMassFunction
        : topFastCategories.length > 0
          ? primaryFastCategory
          : 'None identified';

  const saveRecord = () => {
    const trimmedFreq = draft.frequency.trim();
    if (!trimmedFreq) {
      Alert.alert('Validation Error', 'Frequency is required (e.g. "3 times" or "daily").');
      return;
    }
    const trimmedDur = draft.duration.trim();
    const trimmedTrigger = draft.trigger.trim();
    const trimmedConsequence = draft.consequence.trim();

    const newRecord: BehaviorRecord = {
      id: editingId || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      behavior: draft.behavior || BEHAVIOR_PRESETS[0],
      frequency: trimmedFreq,
      duration: trimmedDur,
      intensity: draft.intensity || 'Medium',
      trigger: trimmedTrigger,
      consequence: trimmedConsequence,
    };

    const isDuplicate = records.some(
      (r) =>
        r.id !== editingId &&
        r.behavior === newRecord.behavior &&
        r.frequency.toLowerCase() === newRecord.frequency.toLowerCase() &&
        r.duration.toLowerCase() === newRecord.duration.toLowerCase() &&
        r.intensity === newRecord.intensity &&
        r.trigger.toLowerCase() === newRecord.trigger.toLowerCase() &&
        r.consequence.toLowerCase() === newRecord.consequence.toLowerCase(),
    );

    if (isDuplicate) {
      Alert.alert('Duplicate Record', 'An identical ABC incident record already exists.');
      return;
    }

    let updatedRecords: BehaviorRecord[];
    if (editingId) {
      updatedRecords = records.map((r) => (r.id === editingId ? newRecord : r));
      setEditingId(null);
    } else {
      updatedRecords = [...records, newRecord];
    }

    setRecords(updatedRecords);
    syncDraftToStorage(updatedRecords, massAnswers, fastAnswers);

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

  const removeRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    if (editingId === id) {
      cancelEdit();
    }
    syncDraftToStorage(updated, massAnswers, fastAnswers);
  };

  const persist = async (payload: Record<string, unknown>, message: string, goBack: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      const aliases = getStudentIdAliases(studentId);
      await saveBehaviorAssessment(studentId, payload);
      for (const alias of aliases) {
        if (alias !== studentId) {
          await saveBehaviorAssessment(alias, payload).catch(() => {});
        }
      }
      for (const sid of [studentId, ...aliases]) {
        try {
          storage.setJSONSync(`melue_behavior_assessment_${sid}`, payload);
          storage.setJSON(`melue_behavior_assessment_${sid}`, payload).catch(() => {});
        } catch {}
      }

      Alert.alert('Assessment Saved', message);
      if (goBack) {
        navigation?.navigate?.('AssessmentSummaryReport' as any, { studentId } as any);
      }
    } catch {
      Alert.alert(
        'Error',
        'Failed to save behavior assessment. Please check your network and try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = () => {
    const totalQuestions = massItems.length + fastItems.length;
    const answeredCount =
      massItems.filter((i) => massAnswers[i.id]).length +
      fastItems.filter((i) => fastAnswers[i.id] !== undefined).length;
    const progress =
      totalQuestions > 0
        ? Math.max(0, Math.min(100, Math.round((answeredCount / totalQuestions) * 100)))
        : 0;
    const status =
      progress === 100 ? 'completed' : progress > 0 || records.length > 0 ? 'in_progress' : 'draft';

    persist(
      { tab, massAnswers, fastAnswers, records, status, progress },
      `Behavior assessment draft saved (${progress}%).`,
      false,
    );
  };

  const handleSubmit = () => {
    const totalQuestions = massItems.length + fastItems.length;
    const answeredCount =
      massItems.filter((i) => massAnswers[i.id]).length +
      fastItems.filter((i) => fastAnswers[i.id] !== undefined).length;

    if (totalQuestions > 0 && answeredCount < totalQuestions) {
      Alert.alert(
        'Incomplete Assessment',
        `Please complete all questions before submitting. Currently ${answeredCount} of ${totalQuestions} answered (${Math.round((answeredCount / totalQuestions) * 100)}%). You can use "Save Draft" to keep your current progress.`,
      );
      return;
    }

    Alert.alert(
      'Submit behavior assessment?',
      'This will submit the completed behavior assessment for Program Director review.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () =>
            persist(
              { tab, massAnswers, fastAnswers, records, status: 'submitted', progress: 100 },
              'Behavior assessment submitted for review (100%).',
              true,
            ),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Assessments" onTabPress={(t) => handleTeacherTabPress(navigation, t)} />

      <View style={styles.backRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
          <Feather name="arrow-left" size={16} color="#334155" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="alert-triangle" size={18} color={colors.navyText} />
          <View>
            <Text style={typography.h1}>Behavior Assessment</Text>
            <Text style={typography.caption}>
              SCR-TEA-003 — MASS / FAST / ABC · {profile?.fullName || 'Student'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'ABC' ? 'ABC Tracking' : t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'MASS' && (
          <View style={styles.card}>
            <Text style={typography.h3}>MASS — Motivation Assessment Scale</Text>
            <Text style={typography.caption}>
              Rate each statement: how often the behavior occurs in that situation.
            </Text>
            {massItems.map((item) => (
              <View key={item.id} style={styles.itemBlock}>
                <Text style={typography.body}>
                  <Text style={typography.bodyBold}>{item.id}.</Text> {item.text}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.likertRow}>
                    {LIKERT_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.likertBtn,
                          massAnswers[item.id] === opt && styles.likertBtnActive,
                        ]}
                        onPress={() => setMassAnswer(item.id, opt)}
                      >
                        <Text
                          style={[
                            styles.likertText,
                            massAnswers[item.id] === opt && styles.likertTextActive,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ))}
            <View style={styles.functionBox}>
              <Text style={typography.label}>Function Totals</Text>
              {Object.entries(massFunctionTotals).map(([fn, total]) => (
                <View key={fn} style={styles.functionRow}>
                  <Text
                    style={[
                      typography.body,
                      topMassFunctions.includes(fn as MassFunction) && {
                        fontWeight: '700',
                        color: colors.navyText,
                      },
                    ]}
                  >
                    {fn}
                  </Text>
                  <Text style={typography.bodyBold}>{total}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 'FAST' && (
          <View style={styles.card}>
            <Text style={typography.h3}>FAST — Functional Analysis Screening Tool</Text>
            <Text style={typography.caption}>Answer Yes or No for each statement.</Text>
            {fastItems.map((item) => (
              <View key={item.id} style={styles.itemBlock}>
                <Text style={typography.body}>
                  <Text style={typography.bodyBold}>{item.id}.</Text> {item.text}
                </Text>
                <View style={styles.yesNoRow}>
                  {[true, false].map((value) => (
                    <TouchableOpacity
                      key={String(value)}
                      style={[
                        styles.yesNoBtn,
                        fastAnswers[item.id] === value && styles.yesNoBtnActive,
                      ]}
                      onPress={() => setFastAnswer(item.id, value)}
                    >
                      <Text
                        style={[
                          styles.yesNoText,
                          fastAnswers[item.id] === value && styles.yesNoTextActive,
                        ]}
                      >
                        {value ? 'Yes' : 'No'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
            <View style={styles.functionBox}>
              <Text style={typography.label}>Category Scores (Yes counts)</Text>
              {Object.entries(fastCategoryTotals).map(([cat, total]) => (
                <View key={cat} style={styles.functionRow}>
                  <Text
                    style={[
                      typography.body,
                      topFastCategories.includes(cat as FastCategory) && {
                        fontWeight: '700',
                        color: colors.navyText,
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                  <Text style={typography.bodyBold}>{total}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 'ABC' && (
          <>
            <View style={styles.card}>
              <Text style={typography.h3}>
                {editingId ? 'Edit Behavior Record (ABC)' : 'Add Behavior Record (ABC)'}
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

            <Text style={typography.h3}>Records · {records.length}</Text>
            {records.map((r) => (
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
            ))}
          </>
        )}

        <View style={styles.card}>
          <Text style={typography.h3}>Assessment Summary</Text>
          <Text style={typography.body}>
            MASS: {massAnswered}/{massItems.length} answered · FAST: {fastAnswered}/
            {fastItems.length} answered · ABC: {records.length} incidents
          </Text>
          {(massAnswered > 0 || fastAnswered > 0) && (
            <View style={styles.summaryBox}>
              <Text style={typography.bodyBold}>
                Identified function: {summaryIdentifiedFunction}
              </Text>
              <Text style={typography.caption}>
                Recommendation: prioritize antecedent manipulations and reinforcement strategies
                that address the {summaryIdentifiedFunction} function, and continue ABC tracking to
                confirm patterns.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.actionBtnSecondary,
              saving && styles.actionBtnDisabled,
            ]}
            onPress={handleSaveDraft}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.navyText} />
            ) : (
              <Feather name="save" size={16} color={colors.navyText} />
            )}
            <Text style={styles.actionBtnText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary, saving && styles.actionBtnDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.navyText} />
            ) : (
              <Feather name="check-circle" size={16} color={colors.navyText} />
            )}
            <Text style={styles.actionBtnText}>Submit Assessment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 14, color: '#334155', fontWeight: '500', marginLeft: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.bgCard,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.bodyText },
  tabTextActive: { color: colors.navyText, fontWeight: '700' },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  itemBlock: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  likertRow: { flexDirection: 'row', gap: spacing.sm },
  likertBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  likertBtnActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  likertText: { fontSize: 11, fontWeight: '600', color: colors.bodyText },
  likertTextActive: { color: colors.navyText },
  yesNoRow: { flexDirection: 'row', gap: spacing.sm },
  yesNoBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  yesNoBtnActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  yesNoText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  yesNoTextActive: { color: colors.navyText },
  functionBox: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  functionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryBox: {
    backgroundColor: colors.statusPendingBg,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.xs,
    backgroundColor: colors.bgApp,
  },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  chipTextSelected: { color: colors.navyText },
  field: { gap: spacing.xs },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.navyText,
    backgroundColor: colors.bgApp,
  },
  ratingRow: { flexDirection: 'row', gap: spacing.sm },
  ratingBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  ratingBtnActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  ratingText: { fontSize: 12, color: colors.bodyText },
  ratingTextActive: { color: colors.navyText, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  addRow: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { backgroundColor: colors.bgApp, borderWidth: 1, borderColor: colors.border, flex: 1 },
  addBtnText: { fontWeight: '700', color: colors.navyText },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recordActions: { flexDirection: 'row', gap: spacing.lg },
  btnRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  actionBtnPrimary: { backgroundColor: colors.primaryYellow },
  actionBtnSecondary: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { fontWeight: '700', color: colors.navyText },
});
