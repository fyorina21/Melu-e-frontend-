// import React, { useEffect, useState, useCallback } from 'react';
// import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
// import { Feather } from '@expo/vector-icons';
// import * as DocumentPicker from 'expo-document-picker';
// import type { NativeStackScreenProps } from '@react-navigation/native-stack';
// import { colors, radius, spacing } from '../../theme/colors';
// import { typography } from '../../theme/typography';
// import CoordinatorNav from './components/CoordinatorNav';
// import {
//   getCoordinatorConversations,
//   getConversationThread,
//   sendCoordinatorMessage,
//   escalateConversation,
//   markConversationResolved,
// } from '../../api/coordinatorApi';
// import type { CoordinatorStackParamList } from '../../types';

// interface Conversation {
//   id: string;
//   studentName: string;
//   parentName: string;
//   lastMessagePreview: string;
//   unreadCount: number;
//   resolved: boolean;
// }

// interface ThreadMessage {
//   id: string;
//   sender: string;
//   senderLabel: string;
//   text: string;
//   timestamp: string;
//   attachments?: { id: string; name: string }[];
// }

// export default function CoordinatorParentCommunicationScreen({ navigation }: NativeStackScreenProps<CoordinatorStackParamList, 'CoordinatorParentCommunication'>) {
//   const [conversations, setConversations] = useState<Conversation[]>([]);
//   const [activeId, setActiveId] = useState<string | null>(null);
//   const [thread, setThread] = useState<ThreadMessage[]>([]);
//   const [draft, setDraft] = useState('');
//   const [tab, setTab] = useState('active'); // 'active' | 'log'
//   const [pendingAttachments, setPendingAttachments] = useState<{ id: string; name: string }[]>([]);

//   const loadList = useCallback(async () => {
//     try {
//       const { data } = await getCoordinatorConversations({});
//       setConversations(data);
//       if (!activeId && data.length) setActiveId(data[0].id);
//     } catch (err) {
//       setConversations(DEMO_CONVERSATIONS);
//       if (!activeId) setActiveId(DEMO_CONVERSATIONS[0].id);
//     }
//   }, [activeId]);

//   useEffect(() => {
//     loadList();
//   }, [loadList]);

//   useEffect(() => {
//     if (!activeId) return;
//     getConversationThread(activeId)
//       .then(({ data }) => setThread(data.messages))
//       .catch(() => setThread(DEMO_THREAD));
//   }, [activeId]);

//   const activeConversation = conversations.find((c) => c.id === activeId);

//   const handleAttach = async () => {
//     const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*', '*/*'], copyToCacheDirectory: true });
//     if (result.canceled) return;
//     const asset = result.assets[0];
//     setPendingAttachments((prev) => [...prev, { id: `att-${Date.now()}`, name: asset.name || 'attachment' }]);
//   };

//   const removePendingAttachment = (id: string) => setPendingAttachments((prev) => prev.filter((a) => a.id !== id));

//   const handleSend = async () => {
//     if (!activeId) return;
//     if (!draft.trim() && pendingAttachments.length === 0) return;
//     const newMsg: ThreadMessage = { id: `local-${Date.now()}`, sender: 'coordinator', senderLabel: 'Coordinator', text: draft, timestamp: 'Just now', attachments: pendingAttachments };
//     setThread((prev) => [...prev, newMsg]);
//     setDraft('');
//     setPendingAttachments([]);
//     try {
//       await sendCoordinatorMessage(activeId, { text: newMsg.text, attachments: newMsg.attachments });
//     } catch (err) {}
//   };

//   const handleShareSchedule = () => {
//     setDraft((prev) => `${prev}${prev ? ' ' : ''}[Shared: this week's schedule]`);
//   };

//   const handleShareProgress = () => {
//     setDraft((prev) => `${prev}${prev ? ' ' : ''}[Shared: progress chart]`);
//   };

