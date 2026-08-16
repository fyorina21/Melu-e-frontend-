// import React, { useEffect, useState, useCallback } from 'react';
// import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert, ActivityIndicator, RefreshControl } from 'react-native';
// import { Feather } from '@expo/vector-icons';
// import type { NativeStackScreenProps } from '@react-navigation/native-stack';
// import { colors, radius, spacing } from '../../theme/colors';
// import { typography } from '../../theme/typography';
// import CoordinatorNav from './components/CoordinatorNav';
// import ExportPreviewModal from '../../components/ExportPreviewModal';
// import { getActiveSessions, sendAlertToTeacher, exportSessionLog } from '../../api/coordinatorApi';
// import type { CoordinatorStackParamList } from '../../types';

// const STATUS_FILTERS: string[] = ['All', 'On Track', 'Needs Attention', 'Overdue'];
// const STATUS_COLOR: Record<string, string> = { 'On Track': '#22C55E', 'Needs Attention': '#EAB308', Overdue: '#EF4444' };

// interface LiveSession {
//   id: string;
//   teacherName: string;
//   stationName: string;
//   status: string;
//   timer: string;
//   trialCount: number;
//   studentNames: string[];
// }

// function AlertModal({ visible, session, onClose, onSend }: {
//   visible: boolean;
//   session: LiveSession | null;
//   onClose: () => void;
//   onSend: (alertType: string, message: string) => void;
// }) {
//   const [message, setMessage] = useState('');
//   const [alertType, setAlertType] = useState('info');
//   return (
//     <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
//       <View style={styles.overlay}>
//         <View style={styles.modalSheet}>
//           <Text style={typography.h3}>Send Alert to {session?.teacherName}</Text>
//           <View style={styles.chipRow}>
//             {['info', 'warning', 'urgent'].map((t) => (
//               <TouchableOpacity key={t} style={[styles.chip, alertType === t && styles.chipSelected]} onPress={() => setAlertType(t)}>
//                 <Text style={[styles.chipText, alertType === t && styles.chipTextSelected]}>{t}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//           <TextInput
//             style={styles.textArea}
//             multiline
//             placeholder="Message..."
//             placeholderTextColor={colors.mutedText}
//             value={message}
//             onChangeText={setMessage}
//           />
//           <View style={styles.modalFooter}>
//             <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
//               <Text style={styles.cancelBtnText}>Cancel</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.sendBtn}
//               onPress={() => { onSend(alertType, message); setMessage(''); }}
//             >
//               <Text style={styles.sendBtnText}>Send Alert</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// }

// export default function LiveSessionMonitoringScreen({ navigation }: NativeStackScreenProps<CoordinatorStackParamList, 'LiveSessionMonitoring'>) {
//   const [sessions, setSessions] = useState<LiveSession[]>([]);
//   const [statusFilter, setStatusFilter] = useState('All');
//   const [stationFilter, setStationFilter] = useState('All');
//   const [alertTarget, setAlertTarget] = useState<LiveSession | null>(null);
//   const [exportContent, setExportContent] = useState<string | null>(null);
//   const [refreshing, setRefreshing] = useState(false);
//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

//   const load = useCallback(async () => {
//     setRefreshing(true);
//     try {
//       const { data } = await getActiveSessions({ status: statusFilter, station: stationFilter });
//       setSessions(data);
//     } catch (err) {
//       setSessions(DEMO_SESSIONS);
//     }
//     setLastUpdated(new Date());
//     setRefreshing(false);
//   }, [statusFilter, stationFilter]);

//   useEffect(() => {
//     load();
//     const interval = setInterval(load, 30000); // auto-refresh every 30s per spec
//     return () => clearInterval(interval);
//   }, [load]);

//   const lastUpdatedStr = lastUpdated
//     ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
//     : '—';

//   const filtered = sessions.filter(
//     (s) => (statusFilter === 'All' || s.status === statusFilter) && (stationFilter === 'All' || s.stationName === stationFilter)
//   );

