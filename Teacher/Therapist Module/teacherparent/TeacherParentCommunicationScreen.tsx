// screens/teacherparent/TeacherParentCommunicationScreen.tsx
// SCR-TEA-005: Parent Communication (Teacher View) - the Teacher-side
// counterpart of the Parent Portal conversations. Mirrors the Coordinator
// Parent Communication screen layout: conversation list, thread, quick
// actions, compose. Teachers can escalate a thread to the Coordinator.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import TopNav from '../../components/TopNav';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import {
  getTeacherConversations,
  getTeacherConversationThread,
  sendTeacherMessage,
  escalateTeacherConversation,
  markTeacherConversationResolved,
} from '../../api/teacherExtrasApi';
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

  const handleShareSchedule = () => {
    setDraft((prev) => `${prev}${prev ? ' ' : ''}[Shared: this week's session schedule]`);
  };

  const handleShareProgress = () => {
    setDraft((prev) => `${prev}${prev ? ' ' : ''}[Shared: session progress summary]`);
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
      <TopNav activeTab="Parents" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      <View style={styles.body}>
        <View style={styles.sidebar}>
          <ScrollView>
            {conversations.map((c) => (
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
                  <TouchableOpacity onPress={handleEscalate}>
                    <Text style={styles.escalateText}>Escalate to Coordinator</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleResolve}>
                    <Feather name="check-circle" size={18} color={colors.navyText} />
                  </TouchableOpacity>
                </View>
              </View>
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
                <TouchableOpacity style={styles.quickActionBtn} onPress={handleShareSchedule}>
                  <Text style={styles.quickActionText}>Share Schedule</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionBtn} onPress={handleShareProgress}>
                  <Text style={styles.quickActionText}>Share Progress</Text>
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
  quickActionsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  quickActionBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  quickActionText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  composerRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  composerInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  attachBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryYellow, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