//   const handleEscalate = (to: string) => {
//     if (!activeId) return;
//     Alert.alert(`Escalate to ${to === 'program_director' ? 'Program Director' : 'Director'}?`, undefined, [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Escalate',
//         onPress: async () => {
//           try { await escalateConversation(activeId, { to }); } catch (err) {}
//           Alert.alert('Escalated', `${to === 'program_director' ? 'Program Director' : 'Director'} notified.`);
//         },
//       },
//     ]);
//   };

//   const handleResolve = async () => {
//     if (!activeId) return;
//     try { await markConversationResolved(activeId); } catch (err) {}
//     setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, resolved: true } : c)));
//     Alert.alert('Marked as resolved');
//   };

//   return (
//     <SafeAreaView style={styles.safe}>
//       <CoordinatorNav activeTab="Parents" onTabPress={(t) => t !== 'Parents' && navigation?.navigate?.(navRouteForTab(t) as never)} />

//       <View style={styles.body}>
//         <View style={styles.sidebar}>
//           <View style={styles.sidebarTabs}>
//             <TouchableOpacity style={[styles.sidebarTab, tab === 'active' && styles.sidebarTabActive]} onPress={() => setTab('active')}>
//               <Text style={typography.body}>Conversations</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={[styles.sidebarTab, tab === 'log' && styles.sidebarTabActive]} onPress={() => setTab('log')}>
//               <Text style={typography.body}>Log</Text>
//             </TouchableOpacity>
//           </View>
//           <ScrollView>
//             {conversations.map((c) => (
//               <TouchableOpacity key={c.id} style={[styles.convoRow, activeId === c.id && styles.convoRowActive]} onPress={() => setActiveId(c.id)}>
//                 <Text style={typography.bodyBold}>{c.studentName}</Text>
//                 <Text style={typography.caption} numberOfLines={1}>{c.lastMessagePreview}</Text>
//                 {c.unreadCount > 0 && (
//                   <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{c.unreadCount}</Text></View>
//                 )}
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </View>

//         <View style={styles.chatPane}>
//           {activeConversation ? (
//             <>
//               <View style={styles.chatHeader}>
//                 <Text style={typography.h3}>{activeConversation.studentName} — {activeConversation.parentName}</Text>
//                 <View style={styles.chatHeaderActions}>
//                   <TouchableOpacity onPress={() => handleEscalate('program_director')}>
//                     <Text style={styles.escalateText}>Escalate to PD</Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity onPress={() => handleEscalate('director')}>
//                     <Text style={styles.escalateText}>Escalate to Director</Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity onPress={handleResolve}>
//                     <Feather name="check-circle" size={18} color={colors.navyText} />
//                   </TouchableOpacity>
//                 </View>
//               </View>
//               <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesContent}>
//                 {thread.map((m) => (
//                   <View key={m.id} style={[styles.messageBubble, m.sender === 'coordinator' && styles.messageBubbleMine]}>
//                     <Text style={typography.caption}>{m.senderLabel}</Text>
//                     {m.text ? <Text style={typography.body}>{m.text}</Text> : null}
//                     {m.attachments?.map((a) => (
//                       <View key={a.id} style={styles.messageAttachmentRow}>
//                         <Feather name="paperclip" size={12} color={colors.mutedText} />
//                         <Text style={styles.messageAttachmentText} numberOfLines={1}>{a.name}</Text>
//                       </View>
//                     ))}
//                   </View>
//                 ))}
//               </ScrollView>
//               <View style={styles.quickActionsRow}>
//                 <TouchableOpacity style={styles.quickActionBtn} onPress={handleShareSchedule}>
//                   <Text style={styles.quickActionText}>Share Schedule</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={styles.quickActionBtn} onPress={handleShareProgress}>
//                   <Text style={styles.quickActionText}>Share Progress</Text>
//                 </TouchableOpacity>
//               </View>
//               {pendingAttachments.length > 0 && (
//                 <View style={styles.pendingRow}>
//                   {pendingAttachments.map((a) => (
//                     <View key={a.id} style={styles.pendingChip}>
//                       <Feather name="paperclip" size={11} color={colors.navyText} />
//                       <Text style={styles.pendingChipText} numberOfLines={1}>{a.name}</Text>
//                       <TouchableOpacity onPress={() => removePendingAttachment(a.id)}>
//                         <Feather name="x" size={12} color={colors.navyText} />
//                       </TouchableOpacity>
//                     </View>
//                   ))}
//                 </View>
//               )}
//               <View style={styles.composerRow}>
//                 <TouchableOpacity style={styles.attachBtn} onPress={handleAttach}>
//                   <Feather name="paperclip" size={16} color={colors.navyText} />
//                 </TouchableOpacity>
//                 <TextInput style={styles.composerInput} placeholder="Type a message..." placeholderTextColor={colors.mutedText} value={draft} onChangeText={setDraft} />
//                 <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
//                   <Feather name="send" size={16} color={colors.navyText} />
//                 </TouchableOpacity>
//               </View>
//             </>
//           ) : (
//             <View style={styles.emptyState}>
//               <Feather name="message-circle" size={40} color={colors.mutedText} />
//               <Text style={typography.body}>Select a conversation</Text>
//             </View>
//           )}
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// function navRouteForTab(tab: string): keyof CoordinatorStackParamList {
//   return ({
//     Dashboard: 'CoordinatorDashboard',
//     'Live Sessions': 'LiveSessionMonitoring',
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

