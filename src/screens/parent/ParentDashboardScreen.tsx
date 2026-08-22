import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { radius, spacing } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { PARENT_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { useBreakpoint } from '../../utils/useBreakpoint';
import { parentApi } from '../../api';
import type { ParentStackParamList } from '../../types';

const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const quickActions = [
  { label: 'View Progress', tab: 'Progress', iconBg: '#F0F9FF', iconColor: '#38BDF8', icon: 'bar-chart-2' as const },
  { label: 'Log Observation', tab: 'Observations', iconBg: '#F0FDF4', iconColor: '#22C55E', icon: 'edit-3' as const },
  { label: 'Messages', tab: 'Messages', iconBg: '#FFFBEB', iconColor: '#EAB308', icon: 'message-circle' as const },
];

const SKY = '#38BDF8';
const YELLOW = '#FCD34D';

type Layout = 'mobile' | 'tablet' | 'desktop';

const cardFlex: Record<Layout, Record<string, number>> = {
  mobile: { child: 1, updates: 1, actions: 1, notifs: 1, message: 1 },
  tablet: { child: 1, updates: 1, actions: 1, notifs: 1, message: 1 },
  desktop: { child: 2, updates: 2, actions: 3, notifs: 1, message: 1 },
};

function ProgressRing({ percent, size = 104, stroke = 10 }: { percent: number; size?: number; stroke?: number }) {
  const track = '#F3F4F6';
  const color = SKY;
  const COUNT = 48;
  const pct = Math.max(0, Math.min(100, percent));
  const segW = 7.5;
  const segments: React.ReactNode[] = [];
  for (let i = 0; i < COUNT; i++) {
    const angle = (i / COUNT) * 360;
    const filled = (i / COUNT) * 100 <= pct;
    segments.push(
      <View key={i} style={[styles.ringSegWrap, { width: size, height: size, transform: [{ rotate: `${angle}deg` }] }]}>
        <View style={[styles.ringSeg, { width: segW, height: stroke, backgroundColor: filled ? color : track }]} />
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: stroke, borderColor: track }} />
      {segments}
      <View style={{ width: size - stroke * 2, height: size - stroke * 2, borderRadius: (size - stroke * 2) / 2, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={styles.ringText}>{pct}%</Text>
      </View>
    </View>
  );
}

export default function ParentDashboardScreen({ navigation }: NativeStackScreenProps<ParentStackParamList, 'ParentDashboard'>) {
  const [recentUpdates, setRecentUpdates] = useState<Array<{ id: number; icon: string; iconBg: string; text: string; time: string }>>([]);
  const [notifications, setNotifications] = useState<Array<{ id: number; text: string }>>([]);
  const [dash, setDash] = useState<{
    parentName: string;
    childName: string;
    childAge: number;
    childProgram: string;
    independence: number;
    sessionsThisWeek: number;
    sessionsTotal: number;
    latestMessage: { from: string; preview: string; time: string } | null;
    unreadCount: number;
  } | null>(null);
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const ringSize = isMobile ? 96 : 108;

  const load = useCallback(async () => {
    try {
      const res = await parentApi.dashboard();
      setDash({
        parentName: res.parentName ?? 'Parent',
        childName: res.childSummary?.fullName ?? 'Student',
        childAge: res.childSummary?.age ?? 0,
        childProgram: res.childSummary?.programType ?? 'ABA',
        independence: res.independencePercent ?? 0,
        sessionsThisWeek: res.sessionsThisWeek ?? 0,
        sessionsTotal: res.sessionsTotal ?? 0,
        latestMessage: res.latestMessage,
        unreadCount: (res as any).unreadCount ?? 0,
      });
      // Build recent updates from real data
      const updates: Array<{ id: number; icon: string; iconBg: string; text: string; time: string }> = [];
      let uid = 1;
      const goals = res.childSummary?.goals ?? [];
      for (const g of goals) {
        if (g.status === 'mastered') {
          updates.push({ id: uid++, icon: '✅', iconBg: '#DCFCE7', text: `Goal mastered: ${g.name}`, time: 'Recent' });
        } else if (g.progressPercent > 0) {
          updates.push({ id: uid++, icon: '📊', iconBg: '#FEF9C3', text: `Goal progress: ${g.name} at ${g.progressPercent}%`, time: 'Recent' });
        }
      }
      if (res.sessionsThisWeek > 0) {
        updates.push({ id: uid++, icon: '📋', iconBg: '#E0F2FE', text: `${res.sessionsThisWeek} sessions completed this week`, time: 'This week' });
      }
      setRecentUpdates(updates.length > 0 ? updates : [{ id: 1, icon: '📋', iconBg: '#E0F2FE', text: 'No recent updates yet', time: '' }]);

      // Build notifications from unread messages
      const notifs: Array<{ id: number; text: string }> = [];
      if (res.unreadCount > 0) notifs.push({ id: 1, text: `${res.unreadCount} unread message(s)` });
      if (res.latestMessage) notifs.push({ id: 2, text: `Latest: ${res.latestMessage.from} — ${res.latestMessage.preview}` });
      setNotifications(notifs);
    } catch (err) {
      setDash({
        parentName: 'Parent',
        childName: 'Student',
        childAge: 0,
        childProgram: 'ABA',
        independence: 0,
        sessionsThisWeek: 0,
        sessionsTotal: 0,
        latestMessage: null,
        unreadCount: 0,
      });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dismissNotification = (id: number) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  const goto = (tab: string) => navigation?.navigate?.(PARENT_ROUTE_BY_TAB[tab]);

  const cardW = (key: 'child' | 'updates' | 'actions' | 'notifs' | 'message') => ({ flex: cardFlex[bp][key] });

  const parentName = dash?.parentName ?? 'Parent';
  const childName = dash?.childName ?? 'Student';
  const childAge = dash?.childAge ?? 0;
  const independence = dash?.independence ?? 0;
  const sessionsDone = dash?.sessionsThisWeek ?? 0;
  const sessionsTotal = dash?.sessionsTotal ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Dashboard" onTabPress={goto} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainCol, bp === 'desktop' && styles.mainColDesktop]}>
          <View style={styles.mobileWelcome}>
            <Text style={styles.mobileWelcomeTitle}>Welcome back, {parentName} 👋</Text>
            <Text style={styles.mobileWelcomeDate}>{today}</Text>
          </View>

          <View style={bp === 'desktop' ? styles.gridRow : undefined}>
            <View style={[styles.card, cardW('child')]}>
              <View style={styles.childHeader}>
                <View style={styles.childAvatar}><Text style={styles.childAvatarText}>{childName[0]}</Text></View>
                <View>
                  <Text style={styles.childName}>{childName}</Text>
                  <Text style={styles.childMeta}>Age {childAge} · {dash?.childProgram ?? 'ABA'} Therapy Program</Text>
                </View>
              </View>

              <View style={[styles.childStatsRow, bp === 'mobile' && styles.childStatsRowMobile]}>
                <View style={styles.independenceCol}>
                  <ProgressRing percent={independence} size={ringSize} />
                  <Text style={styles.independenceLabel}>Overall{"\n"}Independence</Text>
                </View>
                <View style={styles.statCol}>
                  <View style={styles.sessionsCard}>
                    <Text style={styles.statLabel}>Sessions this week</Text>
                    <Text style={styles.statValue}>{sessionsDone} <Text style={styles.statSubValue}>of {sessionsTotal} scheduled</Text></Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${sessionsTotal ? (sessionsDone / sessionsTotal) * 100 : 0}%` }]} />
                    </View>
                  </View>
                  <View style={styles.lastSessionCard}>
                    <Text style={styles.statLabel}>Last session</Text>
                    <Text style={styles.lastSessionValue}>Today at 9:00 AM</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.fullProgressBtn} onPress={() => goto('Progress')}>
                <Text style={styles.fullProgressBtnText}>View Full Progress →</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, cardW('notifs')]}>
              <View style={styles.notifCardHeader}>
                <Text style={styles.cardTitle}>Notifications</Text>
                {notifications.length > 0 && (
                  <View style={styles.newBadge}><Text style={styles.newBadgeText}>{notifications.length} new</Text></View>
                )}
              </View>
              {notifications.length === 0 ? (
                <Text style={styles.noNotifText}>No new notifications.</Text>
              ) : (
                <View style={styles.notifList}>
                  {notifications.map((n) => (
                    <View key={n.id} style={styles.notifRow}>
                      <View style={styles.notifOrangeDot} />
                      <Text style={styles.notifText}>{n.text}</Text>
                      <TouchableOpacity onPress={() => dismissNotification(n.id)} accessibilityLabel="Dismiss notification">
                        <Text style={styles.notifX}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={bp === 'desktop' ? styles.gridRow : undefined}>
            <View style={[styles.card, cardW('updates')]}>
              <Text style={styles.cardTitle}>Recent Updates</Text>
              <View style={styles.updatesList}>
                {recentUpdates.map((u) => (
                  <TouchableOpacity key={u.id} style={styles.updateRow} onPress={() => goto('Progress')}>
                    <View style={[styles.updateIconBg, { backgroundColor: u.iconBg }]}><Text style={styles.updateIcon}>{u.icon}</Text></View>
                    <View style={styles.updateMain}>
                      <Text style={styles.updateText}>{u.text}</Text>
                      <Text style={styles.updateTime}>{u.time}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color="#D1D5DB" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.card, cardW('message')]}>
              <View style={styles.latestMessageHeader}>
                <View style={styles.latestMessageMain}>
                  <View style={styles.latestMessageLabelRow}>
                    <Text style={styles.latestMessageLabel}>Latest Message</Text>
                    {(dash?.unreadCount ?? 0) > 0 && (
                      <View style={styles.unreadPill}><Text style={styles.unreadPillText}>{dash?.unreadCount} unread</Text></View>
                    )}
                  </View>
                  <Text style={styles.latestMessageText}>
                    {dash?.latestMessage ? (
                      <>
                        <Text style={styles.latestMessageSender}>{dash.latestMessage.from}:</Text>{' '}
                        {dash.latestMessage.preview}
                      </>
                    ) : (
                      'No messages yet'
                    )}
                  </Text>
                </View>
                <View style={styles.messageIconCircle}>
                  <Feather name="message-circle" size={20} color={SKY} />
                </View>
              </View>
              <TouchableOpacity style={styles.openMessagesBtn} onPress={() => goto('Messages')}>
                <Text style={styles.openMessagesBtnText}>Open Messages</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.card, cardW('actions')]}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <View style={[styles.quickActionsGrid, bp === 'desktop' && styles.quickActionsGridDesktop]}>
              {quickActions.map((action) => (
                <TouchableOpacity key={action.label} style={[styles.quickActionCard, bp === 'desktop' && styles.quickActionCardDesktop]} onPress={() => goto(action.tab)}>
                  <View style={[styles.quickActionIconBg, { backgroundColor: action.iconBg }]}>
                    <Feather name={action.icon} size={24} color={action.iconColor} />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },

  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  mainCol: { width: '100%', gap: spacing.xl },
  mainColDesktop: { gap: spacing.lg },

  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },

  mobileWelcome: { marginBottom: spacing.xs },
  mobileWelcomeTitle: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  mobileWelcomeDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  card: { backgroundColor: '#FFFFFF', borderRadius: radius.lg, borderWidth: 1, borderColor: '#F3F4F6', padding: spacing.xl, gap: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },

  childHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  childAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: SKY, alignItems: 'center', justifyContent: 'center' },
  childAvatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 18 },
  childName: { fontWeight: '700', color: '#1F2937', fontSize: 16, lineHeight: 20 },
  childMeta: { fontSize: 12, color: '#9CA3AF' },

  childStatsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  childStatsRowMobile: { gap: spacing.lg },
  independenceCol: { alignItems: 'center', gap: 4 },
  independenceLabel: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 16, marginTop: 4 },
  statCol: { flex: 1, gap: spacing.md },
  sessionsCard: { backgroundColor: '#F0F9FF', borderRadius: radius.lg, padding: spacing.md },
  lastSessionCard: { backgroundColor: '#FFFBEB', borderRadius: radius.lg, padding: spacing.md },
  statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  statValue: { fontWeight: '700', color: '#1F2937', fontSize: 16 },
  statSubValue: { fontSize: 13, fontWeight: '400', color: '#9CA3AF' },
  lastSessionValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  barTrack: { width: '100%', height: 8, borderRadius: radius.pill, backgroundColor: '#F3F4F6', marginTop: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.pill, backgroundColor: SKY },

  fullProgressBtn: { backgroundColor: SKY, borderRadius: radius.lg, paddingVertical: 10, alignItems: 'center', marginTop: spacing.sm },
  fullProgressBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },

  ringText: { fontSize: 18, fontWeight: '700', color: '#1E40AF' },
  ringSegWrap: { position: 'absolute', top: 0, left: 0, alignItems: 'center' },
  ringSeg: { borderRadius: 4 },

  cardTitle: { fontWeight: '700', color: '#1F2937', fontSize: 16 },
  updatesList: { gap: spacing.sm },
  updateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: '#F9FAFB' },
  updateIconBg: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  updateIcon: { fontSize: 14 },
  updateMain: { flex: 1 },
  updateText: { fontSize: 13, fontWeight: '500', color: '#1F2937', lineHeight: 18 },
  updateTime: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickActionsGridDesktop: { gap: spacing.lg },
  quickActionCard: { width: '48%', flexGrow: 1, backgroundColor: '#FFFFFF', borderRadius: radius.lg, borderWidth: 1, borderColor: '#F3F4F6', padding: spacing.lg, alignItems: 'center', gap: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  quickActionCardDesktop: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', width: 'auto', flex: 1, gap: spacing.md },
  quickActionIconBg: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: 13, fontWeight: '600', color: '#374151', textAlign: 'center' },

  notifCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newBadge: { backgroundColor: '#FEE2E2', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  newBadgeText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  noNotifText: { fontSize: 13, color: '#9CA3AF' },
  notifList: { gap: spacing.sm },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FFEDD5' },
  notifOrangeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FB923C' },
  notifText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },
  notifX: { fontSize: 14, color: '#D1D5DB' },

  latestMessageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  latestMessageMain: { flex: 1, minWidth: 0 },
  latestMessageLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  latestMessageLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  unreadPill: { backgroundColor: '#EF4444', borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 2 },
  unreadPillText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  latestMessageText: { fontSize: 13, color: '#374151', lineHeight: 18 },
  latestMessageSender: { fontWeight: '600', color: SKY },
  messageIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center' },
  openMessagesBtn: { backgroundColor: YELLOW, borderRadius: radius.lg, paddingVertical: 10, alignItems: 'center', marginTop: spacing.xs },
  openMessagesBtnText: { color: '#1F2937', fontWeight: '700', fontSize: 13 },
});