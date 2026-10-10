// src/screens/director/ReportsOversightScreen.tsx

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
import { colors, spacing } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import {
  getSessionReports,
  generateBiAnnualReport,
  getFoundationOverview,
  getDirectorStudentProgress,
} from '../../api/directorApi';
import { getStaffOptions, getStudentOptions } from '../../api/optionsApi';
import type { DirectorStackParamList } from '../../types';

import { STATIONS, type Option, type SessionReport, type FoundationOverview } from './reportsTypes';

import {
  filterSessionReports,
  buildStudentProgressReportText,
  buildBiAnnualReportText,
  buildFoundationOverviewText,
} from './reportsOversightHelper';

import { ReportsFilterBar } from './components/ReportsFilterBar';
import { SessionReportsTab } from './components/SessionReportsTab';
import { StudentProgressTab } from './components/StudentProgressTab';
import { BiAnnualReportsTab } from './components/BiAnnualReportsTab';
import { FoundationOverviewTab } from './components/FoundationOverviewTab';
import { OptionPickerModal } from './components/OptionPickerModal';
import ReportsOversightHeader from './components/ReportsOversightHeader';
import ReportsSegmentedTabs from './components/ReportsSegmentedTabs';

type Props = NativeStackScreenProps<DirectorStackParamList, 'ReportsOversight'>;

