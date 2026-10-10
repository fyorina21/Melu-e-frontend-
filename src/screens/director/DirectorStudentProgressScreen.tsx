// src/screens/director/DirectorStudentProgressScreen.tsx
// SCR-DIR-006: Student Progress Monitoring (Director View)

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import { colors, spacing } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { getDirectorStudentProgress } from '../../api/directorApi';
import { getStudentOptions, type StudentOption } from '../../api/optionsApi';
import client from '../../api/sessionApi';
import type { DirectorStackParamList } from '../../types';
import { generateReportText, type DirectorStudentData } from './progress/directorProgressTypes';
import {
  DirectorProgressHeader,
  DirectorStudentPickerCard,
  DirectorAssessmentSummaryCard,
  DirectorGoalsProgressCard,
  DirectorGoalTrendChartCard,
  DirectorSessionHistoryCard,
  DirectorBehaviorIncidentCard,
  DirectorInternalNotesCard,
} from './progress/components';

export default function DirectorStudentProgressScreen({
  navigation,
}: NativeStackScreenProps<DirectorStackParamList, 'DirectorStudentProgress'>) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [data, setData] = useState<DirectorStudentData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [exportContent, setExportContent] = useState<string | null>(null);

  // Dropdown Picker State
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');

  // Load the student list first; progress data waits until one is selected.
  useEffect(() => {
    let cancelled = false;
    getStudentOptions()
      .then(({ data: opts }) => {
        if (cancelled) return;
        const list = Array.isArray(opts) ? opts : [];
        setStudentOptions(list);
        if (list.length > 0) setSelectedStudentId(list[0].id);
        else setLoadError(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    if (!selectedStudentId) return;
    try {
      const { data: res } = await getDirectorStudentProgress(selectedStudentId);
      setData(res);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    load();
  }, [load]);

  const retry = useCallback(async () => {
    setLoadError(false);
    if (selectedStudentId) {
      await load();
      return;
    }
    try {
      const { data: opts } = await getStudentOptions();
      const list = Array.isArray(opts) ? opts : [];
      setStudentOptions(list);
      if (list.length > 0) {
        setSelectedStudentId(list[0].id);
        return;
      }
    } catch {}
    setLoadError(true);
  }, [selectedStudentId, load]);

  const handleSaveNotes = async () => {
    if (!selectedStudentId || !notes.trim()) return;
    try {
      await client.post(`/students/${selectedStudentId}/internal_notes`, {
        content: notes.trim(),
        recorded_at: new Date().toISOString(),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to save internal note';
      Alert.alert('Error', msg);
    }
  };

  const handlePrint = () => {
    if (!data) return;
    setExportContent(generateReportText(data, notes));
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setDropdownOpen(false);
    setSearchStudent('');
  };

  if (loadError) return <ScreenError onRetry={retry} />;
  if (!data) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Student Progress"
        onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t] as any)}
      />

      <ScrollView
        contentContainerStyle={[styles.content, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentWrapper, isTablet && styles.tabletWrapper]}>
          <DirectorProgressHeader onPrint={handlePrint} />

          <DirectorStudentPickerCard
            currentStudent={data}
            studentOptions={studentOptions}
            selectedStudentId={selectedStudentId}
            dropdownOpen={dropdownOpen}
            searchStudent={searchStudent}
            onToggleDropdown={() => setDropdownOpen((prev) => !prev)}
            onSearchChange={setSearchStudent}
            onSelectStudent={handleSelectStudent}
          />

          <DirectorAssessmentSummaryCard
            skillsStatus={data.assessmentSummary.skills}
            behaviorStatus={data.assessmentSummary.behavior}
            preferencesStatus={data.assessmentSummary.preferences}
          />

          <DirectorGoalsProgressCard goals={data.goals} />

          <DirectorGoalTrendChartCard trend={data.goals[0]?.trend} />

          <DirectorSessionHistoryCard sessions={data.sessionHistory} />

          <DirectorBehaviorIncidentCard incidentSummary={data.incidentSummary} />

          <DirectorInternalNotesCard
            notes={notes}
            notesSaved={notesSaved}
            onNotesChange={setNotes}
            onSaveNotes={handleSaveNotes}
          />
        </View>
      </ScrollView>

      <ExportPreviewModal
        visible={!!exportContent}
        title="Student Progress Report"
        filename={`${data.name.replace(/\s+/g, '_')}_ProgressReport.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  tabletContent: {
    padding: spacing.xl,
  },
  contentWrapper: {
    width: '100%',
    gap: spacing.lg,
  },
  tabletWrapper: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
});
