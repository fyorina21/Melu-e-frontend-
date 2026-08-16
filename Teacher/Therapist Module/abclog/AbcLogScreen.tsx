// screens/abclog/AbcLogScreen.js
// SCR-003A: ABC Data Sheet View - matches Figma exactly: student
// selector, date/behavior/category filters, export, 4 stat cards, and a
// wide table (Date/Time/Location/Behavior/Frequency/Intensity/Category/
// Antecedent/Consequence/Teacher).

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import TopNav from '../../components/TopNav';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getAbcLog, exportAbcLog } from '../../api/teacherExtrasApi';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'AbcLog'>;

interface AbcStats {
  totalIncidents: number;
  mostCommonBehavior: string;
  mostCommonAntecedent: string;
  thisWeek: number;
}

interface AbcIncidentRow {
  [key: string]: string | undefined;
}

interface AbcLogData {
  stats: AbcStats;
  incidents: AbcIncidentRow[];
}

const STUDENT_OPTIONS = [
  { id: 'student-a', name: 'Student A', age: 7 },
  { id: 'student-b', name: 'Student B', age: 6 },
];
const COLUMNS = ['Date', 'Time', 'Location', 'Behavior', 'Frequency', 'Intensity', 'Category', 'Antecedent', 'Consequence', 'Teacher'];
const BEHAVIOR_OPTIONS = ['Aggression', 'Tantrum', 'Elopement', 'Non-compliance', 'Self-injury'];
const CATEGORY_OPTIONS = ['Physical', 'Verbal', 'Disruptive'];

