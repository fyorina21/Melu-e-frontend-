import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import ParentNav, { PARENT_ROUTE_BY_TAB } from './components/ParentNav';
import { getParentConversations, getParentConversationThread, sendParentMessage, setParentConversationResolved } from '../../api/parentApi';
import type { ParentStackParamList } from '../../types';

const QUICK_TEMPLATES = [
  'How did today\u2019s session go?',
  'Can we schedule a meeting?',
  'Thank you for the update!',
];

interface Conversation {
  id: string;
  teamMemberName: string;
  teamMemberRole: string;
  lastMessagePreview: string;
  unreadCount: number;
  escalated: boolean;
  status: 'open' | 'resolved';
}

interface ThreadMessage {
  id: string;
  sender: string;
  senderLabel: string;
  roleTag: string | null;
  text: string;
  timestamp?: string;
  attachments?: { id: string; name: string }[];
}

export default function ParentCommunicationScreen({ navigation }: NativeStackScreenProps<ParentStackParamList, 'ParentCommunication'>) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [showLog, setShowLog] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<{ id: string; name: string }[]>([]);

  const loadList = useCallback(async () => {
    try {
      const { data } = await getParentConversations();
      setConversations(data);
      if (!activeId && data.length) setActiveId(data[0].id);
    } catch (err) {
      setConversations(DEMO_CONVERSATIONS);
      if (!activeId) setActiveId(DEMO_CONVERSATIONS[0].id);
    }
  }, [activeId]);

  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    if (!activeId) return;
    getParentConversationThread(activeId).then(({ data }) => setThread(data.messages)).catch(() => setThread(DEMO_THREAD));
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
    if (!draft.trim() && pendingAttachments.length === 0) return;
    const newMsg: ThreadMessage = { id: `local-${Date.now()}`, sender: 'parent', senderLabel: 'You', roleTag: null, text: draft, attachments: pendingAttachments };
    setThread((prev) => [...prev, newMsg]);
    setDraft('');
    setPendingAttachments([]);
    try { await sendParentMessage(activeId!, { text: newMsg.text, attachments: newMsg.attachments }); } catch (err) {}
  };

  const handleToggleResolved = async () => {
    if (!activeConversation) return;
    const next = activeConversation.status !== 'resolved';
    try { await setParentConversationResolved(activeConversation.id, next); } catch (err) {}
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, status: next ? 'resolved' : 'open' } : c))
    );
    Alert.alert(next ? 'Thread closed' : 'Thread reopened', next
      ? 'This conversation is now marked as resolved. You can reopen it at any time.'
      : 'This conversation has been reopened.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ParentNav activeTab="Messages" onTabPress={(t) => navigation?.navigate?.(PARENT_ROUTE_BY_TAB[t])} />
      <View style={styles.body}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarTabs}>
            <TouchableOpacity style={[styles.sidebarTab, !showLog && styles.sidebarTabActive]} onPress={() => setShowLog(false)}>
              <Text style={typography.body}>Conversations</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sidebarTab, showLog && styles.sidebarTabActive]} onPress={() => setShowLog(true)}>
              <Text style={typography.body}>Log</Text>
            </TouchableOpacity>
          </View>
          {!showLog && (
            <ScrollView>
              {conversations.map((c) => (
                <TouchableOpacity key={c.id} style={[styles.convoRow, activeId === c.id && styles.convoRowActive]} onPress={() => setActiveId(c.id)}>
                  <Text style={typography.bodyBold}>{c.teamMemberName}</Text>
                  <Text style={typography.caption} numberOfLines={1}>{c.lastMessagePreview}</Text>
                  {c.unreadCount > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{c.unreadCount}</Text></View>}
                  {c.escalated && <Text style={styles.escalatedTag}>Escalated</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
        <View style={styles.chatPane}>
          {activeConversation && !showLog ? (
            <>
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderRow}>
                  <View>
                    <Text style={typography.h3}>{activeConversation.teamMemberName}</Text>
                    <Text style={typography.caption}>{activeConversation.teamMemberRole}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.resolveBtn, activeConversation.status === 'resolved' && styles.resolveBtnDone]}
                    onPress={handleToggleResolved}
                    accessibilityLabel={activeConversation.status === 'resolved' ? 'Reopen conversation' : 'Mark as resolved'}
                  >
                    <Feather name={activeConversation.status === 'resolved' ? 'rotate-ccw' : 'check-circle'} size={13} color={colors.navyText} />
                    <Text style={styles.resolveBtnText}>
                      {activeConversation.status === 'resolved' ? 'Reopen' : 'Mark as Resolved'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesContent}>
                {thread.map((m) => (
                  <View key={m.id} style={[styles.messageBubble, m.sender === 'parent' && styles.messageBubbleMine]}>
                    <Text style={typography.caption}>{m.senderLabel}{m.roleTag ? ` (${m.roleTag})` : ''}</Text>
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
                {QUICK_TEMPLATES.map((t) => (
                  <TouchableOpacity key={t} style={styles.quickActionBtn} onPress={() => setDraft(t)}>
                    <Text style={styles.quickActionText}>{t}</Text>
                  </TouchableOpacity>
                ))}
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
          ) : showLog && activeConversation ? (
            <ScrollView contentContainerStyle={styles.logContent}>
              <Text style={typography.h3}>Communication Log</Text>
              <Text style={typography.caption}>
                {activeConversation.teamMemberName} · {activeConversation.teamMemberRole} ·{' '}
                {activeConversation.status === 'resolved' ? 'Resolved' : 'Open'}
              </Text>
              <View style={styles.logList}>
                {thread.length === 0 && <Text style={[typography.body, { color: colors.mutedText }]}>No messages recorded yet.</Text>}
                {thread.map((m) => (
                  <View key={m.id} style={styles.logRow}>
                    <View style={styles.logRowHeader}>
                      <Text style={typography.bodyBold}>{m.senderLabel}</Text>
                      {m.roleTag ? <Text style={styles.logRoleTag}>{m.roleTag}</Text> : null}
                      <Text style={styles.logTime}>{m.timestamp ?? new Date().toLocaleTimeString()}</Text>
                    </View>
                    {m.text ? <Text style={typography.body}>{m.text}</Text> : null}
                    {m.attachments?.length ? (
                      <Text style={styles.logAttachments}>Attachments: {m.attachments.map((a) => a.name).join(', ')}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="message-circle" size={40} color={colors.mutedText} />
              <Text style={typography.body}>{showLog ? 'Select a conversation to view its audit log' : 'Select a conversation'}</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const DEMO_CONVERSATIONS: Conversation[] = [
  { id: '1', teamMemberName: 'Teacher A', teamMemberRole: 'Teacher', lastMessagePreview: 'Great progress today!', unreadCount: 1, escalated: false, status: 'open' },
  { id: '2', teamMemberName: 'Coordinator A', teamMemberRole: 'Coordinator', lastMessagePreview: 'Escalated: scheduling question', unreadCount: 0, escalated: true, status: 'open' },
];
const DEMO_THREAD: ThreadMessage[] = [
  { id: '1', sender: 'team', senderLabel: 'Teacher A', roleTag: 'Teacher', text: 'Student A had a great session today!', timestamp: '10:15 AM', attachments: [{ id: 'att-1', name: 'session_progress.pdf' }] },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  body: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 220, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.bgCard },
  sidebarTabs: { flexDirection: 'row', padding: spacing.sm, gap: spacing.xs },
  sidebarTab: { flex: 1, paddingVertical: spacing.xs, alignItems: 'center', borderRadius: radius.sm },
  sidebarTabActive: { backgroundColor: colors.bgApp },
  convoRow: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  convoRowActive: { backgroundColor: colors.bgApp },
  unreadBadge: { position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: colors.primaryYellow, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  unreadBadgeText: { fontSize: 9, fontWeight: '700', color: colors.navyText },
  escalatedTag: { fontSize: 10, fontWeight: '700', color: '#EF4444', marginTop: 2 },
  chatPane: { flex: 1 },
  chatHeader: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  chatHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  resolveBtnDone: { backgroundColor: colors.statusCompletedBg, borderColor: colors.statusCompletedText },
  resolveBtnText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  logContent: { padding: spacing.lg, gap: spacing.sm },
  logList: { gap: spacing.md, marginTop: spacing.sm },
  logRow: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  logRowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logRoleTag: { fontSize: 10, fontWeight: '700', color: colors.navyText, backgroundColor: colors.statusPendingBg, borderRadius: radius.sm, paddingHorizontal: spacing.xs, paddingVertical: 1, overflow: 'hidden' },
  logTime: { marginLeft: 'auto', fontSize: 10, color: colors.mutedText },
  logAttachments: { fontSize: 11, fontWeight: '600', color: colors.mutedText, fontStyle: 'italic' },
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
});