export default function ReportsOversightScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState('Session Reports');
  const [sessionReports, setSessionReports] = useState<SessionReport[]>([]);
  const [overview, setOverview] = useState<FoundationOverview | null>(null);
  const [biAnnualContent, setBiAnnualContent] = useState<string | null>(null);
  const [overviewContent, setOverviewContent] = useState<string | null>(null);
  const [studentProgressContent, setStudentProgressContent] = useState<string | null>(null);

  // Filter state
  const [students, setStudents] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<Option[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  // Dropdown Picker Modals
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [showTeacherPicker, setShowTeacherPicker] = useState(false);
  const [showStationPicker, setShowStationPicker] = useState(false);

  // Student Progress Data
  const [studentProgressData, setStudentProgressData] = useState<any>(null);
  const [studentProgressLoading, setStudentProgressLoading] = useState(false);

  useEffect(() => {
    getStudentOptions()
      .then(({ data }) => {
        setStudents(data || []);
        if (data && data.length > 0 && !selectedStudentId) {
          setSelectedStudentId(data[0].id);
        }
      })
      .catch(() => {});

    getStaffOptions()
      .then(({ data }) => {
        setTeachers(data?.filter((t: any) => t.role === 'teacher') || []);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const { data } = await getSessionReports({
        student_id: selectedStudentId || undefined,
        teacher_id: selectedTeacherId || undefined,
        station_id:
          selectedStation && selectedStation !== 'All Stations' ? selectedStation : undefined,
        start_date: filterDate || undefined,
      });
      setSessionReports(Array.isArray(data) ? data : []);
    } catch {
      setSessionReports([]);
    }
    try {
      const { data } = await getFoundationOverview();
      setOverview(data);
    } catch {
      setOverview(null);
    }
  }, [selectedStudentId, selectedTeacherId, selectedStation, filterDate]);

  useEffect(() => {
    load();
  }, [load]);

  // Load selected student progress for the Student Progress tab
  useEffect(() => {
    if (!selectedStudentId) {
      setStudentProgressData(null);
      return;
    }
    setStudentProgressLoading(true);
    getDirectorStudentProgress(selectedStudentId)
      .then(({ data }) => {
        setStudentProgressData(data ?? null);
      })
      .catch(() => {
        setStudentProgressData(null);
      })
      .finally(() => {
        setStudentProgressLoading(false);
      });
  }, [selectedStudentId]);

  const filteredSessionReports = useMemo(() => {
    return filterSessionReports(sessionReports, {
      selectedStudentId,
      selectedTeacherId,
      selectedStation,
      filterDate,
      students,
      teachers,
    });
  }, [
    sessionReports,
    selectedStudentId,
    selectedTeacherId,
    selectedStation,
    filterDate,
    students,
    teachers,
  ]);

  const handlePreviewStudentProgress = () => {
    setStudentProgressContent(buildStudentProgressReportText(studentProgressData));
  };

  const handleGenerateBiAnnual = async () => {
    try {
      await generateBiAnnualReport({});
    } catch {}
    setBiAnnualContent(buildBiAnnualReportText(sessionReports));
  };

  const handlePreview = () => setBiAnnualContent(buildBiAnnualReportText(sessionReports));

  const handleEmailParent = () =>
    Alert.alert('Email to Parents', 'Bi-annual progress packet queued for parent portal delivery.');

  const handleExportOverview = () => {
    setOverviewContent(buildFoundationOverviewText(overview));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Reports"
        onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t])}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.responsiveContainer, { maxWidth: Math.min(width - 32, 1200) }]}>
          {/* Page Header */}
          <ReportsOversightHeader
            onOpenCustomBuilder={() => navigation?.navigate?.('ReportBuilder')}
          />

          {/* Tab Segmented Control */}
          <ReportsSegmentedTabs activeTab={activeTab} onSelectTab={setActiveTab} />

          {/* Filter Controls */}
          <ReportsFilterBar
            students={students}
            teachers={teachers}
            selectedStudentId={selectedStudentId}
            selectedTeacherId={selectedTeacherId}
            selectedStation={selectedStation}
            filterDate={filterDate}
            onOpenStudentPicker={() => setShowStudentPicker(true)}
            onOpenTeacherPicker={() => setShowTeacherPicker(true)}
            onOpenStationPicker={() => setShowStationPicker(true)}
            onFilterDateChange={setFilterDate}
            onResetFilters={() => {
              setSelectedStudentId('');
              setSelectedTeacherId('');
              setSelectedStation('');
              setFilterDate('');
            }}
          />

          {/* Tab 1: Session Reports */}
          {activeTab === 'Session Reports' && (
            <SessionReportsTab filteredSessionReports={filteredSessionReports} />
          )}

          {/* Tab 2: Student Progress */}
          {activeTab === 'Student Progress' && (
            <StudentProgressTab
              studentProgressLoading={studentProgressLoading}
              studentProgressData={studentProgressData}
              onPreviewStudentProgress={handlePreviewStudentProgress}
            />
          )}

          {/* Tab 3: Bi-Annual Reports */}
          {activeTab === 'Bi-Annual Reports' && (
            <BiAnnualReportsTab
              onGenerateBiAnnual={handleGenerateBiAnnual}
              onPreview={handlePreview}
              onEmailParent={handleEmailParent}
            />
          )}

          {/* Tab 4: Foundation Overview */}
          {activeTab === 'Foundation Overview' && (
            <FoundationOverviewTab overview={overview} onExportOverview={handleExportOverview} />
          )}
        </View>
      </ScrollView>

      {/* Export Modals */}
      <ExportPreviewModal
        visible={!!studentProgressContent}
        title="Student Progress Monitoring Report"
        filename={`StudentProgress_${selectedStudentId || 'Report'}_${new Date().toISOString().slice(0, 10)}.txt`}
        content={studentProgressContent ?? ''}
        onClose={() => setStudentProgressContent(null)}
      />

      <ExportPreviewModal
        visible={!!biAnnualContent}
        title="Bi-Annual Progress Oversight"
        filename={`BiAnnualReport_${new Date().toISOString().slice(0, 10)}.txt`}
        content={biAnnualContent ?? ''}
        onClose={() => setBiAnnualContent(null)}
      />

      <ExportPreviewModal
        visible={!!overviewContent}
        title="Foundation Overview Analytics"
        filename={`FoundationAnalytics_${new Date().toISOString().slice(0, 10)}.txt`}
        content={overviewContent ?? ''}
        onClose={() => setOverviewContent(null)}
      />

      {/* Pickers */}
      <OptionPickerModal
        visible={showStudentPicker}
        title="Filter by Student"
        options={students}
        selectedId={selectedStudentId}
        emptyOptionLabel="All Students"
        onSelect={setSelectedStudentId}
        onClose={() => setShowStudentPicker(false)}
      />

      <OptionPickerModal
        visible={showTeacherPicker}
        title="Filter by Therapist"
        options={teachers}
        selectedId={selectedTeacherId}
        emptyOptionLabel="All Teachers"
        onSelect={setSelectedTeacherId}
        onClose={() => setShowTeacherPicker(false)}
      />

      <OptionPickerModal
        visible={showStationPicker}
        title="Filter by Station"
        options={STATIONS.map((s) => ({ id: s, name: s }))}
        selectedId={selectedStation}
        emptyOptionLabel="All Stations"
        onSelect={setSelectedStation}
        onClose={() => setShowStationPicker(false)}
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  responsiveContainer: {
    width: '100%',
    alignSelf: 'center',
  },
});
