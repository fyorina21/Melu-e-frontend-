import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getTeacherDashboard } from '../../api/teacherExtrasApi';
import type { SessionStackParamList, FeatherIconName } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'TeacherDashboard'>;

interface TodaySchedule {
  stationName: string;
  roomName: string;
  sessionBlock: string;
  startTime: string;
  endTime: string;
  startsIn: string;
  students: { id: string; name: string; initial: string }[];
}

interface AssessmentTask {
  id: string;
  studentName: string;
  studentInitial: string;
  assessmentName: string;
  status: string;
  progress: number;
}

interface MasteryCheck {
  id: string;
  studentId: string;
  goalId: string;
  studentName: string;
  goalName: string;
  pendingLabel: string;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  source: string;
  timeAgo: string;
  unread: boolean;
}

interface TeacherDashboardData {
  todaySchedule: TodaySchedule;
  assessmentTasks: AssessmentTask[];
  pendingMasteryChecks: MasteryCheck[];
  notifications: NotificationItem[];
}

const NOTIF_ICON: Record<string, { name: FeatherIconName; color: string }> = {
  approved: { name: 'check-circle', color: '#22C55E' },
  revision: { name: 'refresh-cw', color: '#F97316' },
  alert: { name: 'bell', color: '#EAB308' },
  message: { name: 'message-circle', color: '#3B82F6' },
};

