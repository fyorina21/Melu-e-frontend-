import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import AppNavbar from '../../../../components/AppNavbar';
import ScreenLoader from '../../../../components/ScreenLoader';
import { handleTeacherTabPress } from '../../../../navigation/teacherTabNavigation';
import { PD_ROUTE_BY_TAB } from '../../../../components/appNavConfig';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import {
  getTeacherConversations,
  getTeacherConversationThread,
  sendTeacherMessage,
  escalateTeacherConversation,
  markTeacherConversationResolved,
} from '../../../../api/teacherExtrasApi';
import { downloadTextFile } from '../../../../utils/webExport';
import {
  type TeacherConversation,
  type TeacherThreadMessage,
  TEACHER_COLOR,
  filterTeacherConversations,
} from '../types';

export function TeacherCommunicationPanel({ navigation }: { navigation: any }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { session } = useAuth();
  const { showToast } = useToast();
  const isProgramDirector = session?.role === 'program_director';

  const [conversations, setConversations] = useState<TeacherConversation[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<TeacherThreadMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState('All');

  const loadList = useCallback(async () => {
    try {
      const { data } = await getTeacherConversations({});
      setConversations(data);
      if (!activeId && data.length) setActiveId(data[0].id);
    } catch {
      setConversations([]);
    } finally {
      setListLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (!activeId) return;
    getTeacherConversationThread(activeId)
      .then(({ data }) => setThread(data.messages ?? []))
      .catch(() => setThread([]));
  }, [activeId]);

  const activeConversation = conversations.find((c) => c.id === activeId);
  const uniqueStudents = useMemo(
    () => Array.from(new Set(conversations.map((c) => c.studentName))),
    [conversations],
  );

  const visibleConversations = useMemo(
    () => filterTeacherConversations(conversations, studentFilter, search),
    [conversations, studentFilter, search],
  );

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
    const newMsg: TeacherThreadMessage = {
      id: `local-${Date.now()}`,
      sender: 'teacher',
      senderLabel: 'Teacher',
      text: draft,
      timestamp: 'Just now',
      attachments: pendingAttachments,
    };
    setThread((prev) => [...prev, newMsg]);
    setDraft('');
    setPendingAttachments([]);
    try {
      await sendTeacherMessage(activeId, { text: newMsg.text, attachments: newMsg.attachments });
      showToast('Message sent', 'success');
    } catch {
      showToast('Message saved locally', 'info');
    }
  };

  const handleShareSessionSummary = () => {
    const filename = `SessionSummary_${activeConversation?.studentName || 'Student'}.html`;
    const content = `
      <h2>Session Summary</h2>
      <p><b>Student:</b> ${activeConversation?.studentName || 'Student'}</p>
      <p><b>Station:</b> Station 1 — Basic Skills · Room 2</p>
      <p><b>Date:</b> ${new Date().toLocaleDateString()}</p>
      <p><b>Status:</b> Approved by Coordinator</p>
      <p>Highlights: 12/15 trials independent; requesting items shows steady improvement; continue practicing requesting help.</p>
    `;
    downloadTextFile(filename, content);
    setDraft((prev) => `${prev}${prev ? ' ' : ''}[Shared: latest approved session summary (PDF)]`);
    showToast('Session summary shared', 'success');
  };

  const handleShareProgressUpdate = () => {
    const filename = `ProgressChart_${activeConversation?.studentName || 'Student'}.html`;
    const content = `
      <h2>Goal Progress Chart</h2>
      <p><b>Student:</b> ${activeConversation?.studentName || 'Student'}</p>
      <p><b>Goal:</b> Request Items (E2)</p>
      <p><b>Range:</b> Last 6 weeks</p>
      <p>Weekly independence: 40% → 55% → 62% → 70% → 78% → 85%</p>
    `;
    downloadTextFile(filename, content);
    setDraft((prev) => `${prev}${prev ? ' ' : ''}[Shared: goal progress chart]`);
    showToast('Progress chart shared', 'success');
  };

  const handleRequestHomeObservation = () => {
    Alert.alert(
      'Request Home Observation?',
      'A standardized observation request will be sent to the parent.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: () =>
            setDraft((prev) => `${prev}${prev ? ' ' : ''}[Requested: home observation]`),
        },
      ],
    );
  };

  const handleViewHomeObservation = () => {
    Alert.alert(
      'Home Observation',
      'Parent A last logged an observation on July 30, 2026:\n\nThe student requested a snack independently at home (no prompting). Practice continues with requesting help.',
      [{ text: 'OK' }],
    );
  };

  const handleEscalate = () => {
    if (!activeId) return;
    Alert.alert('Escalate to Coordinator?', 'The coordinator will be notified and can follow up.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Escalate',
        onPress: async () => {
          try {
            await escalateTeacherConversation(activeId, { to: 'coordinator' });
          } catch {
            // locally handled
          }
          Alert.alert('Escalation sent');
          showToast('Conversation escalated to Coordinator', 'success');
        },
      },
    ]);
  };

  const handleResolve = () => {
    if (!activeId) return;
    Alert.alert('Mark Conversation Resolved?', 'This will archive the active thread status.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await markTeacherConversationResolved(activeId);
          } catch {
            // locally handled
          }
          setConversations((prev) =>
            prev.map((c) => (c.id === activeId ? { ...c, resolved: true } : c)),
          );
          Alert.alert('Conversation marked as resolved');
          showToast('Conversation marked as resolved', 'success');
        },
      },
    ]);
  };

  if (listLoading) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Parents"
        onTabPress={(tab) =>
          isProgramDirector
            ? navigation?.navigate?.(PD_ROUTE_BY_TAB[tab] as never)
            : handleTeacherTabPress(navigation, tab)
        }
      />
      <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
        <View style={styles.body}>
          {/* Sidebar */}
          <View style={[styles.sidebar, isTablet && styles.tabletSidebar]}>
            <View style={styles.searchArea}>
              <Text style={styles.sidebarLabel}>Messages</Text>
              <View style={styles.searchWrap}>
                <Feather name="search" size={14} color="#94A3B8" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search student/parent..."
                  placeholderTextColor="#94A3B8"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterTabs}
              >
                <TouchableOpacity
                  onPress={() => setStudentFilter('All')}
                  style={[styles.filterTab, studentFilter === 'All' && styles.filterTabActive]}
                  accessibilityRole="button"
                  accessibilityLabel="Filter All students"
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      studentFilter === 'All' && styles.filterTabTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {uniqueStudents.map((name) => (
                  <TouchableOpacity
                    key={name}
                    onPress={() => setStudentFilter(name)}
                    style={[styles.filterTab, studentFilter === name && styles.filterTabActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${name}`}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        studentFilter === name && styles.filterTabTextActive,
                      ]}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <ScrollView>
              {visibleConversations.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setActiveId(c.id)}
                  style={[styles.convoRow, activeId === c.id && styles.convoRowActive]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select conversation for ${c.studentName}`}
                >
                  <View style={[styles.avatar, { backgroundColor: TEACHER_COLOR }]}>
                    <Text style={styles.avatarLetter}>{c.studentName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.convoMetaRow}>
                      <Text style={typography.bodyBold}>{c.studentName}</Text>
                      {c.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>{c.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={typography.caption}>{c.parentName} (Parent)</Text>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {c.lastMessagePreview}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Chat Area */}
          <View style={styles.chatArea}>
            {activeConversation ? (
              <>
                <View style={styles.chatHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.h3}>{activeConversation.studentName}</Text>
                    <Text style={typography.caption}>
                      Parent Contact: {activeConversation.parentName}
                    </Text>
                  </View>
                  <View style={styles.headerActions}>
                    <TouchableOpacity
                      style={styles.actionPill}
                      onPress={handleEscalate}
                      accessibilityRole="button"
                      accessibilityLabel="Escalate conversation"
                    >
                      <Feather name="alert-triangle" size={12} color="#DC2626" />
                      <Text style={[styles.actionPillText, { color: '#DC2626' }]}>Escalate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionPill}
                      onPress={handleResolve}
                      accessibilityRole="button"
                      accessibilityLabel="Resolve conversation"
                    >
                      <Feather name="check" size={12} color="#059669" />
                      <Text style={[styles.actionPillText, { color: '#059669' }]}>Resolve</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.toolbar}>
                  <TouchableOpacity
                    style={styles.toolBtn}
                    onPress={handleShareSessionSummary}
                    accessibilityRole="button"
                    accessibilityLabel="Share session summary"
                  >
                    <Feather name="file-text" size={14} color="#0F172A" />
                    <Text style={styles.toolBtnText}>Share Session</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.toolBtn}
                    onPress={handleShareProgressUpdate}
                    accessibilityRole="button"
                    accessibilityLabel="Share progress chart"
                  >
                    <Feather name="trending-up" size={14} color="#0F172A" />
                    <Text style={styles.toolBtnText}>Share Progress</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.toolBtn}
                    onPress={handleRequestHomeObservation}
                    accessibilityRole="button"
                    accessibilityLabel="Request home observation"
                  >
                    <Feather name="edit" size={14} color="#0F172A" />
                    <Text style={styles.toolBtnText}>Request Observation</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.toolBtn}
                    onPress={handleViewHomeObservation}
                    accessibilityRole="button"
                    accessibilityLabel="View home observation"
                  >
                    <Feather name="eye" size={14} color="#0F172A" />
                    <Text style={styles.toolBtnText}>View Home Observation</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.messagesList}>
                  {thread.length === 0 ? (
                    <View style={styles.emptyThreadWrap}>
                      <Feather name="message-circle" size={32} color={colors.mutedText} />
                      <Text style={styles.emptyThreadText}>
                        No messages in this thread yet. Send a message below to communicate with the
                        family.
                      </Text>
                    </View>
                  ) : (
                    thread.map((m) => {
                      const isMe =
                        m.sender === 'teacher' ||
                        m.sender === 'team' ||
                        (m as any).from === 'team' ||
                        (m as any).from === 'teacher';
                      return (
                        <View
                          key={m.id}
                          style={[styles.msgWrap, isMe ? styles.msgWrapMe : styles.msgWrapOther]}
                        >
                          <View
                            style={[
                              styles.msgBubble,
                              isMe ? styles.msgBubbleMe : styles.msgBubbleOther,
                            ]}
                          >
                            <Text
                              style={[
                                styles.msgSenderLabel,
                                { color: isMe ? '#E0F2FE' : '#64748B' },
                              ]}
                            >
                              {m.senderLabel}
                            </Text>
                            <Text style={[styles.msgText, { color: isMe ? '#FFFFFF' : '#0F172A' }]}>
                              {m.text}
                            </Text>
                            {m.attachments?.map((a) => (
                              <View key={a.id} style={styles.attachmentBadge}>
                                <Feather name="file" size={12} color="#0284C7" />
                                <Text style={styles.attachmentName}>{a.name}</Text>
                              </View>
                            ))}
                            <Text style={[styles.msgTime, { color: isMe ? '#BAE6FD' : '#94A3B8' }]}>
                              {m.timestamp}
                            </Text>
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>

                {pendingAttachments.length > 0 && (
                  <View style={styles.pendingArea}>
                    {pendingAttachments.map((a) => (
                      <View key={a.id} style={styles.pendingChip}>
                        <Feather name="file" size={12} color="#64748B" />
                        <Text style={styles.pendingChipText} numberOfLines={1}>
                          {a.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removePendingAttachment(a.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove attachment ${a.name}`}
                        >
                          <Feather name="x" size={14} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.inputBar}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={handleAttach}
                    accessibilityRole="button"
                    accessibilityLabel="Attach file"
                  >
                    <Feather name="paperclip" size={18} color="#64748B" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Type a message to Parent..."
                    placeholderTextColor="#94A3B8"
                    value={draft}
                    onChangeText={setDraft}
                    onSubmitEditing={handleSend}
                  />
                  <TouchableOpacity
                    style={styles.sendBtn}
                    onPress={handleSend}
                    accessibilityRole="button"
                    accessibilityLabel="Send message"
                  >
                    <Feather name="send" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.emptyChat}>
                <Feather name="message-square" size={48} color="#CBD5E1" />
                <Text style={typography.body}>Select a student thread to start messaging</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  mainWrapper: { flex: 1, width: '100%' },
  tabletWrapper: { maxWidth: 1200, alignSelf: 'center', width: '100%' },
  body: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  tabletSidebar: {
    width: 320,
  },
  searchArea: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  sidebarLabel: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: spacing.xs },
  searchInput: { flex: 1, height: 38, fontSize: 13, color: colors.navyText },
  filterTabs: { flexDirection: 'row', gap: spacing.xs },
  filterTab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.bgApp,
  },
  filterTabActive: { backgroundColor: colors.primaryYellow },
  filterTabText: { fontSize: 11, fontWeight: '600', color: colors.bodyText },
  filterTabTextActive: { color: colors.navyText },
  convoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  convoRowActive: { backgroundColor: '#F8FAFC' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  convoMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  lastMessage: { fontSize: 12, color: colors.mutedText, marginTop: 2 },
  chatArea: { flex: 1, backgroundColor: colors.bgApp },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgCard,
  },
  actionPillText: { fontSize: 11, fontWeight: '600' },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  toolBtnText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  messagesList: { padding: spacing.lg, gap: spacing.md },
  emptyThreadWrap: { padding: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  emptyThreadText: {
    ...typography.body,
    color: colors.mutedText,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  msgWrap: { flexDirection: 'row', width: '100%' },
  msgWrapMe: { justifyContent: 'flex-end' },
  msgWrapOther: { justifyContent: 'flex-start' },
  msgBubble: { maxWidth: '70%', padding: spacing.md, borderRadius: radius.lg },
  msgBubbleMe: { backgroundColor: '#0284C7', borderBottomRightRadius: 2 },
  msgBubbleOther: {
    backgroundColor: colors.bgCard,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  msgSenderLabel: { fontSize: 9, fontWeight: '700', marginBottom: 2 },
  msgText: { fontSize: 13, lineHeight: 18 },
  msgTime: { fontSize: 9, alignSelf: 'flex-end', marginTop: 4 },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  attachmentName: { fontSize: 11, color: '#0284C7', fontWeight: '500' },
  pendingArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  pendingChipText: { fontSize: 11, color: colors.bodyText, maxWidth: 180 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  iconBtn: { padding: spacing.xs },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 13,
    color: colors.navyText,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.navyText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    opacity: 0.7,
  },
});
