import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import StudentAvatar from '../../components/StudentAvatar';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getTeacherDashboard, getAssessmentDashboard } from '../../api/teacherExtrasApi';
import { getSessionRoster } from '../../api/sessionApi';
import { getStaffOptions, getStudentOptions } from '../../api/optionsApi';
import { getDirectorSchedule } from '../../api/directorApi';
import { setStoredSessionStudents } from '../../stores/trialsStore';
import { startSessionTimer, resetSessionTimer } from '../../stores/sessionTimerStore';
import { registerLiveSession } from '../../utils/liveSessionSyncHelper';
import { getPendingMasteryChecks } from '../../stores/goalMasteryStore';
import {
  isStudentEligibleForSession,
  isStudentAssessment100PercentCompleted,
  isStudentInSession,
  registerStudentStatuses,
} from '../../utils/studentLifecycleHelper';
import {
  findLoggedInTeacher,
  resolveTeacherAssignedStudentIds,
  resolveEligibleTeacherStudents,
  onScheduleAssignmentsChanged,
} from '../../utils/teacherScheduleHelper';
import {
  filterOutDeletedStaff,
  isStaffDeleted,
  onDeletedStaffChanged,
} from '../../utils/deletedStaffHelper';
import { getAlertsForTeacher } from '../../utils/alertNotificationHelper';
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
  studentId?: string;
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