// const DEMO_CONVERSATIONS: Conversation[] = [
//   { id: '1', studentName: 'Student A', parentName: 'Parent A', lastMessagePreview: 'Thank you for the update!', unreadCount: 2, resolved: false },
//   { id: '2', studentName: 'Student B', parentName: 'Parent B', lastMessagePreview: 'Can we schedule a meeting?', unreadCount: 0, resolved: false },
// ];
// const DEMO_THREAD: ThreadMessage[] = [
//   { id: '1', sender: 'parent', senderLabel: 'Parent A', text: 'How did today\u2019s session go?', timestamp: '10:00 AM' },
//   { id: '2', sender: 'coordinator', senderLabel: 'Coordinator', text: 'Great progress on requesting items!', timestamp: '10:15 AM', attachments: [{ id: 'att-1', name: 'goals_overview.pdf' }] },
// ];

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: colors.bgApp },
//   body: { flex: 1, flexDirection: 'row' },
//   sidebar: { width: 220, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.bgCard },
//   sidebarTabs: { flexDirection: 'row', padding: spacing.sm, gap: spacing.xs },
//   sidebarTab: { flex: 1, paddingVertical: spacing.xs, alignItems: 'center', borderRadius: radius.sm },
//   sidebarTabActive: { backgroundColor: colors.bgApp },
//   convoRow: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
//   convoRowActive: { backgroundColor: colors.bgApp },
//   unreadBadge: { position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: colors.primaryYellow, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
//   unreadBadgeText: { fontSize: 9, fontWeight: '700', color: colors.navyText },
//   chatPane: { flex: 1 },
//   chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
//   chatHeaderActions: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
//   escalateText: { fontSize: 11, fontWeight: '600', color: colors.statusInProgressText },
//   messagesScroll: { flex: 1 },
//   messagesContent: { padding: spacing.lg, gap: spacing.sm },
//   messageBubble: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, maxWidth: '75%', alignSelf: 'flex-start' },
//   messageBubbleMine: { backgroundColor: '#DBEAFE', alignSelf: 'flex-end' },
//   messageAttachmentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.bgApp },
//   messageAttachmentText: { fontSize: 10, fontWeight: '600', color: colors.navyText, flex: 1 },
//   pendingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
//   pendingChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.primaryYellowDark, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4, backgroundColor: colors.statusPendingBg },
//   pendingChipText: { fontSize: 10, fontWeight: '600', color: colors.navyText, maxWidth: 160 },
//   quickActionsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
//   quickActionBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
//   quickActionText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
//   composerRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
//   composerInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
//   attachBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
//   sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryYellow, alignItems: 'center', justifyContent: 'center' },
//   emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
// });
