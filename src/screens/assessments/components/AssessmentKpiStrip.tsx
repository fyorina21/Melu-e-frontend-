import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import type { AssessmentKpis } from '../assessmentDashboardTypes';

interface Props {
  kpis: AssessmentKpis;
}

export const AssessmentKpiStrip: React.FC<Props> = React.memo(({ kpis }) => {
  const completedRatio =
    kpis.totalRequiredSubModules > 0
      ? `${kpis.completedSubModules} / ${kpis.totalRequiredSubModules}`
      : '0 / 0';

  return (
    <View style={styles.grid}>
      {/* Card 1: Assigned Students */}
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
            <Feather name="users" size={18} color="#0284C7" />
          </View>
        </View>
        <Text style={styles.value}>{kpis.assignedStudentsCount}</Text>
        <Text style={styles.title}>Assigned Students</Text>
        <Text style={styles.subtitle}>Active roster</Text>
      </View>

      {/* Card 2: Completed Sub-modules */}
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
            <Feather name="check-circle" size={18} color="#16A34A" />
          </View>
        </View>
        <Text style={styles.value}>{completedRatio}</Text>
        <Text style={styles.title}>Completed</Text>
        <Text style={styles.subtitle}>Sub-modules finalized</Text>
      </View>

      {/* Card 3: In Progress Sub-modules */}
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
            <Feather name="clock" size={18} color="#D97706" />
          </View>
        </View>
        <Text style={styles.value}>{kpis.inProgressSubModules}</Text>
        <Text style={styles.title}>In Progress</Text>
        <Text style={styles.subtitle}>Drafting observations</Text>
      </View>

      {/* Card 4: Pending Baseline Entry */}
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={[styles.iconBox, { backgroundColor: '#F1F5F9' }]}>
            <Feather name="alert-circle" size={18} color="#64748B" />
          </View>
        </View>
        <Text style={styles.value}>{kpis.pendingSubModules}</Text>
        <Text style={styles.title}>Pending</Text>
        <Text style={styles.subtitle}>Pending baseline entry</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    width: '100%',
  },
  card: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navyText,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
});
