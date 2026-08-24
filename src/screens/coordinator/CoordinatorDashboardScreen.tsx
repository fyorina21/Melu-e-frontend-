import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import {
  Bell,
  ClipboardList,
  FileText,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Activity,
  Users,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CoordinatorStackParamList } from '../../types';
import AppNavbar from '../../components/AppNavbar';
import { colors, radius, spacing } from '../../theme/colors';

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'CoordinatorDashboard'>;

const SKY = '#38BDF8';
const AMBER = '#FCD34D';
const DARK = '#1F2937';

interface PendingReview {
  id: string;
  teacher: string;
  station: string;
  date: string;
  students: string[];
  independence: number;
  incidents: number;
}

interface LiveSession {
  id: string;
  teacher: string;
  station: string;
  students: string[];
  timer: number;
  trials: number;
  status: 'on-track' | 'needs-attention' | 'overdue';
}

interface NotificationItem {
  id: string;
  text: string;
  read: boolean;
  time: string;
  urgent: boolean;
}

const PENDING_REVIEWS: PendingReview[] = [
  { id: '1', teacher: 'Teacher A', station: 'Station 1', date: 'Aug 4, 2026', students: ['Student A', 'Student B'], independence: 72, incidents: 0 },
  { id: '2', teacher: 'Teacher B', station: 'Station 1', date: 'Aug 4, 2026', students: ['Student C', 'Student D'], independence: 65, incidents: 1 },
  { id: '3', teacher: 'Teacher A', station: 'Station 2', date: 'Aug 3, 2026', students: ['Student B', 'Student D'], independence: 70, incidents: 0 },
  { id: '4', teacher: 'Teacher B', station: 'Station 1', date: 'Aug 2, 2026', students: ['Student A', 'Student B'], independence: 58, incidents: 2 },
  { id: '5', teacher: 'Teacher C', station: 'Station 2', date: 'Aug 1, 2026', students: ['Student C'], independence: 68, incidents: 0 },
];

const INITIAL_SESSIONS: LiveSession[] = [
  { id: 's1', teacher: 'Teacher A', station: 'Station 1', students: ['Student A', 'Student B'], timer: 2340, trials: 18, status: 'on-track' },
  { id: 's2', teacher: 'Teacher B', station: 'Station 1', students: ['Student C', 'Student D'], timer: 1800, trials: 12, status: 'needs-attention' },
  { id: 's3', teacher: 'Teacher C', station: 'Station 2', students: ['Student A', 'Student C'], timer: 900, trials: 6, status: 'on-track' },
  { id: 's4', teacher: 'Teacher B', station: 'Station 2', students: ['Student B', 'Student D'], timer: 3600, trials: 24, status: 'overdue' },
  { id: 's5', teacher: 'Teacher A', station: 'Station 1', students: ['Student C'], timer: 1200, trials: 9, status: 'on-track' },
  { id: 's6', teacher: 'Teacher C', station: 'Station 2', students: ['Student D'], timer: 600, trials: 4, status: 'needs-attention' },
];

