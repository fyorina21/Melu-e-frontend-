import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import type { FoundationOverview } from '../reportsTypes';

interface FoundationOverviewTabProps {
  overview: FoundationOverview | null;
  onExportOverview: () => void;
}

export function FoundationOverviewTab({ overview, onExportOverview }: FoundationOverviewTabProps) {
  if (!overview) return null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>Foundation-Wide Clinical Analytics</Text>
        <TouchableOpacity
          style={styles.smallExportBtn}
          onPress={onExportOverview}
          accessibilityRole="button"
          accessibilityLabel="Print overview report"
        >
          <Feather name="printer" size={13} color={colors.navyText} />
          <Text style={styles.smallExportBtnText}>Print Overview</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.analyticsGrid}>
        <View style={styles.analyticCard}>
          <Text style={styles.analyticVal}>{overview.totalStudents}</Text>
          <Text style={styles.analyticLabel}>Total Enrolled Students</Text>
        </View>
        <View style={styles.analyticCard}>
          <Text style={styles.analyticVal}>{overview.totalTeachers}</Text>
          <Text style={styles.analyticLabel}>Active Therapists</Text>
        </View>
        <View style={styles.analyticCard}>
          <Text style={styles.analyticVal}>{overview.sessionsThisMonth}</Text>
          <Text style={styles.analyticLabel}>Sessions Conducted (Month)</Text>
        </View>
        <View style={styles.analyticCard}>
          <Text style={[styles.analyticVal, { color: colors.successGreen }]}>
            {overview.avgGoalProgress}%
          </Text>
          <Text style={styles.analyticLabel}>Avg Goal Mastery Rate</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  smallExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  smallExportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  analyticCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  analyticVal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navyText,
  },
  analyticLabel: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
});
