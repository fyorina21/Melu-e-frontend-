// src/screens/systemadmin/roles/components/RoleManagementHeader.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';

interface RoleManagementHeaderProps {
  onConfigurePermissions: () => void;
  onAddRole: () => void;
  addingRole: boolean;
}

export default function RoleManagementHeader({
  onConfigurePermissions,
  onAddRole,
  addingRole,
}: RoleManagementHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textCol}>
        <Text style={typography.h2}>Role Management</Text>
        <Text style={typography.caption}>
          SCR-SYS-002 • Configure staff roles and their descriptions
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.btn, styles.configureBtn]}
          onPress={onConfigurePermissions}
          accessibilityRole="button"
          accessibilityLabel="Configure Permissions"
        >
          <Feather name="shield" size={14} color="#0284C7" />
          <Text style={styles.configureBtnText}>Configure Permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.addBtn]}
          onPress={onAddRole}
          accessibilityRole="button"
          accessibilityLabel="Add Role"
          disabled={addingRole}
        >
          <Feather name="plus" size={14} color={colors.primaryBlue} />
          <Text style={styles.addBtnText}>Add Role</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  textCol: {
    gap: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  configureBtn: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  configureBtnText: {
    color: '#0284C7',
    fontWeight: '600',
    fontSize: 13,
  },
  addBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
  },
  addBtnText: {
    color: colors.primaryBlue,
    fontWeight: '600',
    fontSize: 13,
  },
});
