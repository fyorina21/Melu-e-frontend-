// import React, { useEffect, useState, useCallback } from 'react';
// import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
// import { Feather } from '@expo/vector-icons';
// import type { NativeStackScreenProps } from '@react-navigation/native-stack';
// import { colors, radius, spacing } from '../../theme/colors';
// import { typography } from '../../theme/typography';
// import CoordinatorNav from './components/CoordinatorNav';
// import ExportPreviewModal from '../../components/ExportPreviewModal';
// import { getStudentProgressOverview, flagStudent } from '../../api/coordinatorApi';
// import type { CoordinatorStackParamList } from '../../types';

// interface StudentOption {
//   id: string;
//   name: string;
// }

// const STUDENT_OPTIONS: StudentOption[] = [
//   { id: 'student-a', name: 'Student A' },
//   { id: 'student-b', name: 'Student B' },
//   { id: 'student-c', name: 'Student C' },
// ];

// interface ProgressGoal {
//   id: string;
//   name: string;
//   percent: number;
//   status: string;
//   trend: number[];
// }

// interface SessionHistoryEntry {
//   id: string;
//   date: string;
//   teacherName: string;
// }

// interface StudentProgressData {
//   name: string;
//   age: number;
//   program: string;
//   flagged: boolean;
//   assessmentSummary: { skills: string; behavior: string; preferences: string };
//   goals: ProgressGoal[];
//   incidentSummary: string;
//   sessionHistory: SessionHistoryEntry[];
// }

// export default function CoordinatorStudentProgressScreen({ navigation }: NativeStackScreenProps<CoordinatorStackParamList, 'CoordinatorStudentProgress'>) {
//   const [selectedStudentId, setSelectedStudentId] = useState('student-a');
//   const [data, setData] = useState<StudentProgressData | null>(null);
//   const [flagged, setFlagged] = useState(false);
//   const [notes, setNotes] = useState('');
//   const [exportContent, setExportContent] = useState<string | null>(null);

//   const load = useCallback(async () => {
//     try {
//       const { data: res } = await getStudentProgressOverview(selectedStudentId);
//       setData(res);
//       setFlagged(res.flagged);
//     } catch (err) {
//       setData(DEMO_DATA);
//       setFlagged(false);
//     }
//   }, [selectedStudentId]);

//   useEffect(() => {
//     load();
//   }, [load]);

//   const handleToggleFlag = async () => {
//     const next = !flagged;
//     setFlagged(next);
//     try {
//       await flagStudent(selectedStudentId, { flagged: next });
//     } catch (err) {}
//     if (next) Alert.alert('Student flagged', 'A notification has been created.');
//   };

//   const handlePrint = () => {
//     if (!data) return;
//     setExportContent(
//       [
//         `Melu'e Foundation — Student Progress Report`,
//         `Student: ${data.name} · Age ${data.age} · ${data.program}`,
//         `Flagged: ${flagged ? 'Yes' : 'No'}`,
//         '',
//         'ASSESSMENT SUMMARY',
//         `Skills: ${data.assessmentSummary.skills}`,
//         `Behavior: ${data.assessmentSummary.behavior}`,
//         `Preferences: ${data.assessmentSummary.preferences}`,
//         '',
//         'CURRENT GOALS',
//         ...data.goals.map((g) => `• ${g.name}: ${g.percent}% — ${g.status}`),
//         '',
//         'BEHAVIOR INCIDENT TRENDS',
//         data.incidentSummary,
//         '',
//         'SESSION HISTORY',
//         ...data.sessionHistory.map((s) => `• ${s.date} — ${s.teacherName}`),
//         '',
//         'COORDINATOR NOTES',
//         notes || '(none)',
//       ].join('\n')
//     );
//   };

//   if (!data) return null;

//   return (
//     <SafeAreaView style={styles.safe}>
//       <CoordinatorNav activeTab="Progress" onTabPress={(t) => t !== 'Progress' && navigation?.navigate?.(navRouteForTab(t) as never)} />

//       <View style={styles.header}>
//         <Text style={typography.h1}>Student Progress Monitoring</Text>
//         <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
//           <Feather name="printer" size={14} color={colors.navyText} />
//           <Text style={styles.printBtnText}>Print Report</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.selectorRow}>
//         {STUDENT_OPTIONS.map((s) => (
//           <TouchableOpacity
//             key={s.id}
//             style={[styles.studentChip, selectedStudentId === s.id && styles.studentChipActive]}
//             onPress={() => setSelectedStudentId(s.id)}
//           >
//             <Text style={[typography.bodyBold, selectedStudentId === s.id && { color: colors.navyText }]}>{s.name}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <ScrollView contentContainerStyle={styles.content}>
//         <View style={styles.card}>
//           <View style={styles.cardHeaderRow}>
//             <Text style={typography.h3}>{data.name}</Text>
//             <TouchableOpacity style={[styles.flagBtn, flagged && styles.flagBtnActive]} onPress={handleToggleFlag}>
//               <Feather name="flag" size={14} color={flagged ? colors.white : colors.navyText} />
//             </TouchableOpacity>
//           </View>
//           <Text style={typography.caption}>Age {data.age} · {data.program}</Text>
//         </View>

