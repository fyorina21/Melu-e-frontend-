import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import StudentAvatar from '../../../components/StudentAvatar';
import type { TodaySchedule } from '../teacherDashboardTypes';
import { SessionCountdown } from './SessionCountdown';

interface TodayScheduleCardProps {
  schedule?: TodaySchedule;
  role?: string;
  modules?: string[];
  onStartSession: () => void;
  onManageIups: () => void;
}

export const TodayScheduleCard: React.FC<TodayScheduleCardProps> = React.memo(
  ({ schedule, role, modules, onStartSession, onManageIups }) => {
    const hasStudents = (schedule?.students?.length ?? 0) > 0;
    const formattedRoleName = role
      ? role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Clinical Staff';

    if (hasStudents && schedule) {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Feather name="calendar" size={18} color={colors.statusInProgressText} />
            <Text style={typography.h3}>Today's Schedule</Text>
          </View>

          <View style={styles.scheduleRow}>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{schedule.stationName}</Text>
              <Text style={typography.caption}>{schedule.roomName}</Text>
            </View>
            <SessionCountdown startTime={schedule.startTime} />
          </View>

          <View style={styles.timeRow}>
            <Feather name="clock" size={14} color={colors.mutedText} />
            <Text style={typography.body}>
              {schedule.startTime} – {schedule.endTime}
            </Text>
          </View>

          <Text style={typography.label}>ASSIGNED STUDENTS</Text>
          <View style={styles.studentChipsRow}>
            {schedule.students.map((s) => (
              <View key={s.id} style={styles.studentChip}>
                <StudentAvatar
                  name={s.name}
                  studentId={s.id}
                  photoUrl={(s as any)?.photoUrl || (s as any)?.headshotUrl || (s as any)?.photo}
                  size={24}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.studentChipText}>{s.name}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.startSessionBtn}
            onPress={onStartSession}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Start session"
          >
            <Feather name="play" size={16} color={colors.navyText} />
            <Text style={styles.startSessionBtnText}>Start Session</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Feather name="user-check" size={18} color={colors.statusInProgressText} />
          <Text style={typography.h3}>{formattedRoleName} Workspace</Text>
        </View>

        <View style={{ marginVertical: spacing.sm, gap: 4 }}>
          <Text style={typography.bodyBold}>Role: {formattedRoleName}</Text>
          <Text style={typography.caption}>
            {modules && modules.length > 0
              ? `Active Modules: ${modules.map((m) => m.toUpperCase()).join(', ')}`
              : 'Clinical Role'}
          </Text>
        </View>

        <Text style={[typography.caption, { color: colors.mutedText, marginBottom: spacing.md }]}>
          Your visible pages and actions are managed by the Permission Configuration. Select a
          clinical module to begin.
        </Text>

        {!modules || modules.includes('iups') ? (
          <TouchableOpacity
            style={styles.startSessionBtn}
            onPress={onManageIups}
            activeOpacity={0.8}
          >
            <Feather name="file-text" size={16} color={colors.navyText} />
            <Text style={styles.startSessionBtnText}>Manage IUPs & Goals</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.startSessionBtn}
            onPress={onStartSession}
            activeOpacity={0.8}
          >
            <Feather name="play" size={16} color={colors.navyText} />
            <Text style={styles.startSessionBtnText}>Open Therapy Workspace</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  studentChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
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
  studentAvatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
  studentChipText: {
    fontWeight: '600',
    color: colors.navyText,
    fontSize: 12,
  },
  startSessionBtn: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FACC15',
    borderRadius: radius.md,
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
  startSessionBtnText: {
    fontWeight: '700',
    color: '#1E293B',
    fontSize: 14,
  },
});
