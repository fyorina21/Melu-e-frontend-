import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { PARENT_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getParentConversations, getParentConversationThread, sendParentMessage, setParentConversationResolved } from '../../api/parentApi';
import type { ParentStackParamList } from '../../types';

type MessageSender = 'parent' | 'team';

type Message = {
  from: MessageSender;
  senderName: string;
  senderRole: string;
  text: string;
  time: string;
};

type Conversation = {
  id: string;
  recipient: string;
  role: string;
  avatarLetter: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: Message[];
};

type LogEntry = {
  date: string;
  from: string;
  preview: string;
  status: string;
};

const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    recipient: 'Teacher A',
    role: 'Teacher',
    avatarLetter: 'T',
    lastMessage: 'Student A had a great session...',
    time: 'Today',
    unread: 2,
    messages: [
      { from: 'team', senderName: 'Teacher A', senderRole: 'Teacher', text: "Good morning! Student A had an excellent session today. They successfully identified all 5 colors independently for the first time! \u2B50", time: '9:15 AM' },
      { from: 'parent', senderName: 'Parent A', senderRole: 'Parent', text: "That's amazing news! We've been practicing at home too. Is there anything specific we should focus on this weekend?", time: '9:32 AM' },
      { from: 'team', senderName: 'Teacher A', senderRole: 'Teacher', text: "Great teamwork! For the weekend, try asking Student A to identify colors during everyday activities \u2014 like 'what color is your shirt?' Keep it playful and low-pressure.", time: '9:45 AM' },
      { from: 'parent', senderName: 'Parent A', senderRole: 'Parent', text: "Perfect, we'll try that! Thank you so much \uD83D\uDE4F", time: '10:02 AM' },
      { from: 'team', senderName: 'Teacher A', senderRole: 'Teacher', text: "You're welcome! See you Monday. Have a wonderful weekend! \uD83D\uDE0A", time: '10:05 AM' },
    ],
  },
  {
    id: '2',
    recipient: 'Coordinator A',
    role: 'Coordinator',
    avatarLetter: 'C',
    lastMessage: 'IUP finalization reminder',
    time: 'Yesterday',
    unread: 0,
    messages: [
      { from: 'team', senderName: 'Coordinator A', senderRole: 'Coordinator', text: "Hi! Just a friendly reminder that the IUP finalization is coming up next week. Please review the draft and let us know if you have any questions.", time: 'Yesterday 2:00 PM' },
      { from: 'parent', senderName: 'Parent A', senderRole: 'Parent', text: "Thank you for the reminder! I'll review it tonight.", time: 'Yesterday 4:15 PM' },
    ],
  },
  {
    id: '3',
    recipient: 'Director A',
    role: 'Director',
    avatarLetter: 'D',
    lastMessage: 'Monthly review scheduled',
    time: '3 days ago',
    unread: 0,
    messages: [
      { from: 'team', senderName: 'Director A', senderRole: 'Director', text: "Good afternoon! I wanted to let you know that the monthly review has been scheduled for next Thursday at 2:00 PM. Looking forward to discussing Student A's progress.", time: '3 days ago 3:00 PM' },
      { from: 'parent', senderName: 'Parent A', senderRole: 'Parent', text: "That works perfectly for us. We'll be there!", time: '3 days ago 5:00 PM' },
    ],
  },
];

const communicationLog: LogEntry[] = [
  { date: '2026-08-18', from: 'Teacher A', preview: 'Color identification milestone — 5 colors independently', status: 'Read' },
  { date: '2026-08-17', from: 'Parent A', preview: 'Question about weekend practice activities', status: 'Read' },
  { date: '2026-08-15', from: 'Coordinator A', preview: 'IUP finalization reminder for next week', status: 'Read' },
  { date: '2026-08-12', from: 'Teacher A', preview: 'Weekly session summary and goals update', status: 'Read' },
  { date: '2026-08-10', from: 'Director A', preview: 'Monthly review scheduled for August 21', status: 'Read' },
];

