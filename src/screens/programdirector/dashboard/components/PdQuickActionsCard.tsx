// src/screens/programdirector/dashboard/components/PdQuickActionsCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';

interface ActionItem {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  tab: string;
}

interface PdQuickActionsCardProps {
  onNavigateTab: (tab: string) => void;
}

export const PdQuickActionsCard: React.FC<PdQuickActionsCardProps> = React.memo(
  ({ onNavigateTab }) => {
    const actions: ActionItem[] = [
      {
        label: 'Review Assessments',
        icon: 'clipboard',
        tab: 'Assessment Review',
      },
      {
        label: 'Review IUPs',
        icon: 'file-text',
        tab: 'IUP Library Management',
      },
      {
        label: 'View Students',
        icon: 'users',
        tab: 'Student Caseload Management',
      },
      {
        label: 'View Reports',
        icon: 'bar-chart-2',
        tab: 'Reports',
      },
    ];

    return (
      <View style={styles.card}>
        <Text style={[typography.h3, { marginBottom: spacing.md }]}>Actions</Text>
        {actions.map((a) => (
          <TouchableOpacity
            key={a.label}
            style={styles.actionBtn}
            onPress={() => onNavigateTab(a.tab)}
            accessibilityRole="button"
            accessibilityLabel={a.label}
          >
            <Feather name={a.icon} size={14} color={colors.primaryBlue} />
            <Text style={styles.actionLabel}>{a.label}</Text>
            <Feather name="chevron-right" size={14} color={colors.mutedText} />
          </TouchableOpacity>
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
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primaryBlue,
    flex: 1,
  },
});
