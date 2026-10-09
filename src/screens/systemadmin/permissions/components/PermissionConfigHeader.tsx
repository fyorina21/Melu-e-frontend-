// src/screens/systemadmin/permissions/components/PermissionConfigHeader.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';

export default function PermissionConfigHeader() {
  return (
    <View style={styles.subHeader}>
      <View style={styles.titleRow}>
        <Text style={typography.h1}>Permission Configuration</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>SCR-SYS-003</Text>
        </View>
      </View>
      <Text style={styles.breadcrumbText}>
        <Feather name="settings" size={12} color={colors.mutedText} /> System Configuration /
        Permission Configuration (RBAC)
      </Text>
      <Text style={typography.caption}>
        SCR-SYS-003 · Configure granular action-level permissions (View, Create, Edit, Delete,
        Approve) per role across all system modules
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  subHeader: {
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breadcrumbText: {
    fontSize: 12,
    color: colors.mutedText,
  },
  badge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navyText,
  },
});
