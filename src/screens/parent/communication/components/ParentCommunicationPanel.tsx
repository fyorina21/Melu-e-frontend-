import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import AppNavbar from '../../../../components/AppNavbar';
import ScreenLoader from '../../../../components/ScreenLoader';
import { PARENT_ROUTE_BY_TAB } from '../../../../components/appNavConfig';
import { useToast } from '../../../../context/ToastContext';
import { parentApi } from '../../../../api';
import {
  type ParentConversation,
  type ParentMessage,
  type LogEntry,
  PARENT_TEMPLATES,
  roleBadgeStyle,
  avatarColor,
  filterParentConversations,
} from '../types';

export function ParentCommunicationPanel({ navigation }: { navigation: any }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { showToast } = useToast();
  const [conversations, setConversations] = useState<ParentConversation[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'log'>('chat');
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [activeChildName, setActiveChildName] = useState<string>('');
  const [activeLogs, setActiveLogs] = useState<LogEntry[]>([]);
  const messagesEndRef = useRef<ScrollView>(null);

  const loadList = useCallback(async () => {
    try {
      const rows = await parentApi.conversations();
      const mapped: ParentConversation[] = rows.map((c) => ({
        id: c.id,
        recipient: c.recipient,
        role: c.role,
        avatarLetter: (c.recipient ?? '?').charAt(0).toUpperCase(),
        lastMessage: c.lastMessage ?? '',
        time: c.time ?? '',
        unread: c.unread ?? 0,
        messages: [],
      }));
      setConversations(mapped);
      if (mapped.length) setSelectedId(mapped[0].id);
    } catch {
      setConversations([]);
    } finally {
      setListLoading(false);
    }
    try {
      const dash: any = await parentApi.dashboard();
      const rawChild = dash?.childSummary ?? dash?.data?.students?.[0];
      const name =
        rawChild?.fullName ??
        rawChild?.name ??
        (rawChild?.first_name ? `${rawChild.first_name} ${rawChild.last_name || ''}`.trim() : '');
      if (name) setActiveChildName(name);

      const logs: LogEntry[] = [];
      if (rawChild?.goals) {
        rawChild.goals.slice(0, 3).forEach((g: any) => {
          logs.push({
            date: 'Recently',
            from: 'Therapy Team',
            preview: `Goal: ${g.name} — ${g.progressPercent || 0}% progress (${g.status || 'Active'})`,
            status: g.status === 'mastered' ? 'Mastered' : 'Shared',
          });
        });
      }
      if (dash.sessionsThisWeek > 0 || dash.sessionsTotal > 0) {
        logs.unshift({
          date: 'This Week',
          from: 'Lead Therapist',
          preview: `Weekly session summary — ${dash.sessionsThisWeek || dash.sessionsTotal} sessions conducted for ${name || 'child'}.`,
          status: 'Shared',
        });
      }
      if (logs.length > 0) setActiveLogs(logs);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) return;
    const convo = conversations.find((c) => c.id === selectedId);
    if (convo && convo.messages.length > 0) return;
    parentApi
      .conversationThread(selectedId)
      .then((res: any) => {
        const msgs: ParentMessage[] = (res.messages ?? []).map((m: any) => ({
          from: m.from === 'parent' ? 'parent' : 'team',
          senderName: m.senderName ?? m.sender ?? '',
          senderRole: m.role ?? 'Coordinator',
          text: m.text ?? '',
          time: m.time ?? m.sentAt ?? m.timestamp ?? 'Today',
        }));
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedId ? { ...c, messages: msgs } : c)),
        );
      })
      .catch(() =>
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedId ? { ...c, messages: [] } : c)),
        ),
      );
  }, [selectedId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollToEnd({ animated: true });
  }, [selectedId, conversations, activeTab]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const filteredConvos = useMemo(
    () => filterParentConversations(conversations, searchQuery),
    [conversations, searchQuery],
  );

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedId) return;
    const msg: ParentMessage = {
      from: 'parent',
      senderName: 'Parent A',
      senderRole: 'Parent',
      text: newMessage.trim(),
      time: 'Just now',
    };
    const updated = conversations.map((c) =>
      c.id === selectedId
        ? {
            ...c,
            messages: [...c.messages, msg],
            lastMessage: msg.text,
            time: 'Just now',
            unread: 0,
          }
        : c,
    );
    setConversations(updated);
    setNewMessage('');
    try {
      await parentApi.sendMessage(selectedId, msg.text);
    } catch {
      // offline/catch
    }
    showToast('Message sent', 'success');
  };

  const applyTemplate = (text: string) => {
    setNewMessage(text);
    setShowTemplateMenu(false);
  };

  const handleEscalate = () => {
    if (!escalateReason.trim()) return;
    setShowEscalateModal(false);
    setEscalateReason('');
    Alert.alert('Escalation sent', 'Escalation sent to Director A');
    showToast('Escalation sent to Director A', 'success');
  };

  const handleResolve = async () => {
    setShowResolveConfirm(false);
    if (selectedId) {
      try {
        await parentApi.setConversationResolved(selectedId, true);
      } catch {
        // ignore
      }
    }
    Alert.alert('Conversation marked as resolved');
    showToast('Conversation marked as resolved', 'success');
  };

  if (listLoading) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Messages"
        onTabPress={(tab) => tab !== 'Messages' && navigation?.navigate?.(PARENT_ROUTE_BY_TAB[tab])}
      />
      <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
        <View style={styles.body}>
          {/* Sidebar */}
          <View style={[styles.sidebar, isTablet && styles.tabletSidebar]}>
            <View style={styles.searchArea}>
              <Text style={styles.sidebarLabel}>Messages</Text>
              <View style={styles.searchWrap}>
                <Feather name="search" size={14} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search conversations..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
            <ScrollView>
              {filteredConvos.map((c) => {
                const badge = roleBadgeStyle(c.role);
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => handleSelectConversation(c.id)}
                    style={[styles.convoRow, selectedId === c.id && styles.convoRowActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`Conversation with ${c.recipient}`}
                  >
                    <View style={[styles.avatar, { backgroundColor: avatarColor(c.role) }]}>
                      <Text style={styles.avatarLetter}>{c.avatarLetter}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.convoMetaRow}>
                        <Text style={typography.bodyBold}>{c.recipient}</Text>
                        {c.unread > 0 && (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{c.unread}</Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.badgeWrap, badge]}>
                        <Text style={[styles.badgeTextLabel, { color: badge.color }]}>
                          {c.role}
                        </Text>
                      </View>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {c.lastMessage}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Chat / Log Area */}
          <View style={styles.chatArea}>
            {selected ? (
              <>
                <View style={styles.chatHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.h3}>{selected.recipient}</Text>
                    <Text style={typography.caption}>
                      {selected.role} &middot;{' '}
                      {activeChildName ? `${activeChildName}'s Team` : 'Therapy Team'}
                    </Text>
                  </View>
                  <View style={styles.headerActions}>
                    <TouchableOpacity
                      style={styles.actionPill}
                      onPress={() => setShowEscalateModal(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Escalate to Director"
                    >
                      <Feather name="alert-triangle" size={12} color="#DC2626" />
                      <Text style={[styles.actionPillText, { color: '#DC2626' }]}>Escalate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionPill}
                      onPress={() => setShowResolveConfirm(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Mark conversation resolved"
                    >
                      <Feather name="check" size={12} color="#059669" />
                      <Text style={[styles.actionPillText, { color: '#059669' }]}>Resolve</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.tabsRow}>
                  <TouchableOpacity
                    style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
                    onPress={() => setActiveTab('chat')}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeTab === 'chat' }}
                  >
                    <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>
                      Chat Messages
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, activeTab === 'log' && styles.tabActive]}
                    onPress={() => setActiveTab('log')}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeTab === 'log' }}
                  >
                    <Text style={[styles.tabText, activeTab === 'log' && styles.tabTextActive]}>
                      Log History
                    </Text>
                  </TouchableOpacity>
                </View>

                {activeTab === 'chat' ? (
                  <>
                    <ScrollView ref={messagesEndRef} contentContainerStyle={styles.messagesList}>
                      {selected.messages.length === 0 ? (
                        <View style={styles.emptyThreadWrap}>
                          <Feather name="message-circle" size={32} color={colors.mutedText} />
                          <Text style={styles.emptyThreadText}>
                            No messages in this thread yet. Send a message below to start
                            communicating with the team.
                          </Text>
                        </View>
                      ) : (
                        selected.messages.map((m, idx) => {
                          const isMe = m.from === 'parent';
                          return (
                            <View
                              key={idx}
                              style={[
                                styles.msgWrap,
                                isMe ? styles.msgWrapMe : styles.msgWrapOther,
                              ]}
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
                                    { color: isMe ? '#FDE68A' : '#64748B' },
                                  ]}
                                >
                                  {m.senderName} ({m.senderRole})
                                </Text>
                                <Text style={styles.msgText}>{m.text}</Text>
                                <Text
                                  style={[styles.msgTime, { color: isMe ? '#78350F' : '#94A3B8' }]}
                                >
                                  {m.time}
                                </Text>
                              </View>
                            </View>
                          );
                        })
                      )}
                    </ScrollView>

                    <View style={styles.inputBar}>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => setShowTemplateMenu((v) => !v)}
                        accessibilityRole="button"
                        accessibilityLabel="Standard response templates"
                      >
                        <Feather name="file-text" size={18} color="#64748B" />
                      </TouchableOpacity>
                      <TextInput
                        style={styles.textInput}
                        placeholder={`Type a message to ${
                          activeChildName ? `${activeChildName}'s Team` : 'the team'
                        }...`}
                        placeholderTextColor="#9CA3AF"
                        value={newMessage}
                        onChangeText={setNewMessage}
                        onSubmitEditing={sendMessage}
                      />
                      <TouchableOpacity
                        style={[styles.sendBtn, { backgroundColor: colors.primaryYellow }]}
                        onPress={sendMessage}
                        accessibilityRole="button"
                        accessibilityLabel="Send message"
                      >
                        <Feather name="send" size={16} color={colors.navyText} />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <ScrollView contentContainerStyle={styles.logsList}>
                    <Text style={typography.bodyBold}>Past Reports & Logs Shared</Text>
                    {activeLogs.length > 0 ? (
                      activeLogs.map((log: any, idx: number) => (
                        <View key={idx} style={styles.logCard}>
                          <View style={{ flex: 1 }}>
                            <Text style={typography.bodyBold}>{log.preview}</Text>
                            <Text style={typography.caption}>
                              Sent by {log.from} on {log.date}
                            </Text>
                          </View>
                          <Feather name="chevron-right" size={16} color={colors.mutedText} />
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyLogsText}>
                        No shared reports or activity logs recorded yet.
                      </Text>
                    )}
                  </ScrollView>
                )}
              </>
            ) : (
              <View style={styles.emptyChat}>
                <Feather name="message-square" size={48} color="#CBD5E1" />
                <Text style={typography.body}>Select a thread to view conversations</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Modals */}
      <Modal visible={showTemplateMenu} transparent animationType="fade">
        <Pressable style={styles.menuOverlay} onPress={() => setShowTemplateMenu(false)}>
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Standard Responses</Text>
            {PARENT_TEMPLATES.map((t, i) => (
              <TouchableOpacity
                key={i}
                style={styles.menuItem}
                onPress={() => applyTemplate(t.text)}
                accessibilityRole="button"
                accessibilityLabel={t.label}
              >
                <Text style={styles.menuItemText}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showEscalateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={typography.h3}>Escalate Conversation</Text>
            <Text style={typography.body}>
              Please provide a reason to escalate this thread directly to Director A.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Type reason here..."
              placeholderTextColor="#9CA3AF"
              value={escalateReason}
              onChangeText={setEscalateReason}
              multiline
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowEscalateModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel escalation"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleEscalate}
                accessibilityRole="button"
                accessibilityLabel="Send escalation"
              >
                <Text style={styles.saveBtnText}>Send Escalation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showResolveConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={typography.h3}>Mark Resolved?</Text>
            <Text style={typography.body}>
              Are you sure you want to mark this conversation thread resolved?
            </Text>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowResolveConfirm(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel resolve"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleResolve}
                accessibilityRole="button"
                accessibilityLabel="Confirm resolve"
              >
                <Text style={styles.saveBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  badgeWrap: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginVertical: 4,
  },
  badgeTextLabel: { fontSize: 9, fontWeight: '700' },
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
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primaryYellow },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.bodyText },
  tabTextActive: { color: colors.navyText, fontWeight: '700' },
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
  msgBubbleMe: { backgroundColor: '#FEF3C7', borderBottomRightRadius: 2 },
  msgBubbleOther: {
    backgroundColor: colors.bgCard,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  msgSenderLabel: { fontSize: 9, fontWeight: '700', marginBottom: 2 },
  msgText: { fontSize: 13, lineHeight: 18, color: '#1F2937' },
  msgTime: { fontSize: 9, alignSelf: 'flex-end', marginTop: 4 },
  logsList: { padding: spacing.lg, gap: spacing.md },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyLogsText: {
    ...typography.body,
    color: colors.mutedText,
    textAlign: 'center',
    padding: spacing.xl,
  },
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
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  menuCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  menuTitle: { fontSize: 14, fontWeight: '700', color: colors.navyText, marginBottom: spacing.xs },
  menuItem: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuItemText: { fontSize: 13, color: colors.navyText },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalInput: {
    height: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 13,
    textAlignVertical: 'top',
    color: colors.navyText,
  },
  modalFooter: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
