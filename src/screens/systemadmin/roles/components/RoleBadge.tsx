// src/screens/systemadmin/roles/components/RoleBadge.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';

interface RoleBadgeProps {
  system?: boolean;
}

export default function RoleBadge({ system }: RoleBadgeProps) {
  return (
    <View style={[styles.badge, system ? styles.badgeSystem : styles.badgeCustom]}>
      <Text style={system ? styles.badgeSystemText : styles.badgeCustomText}>
        {system ? 'System' : 'Custom'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeSystem: {
    backgroundColor: colors.statusInProgressBg,
  },
  badgeSystemText: {
    color: colors.statusInProgressText,
    fontSize: 11,
    fontWeight: '600',
  },
  badgeCustom: {
    backgroundColor: colors.statusPendingBg,
  },
  badgeCustomText: {
    color: colors.statusPendingText,
    fontSize: 11,
    fontWeight: '600',
  },
});
