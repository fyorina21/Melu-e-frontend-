import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { useTeacherDashboardQuery } from '../../hooks/useDailyNotesQuery';
import type { SessionStackParamList } from '../../types';
import type { TeacherDashboardData } from './teacherDashboardTypes';
import { LiveClock, LiveDateText } from './components/LiveClock';
import { TodayScheduleCard } from './components/TodayScheduleCard';
import { QuickActionsGrid } from './components/QuickActionsGrid';
import { AssessmentTasksCard } from './components/AssessmentTasksCard';
import { PendingMasteryChecksCard } from './components/PendingMasteryChecksCard';
import { NotificationsCard } from './components/NotificationsCard';

type Props = NativeStackScreenProps<SessionStackParamList, 'TeacherDashboard'>;

export default function TeacherDashboardScreen({ navigation }: Props) {
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { data: dashboardData, isLoading, isError, refetch } = useTeacherDashboardQuery();
  const data = dashboardData as TeacherDashboardData | undefined;

  const handleStartSession = React.useCallback(() => {
    navigation?.navigate?.('SessionDataCollection');
  }, [navigation]);

  const handleAssessments = React.useCallback(() => {
    navigation?.navigate?.('AssessmentDashboard');
  }, [navigation]);

  const handleIupGeneration = React.useCallback(() => {
    navigation?.navigate?.('IupGeneration' as never);
  }, [navigation]);

  const handleNotifications = React.useCallback(() => {
    navigation?.navigate?.('Notifications');
  }, [navigation]);

  const handleAbcLog = React.useCallback(() => {
    navigation?.navigate?.('AbcLog');
  }, [navigation]);

  const handleParentCommunication = React.useCallback(() => {
    handleTeacherTabPress(navigation, 'Parents');
  }, [navigation]);

  const handleReviewMasteryCheck = React.useCallback(
    (check: { studentId: string; goalId: string }) => {
      navigation?.navigate?.('GoalMasteryCheck', {
        studentId: check.studentId,
        goalId: check.goalId,
      });
    },
    [navigation],
  );

  if (isError) return <ScreenError onRetry={refetch} />;
  if (isLoading || !data) return <ScreenLoader />;

  const hasData =
    (data?.todaySchedule?.students?.length ?? 0) > 0 ||
    (data?.assessmentTasks?.length ?? 0) > 0 ||
    (data?.pendingMasteryChecks?.length ?? 0) > 0 ||
    (data?.notifications?.length ?? 0) > 0;

  const roleName = session?.role
    ? session.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Teacher';

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Dashboard"
        onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
      />

      <ScrollView
        contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Row with dynamic greetings, date, and live isolated clock */}
        <View style={styles.headerRow}>
          <View style={styles.welcomeContainer}>
            <Text style={typography.h1}>Good Morning, {session?.userName || roleName}!</Text>
            <LiveDateText roleName={roleName} />
          </View>
          <LiveClock />
        </View>

        {/* TOP SECTION: Today's Schedule + Quick Actions (Responsive row on tablet, column on mobile) */}
        <View style={[styles.sectionRow, !isTablet && styles.sectionColumn]}>
          <TodayScheduleCard
            schedule={data.todaySchedule}
            role={session?.role}
            modules={session?.modules}
            onStartSession={handleStartSession}
            onManageIups={handleIupGeneration}
          />

          <View style={styles.quickActionsWrapper}>
            <QuickActionsGrid
              modules={session?.modules}
              onStartSession={handleStartSession}
              onAssessments={handleAssessments}
              onIupGeneration={handleIupGeneration}
              onMasteryChecks={handleStartSession}
              onParentCommunication={handleParentCommunication}
              onAbcLog={handleAbcLog}
            />
          </View>
        </View>

        {/* BOTTOM SECTION: 3 Cards (Assessment Tasks, Mastery Checks, Notifications) */}
        <View style={[styles.sectionRow, !isTablet && styles.sectionColumn]}>
          <AssessmentTasksCard tasks={data.assessmentTasks || []} onContinue={handleAssessments} />
          <PendingMasteryChecksCard
            checks={data.pendingMasteryChecks || []}
            onReview={handleReviewMasteryCheck}
          />
          <NotificationsCard
            notifications={data.notifications || []}
            onOpenAll={handleNotifications}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    width: '100%',
  },
  contentTablet: {
    maxWidth: 1280,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  welcomeContainer: {
    flex: 1,
  },
  sectionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  sectionColumn: {
    flexDirection: 'column',
  },
  quickActionsWrapper: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
});
