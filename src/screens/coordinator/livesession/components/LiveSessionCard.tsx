import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import StudentAvatar from '../../../../components/StudentAvatar';
import { radius, spacing } from '../../../../theme/colors';
import { type Session, STATUS_CONFIG, SKY, DARK, DARK_TEXT, PANEL, formatTime } from '../types';

interface LiveSessionCardProps {
  session: Session;
  onSelectStudent: (studentName: string) => void;
  onViewDetails: (session: Session) => void;
  onSendAlert: (session: Session) => void;
}

export const LiveSessionCard: React.FC<LiveSessionCardProps> = React.memo(
  ({ session, onSelectStudent, onViewDetails, onSendAlert }) => {
    const sc = STATUS_CONFIG[session.status];

    return (
      <View style={[styles.sessionCard, { borderColor: sc.border }]}>
        <View style={styles.sessionHeaderRow}>
          <View style={styles.sessionHeaderLeft}>
            <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.teacherName} numberOfLines={1}>
                {session.teacher}
              </Text>
              <Text style={styles.stationRoom}>
                {session.station} · {session.room}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { borderColor: sc.border }]}>
            <Text style={[styles.statusBadgeText, { color: sc.text }]}>{sc.label}</Text>
          </View>
        </View>

        <View style={styles.chipRow}>
          {session.students.map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.studentChip, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
              onPress={() => onSelectStudent(st)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`View student ${st}`}
            >
              <StudentAvatar name={st} size={16} />
              <Text style={styles.studentChipText}>{st}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricBox, { flex: 1 }]}>
            <Feather name="clock" size={14} color="#9CA3AF" />
            <Text style={styles.timerText}>{formatTime(session.timer)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Trials</Text>
            <Text style={styles.trialsValue}>{session.trials}</Text>
          </View>
          {session.incidents > 0 && (
            <View style={styles.incidentChip}>
              <Feather name="alert-triangle" size={12} color="#FB923C" />
              <Text style={styles.incidentChipText}>{session.incidents}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => onViewDetails(session)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="View session details"
          >
            <Feather name="eye" size={14} color={SKY} />
            <Text style={styles.detailButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.alertButton}
            onPress={() => onSendAlert(session)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Send alert to teacher"
          >
            <Feather name="bell" size={14} color="#FCD34D" />
            <Text style={styles.alertButtonText}>Send Alert</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  sessionCard: {
    flexGrow: 1,
    minWidth: 300,
    flexBasis: '31%',
    borderWidth: 2,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: DARK,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sessionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flexShrink: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  teacherName: {
    color: DARK_TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
  stationRoom: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  studentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: `${SKY}1A`,
    borderWidth: 1,
    borderColor: `${SKY}40`,
  },
  studentChipText: {
    color: SKY,
    fontSize: 12,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metricBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PANEL,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  metricLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  timerText: {
    color: DARK_TEXT,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  trialsValue: {
    color: SKY,
    fontSize: 13,
    fontWeight: '700',
  },
  incidentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: 'rgba(249,115,22,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.25)',
  },
  incidentChipText: {
    color: '#FB923C',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  detailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${SKY}40`,
    backgroundColor: `${SKY}1A`,
  },
  detailButtonText: {
    color: SKY,
    fontSize: 12,
    fontWeight: '600',
  },
  alertButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${'#FCD34D'}40`,
    backgroundColor: `${'#FCD34D'}1A`,
  },
  alertButtonText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '600',
  },
});
