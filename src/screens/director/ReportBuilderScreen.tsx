
// screens/director/ReportBuilderScreen.tsx
// SCR-DIR-007: Custom Report Builder (Director View)

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import StatusPill from '../../components/StatusPill';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { generateCustomReport } from '../../api/directorApi';
import { getStaffOptions } from '../../api/optionsApi';
import type { DirectorStackParamList } from '../../types';

const PROGRAMS = ['All Programs', 'ABA', 'Speech Therapy', 'Occupational Therapy'];
const PERIODS = ['All Periods', 'Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec'];
const SCORE_FILTERS = ['All Scores', '>50%', '>70%', '>90%'];
const GOAL_STATUSES = ['All Statuses', 'On Track', 'Needs Support', 'Mastered'];
const BEHAVIOR_TYPES = ['All Types', 'Tantrums', 'Aggression', 'Self-Injury', 'Elopement', 'Non-Compliance'];
const DIAGNOSES = ['All Diagnoses', 'Autism Spectrum', 'Speech Delay', 'Motor Delay', 'Global Delay'];
const ATTENDANCE_OPTIONS = ['All', '<70%', '<75%', '<80%', '<85%', '<90%'];
const AGE_OPTIONS = ['All', '3–5 yrs', '6–8 yrs', '9–12 yrs', '13+ yrs'];

interface ReportRow {
  id: string;
  name: string;
  age: number;
  program: string;
  therapist: string;
  attendance: number;
  assessmentScore: number;
  goalStatus: 'On Track' | 'Needs Support';
  behaviorType: string;
  diagnosis: string;
}

function DropdownPickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.pickerModalCard}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>Select {title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={18} color={colors.navyText} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 280 }}>
            {options.map((opt) => {
              const isSelected = opt === selected;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                  onPress={() => {
                    onSelect(opt);
                    onClose();
                  }}
                >
                  <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                    {opt}
                  </Text>
                  {isSelected && <Feather name="check" size={16} color={colors.navyText} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function ReportBuilderScreen({
  navigation,
}: NativeStackScreenProps<DirectorStackParamList, 'ReportBuilder'>) {
  const [program, setProgram] = useState(PROGRAMS[0]);
  const [therapist, setTherapist] = useState('All Staff');
  const [ageRange, setAgeRange] = useState(AGE_OPTIONS[0]);
  const [attendanceFilter, setAttendanceFilter] = useState(ATTENDANCE_OPTIONS[0]);
  const [period, setPeriod] = useState(PERIODS[0]);
  const [studentSearch, setStudentSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState(SCORE_FILTERS[0]);
  const [goalStatus, setGoalStatus] = useState(GOAL_STATUSES[0]);
  const [behaviorType, setBehaviorType] = useState(BEHAVIOR_TYPES[0]);
  const [diagnosis, setDiagnosis] = useState(DIAGNOSES[0]);

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
        setTherapists(['All Staff', ...opts.filter((t) => t.role === 'teacher').map((t) => t.name)])
      )
      .catch(() => setTherapists(['All Staff']));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const progParam = program === 'All Programs' ? 'ABA' : program;
      const { data } = await generateCustomReport({
        program: progParam,
        therapist: therapist === 'All Staff' ? 'All' : therapist,
        period: period === 'All Periods' ? 'Jan–Mar' : period,
        studentSearch,
        scoreFilter: scoreFilter === 'All Scores' ? 'All' : scoreFilter,
        goalStatus: goalStatus === 'All Statuses' ? 'All' : goalStatus,
        behaviorType: behaviorType === 'All Types' ? 'All' : behaviorType,
        diagnosis: diagnosis === 'All Diagnoses' ? 'All' : diagnosis,
      });
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    }
    setGenerating(false);
  };

  const buildCsv = (): string => {
    if (!results) return '';
    const header = [
      'Name',
      'Age',
      'Program',
      'Therapist',
      'Attendance %',
      'Assessment %',
      'Goal Status',
      'Behavior Type',
      'Diagnosis',
    ];
    const rows = results.map((r) => [
      r.name,
      r.age,
      r.program,
      r.therapist,
      r.attendance,
      r.assessmentScore,
      r.goalStatus,
      r.behaviorType,
      r.diagnosis,
    ]);
    return [header, ...rows].map((row) => row.join(',')).join('\n');
  };

  const buildReportText = (): string => {
    if (!results) return '';
    const lines = [
      '================================================================',
      '         MELU\'E FOUNDATION — CUSTOM REPORT BUILDER              ',
      '================================================================',
      `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      `FILTERS: Program: ${program} | Therapist: ${therapist} | Period: ${period}`,
      `CRITERIA: Diagnosis: ${diagnosis} | Score: ${scoreFilter} | Goal: ${goalStatus}`,
      '----------------------------------------------------------------',
      '',
      'MATCHED STUDENT RECORDS:',
      ...results.map(
        (r, i) =>
          `  ${i + 1}. ${r.name} (Age ${r.age}) | Program: ${r.program} | Therapist: ${r.therapist}\n     Attendance: ${r.attendance}% | Assessment: ${r.assessmentScore}% | Goal Status: ${r.goalStatus}\n     Diagnosis: ${r.diagnosis} | Primary Behavior: ${r.behaviorType}`
      ),
      '',
      '----------------------------------------------------------------',
      `TOTAL MATCHED STUDENTS: ${results.length}`,
      '================================================================',
    ];
    return lines.join('\n');
  };

  const handleExport = (format: string) => {
    if (!results || results.length === 0) {
      Alert.alert('Generate Report First', 'Please generate report results before exporting.');
      return;
    }
    if (format === 'CSV') {
      setExportContent(buildCsv());
      return;
    }
    setExportContent(buildReportText());
  };

  const FilterSelectButton = ({
    label,
    value,
    options,
    onSelect,
  }: {
    label: string;
    value: string;
    options: string[];
    onSelect: (v: string) => void;
  }) => (
    <View style={styles.filterCol}>
      <Text style={styles.filterLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.selectDropdown}
        onPress={() =>
          setActivePicker({
            title: label,
            options,
            selected: value,
            onSelect,
          })
        }
      >
        <Text style={styles.selectDropdownText} numberOfLines={1}>
          {value}
        </Text>
        <Feather name="chevron-down" size={14} color={colors.bodyText} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Builder"
        onTabPress={(t) => t !== 'Builder' && navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t])}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeIcon}>
              <Feather name="filter" size={20} color={colors.navyText} />
            </View>
            <View>
              <Text style={styles.pageTitle}>Custom Report Builder</Text>
              <Text style={styles.pageSubtitle}>
                Build, filter, analyze, and export customized student clinical data
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Configuration Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Report Criteria & Filter Parameters</Text>

          {/* Row 1 */}
          <View style={styles.filterGrid}>
            <FilterSelectButton
              label="Therapy Program"
              value={program}
              options={PROGRAMS}
              onSelect={setProgram}
            />
            <FilterSelectButton
              label="Assigned Therapist"
              value={therapist}
              options={therapists}
              onSelect={setTherapist}
            />
          </View>

          {/* Row 2 */}
          <View style={styles.filterGrid}>
            <FilterSelectButton
              label="Age Bracket"
              value={ageRange}
              options={AGE_OPTIONS}
              onSelect={setAgeRange}
            />
            <FilterSelectButton
              label="Attendance Threshold"
              value={attendanceFilter}
              options={ATTENDANCE_OPTIONS}
              onSelect={setAttendanceFilter}
            />
          </View>

          {/* Row 3 */}
          <View style={styles.filterGrid}>
            <FilterSelectButton
              label="Reporting Period"
              value={period}
              options={PERIODS}
              onSelect={setPeriod}
            />
            <FilterSelectButton
              label="Clinical Diagnosis"
              value={diagnosis}
              options={DIAGNOSES}
              onSelect={setDiagnosis}
            />
          </View>

          {/* Row 4 */}
          <View style={styles.filterGrid}>
            <FilterSelectButton
              label="Assessment Score"
              value={scoreFilter}
              options={SCORE_FILTERS}
              onSelect={setScoreFilter}
            />
            <FilterSelectButton
              label="Goal Progress Status"
              value={goalStatus}
              options={GOAL_STATUSES}
              onSelect={setGoalStatus}
            />
          </View>

          {/* Row 5 */}
          <View style={styles.filterGrid}>
            <FilterSelectButton
              label="Target Behavior Category"
              value={behaviorType}
              options={BEHAVIOR_TYPES}
              onSelect={setBehaviorType}
            />
            <View style={styles.filterCol}>
              <Text style={styles.filterLabel}>Student Name Search</Text>
              <View style={styles.searchWrap}>
                <Feather name="search" size={14} color={colors.mutedText} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Optional student name..."
                  placeholderTextColor={colors.mutedText}
                  value={studentSearch}
                  onChangeText={setStudentSearch}
                />
              </View>
            </View>
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            style={styles.generateBtn}
            onPress={handleGenerate}
            disabled={generating}
          >
            <Feather name="play" size={16} color={colors.navyText} />
            <Text style={styles.generateBtnText}>
              {generating ? 'Generating Custom Report...' : 'Generate Report Results'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {results !== null && (
          <View style={styles.card}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.cardTitle}>Report Results</Text>
                <Text style={styles.resultSubtitle}>{results.length} Student Record(s) Matched</Text>
              </View>
              <View style={styles.exportRow}>
                <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('CSV')}>
                  <Feather name="download" size={13} color={colors.navyText} />
                  <Text style={styles.exportBtnText}>CSV</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('TXT')}>
                  <Feather name="file-text" size={13} color={colors.navyText} />
                  <Text style={styles.exportBtnText}>Document</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('PRINT')}>
                  <Feather name="printer" size={13} color={colors.navyText} />
                  <Text style={styles.exportBtnText}>Print / PDF</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Results Table */}
            <View style={styles.table}>
              {results.map((r) => (
                <View key={r.id} style={styles.resultRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.studentTitleRow}>
                      <Text style={styles.studentName}>{r.name}</Text>
                      <Text style={styles.studentMeta}>Age {r.age} · {r.program}</Text>
                    </View>
                    <Text style={styles.studentSubMeta}>
                      Therapist: {r.therapist} · Diagnosis: {r.diagnosis} · Behavior: {r.behaviorType}
                    </Text>
                    <View style={styles.metricRow}>
                      <Text style={styles.metricText}>Attendance: {r.attendance}%</Text>
                      <Text style={styles.metricText}>Assessment: {r.assessmentScore}%</Text>
                    </View>
                  </View>
                  <StatusPill
                    status={r.goalStatus === 'On Track' ? 'approved' : 'pending'}
                    label={r.goalStatus}
                  />
                </View>
              ))}

              {results.length === 0 && (
                <View style={styles.emptyResults}>
                  <Feather name="info" size={28} color={colors.mutedText} />
                  <Text style={styles.emptyResultsTitle}>No Students Matched</Text>
                  <Text style={styles.emptyResultsSub}>Try adjusting your filter parameters above.</Text>
                </View>
              )}
            </View>
          </View>
        )}
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
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 50 },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 280 },
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

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText },

  filterGrid: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  filterCol: { flexGrow: 1, minWidth: 220, gap: spacing.xs },
  filterLabel: { fontSize: 12, fontWeight: '600', color: colors.bodyText },

  selectDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.bgApp,
  },
  selectDropdownText: { fontSize: 13, fontWeight: '600', color: colors.navyText, flex: 1, paddingRight: 6 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgApp,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 13, color: colors.navyText },

  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  generateBtnText: { fontSize: 14, fontWeight: '700', color: colors.navyText },

  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
    paddingBottom: spacing.sm,
  },
  resultSubtitle: { fontSize: 12, color: colors.mutedText, marginTop: 2 },
  exportRow: { flexDirection: 'row', gap: spacing.xs },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.bgApp,
  },
  exportBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },

  table: { gap: spacing.xs },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
    gap: spacing.md,
  },
  studentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  studentName: { fontSize: 14, fontWeight: '700', color: colors.navyText },
  studentMeta: { fontSize: 12, color: colors.bodyText },
  studentSubMeta: { fontSize: 11, color: colors.mutedText, marginTop: 2 },
  metricRow: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  metricText: { fontSize: 11, fontWeight: '600', color: colors.bodyText },

  emptyResults: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyResultsTitle: { fontSize: 15, fontWeight: '700', color: colors.navyText },
  emptyResultsSub: { fontSize: 12, color: colors.mutedText },

  /* Dropdown Modal */
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  pickerModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  pickerModalTitle: { fontSize: 15, fontWeight: '700', color: colors.navyText },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  pickerItemActive: { backgroundColor: '#FEF9C3', borderRadius: radius.sm },
  pickerItemText: { fontSize: 13, color: colors.navyText, fontWeight: '500' },
  pickerItemTextActive: { fontWeight: '700' },
});