const STATUS_CONFIG: Record<LiveSession['status'], { dot: string; label: string; badgeBg: string; badgeText: string }> = {
  'on-track': { dot: '#4ADE80', label: 'On Track', badgeBg: '#F0FDF4', badgeText: '#15803D' },
  'needs-attention': { dot: '#FACC15', label: 'Needs Attention', badgeBg: '#FEFCE8', badgeText: '#A16207' },
  overdue: { dot: '#F87171', label: 'Overdue', badgeBg: '#FEF2F2', badgeText: '#B91C1C' },
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', text: 'Teacher B session in Station 1 needs attention — 1 incident logged.', read: false, time: '5 min ago', urgent: true },
  { id: 'n2', text: 'Session summary from Teacher C pending review since Aug 3.', read: false, time: '20 min ago', urgent: false },
  { id: 'n3', text: 'Teacher B Station 2 session is overdue by 15 min.', read: false, time: '1 hr ago', urgent: true },
  { id: 'n4', text: 'Student A reached 80% independence on "Identify Colors" goal.', read: false, time: '2 hr ago', urgent: false },
];

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function CoordinatorDashboardScreen({ navigation }: Props) {
  const [sessions, setSessions] = useState<LiveSession[]>(INITIAL_SESSIONS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setSessions((prev) => prev.map((s) => ({ ...s, timer: s.timer + 1 })));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const handleTabPress = (tab: string) => {
    const routeByTab: Record<string, keyof CoordinatorStackParamList> = {
      Dashboard: 'CoordinatorDashboard',
      'Live Sessions': 'LiveSessionMonitoring',
      Review: 'SessionSummaryReview',
      Progress: 'CoordinatorStudentProgress',
      Schedule: 'CoordinatorSchedule',
      Parents: 'CoordinatorParentCommunication',
      Notifications: 'Notifications',
    };
    const route = routeByTab[tab];
    if (route) navigation?.navigate?.(route as never);
  };

  const goto = (route: keyof CoordinatorStackParamList) => navigation?.navigate?.(route as never);

  const stats: { label: string; value: number; icon: typeof Activity; color: string; bg: string; route: keyof CoordinatorStackParamList }[] = [
    { label: 'Active Sessions Now', value: sessions.length, icon: Activity, color: SKY, bg: '#F0F9FF', route: 'LiveSessionMonitoring' },
    { label: 'Sessions Pending Review', value: PENDING_REVIEWS.length, icon: FileText, color: AMBER, bg: '#FFFBEB', route: 'SessionSummaryReview' },
    { label: 'Students in Therapy', value: 4, icon: Target, color: '#22C55E', bg: '#F0FDF4', route: 'CoordinatorStudentProgress' },
    { label: 'Teachers On Duty', value: 3, icon: Users, color: '#A855F7', bg: '#FAF5FF', route: 'WorkloadDashboard' },
  ];

  const dailySummary: { label: string; value: number; icon: typeof Activity; color: string }[] = [
    { label: 'Sessions Completed', value: 14, icon: CheckCircle, color: '#16A34A' },
    { label: 'Trials Logged', value: 186, icon: ClipboardList, color: SKY },
    { label: 'Incidents Recorded', value: 4, icon: AlertCircle, color: '#F97316' },
    { label: 'Goals Mastered', value: 2, icon: TrendingUp, color: '#A855F7' },
  ];

  const quickActions: { label: string; icon: typeof Activity; route: keyof CoordinatorStackParamList; color: string }[] = [
    { label: 'Live Sessions', icon: Activity, route: 'LiveSessionMonitoring', color: SKY },
    { label: 'Session Review', icon: FileText, route: 'SessionSummaryReview', color: AMBER },
    { label: 'Student Progress', icon: Target, route: 'CoordinatorStudentProgress', color: '#22C55E' },
    { label: 'Operations', icon: Users, route: 'WorkloadDashboard', color: '#A855F7' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Dashboard" onTabPress={handleTabPress} unreadCount={unreadCount} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Therapy Coordinator Dashboard</Text>
            <Text style={styles.headerSubtitle}>Foundation operations overview & live monitoring</Text>
          </View>
          <View>
            <TouchableOpacity
              onPress={() => setBellOpen((v) => !v)}
              style={styles.bellButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Bell size={20} color="#4B5563" />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            {bellOpen && (
              <View style={styles.notifDropdown}>
                <View style={styles.notifDropdownHeader}>
                  <Text style={styles.notifDropdownTitle}>Notifications</Text>
                  {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllRead}>
                      <Text style={styles.linkText}>Mark all read</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled>
                  {notifications.map((n) => (
                    <View
                      key={n.id}
                      style={[styles.notifRow, n.read ? styles.notifRead : styles.notifUnread]}
                    >
                      <AlertCircle
                        size={14}
                        color={n.read ? '#D1D5DB' : n.urgent ? '#FB923C' : SKY}
                        style={{ marginTop: 2 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.notifText, n.read && { color: '#9CA3AF' }]}>{n.text}</Text>
                        <Text style={styles.notifTime}>{n.time}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setBellOpen(false)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <TouchableOpacity key={stat.label} style={styles.statCard} onPress={() => goto(stat.route)} activeOpacity={0.8}>
              <View style={[styles.statIconWrap, { backgroundColor: stat.bg }]}>
                <stat.icon size={24} color={stat.color} />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Live Session Status Board */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.pulseRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.cardTitle}>Live Session Status</Text>
            </View>
            <TouchableOpacity onPress={() => goto('LiveSessionMonitoring')}>
              <Text style={styles.linkText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={{ gap: spacing.sm }}>
            {sessions.map((session) => {
              const sc = STATUS_CONFIG[session.status];
              return (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionCard}
                  activeOpacity={0.8}
                  onPress={() => goto('LiveSessionMonitoring')}
                >
                  <View style={styles.sessionTopRow}>
                    <View style={styles.sessionNameRow}>
                      <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
                      <Text style={styles.sessionTeacher} numberOfLines={1}>
                        {session.teacher}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: sc.badgeBg }]}>
                      <Text style={[styles.statusBadgeText, { color: sc.badgeText }]}>{sc.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.sessionStation}>{session.station}</Text>
                  <View style={styles.sessionBottomRow}>
                    <View style={styles.chipRow}>
                      {session.students.map((s) => (
                        <View key={s} style={styles.studentChip}>
                          <Text style={styles.studentChipText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.timerRow}>
                      <Text style={styles.timerText}>{formatTimer(session.timer)}</Text>
                      <Text style={styles.trialsText}>{session.trials}T</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Daily Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <ClipboardList size={18} color={SKY} />
            <Text style={styles.cardTitle}>Daily Summary</Text>
          </View>
          <View style={styles.summaryGrid}>
            {dailySummary.map((item) => (
              <View key={item.label} style={styles.summaryItem}>
                <item.icon size={16} color={item.color} />
                <Text style={styles.summaryValue}>{item.value}</Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={{ gap: spacing.sm }}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickAction}
                onPress={() => goto(action.route)}
                activeOpacity={0.8}
              >
                <action.icon size={16} color={action.color} />
                <Text style={styles.quickActionLabel}>{action.label}</Text>
                <ChevronRight size={16} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pending Review Alerts */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.pendingHeaderLeft}>
              <Clock size={16} color={AMBER} />
              <Text style={styles.cardTitle}>Pending Review Alerts</Text>
              <View style={styles.pendingCountBadge}>
                <Text style={styles.pendingCountText}>{PENDING_REVIEWS.length}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => goto('SessionSummaryReview')}>
              <Text style={styles.linkText}>View All</Text>
            </TouchableOpacity>
          </View>
          {PENDING_REVIEWS.map((review, idx) => (
            <View
              key={review.id}
              style={[styles.reviewRow, idx < PENDING_REVIEWS.length - 1 && styles.reviewRowBorder]}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.reviewTopRow}>
                  <Text style={styles.reviewTeacher}>{review.teacher}</Text>
                  <Text style={styles.reviewDot}>·</Text>
                  <Text style={styles.reviewStation}>{review.station}</Text>
                  {review.incidents > 0 && (
                    <View style={styles.incidentRow}>
                      <AlertCircle size={12} color="#EA580C" />
                      <Text style={styles.incidentText}>
                        {review.incidents} incident{review.incidents > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.reviewMetaRow}>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                  <View style={styles.chipRow}>
                    {review.students.map((s) => (
                      <View key={s} style={styles.studentChip}>
                        <Text style={styles.studentChipText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.reviewRightCol}>
                <Text
                  style={[
                    styles.independenceText,
                    review.independence >= 70
                      ? { color: '#16A34A' }
                      : review.independence >= 60
                        ? { color: '#CA8A04' }
                        : { color: '#EF4444' },
                  ]}
                >
                  {review.independence}%
                </Text>
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={() => goto('SessionSummaryReview')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.reviewButtonText}>Review</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg },

  headerCard: {
    backgroundColor: DARK,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: '700' },
  headerSubtitle: { color: '#9CA3AF', fontSize: 12, marginTop: spacing.xs },

  bellButton: { padding: 8, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.08)' },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  notifDropdown: {
    position: 'absolute',
    right: 0,
    top: 44,
    width: 300,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    zIndex: 50,
  },
  notifDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notifDropdownTitle: { fontSize: 13, fontWeight: '700', color: DARK },
  closeBtn: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingVertical: spacing.sm },
  closeBtnText: { textAlign: 'center', fontSize: 12, color: '#9CA3AF' },

  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  notifRead: { backgroundColor: colors.bgCard },
  notifUnread: { backgroundColor: '#F0F9FF' },
  notifText: { fontSize: 12, color: DARK, lineHeight: 16 },
  notifTime: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },

  linkText: { fontSize: 12, fontWeight: '600', color: SKY },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: {
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconWrap: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 26, fontWeight: '700', color: DARK, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11, color: '#6B7280', lineHeight: 14, marginTop: 2 },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: DARK },

  pulseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ADE80' },

  sessionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sessionTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  sessionNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  sessionTeacher: { fontSize: 14, fontWeight: '600', color: DARK, flexShrink: 1 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB' },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  sessionStation: { fontSize: 12, color: '#9CA3AF' },
  sessionBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  studentChip: { backgroundColor: '#F0F9FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  studentChipText: { fontSize: 10, color: SKY },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timerText: { fontSize: 12, fontWeight: '700', color: DARK, fontVariant: ['tabular-nums'] },
  trialsText: { fontSize: 12, fontWeight: '700', color: SKY },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryItem: {
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: { fontSize: 20, fontWeight: '700', color: DARK, fontVariant: ['tabular-nums'] },
  summaryLabel: { fontSize: 10, color: '#9CA3AF', textAlign: 'center' },

  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  quickActionLabel: { fontSize: 14, fontWeight: '600', color: DARK, flex: 1 },

  pendingHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pendingCountBadge: { backgroundColor: AMBER, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  pendingCountText: { fontSize: 11, fontWeight: '700', color: DARK },

  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  reviewRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  reviewTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  reviewTeacher: { fontSize: 14, fontWeight: '600', color: DARK },
  reviewDot: { fontSize: 12, color: '#9CA3AF' },
  reviewStation: { fontSize: 12, color: '#6B7280' },
  incidentRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  incidentText: { fontSize: 12, fontWeight: '600', color: '#EA580C' },
  reviewMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  reviewDate: { fontSize: 12, color: '#9CA3AF' },
  reviewRightCol: { alignItems: 'flex-end', gap: spacing.xs },
  independenceText: { fontSize: 13, fontWeight: '700' },
  reviewButton: {
    backgroundColor: AMBER,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  reviewButtonText: { fontSize: 12, fontWeight: '700', color: DARK },
});
