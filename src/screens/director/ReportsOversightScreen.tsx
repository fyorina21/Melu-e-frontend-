// screens/director/ReportsOversightScreen.tsx
// SCR-DIR-005: Reports & Oversight

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import {
  generateBiAnnualReport,
  getFoundationOverview,
  getSessionReports,
} from '../../api/directorApi';
import type { DirectorStackParamList } from '../../types';

const REPORT_TABS = [
  'Session Reports',
  'Bi-Annual Reports',
  'Student Progress',
  'Foundation Overview',
] as const;

type ReportTab = (typeof REPORT_TABS)[number];

type SessionStatus = 'Completed' | 'Draft';

interface SessionReport {
  id: string;
  date: string;
  teacherName: string;
  station: string;
  studentNames: string[];
  trials: number;
  independence: number;
  incidents: number;
  status: SessionStatus;
  summary: string;
}

interface FoundationOverviewData {
  totalStudents: number;
  totalTeachers: number;
  sessionsThisMonth: number;
  avgGoalProgress: number;
  activeCount: number;
  inAssessmentCount: number;
  masteredCount: number;
}

interface ProgressPoint {
  week: string;
  colors: number;
  eyeContact: number;
  turnTaking: number;
}

interface GoalRow {
  goal: string;
  domain: string;
  current: number;
  trend: 'Up' | 'Down' | 'Stable';
  status: 'In Progress' | 'Mastered';
}

const STUDENTS = ['Student A', 'Student B', 'Student C', 'Student D'];
const TEACHERS = ['Teacher A', 'Teacher B', 'Teacher C'];
const STATIONS = ['Station 1', 'Station 2'];

const PROGRESS_CHART_DATA: ProgressPoint[] = [
  { week: 'Wk 1', colors: 42, eyeContact: 55, turnTaking: 40 },
  { week: 'Wk 2', colors: 50, eyeContact: 58, turnTaking: 48 },
  { week: 'Wk 3', colors: 55, eyeContact: 62, turnTaking: 52 },
  { week: 'Wk 4', colors: 63, eyeContact: 67, turnTaking: 58 },
  { week: 'Wk 5', colors: 70, eyeContact: 70, turnTaking: 65 },
  { week: 'Wk 6', colors: 75, eyeContact: 75, turnTaking: 70 },
  { week: 'Wk 7', colors: 82, eyeContact: 80, turnTaking: 78 },
  { week: 'Wk 8', colors: 88, eyeContact: 85, turnTaking: 85 },
];

const GOALS_TABLE_DATA: GoalRow[] = [
  {
    goal: 'Identify Colors',
    domain: 'Cognitive',
    current: 88,
    trend: 'Up',
    status: 'In Progress',
  },
  {
    goal: 'Eye Contact',
    domain: 'Social',
    current: 85,
    trend: 'Up',
    status: 'In Progress',
  },
  {
    goal: 'Turn Taking',
    domain: 'Social',
    current: 85,
    trend: 'Up',
    status: 'Mastered',
  },
];

const SESSIONS_PER_TEACHER_WEEK = [
  { week: 'Wk 1', teacherA: 4, teacherB: 3, teacherC: 3 },
  { week: 'Wk 2', teacherA: 5, teacherB: 4, teacherC: 3 },
  { week: 'Wk 3', teacherA: 4, teacherB: 5, teacherC: 4 },
  { week: 'Wk 4', teacherA: 6, teacherB: 4, teacherC: 5 },
];

const DEMO_SESSION_REPORTS: SessionReport[] = [
  {
    id: '1',
    date: 'Aug 15, 2026',
    teacherName: 'Teacher A',
    station: 'Station 1',
    studentNames: ['Student A', 'Student B'],
    trials: 24,
    independence: 78,
    incidents: 1,
    status: 'Completed',
    summary:
      'This session covered structured learning activities across discrete trial training. Students demonstrated consistent engagement.',
  },
  {
    id: '2',
    date: 'Aug 14, 2026',
    teacherName: 'Teacher B',
    station: 'Station 2',
    studentNames: ['Student C'],
    trials: 18,
    independence: 65,
    incidents: 0,
    status: 'Completed',
    summary:
      'This session covered structured learning activities across discrete trial training. Students demonstrated consistent engagement with 65% independence across 18 logged trials. No behavioral incidents were recorded.',
  },
  {
    id: '3',
    date: 'Aug 13, 2026',
    teacherName: 'Teacher C',
    station: 'Station 1',
    studentNames: ['Student D'],
    trials: 20,
    independence: 55,
    incidents: 2,
    status: 'Completed',
    summary: 'Targeted focus on communication cards.',
  },
  {
    id: '4',
    date: 'Aug 12, 2026',
    teacherName: 'Teacher A',
    station: 'Station 2',
    studentNames: ['Student A'],
    trials: 16,
    independence: 82,
    incidents: 0,
    status: 'Completed',
    summary: 'Excellent progress on independent task execution.',
  },
  {
    id: '5',
    date: 'Aug 11, 2026',
    teacherName: 'Teacher B',
    station: 'Station 1',
    studentNames: ['Student B', 'Student C'],
    trials: 22,
    independence: 70,
    incidents: 1,
    status: 'Draft',
    summary: 'Draft report awaiting teacher final submission.',
  },
  {
    id: '6',
    date: 'Aug 10, 2026',
    teacherName: 'Teacher C',
    station: 'Station 2',
    studentNames: ['Student D'],
    trials: 15,
    independence: 60,
    incidents: 0,
    status: 'Completed',
    summary: 'Structured learning activities with continued skill development.',
  },
];

