
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert, Share } from 'react-native';
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

const PROGRAMS = ['ABA', 'Speech Therapy', 'Occupational Therapy'];
const PERIODS = ['Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec'];
const SCORE_FILTERS = ['All', '>50%', '>70%'];
const GOAL_STATUSES = ['All', 'On Track', 'Needs Support'];
const BEHAVIOR_TYPES = ['All', 'Tantrums', 'Aggression', 'Self-Injury', 'Elopement', 'Non-Compliance'];
const DIAGNOSES = ['All', 'Autism Spectrum', 'Speech Delay', 'Motor Delay', 'Global Delay'];

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

type Props = NativeStackScreenProps<DirectorStackParamList, 'ReportBuilder'>;

export default function ReportBuilderScreen({ navigation }: Props) {
  const [program, setProgram] = useState('ABA');
  const [therapist, setTherapist] = useState('All');
  const [ageFrom, setAgeFrom] = useState(5);
  const [ageTo, setAgeTo] = useState(8);
  const [attendanceMax, setAttendanceMax] = useState(80);
  const [period, setPeriod] = useState(PERIODS[0]);
  const [studentSearch, setStudentSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState('All');
  const [goalStatus, setGoalStatus] = useState('All');
  const [behaviorType, setBehaviorType] = useState('All');
  const [diagnosis, setDiagnosis] = useState('All');
  const [results, setResults] = useState<ReportRow[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [exportContent, setExportContent] = useState<string | null>(null);
  const [therapists, setTherapists] = useState<string[]>([]);

  useEffect(() => {
    getStaffOptions()
      .then(({ data: opts }) => setTherapists(opts.filter((t) => t.role === 'teacher').map((t) => t.name)))
      .catch(() => setTherapists([]));
  }, []);

  const Chip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  const Step = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.stepBtn}>
      <Text style={typography.label}>{label}</Text>
      <Text style={typography.bodyBold}>{value}</Text>
    </View>
  );

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await generateCustomReport({ program, therapist, ageFrom, ageTo, attendanceMax, period, studentSearch, scoreFilter, goalStatus, behaviorType, diagnosis });
      setResults(data);
    } catch (err) {
      setResults([]);
    }
    setGenerating(false);
  };

  const buildCsv = (): string => {
    if (!results) return '';
    const header = ['Name', 'Age', 'Program', 'Therapist', 'Attendance %', 'Assessment %', 'Goal Status', 'Behavior Type', 'Diagnosis'];
    const rows = results.map((r) => [r.name, r.age, r.program, r.therapist, r.attendance, r.assessmentScore, r.goalStatus, r.behaviorType, r.diagnosis]);
    return [header, ...rows].map((row) => row.join(',')).join('\n');
  };

  const buildReportText = (): string => {
    if (!results) return '';
    const lines: string[] = [];
    lines.push('CUSTOM STUDENT REPORT — MELUE FOUNDATION');
    lines.push(`Generated: ${new Date().toLocaleDateString()}`);
    lines.push(`Filters: ${program} · ${therapist} · Ages ${ageFrom}–${ageTo} · Attendance < ${attendanceMax}% · ${period}`);
    lines.push(`Assessment: ${scoreFilter} · Goal: ${goalStatus} · Behavior: ${behaviorType} · Diagnosis: ${diagnosis}`);
    lines.push('');
    lines.push('Name | Age | Program | Therapist | Attendance % | Assessment % | Goal Status | Behavior Type | Diagnosis');
    lines.push('---');
    results.forEach((r) => {
      lines.push(`${r.name} | ${r.age} | ${r.program} | ${r.therapist} | ${r.attendance} | ${r.assessmentScore} | ${r.goalStatus} | ${r.behaviorType} | ${r.diagnosis}`);
    });
    lines.push('---');
    lines.push(`${results.length} student(s) matched.`);
    return lines.join('\n');
  };

  const handleExport = async (format: string) => {
    if (!results || results.length === 0) { Alert.alert('Nothing to export', 'Generate a report first.'); return; }
    if (format === 'CSV') {
      const csv = buildCsv();
      try {
        await Share.share({ title: 'Student report export', message: csv });
      } catch (err) {
        Alert.alert('CSV Export', 'Sharing is not available here. The report data is ready in memory for a file-service endpoint.');
      }
      return;
    }
    setExportContent(buildReportText());
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Builder" onTabPress={(t) => t !== 'Builder' && navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t])} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="filter" size={18} color={colors.navyText} />
          <View>
            <Text style={typography.h1}>Report Builder</Text>
            <Text style={typography.caption}>MR-46 — build a custom student report</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={typography.h3}>Filters</Text>
          <View style={styles.field}><Text style={typography.label}>Program</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{PROGRAMS.map((p) => <Chip key={p} label={p} selected={program === p} onPress={() => setProgram(p)} />)}</ScrollView></View>
          <View style={styles.field}><Text style={typography.label}>Therapist</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{['All', ...therapists].map((t) => <Chip key={t} label={t} selected={therapist === t} onPress={() => setTherapist(t)} />)}</ScrollView></View>
          <View style={styles.field}><Text style={typography.label}>Age range</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{[3, 4, 5, 6, 7, 8, 9, 10].map((a) => <Chip key={a} label={`${a}`} selected={a === ageFrom} onPress={() => setAgeFrom(a)} />)}<Text style={styles.midDash}>to</Text>{[3, 4, 5, 6, 7, 8, 9, 10].map((a) => <Chip key={a} label={`${a}`} selected={a === ageTo} onPress={() => setAgeTo(a)} />)}</ScrollView></View>
          <View style={styles.field}><Text style={typography.label}>Attendance below</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{[70, 75, 80, 85, 90].map((v) => <Chip key={v} label={`<${v}%`} selected={attendanceMax === v} onPress={() => setAttendanceMax(v)} />)}</ScrollView></View>
          <View style={styles.field}><Text style={typography.label}>Date range</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{PERIODS.map((p) => <Chip key={p} label={p} selected={period === p} onPress={() => setPeriod(p)} />)}</ScrollView></View>
          <View style={styles.field}>
            <Text style={typography.label}>Student</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by student name..."
              placeholderTextColor={colors.mutedText}
              value={studentSearch}
              onChangeText={setStudentSearch}
            />
          </View>
          <View style={styles.field}><Text style={typography.label}>Assessment score</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{SCORE_FILTERS.map((v) => <Chip key={v} label={v} selected={scoreFilter === v} onPress={() => setScoreFilter(v)} />)}</ScrollView></View>
          <View style={styles.field}><Text style={typography.label}>Goal status</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{GOAL_STATUSES.map((v) => <Chip key={v} label={v} selected={goalStatus === v} onPress={() => setGoalStatus(v)} />)}</ScrollView></View>
          <View style={styles.field}><Text style={typography.label}>Behavior type</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{BEHAVIOR_TYPES.map((v) => <Chip key={v} label={v} selected={behaviorType === v} onPress={() => setBehaviorType(v)} />)}</ScrollView></View>
          <View style={styles.field}><Text style={typography.label}>Diagnosis</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{DIAGNOSES.map((v) => <Chip key={v} label={v} selected={diagnosis === v} onPress={() => setDiagnosis(v)} />)}</ScrollView></View>

          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={generating}>
            <Feather name="play" size={16} color={colors.navyText} />
            <Text style={styles.generateBtnText}>{generating ? 'Generating...' : 'Generate Report'}</Text>
          </TouchableOpacity>
        </View>

        {results && (
          <View style={styles.card}>
            <View style={styles.resultHeader}>
              <Text style={typography.h3}>Results · {results.length} students</Text>
              <View style={styles.exportRow}>
                <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('CSV')}><Feather name="download" size={14} color={colors.navyText} /><Text style={styles.exportBtnText}>CSV</Text></TouchableOpacity>
                <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('PDF')}><Feather name="file-text" size={14} color={colors.navyText} /><Text style={styles.exportBtnText}>PDF</Text></TouchableOpacity>
                <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('Excel')}><Feather name="file-text" size={14} color={colors.navyText} /><Text style={styles.exportBtnText}>Excel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('Print')}><Feather name="printer" size={14} color={colors.navyText} /><Text style={styles.exportBtnText}>Print</Text></TouchableOpacity>
              </View>
            </View>
            {results.map((r) => (
              <View key={r.id} style={styles.resultRow}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.bodyBold}>{r.name}</Text>
                  <Text style={typography.caption}>Age {r.age} · {r.program} · {r.therapist}</Text>
                  <Text style={typography.caption}>Attendance {r.attendance}% · Assessment {r.assessmentScore}% · {r.diagnosis} · {r.behaviorType}</Text>
                </View>
                <StatusPill status={r.goalStatus === 'On Track' ? 'approved' : 'pending'} label={r.goalStatus} />
              </View>
            ))}
            {results.length === 0 && <Text style={[typography.body, { color: colors.mutedText }]}>No students match these filters.</Text>}
          </View>
        )}

        <Step label="Tip" value="Only students in the selected program, age range, and below the attendance threshold are included." />
      </ScrollView>

      <ExportPreviewModal
        visible={!!exportContent}
        title="Custom Student Report"
        filename={`CustomReport_${new Date().toISOString().slice(0, 10)}.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  field: { gap: spacing.sm },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.bgApp, color: colors.navyText },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.xs, backgroundColor: colors.bgApp },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  chipTextSelected: { color: colors.navyText },
  midDash: { alignSelf: 'center', marginHorizontal: spacing.sm, color: colors.mutedText },
  generateBtn: { flexDirection: 'row', gap: spacing.xs, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  generateBtnText: { fontWeight: '700', color: colors.navyText },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  exportRow: { flexDirection: 'row', gap: spacing.sm },
  exportBtn: { flexDirection: 'row', gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, alignItems: 'center' },
  exportBtnText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  stepBtn: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
});
