// screens/director/DirectorParentCommunicationScreen.js
// SCR-DIR-004: Parent Communication (Director View) - centralized hub for
// all parent interactions, including escalations from Coordinator/PD.

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import {
  getDirectorConversations,
  getDirectorConversationThread,
  sendDirectorMessage,
  toggleConversationRead,
} from '../../api/directorApi';
import { notify } from '../../utils/dialogs';
import type { DirectorStackParamList } from '../../types';

interface Conversation {
  id: string;
  studentName: string;
  parentName: string;
  lastMessagePreview: string;
  unreadCount: number;
  escalated: boolean;
}

interface ThreadMessage {
  id: string;
  sender: string;
  senderLabel: string;
  text: string;
  timestamp: string;
  attachments?: { id: string; name: string }[];
}

interface ConversationRow {
  id: string;
  studentName?: string;
  parentName?: string;
  recipient?: string;
  unread?: number;
  lastMessage?: string;
}

interface RawThreadMessage {
  id: string;
  from?: string;
  sender?: string;
  senderName?: string;
  text?: string;
  content?: string;
  message?: string;
  sentAt?: string;
  timestamp?: string;
  created_at?: string;
  isStaff?: boolean;
  attachments?: { id: string; name: string }[];
}

export default function DirectorParentCommunicationScreen({
  navigation,
}: NativeStackScreenProps<DirectorStackParamList, 'DirectorParentCommunication'>) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [showLog, setShowLog] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<{ id: string; name: string }[]>([]);
  const [exportContent, setExportContent] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [escalatedIds, setEscalatedIds] = useState<Record<string, boolean>>({});

  const loadList = useCallback(async () => {
    try {
      const { data } = await getDirectorConversations({});
      const rows = (Array.isArray(data) ? data : []) as ConversationRow[];
      setConversations(
        rows.map((c) => ({
          id: c.id,
          studentName: c.studentName ?? c.recipient ?? 'Student',
          parentName: c.parentName ?? 'Parent/Guardian',
          lastMessagePreview: c.lastMessage ?? '',
          unreadCount: c.unread ?? 0,
          escalated: false,
        })),
      );
      if (!activeId && rows.length) setActiveId(rows[0].id);
    } catch (err) {
      setConversations([]);
    }
  }, [activeId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const loadThread = useCallback(async () => {
    if (!activeId) return;
    try {
      const { data } = await getDirectorConversationThread(activeId);
      const convo = (data ?? {}) as { messages?: RawThreadMessage[] };
      setThread(
        (convo.messages ?? []).map((m) => {
          const rawDate = m.sentAt || m.timestamp || m.created_at;
          const parsedDate = rawDate ? new Date(rawDate) : null;
          const formattedTime =
            parsedDate && !isNaN(parsedDate.getTime())
              ? parsedDate.toLocaleString([], { hour: 'numeric', minute: '2-digit' })
              : rawDate || 'Today';

          return {
            id: m.id,
            sender: m.from || m.sender || 'director',
            senderLabel: m.senderName || m.sender || m.from || 'Director',
            text: m.text ?? m.content ?? m.message ?? '',
            timestamp: formattedTime,
            attachments: m.attachments,
          };
        }),
      );
    } catch (err) {
      setThread([]);
    }
  }, [activeId]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  const activeConversation = conversations.find((c) => c.id === activeId);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      [c.studentName, c.parentName, c.lastMessagePreview].some((v) => v.toLowerCase().includes(q)),
    );
  }, [conversations, search]);

  const handleToggleEscalate = () => {
    if (!activeConversation) return;
    const next = !(escalatedIds[activeConversation.id] || activeConversation.escalated);
    setEscalatedIds((prev) => ({ ...prev, [activeConversation.id]: next }));
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, escalated: next } : c)),
    );
    notify(next ? 'Conversation marked as escalated' : 'Escalation removed');
  };

  const handleAttach = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', '*/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPendingAttachments((prev) => [
      ...prev,
      { id: `att-${Date.now()}`, name: asset.name || 'attachment' },
    ]);
  };

  const removePendingAttachment = (id: string) =>
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));

  const handleSend = async () => {
    if (!activeId) return;
    if (!draft.trim() && pendingAttachments.length === 0) return;
    try {
      await sendDirectorMessage(activeId, { text: draft, attachments: pendingAttachments });
      setDraft('');
      setPendingAttachments([]);
      await loadThread();
    } catch (err) {}
  };

  const handleToggleRead = async () => {
    if (!activeId) return;
    const nextUnread = !((activeConversation?.unreadCount ?? 0) > 0);
    try {
      await toggleConversationRead(activeId, { unread: nextUnread });
      await loadList();
    } catch (err) {}
  };

  const handlePrintLog = () => {
    setExportContent(
      [
        `Melu'e Foundation — Parent Communication Log`,
        `Generated ${new Date().toLocaleString()}`,
        '',
        ...conversations
          .map((c) => [
            `${c.studentName} (${c.parentName})${c.escalated ? ' [ESCALATED]' : ''}`,
            `  Unread: ${c.unreadCount} · Last: ${c.lastMessagePreview}`,
          ])
          .flat(),
        conversations.length === 0 ? '(no conversations)' : '',
      ].join('\n'),
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Parents"
        onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t])}
      />
      <View style={styles.body}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarTabs}>
            <TouchableOpacity
              style={[styles.sidebarTab, !showLog && styles.sidebarTabActive]}
              onPress={() => setShowLog(false)}
            >
              <Text style={typography.body}>Conversations</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sidebarTab, showLog && styles.sidebarTabActive]}
              onPress={() => setShowLog(true)}
            >
              <Text style={typography.body}>Log</Text>
            </TouchableOpacity>
          </View>
          {showLog ? (
            <View style={{ padding: spacing.md }}>
              <TouchableOpacity style={styles.printBtn} onPress={handlePrintLog}>
                <Text style={styles.printBtnText}>Print Communication Log</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <View style={styles.searchWrap}>
                <Feather name="search" size={14} color={colors.mutedText} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search conversations..."
                  placeholderTextColor={colors.mutedText}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              <ScrollView>
                {filteredConversations.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.convoRow, activeId === c.id && styles.convoRowActive]}
                    onPress={() => setActiveId(c.id)}
                  >
                    <Text style={typography.bodyBold}>{c.studentName}</Text>
                    <Text style={typography.caption} numberOfLines={1}>
                      {c.lastMessagePreview}
                    </Text>
                    {(escalatedIds[c.id] || c.escalated) && (
                      <Text style={styles.escalatedTag}>Escalated</Text>
                    )}
                  </TouchableOpacity>
                ))}
                {filteredConversations.length === 0 && (
                  <Text style={[typography.caption, styles.noResults]}>
                    No conversations match "{search}"
                  </Text>
                )}
              </ScrollView>
            </View>
          )}
        </View>
        <View style={styles.chatPane}>
          {activeConversation && !showLog ? (
            <>
              <View style={styles.chatHeader}>
                <Text style={typography.h3}>
                  {activeConversation.studentName} — {activeConversation.parentName}
                </Text>
                <View style={styles.chatHeaderActions}>
                  <TouchableOpacity
                    style={[
                      styles.escalateBtn,
                      (escalatedIds[activeConversation.id] || activeConversation.escalated) &&
                        styles.escalateBtnActive,
                    ]}
                    onPress={handleToggleEscalate}
                  >
                    <Feather
                      name="alert-triangle"
                      size={14}
                      color={
                        escalatedIds[activeConversation.id] || activeConversation.escalated
                          ? colors.white
                          : colors.navyText
                      }
                    />
                    <Text
                      style={[
                        escalatedIds[activeConversation.id] || activeConversation.escalated
                          ? styles.escalateBtnTextActive
                          : styles.escalateBtnText,
                      ]}
                    >
                      {escalatedIds[activeConversation.id] || activeConversation.escalated
                        ? 'Escalated'
                        : 'Escalate'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleToggleRead}>
                    <Feather
                      name={activeConversation.unreadCount > 0 ? 'mail' : 'inbox'}
                      size={18}
                      color={colors.navyText}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <ScrollView
                style={styles.messagesScroll}
                contentContainerStyle={styles.messagesContent}
              >
                {thread.map((m) => {
                  const isMine =
                    m.sender.toLowerCase().includes('director') ||
                    m.sender.toLowerCase().includes('team') ||
                    m.sender.toLowerCase().includes('staff');
                  return (
                    <View
                      key={m.id}
                      style={[styles.messageBubble, isMine && styles.messageBubbleMine]}
                    >
                      <Text style={typography.caption}>{m.senderLabel}</Text>
                      {m.text ? <Text style={typography.body}>{m.text}</Text> : null}
                      {m.attachments?.map((a) => (
                        <View key={a.id} style={styles.messageAttachmentRow}>
                          <Feather name="paperclip" size={12} color={colors.mutedText} />
                          <Text style={styles.messageAttachmentText} numberOfLines={1}>
                            {a.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </ScrollView>
              {pendingAttachments.length > 0 && (
                <View style={styles.pendingRow}>
                  {pendingAttachments.map((a) => (
                    <View key={a.id} style={styles.pendingChip}>
                      <Feather name="paperclip" size={11} color={colors.navyText} />
                      <Text style={styles.pendingChipText} numberOfLines={1}>
                        {a.name}
                      </Text>
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
                <TextInput
                  style={styles.composerInput}
                  placeholder="Type a message..."
                  placeholderTextColor={colors.mutedText}
                  value={draft}
                  onChangeText={setDraft}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                  <Feather name="send" size={16} color={colors.navyText} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="message-circle" size={40} color={colors.mutedText} />
              <Text style={typography.body}>
                {showLog ? 'Select "Print Communication Log" to export' : 'Select a conversation'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ExportPreviewModal
        visible={!!exportContent}
        title="Communication Log Export"
        filename={`ParentCommunicationLog_${new Date().toISOString().slice(0, 10)}.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  body: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 220,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  sidebarTabs: { flexDirection: 'row', padding: spacing.sm, gap: spacing.xs },
  sidebarTab: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  sidebarTabActive: { backgroundColor: colors.bgApp },
  convoRow: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  convoRowActive: { backgroundColor: colors.bgApp },
  escalatedTag: { fontSize: 10, fontWeight: '700', color: '#EF4444', marginTop: 2 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    margin: spacing.sm,
    marginBottom: 0,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.bgApp,
  },
  searchInput: { flex: 1, paddingVertical: spacing.xs, fontSize: 13, color: colors.navyText },
  noResults: { padding: spacing.md, textAlign: 'center' },
  printBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  printBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  chatPane: { flex: 1 },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  escalateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  escalateBtnActive: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  escalateBtnText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  escalateBtnTextActive: { fontSize: 11, fontWeight: '600', color: colors.white },
  messagesScroll: { flex: 1 },
  messagesContent: { padding: spacing.lg, gap: spacing.sm },
  messageBubble: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    maxWidth: '75%',
    alignSelf: 'flex-start',
  },
  messageBubbleMine: { backgroundColor: '#DBEAFE', alignSelf: 'flex-end' },
  messageAttachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.bgApp,
  },
  messageAttachmentText: { fontSize: 10, fontWeight: '600', color: colors.navyText, flex: 1 },
  pendingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  pendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primaryYellowDark,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: colors.statusPendingBg,
  },
  pendingChipText: { fontSize: 10, fontWeight: '600', color: colors.navyText, maxWidth: 160 },
  composerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  composerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
