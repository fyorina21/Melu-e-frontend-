import React, { useEffect, useState, useCallback } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { downloadTextFile } from '../../utils/webExport';
import { getStudentProgressOverview, flagStudent } from '../../api/coordinatorApi';
import { getStudentOptions } from '../../api/optionsApi';
import type { CoordinatorStackParamList } from '../../types';

interface StudentOption {
  id: string;
  name: string;
}

interface ProgressGoal {
  id: string;
  name: string;
  percent: number;
  status: string;
  trend: number[];
}

interface BehaviorIncident {
  date: string;
  type: string;
  detail: string;
}

interface SessionHistoryEntry {
  id: string;
  date: string;
  teacherName: string;
  bodyPreview: string;
}

interface StudentProgressData {
  studentId: string;
  name: string;
  age: number;
  program: string;
  flagged: boolean;
  assessmentSummary: { skills: string; behavior: string; preferences: string };
  goals: ProgressGoal[];
  incidents: BehaviorIncident[];
  incidentSummary: string;
  sessionHistory: SessionHistoryEntry[];
}

const GOAL_COLORS = ['#059669', '#D97706', '#2563EB', '#9333EA'];

function GoalMiniChart({ goal, color }: { goal: ProgressGoal; color: string }) {
  const max = Math.max(100, ...goal.trend);
  return (
    <View style={styles.miniChartRow}>
      <View style={styles.miniChartBars}>
        {goal.trend.map((v, i) => (
          <View key={i} style={styles.miniChartCol}>
            <View style={[styles.miniChartBar, { backgroundColor: color, height: `${Math.max(6, Math.round((v / max) * 100))}%` }]} />
          </View>
        ))}
      </View>
      <Text style={styles.chartLegend}>{goal.name} — {goal.percent}%</Text>
    </View>
  );
}

