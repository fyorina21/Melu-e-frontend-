import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import StudentAvatar from '../../../../components/StudentAvatar';
import { colors, radius, spacing } from '../../../../theme/colors';
import { type LiveSession, STATUS_CONFIG, formatTimer } from '../types';

interface LiveSessionStatusBoardProps {
  sessions: LiveSession[];
  onViewAll: () => void;
}

export const LiveSessionStatusBoard: React.FC<LiveSessionStatusBoardProps> = React.memo(
  ({ sessions, onViewAll }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.pulseRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.cardTitle}>Live Session Status</Text>
          </View>
          <TouchableOpacity
            onPress={onViewAll}
            accessibilityRole="button"
            accessibilityLabel="View all live sessions"
          >
            <Text style={styles.linkText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sessionList}>
          {sessions.length === 0 ? (
            <Text style={styles.emptyText}>No active live sessions at this time.</Text>
          ) : (
            sessions.map((session) => {
              const sc = STATUS_CONFIG[session.status];
              return (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionCard}
                  activeOpacity={0.8}
                  onPress={onViewAll}
                  accessibilityRole="button"
                  accessibilityLabel={`Session by ${session.teacher}: ${sc.label}`}
                >
                  <View style={styles.sessionTopRow}>
                    <View style={styles.sessionNameRow}>
                      <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
                      <Text style={styles.sessionTeacher} numberOfLines={1}>
                        {session.teacher}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: sc.badgeBg }]}>
                      <Text style={[styles.statusBadgeText, { color: sc.badgeText }]}>
                        {sc.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.sessionStation}>{session.station}</Text>
                  <View style={styles.sessionBottomRow}>
                    <View style={styles.chipRow}>
                      {session.students.map((s) => (
                        <View
                          key={s}
                          style={[
                            styles.studentChip,
                            { flexDirection: 'row', alignItems: 'center', gap: 4 },
                          ]}
                        >
                          <StudentAvatar name={s} size={14} />
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
            })
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.navyText,
  },
  pulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ADE80',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryYellowDark,
  },
  sessionList: {
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  sessionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sessionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sessionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionTeacher: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navyText,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sessionStation: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  sessionBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  studentChip: {
    backgroundColor: colors.bgApp,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  studentChipText: {
    fontSize: 10,
    color: colors.primaryYellowDark,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
    fontVariant: ['tabular-nums'],
  },
  trialsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryYellowDark,
  },
});
