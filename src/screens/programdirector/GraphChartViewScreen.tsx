// screens/programdirector/GraphChartViewScreen.js
// SCR-PD-008: Graph & Chart View

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import ProgramDirectorNav from './components/ProgramDirectorNav';
import { PD_ROUTE_BY_TAB } from './components/pdNavRoutes';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { getChartData, exportChart } from '../../api/programDirectorApi';
import type { ProgramDirectorStackParamList } from '../../types';

interface StudentOption {
  id: string;
  name: string;
}

const STUDENT_OPTIONS: StudentOption[] = [
  { id: 'student-a', name: 'Student A' },
  { id: 'student-b', name: 'Student B' },
];
const CHART_TYPES = ['Line (trend)', 'Bar (comparison)', 'Cumulative'];

interface ChartPoint {
  label: string;
  value: number;
}

interface GoalChart {
  goalId: string;
  goalName: string;
  series: ChartPoint[];
  summary: string;
}

interface ChartData {
  goalCharts: GoalChart[];
}

function SimpleLineChart({ series }: { series: ChartPoint[] }) {
  const max = Math.max(...series.map((s) => s.value), 1);
  return (
    <View style={styles.lineChartRow}>
      {series.map((point, i) => (
        <View key={i} style={styles.lineChartBarWrap}>
          <View style={[styles.lineChartBar, { height: Math.max(4, (point.value / max) * 100) }]} />
          <Text style={styles.lineChartLabel}>{point.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function GraphChartViewScreen({ navigation }: NativeStackScreenProps<ProgramDirectorStackParamList, 'GraphChartView'>) {
  const [studentId, setStudentId] = useState('student-a');
  const [chartType, setChartType] = useState<string>(CHART_TYPES[0]);
  const [data, setData] = useState<ChartData | null>(null);
  const [exportContent, setExportContent] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getChartData({ studentId, chartType });
      setData(res);
    } catch (err) {
      setData(DEMO_DATA);
    }
  }, [studentId, chartType]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    try { await exportChart({ studentId, chartType }); } catch (err) {}
    if (!data) return;
    const studentName = STUDENT_OPTIONS.find((s) => s.id === studentId)?.name ?? studentId;
    const lines: string[] = [];
    lines.push('GRAPH & CHART VIEW EXPORT');
    lines.push(`Student: ${studentName} · Chart type: ${chartType} · Generated: ${new Date().toLocaleDateString()}`);
    lines.push('');
    data.goalCharts.forEach((gc) => {
      lines.push(`${gc.goalName}`);
      gc.series.forEach((p) => {
        lines.push(`  ${p.label}: ${p.value}%`);
      });
      lines.push(`  Summary: ${gc.summary}`);
      lines.push('');
    });
    setExportContent(lines.join('\n'));
  };

  if (!data) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ProgramDirectorNav activeTab="Charts" onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t])} />
      <View style={styles.header}>
        <Text style={typography.h1}>Graph & Chart View</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Feather name="download" size={14} color={colors.navyText} />
          <Text style={styles.exportBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {STUDENT_OPTIONS.map((s) => (
            <TouchableOpacity key={s.id} style={[styles.chip, studentId === s.id && styles.chipSelected]} onPress={() => setStudentId(s.id)}>
              <Text style={[styles.chipText, studentId === s.id && styles.chipTextSelected]}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CHART_TYPES.map((t) => (
            <TouchableOpacity key={t} style={[styles.chip, chartType === t && styles.chipSelected]} onPress={() => setChartType(t)}>
              <Text style={[styles.chipText, chartType === t && styles.chipTextSelected]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {data.goalCharts.map((gc) => (
          <View key={gc.goalId} style={styles.card}>
            <Text style={typography.h3}>{gc.goalName}</Text>
            <SimpleLineChart series={gc.series} />
            <Text style={typography.caption}>{gc.summary}</Text>
          </View>
        ))}
      </ScrollView>

      <ExportPreviewModal
        visible={!!exportContent}
        title="Chart Export"
        filename={`Chart_${studentId}_${new Date().toISOString().slice(0, 10)}.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

const DEMO_DATA: ChartData = {
  goalCharts: [
    {
      goalId: 'g1', goalName: 'Identify Colors',
      series: [
        { label: 'S1', value: 20 }, { label: 'S2', value: 25 }, { label: 'S3', value: 30 },
        { label: 'S4', value: 28 }, { label: 'S5', value: 35 }, { label: 'S6', value: 40 },
        { label: 'S7', value: 38 }, { label: 'S8', value: 42 }, { label: 'S9', value: 45 }, { label: 'S10', value: 45 },
      ],
      summary: 'Steady upward trend, currently at 45% independence.',
    },
  ],
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  exportBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  exportBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  controlsRow: { padding: spacing.md, gap: spacing.sm, backgroundColor: colors.bgCard },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  chipTextSelected: { color: colors.navyText },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  lineChartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, height: 120 },
  lineChartBarWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs },
  lineChartBar: { width: '70%', backgroundColor: colors.promptG, borderRadius: 2 },
  lineChartLabel: { fontSize: 9, color: colors.mutedText },
});
