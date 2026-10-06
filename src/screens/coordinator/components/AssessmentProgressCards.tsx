import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../theme/colors';
import { STATUS_PERCENT, type ProgressOverview } from '../studentProgressTypes';

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    Active: { bg: colors.bgApp, text: colors.bodyText },
    Mastered: { bg: '#DCFCE7', text: '#166534' },
    'On Hold': { bg: '#F3F4F6', text: '#4B5563' },
    'In Progress': { bg: '#FEF9C3', text: '#854D0E' },
    'Not Started': { bg: '#F3F4F6', text: '#6B7280' },
    Completed: { bg: '#DCFCE7', text: '#166534' },
  };
  const c = map[status] ?? { bg: '#F3F4F6', text: '#4B5563' };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{status}</Text>
    </View>
  );
}

export function MiniProgressBar({
  value,
  color = colors.primaryYellowDark,
}: {
  value: number;
  color?: string;
}) {
  return (
    <View style={styles.miniBarRow}>
      <View style={styles.miniBarTrack}>
        <View style={[styles.miniBarFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.miniBarText}>{value}%</Text>
    </View>
  );
}

interface AssessmentProgressCardsProps {
  overview: ProgressOverview | null;
}

export function AssessmentProgressCards({ overview }: AssessmentProgressCardsProps) {
  if (!overview) {
    return <Text style={styles.emptyText}>Loading assessment data...</Text>;
  }

  const items = [
    { label: 'Skills Assessment', status: overview.assessmentSummary.skills },
    { label: 'Behavior Assessment', status: overview.assessmentSummary.behavior },
    { label: 'Preferences Assessment', status: overview.assessmentSummary.preferences },
  ];

  return (
    <View style={styles.cardsRow}>
      {items.map((item) => {
        const progress = STATUS_PERCENT[item.status] ?? 0;
        const color =
          progress === 100 ? '#22C55E' : progress > 0 ? colors.primaryYellowDark : '#9CA3AF';
        return (
          <View key={item.label} style={styles.card}>
            <View style={styles.assessmentHeader}>
              <Text style={styles.assessmentLabel}>{item.label}</Text>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.barTrackTall}>
              <View
                style={[styles.barFillTall, { width: `${progress}%`, backgroundColor: color }]}
              />
            </View>
            <Text style={styles.assessmentPct}>{progress}% complete</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    flexGrow: 1,
    minWidth: 240,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  assessmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  assessmentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  barTrackTall: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 6,
  },
  barFillTall: {
    height: '100%',
    borderRadius: 4,
  },
  assessmentPct: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  miniBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  miniBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  miniBarText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
    width: 32,
    textAlign: 'right',
  },
});