const messageTemplates = [
  { label: 'Thank you message', text: "Thank you so much for the update! We really appreciate the care and effort your team puts into Student A's progress." },
  { label: 'Question about session', text: "Hi! I had a question about Student A's recent session. Could you share more details about what activities were covered?" },
  { label: 'Reporting a concern', text: "Hello, I wanted to share a concern I've noticed at home that may be relevant to Student A's therapy. Could we discuss this further?" },
];

const TEACHER_COLOR = '#38BDF8';
const DIRECTOR_COLOR = '#A855F7';
const COORDINATOR_COLOR = '#FBBF24';
const PARENT_YELLOW = '#FCD34D';
const INK = '#1F2937';

function roleBadgeStyle(role: string) {
  if (role === 'Teacher') return { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', color: '#0284C7' };
  if (role === 'Director') return { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF', color: '#7E22CE' };
  return { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', color: '#B45309' };
}

function avatarColor(role: string) {
  if (role === 'Teacher') return TEACHER_COLOR;
  if (role === 'Director') return DIRECTOR_COLOR;
  return COORDINATOR_COLOR;
}

export default function ParentCommunicationScreen({ navigation }: NativeStackScreenProps<ParentStackParamList, 'ParentCommunication'>) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'log'>('chat');
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const messagesEndRef = useRef<ScrollView>(null);

  const loadList = useCallback(async () => {
    try {
      const { data } = await getParentConversations();
      const mapped: Conversation[] = data.map((c: { id: string; teamMemberName: string; teamMemberRole: string; lastMessagePreview: string; unreadCount: number }) => ({
        id: c.id,
        recipient: c.teamMemberName,
        role: c.teamMemberRole ?? 'Coordinator',
        avatarLetter: (c.teamMemberName ?? '?').charAt(0).toUpperCase(),
        lastMessage: c.lastMessagePreview ?? '',
        time: '',
        unread: c.unreadCount ?? 0,
        messages: [],
      }));
      setConversations(mapped);
      if (mapped.length) setSelectedId(mapped[0].id);
    } catch (err) {
      setConversations(DEMO_CONVERSATIONS);
      setSelectedId(DEMO_CONVERSATIONS[0].id);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    if (!selectedId) return;
    const convo = conversations.find((c) => c.id === selectedId);
    if (convo && convo.messages.length > 0) return;
    getParentConversationThread(selectedId)
      .then(({ data }) => {
        const msgs: Message[] = (data.messages ?? []).map((m: { sender: string; senderLabel: string; roleTag: string | null; text: string; timestamp?: string }) => ({
          from: m.sender === 'parent' ? 'parent' : 'team',
          senderName: m.senderLabel ?? m.sender,
          senderRole: m.roleTag ?? 'Coordinator',
          text: m.text ?? '',
          time: m.timestamp ?? '',
        }));
        setConversations((prev) => prev.map((c) => (c.id === selectedId ? { ...c, messages: msgs } : c)));
      })
      .catch(() => {});
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollToEnd({ animated: true });
  }, [selectedId, conversations, activeTab]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const filteredConvos = conversations.filter(
    (c) =>
      c.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedId) return;
    const msg: Message = { from: 'parent', senderName: 'Parent A', senderRole: 'Parent', text: newMessage.trim(), time: 'Just now' };
    const updated = conversations.map((c) =>
      c.id === selectedId ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, time: 'Just now', unread: 0 } : c
    );
    setConversations(updated);
    setNewMessage('');
    try { sendParentMessage(selectedId, { text: msg.text }).catch(() => {}); } catch (err) {}
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
  };

  const handleResolve = async () => {
    setShowResolveConfirm(false);
    if (selectedId) {
      try { await setParentConversationResolved(selectedId, true); } catch (err) {}
    }
    Alert.alert('Conversation marked as resolved');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Messages" onTabPress={(tab) => tab !== 'Messages' && navigation?.navigate?.(PARENT_ROUTE_BY_TAB[tab])} />

      <View style={styles.body}>
        <View style={styles.sidebar}>
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
                >
                  <View style={[styles.avatar, { backgroundColor: avatarColor(c.role) }]}>
                    <Text style={styles.avatarLetter}>{c.avatarLetter}</Text>
                  </View>
                  <View style={styles.convoMain}>
                    <View style={styles.convoLine}>
                      <Text style={styles.convoName} numberOfLines={1}>{c.recipient}</Text>
                      <Text style={styles.convoTime}>{c.time}</Text>
                    </View>
                    <View style={styles.convoLine}>
                      <Text style={styles.convoPreview} numberOfLines={1}>{c.lastMessage}</Text>
                      {c.unread > 0 && (
                        <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{c.unread}</Text></View>
                      )}
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: badge.backgroundColor, borderColor: badge.borderColor }]}>
                      <Text style={[styles.roleBadgeText, { color: badge.color }]}>{c.role}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.chatPane}>
          {!selected ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>Select a conversation to start messaging</Text>
            </View>
          ) : (
            <>
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderMeta}>
                  <View style={[styles.avatar, { backgroundColor: avatarColor(selected.role) }]}>
                    <Text style={styles.avatarLetter}>{selected.avatarLetter}</Text>
                  </View>
                  <View style={styles.chatHeaderNameArea}>
                    <Text style={styles.chatName}>{selected.recipient}</Text>
                    {(() => { const badge = roleBadgeStyle(selected.role); return (
                      <View style={[styles.roleBadge, { backgroundColor: badge.backgroundColor, borderColor: badge.borderColor, alignSelf: 'flex-start' }]}>
                        <Text style={[styles.roleBadgeText, { color: badge.color }]}>{selected.role}</Text>
                      </View>
                    ); })()}
                  </View>
                </View>
                <View style={styles.chatHeaderActions}>
                  <View style={styles.segmented}>
                    <TouchableOpacity onPress={() => setActiveTab('chat')} style={[styles.segBtn, activeTab === 'chat' && styles.segBtnActive]}>
                      <Text style={[styles.segText, activeTab === 'chat' && styles.segTextActive]}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('log')} style={[styles.segBtn, activeTab === 'log' && styles.segBtnActive]}>
                      <Text style={[styles.segText, activeTab === 'log' && styles.segTextActive]}>Log</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => setShowEscalateModal(true)} style={styles.escalateHeaderBtn}>
                    <Text style={styles.escalateHeaderText}>Escalate to Director</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {activeTab === 'log' ? (
                <ScrollView style={styles.logScroll} contentContainerStyle={styles.logContent}>
                  <Text style={styles.logTitle}>Communication History</Text>
                  <View style={styles.logCard}>
                    <View style={[styles.logRow, styles.logRowHeader]}>
                      <Text style={[styles.logCell, styles.logHeaderText, { flex: 0.7 }]}>Date</Text>
                      <Text style={[styles.logCell, styles.logHeaderText, { flex: 0.8 }]}>From</Text>
                      <Text style={[styles.logCell, styles.logHeaderText, { flex: 1.6 }]}>Preview</Text>
                      <Text style={[styles.logCell, styles.logHeaderText, { flex: 0.7 }]}>Status</Text>
                    </View>
                    {communicationLog.map((entry, i) => (
                      <View key={i} style={styles.logRow}>
                        <Text style={[styles.logCell, { flex: 0.7 }]}>{entry.date}</Text>
                        <Text style={[styles.logCell, styles.logFrom, { flex: 0.8 }]}>{entry.from}</Text>
                        <Text style={[styles.logCell, styles.logPreview, { flex: 1.6 }]} numberOfLines={1}>{entry.preview}</Text>
                        <View style={{ flex: 0.7, alignItems: 'flex-start' }}>
                          <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>{entry.status}</Text></View>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              ) : (
                <>
                  <ScrollView
                    ref={messagesEndRef}
                    style={styles.messagesScroll}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() => messagesEndRef.current?.scrollToEnd({ animated: true })}
                  >
                    {selected.messages.length === 0 && (
                      <Text style={styles.noMessagesText}>No messages yet.</Text>
                    )}
                    {selected.messages.map((msg, i) => {
                      const mine = msg.from === 'parent';
                      const badge = roleBadgeStyle(msg.senderRole);
                      return (
                        <View key={i} style={mine ? styles.msgRowMine : styles.msgRow}>
                          <View style={[styles.msgMeta, mine && styles.msgMetaMine]}>
                            <Text style={styles.msgSenderName}>{msg.senderName}</Text>
                            <View style={[styles.roleBadge, { backgroundColor: badge.backgroundColor, borderColor: badge.borderColor }]}>
                              <Text style={[styles.roleBadgeText, { color: badge.color }]}>{msg.senderRole}</Text>
                            </View>
                          </View>
                          <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                            <Text style={styles.bubbleText}>{msg.text}</Text>
                          </View>
                          <Text style={styles.msgTime}>{msg.time}</Text>
                        </View>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.composerWrap}>
                    <View style={styles.composerToolbar}>
                      <TouchableOpacity style={styles.templateBtn} onPress={() => setShowTemplateMenu((v) => !v)}>
                        <Text style={styles.templateBtnText}>Use Template</Text>
                        <Feather name="chevron-down" size={12} color="#4B5563" />
                      </TouchableOpacity>
                      {showTemplateMenu && (
                        <View style={styles.templateMenu}>
                          {messageTemplates.map((t, i) => (
                            <TouchableOpacity key={i} onPress={() => applyTemplate(t.text)} style={styles.templateItem}>
                              <Text style={styles.templateItemText}>{t.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={styles.composerRow2}>
                      <View style={styles.composerMain}>
                        <TextInput
                          style={styles.composerText}
                          multiline
                          value={newMessage}
                          onChangeText={setNewMessage}
                          placeholder="Type your message..."
                          placeholderTextColor={colors.mutedText}
                        />
                        <View style={styles.composerTools}>
                          <TouchableOpacity style={styles.composerTool}>
                            <Feather name="paperclip" size={14} color="#6B7280" />
                            <Text style={styles.composerToolText}>Attach</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.composerTool} onPress={() => setNewMessage((prev) => `${prev}${prev ? ' ' : ''}[Shared: ${"this week's schedule"}]`)}>
                            <Feather name="calendar" size={14} color="#6B7280" />
                            <Text style={styles.composerToolText}>Share Schedule</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={sendMessage}
                        disabled={!newMessage.trim()}
                        style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
                        accessibilityLabel="Send message"
                      >
                        <Feather name="send" size={16} color={INK} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.bottomBar}>
                    <View style={styles.statusWrap}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>No active escalations</Text>
                    </View>
                    <View style={styles.bottomBarRight}>
                      <TouchableOpacity style={styles.escalateBottomBtn} onPress={() => setShowEscalateModal(true)}>
                        <Feather name="alert-triangle" size={12} color="#6B7280" />
                        <Text style={styles.escalateBottomText}>Escalate to Director</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.resolveBtn} onPress={() => setShowResolveConfirm(true)}>
                        <Text style={styles.resolveBtnText}>Mark as Resolved</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </View>

      {showEscalateModal && (
        <Modal transparent visible={showEscalateModal} animationType="fade" onRequestClose={() => setShowEscalateModal(false)}>
          <View style={styles.overlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitle}>
                  <Feather name="alert-triangle" size={16} color="#F59E0B" />
                  <Text style={styles.modalTitle}>Escalate to Director</Text>
                </View>
                <TouchableOpacity onPress={() => { setShowEscalateModal(false); setEscalateReason(''); }} style={styles.iconBtn} accessibilityLabel="Close">
                  <Feather name="x" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalHint}>Please describe the reason for escalating this conversation to Director A.</Text>
                <TextInput
                  style={styles.modalTextArea}
                  multiline
                  placeholder="Describe the reason for escalation..."
                  placeholderTextColor="#9CA3AF"
                  value={escalateReason}
                  onChangeText={setEscalateReason}
                />
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalCancelBtn, styles.modalBtn]}
                    onPress={() => { setShowEscalateModal(false); setEscalateReason(''); }}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalSendBtn, styles.modalBtn, !escalateReason.trim() && styles.btnDisabled]}
                    disabled={!escalateReason.trim()}
                    onPress={handleEscalate}
                  >
                    <Text style={styles.modalSendText}>Send Escalation</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showResolveConfirm && (
        <Modal transparent visible={showResolveConfirm} animationType="fade" onRequestClose={() => setShowResolveConfirm(false)}>
          <View style={styles.overlay}>
            <View style={[styles.modalCard, styles.resolveCard]}>
              <View style={styles.resolveIconWrap}>
                <Text style={styles.resolveIcon}>✅</Text>
              </View>
              <Text style={styles.resolveTitle}>Mark as Resolved?</Text>
              <Text style={styles.resolveHint}>Mark this conversation as resolved?</Text>
              <View style={styles.modalFooter}>
                <TouchableOpacity style={[styles.modalCancelBtn, styles.modalBtn]} onPress={() => setShowResolveConfirm(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.resolveConfirmBtn, styles.modalBtn]} onPress={handleResolve}>
                  <Text style={styles.resolveConfirmText}>Yes, Resolve</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F5F7' },
  iconBtn: { padding: 6, borderRadius: radius.md },
  body: { flex: 1, flexDirection: 'row', overflow: 'hidden' },

  // Sidebar
  sidebar: { width: 300, borderRightWidth: 1, borderRightColor: '#E5E7EB', backgroundColor: colors.white },
  searchArea: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md },
  sidebarLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.md, marginLeft: 4 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: radius.lg, paddingHorizontal: spacing.md },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 13, color: '#111827' },
  convoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', borderLeftWidth: 4, borderLeftColor: 'transparent' },
  convoRowActive: { backgroundColor: '#F0F9FF', borderLeftColor: TEACHER_COLOR },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: colors.white, fontWeight: '700', fontSize: 14 },
  convoMain: { flex: 1, minWidth: 0 },
  convoLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
  convoName: { fontWeight: '600', fontSize: 13, color: '#111827', flexShrink: 1 },
  convoTime: { fontSize: 11, color: '#9CA3AF' },
  convoPreview: { fontSize: 12, color: '#6B7280', flex: 1 },
  unreadBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: TEACHER_COLOR, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  unreadBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  roleBadge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4, alignSelf: 'flex-start' },
  roleBadgeText: { fontSize: 10, fontWeight: '500' },

  // Chat pane
  chatPane: { flex: 1, flexDirection: 'column', backgroundColor: '#F4F5F7' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: 13, color: '#9CA3AF' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexWrap: 'wrap' },
  chatHeaderMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  chatHeaderNameArea: { minWidth: 0 },
  chatName: { fontWeight: '700', fontSize: 14, color: '#111827' },
  chatHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  segmented: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: radius.lg, padding: 2 },
  segBtn: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.lg },
  segBtnActive: { backgroundColor: colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  segText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  segTextActive: { color: '#111827' },
  escalateHeaderBtn: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 6 },
  escalateHeaderText: { fontSize: 12, fontWeight: '500', color: '#4B5563' },

  // Log
  logScroll: { flex: 1 },
  logContent: { padding: spacing.lg },
  logTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: spacing.md },
  logCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  logRowHeader: { backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  logCell: { fontSize: 12, color: '#6B7280' },
  logHeaderText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  logFrom: { fontWeight: '500', color: '#374151' },
  logPreview: { color: '#6B7280' },
  statusBadge: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeText: { fontSize: 10, fontWeight: '600', color: '#16A34A' },

  // Chat messages
  messagesScroll: { flex: 1 },
  messagesContent: { padding: spacing.lg, gap: spacing.lg },
  noMessagesText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: spacing.xl },
  msgRowMine: { alignItems: 'flex-end' },
  msgRow: { alignItems: 'flex-start' },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  msgMetaMine: { flexDirection: 'row-reverse' },
  msgSenderName: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  bubble: { maxWidth: '75%', paddingHorizontal: spacing.lg, paddingVertical: 12, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  bubbleMine: { backgroundColor: PARENT_YELLOW, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.white, borderWidth: 1, borderColor: '#E5E7EB', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 13, lineHeight: 20, color: '#111827' },
  msgTime: { fontSize: 10, color: '#9CA3AF', marginTop: 4, marginHorizontal: 4 },

  // Composer
  composerWrap: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  composerToolbar: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  templateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 6 },
  templateBtnText: { fontSize: 12, color: '#4B5563' },
  templateMenu: { position: 'absolute', bottom: '100%', left: spacing.md, backgroundColor: colors.white, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: radius.lg, minWidth: 220, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 6, overflow: 'hidden', marginBottom: 4 },
  templateItem: { paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  templateItemText: { fontSize: 12, color: '#374151' },
  composerRow2: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  composerMain: { flex: 1, flexDirection: 'column', gap: spacing.sm },
  composerText: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 13, minHeight: 40, maxHeight: 120, color: '#111827', textAlignVertical: 'top' },
  composerTools: { flexDirection: 'row', gap: spacing.md },
  composerTool: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  composerToolText: { fontSize: 12, color: '#6B7280' },
  sendBtn: { width: 40, height: 40, borderRadius: radius.lg, backgroundColor: PARENT_YELLOW, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  sendBtnDisabled: { opacity: 0.4 },

  // Bottom bar
  bottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexWrap: 'wrap', gap: spacing.sm },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  statusText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  bottomBarRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  escalateBottomBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: colors.white, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 6 },
  escalateBottomText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  resolveBtn: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 6 },
  resolveBtnText: { fontSize: 12, fontWeight: '500', color: '#4B5563' },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.white, borderRadius: radius.lg, width: '100%', maxWidth: 380, borderWidth: 1, borderColor: '#F3F4F6' },
  resolveCard: { alignItems: 'center', paddingVertical: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalHeaderTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  modalTitle: { fontWeight: '700', fontSize: 14, color: '#111827' },
  modalBody: { padding: spacing.lg, gap: spacing.md },
  modalHint: { fontSize: 12, color: '#6B7280', lineHeight: 18 },
  modalTextArea: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: radius.lg, padding: spacing.md, fontSize: 13, minHeight: 100, color: '#111827', textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  modalBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: radius.lg },
  modalCancelBtn: { backgroundColor: '#F3F4F6' },
  modalCancelText: { fontWeight: '600', fontSize: 13, color: '#4B5563' },
  modalSendBtn: { backgroundColor: PARENT_YELLOW },
  modalSendText: { fontWeight: '600', fontSize: 13, color: '#111827' },
  btnDisabled: { opacity: 0.4 },
  resolveIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  resolveIcon: { fontSize: 24 },
  resolveTitle: { fontWeight: '700', fontSize: 16, color: '#111827', marginBottom: 4 },
  resolveHint: { fontSize: 13, color: '#6B7280', marginBottom: spacing.lg, textAlign: 'center' },
  resolveConfirmBtn: { backgroundColor: '#22C55E' },
  resolveConfirmText: { fontWeight: '600', fontSize: 13, color: colors.white },
});