//   const stationOptions = ['All', ...Array.from(new Set(sessions.map((s) => s.stationName)))];

//   const handleSendAlert = async (alertType: string, message: string) => {
//     if (!alertTarget) return;
//     try {
//       await sendAlertToTeacher(alertTarget.id, { alertType, message });
//     } catch (err) {
//       // Demo/offline: still show confirmation.
//     }
//     Alert.alert('Alert sent', `Sent to ${alertTarget.teacherName}`);
//     setAlertTarget(null);
//   };

//   const handleExport = async () => {
//     try {
//       await exportSessionLog({ status: statusFilter, station: stationFilter });
//     } catch (err) {
//       // fall through to local export
//     }
//     setExportContent(
//       [
//         `Melu'e Foundation — Live Session Log`,
//         `Status: ${statusFilter} · Station: ${stationFilter}`,
//         `Generated ${new Date().toLocaleString()}`,
//         '',
//         ...filtered.map((s) => [
//           `${s.teacherName} — ${s.status}`,
//           `  ${s.stationName} · ${s.timer} remaining · ${s.trialCount} trials · Students: ${s.studentNames.join(', ')}`,
//         ]).flat(),
//         filtered.length === 0 ? '(no sessions)' : '',
//       ].join('\n')
//     );
//   };

//   return (
//     <SafeAreaView style={styles.safe}>
//       <CoordinatorNav activeTab="Live Sessions" onTabPress={(t) => t !== 'Live Sessions' && navigation?.navigate?.(navRouteForTab(t) as never)} />

//       <View style={styles.header}>
//         <Text style={typography.h1}>Live Session Monitoring</Text>
//         <View style={styles.headerActions}>
//           <TouchableOpacity style={styles.refreshBtn} onPress={load} disabled={refreshing}>
//             {refreshing ? (
//               <ActivityIndicator size="small" color={colors.navyText} />
//             ) : (
//               <Feather name="refresh-cw" size={14} color={colors.navyText} />
//             )}
//             <Text style={styles.refreshBtnText}>{refreshing ? 'Refreshing' : 'Refresh'}</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
//             <Text style={styles.exportBtnText}>Export Log</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <View style={styles.infoRow}>
//         <View style={styles.infoPill}>
//           <Feather name="activity" size={12} color={colors.statusInProgressText} />
//           <Text style={styles.infoText}>Auto-refresh every 30s</Text>
//         </View>
//         <View style={styles.infoPill}>
//           <Feather name="clock" size={12} color={colors.mutedText} />
//           <Text style={styles.infoText}>Last updated {lastUpdatedStr}</Text>
//         </View>
//       </View>

//       <View style={styles.filterRow}>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//           {STATUS_FILTERS.map((f) => (
//             <TouchableOpacity key={f} style={[styles.filterChip, statusFilter === f && styles.filterChipActive]} onPress={() => setStatusFilter(f)}>
//               <Text style={typography.body}>{f}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>
//       </View>

//       <View style={[styles.filterRow, styles.filterRowSpaced]}>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//           {stationOptions.map((f) => (
//             <TouchableOpacity key={f} style={[styles.filterChip, stationFilter === f && styles.filterChipActive]} onPress={() => setStationFilter(f)}>
//               <Text style={typography.body}>{f}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>
//       </View>

