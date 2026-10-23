import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import Tooltip from '../../../../components/Tooltip';

interface RoleManagementHeaderProps {
  onConfigurePermissions: () => void;
  onAddRole: () => void;
  addingRole: boolean;
  canCreate?: boolean;
}

export default function RoleManagementHeader({
  onConfigurePermissions,
  onAddRole,
  addingRole,
  canCreate = true,
}: RoleManagementHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textCol}>
        <Text style={typography.h2}>Role Management</Text>
        <Text style={typography.caption}>Configure staff roles and their descriptions</Text>
      </View>

      <View style={styles.actionsRow}>
        <Tooltip label="Open system-wide permission configuration matrix">
          <TouchableOpacity
            style={[styles.btn, styles.configureBtn]}
            onPress={onConfigurePermissions}
            accessibilityRole="button"
            accessibilityLabel="Configure Permissions"
            {...(Platform.OS === 'web'
              ? { title: 'Open system-wide permission configuration matrix' }
              : {})}
          >
            <Feather name="shield" size={14} color="#0284C7" />
            <Text style={styles.configureBtnText}>Configure Permissions</Text>
          </TouchableOpacity>
        </Tooltip>

        {canCreate && (
          <Tooltip label="Add a new custom staff role">
            <TouchableOpacity
              style={[styles.btn, styles.addBtn]}
              onPress={onAddRole}
              accessibilityRole="button"
              accessibilityLabel="Add Role"
              disabled={addingRole}
              {...(Platform.OS === 'web' ? { title: 'Add a new custom staff role' } : {})}
            >
              <Feather name="plus" size={14} color={colors.primaryBlue} />
              <Text style={styles.addBtnText}>Add Role</Text>
            </TouchableOpacity>
          </Tooltip>
        )}
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
