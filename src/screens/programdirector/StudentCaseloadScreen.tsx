// screens/programdirector/StudentCaseloadScreen.js
// SCR-PD-005: Student Caseload Management

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import ProgramDirectorNav from './components/ProgramDirectorNav';
import { PD_ROUTE_BY_TAB } from './components/pdNavRoutes';
import { getStudentCaseload } from '../../api/programDirectorApi';
import type { ProgramDirectorStackParamList } from '../../types';

interface StudentOption {
  id: string;
  name: string;
}

const STUDENT_OPTIONS: StudentOption[] = [
  { id: 'student-a', name: 'Student A' },
  { id: 'student-b', name: 'Student B' },
  { id: 'student-c', name: 'Student C' },
];

interface CaseloadGoal {
  id: string;
  name: string;
  station: string;
  percent: number;
  assignedBy: string;
}

interface CaseloadBalanceRow {
  teacherName: string;
  studentCount: number;
  capacity: number;
}

interface StudentCaseloadData {
  name: string;
  primaryTeacher: string;
  program: string;
  goals: CaseloadGoal[];
  caseloadBalance: CaseloadBalanceRow[];
}

export default function StudentCaseloadScreen({ navigation }: NativeStackScreenProps<ProgramDirectorStackParamList, 'StudentCaseload'>) {
  const [selectedStudentId, setSelectedStudentId] = useState('student-a');
  const [data, setData] = useState<StudentCaseloadData | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getStudentCaseload(selectedStudentId);
      setData(res);
    } catch (err) {
      setData(DEMO_DATA);
    }
  }, [selectedStudentId]);

  useEffect(() => { load(); }, [load]);

  if (!data) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ProgramDirectorNav activeTab="Caseload" onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t])} />
      <View style={styles.header}>
        <Text style={typography.h1}>Student Caseload Management</Text>
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
          <Text style={typography.caption}>Primary Teacher: {data.primaryTeacher} · Program: {data.program}</Text>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Assigned Goals ({data.goals.length})</Text>
          {data.goals.map((g) => (
            <View key={g.id} style={styles.goalRow}>
              <Text style={typography.bodyBold}>{g.name}</Text>
              <Text style={typography.caption}>{g.station} · {g.percent}% · assigned by {g.assignedBy}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Caseload Balance (all teachers)</Text>
          {data.caseloadBalance.map((t) => (
            <View key={t.teacherName} style={styles.balanceRow}>
              <Text style={typography.body}>{t.teacherName}</Text>
              <View style={styles.balanceBarTrack}>
                <View style={[styles.balanceBarFill, { width: `${Math.min(100, (t.studentCount / t.capacity) * 100)}%` }]} />
              </View>
              <Text style={typography.caption}>{t.studentCount}/{t.capacity}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DEMO_DATA: StudentCaseloadData = {
  name: 'Student A',
  primaryTeacher: 'Teacher A',
  program: 'Regular Program',
  goals: [
    { id: 'g1', name: 'Identify Colors', station: 'Station 1', percent: 45, assignedBy: 'Program Director A' },
    { id: 'g2', name: 'Request Items', station: 'Station 2', percent: 68, assignedBy: 'Program Director A' },
  ],
  caseloadBalance: [
    { teacherName: 'Teacher A', studentCount: 4, capacity: 6 },
    { teacherName: 'Teacher B', studentCount: 5, capacity: 6 },
    { teacherName: 'Teacher C', studentCount: 3, capacity: 6 },
  ],
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  selectorRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.bgCard },
  studentChip: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.bgApp },
  studentChipActive: { backgroundColor: colors.primaryYellow },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  goalRow: { paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  balanceBarTrack: { flex: 1, height: 8, borderRadius: radius.pill, backgroundColor: colors.bgApp, overflow: 'hidden' },
  balanceBarFill: { height: '100%', backgroundColor: colors.statusInProgressText },
});
