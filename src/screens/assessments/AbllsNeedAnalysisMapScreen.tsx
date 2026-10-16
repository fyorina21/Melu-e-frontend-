import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, SafeAreaView, View, useWindowDimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { useToast } from '../../context/ToastContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { openPrintWindow } from '../../utils/webExport';
import { storage } from '../../utils/storage';
import { colors, spacing } from '../../theme';
import {
  getSkillsAssessment,
  saveSkillsAssessment,
  getTeacherStudentProfile,
} from '../../api/teacherExtrasApi';
import { getFormConfig } from '../../api/institutionalAdminApi';
import {
  DEFAULT_ABLLS_DOMAINS,
  buildAbllsDomainsFromConfig,
  saveStorageAssessment,
  loadStorageAssessment,
  SCORE_LABEL,
  type AbllsDomainDef,
  type Score,
} from './abllsConfigHelper';
import type { SessionStackParamList } from '../../types';
import type { ViewMode, SelectedItemState } from './types';
import {
  AbllsGridSheet,
  AbllsDomainCards,
  AbllsPrioritySummary,
  AbllsItemInspectorModal,
  AbllsMapHeader,
} from './components';
import { computeAbllsSummaryData, computePriorityAreas } from './abllsCalculationHelper';
import { generateAbllsExportHtml } from './abllsExportHelper';

interface StudentProfile {
  id: string;
  fullName: string;
  age: number;
}

type Props = NativeStackScreenProps<SessionStackParamList, 'AbllsNeedMap'>;

export default function AbllsNeedAnalysisMapScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const urlSid =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('studentId')
      : null;
  const localSid = storage.getSync('last_assessment_student_id');
  const rawId = route?.params?.studentId || urlSid || localSid || 'student-a';
  const studentId = rawId === 'stu-1' ? 'student-a' : rawId;

  useEffect(() => {
    if (studentId) {
      storage.setSync('last_assessment_student_id', studentId);
    }
  }, [studentId]);

  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [domains, setDomains] = useState<AbllsDomainDef[]>(DEFAULT_ABLLS_DOMAINS);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({});
  const [savedCustomFields, setSavedCustomFields] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedItem, setSelectedItem] = useState<SelectedItemState | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getTeacherStudentProfile(studentId);
      setProfile(res);
    } catch {
      setProfile(null);
    }
    try {
      const { data: cfg } = await getFormConfig('ABLLS Assessment Form');
      if (cfg && Array.isArray(cfg.fields) && cfg.fields.length > 0) {
        setDomains(buildAbllsDomainsFromConfig(cfg.fields));
      }
    } catch {
      setDomains(DEFAULT_ABLLS_DOMAINS);
    }
    try {
      const { data: saved } = await getSkillsAssessment(studentId);
      const savedData = (saved?.data ?? saved ?? {}) as {
        scores?: Record<string, Score>;
        notes?: Record<string, string>;
        customFields?: Record<string, any>;
      };
      const apiScores = savedData.scores ?? (saved as any)?.scores ?? {};
      const localData = loadStorageAssessment(studentId);
      const mergedScores: Record<string, Score> = {
        ...apiScores,
        ...(localData?.scores ?? {}),
      };
      const mergedNotes = {
        ...(savedData.notes ?? {}),
        ...(localData?.notes ?? {}),
      };
      const mergedCustomFields = {
        ...(savedData.customFields ?? {}),
        ...(localData?.customFields ?? {}),
      };
      setScores(mergedScores);
      if (Object.keys(mergedNotes).length > 0) setSavedNotes(mergedNotes);
      if (Object.keys(mergedCustomFields).length > 0) setSavedCustomFields(mergedCustomFields);
    } catch {
      const localData = loadStorageAssessment(studentId);
      if (localData?.scores) setScores(localData.scores);
      else setScores({});
    }
    setLoading(false);
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleUpdateItemScore = async (itemId: string, newScore: Score) => {
    const updatedScores: Record<string, Score> = {
      ...scores,
      [itemId]: newScore,
    };
    setScores(updatedScores);
    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem((prev) => (prev ? { ...prev, score: newScore } : null));
    }
    saveStorageAssessment(studentId, {
      scores: updatedScores,
      notes: savedNotes,
      customFields: savedCustomFields,
    });
    try {
      await saveSkillsAssessment(studentId, {
        scores: updatedScores,
        notes: savedNotes,
        customFields: savedCustomFields,
      });
      showToast(`${itemId} score updated to ${SCORE_LABEL[newScore]}`, 'success');
    } catch {
      showToast('Failed to save updated score', 'error');
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      saveStorageAssessment(studentId, {
        scores,
        notes: savedNotes,
        customFields: savedCustomFields,
      });
      await saveSkillsAssessment(studentId, {
        scores,
        notes: savedNotes,
        customFields: savedCustomFields,
      });
      showToast('ABLLS assessment map saved successfully.', 'success');
      navigation?.navigate?.('AssessmentSummaryReport' as never);
    } catch {
      showToast('Failed to save assessment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const summaryData = useMemo(() => computeAbllsSummaryData(domains, scores), [domains, scores]);

  const { priorityAreas, priorityNames, rows } = useMemo(
    () => computePriorityAreas(summaryData),
    [summaryData],
  );

  const studentName = profile?.fullName || 'Student A';

  const handleExport = () => {
    const html = generateAbllsExportHtml({
      studentName,
      age: profile?.age ?? '—',
      summaryData,
    });
    openPrintWindow(html, 'ABLLS-R Skill Tracking System & Color Need Map');
  };

  if (loading) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Assessments"
        onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
      />

      <View style={[styles.headerWrapper, isTablet && styles.headerWrapperTablet]}>
        <AbllsMapHeader
          onBack={() => navigation?.goBack?.()}
          onSave={handleSaveAll}
          saving={saving}
          onExport={handleExport}
          studentName={studentName}
          studentId={studentId}
          profile={profile}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.bodyWrapper, isTablet && styles.bodyWrapperTablet]}>
          {viewMode === 'grid' && (
            <AbllsGridSheet summaryData={summaryData} onSelectItem={setSelectedItem} />
          )}

          {viewMode === 'cards' && (
            <AbllsDomainCards
              summaryData={summaryData}
              priorityNames={priorityNames}
              onSelectItem={setSelectedItem}
            />
          )}

          {(viewMode === 'summary' || viewMode === 'grid') && (
            <AbllsPrioritySummary priorityAreas={priorityAreas} rows={rows} />
          )}
        </View>
      </ScrollView>

      {/* SKILL ITEM INSPECTOR MODAL */}
      <AbllsItemInspectorModal
        selectedItem={selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdateScore={handleUpdateItemScore}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  headerWrapper: {
    width: '100%',
  },
  headerWrapperTablet: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  bodyWrapper: {
    gap: spacing.xl,
    width: '100%',
  },
  bodyWrapperTablet: {
    maxWidth: 1400,
    alignSelf: 'center',
  },
});