export default function TeacherDashboardScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [now, setNow] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const { data: res } = await getTeacherDashboard();
      setData(res);
    } catch (err) {
      setData(DEMO_DATA);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStartSession = () => navigation?.navigate?.('SessionDataCollection');

  if (!data) return null;

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Dashboard" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={typography.h1}>Good Morning, {session?.userName || 'Teacher A'}!</Text>
            <Text style={typography.body}>{dateStr}</Text>
          </View>
          <View style={styles.clockPill}>
            <Feather name="clock" size={14} color={colors.mutedText} style={{ marginRight: spacing.xs }} />
            <Text style={styles.clockText}>{timeStr}</Text>
          </View>
        </View>

        {/* TOP SECTION: Today's Schedule + Quick Actions Side-by-Side */}
        <View style={styles.topSectionRow}>
          <View style={[styles.card, styles.flexColumn]}>
            <View style={styles.cardHeaderRow}>
              <Feather name="calendar" size={18} color={colors.statusInProgressText} />
              <Text style={typography.h3}>Today's Schedule</Text>
            </View>
            <View style={styles.scheduleRow}>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{data.todaySchedule.stationName}</Text>
                <Text style={typography.caption}>{data.todaySchedule.roomName}</Text>
              </View>
              <View style={styles.startsInPill}>
                <Text style={styles.startsInText}>Starts in 3h 58m</Text>
              </View>
            </View>
            <View style={styles.timeRow}>
              <Feather name="clock" size={14} color={colors.mutedText} />
              <Text style={typography.body}>{data.todaySchedule.startTime} – {data.todaySchedule.endTime}</Text>
            </View>
            <Text style={typography.label}>ASSIGNED STUDENTS</Text>
            <View style={styles.studentChipsRow}>
              {data.todaySchedule.students.map((s) => (
                <View key={s.id} style={styles.studentChip}>
                  <View style={styles.studentAvatar}><Text style={styles.studentAvatarText}>{s.initial}</Text></View>
                  <Text style={styles.studentChipText}>{s.name}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.startSessionBtn} onPress={handleStartSession} activeOpacity={0.8}>
              <Feather name="play" size={16} color={colors.navyText} />
              <Text style={styles.startSessionBtnText}>Start Session</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.flexColumn}>
            <Text style={[typography.label, styles.sectionLabel]}>QUICK ACTIONS</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity style={styles.quickActionCard} onPress={handleStartSession} activeOpacity={0.7}>
                <Feather name="play" size={22} color={colors.primaryYellowDark} />
                <Text style={styles.quickActionText}>Start Session</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation?.navigate?.('AssessmentDashboard')} activeOpacity={0.7}>
                <Feather name="clipboard" size={22} color={colors.statusInProgressText} />
                <Text style={styles.quickActionText}>Assessments</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation?.navigate?.('SessionDataCollection')} activeOpacity={0.7}>
                <Feather name="award" size={22} color="#8B5CF6" />
                <Text style={styles.quickActionText}>Mastery Checks</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionCard} onPress={() => handleTeacherTabPress(navigation, 'Parents')} activeOpacity={0.7}>
                <Feather name="message-circle" size={22} color="#22C55E" />
                <Text style={styles.quickActionText}>Parent Communication</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* BOTTOM SECTION: Fixed Height & Equal Alignment across 3 cards */}
        <View style={styles.threeCardsRow}>
          {/* Card 1: Assessment Tasks */}
          <View style={[styles.card, styles.threeCardItem, styles.fixedBottomCard]}>
            <View style={styles.cardHeaderRowBetween}>
              <View style={styles.cardHeaderRow}>
                <Feather name="clipboard" size={18} color={colors.statusInProgressText} />
                <Text style={typography.h3}>Assessment Tasks</Text>
              </View>
              <View style={styles.reviewPill}><Text style={styles.reviewPillText}>6-Week Review</Text></View>
            </View>
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              {data.assessmentTasks.map((t) => (
                <View key={t.id} style={styles.taskRow}>
                  <View style={styles.taskHeaderRow}>
                    <View style={styles.studentAvatar}><Text style={styles.studentAvatarText}>{t.studentInitial}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={typography.bodyBold}>{t.studentName}</Text>
                      <Text style={typography.caption}>{t.assessmentName}</Text>
                    </View>
                    <View style={[styles.statusBadge, t.status === 'In Progress' ? styles.statusBadgeProgress : styles.statusBadgeNotStarted]}>
                      <Text style={[styles.statusBadgeText, t.status === 'In Progress' && { color: colors.statusInProgressText }]}>{t.status}</Text>
                    </View>
                  </View>
                  <View style={styles.progressRow}>
                    <Text style={typography.caption}>Progress</Text>
                    <Text style={typography.caption}>{t.progress}%</Text>
                  </View>
                  <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${t.progress}%` }]} /></View>
                  <TouchableOpacity style={styles.touchableLink} onPress={() => navigation?.navigate?.('AssessmentDashboard')}>
                    <Text style={styles.linkText}>Continue ›</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Card 2: Pending Mastery Checks */}
          <View style={[styles.card, styles.threeCardItem, styles.fixedBottomCard]}>
            <View style={styles.cardHeaderRowBetween}>
              <View style={styles.cardHeaderRow}>
                <Feather name="award" size={18} color="#8B5CF6" />
                <Text style={typography.h3}>Pending Mastery Checks</Text>
              </View>
              <View style={styles.readyPill}><Text style={styles.readyPillText}>{data.pendingMasteryChecks.length} Ready</Text></View>
            </View>
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              {data.pendingMasteryChecks.map((m) => (
                <View key={m.id} style={styles.masteryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.bodyBold}>{m.goalName}</Text>
                    <Text style={typography.caption}>• {m.studentName}</Text>
                    <View style={[styles.pendingTag, m.pendingLabel.includes('Director') && styles.pendingTagDirector]}>
                      <Text style={[styles.pendingTagText, m.pendingLabel.includes('Director') && { color: '#8B5CF6' }]}>{m.pendingLabel}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.reviewBtn} onPress={() => navigation?.navigate?.('GoalMasteryCheck', { studentId: m.studentId, goalId: m.goalId })}>
                    <Text style={styles.reviewBtnText}>Review</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Card 3: Notifications */}
          <View style={[styles.card, styles.threeCardItem, styles.fixedBottomCard]}>
            <View style={styles.cardHeaderRowBetween}>
              <TouchableOpacity style={styles.cardHeaderRow} onPress={() => navigation?.navigate?.('Notifications')}>
                <Feather name="bell" size={18} color="#EAB308" />
                <Text style={typography.h3}>Notifications</Text>
              </TouchableOpacity>
              <View style={styles.unreadPill}>
                <Text style={styles.unreadPillText}>{data.notifications.filter((n) => n.unread).length} Unread</Text>
              </View>
            </View>
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              {data.notifications.map((n) => {
                const icon = NOTIF_ICON[n.type] || NOTIF_ICON.alert;
                return (
                  <View key={n.id} style={styles.notifRow}>
                    <Feather name={icon.name} size={16} color={icon.color} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={typography.bodyBold}>{n.title}</Text>
                      <Text style={typography.caption}>{n.source} · {n.timeAgo}</Text>
                    </View>
                    {n.unread && <View style={styles.unreadDot} />}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DEMO_DATA: TeacherDashboardData = {
  todaySchedule: {
    stationName: 'Station 1 — Basic Skills',
    roomName: 'Room 2',
    sessionBlock: 'Block B · Daily Living',
    startTime: '9:00 AM',
    endTime: '10:30 AM',
    startsIn: 'Starts in 3h 58m',
    students: [{ id: 'student-a', name: 'Student A', initial: 'A' }, { id: 'student-b', name: 'Student B', initial: 'B' }],
  },
  assessmentTasks: [
    { id: 't1', studentName: 'Student C', studentInitial: 'C', assessmentName: 'ABLLS Assessment', status: 'In Progress', progress: 45 },
    { id: 't2', studentName: 'Student D', studentInitial: 'D', assessmentName: 'Behavior Assessment', status: 'Not Started', progress: 0 },
  ],
  pendingMasteryChecks: [
    { id: 'm1', studentId: 'student-a', goalId: 'goal-1', studentName: 'Student A', goalName: 'Identify Colors', pendingLabel: 'Pending B/C verification' },
    { id: 'm2', studentId: 'student-b', goalId: 'goal-3', studentName: 'Student B', goalName: 'Request Items', pendingLabel: 'Pending Director Review' },
    { id: 'm3', studentId: 'student-c', goalId: 'goal-4', studentName: 'Student C', goalName: 'Hand Washing Steps', pendingLabel: 'Pending B/C verification' },
  ],
  notifications: [
    { id: 'n1', type: 'approved', title: 'Session summary approved', source: 'Coordinator A', timeAgo: '2 hrs ago', unread: false },
    { id: 'n2', type: 'revision', title: 'Session revision requested', source: 'Coordinator A', timeAgo: '3 hrs ago', unread: true },
    { id: 'n3', type: 'alert', title: 'Coordinator alert: Parent meeting Thursday', source: 'Coordinator A', timeAgo: '5 hrs ago', unread: true },
    { id: 'n4', type: 'message', title: 'Parent message from Parent A', source: 'Parent A', timeAgo: 'Yesterday', unread: true },
    { id: 'n5', type: 'approved', title: 'Behavior plan update', source: 'Coordinator B', timeAgo: '2 days ago', unread: false },
  ],
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: spacing.md, gap: spacing.md, maxWidth: 1280, alignSelf: 'center', width: '100%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  clockPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  clockText: { fontWeight: '700', color: colors.navyText, fontVariant: ['tabular-nums'] },
  
  topSectionRow: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  flexColumn: { flex: 1 },
  threeCardsRow: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  threeCardItem: { flex: 1 },

  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  fixedBottomCard: { height: 310 }, // Enforces equal height across bottom cards on tablets
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardHeaderRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  
  scrollArea: { flex: 1 },

  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: spacing.xs },
  startsInPill: { backgroundColor: '#E0F2FE', paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  startsInText: { fontSize: 12, fontWeight: '600', color: '#0284C7' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginVertical: spacing.xs },
  studentChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  studentChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: '#F1F5F9', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  studentAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#38BDF8', alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { color: colors.white, fontWeight: '700', fontSize: 11 },
  studentChipText: { fontWeight: '600', color: colors.navyText, fontSize: 12 },
  startSessionBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FACC15', borderRadius: radius.md, paddingVertical: 12, marginTop: spacing.sm },
  startSessionBtnText: { fontWeight: '700', color: '#1E293B', fontSize: 14 },

  sectionLabel: { color: '#64748B', fontSize: 12, fontWeight: '700', marginBottom: spacing.xs },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickActionCard: { width: '48.5%', backgroundColor: colors.bgCard, borderRadius: radius.md, paddingVertical: 18, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  quickActionText: { fontSize: 13, fontWeight: '600', color: '#334155', textAlign: 'center' },

  reviewPill: { backgroundColor: '#FEF3C7', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  reviewPillText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  taskRow: { paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 2 },
  taskHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  statusBadgeProgress: { backgroundColor: '#E0F2FE' },
  statusBadgeNotStarted: { backgroundColor: '#F1F5F9' },
  statusBadgeText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  progressTrack: { height: 6, borderRadius: radius.pill, backgroundColor: '#F1F5F9', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#38BDF8' },
  touchableLink: { paddingVertical: 4 },
  linkText: { color: '#0284C7', fontWeight: '600', fontSize: 13 },

  readyPill: { backgroundColor: '#F3E8FF', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  readyPillText: { fontSize: 11, fontWeight: '700', color: '#9333EA' },
  masteryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  pendingTag: { alignSelf: 'flex-start', backgroundColor: '#FFEDD5', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, marginTop: 2 },
  pendingTagDirector: { backgroundColor: '#F3E8FF' },
  pendingTagText: { fontSize: 10, fontWeight: '700', color: '#C2410C' },
  reviewBtn: { backgroundColor: '#334155', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 8, minHeight: 36, justifyContent: 'center' },
  reviewBtnText: { color: colors.white, fontWeight: '600', fontSize: 12 },

  unreadPill: { backgroundColor: '#FEE2E2', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  unreadPillText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0EA5E9', marginTop: 4 },
});