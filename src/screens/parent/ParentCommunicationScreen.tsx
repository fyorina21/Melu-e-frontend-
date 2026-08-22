import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert, Modal, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { PARENT_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { useAuth } from '../../context/AuthContext';
import { parentApi } from '../../api';
import {
  getTeacherConversations,
  getTeacherConversationThread,
  sendTeacherMessage,
  escalateTeacherConversation,
  markTeacherConversationResolved,
} from '../../api/teacherExtrasApi';
import { downloadTextFile } from '../../utils/webExport';

// =========================================================================
// TYPES & CONSTANTS
// =========================================================================

type MessageSender = 'parent' | 'team';

interface ParentMessage {
  from: MessageSender;
  senderName: string;
  senderRole: string;
  text: string;
  time: string;
}

interface ParentConversation {
  id: string;
  recipient: string;
  role: string;
  avatarLetter: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: ParentMessage[];
}

interface LogEntry {
  date: string;
  from: string;
  preview: string;
  status: string;
}

interface TeacherConversation {
  id: string;
  studentName: string;
  parentName: string;
  lastMessagePreview: string;
  unreadCount: number;
  resolved: boolean;
}

interface TeacherThreadMessage {
  id: string;
  sender: string;
  senderLabel: string;
  text: string;
  timestamp: string;
  attachments?: { id: string; name: string }[];
}

const TEACHER_COLOR = '#38BDF8';
const DIRECTOR_COLOR = '#A855F7';
const COORDINATOR_COLOR = '#FBBF24';
const PARENT_YELLOW = '#FCD34D';

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

// =========================================================================
// TEACHER WORKSPACE PANEL
// =========================================================================

function TeacherCommunicationPanel({ navigation }: { navigation: any }) {
  const [conversations, setConversations] = useState<TeacherConversation[]>([]);
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
    } catch (err) {
      setConversations(DEMO_TEACHER_CONVERSATIONS);
      if (!activeId) setActiveId(DEMO_TEACHER_CONVERSATIONS[0].id);
    }
  }, [activeId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (!activeId) return;
    getTeacherConversationThread(activeId)
      .then(({ data }) => setThread(data.messages))
      .catch(() => setThread(DEMO_TEACHER_THREAD));
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
    const newMsg: TeacherThreadMessage = { id: `local-${Date.now()}`, sender: 'teacher', senderLabel: 'Teacher', text: draft, timestamp: 'Just now', attachments: pendingAttachments };
    setThread((prev) => [...prev, newMsg]);
    setDraft('');
    setPendingAttachments([]);
    try {
      await sendTeacherMessage(activeId, { text: newMsg.text, attachments: newMsg.attachments });
    } catch (err) {}
  };

  const handleShareSessionSummary = () => {
    const filename = `SessionSummary_${activeConversation?.studentName || 'Student'}.html`;
    const content = `
      <h2>Session Summary</h2>
      <p><b>Student:</b> ${activeConversation?.studentName || 'Student A'}</p>
      <p><b>Station:</b> Station 1 — Basic Skills · Room 2</p>
      <p><b>Date:</b> ${new Date().toLocaleDateString()}</p>
      <p><b>Status:</b> Approved by Coordinator</p>
      <p>Highlights: 12/15 trials independent; requesting items shows steady improvement; continue practicing requesting help.</p>
    `;
    downloadTextFile(filename, content);
    setDraft((prev) => `${prev}${prev ? ' ' : ''}[Shared: latest approved session summary (PDF)]`);
  };

  const handleShareProgressUpdate = () => {
    const filename = `ProgressChart_${activeConversation?.studentName || 'Student'}.html`;
    const content = `
      <h2>Goal Progress Chart</h2>
      <p><b>Student:</b> ${activeConversation?.studentName || 'Student A'}</p>
      <p><b>Goal:</b> Request Items (E2)</p>
      <p><b>Range:</b> Last 6 weeks</p>
      <p>Weekly independence: 40% → 55% → 62% → 70% → 78% → 85%</p>
    `;
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
          Alert.alert('Escalation sent');
        },
      },
    ]);
  };

  const handleResolve = () => {
    if (!activeId) return;
    Alert.alert('Mark Conversation Resolved?', 'This will archive the active thread status.', [
      { text: 'Cancel', style: 'cancel' },
      {
        onPress: async () => {
          try { await markTeacherConversationResolved(activeId); } catch (err) {}
          setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, resolved: true } : c)));
          Alert.alert('Conversation marked as resolved');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Parents" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />
      <View style={styles.body}>
        <View style={styles.sidebar}>
          <View style={styles.searchArea}>
            <Text style={styles.sidebarLabel}>Messages</Text>
            <View style={styles.searchWrap}>
              <Feather name="search" size={14} color="#94A3B8" style={styles.searchIcon} />
              <TextInput style={styles.searchInput} placeholder="Search student/parent..." placeholderTextColor="#94A3B8" value={search} onChangeText={setSearch} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
              <TouchableOpacity onPress={() => setStudentFilter('All')} style={[styles.filterTab, studentFilter === 'All' && styles.filterTabActive]}>
                <Text style={[styles.filterTabText, studentFilter === 'All' && styles.filterTabTextActive]}>All</Text>
              </TouchableOpacity>
              {uniqueStudents.map((name) => (
                <TouchableOpacity key={name} onPress={() => setStudentFilter(name)} style={[styles.filterTab, studentFilter === name && styles.filterTabActive]}>
                  <Text style={[styles.filterTabText, studentFilter === name && styles.filterTabTextActive]}>{name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <ScrollView>
            {visibleConversations.map((c) => (
              <TouchableOpacity key={c.id} onPress={() => setActiveId(c.id)} style={[styles.convoRow, activeId === c.id && styles.convoRowActive]}>
                <View style={[styles.avatar, { backgroundColor: TEACHER_COLOR }]}>
                  <Text style={styles.avatarLetter}>{c.studentName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.convoMetaRow}>
                    <Text style={typography.bodyBold}>{c.studentName}</Text>
                    {c.unreadCount > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{c.unreadCount}</Text></View>}
                  </View>
                  <Text style={typography.caption}>{c.parentName} (Parent)</Text>
                  <Text style={styles.lastMessage} numberOfLines={1}>{c.lastMessagePreview}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.chatArea}>
          {activeConversation ? (
            <>
              <View style={styles.chatHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>{activeConversation.studentName}</Text>
                  <Text style={typography.caption}>Parent Contact: {activeConversation.parentName}</Text>
                </View>
                <View style={styles.headerActions}>
                  <TouchableOpacity style={styles.actionPill} onPress={handleEscalate}><Feather name="alert-triangle" size={12} color="#DC2626" /><Text style={[styles.actionPillText, { color: '#DC2626' }]}>Escalate</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.actionPill} onPress={handleResolve}><Feather name="check" size={12} color="#059669" /><Text style={[styles.actionPillText, { color: '#059669' }]}>Resolve</Text></TouchableOpacity>
                </View>
              </View>

              <View style={styles.toolbar}>
                <TouchableOpacity style={styles.toolBtn} onPress={handleShareSessionSummary}><Feather name="file-text" size={14} color="#0F172A" /><Text style={styles.toolBtnText}>Share Session</Text></TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={handleShareProgressUpdate}><Feather name="trending-up" size={14} color="#0F172A" /><Text style={styles.toolBtnText}>Share Progress</Text></TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={handleRequestHomeObservation}><Feather name="edit" size={14} color="#0F172A" /><Text style={styles.toolBtnText}>Request Observation</Text></TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={handleViewHomeObservation}><Feather name="eye" size={14} color="#0F172A" /><Text style={styles.toolBtnText}>View Home Observation</Text></TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.messagesList}>
                {thread.map((m) => {
                  const isMe = m.sender === 'teacher';
                  return (
                    <View key={m.id} style={[styles.msgWrap, isMe ? styles.msgWrapMe : styles.msgWrapOther]}>
                      <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
                        <Text style={[styles.msgSenderLabel, { color: isMe ? '#E0F2FE' : '#64748B' }]}>{m.senderLabel}</Text>
                        <Text style={[styles.msgText, { color: isMe ? '#FFFFFF' : '#0F172A' }]}>{m.text}</Text>
                        {m.attachments?.map((a) => (
                          <View key={a.id} style={styles.attachmentBadge}><Feather name="file" size={12} color="#0284C7" /><Text style={styles.attachmentName}>{a.name}</Text></View>
                        ))}
                        <Text style={[styles.msgTime, { color: isMe ? '#BAE6FD' : '#94A3B8' }]}>{m.timestamp}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              {pendingAttachments.length > 0 && (
                <View style={styles.pendingArea}>
                  {pendingAttachments.map((a) => (
                    <View key={a.id} style={styles.pendingChip}>
                      <Feather name="file" size={12} color="#64748B" />
                      <Text style={styles.pendingChipText} numberOfLines={1}>{a.name}</Text>
                      <TouchableOpacity onPress={() => removePendingAttachment(a.id)}><Feather name="x" size={14} color="#94A3B8" /></TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.inputBar}>
                <TouchableOpacity style={styles.iconBtn} onPress={handleAttach}><Feather name="paperclip" size={18} color="#64748B" /></TouchableOpacity>
                <TextInput style={styles.textInput} placeholder="Type a message to Parent..." value={draft} onChangeText={setDraft} onSubmitEditing={handleSend} />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend}><Feather name="send" size={16} color="#FFFFFF" /></TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.emptyChat}><Feather name="message-square" size={48} color="#CBD5E1" /><Text style={typography.body}>Select a student thread to start messaging</Text></View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const DEMO_TEACHER_CONVERSATIONS: TeacherConversation[] = [
  { id: 'tcon-1', studentName: 'Aiden Smith', parentName: 'Sarah Smith', lastMessagePreview: 'Auto-shared progress report card...', unreadCount: 1, resolved: false },
  { id: 'tcon-2', studentName: 'Emma Watson', parentName: 'John Watson', lastMessagePreview: 'Perfect, thank you!', unreadCount: 0, resolved: false },
];

const DEMO_TEACHER_THREAD: TeacherThreadMessage[] = [
  { id: 'tmsg-1', sender: 'parent', senderLabel: 'Sarah Smith (Parent)', text: 'Hello! How did Aiden do during circle time today?', timestamp: 'Yesterday 3:00 PM' },
  { id: 'tmsg-2', sender: 'teacher', senderLabel: 'Teacher A', text: 'He did fantastic! Aiden sat for the entire 15 minutes and responded to color identification prompts.', timestamp: 'Yesterday 4:00 PM' },
];

// =========================================================================
// PARENT WORKSPACE PANEL
// =========================================================================

function ParentCommunicationPanel({ navigation }: { navigation: any }) {
  const [conversations, setConversations] = useState<ParentConversation[]>([]);
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
    } catch (err) {
      setConversations(DEMO_PARENT_CONVERSATIONS);
      setSelectedId(DEMO_PARENT_CONVERSATIONS[0].id);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

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
          time: m.sentAt ?? m.timestamp ?? '',
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedId) return;
    const msg: ParentMessage = { from: 'parent', senderName: 'Parent A', senderRole: 'Parent', text: newMessage.trim(), time: 'Just now' };
    const updated = conversations.map((c) =>
      c.id === selectedId ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, time: 'Just now', unread: 0 } : c
    );
    setConversations(updated);
    setNewMessage('');
    try { await parentApi.sendMessage(selectedId, msg.text); } catch (err) {}
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
      try { await parentApi.setConversationResolved(selectedId, true); } catch (err) {}
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
              <TextInput style={styles.searchInput} placeholder="Search conversations..." placeholderTextColor="#9CA3AF" value={searchQuery} onChangeText={setSearchQuery} />
            </View>
          </View>
          <ScrollView>
            {filteredConvos.map((c) => {
              const badge = roleBadgeStyle(c.role);
              return (
                <TouchableOpacity key={c.id} onPress={() => handleSelectConversation(c.id)} style={[styles.convoRow, selectedId === c.id && styles.convoRowActive]}>
                  <View style={[styles.avatar, { backgroundColor: avatarColor(c.role) }]}>
                    <Text style={styles.avatarLetter}>{c.avatarLetter}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.convoMetaRow}>
                      <Text style={typography.bodyBold}>{c.recipient}</Text>
                      {c.unread > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{c.unread}</Text></View>}
                    </View>
                    <View style={[styles.badgeWrap, badge]}><Text style={[styles.badgeTextLabel, { color: badge.color }]}>{c.role}</Text></View>
                    <Text style={styles.lastMessage} numberOfLines={1}>{c.lastMessage}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.chatArea}>
          {selected ? (
            <>
              <View style={styles.chatHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>{selected.recipient}</Text>
                  <Text style={typography.caption}>{selected.role} &middot; Aiden Smith's Team</Text>
                </View>
                <View style={styles.headerActions}>
                  <TouchableOpacity style={styles.actionPill} onPress={() => setShowEscalateModal(true)}><Feather name="alert-triangle" size={12} color="#DC2626" /><Text style={[styles.actionPillText, { color: '#DC2626' }]}>Escalate</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.actionPill} onPress={() => setShowResolveConfirm(true)}><Feather name="check" size={12} color="#059669" /><Text style={[styles.actionPillText, { color: '#059669' }]}>Resolve</Text></TouchableOpacity>
                </View>
              </View>

              <View style={styles.tabsRow}>
                <TouchableOpacity style={[styles.tab, activeTab === 'chat' && styles.tabActive]} onPress={() => setActiveTab('chat')}><Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>Chat Messages</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'log' && styles.tabActive]} onPress={() => setActiveTab('log')}><Text style={[styles.tabText, activeTab === 'log' && styles.tabTextActive]}>Log History</Text></TouchableOpacity>
              </View>

              {activeTab === 'chat' ? (
                <>
                  <ScrollView ref={messagesEndRef} contentContainerStyle={styles.messagesList}>
                    {selected.messages.map((m, idx) => {
                      const isMe = m.from === 'parent';
                      return (
                        <View key={idx} style={[styles.msgWrap, isMe ? styles.msgWrapMe : styles.msgWrapOther]}>
                          <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
                            <Text style={[styles.msgSenderLabel, { color: isMe ? '#FDE68A' : '#64748B' }]}>{m.senderName} ({m.senderRole})</Text>
                            <Text style={[styles.msgText, { color: isMe ? '#1F2937' : '#1F2937' }]}>{m.text}</Text>
                            <Text style={[styles.msgTime, { color: isMe ? '#78350F' : '#94A3B8' }]}>{m.time}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.inputBar}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => setShowTemplateMenu((v) => !v)}><Feather name="file-text" size={18} color="#64748B" /></TouchableOpacity>
                    <TextInput style={styles.textInput} placeholder="Type a message to Aiden's Team..." value={newMessage} onChangeText={setNewMessage} onSubmitEditing={sendMessage} />
                    <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primaryYellow }]} onPress={sendMessage}><Feather name="send" size={16} color={colors.navyText} /></TouchableOpacity>
                  </View>
                </>
              ) : (
                <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
                  <Text style={typography.bodyBold}>Past Reports & Logs Shared</Text>
                  {DEMO_PARENT_LOG.map((log, idx) => (
                    <View key={idx} style={styles.logCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={typography.bodyBold}>{log.preview}</Text>
                        <Text style={typography.caption}>Sent by {log.from} on {log.date}</Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={colors.mutedText} />
                    </View>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={styles.emptyChat}><Feather name="message-square" size={48} color="#CBD5E1" /><Text style={typography.body}>Select a thread to view conversations</Text></View>
          )}
        </View>
      </View>

      {/* Modals */}
      <Modal visible={showTemplateMenu} transparent animationType="fade">
        <Pressable style={styles.menuOverlay} onPress={() => setShowTemplateMenu(false)}>
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Standard Responses</Text>
            {DEMO_PARENT_TEMPLATES.map((t, i) => (
              <TouchableOpacity key={i} style={styles.menuItem} onPress={() => applyTemplate(t.text)}><Text style={styles.menuItemText}>{t.label}</Text></TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showEscalateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={typography.h3}>Escalate Conversation</Text>
            <Text style={typography.body}>Please provide a reason to escalate this thread directly to Director A.</Text>
            <TextInput style={styles.modalInput} placeholder="Type reason here..." value={escalateReason} onChangeText={setEscalateReason} multiline />
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEscalateModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleEscalate}><Text style={styles.saveBtnText}>Send Escalation</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showResolveConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={typography.h3}>Mark Resolved?</Text>
            <Text style={typography.body}>Are you sure you want to mark this conversation thread resolved?</Text>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowResolveConfirm(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleResolve}><Text style={styles.saveBtnText}>Confirm</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const DEMO_PARENT_CONVERSATIONS: ParentConversation[] = [
  {
    id: 'pcon-1',
    recipient: 'Teacher A',
    role: 'Teacher',
    avatarLetter: 'T',
    lastMessage: 'Aiden had an excellent session...',
    time: 'Today',
    unread: 1,
    messages: [
      { from: 'team', senderName: 'Teacher A', senderRole: 'Teacher', text: 'Good morning! Aiden had a great session today. He independently identified all 5 colors.', time: '9:15 AM' },
    ],
  },
];

const DEMO_PARENT_LOG: LogEntry[] = [
  { date: '2026-08-18', from: 'Teacher A', preview: 'Color identification milestone report', status: 'Read' },
];

const DEMO_PARENT_TEMPLATES = [
  { label: 'Thank you message', text: 'Thank you so much for the update! We really appreciate the care your team puts into Aiden.' },
];

// =========================================================================
// MAIN EXPORT CONTROLLER
// =========================================================================

export default function ParentCommunicationScreen(props: any) {
  const { session } = useAuth();
  const role = session?.role;

  if (role === 'teacher') {
    return <TeacherCommunicationPanel {...props} />;
  }
  return <ParentCommunicationPanel {...props} />;
}

// =========================================================================
// STYLES
// =========================================================================

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  body: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 320, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.bgCard },
  searchArea: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  sidebarLabel: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgApp, borderRadius: radius.md, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border },
  searchIcon: { marginRight: spacing.xs },
  searchInput: { flex: 1, height: 38, fontSize: 13, color: colors.navyText },
  filterTabs: { flexDirection: 'row', gap: spacing.xs },
  filterTab: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: colors.bgApp },
  filterTabActive: { backgroundColor: colors.primaryYellow },
  filterTabText: { fontSize: 11, fontWeight: '600', color: colors.bodyText },
  filterTabTextActive: { color: colors.navyText },
  convoRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  convoRowActive: { backgroundColor: '#F8FAFC' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  convoMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unreadBadge: { backgroundColor: '#EF4444', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  unreadBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  badgeWrap: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginVertical: 4 },
  badgeTextLabel: { fontSize: 9, fontWeight: '700' },
  lastMessage: { fontSize: 12, color: colors.mutedText, marginTop: 2 },
  chatArea: { flex: 1, backgroundColor: colors.bgApp },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.bgCard },
  actionPillText: { fontSize: 11, fontWeight: '600' },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: colors.border },
  toolBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  toolBtnText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCard },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primaryYellow },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.bodyText },
  tabTextActive: { color: colors.navyText, fontWeight: '700' },
  messagesList: { padding: spacing.lg, gap: spacing.md },
  msgWrap: { flexDirection: 'row', width: '100%' },
  msgWrapMe: { justifyContent: 'flex-end' },
  msgWrapOther: { justifyContent: 'flex-start' },
  msgBubble: { maxWidth: '70%', padding: spacing.md, borderRadius: radius.lg },
  msgBubbleMe: { backgroundColor: '#FEF3C7', borderBottomRightRadius: 2 },
  msgBubbleOther: { backgroundColor: colors.bgCard, borderBottomLeftRadius: 2, borderWidth: 1, borderColor: colors.border },
  msgSenderLabel: { fontSize: 9, fontWeight: '700', marginBottom: 2 },
  msgText: { fontSize: 13, lineHeight: 18 },
  msgTime: { fontSize: 9, alignSelf: 'flex-end', marginTop: 4 },
  attachmentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F9FF', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm, marginTop: spacing.xs, borderWidth: 1, borderColor: '#BAE6FD' },
  attachmentName: { fontSize: 11, color: '#0284C7', fontWeight: '500' },
  pendingArea: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, padding: spacing.sm, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: colors.border },
  pendingChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  pendingChipText: { fontSize: 11, color: colors.bodyText, maxWidth: 180 },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  iconBtn: { padding: spacing.xs },
  textInput: { flex: 1, height: 40, backgroundColor: colors.bgApp, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: 13, color: colors.navyText },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navyText, alignItems: 'center', justifyContent: 'center' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, opacity: 0.7 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'flex-end', padding: spacing.lg },
  menuCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.xs },
  menuTitle: { fontSize: 14, fontWeight: '700', color: colors.navyText, marginBottom: spacing.xs },
  menuItem: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuItemText: { fontSize: 13, color: colors.navyText },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalCard: { width: '100%', maxWidth: 440, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  modalInput: { height: 100, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 13, textAlignVertical: 'top', color: colors.navyText },
  modalFooter: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  saveBtn: { flex: 1, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
  logCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
});