function getCountdown(startTimeStr?: string, current: Date = new Date()): string {
  if (!startTimeStr) return 'Starts soon';

  let target: Date | null = null;

  const ampmMatch = startTimeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const seconds = ampmMatch[3] ? parseInt(ampmMatch[3], 10) : 0;
    const period = ampmMatch[4].toUpperCase();

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    target = new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate(),
      hours,
      minutes,
      seconds,
    );
  } else {
    const time24Match = startTimeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (time24Match) {
      const hours = parseInt(time24Match[1], 10);
      const minutes = parseInt(time24Match[2], 10);
      const seconds = time24Match[3] ? parseInt(time24Match[3], 10) : 0;
      target = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate(),
        hours,
        minutes,
        seconds,
      );
    } else {
      const parsed = new Date(startTimeStr);
      if (!isNaN(parsed.getTime())) {
        target = parsed;
      }
    }
  }

  if (!target) return startTimeStr;

  const diffMs = target.getTime() - current.getTime();
  if (diffMs <= 0) {
    return 'Started';
  }

  const totalSecs = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  if (hours > 0) {
    return `Starts in ${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `Starts in ${minutes}m ${seconds}s`;
  } else {
    return `Starts in ${seconds}s`;
  }
}

export default function TeacherDashboardScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 640;
  const isMobile = width < 640;
  const { session } = useAuth();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const load = useCallback(async () => {
    try {
      const [dashRes, assessRes, staffRes, studentOptsRes] = await Promise.allSettled([
        getTeacherDashboard(),
        getAssessmentDashboard(),
        getStaffOptions(),
        getStudentOptions(),
      ]);

      const res = dashRes.status === 'fulfilled' ? dashRes.value?.data : null;
      const assessData = assessRes.status === 'fulfilled' ? assessRes.value?.data : null;
      const staffList = filterOutDeletedStaff(
        staffRes.status === 'fulfilled' ? staffRes.value?.data || [] : [],
      );
      const studentOpts =
        studentOptsRes.status === 'fulfilled' ? studentOptsRes.value?.data || [] : [];

      if (studentOpts.length > 0) {
        registerStudentStatuses(studentOpts);
      }

      if (!res && !assessData) {
        setLoadError(true);
        return;
      }

      // 1. Identify logged-in teacher from auth session
      const teacherRows = filterOutDeletedStaff(staffList.filter((s: any) => s.role === 'teacher'));
      const targetTeacher = findLoggedInTeacher(session, teacherRows);
      if (targetTeacher && isStaffDeleted(targetTeacher)) {
        // Logged in teacher was deleted
      }

      // 2. Fetch director schedule for this specific teacher
      let schedBlocks: any[] = [];
      if (targetTeacher?.id) {
        try {
          const schedRes = await getDirectorSchedule({ teacherId: targetTeacher.id });
          schedBlocks = Array.isArray(schedRes?.data) ? schedRes.data : [];
        } catch {}
      }

      // 3. Resolve assigned student IDs strictly belonging to this teacher
      const { assignedStudentIds, activeBlock } = resolveTeacherAssignedStudentIds(
        targetTeacher,
        schedBlocks,
      );

      // 4. Resolve eligible student objects (strictly 100% completed assessments, capped at 2)
      const teacherEligibleStudents = resolveEligibleTeacherStudents(
        assignedStudentIds,
        studentOpts,
        res?.todaySchedule?.students || [],
      );

      const scheduleData: TodaySchedule = {
        stationName:
          activeBlock?.stationName || res?.todaySchedule?.stationName || 'Station 1 — Basic Skills',
        roomName: activeBlock?.roomName || res?.todaySchedule?.roomName || 'Room 1A',
        sessionBlock:
          activeBlock?.sessionBlock ||
          res?.todaySchedule?.sessionBlock ||
          'Morning Block A · Daily Living',
        startTime: activeBlock?.startTime || res?.todaySchedule?.startTime || '08:00 AM',
        endTime: activeBlock?.endTime || res?.todaySchedule?.endTime || '09:30 AM',
        startsIn: res?.todaySchedule?.startsIn || 'Starts in 15m',
        students: teacherEligibleStudents,
      };

      // Collect assessment tasks directly from Assessment Page data to ensure 100% sync
      const assessmentStudents = assessData?.students || [];
      const derivedTasks: AssessmentTask[] = assessmentStudents.map((s: any) => ({
        id: `assess-${s.id}`,
        studentId: s.id,
        studentName: s.name,
        studentInitial: s.initial || (s.name?.[0] || 'S').toUpperCase(),
        assessmentName: 'Skills Assessment (ABLLS)',
        status: s.ablls?.status || (s.score > 0 ? 'In Progress' : 'Not Started'),
        progress: s.ablls?.progress ?? s.score ?? 45,
      }));

      // Merge with backend assessmentTasks if any, deduplicating by studentId
      const existingTaskStudentIds = new Set(derivedTasks.map((t) => t.studentId));
      const backendTasks = (res?.assessmentTasks || []).filter((t: any) => {
        const sid = t.studentId || t.id.replace('assess-', '');
        return !existingTaskStudentIds.has(sid);
      });

      const finalTasks = [...derivedTasks, ...backendTasks];

      const localAlerts = getAlertsForTeacher(
        targetTeacher?.name || session?.userName,
        session?.email,
      );
      const mappedAlerts: NotificationItem[] = localAlerts.map((a) => ({
        id: a.id,
        type: 'alert',
        title: `Coordinator Alert (${a.type}): ${a.message}`,
        source: 'Live Monitoring',
        timeAgo: 'Just now',
        unread: !a.read,
      }));

      const storedMastery = getPendingMasteryChecks();
      const mappedStoredMastery: MasteryCheck[] = storedMastery.map((m) => ({
        id: m.id,
        studentId: m.studentId,
        goalId: m.goalId,
        studentName: m.studentName,
        goalName: m.goalName,
        pendingLabel: m.status === 'pending' ? 'Teacher Verification' : 'Director Review',
      }));

      const combinedMastery = [...(res?.pendingMasteryChecks || []), ...mappedStoredMastery];

      const DEFAULT_MASTERY_CHECKS: MasteryCheck[] = [
        {
          id: 'mc-1',
          studentId: '1',
          goalId: 'g-101',
          studentName: 'Alexander Hayes',
          goalName: 'Receptive Object Identification (C14)',
          pendingLabel: 'Teacher Verification',
        },
        {
          id: 'mc-2',
          studentId: '2',
          goalId: 'g-102',
          studentName: 'Emma Watson',
          goalName: 'Motor Imitation with Objects (D3)',
          pendingLabel: 'Director Review',
        },
      ];

      const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
        {
          id: 'notif-1',
          type: 'alert',
          title: 'Coordinator Alert: Real-time session monitoring check passed.',
          source: 'Live Monitoring',
          timeAgo: '15m ago',
          unread: true,
        },
        {
          id: 'notif-2',
          type: 'approved',
          title: 'Goal Mastery Verified: Alexander passed Receptive ID assessment.',
          source: 'Clinical Director',
          timeAgo: '1h ago',
          unread: false,
        },
        {
          id: 'notif-3',
          type: 'message',
          title: 'Parent Message: Morning transportation schedule confirmed.',
          source: 'Parent Portal',
          timeAgo: '2h ago',
          unread: true,
        },
      ];

      const finalMastery = combinedMastery.length > 0 ? combinedMastery : DEFAULT_MASTERY_CHECKS;
      const combinedNotifs = [...mappedAlerts, ...(res?.notifications || [])];
      const finalNotifs = combinedNotifs.length > 0 ? combinedNotifs : DEFAULT_NOTIFICATIONS;

      setData({
        todaySchedule: scheduleData,
        assessmentTasks: finalTasks,
        pendingMasteryChecks: finalMastery,
        notifications: finalNotifs,
      });

      if (targetTeacher?.id) {
        setStoredSessionStudents('active', teacherEligibleStudents, targetTeacher.id);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('melue_session_selected_teacher_id', targetTeacher.id);
        }
      } else {
        setStoredSessionStudents('active', teacherEligibleStudents);
      }
      setLoadError(false);
    } catch (err) {
      setLoadError(true);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => onDeletedStaffChanged(load), [load]);
  useEffect(() => onScheduleAssignmentsChanged(load), [load]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleAlerts = () => {
      load();
    };
    window.addEventListener('melue_alerts_updated', handleAlerts);
    return () => window.removeEventListener('melue_alerts_updated', handleAlerts);
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const eligibleSessionStudents = useMemo(() => {
    return (data?.todaySchedule?.students ?? []).filter(isStudentEligibleForSession);
  }, [data?.todaySchedule?.students]);

  const pendingAssessmentTasks = useMemo(() => {
    return (data?.assessmentTasks ?? []).filter((t) => {
      const sid = (t as any).studentId || t.id.replace('assess-', '');
      return (
        !isStudentAssessment100PercentCompleted({ id: sid, name: t.studentName }) &&
        !isStudentInSession({ id: sid })
      );
    });
  }, [data?.assessmentTasks]);

  const handleStartSession = () => {
    if (eligibleSessionStudents.length === 0) {
      Alert.alert(
        'Assessment Completion Required',
        'No student can enter a session until their assessment is 100% completed. A student will appear here once their assessment reaches 100%.',
      );
      return;
    }
    const teacherId =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('melue_session_selected_teacher_id') || undefined
        : undefined;
    setStoredSessionStudents('active', eligibleSessionStudents, teacherId);

    // Initialize timer for this session
    const startTimeNow = Date.now();
    resetSessionTimer();
    startSessionTimer('active', 90 * 60);

    // Register active live session immediately for coordinator visibility
    try {
      const activeTeacherName =
        session?.userName || (data?.todaySchedule as any)?.teacherName || 'Teacher';
      registerLiveSession({
        id: 'active',
        teacherId: teacherId || session?.userId || 'teacher-active',
        teacherName: activeTeacherName,
        stationName: data?.todaySchedule?.stationName || 'Station 1',
        roomName: data?.todaySchedule?.roomName || 'Room 1',
        students: eligibleSessionStudents,
        startedAt: startTimeNow,
        durationMinutes: 90,
        status: 'on-track',
      });
    } catch {}

    navigation?.navigate?.('SessionDataCollection', {
      sessionId: 'active',
      teacherId,
      students: eligibleSessionStudents,
    });
  };

  if (loadError) return <ScreenError onRetry={load} />;
  if (!data) return <ScreenLoader />;

  const hasData =
    !!data.todaySchedule ||
    data.assessmentTasks.length > 0 ||
    data.pendingMasteryChecks.length > 0 ||
    data.notifications.length > 0;

  if (!hasData) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppNavbar
          activeTab="Dashboard"
          onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No data available. Start a session to see dashboard information.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const timeStr = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const quickActions = [
    {
      key: 'start-session',
      title: 'Start Session',
      sub: 'Active Therapy Room',
      icon: 'play' as const,
      iconColor: colors.primaryYellowDark,
      bgTint: '#FEF9C3',
      onPress: handleStartSession,
    },
    {
      key: 'assessments',
      title: '6-Week Assessments',
      sub: 'Baseline & Review',
      icon: 'clipboard' as const,
      iconColor: colors.statusInProgressText,
      bgTint: '#E0F2FE',
      onPress: () => navigation?.navigate?.('AssessmentDashboard'),
    },
    {
      key: 'mastery',
      title: 'Mastery Checks',
      sub: 'Goal Evaluations',
      icon: 'award' as const,
      iconColor: '#8B5CF6',
      bgTint: '#EDE9FE',
      onPress: () => navigation?.navigate?.('SessionDataCollection'),
    },
    {
      key: 'parents',
      title: 'Parent Chat',
      sub: 'Direct Messaging',
      icon: 'message-circle' as const,
      iconColor: '#16A34A',
      bgTint: '#DCFCE7',
      onPress: () => handleTeacherTabPress(navigation, 'Parents'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Dashboard"
        onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.headerRow, isMobile && styles.headerRowMobile]}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.h1, isMobile && { fontSize: 20 }]}>
              Good Morning, {session?.userName || 'Teacher A'}!
            </Text>
            <Text style={typography.body}>{dateStr}</Text>
          </View>
          <View style={styles.clockPill}>
            <Feather
              name="clock"
              size={14}
              color={colors.mutedText}
              style={{ marginRight: spacing.xs }}
            />
            <Text style={styles.clockText}>{timeStr}</Text>
          </View>
        </View>

        {/* PART 1: TOP HORIZONTAL QUICK ACTIONS */}
        <View style={styles.quickActionsSection}>
          {isTabletOrDesktop ? (
            <View style={styles.quickActionsRow}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  style={styles.quickActionCard}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={action.title}
                >
                  <View style={[styles.quickActionIconBox, { backgroundColor: action.bgTint }]}>
                    <Feather name={action.icon} size={20} color={action.iconColor} />
                  </View>
                  <View style={styles.quickActionContent}>
                    <Text style={styles.quickActionTitle} numberOfLines={1}>
                      {action.title}
                    </Text>
                    <Text style={styles.quickActionSub} numberOfLines={1}>
                      {action.sub}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsScrollMobile}
            >
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  style={[styles.quickActionCard, styles.quickActionCardMobile]}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={action.title}
                >
                  <View style={[styles.quickActionIconBox, { backgroundColor: action.bgTint }]}>
                    <Feather name={action.icon} size={20} color={action.iconColor} />
                  </View>
                  <View style={styles.quickActionContent}>
                    <Text style={styles.quickActionTitle} numberOfLines={1}>
                      {action.title}
                    </Text>
                    <Text style={styles.quickActionSub} numberOfLines={1}>
                      {action.sub}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ROW 1: SESSIONS & ASSESSMENTS (WIDE RECTANGLES SIDE-BY-SIDE) */}
        <View
          style={[
            styles.splitGrid,
            isTabletOrDesktop ? styles.splitGridRow : styles.splitGridColumn,
          ]}
        >
          {/* Box 1: Today's Scheduled Sessions */}
          <View style={[styles.card, styles.splitCol]}>
            <View style={styles.boxContent}>
              <View style={styles.cardHeaderRowBetween}>
                <View style={styles.cardHeaderRow}>
                  <Feather name="calendar" size={18} color={colors.statusInProgressText} />
                  <Text style={typography.h3}>Today's Scheduled Sessions</Text>
                </View>
                <View style={styles.startsInPill}>
                  <Text style={styles.startsInText}>
                    {getCountdown(data.todaySchedule.startTime, now)}
                  </Text>
                </View>
              </View>

              <View style={styles.scheduleRowCompact}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.bodyBold}>{data.todaySchedule.stationName}</Text>
                  <Text style={typography.caption}>{data.todaySchedule.roomName}</Text>
                </View>
                <View style={styles.timeBadge}>
                  <Feather name="clock" size={13} color={colors.mutedText} />
                  <Text style={styles.timeBadgeText}>
                    {data.todaySchedule.startTime} – {data.todaySchedule.endTime}
                  </Text>
                </View>
              </View>

              <Text style={[typography.label, { marginTop: 4, marginBottom: 2 }]}>
                ASSIGNED STUDENTS
              </Text>
              <View style={styles.studentChipsRow}>
                {eligibleSessionStudents && eligibleSessionStudents.length > 0 ? (
                  eligibleSessionStudents.map((s) => (
                    <View key={s.id} style={styles.studentChip}>
                      <StudentAvatar
                        name={s.name}
                        studentId={s.id}
                        size={22}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.studentChipText}>{s.name}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noStudentsAssignedText}>
                    No students with 100% completed assessments assigned to your schedule yet.
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.startSessionBtn}
              onPress={handleStartSession}
              activeOpacity={0.8}
            >
              <Feather name="play" size={15} color={colors.navyText} />
              <Text style={styles.startSessionBtnText}>Start Session</Text>
            </TouchableOpacity>
          </View>

          {/* Box 2: 6-Week Assessment Sessions */}
          <View style={[styles.card, styles.splitCol]}>
            <TouchableOpacity
              style={styles.cardHeaderRowBetween}
              onPress={() => navigation?.navigate?.('AssessmentDashboard')}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeaderRow}>
                <Feather name="clipboard" size={18} color={colors.statusInProgressText} />
                <Text style={typography.h3}>6-Week Assessment Sessions</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={styles.reviewPill}>
                  <Text style={styles.reviewPillText}>6-Week Review</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.statusInProgressText} />
              </View>
            </TouchableOpacity>

            <ScrollView style={styles.scrollAreaCompact} showsVerticalScrollIndicator={false}>
              {pendingAssessmentTasks.length > 0 ? (
                pendingAssessmentTasks.map((t) => {
                  const studentId = (t as any).studentId || t.id.replace('assess-', '');
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={styles.taskRow}
                      onPress={() => navigation?.navigate?.('SkillsAssessment', { studentId })}
                      activeOpacity={0.7}
                    >
                      <View style={styles.taskHeaderRow}>
                        <StudentAvatar
                          name={t.studentName}
                          studentId={studentId}
                          size={24}
                          style={{ marginRight: 8 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={typography.bodyBold}>{t.studentName}</Text>
                          <Text style={typography.caption}>{t.assessmentName}</Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            t.status === 'In Progress'
                              ? styles.statusBadgeProgress
                              : styles.statusBadgeNotStarted,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              t.status === 'In Progress' && { color: colors.statusInProgressText },
                            ]}
                          >
                            {t.status}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.progressRow}>
                        <Text style={typography.caption}>Progress</Text>
                        <Text style={typography.caption}>{t.progress}%</Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${t.progress}%` }]} />
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 4,
                        }}
                      >
                        <TouchableOpacity
                          style={styles.touchableLink}
                          onPress={() => navigation?.navigate?.('SkillsAssessment', { studentId })}
                        >
                          <Text style={styles.linkText}>
                            {t.progress > 0 ? 'Continue Assessment ›' : 'Start Assessment ›'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => navigation?.navigate?.('AssessmentDashboard')}
                        >
                          <Text
                            style={[typography.caption, { color: colors.mutedText, fontSize: 11 }]}
                          >
                            Dashboard ›
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={{ padding: spacing.sm, alignItems: 'center' }}>
                  <Text
                    style={[typography.caption, { textAlign: 'center', color: colors.mutedText }]}
                  >
                    All student assessments completed.
                  </Text>
                  <TouchableOpacity
                    style={{ marginTop: 6 }}
                    onPress={() => navigation?.navigate?.('AssessmentDashboard')}
                  >
                    <Text style={styles.linkText}>View Assessment Page ›</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>

        {/* ROW 2: PENDING MASTERY CHECKS & NOTIFICATIONS (WIDE RECTANGLES SIDE-BY-SIDE) */}
        <View
          style={[
            styles.splitGrid,
            isTabletOrDesktop ? styles.splitGridRow : styles.splitGridColumn,
          ]}
        >
          {/* Box 3: Pending Mastery Checks */}
          <View style={[styles.card, styles.splitCol]}>
            <View style={styles.cardHeaderRowBetween}>
              <View style={styles.cardHeaderRow}>
                <Feather name="award" size={18} color="#8B5CF6" />
                <Text style={typography.h3}>Pending Mastery Checks</Text>
              </View>
              <View style={styles.readyPill}>
                <Text style={styles.readyPillText}>{data.pendingMasteryChecks.length} Ready</Text>
              </View>
            </View>

            <ScrollView style={styles.scrollAreaCompact} showsVerticalScrollIndicator={false}>
              {data.pendingMasteryChecks.length > 0 ? (
                data.pendingMasteryChecks.map((m) => (
                  <View key={m.id} style={styles.masteryRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={typography.bodyBold}>{m.goalName}</Text>
                      <Text style={typography.caption}>• {m.studentName}</Text>
                      <View
                        style={[
                          styles.pendingTag,
                          m.pendingLabel.includes('Director') && styles.pendingTagDirector,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pendingTagText,
                            m.pendingLabel.includes('Director') && { color: '#8B5CF6' },
                          ]}
                        >
                          {m.pendingLabel}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.reviewBtn}
                      onPress={() => {
                        if (m.studentId && m.goalId) {
                          navigation?.navigate?.('GoalMasteryCheck', {
                            studentId: m.studentId,
                            goalId: m.goalId,
                          });
                        } else {
                          navigation?.navigate?.('SessionDataCollection');
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.reviewBtnText}>Review</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={{ padding: spacing.sm, alignItems: 'center' }}>
                  <Text style={[typography.caption, { color: colors.mutedText }]}>
                    No pending mastery checks.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Box 4: Clinical Alerts & Updates */}
          <View style={[styles.card, styles.splitCol]}>
            <View style={styles.cardHeaderRowBetween}>
              <View style={styles.cardHeaderRow}>
                <Feather name="bell" size={18} color="#EAB308" />
                <Text style={typography.h3}>Clinical Alerts & Updates</Text>
              </View>
              <View style={styles.unreadPill}>
                <Text style={styles.unreadPillText}>
                  {data.notifications.filter((n) => n.unread).length} Unread
                </Text>
              </View>
            </View>

            <ScrollView style={styles.scrollAreaCompact} showsVerticalScrollIndicator={false}>
              {data.notifications.length > 0 ? (
                data.notifications.map((n) => {
                  const icon = NOTIF_ICON[n.type] || NOTIF_ICON.alert;
                  return (
                    <View key={n.id} style={styles.notifRow}>
                      <Feather
                        name={icon.name}
                        size={16}
                        color={icon.color}
                        style={{ marginTop: 2 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={typography.bodyBold}>{n.title}</Text>
                        <Text style={typography.caption}>
                          {n.source} · {n.timeAgo}
                        </Text>
                      </View>
                      {n.unread && <View style={styles.unreadDot} />}
                    </View>
                  );
                })
              ) : (
                <View style={{ padding: spacing.sm, alignItems: 'center' }}>
                  <Text style={[typography.caption, { color: colors.mutedText }]}>
                    No recent notifications.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    maxWidth: 1280,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerRowMobile: { flexWrap: 'wrap' },
  clockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  clockText: { fontWeight: '700', color: colors.navyText, fontVariant: ['tabular-nums'] },

  topSectionRow: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  flexColumn: { flex: 1 },
  threeCardsRow: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  threeCardItem: { flex: 1 },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  boxContent: {
    flex: 1,
    gap: spacing.xs,
  },
  fixedBottomCard: { height: 310 }, // Enforces equal height across bottom cards on tablets
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardHeaderRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  scrollArea: { flex: 1 },

  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  startsInPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  startsInText: { fontSize: 12, fontWeight: '600', color: '#0284C7' },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  studentChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  studentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  studentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: { color: colors.white, fontWeight: '700', fontSize: 11 },
  studentChipText: { fontWeight: '600', color: colors.navyText, fontSize: 12 },
  noStudentsAssignedText: {
    fontSize: 13,
    color: colors.mutedText,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  scheduleRowCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
    gap: spacing.xs,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.navyText,
  },
  scrollAreaCompact: {
    flex: 1,
    maxHeight: 190,
  },
  startSessionBtn: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FACC15',
    borderRadius: radius.md,
    paddingVertical: 9,
    marginTop: 6,
  },
  startSessionBtnText: { fontWeight: '700', color: '#1E293B', fontSize: 13 },

  quickActionsSection: { width: '100%', marginBottom: spacing.xs },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  quickActionsScrollMobile: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 2,
    paddingRight: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  quickActionCardMobile: {
    flex: 0,
    width: 148,
    minWidth: 148,
  },
  quickActionIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionContent: { alignItems: 'center', gap: 2, width: '100%' },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
    textAlign: 'center',
  },
  quickActionSub: { fontSize: 11, color: colors.mutedText, textAlign: 'center' },

  splitGrid: { width: '100%' },
  splitGridRow: { flexDirection: 'row', gap: 20, alignItems: 'stretch' },
  splitGridColumn: { flexDirection: 'column', gap: spacing.md, alignItems: 'stretch' },
  splitCol: { flex: 1, minWidth: 0, minHeight: 260, maxHeight: 290 },

  reviewPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  reviewPillText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  taskRow: { paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 2 },
  taskHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  statusBadgeProgress: { backgroundColor: '#E0F2FE' },
  statusBadgeNotStarted: { backgroundColor: '#F1F5F9' },
  statusBadgeText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#38BDF8' },
  touchableLink: { paddingVertical: 4 },
  linkText: { color: '#0284C7', fontWeight: '600', fontSize: 13 },

  readyPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  readyPillText: { fontSize: 11, fontWeight: '700', color: '#9333EA' },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  pendingTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  pendingTagDirector: { backgroundColor: '#F3E8FF' },
  pendingTagText: { fontSize: 10, fontWeight: '700', color: '#C2410C' },
  reviewBtn: {
    backgroundColor: '#334155',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  reviewBtnText: { color: colors.white, fontWeight: '600', fontSize: 12 },

  unreadPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  unreadPillText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0EA5E9', marginTop: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyText: { fontSize: 16, color: '#64748B', textAlign: 'center' },
});
