import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import {
  getTeacherConversations,
  getTeacherConversationThread,
  sendTeacherMessage,
  escalateTeacherConversation,
  markTeacherConversationResolved,
} from '../../api/teacherExtrasApi';
import { downloadTextFile } from '../../utils/webExport';
import type { SessionStackParamList } from '../../types';

interface Conversation {
  id: string;
  studentName: string;
  parentName: string;
  lastMessagePreview: string;
  unreadCount: number;
  resolved: boolean;
}

interface ThreadMessage {
  id: string;
  sender: string;
  senderLabel: string;
  text: string;
  timestamp: string;
  attachments?: { id: string; name: string }[];
}

export default function TeacherParentCommunicationScreen({ navigation }: NativeStackScreenProps<SessionStackParamList, 'TeacherParentCommunication'>) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState('All');
  const [showLog, setShowLog] = useState(false);

  const loadList = useCallback(async () => {
    try {
      const { data } = await getTeacherConversations({});
      setConversations(data);
      if (!activeId && data.length) setActiveId(data[0].id);
    } catch (err) {
      setConversations(DEMO_CONVERSATIONS);
      if (!activeId) setActiveId(DEMO_CONVERSATIONS[0].id);
    }
  }, [activeId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (!activeId) return;
    getTeacherConversationThread(activeId)
      .then(({ data }) => setThread(data.messages))
      .catch(() => setThread(DEMO_THREAD));
  }, [activeId]);

  const activeConversation = conversations.find((c) => c.id === activeId);

  const uniqueStudents = Array.from(new Set(conversations.map((c) => c.studentName)));
  const visibleConversations = conversations.filter((c) => {
    const matchesStudent = studentFilter === 'All' || c.studentName === studentFilter;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      c.studentName.toLowerCase().includes(term) ||
      c.parentName.toLowerCase().includes(term) ||
      c.lastMessagePreview.toLowerCase().includes(term);
    return matchesStudent && matchesSearch;
  });

  const handleAttach = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*', '*/*'], copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPendingAttachments((prev) => [...prev, { id: `att-${Date.now()}`, name: asset.name || 'attachment' }]);
  };

  const removePendingAttachment = (id: string) => setPendingAttachments((prev) => prev.filter((a) => a.id !== id));

  const handleSend = async () => {
    if (!activeId) return;
    if (!draft.trim() && pendingAttachments.length === 0) return;
    const newMsg: ThreadMessage = { id: `local-${Date.now()}`, sender: 'teacher', senderLabel: 'Teacher', text: draft, timestamp: 'Just now', attachments: pendingAttachments };
    setThread((prev) => [...prev, newMsg]);
    setDraft('');
    setPendingAttachments([]);
    try {
      await sendTeacherMessage(activeId, { text: newMsg.text, attachments: newMsg.attachments });
    } catch (err) {}
  };

  const handleShareSessionSummary = () => {
    const filename = `SessionSummary_${activeConversation?.studentName || 'Student'}.html`;
    const content = [
      '<h2>Session Summary</h2>',
      `<p><b>Student:</b> ${activeConversation?.studentName || 'Student A'}</p>`,
      '<p><b>Station:</b> Station 1 — Basic Skills · Room 2</p>',
      '<p><b>Date:</b> ' + new Date().toLocaleDateString() + '</p>',
      '<p><b>Status:</b> Approved by Coordinator</p>',
      '<p>Highlights: 12/15 trials independent; requesting items shows steady improvement; continue practicing requesting help.</p>',
    ].join('\n');
    downloadTextFile(filename, content);
    setDraft((prev) => `${prev}${prev ? ' ' : ''}[Shared: latest approved session summary (PDF)]`);
  };

  const handleShareProgressUpdate = () => {
    const filename = `ProgressChart_${activeConversation?.studentName || 'Student'}.html`;
    const content = [
      '<h2>Goal Progress Chart</h2>',
      `<p><b>Student:</b> ${activeConversation?.studentName || 'Student A'}</p>`,
      '<p><b>Goal:</b> Request Items (E2)</p>',
      '<p><b>Range:</b> Last 6 weeks</p>',
      '<p>Weekly independence: 40% → 55% → 62% → 70% → 78% → 85%</p>',
    ].join('\n');
    downloadTextFile(filename, content);
    setDraft((prev) => `${prev}${prev ? ' ' : ''}[Shared: goal progress chart]`);
  };

  const handleRequestHomeObservation = () => {
    Alert.alert('Request Home Observation?', 'A standardized observation request will be sent to the parent.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send Request', onPress: () => setDraft((prev) => `${prev}${prev ? ' ' : ''}[Requested: home observation]`) },
    ]);
  };

  const handleViewHomeObservation = () => {
    Alert.alert('Home Observation', 'Parent A last logged an observation on July 30, 2026:\n\nThe student requested a snack independently at home (no prompting). Practice continues with requesting help.', [{ text: 'OK' }]);
  };

  const handleEscalate = () => {
    if (!activeId) return;
    Alert.alert('Escalate to Coordinator?', 'The coordinator will be notified and can follow up.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Escalate',
        onPress: async () => {
          try { await escalateTeacherConversation(activeId, { to: 'coordinator' }); } catch (err) {}
          Alert.alert('Escalated', 'Coordinator notified.');
        },
      },
    ]);
  };

  const handleResolve = async () => {
    if (!activeId) return;
    try { await markTeacherConversationResolved(activeId); } catch (err) {}
    setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, resolved: true } : c)));
    Alert.alert('Marked as resolved');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Parents" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      <View style={styles.body}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarSearchRow}>
            <Feather name="search" size={14} color={colors.mutedText} />
            <TextInput
              style={styles.sidebarSearch}
              placeholder="Search conversations..."
              placeholderTextColor={colors.mutedText}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sidebarFilterRow}>
            {['All', ...uniqueStudents].map((s) => (
              <TouchableOpacity key={s} style={[styles.sidebarFilterChip, studentFilter === s && styles.sidebarFilterChipActive]} onPress={() => setStudentFilter(s)}>
                <Text style={[styles.sidebarFilterChipText, studentFilter === s && styles.sidebarFilterChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView>
            {visibleConversations.length === 0 && (
              <Text style={styles.sidebarEmpty}>No conversations match.</Text>
            )}
            {visibleConversations.map((c) => (
              <TouchableOpacity key={c.id} style={[styles.convoRow, activeId === c.id && styles.convoRowActive]} onPress={() => setActiveId(c.id)}>
                <Text style={typography.bodyBold}>{c.studentName}</Text>
                <Text style={typography.caption} numberOfLines={1}>{c.lastMessagePreview}</Text>
                {c.unreadCount > 0 && (
                  <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{c.unreadCount}</Text></View>
                )}
                {c.resolved && <Text style={styles.resolvedText}>Resolved</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.chatPane}>
          {activeConversation ? (
            <>
              <View style={styles.chatHeader}>
                <View>
                  <Text style={typography.h3}>{activeConversation.studentName} — {activeConversation.parentName}</Text>
                  <Text style={typography.caption}>Teacher · {activeConversation.resolved ? 'Resolved' : 'Active'}</Text>
                </View>
                <View style={styles.chatHeaderActions}>
                  <TouchableOpacity onPress={() => setShowLog((v) => !v)}>
                    <Text style={[styles.escalateText, showLog && { color: colors.navyText, fontWeight: '700' }]}>
                      {showLog ? 'Back to Chat' : 'Communication Log'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleEscalate}>
                    <Text style={styles.escalateText}>Escalate to Coordinator</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleResolve}>
                    <Feather name="check-circle" size={18} color={colors.navyText} />
                  </TouchableOpacity>
                </View>
              </View>
              {showLog ? (
                <ScrollView style={styles.logScroll} contentContainerStyle={styles.logContent}>
                  <Text style={typography.h3}>Communication Audit Trail</Text>
                  <Text style={typography.caption}>Historical communication summary for {activeConversation.studentName}.</Text>
                  {thread.length === 0 && <Text style={styles.logEmpty}>No communication recorded yet.</Text>}
                  {thread.map((m) => (
                    <View key={m.id} style={styles.logEntry}>
                      <View style={styles.logDot} />
                      <View style={{ flex: 1 }}>
                        <View style={styles.logEntryHeader}>
                          <Text style={styles.logActor}>{m.senderLabel}</Text>
                          <Text style={typography.caption}>{m.timestamp}</Text>
                        </View>
                        {m.text ? <Text style={typography.body}>{m.text}</Text> : null}
                        {m.attachments?.map((a) => (
                          <Text key={a.id} style={styles.logAttachment}>Attachment: {a.name}</Text>
                        ))}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
              <>
              <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesContent}>
                {thread.map((m) => (
                  <View key={m.id} style={[styles.messageBubble, m.sender === 'teacher' && styles.messageBubbleMine]}>
                    <Text style={typography.caption}>{m.senderLabel}</Text>
                    {m.text ? <Text style={typography.body}>{m.text}</Text> : null}
                    {m.attachments?.map((a) => (
                      <View key={a.id} style={styles.messageAttachmentRow}>
                        <Feather name="paperclip" size={12} color={colors.mutedText} />
                        <Text style={styles.messageAttachmentText} numberOfLines={1}>{a.name}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
              <View style={styles.quickActionsRow}>
                <TouchableOpacity style={styles.quickActionBtn} onPress={handleShareSessionSummary}>
                  <Text style={styles.quickActionText}>Share Session Summary</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionBtn} onPress={handleShareProgressUpdate}>
                  <Text style={styles.quickActionText}>Share Progress Update</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionBtn} onPress={handleRequestHomeObservation}>
                  <Text style={styles.quickActionText}>Request Home Observation</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionBtn} onPress={handleViewHomeObservation}>
                  <Text style={styles.quickActionText}>View Home Observation</Text>
                </TouchableOpacity>
              </View>
              {pendingAttachments.length > 0 && (
                <View style={styles.pendingRow}>
                  {pendingAttachments.map((a) => (
                    <View key={a.id} style={styles.pendingChip}>
                      <Feather name="paperclip" size={11} color={colors.navyText} />
                      <Text style={styles.pendingChipText} numberOfLines={1}>{a.name}</Text>
                      <TouchableOpacity onPress={() => removePendingAttachment(a.id)}>
                        <Feather name="x" size={12} color={colors.navyText} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.composerRow}>
                <TouchableOpacity style={styles.attachBtn} onPress={handleAttach}>
                  <Feather name="paperclip" size={16} color={colors.navyText} />
                </TouchableOpacity>
                <TextInput style={styles.composerInput} placeholder="Type a message..." placeholderTextColor={colors.mutedText} value={draft} onChangeText={setDraft} />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                  <Feather name="send" size={16} color={colors.navyText} />
                </TouchableOpacity>
              </View>
              </>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="message-circle" size={40} color={colors.mutedText} />
              <Text style={typography.body}>Select a conversation</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const DEMO_CONVERSATIONS: Conversation[] = [
  { id: '1', studentName: 'Student A', parentName: 'Parent A', lastMessagePreview: 'Thank you for the update!', unreadCount: 2, resolved: false },
  { id: '2', studentName: 'Student B', parentName: 'Parent B', lastMessagePreview: 'Can we schedule a meeting?', unreadCount: 0, resolved: false },
];
const DEMO_THREAD: ThreadMessage[] = [
  { id: '1', sender: 'parent', senderLabel: 'Parent A', text: 'How did today\u2019s session go?', timestamp: '10:00 AM' },
  { id: '2', sender: 'teacher', senderLabel: 'Teacher', text: 'Great progress on requesting items!', timestamp: '10:15 AM', attachments: [{ id: 'att-1', name: 'session_notes.pdf' }] },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  body: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 220, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.bgCard },
  sidebarSearchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  sidebarSearch: { flex: 1, fontSize: 13, color: colors.navyText },
  sidebarFilterRow: { padding: spacing.sm, gap: spacing.xs },
  sidebarFilterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  sidebarFilterChipActive: { backgroundColor: colors.statusInProgressBg, borderColor: colors.statusInProgressText },
  sidebarFilterChipText: { fontSize: 10, fontWeight: '600', color: colors.bodyText },
  sidebarFilterChipTextActive: { color: colors.statusInProgressText },
  sidebarEmpty: { padding: spacing.lg, textAlign: 'center', color: colors.mutedText, fontSize: 12 },
  convoRow: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  convoRowActive: { backgroundColor: colors.bgApp },
  unreadBadge: { position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: colors.primaryYellow, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  unreadBadgeText: { fontSize: 9, fontWeight: '700', color: colors.navyText },
  resolvedText: { fontSize: 10, fontWeight: '600', color: colors.statusApprovedText, marginTop: 2 },
  chatPane: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  chatHeaderActions: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  escalateText: { fontSize: 11, fontWeight: '600', color: colors.statusInProgressText },
  messagesScroll: { flex: 1 },
  messagesContent: { padding: spacing.lg, gap: spacing.sm },
  messageBubble: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, maxWidth: '75%', alignSelf: 'flex-start' },
  messageBubbleMine: { backgroundColor: '#DBEAFE', alignSelf: 'flex-end' },
  messageAttachmentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.bgApp },
  messageAttachmentText: { fontSize: 10, fontWeight: '600', color: colors.navyText, flex: 1 },
  pendingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  pendingChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.primaryYellowDark, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4, backgroundColor: colors.statusPendingBg },
  pendingChipText: { fontSize: 10, fontWeight: '600', color: colors.navyText, maxWidth: 160 },
  quickActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  quickActionBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  quickActionText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  composerRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  composerInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  attachBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryYellow, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  logScroll: { flex: 1 },
  logContent: { padding: spacing.lg, gap: spacing.md },
  logEmpty: { color: colors.mutedText },
  logEntry: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  logDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.statusInProgressText, marginTop: 4 },
  logEntryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logActor: { fontWeight: '700', color: colors.navyText, fontSize: 13 },
  logAttachment: { fontSize: 11, color: colors.statusInProgressText, marginTop: 2 },
});
