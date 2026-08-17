// screens/teacherdashboard/TeacherDashboardScreen.js
// SCR-TEA-001: Teacher Dashboard - matches the original Figma screenshot
// exactly: greeting, Today's Schedule card, Quick Actions grid,
// Assessment Tasks, Pending Mastery Checks, Notifications.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import TopNav from '../../components/TopNav';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getTeacherDashboard } from '../../api/teacherExtrasApi';
import type { SessionStackParamList, FeatherIconName } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'TeacherDashboard'>;

interface TodaySchedule {
  stationName: string;
  roomName: string;
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
  const { logout, session } = useAuth();
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
      <TopNav activeTab="Dashboard" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} onLogout={logout} />

      <ScrollView contentContainerStyle={styles.content}>
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

        {/* Today's Schedule */}
        <View style={styles.card}>
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
              <Text style={styles.startsInText}>{data.todaySchedule.startsIn}</Text>
            </View>
          </View>
          <View style={styles.timeRow}>
            <Feather name="clock" size={14} color={colors.mutedText} />
            <Text style={typography.body}>{data.todaySchedule.startTime} – {data.todaySchedule.endTime}</Text>
          </View>
          <Text style={typography.label}>Assigned Students</Text>
          <View style={styles.studentChipsRow}>
            {data.todaySchedule.students.map((s) => (
              <View key={s.id} style={styles.studentChip}>
                <View style={styles.studentAvatar}><Text style={styles.studentAvatarText}>{s.initial}</Text></View>
                <Text style={styles.studentChipText}>{s.name}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.startSessionBtn} onPress={handleStartSession}>
            <Feather name="play" size={16} color={colors.navyText} />
            <Text style={styles.startSessionBtnText}>Start Session</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={typography.label}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={handleStartSession}>
            <Feather name="play" size={20} color={colors.primaryYellowDark} />
            <Text style={typography.bodyBold}>Start Session</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation?.navigate?.('AssessmentDashboard')}>
            <Feather name="clipboard" size={20} color={colors.statusInProgressText} />
            <Text style={typography.bodyBold}>Assessments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation?.navigate?.('SessionDataCollection')}>
            <Feather name="award" size={20} color="#8B5CF6" />
            <Text style={typography.bodyBold}>Mastery Checks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => handleTeacherTabPress(navigation, 'Parents')}>
            <Feather name="message-circle" size={20} color="#22C55E" />
            <Text style={typography.bodyBold}>Parent Communication</Text>
          </TouchableOpacity>
        </View>

        {/* Assessment Tasks */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRowBetween}>
            <View style={styles.cardHeaderRow}>
              <Feather name="clipboard" size={18} color={colors.statusInProgressText} />
              <Text style={typography.h3}>Assessment Tasks</Text>
            </View>
            <View style={styles.reviewPill}><Text style={styles.reviewPillText}>6-Week Review</Text></View>
          </View>
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
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${t.progress}%` }]} /></View>
              <View style={styles.progressRow}>
                <Text style={typography.caption}>Progress</Text>
                <Text style={typography.caption}>{t.progress}%</Text>
              </View>
              <TouchableOpacity onPress={() => navigation?.navigate?.('AssessmentDashboard')}>
                <Text style={styles.linkText}>Continue →</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Pending Mastery Checks */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRowBetween}>
            <View style={styles.cardHeaderRow}>
              <Feather name="award" size={18} color="#8B5CF6" />
              <Text style={typography.h3}>Pending Mastery Checks</Text>
            </View>
            <View style={styles.readyPill}><Text style={styles.readyPillText}>{data.pendingMasteryChecks.length} Ready</Text></View>
          </View>
          {data.pendingMasteryChecks.map((m) => (
            <View key={m.id} style={styles.masteryRow}>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{m.goalName}</Text>
                <Text style={typography.caption}>{m.studentName}</Text>
                <View style={[styles.pendingTag, m.pendingLabel.includes('Director') && styles.pendingTagDirector]}>
                  <Text style={[styles.pendingTagText, m.pendingLabel.includes('Director') && { color: '#8B5CF6' }]}>{m.pendingLabel}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.reviewBtn} onPress={() => navigation?.navigate?.('GoalMasteryCheck', { studentId: m.studentId, goalId: m.goalId })}>
                <Text style={styles.reviewBtnText}>Review</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Notifications */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRowBetween}>
            <TouchableOpacity style={styles.cardHeaderRow} onPress={() => navigation?.navigate?.('Notifications')}>
              <Feather name="bell" size={18} color="#EAB308" />
              <Text style={typography.h3}>Notifications</Text>
            </TouchableOpacity>
            <View style={styles.unreadPill}><Text style={styles.unreadPillText}>{data.notifications.filter((n) => n.unread).length} Unread</Text></View>
          </View>
          {data.notifications.map((n) => {
            const icon = NOTIF_ICON[n.type] || NOTIF_ICON.alert;
            return (
              <View key={n.id} style={styles.notifRow}>
                <Feather name={icon.name} size={16} color={icon.color} />
                <View style={{ flex: 1 }}>
                  <Text style={typography.bodyBold}>{n.title}</Text>
                  <Text style={typography.caption}>{n.source} · {n.timeAgo}</Text>
                </View>
                {n.unread && <View style={styles.unreadDot} />}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DEMO_DATA: TeacherDashboardData = {
  todaySchedule: {
    stationName: 'Station 1 — Basic Skills',
    roomName: 'Room 2',
    startTime: '9:00 AM',
    endTime: '10:30 AM',
    startsIn: 'Starts in 2h 1m',
    students: [{ id: 'student-a', name: 'Student A', initial: 'A' }, { id: 'student-b', name: 'Student B', initial: 'B' }],
  },
  assessmentTasks: [
    { id: 't1', studentName: 'Student C', studentInitial: 'C', assessmentName: 'ABLLS Assessment', status: 'In Progress', progress: 45 },
    { id: 't2', studentName: 'Student D', studentInitial: 'D', assessmentName: 'Behavior Assessment', status: 'Not Started', progress: 0 },
  ],
  pendingMasteryChecks: [
    { id: 'm1', studentId: 'student-a', goalId: 'goal-1', studentName: 'Student A', goalName: 'Identify Colors', pendingLabel: 'Pending B/C verification' },
    { id: 'm2', studentId: 'student-b', goalId: 'goal-3', studentName: 'Student B', goalName: 'Request Items', pendingLabel: 'Pending Director Review' },
  ],
  notifications: [
    { id: 'n1', type: 'approved', title: 'Session summary approved', source: 'Coordinator A', timeAgo: '2 hrs ago', unread: false },
    { id: 'n2', type: 'revision', title: 'Session revision requested', source: 'Coordinator A', timeAgo: '3 hrs ago', unread: true },
    { id: 'n3', type: 'alert', title: 'Coordinator alert: Parent meeting Thursday', source: 'Coordinator A', timeAgo: '5 hrs ago', unread: true },
    { id: 'n4', type: 'message', title: 'Parent message from Parent A', source: 'Parent A', timeAgo: 'Yesterday', unread: true },
  ],
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  clockPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  clockText: { fontWeight: '700', color: colors.navyText, fontVariant: ['tabular-nums'] },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardHeaderRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  startsInPill: { backgroundColor: colors.statusInProgressBg, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  startsInText: { fontSize: 11, fontWeight: '700', color: colors.statusInProgressText },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  studentChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  studentChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.bgApp, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  studentAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.promptG, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { color: colors.white, fontWeight: '700', fontSize: 11 },
  studentChipText: { fontWeight: '600', color: colors.navyText, fontSize: 12 },
  startSessionBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, marginTop: spacing.sm },
  startSessionBtnText: { fontWeight: '700', color: colors.navyText },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickActionCard: { flexGrow: 1, minWidth: '45%', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: spacing.xs },
  reviewPill: { backgroundColor: colors.statusPendingBg, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  reviewPillText: { fontSize: 11, fontWeight: '700', color: colors.statusPendingText },
  taskRow: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.xs },
  taskHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  statusBadgeProgress: { backgroundColor: colors.statusInProgressBg },
  statusBadgeNotStarted: { backgroundColor: colors.statusNotStartedBg },
  statusBadgeText: { fontSize: 10, fontWeight: '700', color: colors.mutedText },
  progressTrack: { height: 6, borderRadius: radius.pill, backgroundColor: colors.bgApp, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.statusInProgressText },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  linkText: { color: colors.statusInProgressText, fontWeight: '600', fontSize: 12 },
  readyPill: { backgroundColor: '#EDE9FE', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  readyPillText: { fontSize: 11, fontWeight: '700', color: '#8B5CF6' },
  masteryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  pendingTag: { alignSelf: 'flex-start', backgroundColor: colors.statusPendingBg, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, marginTop: spacing.xs },
  pendingTagDirector: { backgroundColor: '#EDE9FE' },
  pendingTagText: { fontSize: 10, fontWeight: '700', color: colors.statusPendingText },
  reviewBtn: { backgroundColor: colors.navyText, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  reviewBtnText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  unreadPill: { backgroundColor: colors.statusRevisionBg, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  unreadPillText: { fontSize: 11, fontWeight: '700', color: colors.statusRevisionText },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.statusInProgressText, marginTop: 4 },
});