export default function AbcLogScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [studentId, setStudentId] = useState('student-a');
  const [from, setFrom] = useState('07/07/2026');
  const [to, setTo] = useState('08/06/2026');
  const [behaviorFilter, setBehaviorFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [data, setData] = useState<AbcLogData | null>(null);
  const [exportContent, setExportContent] = useState<string | null>(null);

  const buildData = useCallback((behavior: string, category: string): AbcLogData => {
    const filtered = DEMO_INCIDENTS.filter(
      (r) =>
        (behavior === 'All' || r.behavior === behavior) &&
        (category === 'All' || r.category === category)
    );
    const behaviorCounts: Record<string, number> = {};
    const antecedentCounts: Record<string, number> = {};
    filtered.forEach((r) => {
      const b = r.behavior ?? '';
      const a = r.antecedent ?? '';
      behaviorCounts[b] = (behaviorCounts[b] || 0) + 1;
      antecedentCounts[a] = (antecedentCounts[a] || 0) + 1;
    });
    const top = (counts: Record<string, number>) =>
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
    const thisWeek = filtered.filter((r) => (r.date ?? '').startsWith('08/')).length;
    return {
      stats: {
        totalIncidents: filtered.length,
        mostCommonBehavior: top(behaviorCounts),
        mostCommonAntecedent: top(antecedentCounts),
        thisWeek,
      },
      incidents: filtered,
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getAbcLog({ studentId, from, to, behavior: behaviorFilter, category: categoryFilter });
      setData(res);
    } catch (err) {
      setData(buildData(behaviorFilter, categoryFilter));
    }
  }, [studentId, from, to, behaviorFilter, categoryFilter, buildData]);

  useEffect(() => { load(); }, [load]);

  const cycleFilter = (current: string, options: string[]) => {
    const idx = options.indexOf(current);
    return options[(idx + 1) % options.length];
  };

  const handleExport = async () => {
    try {
      await exportAbcLog({ studentId, from, to });
    } catch (err) {}
    const rows = data?.incidents ?? [];
    const header = COLUMNS.join(',');
    const lines = rows.map((r) => COLUMNS.map((c) => `"${(r[c.toLowerCase()] || '').replace(/"/g, '""')}"`).join(','));
    const stats = data?.stats;
    const content = [
      `Melu'e Foundation — ABC Data Sheet`,
      `Student: ${currentStudent?.name}`,
      `Range: ${from} to ${to}`,
      `Filters: Behavior ${behaviorFilter} · Category ${categoryFilter}`,
      '',
      `TOTAL INCIDENTS: ${stats?.totalIncidents ?? 0}`,
      `MOST COMMON BEHAVIOR: ${stats?.mostCommonBehavior ?? 'N/A'}`,
      `MOST COMMON ANTECEDENT: ${stats?.mostCommonAntecedent ?? 'N/A'}`,
      `THIS WEEK: ${stats?.thisWeek ?? 0}`,
      '',
      header,
      ...lines,
    ].join('\n');
    setExportContent(content);
  };

  const currentStudent = STUDENT_OPTIONS.find((s) => s.id === studentId);

  if (!data) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <TopNav activeTab="ABC Log" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} onLogout={logout} />

      <View style={styles.header}>
        <View style={styles.studentSelectorRow}>
          <View style={styles.studentAvatar}><Text style={styles.studentAvatarText}>{currentStudent?.name?.[0]}</Text></View>
          <TouchableOpacity
            style={styles.studentDropdown}
            onPress={() => setStudentId((prev) => (prev === 'student-a' ? 'student-b' : 'student-a'))}
          >
            <Text style={typography.h3}>{currentStudent?.name}</Text>
            <Feather name="chevron-down" size={16} color={colors.navyText} />
          </TouchableOpacity>
          <Text style={typography.caption}>Age {currentStudent?.age}</Text>
        </View>
        <Text style={typography.caption}>ABC Data Sheet</Text>
      </View>

      <View style={styles.filtersCard}>
        <View style={styles.filtersRow}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={typography.label}>From</Text>
            <TextInput style={styles.textInput} value={from} onChangeText={setFrom} />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={typography.label}>To</Text>
            <TextInput style={styles.textInput} value={to} onChangeText={setTo} />
          </View>
        </View>
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[styles.filterChip, styles.filterChipFlex]}
            onPress={() => setBehaviorFilter((prev) => cycleFilter(prev, ['All', ...BEHAVIOR_OPTIONS]))}
          >
            <Text style={typography.body}>Behavior: {behaviorFilter}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, styles.filterChipFlex]}
            onPress={() => setCategoryFilter((prev) => cycleFilter(prev, ['All', ...CATEGORY_OPTIONS]))}
          >
            <Text style={typography.body}>Category: {categoryFilter}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <Text style={styles.exportBtnText}>Export</Text>
            <Feather name="chevron-down" size={14} color={colors.navyText} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL INCIDENTS</Text>
            <Text style={styles.statValue}>{data.stats.totalIncidents}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>MOST COMMON BEHAVIOR</Text>
            <Text style={styles.statValueSmall}>{data.stats.mostCommonBehavior}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>MOST COMMON ANTECEDENT</Text>
            <Text style={styles.statValueSmall}>{data.stats.mostCommonAntecedent}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>THIS WEEK</Text>
            <Text style={styles.statValue}>{data.stats.thisWeek}</Text>
          </View>
        </View>

        <ScrollView horizontal>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              {COLUMNS.map((c) => (
                <Text key={c} style={styles.tableHeaderCell}>{c}</Text>
              ))}
            </View>
            {data.incidents.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={[typography.body, { color: colors.mutedText }]}>No incidents found for the selected filters.</Text>
              </View>
            ) : (
              data.incidents.map((inc, i) => (
                <View key={i} style={styles.tableRow}>
                  {COLUMNS.map((c) => (
                    <Text key={c} style={styles.tableCell}>{inc[c.toLowerCase()] || '—'}</Text>
                  ))}
                </View>
              ))
            )}
          </View>
        </ScrollView>
        <Text style={typography.caption}>Showing {data.incidents.length === 0 ? '0-0' : `1-${data.incidents.length}`} of {data.incidents.length} incidents</Text>
      </ScrollView>

      <ExportPreviewModal
        visible={!!exportContent}
        title="ABC Data Sheet Export"
        filename={`ABC_Data_${currentStudent?.name?.replace(/\s+/g, '_')}_${from}_to_${to}.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

const DEMO_INCIDENTS: AbcIncidentRow[] = [
  { date: '08/01/2026', time: '9:12 AM', location: 'Room 2', behavior: 'Tantrum', frequency: '2 times', intensity: 'High', category: 'Disruptive', antecedent: 'Transitions', consequence: 'Verbal redirection', teacher: 'Teacher A' },
  { date: '08/01/2026', time: '10:40 AM', location: 'Playground', behavior: 'Aggression', frequency: '1 time', intensity: 'High', category: 'Physical', antecedent: 'Peer proximity', consequence: 'Time-out', teacher: 'Teacher A' },
  { date: '08/04/2026', time: '9:05 AM', location: 'Room 2', behavior: 'Elopement', frequency: '1 time', intensity: 'Medium', category: 'Physical', antecedent: 'Non-preferred task', consequence: 'Blocking + redirect', teacher: 'Teacher B' },
  { date: '08/05/2026', time: '1:22 PM', location: 'Room 1', behavior: 'Non-compliance', frequency: '4 times', intensity: 'Low', category: 'Verbal', antecedent: 'Instructions', consequence: 'Prompt hierarchy', teacher: 'Teacher A' },
  { date: '07/29/2026', time: '11:00 AM', location: 'Room 2', behavior: 'Self-injury', frequency: '3 times', intensity: 'High', category: 'Physical', antecedent: 'Demand removal', consequence: 'Sensory break', teacher: 'Teacher B' },
  { date: '07/25/2026', time: '8:55 AM', location: 'Cafeteria', behavior: 'Tantrum', frequency: '2 times', intensity: 'Medium', category: 'Disruptive', antecedent: 'Waiting', consequence: 'Attention', teacher: 'Teacher A' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.xs },
  studentSelectorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  studentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgApp, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontWeight: '700', color: colors.navyText },
  studentDropdown: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  filtersCard: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
  filtersRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  field: { gap: spacing.xs },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm },
  filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterChipFlex: { flex: 1 },
  exportBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  exportBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  content: { padding: spacing.lg, gap: spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { flexGrow: 1, minWidth: '22%', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.mutedText, letterSpacing: 0.5 },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.statusInProgressText },
  statValueSmall: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  table: { minWidth: 900, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#0EA5E9' },
  tableHeaderCell: { width: 90, padding: spacing.sm, fontSize: 11, fontWeight: '700', color: colors.white },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgCard },
  tableCell: { width: 90, padding: spacing.sm, fontSize: 12, color: colors.navyText },
  emptyRow: { padding: spacing.xl, alignItems: 'center', backgroundColor: colors.bgCard, width: 900 },
});
