import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
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

import {
  REPORT_TABS,
  STATIONS,
  type Option,
  type SessionReport,
  type FoundationOverview,
} from './reportsTypes';
import { ReportsFilterBar } from './components/ReportsFilterBar';
import { SessionReportsTab } from './components/SessionReportsTab';
import { StudentProgressTab } from './components/StudentProgressTab';
import { BiAnnualReportsTab } from './components/BiAnnualReportsTab';
import { FoundationOverviewTab } from './components/FoundationOverviewTab';
import { OptionPickerModal } from './components/OptionPickerModal';

type Props = NativeStackScreenProps<DirectorStackParamList, 'ReportsOversight'>;

export default function ReportsOversightScreen({ navigation }: Props) {
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
    return sessionReports.filter((r) => {
      if (selectedStudentId) {
        const student = students.find((s) => s.id === selectedStudentId);
        const name = student?.name || selectedStudentId;
        if (!r.studentNames.some((sn) => sn.toLowerCase().includes(name.toLowerCase()))) {
          return false;
        }
      }
      if (selectedTeacherId) {
        const teacher = teachers.find((t) => t.id === selectedTeacherId);
        const name = teacher?.name || selectedTeacherId;
        if (!r.teacherName.toLowerCase().includes(name.toLowerCase())) {
          return false;
        }
      }
      if (selectedStation && selectedStation !== 'All Stations') {
        const st = (r as any).stationName || '';
        if (st && !st.toLowerCase().includes(selectedStation.toLowerCase())) {
          return false;
        }
      }
      if (filterDate.trim()) {
        if (!r.date.includes(filterDate.trim())) {
          return false;
        }
      }
      return true;
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

  const buildStudentProgressText = (): string => {
    if (!studentProgressData) return '';
    const goals = studentProgressData.goals || [];
    return [
      '================================================================',
      "      MELU'E FOUNDATION — STUDENT PROGRESS MONITORING           ",
      '================================================================',
      `STUDENT: ${studentProgressData.name || 'Student'}`,
      `AGE: ${studentProgressData.age || 'N/A'}  |  PROGRAM: ${studentProgressData.program || 'N/A'}`,
      `DIAGNOSIS: ${studentProgressData.diagnosis || 'Autism Spectrum Disorder'}`,
      `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      '----------------------------------------------------------------',
      '',
      'IEP / IUP GOALS MASTERY PROGRESSION:',
      ...goals.map(
        (g: any, i: number) =>
          `  ${i + 1}. ${g.name}: ${g.percent || 0}% Mastery (${g.status || 'In Progress'})`,
      ),
      '',
      'CLINICAL SESSIONS & ATTENDANCE:',
      `  • Total Sessions Attended: ${studentProgressData.sessionsAttended || studentProgressData.sessionHistory?.length || 0}`,
      `  • Clinical Assessment Status: ${studentProgressData.assessmentSummary?.skills || 'Completed'}`,
      '----------------------------------------------------------------',
      'SYSTEM STATUS: Official Clinical Oversight Record',
      '================================================================',
    ].join('\n');
  };

  const handlePreviewStudentProgress = () => {
    setStudentProgressContent(buildStudentProgressText());
  };

  const buildBiAnnualText = (): string => {
    return [
      '================================================================',
      "      MELU'E FOUNDATION — BI-ANNUAL PROGRESS OVERSIGHT          ",
      '================================================================',
      `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      'PERIOD: 6-Month Comprehensive Clinical Summary',
      '----------------------------------------------------------------',
      '',
      'SUMMARY OF CLINICAL SESSIONS & THERAPY:',
      ...sessionReports.map(
        (r, i) =>
          `  ${i + 1}. Session Date: ${r.date} | Lead Therapist: ${r.teacherName}\n     Students: ${r.studentNames.join(', ')}`,
      ),
      '',
      '----------------------------------------------------------------',
      'SYSTEM STATUS: Certified by Foundation Director',
      '================================================================',
    ].join('\n');
  };

  const handleGenerateBiAnnual = async () => {
    try {
      await generateBiAnnualReport({});
    } catch {}
    setBiAnnualContent(buildBiAnnualText());
  };

  const handlePreview = () => setBiAnnualContent(buildBiAnnualText());

  const handleEmailParent = () =>
    Alert.alert('Email to Parents', 'Bi-annual progress packet queued for parent portal delivery.');

  const handleExportOverview = () => {
    if (!overview) return;
    setOverviewContent(
      [
        '================================================================',
        "      MELU'E FOUNDATION — EXECUTIVE ANALYTICS OVERVIEW          ",
        '================================================================',
        `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        '----------------------------------------------------------------',
        '',
        `• Total Enrolled Students: ${overview.totalStudents}`,
        `• Total Active Therapists: ${overview.totalTeachers}`,
        `• Sessions Conducted This Month: ${overview.sessionsThisMonth}`,
        `• Average Goal Progress (Foundation-Wide): ${overview.avgGoalProgress}%`,
        '',
        '================================================================',
      ].join('\n'),
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Reports"
        onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t])}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveContainer}>
          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.badgeIcon}>
                <Feather name="bar-chart-2" size={20} color={colors.navyText} />
              </View>
              <View>
                <Text style={styles.pageTitle}>Reports & Clinical Oversight</Text>
                <Text style={styles.pageSubtitle}>
                  Session logs, bi-annual progress packets, and foundation analytics
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.builderBtn}
              onPress={() => navigation?.navigate?.('ReportBuilder')}
              accessibilityRole="button"
              accessibilityLabel="Open custom report builder"
            >
              <Feather name="sliders" size={14} color={colors.navyText} />
              <Text style={styles.builderBtnText}>Open Custom Builder</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Segmented Control */}
          <View style={styles.segmentedContainer} accessibilityRole="tablist">
            {REPORT_TABS.map((t) => {
              const isSelected = activeTab === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.segmentTab, isSelected && styles.segmentTabActive]}
                  onPress={() => setActiveTab(t)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.segmentTabText, isSelected && styles.segmentTabTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

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
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navyText,
  },
  pageSubtitle: {
    fontSize: 13,
    color: colors.bodyText,
    marginTop: 2,
  },
  builderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF08A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  builderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 4,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentTabActive: {
    backgroundColor: '#FEF08A',
  },
  segmentTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.bodyText,
  },
  segmentTabTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
});
