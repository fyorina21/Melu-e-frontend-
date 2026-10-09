// src/screens/programdirector/dashboard/components/PdClinicalOverviewCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import type { ClinicalOverview } from '../dashboardTypes';

interface PdClinicalOverviewCardProps {
  overview?: ClinicalOverview;
}

export const PdClinicalOverviewCard: React.FC<PdClinicalOverviewCardProps> = React.memo(
  ({ overview }) => {
    const items = [
      {
        label: 'Active Students',
        value: overview?.activeStudents ?? 0,
        icon: 'users' as const,
      },
      {
        label: 'Assessments Pending',
        value: overview?.assessmentsPending ?? 0,
        icon: 'clipboard' as const,
      },
      {
        label: 'Sessions Assigned',
        value: overview?.sessionsAssigned ?? 0,
        icon: 'calendar' as const,
      },
      {
        label: 'Completed Sessions',
        value: overview?.completedSessions ?? 0,
        icon: 'check-circle' as const,
      },
      {
        label: 'Goals in Progress',
        value: overview?.goalsInProgress ?? 0,
        icon: 'target' as const,
      },
    ];

    return (
      <View style={styles.card}>
        <View style={styles.sectionIconHeader}>
          <Feather name="activity" size={16} color={colors.purple} />
          <Text style={[typography.h3, { marginLeft: spacing.xs }]}>Clinical Overview</Text>
        </View>
        {items.map((m) => (
          <View key={m.label} style={styles.clinicalRow}>
            <View style={styles.clinicalLeft}>
              <Feather name={m.icon} size={12} color={colors.mutedText} />
              <Text style={styles.clinicalLabel}>{m.label}</Text>
            </View>
            <Text style={styles.clinicalValue}>{m.value}</Text>
          </View>
        ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...makeShadow(1, 3, 0.04, '0, 0, 0', 1),
  },
  sectionIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  clinicalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  clinicalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clinicalLabel: {
    fontSize: 12,
    color: colors.bodyText,
  },
  clinicalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
});
