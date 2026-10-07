import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import type { CoordinatorStackParamList } from '../../../../types';

interface QuickActionsCardProps {
  onNavigate: (route: keyof CoordinatorStackParamList) => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = React.memo(({ onNavigate }) => {
  const quickActions: {
    label: string;
    icon: keyof typeof Feather.glyphMap;
    route: keyof CoordinatorStackParamList;
    color: string;
  }[] = [
    {
      label: 'Live Sessions',
      icon: 'activity',
      route: 'LiveSessionMonitoring',
      color: colors.primaryYellowDark,
    },
    {
      label: 'Session Review',
      icon: 'file-text',
      route: 'SessionSummaryReview',
      color: '#FCD34D',
    },
    {
      label: 'Student Progress',
      icon: 'target',
      route: 'CoordinatorStudentProgress',
      color: '#22C55E',
    },
    {
      label: 'Operations',
      icon: 'users',
      route: 'WorkloadDashboard',
      color: '#A855F7',
    },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Quick Actions</Text>
      <View style={styles.actionsList}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.quickAction}
            onPress={() => onNavigate(action.route)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <View style={styles.actionLeft}>
              <Feather name={action.icon} size={16} color={action.color} />
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.navyText,
  },
  actionsList: {
    gap: spacing.sm,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navyText,
  },
});