const DEMO_OVERVIEW: FoundationOverviewData = {
  totalStudents: 24,
  totalTeachers: 5,
  sessionsThisMonth: 96,
  avgGoalProgress: 61,
  activeCount: 2,
  inAssessmentCount: 1,
  masteredCount: 1,
};

type FilterKey = 'student' | 'teacher' | 'station';

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.dropdownBtn}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.dropdownText}>{value}</Text>
        <Feather name="chevron-down" size={14} color={colors.mutedText} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.dropdownOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.dropdownMenu} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.dropdownTitle}>{label}</Text>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.dropdownOption,
                  value === option && styles.dropdownOptionActive,
                ]}
                onPress={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    value === option && styles.dropdownOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
                {value === option && (
                  <Feather name="check" size={15} color={colors.primaryBlue} />
                )}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function FilterBar({
  selectedStudent,
  selectedTeacher,
  selectedStation,
  fromDate,
  toDate,
  onStudentChange,
  onTeacherChange,
  onStationChange,
  onFromDateChange,
  onToDateChange,
}: {
  selectedStudent: string;
  selectedTeacher: string;
  selectedStation: string;
  fromDate: string;
  toDate: string;
  onStudentChange: (value: string) => void;
  onTeacherChange: (value: string) => void;
  onStationChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
}) {
  return (
    <View style={styles.filterBar}>
      <View style={styles.filterGroup}>
        <FilterDropdown
          label="Students"
          value={selectedStudent}
          options={['All Students', ...STUDENTS]}
          onChange={onStudentChange}
        />
        <FilterDropdown
          label="Teachers"
          value={selectedTeacher}
          options={['All Teachers', ...TEACHERS]}
          onChange={onTeacherChange}
        />
        <FilterDropdown
          label="Stations"
          value={selectedStation}
          options={['All Stations', ...STATIONS]}
          onChange={onStationChange}
        />
      </View>

      <View style={styles.dateGroup}>
        <Text style={styles.dateLabel}>From</Text>
        <TextInput
          style={styles.dateInput}
          placeholder="mm/dd/yyyy"
          placeholderTextColor={colors.mutedText}
          value={fromDate}
          onChangeText={onFromDateChange}
        />
        <Text style={styles.dateLabel}>To</Text>
        <TextInput
          style={styles.dateInput}
          placeholder="mm/dd/yyyy"
          placeholderTextColor={colors.mutedText}
          value={toDate}
          onChangeText={onToDateChange}
        />
      </View>
    </View>
  );
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const completed = status === 'Completed';

  return (
    <View style={[styles.badge, completed ? styles.badgeSuccess : styles.badgeWarning]}>
      <Text
        style={[
          styles.badgeText,
          completed ? styles.badgeSuccessText : styles.badgeWarningText,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function GoalStatusBadge({ status }: { status: GoalRow['status'] }) {
  const mastered = status === 'Mastered';

  return (
    <View
      style={[
        styles.goalStatusBadge,
        mastered ? styles.goalMastered : styles.goalInProgress,
      ]}
    >
      <Text
        style={[
          styles.goalStatusText,
          mastered ? styles.goalMasteredText : styles.goalInProgressText,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function SessionDetailModal({
  session,
  onClose,
}: {
  session: SessionReport | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={!!session}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={typography.h2}>Session Detail</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIconBtn}>
              <Feather name="x" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          {session && (
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.detailGrid}>
                <DetailItem label="Date" value={session.date} />
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <StatusBadge status={session.status} />
                </View>
                <DetailItem label="Teacher" value={session.teacherName} />
                <DetailItem label="Station" value={session.station} />
                <View style={styles.detailColWide}>
                  <DetailItem
                    label="Students"
                    value={session.studentNames.join(', ')}
                  />
                </View>
                <DetailItem label="Total Trials" value={String(session.trials)} />
                <DetailItem
                  label="Independence %"
                  value={`${session.independence}%`}
                  valueStyle={styles.primaryText}
                />
                <DetailItem label="Incidents" value={String(session.incidents)} />
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Session Summary</Text>
                <Text style={styles.summaryText}>
                  {session.summary ||
                    `This session covered structured learning activities across discrete trial training. Students demonstrated consistent engagement with ${session.independence}% independence across ${session.trials} logged trials. ${
                      session.incidents > 0
                        ? `${session.incidents} behavioral incident(s) were noted and managed with standard protocol.`
                        : 'No behavioral incidents were recorded.'
                    }`}
                </Text>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DetailItem({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.detailCol}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailVal, valueStyle]}>{value}</Text>
    </View>
  );
}

function ProgressChart() {
  const chartHeight = 210;
  const chartTop = 10;
  const chartBottom = 28;
  const chartUsableHeight = chartHeight - chartTop - chartBottom;

  const getY = (value: number) =>
    chartTop + ((100 - value) / 70) * chartUsableHeight;

  return (
    <View style={styles.lineChartArea}>
      <View style={styles.yAxis}>
        {['100%', '70%', '50%', '30%'].map((label) => (
          <Text key={label} style={styles.axisLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={[styles.chartCanvas, { height: chartHeight }]}>
        {[100, 70, 50, 30].map((value) => (
          <View
            key={value}
            style={[
              styles.chartGridLine,
              { top: getY(value) },
            ]}
          />
        ))}

        {PROGRESS_CHART_DATA.map((point, index) => {
          const next = PROGRESS_CHART_DATA[index + 1];

          return (
            <React.Fragment key={point.week}>
              <View
                style={[
                  styles.chartPoint,
                  {
                    left: `${(index / (PROGRESS_CHART_DATA.length - 1)) * 100}%`,
                    top: getY(point.colors) - 4,
                    backgroundColor: colors.primaryBlue,
                  }
                ]}
              />
              <View
                style={[
                  styles.chartPoint,
                  {
                    left: `${(index / (PROGRESS_CHART_DATA.length - 1)) * 100}%`,
                    top: getY(point.eyeContact) - 4,
                    backgroundColor: colors.primaryYellow,
                  },
                ]}
              />
              <View
                style={[
                  styles.chartPoint,
                  {
                    left: `${(index / (PROGRESS_CHART_DATA.length - 1)) * 100}%`,
                    top: getY(point.turnTaking) - 4,
                    backgroundColor: colors.successGreen,
                  },
                ]}
              />

              {next && (
                <>
                  <ChartSegment
                    startX={index / (PROGRESS_CHART_DATA.length - 1)}
                    endX={(index + 1) / (PROGRESS_CHART_DATA.length - 1)}
                    startY={getY(point.colors)}
                    endY={getY(next.colors)}
                    color={colors.primaryBlue}
                    chartHeight={chartHeight}
                  />
                  <ChartSegment
                    startX={index / (PROGRESS_CHART_DATA.length - 1)}
                    endX={(index + 1) / (PROGRESS_CHART_DATA.length - 1)}
                    startY={getY(point.eyeContact)}
                    endY={getY(next.eyeContact)}
                    color={colors.primaryYellow}
                    chartHeight={chartHeight}
                  />
                  <ChartSegment
                    startX={index / (PROGRESS_CHART_DATA.length - 1)}
                    endX={(index + 1) / (PROGRESS_CHART_DATA.length - 1)}
                    startY={getY(point.turnTaking)}
                    endY={getY(next.turnTaking)}
                    color={colors.successGreen}
                    chartHeight={chartHeight}
                  />
                </>
              )}
            </React.Fragment>
          );
        })}

        <View style={styles.xAxis}>
          {PROGRESS_CHART_DATA.map((point) => (
            <Text key={point.week} style={styles.axisLabel}>
              {point.week}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function ChartSegment({
  startX,
  endX,
  startY,
  endY,
  color,
  chartHeight,
}: {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  color: string;
  chartHeight: number;
}) {
  const widthPercent = (endX - startX) * 100;
  const deltaY = endY - startY;
  const segmentHeight = Math.sqrt(
    Math.pow(widthPercent, 2) + Math.pow(deltaY, 2),
  );
  const angle = Math.atan2(deltaY, widthPercent) * (180 / Math.PI);

  return (
    <View
      style={[
        styles.chartSegment,
        {
          left: `${startX * 100}%`,
          top: startY,
          width: `${segmentHeight}%`,
          backgroundColor: color,
          transform: [{ rotate: `${angle}deg` }],
        },
      ]}
    />
  );
}

function StudentProgressTable() {
  return (
    <View style={styles.tableCard}>
      <View style={styles.tableSectionHeader}>
        <Text style={typography.h3}>Goals</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.goalsTable}>
          <View style={[styles.goalsRow, styles.goalsHeader]}>
            <Text style={[styles.goalCell, styles.goalHeaderText, styles.goalCol1]}>
              GOAL
            </Text>
            <Text style={[styles.goalCell, styles.goalHeaderText, styles.goalCol2]}>
              DOMAIN
            </Text>
            <Text style={[styles.goalCell, styles.goalHeaderText, styles.goalCol3]}>
              CURRENT %
            </Text>
            <Text style={[styles.goalCell, styles.goalHeaderText, styles.goalCol4]}>
              TREND
            </Text>
            <Text style={[styles.goalCell, styles.goalHeaderText, styles.goalCol5]}>
              STATUS
            </Text>
          </View>

          {GOALS_TABLE_DATA.map((goal) => (
            <View key={goal.goal} style={styles.goalsRow}>
              <Text style={[styles.goalCell, styles.goalCol1, styles.goalText]}>
                {goal.goal}
              </Text>
              <Text style={[styles.goalCell, styles.goalCol2, styles.mutedText]}>
                {goal.domain}
              </Text>
              <Text
                style={[
                  styles.goalCell,
                  styles.goalCol3,
                  styles.primaryText,
                  styles.goalStrong,
                ]}
              >
                {goal.current}%
              </Text>
              <Text
                style={[
                  styles.goalCell,
                  styles.goalCol4,
                  styles.trendUp,
                  styles.goalStrong,
                ]}
              >
                {goal.trend === 'Up' ? '↑' : goal.trend === 'Down' ? '↓' : '→'}{' '}
                {goal.trend}
              </Text>
              <View style={[styles.goalCell, styles.goalCol5]}>
                <GoalStatusBadge status={goal.status} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function FoundationBarChart() {
  const maxValue = 8;

  return (
    <View style={styles.foundationChart}>
      <View style={styles.foundationYAxis}>
        {[8, 6, 4, 2, 0].map((value) => (
          <Text key={value} style={styles.axisLabel}>
            {value}
          </Text>
        ))}
      </View>

      <View style={styles.foundationBarsArea}>
        <View style={styles.foundationGridLines}>
          {[8, 6, 4, 2, 0].map((value) => (
            <View key={value} style={styles.foundationGridLine} />
          ))}
        </View>

        <View style={styles.barsRow}>
          {SESSIONS_PER_TEACHER_WEEK.map((item) => (
            <View key={item.week} style={styles.weekBarGroup}>
              <View style={styles.weekBar}>
                <View
                  style={[
                    styles.barSegment,
                    {
                      height: `${(item.teacherA / maxValue) * 100}%`,
                      backgroundColor: colors.primaryBlue,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.barSegment,
                    {
                      height: `${(item.teacherB / maxValue) * 100}%`,
                      backgroundColor: colors.primaryYellow,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.barSegment,
                    {
                      height: `${(item.teacherC / maxValue) * 100}%`,
                      backgroundColor: colors.successGreen,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{item.week}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function ReportsOversightScreen({
  navigation,
}: NativeStackScreenProps<DirectorStackParamList, 'ReportsOversight'>) {
  const [activeTab, setActiveTab] = useState<ReportTab>('Session Reports');

  const [sessionReports, setSessionReports] = useState<SessionReport[]>([]);
  const [overview, setOverview] = useState<FoundationOverviewData | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionReport | null>(null);

  const [selectedStudent, setSelectedStudent] = useState('All Students');
  const [selectedTeacher, setSelectedTeacher] = useState('All Teachers');
  const [selectedStation, setSelectedStation] = useState('All Stations');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [biAnnualStudent, setBiAnnualStudent] = useState('');
  const [biAnnualGenerated, setBiAnnualGenerated] = useState(false);

  const [progressStudent, setProgressStudent] = useState('');
  const [activeOverviewWeek, setActiveOverviewWeek] = useState('Wk 1');

  const [exportModalContent, setExportModalContent] = useState<string | null>(null);
  const [exportModalTitle, setExportModalTitle] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await getSessionReports({});
      setSessionReports(Array.isArray(data) ? data : DEMO_SESSION_REPORTS);
    } catch {
      setSessionReports(DEMO_SESSION_REPORTS);
    }

    try {
      const { data } = await getFoundationOverview();
      setOverview(data || DEMO_OVERVIEW);
    } catch {
      setOverview(DEMO_OVERVIEW);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredSessionReports = useMemo(() => {
    return sessionReports.filter((report) => {
      const studentMatches =
        selectedStudent === 'All Students' ||
        report.studentNames.includes(selectedStudent);

      const teacherMatches =
        selectedTeacher === 'All Teachers' ||
        report.teacherName === selectedTeacher;

      const stationMatches =
        selectedStation === 'All Stations' ||
        report.station === selectedStation;

      return studentMatches && teacherMatches && stationMatches;
    });
  }, [sessionReports, selectedStudent, selectedTeacher, selectedStation]);

  const selectedBiAnnualLabel =
    biAnnualStudent || 'Student A';

  const handleExportPDF = (title: string) => {
    setExportModalTitle(title);
    setExportModalContent(
      [
        `=== ${title.toUpperCase()} ===`,
        `Exported: ${new Date().toLocaleDateString()}`,
        `Filter Student: ${selectedStudent}`,
        `Filter Teacher: ${selectedTeacher}`,
        `Filter Station: ${selectedStation}`,
        `From: ${fromDate || 'Any date'}`,
        `To: ${toDate || 'Any date'}`,
        '---------------------------------------',
        'Data content exported successfully.',
      ].join('\n'),
    );
  };

  const handleExportCSV = () => {
    Alert.alert('Export CSV', 'CSV data export process initiated.');
  };

  const handleGenerateBiAnnual = async () => {
    if (!biAnnualStudent) {
      Alert.alert('Student Required', 'Please select a student first.');
      return;
    }

    try {
      await generateBiAnnualReport({
        student: biAnnualStudent,
        fromDate,
        toDate,
      } as never);
    } catch {
      // Keep the UI usable while the backend/report endpoint is unavailable.
    }

    setBiAnnualGenerated(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Reports"
        onTabPress={(tab) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[tab])}
      />

      <View style={styles.header}>
        <Text style={typography.h1}>Reports & Oversight</Text>
        <Text style={styles.subHeader}>Foundation analytics and reporting</Text>
      </View>

      <View style={styles.tabsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {REPORT_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.globalFilterWrapper}>
        <FilterBar
          selectedStudent={selectedStudent}
          selectedTeacher={selectedTeacher}
          selectedStation={selectedStation}
          fromDate={fromDate}
          toDate={toDate}
          onStudentChange={setSelectedStudent}
          onTeacherChange={setSelectedTeacher}
          onStationChange={setSelectedStation}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Session Reports' && (
          <View style={styles.card}>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={styles.sessionTable}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  {[
                    ['DATE', 115],
                    ['TEACHER', 100],
                    ['STATION', 90],
                    ['STUDENTS', 160],
                    ['TRIALS', 70],
                    ['INDEPENDENCE %', 120],
                    ['INCIDENTS', 80],
                    ['STATUS', 100],
                    ['ACTIONS', 140],
                  ].map(([label, width]) => (
                    <Text
                      key={String(label)}
                      style={[styles.tableHeadCell, { width: Number(width) }]}
                    >
                      {label}
                    </Text>
                  ))}
                </View>

                {filteredSessionReports.length === 0 ? (
                  <View style={styles.emptyTableState}>
                    <Feather
                      name="search"
                      size={26}
                      color={colors.mutedText}
                    />
                    <Text style={styles.emptyTitle}>No sessions found</Text>
                    <Text style={styles.emptyText}>
                      Try changing the selected filters.
                    </Text>
                  </View>
                ) : (
                  filteredSessionReports.map((report) => (
                    <View key={report.id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { width: 115 }]}>
                        {report.date}
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        {report.teacherName}
                      </Text>
                      <Text style={[styles.tableCell, { width: 90 }]}>
                        {report.station}
                      </Text>
                      <Text style={[styles.tableCell, { width: 160 }]}>
                        {report.studentNames.join(', ')}
                      </Text>
                      <Text style={[styles.tableCell, { width: 70 }]}>
                        {report.trials}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.primaryText,
                          { width: 120 },
                        ]}
                      >
                        {report.independence}%
                      </Text>
                      <Text style={[styles.tableCell, { width: 80 }]}>
                        {report.incidents}
                      </Text>
                      <View style={[styles.tableCellView, { width: 100 }]}>
                        <StatusBadge status={report.status} />
                      </View>
                      <View style={[styles.actionRow, { width: 140 }]}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => setSelectedSession(report)}
                        >
                          <Feather
                            name="eye"
                            size={12}
                            color={colors.primaryBlue}
                          />
                          <Text style={styles.actionBtnText}>View</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() =>
                            handleExportPDF(`Session Report - ${report.id}`)
                          }
                        >
                          <Feather
                            name="download"
                            size={12}
                            color={colors.navyText}
                          />
                          <Text style={styles.actionBtnText}>PDF</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        )}

        {activeTab === 'Bi-Annual Reports' && (
          <View style={styles.card}>
            <View style={styles.biAnnualControls}>
              <FilterDropdown
                label="Select a student"
                value={biAnnualStudent || 'Select a student (required)'}
                options={STUDENTS}
                onChange={(value) => {
                  setBiAnnualStudent(value);
                  setBiAnnualGenerated(false);
                }}
              />

              <TouchableOpacity
                style={styles.generateBtn}
                onPress={handleGenerateBiAnnual}
              >
                <Feather
                  name="file-text"
                  size={14}
                  color={colors.navyText}
                />
                <Text style={styles.generateBtnText}>
                  Generate Bi-Annual Report
                </Text>
              </TouchableOpacity>
            </View>

            {!biAnnualGenerated ? (
              <View style={styles.emptyState}>
                <Feather
                  name="file-text"
                  size={34}
                  color={colors.mutedText}
                />
                <Text style={typography.h3}>
                  No Bi-Annual Report Generated
                </Text>
                <Text style={styles.subHeader}>
                  Select a student and click Generate Bi-Annual Report.
                </Text>
              </View>
            ) : (
              <View style={styles.biAnnualContainer}>
                <View style={styles.biAnnualHeader}>
                  <Text style={typography.h2}>
                    Bi-Annual Report — {selectedBiAnnualLabel}
                  </Text>
                  <Text style={styles.metaText}>
                    Assessment Period: Jan–Jun 2026
                  </Text>
                </View>

                <View style={styles.biAnnualGrid}>
                  <View style={styles.column}>
                    <Text style={styles.sectionHeader}>STUDENT INFO</Text>
                    <InfoLine label="Name" value={selectedBiAnnualLabel} />
                    <InfoLine
                      label="ID"
                      value={`STU-${selectedBiAnnualLabel
                        .replace('Student ', '')
                        .toUpperCase()}001`}
                    />
                    <InfoLine label="Program" value="ABA Intensive" />
                    <InfoLine label="Primary Teacher" value="Teacher A" />

                    <Text
                      style={[
                        styles.sectionHeader,
                        { marginTop: spacing.md },
                      ]}
                    >
                      SKILLS SUMMARY
                    </Text>
                    <InfoLine label="Goals Active" value="5" />
                    <InfoLine label="Goals Mastered" value="2" />
                    <InfoLine label="Avg Independence" value="74%" />
                    <InfoLine
                      label="Skill Domains"
                      value="Cognitive, Social, Language"
                    />
                  </View>

                  <View style={styles.column}>
                    <Text style={styles.sectionHeader}>ASSESSMENT PERIOD</Text>
                    <InfoLine label="Start" value="January 1, 2026" />
                    <InfoLine label="End" value="June 30, 2026" />
                    <InfoLine label="Total Sessions" value="84" />
                    <InfoLine label="Total Trials" value="2,016" />

                    <Text
                      style={[
                        styles.sectionHeader,
                        { marginTop: spacing.md },
                      ]}
                    >
                      BEHAVIOR SUMMARY
                    </Text>
                    <InfoLine label="Total Incidents" value="7" />
                    <InfoLine label="Most Common" value="Elopement" />
                    <InfoLine label="Trend" value="Decreasing" />
                    <InfoLine label="Protocols Active" value="2" />
                  </View>
                </View>

                <View style={styles.biAnnualGrid}>
                  <View style={styles.column}>
                    <Text style={styles.sectionHeader}>GOAL PROGRESS</Text>
                    {[
                      { name: 'Identify Colors', pct: 88 },
                      { name: 'Eye Contact', pct: 72 },
                      { name: 'Turn Taking', pct: 85 },
                    ].map((goal) => (
                      <View key={goal.name} style={styles.progressRow}>
                        <Text style={styles.goalName}>{goal.name}</Text>
                        <View style={styles.progressBarTrack}>
                          <View
                            style={[
                              styles.progressBarFill,
                              { width: `${goal.pct}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.goalPct}>{goal.pct}%</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.column}>
                    <Text style={styles.sectionHeader}>RECOMMENDATIONS</Text>
                    <Text style={styles.bulletItem}>
                      • Continue discrete trial training for language goals
                    </Text>
                    <Text style={styles.bulletItem}>
                      • Introduce natural environment teaching for social goals
                    </Text>
                    <Text style={styles.bulletItem}>
                      • Review behavior support plan for elopement
                    </Text>
                    <Text style={styles.bulletItem}>
                      • Schedule family training session this quarter
                    </Text>
                  </View>
                </View>

                <View style={styles.reportActions}>
                  <TouchableOpacity
                    style={styles.outlineAction}
                    onPress={() =>
                      handleExportPDF(
                        `Bi-Annual Report - ${selectedBiAnnualLabel}`,
                      )
                    }
                  >
                    <Feather
                      name="eye"
                      size={14}
                      color={colors.primaryBlue}
                    />
                    <Text style={styles.outlineActionText}>Preview PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.outlineAction}
                    onPress={() =>
                      handleExportPDF(
                        `Bi-Annual Report - ${selectedBiAnnualLabel}`,
                      )
                    }
                  >
                    <Feather
                      name="download"
                      size={14}
                      color={colors.navyText}
                    />
                    <Text style={styles.actionBtnText}>Download PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.generateBtn}
                    onPress={() =>
                      Alert.alert(
                        'Email to Parent',
                        'Report sent to parent via communication module.',
                      )
                    }
                  >
                    <Feather
                      name="mail"
                      size={14}
                      color={colors.navyText}
                    />
                    <Text style={styles.generateBtnText}>Email to Parent</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'Student Progress' && (
          <View style={styles.progressContainer}>
            <View style={styles.studentSelectorRow}>
              <FilterDropdown
                label="Select a student"
                value={progressStudent || 'Select a student (required)'}
                options={STUDENTS}
                onChange={setProgressStudent}
              />
            </View>

            {!progressStudent ? (
              <View style={styles.emptyStateCard}>
                <Feather
                  name="trending-up"
                  size={38}
                  color={colors.border}
                />
                <Text style={styles.emptyText}>
                  Select a student above to view their progress data.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.card}>
                  <View style={styles.chartHeader}>
                    <Text style={typography.h3}>Goal Progress — 8 Weeks</Text>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() =>
                        handleExportPDF('Student Progress Chart')
                      }
                    >
                      <Feather
                        name="download"
                        size={12}
                        color={colors.navyText}
                      />
                      <Text style={styles.secondaryBtnText}>
                        Download Chart
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <ProgressChart />

                  <View style={styles.legendRow}>
                    <LegendItem
                      color={colors.primaryBlue}
                      label="Identify Colors"
                    />
                    <LegendItem
                      color={colors.primaryYellow}
                      label="Eye Contact"
                    />
                    <LegendItem
                      color={colors.successGreen}
                      label="Turn Taking"
                    />
                  </View>
                </View>

                <StudentProgressTable />
              </>
            )}
          </View>
        )}

        {activeTab === 'Foundation Overview' && overview && (
          <View style={styles.overviewContainer}>
            <View style={styles.kpiGrid}>
              <KpiCard
                label="Total Sessions This Month"
                value="48"
                valueColor={colors.primaryBlue}
              />
              <KpiCard
                label="Total Trials Logged"
                value="1,240"
                valueColor={colors.primaryYellow}
              />
              <KpiCard
                label="Average Independence Rate"
                value="67%"
                valueColor={colors.successGreen}
              />
              <KpiCard
                label="Goals Mastered This Month"
                value="8"
                valueColor={colors.purple}
              />
            </View>

            <View style={styles.card}>
              <View style={styles.chartHeader}>
                <Text style={typography.h3}>
                  Sessions per Teacher per Week
                </Text>
                <Text style={styles.chartHint}>
                  Tap a week to view details
                </Text>
              </View>

              <FoundationBarChart />

              {activeOverviewWeek && (
                <View style={styles.overviewTooltip}>
                  <Text style={styles.tooltipTitle}>{activeOverviewWeek}</Text>
                  {(() => {
                    const item =
                      SESSIONS_PER_TEACHER_WEEK.find(
                        (week) => week.week === activeOverviewWeek,
                      ) || SESSIONS_PER_TEACHER_WEEK[0];

                    return (
                      <>
                        <Text
                          style={[
                            styles.tooltipItem,
                            { color: colors.primaryBlue },
                          ]}
                        >
                          Teacher A: {item.teacherA}
                        </Text>
                        <Text
                          style={[
                            styles.tooltipItem,
                            { color: colors.primaryYellow },
                          ]}
                        >
                          Teacher B: {item.teacherB}
                        </Text>
                        <Text
                          style={[
                            styles.tooltipItem,
                            { color: colors.successGreen },
                          ]}
                        >
                          Teacher C: {item.teacherC}
                        </Text>
                      </>
                    );
                  })()}
                </View>
              )}

              <View style={styles.weekSelectorRow}>
                {SESSIONS_PER_TEACHER_WEEK.map((item) => (
                  <TouchableOpacity
                    key={item.week}
                    style={[
                      styles.weekSelector,
                      activeOverviewWeek === item.week &&
                        styles.weekSelectorActive,
                    ]}
                    onPress={() => setActiveOverviewWeek(item.week)}
                  >
                    <Text
                      style={[
                        styles.weekSelectorText,
                        activeOverviewWeek === item.week &&
                          styles.weekSelectorTextActive,
                      ]}
                    >
                      {item.week}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.legendRow}>
                <LegendItem color={colors.primaryBlue} label="Teacher A" square />
                <LegendItem
                  color={colors.primaryYellow}
                  label="Teacher B"
                  square
                />
                <LegendItem
                  color={colors.successGreen}
                  label="Teacher C"
                  square
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={typography.h3}>Student Status Breakdown</Text>

              <View style={styles.statusBreakdownRow}>
                <StatusMetric
                  count={overview.activeCount ?? 2}
                  label="Active"
                  color={colors.successGreen}
                />
                <StatusMetric
                  count={overview.inAssessmentCount ?? 1}
                  label="In Assessment"
                  color={colors.primaryYellow}
                />
                <StatusMetric
                  count={overview.masteredCount ?? 1}
                  label="Mastered"
                  color={colors.primaryBlue}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.exportBar}>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={() => handleExportPDF('Foundation Overview')}
        >
          <Feather
            name="download"
            size={14}
            color={colors.navyText}
          />
          <Text style={styles.exportBtnText}>Export PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
          <Feather
            name="file-text"
            size={14}
            color={colors.navyText}
          />
          <Text style={styles.exportBtnText}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      <SessionDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />

      <ExportPreviewModal
        visible={!!exportModalContent}
        title={exportModalTitle}
        filename={`${exportModalTitle.replace(/\s+/g, '_')}_${new Date()
          .toISOString()
          .slice(0, 10)}.txt`}
        content={exportModalContent ?? ''}
        onClose={() => setExportModalContent(null)}
      />
    </SafeAreaView>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <Text style={styles.infoText}>
      {label}: <Text style={styles.bold}>{value}</Text>
    </Text>
  );
}

function LegendItem({
  color,
  label,
  square = false,
}: {
  color: string;
  label: string;
  square?: boolean;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          square ? styles.legendBox : styles.legendDot,
          { backgroundColor: color },
        ]}
      />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function KpiCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function StatusMetric({
  count,
  label,
  color,
}: {
  count: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statusMetric}>
      <View style={styles.metricHeader}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={styles.statusCount}>{count}</Text>
      </View>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bgCard,
  },

  subHeader: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },

  tabsRow: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  tabsContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },

  tabActive: {
    borderBottomColor: colors.primaryBlue,
  },

  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedText,
  },

  tabTextActive: {
    color: colors.primaryBlue,
  },

  globalFilterWrapper: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  filterGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },

  dropdownBtn: {
    minWidth: 125,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    backgroundColor: colors.bgCard,
  },

  dropdownText: {
    flex: 1,
    fontSize: 12,
    color: colors.navyText,
  },

  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  dropdownMenu: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },

  dropdownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },

  dropdownOption: {
    minHeight: 42,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dropdownOptionActive: {
    backgroundColor: colors.bgApp,
  },

  dropdownOptionText: {
    fontSize: 13,
    color: colors.navyText,
  },

  dropdownOptionTextActive: {
    color: colors.primaryBlue,
    fontWeight: '700',
  },

  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  dateLabel: {
    fontSize: 11,
    color: colors.mutedText,
  },

  dateInput: {
    width: 92,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: 7,
    fontSize: 11,
    color: colors.navyText,
    backgroundColor: colors.bgCard,
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: 100,
    gap: spacing.lg,
  },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  sessionTable: {
    minWidth: 975,
  },

  tableHeaderRow: {
    backgroundColor: colors.bgApp,
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  tableHeadCell: {
    paddingHorizontal: spacing.sm,
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
  },

  tableCell: {
    paddingHorizontal: spacing.sm,
    fontSize: 12,
    color: colors.navyText,
  },

  tableCellView: {
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },

  primaryText: {
    color: colors.primaryBlue,
    fontWeight: '700',
  },

  mutedText: {
    color: colors.mutedText,
  },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },

  badgeSuccess: {
    backgroundColor: '#E6F4EA',
  },

  badgeWarning: {
    backgroundColor: '#FEF7E0',
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  badgeSuccessText: {
    color: colors.successGreen,
  },

  badgeWarningText: {
    color: colors.primaryYellowDark,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },

  actionBtnText: {
    fontSize: 10,
    color: colors.navyText,
    fontWeight: '600',
  },

  emptyTableState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },

  emptyTitle: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },

  emptyText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.mutedText,
    textAlign: 'center',
  },

  biAnnualControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  generateBtn: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },

  generateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },

  biAnnualContainer: {
    gap: spacing.lg,
  },

  biAnnualHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },

  metaText: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },

  biAnnualGrid: {
    flexDirection: 'row',
    gap: spacing.xl,
    flexWrap: 'wrap',
  },

  column: {
    flex: 1,
    minWidth: 260,
    gap: 4,
  },

  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    marginBottom: spacing.xs,
  },

  infoText: {
    fontSize: 12,
    color: colors.mutedText,
  },

  bold: {
    color: colors.navyText,
    fontWeight: '600',
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: 3,
  },

  goalName: {
    width: 105,
    fontSize: 11,
    color: colors.navyText,
  },

  progressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.bgApp,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryBlue,
    borderRadius: radius.pill,
  },

  goalPct: {
    width: 36,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '700',
    color: colors.navyText,
  },

  bulletItem: {
    fontSize: 12,
    color: colors.navyText,
    marginVertical: 2,
    lineHeight: 18,
  },

  reportActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },

  outlineAction: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  outlineActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryBlue,
  },

  progressContainer: {
    gap: spacing.lg,
  },

  studentSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  emptyStateCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  chartHint: {
    fontSize: 10,
    color: colors.mutedText,
  },

  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },

  secondaryBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.navyText,
  },

  lineChartArea: {
    flexDirection: 'row',
    height: 220,
    marginTop: spacing.md,
  },

  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 4,
    paddingRight: spacing.xs,
  },

  axisLabel: {
    fontSize: 9,
    color: colors.mutedText,
  },

  chartCanvas: {
    flex: 1,
    position: 'relative',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },

  chartGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.7,
  },

  chartPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    zIndex: 3,
  },

  chartSegment: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
    zIndex: 2,
  },

  xAxis: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -22,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginTop: spacing.xl,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },

  legendText: {
    fontSize: 11,
    color: colors.mutedText,
  },

  tableCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  tableSectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  goalsTable: {
    minWidth: 700,
  },

  goalsHeader: {
    backgroundColor: colors.bgApp,
  },

  goalsRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  goalCell: {
    paddingHorizontal: spacing.md,
    fontSize: 12,
  },

  goalHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
  },

  goalCol1: {
    width: 190,
  },

  goalCol2: {
    width: 130,
  },

  goalCol3: {
    width: 100,
  },

  goalCol4: {
    width: 100,
  },

  goalCol5: {
    width: 150,
  },

  goalText: {
    color: colors.navyText,
  },

  goalStrong: {
    fontWeight: '700',
  },

  trendUp: {
    color: colors.successGreen,
  },

  goalStatusBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
  },

  goalStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  goalMastered: {
    backgroundColor: '#E6F4EA',
    borderColor: '#C6E6CE',
  },

  goalMasteredText: {
    color: colors.successGreen,
  },

  goalInProgress: {
    backgroundColor: '#EFF8FF',
    borderColor: '#CDEBFF',
  },

  goalInProgressText: {
    color: colors.primaryBlue,
  },

  overviewContainer: {
    gap: spacing.lg,
  },

  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },

  kpiCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  kpiLabel: {
    fontSize: 11,
    color: colors.mutedText,
    lineHeight: 16,
  },

  kpiValue: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: spacing.xs,
  },

  foundationChart: {
    flexDirection: 'row',
    height: 240,
    marginTop: spacing.md,
  },

  foundationYAxis: {
    width: 28,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 4,
    paddingRight: spacing.xs,
  },

  foundationBarsArea: {
    flex: 1,
    position: 'relative',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  foundationGridLines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },

  foundationGridLine: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
  },

  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
  },

  weekBarGroup: {
    flex: 1,
    maxWidth: 100,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },

  weekBar: {
    width: 34,
    height: '100%',
    justifyContent: 'flex-end',
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.bgApp,
  },

  barSegment: {
    width: '100%',
  },

  barLabel: {
    fontSize: 10,
    color: colors.mutedText,
    marginTop: spacing.xs,
    marginBottom: 2,
  },

  overviewTooltip: {
    alignSelf: 'center',
    minWidth: 130,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },

  tooltipTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navyText,
    marginBottom: 3,
  },

  tooltipItem: {
    fontSize: 10,
    fontWeight: '600',
    marginVertical: 1,
  },

  weekSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },

  weekSelector: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },

  weekSelectorActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },

  weekSelectorText: {
    fontSize: 10,
    color: colors.mutedText,
  },

  weekSelectorTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  statusBreakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
    marginTop: spacing.md,
  },

  statusMetric: {
    minWidth: 100,
    gap: 2,
  },

  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statusCount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navyText,
  },

  statusLabel: {
    fontSize: 11,
    color: colors.mutedText,
  },

  exportBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
    gap: spacing.sm,
  },

  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
  },

  exportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  modalCard: {
    backgroundColor: colors.bgCard,
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    borderRadius: radius.lg,
    padding: spacing.lg,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  closeIconBtn: {
    padding: spacing.xs,
  },

  modalScroll: {
    flexGrow: 0,
  },

  modalBody: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },

  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },

  detailCol: {
    width: '45%',
    minWidth: 130,
  },

  detailColWide: {
    width: '100%',
  },

  detailLabel: {
    fontSize: 10,
    color: colors.mutedText,
    marginBottom: 2,
  },

  detailVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },

  summaryBox: {
    backgroundColor: colors.bgApp,
    padding: spacing.md,
    borderRadius: radius.md,
  },

  summaryTitle: {
    fontSize: 10,
    color: colors.mutedText,
    marginBottom: 4,
  },

  summaryText: {
    fontSize: 11,
    color: colors.navyText,
    lineHeight: 17,
  },

  closeBtn: {
    backgroundColor: colors.bgApp,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  closeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
});