//         <View style={styles.card}>
//           <Text style={typography.h3}>Assessment Summary</Text>
//           <Text style={typography.body}>Skills: {data.assessmentSummary.skills}</Text>
//           <Text style={typography.body}>Behavior: {data.assessmentSummary.behavior}</Text>
//           <Text style={typography.body}>Preferences: {data.assessmentSummary.preferences}</Text>
//         </View>

//         <View style={styles.card}>
//           <Text style={typography.h3}>Current Goals</Text>
//           {data.goals.map((g) => (
//             <View key={g.id} style={styles.goalRow}>
//               <Text style={typography.bodyBold}>{g.name}</Text>
//               <Text style={typography.caption}>{g.percent}% · {g.status}</Text>
//             </View>
//           ))}
//         </View>

//         <View style={styles.card}>
//           <Text style={typography.h3}>Goal Progress Chart</Text>
//           <View style={styles.chartRow}>
//             {data.goals[0]?.trend.map((v, i) => (
//               <View key={i} style={styles.chartBarWrap}>
//                 <View style={[styles.chartBar, { height: Math.max(4, v) }]} />
//               </View>
//             ))}
//           </View>
//           <Text style={typography.caption}>{data.goals[0]?.name} — last 10 sessions</Text>
//         </View>

//         <View style={styles.card}>
//           <Text style={typography.h3}>Behavior Incident Trends</Text>
//           <Text style={typography.body}>{data.incidentSummary}</Text>
//         </View>

//         <View style={styles.card}>
//           <Text style={typography.h3}>Session History</Text>
//           {data.sessionHistory.map((s) => (
//             <View key={s.id} style={styles.sessionHistoryRow}>
//               <Text style={typography.body}>{s.date} — {s.teacherName}</Text>
//             </View>
//           ))}
//         </View>

//         <View style={styles.card}>
//           <Text style={typography.h3}>Coordinator Notes</Text>
//           <TextInput
//             style={styles.textArea}
//             multiline
//             placeholder="Internal notes (not visible to teacher/parent)..."
//             placeholderTextColor={colors.mutedText}
//             value={notes}
//             onChangeText={setNotes}
//           />
//         </View>
//       </ScrollView>

//       <ExportPreviewModal
//         visible={!!exportContent}
//         title="Student Progress Report"
//         filename={`${data.name.replace(/\s+/g, '_')}_ProgressReport.txt`}
//         content={exportContent ?? ''}
//         onClose={() => setExportContent(null)}
//       />
//     </SafeAreaView>
//   );
// }

// function navRouteForTab(tab: string): keyof CoordinatorStackParamList {
//   return ({
//     Dashboard: 'CoordinatorDashboard',
//     'Live Sessions': 'LiveSessionMonitoring',
//     Review: 'SessionSummaryReview',
//     Schedule: 'CoordinatorSchedule',
//     Parents: 'CoordinatorParentCommunication',
//     Enrollment: 'StudentEnrollment',
//     Workload: 'WorkloadDashboard',
//     Notifications: 'Notifications',
//     Rooms: 'RoomResourceScheduling',
//   } as Record<string, keyof CoordinatorStackParamList>)[tab];
// }

// const DEMO_DATA: StudentProgressData = {
//   name: 'Student A',
//   age: 6,
//   program: 'Regular Program',
//   flagged: false,
//   assessmentSummary: { skills: '45% (ABLLS, in progress)', behavior: 'Completed', preferences: 'Completed' },
//   goals: [
//     { id: 'g1', name: 'Identify Colors', percent: 45, status: 'In Progress', trend: [20, 25, 30, 28, 35, 40, 38, 42, 45, 45] },
//     { id: 'g2', name: 'Request Items', percent: 68, status: 'In Progress', trend: [30, 35, 40, 45, 50, 55, 60, 62, 65, 68] },
//   ],
//   incidentSummary: '2 incidents in the last 30 days, both during transitions. No escalation required.',
//   sessionHistory: [
//     { id: '1', date: 'Aug 11, 2026', teacherName: 'Teacher A' },
//     { id: '2', date: 'Aug 8, 2026', teacherName: 'Teacher A' },
//   ],
// };

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: colors.bgApp },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
//   printBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
//   printBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
//   selectorRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.bgCard },
//   studentChip: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.bgApp },
//   studentChipActive: { backgroundColor: colors.primaryYellow },
//   content: { padding: spacing.lg, gap: spacing.lg },
//   card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
//   cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   flagBtn: { width: 32, height: 32, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
//   flagBtnActive: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
//   goalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
//   chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, height: 60 },
//   chartBarWrap: { flex: 1, justifyContent: 'flex-end' },
//   chartBar: { backgroundColor: colors.promptG, borderRadius: 2 },
//   sessionHistoryRow: { paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
//   textArea: { minHeight: 70, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, textAlignVertical: 'top', color: colors.navyText },
// });
