// screens/director/ReportBuilderScreen.tsx
// SCR-DIR-007: Custom Report Builder (Director View)

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { generateCustomReport } from '../../api/directorApi';
import { getStaffOptions } from '../../api/optionsApi';
import type { DirectorStackParamList } from '../../types';
import {
  PROGRAMS,
  PERIODS,
  SCORE_FILTERS,
  GOAL_STATUSES,
  BEHAVIOR_TYPES,
  DIAGNOSES,
  ATTENDANCE_OPTIONS,
  AGE_OPTIONS,
  buildCsv,
  buildReportText,
  type ReportRow,
  type ReportFilterState,
} from './reportbuilder/reportBuilderTypes';
import {
  ReportBuilderHeader,
  ReportFilterCard,
  ReportResultsCard,
  DropdownPickerModal,
} from './reportbuilder/components';

export default function ReportBuilderScreen({
  navigation,
}: NativeStackScreenProps<DirectorStackParamList, 'ReportBuilder'>) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [filters, setFilters] = useState<ReportFilterState>({
    program: PROGRAMS[0],
    therapist: 'All Staff',
    ageRange: AGE_OPTIONS[0],
    attendanceFilter: ATTENDANCE_OPTIONS[0],
    period: PERIODS[0],
    studentSearch: '',
    scoreFilter: SCORE_FILTERS[0],
    goalStatus: GOAL_STATUSES[0],
    behaviorType: BEHAVIOR_TYPES[0],
    diagnosis: DIAGNOSES[0],
  });

  const [results, setResults] = useState<ReportRow[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [exportContent, setExportContent] = useState<string | null>(null);
  const [therapists, setTherapists] = useState<string[]>([]);

  // Active Dropdown Target
  const [activePicker, setActivePicker] = useState<{
    title: string;
    options: string[];
    selected: string;
    onSelect: (val: string) => void;
  } | null>(null);

  useEffect(() => {
    getStaffOptions()
      .then(({ data: opts }) =>
        setTherapists([
          'All Staff',
          ...opts.filter((t) => t.role === 'teacher').map((t) => t.name),
        ]),
      )
      .catch(() => setTherapists(['All Staff']));
  }, []);

  const handleFilterChange = <K extends keyof ReportFilterState>(
    key: K,
    value: ReportFilterState[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const progParam = filters.program === 'All Programs' ? 'ABA' : filters.program;
      const { data } = await generateCustomReport({
        program: progParam,
        therapist: filters.therapist === 'All Staff' ? 'All' : filters.therapist,
        period: filters.period === 'All Periods' ? 'Jan–Mar' : filters.period,
        studentSearch: filters.studentSearch,
        scoreFilter: filters.scoreFilter === 'All Scores' ? 'All' : filters.scoreFilter,
        goalStatus: filters.goalStatus === 'All Statuses' ? 'All' : filters.goalStatus,
        behaviorType: filters.behaviorType === 'All Types' ? 'All' : filters.behaviorType,
        diagnosis: filters.diagnosis === 'All Diagnoses' ? 'All' : filters.diagnosis,
      });
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    }
    setGenerating(false);
  };

  const handleExport = (format: 'CSV' | 'TXT' | 'PRINT') => {
    if (!results || results.length === 0) {
      Alert.alert('Generate Report First', 'Please generate report results before exporting.');
      return;
    }
    if (format === 'CSV') {
      setExportContent(buildCsv(results));
      return;
    }
    setExportContent(buildReportText(results, filters));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Builder"
        onTabPress={(t) =>
          t !== 'Builder' && navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t] as never)
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.bodyWrapper, isTablet && styles.bodyWrapperTablet]}>
          <ReportBuilderHeader />

          <ReportFilterCard
            filters={filters}
            onFilterChange={handleFilterChange}
            therapists={therapists}
            generating={generating}
            onGenerate={handleGenerate}
            onOpenPicker={setActivePicker}
          />

          {results !== null && <ReportResultsCard results={results} onExport={handleExport} />}
        </View>
      </ScrollView>

      {/* Interactive Picker Modal */}
      {activePicker && (
        <DropdownPickerModal
          visible={true}
          title={activePicker.title}
          options={activePicker.options}
          selected={activePicker.selected}
          onSelect={activePicker.onSelect}
          onClose={() => setActivePicker(null)}
        />
      )}

      {/* Export Preview Modal */}
      <ExportPreviewModal
        visible={!!exportContent}
        title="Custom Student Clinical Report"
        filename={`CustomReport_${new Date().toISOString().slice(0, 10)}.txt`}
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
    paddingBottom: 50,
  },
  bodyWrapper: {
    gap: spacing.lg,
    width: '100%',
  },
  bodyWrapperTablet: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
});
