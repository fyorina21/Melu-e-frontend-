// src/screens/programdirector/dashboard/components/PdStatsGrid.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../../../../theme/colors';

interface StatItem {
  label: string;
  value: number;
  icon: keyof typeof Feather.glyphMap;
  bg: string;
  ic: string;
}

interface PdStatsGridProps {
  totalStudents: number;
  inAssessment: number;
  assessmentCompleted: number;
  readyForSessions: number;
  onPressCard: () => void;
}

export const PdStatsGrid: React.FC<PdStatsGridProps> = React.memo(
  ({ totalStudents, inAssessment, assessmentCompleted, readyForSessions, onPressCard }) => {
    const cards: StatItem[] = [
      {
        label: 'Total Students',
        value: totalStudents,
        icon: 'users',
        bg: '#EFF6FF',
        ic: '#3B82F6',
      },
      {
        label: 'In Assessment',
        value: inAssessment,
        icon: 'clipboard',
        bg: '#FEF3C7',
        ic: '#F59E0B',
      },
      {
        label: 'Assessment Completed',
        value: assessmentCompleted,
        icon: 'check-circle',
        bg: '#D1FAE5',
        ic: '#10B981',
      },
      {
        label: 'Ready for Sessions',
        value: readyForSessions,
        icon: 'play-circle',
        bg: '#EDE9FE',
        ic: '#8B5CF6',
      },
    ];

    return (
      <View style={styles.statsGrid}>
        {cards.map((c) => (
          <TouchableOpacity
            key={c.label}
            style={styles.statCard}
            onPress={onPressCard}
            accessibilityRole="button"
            accessibilityLabel={`${c.label}: ${c.value}`}
          >
            <View style={[styles.statIconBg, { backgroundColor: c.bg }]}>
              <Feather name={c.icon} size={18} color={c.ic} />
            </View>
            <Text style={styles.statValue}>{c.value}</Text>
            <Text style={styles.statLabel}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flexGrow: 1,
    minWidth: '45%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...makeShadow(1, 3, 0.04, '0, 0, 0', 1),
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.navyText,
  },
  statLabel: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
});
