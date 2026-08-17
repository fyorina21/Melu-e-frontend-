// screens/director/DirectorStudentProgressScreen.js
// SCR-DIR-006: Student Progress Monitoring (Director View)

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import DirectorNav, { DIRECTOR_ROUTE_BY_TAB } from './components/DirectorNav';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { getDirectorStudentProgress } from '../../api/directorApi';
import type { DirectorStackParamList } from '../../types';

interface StudentOption {
  id: string;
  name: string;
}

const STUDENT_OPTIONS: StudentOption[] = [
  { id: 'student-a', name: 'Student A' },
  { id: 'student-b', name: 'Student B' },
  { id: 'student-c', name: 'Student C' },
];

interface DirectorGoal {
  id: string;
  name: string;
  percent: number;
  trend: number[];
}

interface SessionHistoryEntry {
  id: string;
  date: string;
  teacherName: string;
}

interface DirectorStudentData {
  name: string;
  age: number;
  program: string;
  assessmentSummary: { skills: string; behavior: string; preferences: string };
  goals: DirectorGoal[];
  sessionHistory: SessionHistoryEntry[];
  incidentSummary: string;
}

export default function DirectorStudentProgressScreen({ navigation }: NativeStackScreenProps<DirectorStackParamList, 'DirectorStudentProgress'>) {
  const [selectedStudentId, setSelectedStudentId] = useState('student-a');
  const [data, setData] = useState<DirectorStudentData | null>(null);
  const [notes, setNotes] = useState('');
  const [exportContent, setExportContent] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getDirectorStudentProgress(selectedStudentId);
      setData(res);
    } catch (err) {
      setData(DEMO_DATA);
    }
  }, [selectedStudentId]);

  useEffect(() => { load(); }, [load]);

  const handlePrint = () => {
    if (!data) return;
    setExportContent(
      [
        `Melu'e Foundation — Student Progress Report (Director)`,
        `Student: ${data.name} · Age ${data.age} · ${data.program}`,
        '',
        'ASSESSMENT SUMMARY',
        `Skills: ${data.assessmentSummary.skills}`,
        `Behavior: ${data.assessmentSummary.behavior}`,
        `Preferences: ${data.assessmentSummary.preferences}`,
        '',
        'CURRENT GOALS',
        ...data.goals.map((g) => `• ${g.name}: ${g.percent}% independent`),
        '',
        'SESSION HISTORY',
        ...data.sessionHistory.map((s) => `• ${s.date} — ${s.teacherName}`),
        '',
        'BEHAVIOR INCIDENT TRENDS',
        data.incidentSummary,
        '',
        'DIRECTOR NOTES',
        notes || '(none)',
      ].join('\n')
    );
  };

  if (!data) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <DirectorNav activeTab="Progress" onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t])} />
      <View style={styles.header}>
        <Text style={typography.h1}>Student Progress Monitoring</Text>
        <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
          <Feather name="printer" size={14} color={colors.navyText} />
          <Text style={styles.printBtnText}>Print Report</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selectorRow}>
        {STUDENT_OPTIONS.map((s) => (
          <TouchableOpacity key={s.id} style={[styles.studentChip, selectedStudentId === s.id && styles.studentChipActive]} onPress={() => setSelectedStudentId(s.id)}>
            <Text style={[typography.bodyBold, selectedStudentId === s.id && { color: colors.navyText }]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={typography.h3}>{data.name}</Text>
          <Text style={typography.caption}>Age {data.age} · {data.program}</Text>
          <TouchableOpacity onPress={() => Alert.alert('Student Profile', 'Full profile view is Student Management module (out of this scope).')}>
            <Text style={styles.linkText}>View Full Student Profile →</Text>
          </TouchableOpacity>
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
              <Text style={typography.caption}>{g.percent}% independent</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Session History</Text>
          {data.sessionHistory.map((s) => (
            <View key={s.id} style={styles.sessionRow}>
              <Text style={typography.body}>{s.date} — {s.teacherName}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Behavior Incident Trends</Text>
          <Text style={typography.body}>{data.incidentSummary}</Text>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Goal Progress Chart</Text>
          <View style={styles.chartRow}>
            {data.goals[0]?.trend.map((v, i) => (
              <View key={i} style={styles.chartBarWrap}>
                <View style={[styles.chartBar, { height: Math.max(4, v) }]} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Director Notes</Text>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Timestamped internal notes..."
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
    </SafeAreaView>
  );
}

const DEMO_DATA: DirectorStudentData = {
  name: 'Student A',
  age: 6,
  program: 'Regular Program',
  assessmentSummary: { skills: '45% (ABLLS, in progress)', behavior: 'Completed', preferences: 'Completed' },
  goals: [
    { id: 'g1', name: 'Identify Colors', percent: 45, trend: [20, 25, 30, 28, 35, 40, 38, 42, 45, 45] },
  ],
  sessionHistory: [{ id: '1', date: 'Aug 11, 2026', teacherName: 'Teacher A' }],
  incidentSummary: '2 incidents in the last 30 days, both during transitions.',
};

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
  linkText: { color: colors.statusInProgressText, fontWeight: '600', fontSize: 12 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  sessionRow: { paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, height: 60 },
  chartBarWrap: { flex: 1, justifyContent: 'flex-end' },
  chartBar: { backgroundColor: colors.promptG, borderRadius: 2 },
  textArea: { minHeight: 70, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, textAlignVertical: 'top', color: colors.navyText },
});