function SessionDetailModal({ visible, entry, onClose }: {
  visible: boolean;
  entry: SessionHistoryEntry | null;
  onClose: () => void;
}) {
  if (!entry) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h2}>{entry.date}</Text>
          <Text style={typography.caption}>Teacher: {entry.teacherName}</Text>
          <View style={styles.field}>
            <Text style={typography.label}>Session Summary</Text>
            <Text style={typography.body}>{entry.bodyPreview}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function CoordinatorStudentProgressScreen({ navigation }: NativeStackScreenProps<CoordinatorStackParamList, 'CoordinatorStudentProgress'>) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [data, setData] = useState<StudentProgressData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [notes, setNotes] = useState('');
  const [exportContent, setExportContent] = useState<string | null>(null);
  const [sessionTarget, setSessionTarget] = useState<SessionHistoryEntry | null>(null);

  useEffect(() => {
    getStudentOptions()
      .then(({ data: res }) => {
        setStudentOptions(res);
        setSelectedStudentId((prev) => prev ?? res[0]?.id ?? null);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!selectedStudentId) return;
    try {
      const { data: res } = await getStudentProgressOverview(selectedStudentId);
      setData(res);
      setFlagged(res.flagged);
      setLoadError(false);
    } catch (err) {
      setData(null);
      setFlagged(false);
      setLoadError(true);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleFlag = async () => {
    if (!selectedStudentId) return;
    const next = !flagged;
    setFlagged(next);
    try {
      await flagStudent(selectedStudentId, { flagged: next });
    } catch (err) {}
    if (next) Alert.alert('Student flagged', 'A notification has been created.');
  };

  const handlePrint = () => {
    if (!data) return;
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = [
      '<h1>Melu\'e Foundation</h1>',
      '<h2>Student Progress Report</h2>',
      `<p><strong>Student:</strong> ${esc(data.name)} · Age ${data.age} · ${esc(data.program)}</p>`,
      '<h3>Assessment Summary</h3>',
      `<ul><li>Skills: ${esc(data.assessmentSummary.skills)}</li><li>Behavior: ${esc(data.assessmentSummary.behavior)}</li><li>Preferences: ${esc(data.assessmentSummary.preferences)}</li></ul>`,
      '<h3>Current Goals</h3>',
      `<ul>${data.goals.map((g) => `<li>${esc(g.name)}: ${g.percent}% — ${esc(g.status)}</li>`).join('')}</ul>`,
      '<h3>Behavior Incident Trends</h3>',
      `<p>${esc(data.incidentSummary)}</p>`,
      data.incidents.length
        ? `<ul>${data.incidents.map((i) => `<li>${esc(i.date)} — ${esc(i.type)}: ${esc(i.detail)}</li>`).join('')}</ul>`
        : '',
      '<h3>Session History</h3>',
      `<ul>${data.sessionHistory.map((s) => `<li>${esc(s.date)} — ${esc(s.teacherName)}</li>`).join('')}</ul>`,
      '<h3>Coordinator Notes</h3>',
      `<p>${esc(notes || '(none)')}</p>`,
      `<p>Flagged: ${flagged ? 'Yes' : 'No'}</p>`,
    ].join('');
    downloadTextFile(`${data.name.replace(/\s+/g, '_')}_ProgressReport.html`, html);
    setExportContent(
      [
        `Melu'e Foundation — Student Progress Report`,
        `Student: ${data.name} · Age ${data.age} · ${data.program}`,
        `Flagged: ${flagged ? 'Yes' : 'No'}`,
        '',
        'ASSESSMENT SUMMARY',
        `Skills: ${data.assessmentSummary.skills}`,
        `Behavior: ${data.assessmentSummary.behavior}`,
        `Preferences: ${data.assessmentSummary.preferences}`,
        '',
        'CURRENT GOALS',
        ...data.goals.map((g) => `• ${g.name}: ${g.percent}% — ${g.status}`),
        '',
        'BEHAVIOR INCIDENT TRENDS',
        data.incidentSummary,
        ...data.incidents.map((i) => `• ${i.date} — ${i.type}: ${i.detail}`),
        '',
        'SESSION HISTORY',
        ...data.sessionHistory.map((s) => `• ${s.date} — ${s.teacherName}`),
        '',
        'COORDINATOR NOTES',
        notes || '(none)',
      ].join('\n')
    );
  };

  if (loadError) return <ScreenError onRetry={load} />;
  if (!data) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Progress" onTabPress={(t) => t !== 'Progress' && navigation?.navigate?.(navRouteForTab(t) as never)} />

      <View style={styles.header}>
        <Text style={typography.h1}>Student Progress Monitoring</Text>
        <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
          <Feather name="printer" size={14} color={colors.navyText} />
          <Text style={styles.printBtnText}>Print Report</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selectorRow}>
        {studentOptions.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.studentChip, selectedStudentId === s.id && styles.studentChipActive]}
            onPress={() => setSelectedStudentId(s.id)}
          >
            <Text style={[typography.bodyBold, selectedStudentId === s.id && { color: colors.navyText }]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={typography.h3}>{data.name}</Text>
            <View style={styles.cardHeaderRight}>
              <TouchableOpacity style={styles.profileLink} onPress={() => navigation?.navigate?.('StudentProfile', { studentId: data.studentId })}>
                <Text style={styles.profileLinkText}>View Profile →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.flagBtn, flagged && styles.flagBtnActive]} onPress={handleToggleFlag}>
                <Feather name="flag" size={14} color={flagged ? colors.white : colors.navyText} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={typography.caption}>Age {data.age} · {data.program}</Text>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Assessment Summary</Text>
          <Text style={typography.body}>Skills: {data.assessmentSummary.skills}</Text>
          <Text style={typography.body}>Behavior: {data.assessmentSummary.behavior}</Text>
          <Text style={typography.body}>Preferences: {data.assessmentSummary.preferences}</Text>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Current Goals</Text>
          {data.goals.map((g) => (
            <View key={g.id} style={styles.goalRow}>
              <Text style={typography.bodyBold}>{g.name}</Text>
              <Text style={typography.caption}>{g.percent}% · {g.status}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Goal Progress Chart</Text>
          <Text style={styles.sectionHint}>Multi-goal trend, last 10 sessions</Text>
          {data.goals.map((g, idx) => (
            <GoalMiniChart key={g.id} goal={g} color={GOAL_COLORS[idx % GOAL_COLORS.length]} />
          ))}
          <View style={styles.legendRow}>
            {data.goals.map((g, idx) => (
              <View key={g.id} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: GOAL_COLORS[idx % GOAL_COLORS.length] }]} />
                <Text style={styles.legendText}>{g.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Behavior Incident Trends</Text>
          <Text style={typography.body}>{data.incidentSummary}</Text>
          {data.incidents.length > 0 && (
            <View style={styles.incidentList}>
              {data.incidents.map((inc, i) => (
                <View key={i} style={styles.incidentRow}>
                  <Text style={styles.incidentType}>{inc.type} · {inc.date}</Text>
                  <Text style={typography.body}>{inc.detail}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Session History</Text>
          {data.sessionHistory.map((s) => (
            <TouchableOpacity key={s.id} style={styles.sessionHistoryRow} onPress={() => setSessionTarget(s)}>
              <View style={{ flex: 1 }}>
                <Text style={typography.body}>{s.date} — {s.teacherName}</Text>
              </View>
              <Text style={styles.linkText}>View →</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Coordinator Notes</Text>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Internal notes (not visible to teacher/parent)..."
            placeholderTextColor={colors.mutedText}
            value={notes}
            onChangeText={setNotes}
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

      <SessionDetailModal visible={!!sessionTarget} entry={sessionTarget} onClose={() => setSessionTarget(null)} />
    </SafeAreaView>
  );
}

function navRouteForTab(tab: string): keyof CoordinatorStackParamList {
  return ({
    Dashboard: 'CoordinatorDashboard',
    'Live Sessions': 'LiveSessionMonitoring',
    Review: 'SessionSummaryReview',
    Schedule: 'CoordinatorSchedule',
    Parents: 'CoordinatorParentCommunication',
    Enrollment: 'StudentEnrollment',
    Workload: 'WorkloadDashboard',
    Notifications: 'Notifications',
    Rooms: 'RoomResourceScheduling',
  } as Record<string, keyof CoordinatorStackParamList>)[tab];
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  printBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  printBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  selectorRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.bgCard },
  studentChip: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.bgApp },
  studentChipActive: { backgroundColor: colors.primaryYellow },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileLink: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  profileLinkText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  flagBtn: { width: 32, height: 32, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  flagBtnActive: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  sectionHint: { fontSize: 11, color: colors.mutedText },
  miniChartRow: { gap: spacing.xs, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  miniChartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 56 },
  miniChartCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  miniChartBar: { borderRadius: 2 },
  chartLegend: { fontSize: 10, fontWeight: '600', color: colors.navyText, marginTop: spacing.xs },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: colors.mutedText },
  incidentList: { gap: spacing.xs, marginTop: spacing.xs },
  incidentRow: { backgroundColor: colors.bgApp, borderRadius: radius.md, padding: spacing.sm, gap: 2 },
  incidentType: { fontSize: 10, fontWeight: '700', color: '#EF4444' },
  textArea: { minHeight: 70, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, textAlignVertical: 'top', color: colors.navyText },
  sessionHistoryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  linkText: { color: colors.statusInProgressText, fontWeight: '600', fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  field: { gap: spacing.xs },
  closeBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  closeBtnText: { fontWeight: '600', color: colors.navyText },
});
