
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getPdConversations, getPdConversationThread, sendPdMessage, escalateToDirector } from '../../api/programDirectorApi';
import type { ProgramDirectorStackParamList } from '../../types';

interface Conversation {
  id: string;
  studentName: string;
  parentName: string;
  lastMessagePreview: string;
}

interface ApiConversation {
  id: string;
  studentId?: string;
  studentName?: string;
  parentName?: string;
  recipient?: string;
  role?: string;
  unread?: number;
  lastMessage?: string;
  time?: string;
}

interface ThreadMessage {
  id: string;
  sender: string;
  senderLabel: string;
  text: string;
  timestamp?: string;
  attachments?: { id: string; name: string }[];
}

interface ApiMessage {
  id: string;
  from: 'parent' | 'team';
  senderName: string;
  text: string;
  sentAt: string;
}

function conversationRow(c: ApiConversation): Conversation {
  return {
    id: c.id,
    studentName: c.studentName ?? c.recipient ?? 'Student',
    parentName: c.parentName ?? 'Parent/Guardian',
    lastMessagePreview: c.lastMessage ?? '',
  };
}

function threadRow(m: ApiMessage): ThreadMessage {
  return {
    id: m.id,
    sender: m.from === 'parent' ? 'parent' : 'pd',
    senderLabel: m.senderName,
    text: m.text,
    timestamp: m.sentAt,
  };
}

export default function PdParentCommunicationScreen({ navigation }: NativeStackScreenProps<ProgramDirectorStackParamList, 'PdParentCommunication'>) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<{ id: string; name: string }[]>([]);

  const loadList = useCallback(async () => {
    try {
      const { data: res } = await getPdConversations({});
      const rows = (res as ApiConversation[]).map(conversationRow);
      setConversations(rows);
      if (!activeId && rows.length) setActiveId(rows[0].id);
    } catch (err) {
      setConversations([]);
    }
  }, [activeId]);

  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    if (!activeId) return;
    getPdConversationThread(activeId)
      .then(({ data }) => setThread(((data as { messages?: ApiMessage[] }).messages ?? []).map(threadRow)))
      .catch(() => setThread([]));
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
    const text = draft;
    const attachments = pendingAttachments;
    setDraft('');
    setPendingAttachments([]);
    try {
      await sendPdMessage(activeId!, { text, attachments });
      const { data } = await getPdConversationThread(activeId!);
      setThread(((data as { messages?: ApiMessage[] }).messages ?? []).map(threadRow));
    } catch (err) {}
  };

  const handleEscalate = () => {
    Alert.alert('Escalate to Director?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Escalate', onPress: async () => { try { await escalateToDirector(activeId!, {}); await loadList(); } catch (err) {} Alert.alert('Escalated to Director'); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Parents" onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t])} />
      <View style={styles.body}>
        <View style={styles.sidebar}>
          <ScrollView>
            {conversations.map((c) => (
              <TouchableOpacity key={c.id} style={[styles.convoRow, activeId === c.id && styles.convoRowActive]} onPress={() => setActiveId(c.id)}>
                <Text style={typography.bodyBold}>{c.studentName}</Text>
                <Text style={typography.caption} numberOfLines={1}>{c.lastMessagePreview}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.chatPane}>
          {activeConversation ? (
            <>
              <View style={styles.chatHeader}>
                <Text style={typography.h3}>{activeConversation.studentName} — {activeConversation.parentName}</Text>
                <TouchableOpacity onPress={handleEscalate}>
                  <Text style={styles.escalateText}>Escalate to Director</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesContent}>
                {thread.map((m) => (
                  <View key={m.id} style={[styles.messageBubble, m.sender === 'pd' && styles.messageBubbleMine]}>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  body: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 220, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.bgCard },
  convoRow: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  convoRowActive: { backgroundColor: colors.bgApp },
  chatPane: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  escalateText: { fontSize: 12, fontWeight: '600', color: colors.statusInProgressText },
  messagesScroll: { flex: 1 },
  messagesContent: { padding: spacing.lg, gap: spacing.sm },
  messageBubble: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, maxWidth: '75%', alignSelf: 'flex-start' },
  messageBubbleMine: { backgroundColor: '#DBEAFE', alignSelf: 'flex-end' },
  messageAttachmentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.bgApp },
  messageAttachmentText: { fontSize: 10, fontWeight: '600', color: colors.navyText, flex: 1 },
  pendingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  pendingChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.primaryYellowDark, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4, backgroundColor: colors.statusPendingBg },
  pendingChipText: { fontSize: 10, fontWeight: '600', color: colors.navyText, maxWidth: 160 },
  composerRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  composerInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  attachBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryYellow, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