//       <ScrollView
//         contentContainerStyle={styles.content}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
//       >
//         {filtered.map((s) => (
//           <View key={s.id} style={styles.sessionCard}>
//             <View style={styles.sessionCardHeader}>
//               <Text style={typography.h3}>{s.teacherName}</Text>
//               <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[s.status] }]}>
//                 <Text style={styles.statusPillText}>{s.status}</Text>
//               </View>
//             </View>
//             <Text style={typography.caption}>{s.stationName} · {s.timer} remaining · {s.trialCount} trials logged</Text>
//             <Text style={typography.body}>Students: {s.studentNames.join(', ')}</Text>
//             <View style={styles.sessionActionsRow}>
//               <TouchableOpacity style={styles.actionBtn} onPress={() => setAlertTarget(s)}>
//                 <Text style={styles.actionBtnText}>Send Alert</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDisabled]} disabled>
//                 <Text style={styles.actionBtnTextDisabled}>View Teacher Screen (Post-MVP)</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         ))}
//         {filtered.length === 0 && (
//           <Text style={[typography.body, { textAlign: 'center', color: colors.mutedText }]}>No active sessions match these filters.</Text>
//         )}
//       </ScrollView>

//       <AlertModal visible={!!alertTarget} session={alertTarget} onClose={() => setAlertTarget(null)} onSend={handleSendAlert} />

//       <ExportPreviewModal
//         visible={!!exportContent}
//         title="Live Session Log Export"
//         filename={`LiveSessionLog_${statusFilter.replace(/\s+/g, '_')}.txt`}
//         content={exportContent ?? ''}
//         onClose={() => setExportContent(null)}
//       />
//     </SafeAreaView>
//   );
// }

// function navRouteForTab(tab: string): keyof CoordinatorStackParamList {
//   return ({
//     Dashboard: 'CoordinatorDashboard',
//     Review: 'SessionSummaryReview',
//     Progress: 'CoordinatorStudentProgress',
//     Schedule: 'CoordinatorSchedule',
//     Parents: 'CoordinatorParentCommunication',
//     Enrollment: 'StudentEnrollment',
//     Workload: 'WorkloadDashboard',
//     Notifications: 'Notifications',
//     Rooms: 'RoomResourceScheduling',
//   } as Record<string, keyof CoordinatorStackParamList>)[tab];
// }

// const DEMO_SESSIONS: LiveSession[] = [
//   { id: '1', teacherName: 'Teacher A', stationName: 'Station 1', status: 'On Track', timer: '42:10', trialCount: 18, studentNames: ['Student A', 'Student B'] },
//   { id: '2', teacherName: 'Teacher B', stationName: 'Station 2', status: 'Needs Attention', timer: '05:22', trialCount: 4, studentNames: ['Student C'] },
// ];

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: colors.bgApp },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
//   headerActions: { flexDirection: 'row', gap: spacing.sm },
//   refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
//   refreshBtnText: { fontWeight: '600', fontSize: 12, color: colors.navyText },
//   infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
//   infoPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.bgApp, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
//   infoText: { fontSize: 11, fontWeight: '600', color: colors.mutedText },
//   exportBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
//   exportBtnText: { fontWeight: '600', fontSize: 12, color: colors.navyText },
//   filterRow: { padding: spacing.md, backgroundColor: colors.bgCard },
//   filterRowSpaced: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
//   filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs },
//   filterChipActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
//   content: { padding: spacing.lg, gap: spacing.md },
//   sessionCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
//   sessionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
//   statusPillText: { color: colors.white, fontSize: 10, fontWeight: '700' },
//   sessionActionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
//   actionBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
//   actionBtnDisabled: { opacity: 0.5 },
//   actionBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
//   actionBtnTextDisabled: { fontSize: 11, fontWeight: '600', color: colors.mutedText },
//   overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
//   modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
//   chipRow: { flexDirection: 'row', gap: spacing.xs },
//   chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
//   chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
//   chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
//   chipTextSelected: { color: colors.navyText },
//   textArea: { minHeight: 80, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, textAlignVertical: 'top', color: colors.navyText },
//   modalFooter: { flexDirection: 'row', gap: spacing.sm },
//   cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
//   cancelBtnText: { fontWeight: '600', color: colors.navyText },
//   sendBtn: { flex: 2, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
//   sendBtnText: { fontWeight: '700', color: colors.navyText },
// });
