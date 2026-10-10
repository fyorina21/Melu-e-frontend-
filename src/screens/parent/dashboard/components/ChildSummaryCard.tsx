// src/screens/parent/dashboard/components/ChildSummaryCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import StudentAvatar from '../../../../components/StudentAvatar';
import ProgressRing from './ProgressRing';
import { radius, spacing, makeShadow } from '../../../../theme/colors';
import { calculateSessionProgress } from '../parentDashboardTypes';

const SKY = '#38BDF8';

interface ChildSummaryCardProps {
  childName: string;
  childAge: number;
  childProgram: string;
  photoUrl?: string;
  independence: number;
  sessionsDone: number;
  sessionsTotal: number;
  isMobile: boolean;
  ringSize: number;
  onViewProgress: () => void;
  style?: ViewStyle;
}

export default function ChildSummaryCard({
  childName,
  childAge,
  childProgram,
  photoUrl,
  independence,
  sessionsDone,
  sessionsTotal,
  isMobile,
  ringSize,
  onViewProgress,
  style,
}: ChildSummaryCardProps) {
  const sessionPercent = calculateSessionProgress(sessionsDone, sessionsTotal);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.childHeader}>
        <StudentAvatar
          name={childName}
          photoUrl={photoUrl}
          size={44}
          style={styles.avatarSpacing}
        />
        <View style={styles.childMetaContainer}>
          <Text style={styles.childName} numberOfLines={1}>
            {childName}
          </Text>
          <Text style={styles.childMeta} numberOfLines={1}>
            Age {childAge} · {childProgram || 'ABA'} Therapy Program
          </Text>
        </View>
      </View>

      <View style={[styles.childStatsRow, isMobile && styles.childStatsRowMobile]}>
        <View style={styles.independenceCol}>
          <ProgressRing percent={independence} size={ringSize} />
          <Text style={styles.independenceLabel}>Overall{'\n'}Independence</Text>
        </View>
        <View style={styles.statCol}>
          <View style={styles.sessionsCard}>
            <Text style={styles.statLabel}>Sessions this week</Text>
            <Text style={styles.statValue}>
              {sessionsDone} <Text style={styles.statSubValue}>of {sessionsTotal} scheduled</Text>
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${sessionPercent}%` }]} />
            </View>
          </View>
          <View style={styles.lastSessionCard}>
            <Text style={styles.statLabel}>Last session</Text>
            <Text style={styles.lastSessionValue}>Today at 9:00 AM</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.fullProgressBtn}
        onPress={onViewProgress}
        accessibilityRole="button"
        accessibilityLabel="View Full Progress"
      >
        <Text style={styles.fullProgressBtnText}>View Full Progress →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: spacing.xl,
    gap: spacing.md,
    ...makeShadow(1, 3, 0.05, '0, 0, 0', 1),
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  avatarSpacing: {
    marginRight: 12,
  },
  childMetaContainer: {
    flex: 1,
  },
  childName: {
    fontWeight: '700',
    color: '#1F2937',
    fontSize: 16,
    lineHeight: 20,
  },
  childMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  childStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  childStatsRowMobile: {
    gap: spacing.lg,
  },
  independenceCol: {
    alignItems: 'center',
    gap: 4,
  },
  independenceLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  statCol: {
    flex: 1,
    gap: spacing.md,
  },
  sessionsCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  lastSessionCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  statValue: {
    fontWeight: '700',
    color: '#1F2937',
    fontSize: 16,
  },
  statSubValue: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  lastSessionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  barTrack: {
    width: '100%',
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: '#F3F4F6',
    marginTop: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: SKY,
  },
  fullProgressBtn: {
    backgroundColor: SKY,
    borderRadius: radius.lg,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  fullProgressBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
