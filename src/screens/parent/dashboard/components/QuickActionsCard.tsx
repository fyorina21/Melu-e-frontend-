// src/screens/parent/dashboard/components/QuickActionsCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing, makeShadow } from '../../../../theme/colors';
import { type QuickActionItem, DEFAULT_QUICK_ACTIONS } from '../parentDashboardTypes';

interface QuickActionsCardProps {
  actions?: QuickActionItem[];
  isDesktop?: boolean;
  onSelectAction: (tab: string) => void;
  style?: ViewStyle;
}

export default function QuickActionsCard({
  actions = DEFAULT_QUICK_ACTIONS,
  isDesktop = false,
  onSelectAction,
  style,
}: QuickActionsCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.cardTitle}>Quick Actions</Text>
      <View style={[styles.quickActionsGrid, isDesktop && styles.quickActionsGridDesktop]}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={[styles.quickActionCard, isDesktop && styles.quickActionCardDesktop]}
            onPress={() => onSelectAction(action.tab)}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <View style={[styles.quickActionIconBg, { backgroundColor: action.iconBg }]}>
              <Feather name={action.icon} size={24} color={action.iconColor} />
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  cardTitle: {
    fontWeight: '700',
    color: '#1F2937',
    fontSize: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionsGridDesktop: {
    gap: spacing.lg,
  },
  quickActionCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    ...makeShadow(1, 3, 0.05, '0, 0, 0', 1),
  },
  quickActionCardDesktop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: 'auto',
    flex: 1,
    gap: spacing.md,
  },
  quickActionIconBg: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
