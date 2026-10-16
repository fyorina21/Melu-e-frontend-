// src/screens/systemadmin/roles/components/RoleTableRow.tsx

import React from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import IconButton from '../../../../components/IconButton';
import RoleBadge from './RoleBadge';
import type { RoleRow, RoleFormData } from '../rolesTypes';

interface RoleTableRowProps {
  role: RoleRow;
  isEditing: boolean;
  isBusy: boolean;
  editForm: RoleFormData;
  onChangeEditForm: (data: Partial<RoleFormData>) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onConfigurePermissions: () => void;
  onDeleteRole: () => void;
}

export default function RoleTableRow({
  role,
  isEditing,
  isBusy,
  editForm,
  onChangeEditForm,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onConfigurePermissions,
  onDeleteRole,
}: RoleTableRowProps) {
  if (isEditing) {
    return (
      <View style={[styles.tableRow, styles.addingRow]}>
        <View style={[styles.colName, styles.inputCell]}>
          <TextInput
            style={styles.input}
            value={editForm.name}
            onChangeText={(text) => onChangeEditForm({ name: text })}
            placeholder="Role name"
            placeholderTextColor={colors.mutedText}
            autoFocus
          />
        </View>

        <View style={[styles.colDescription, styles.inputCell]}>
          <TextInput
            style={styles.input}
            value={editForm.description}
            onChangeText={(text) => onChangeEditForm({ description: text })}
            placeholder="Description"
            placeholderTextColor={colors.mutedText}
          />
        </View>

        <Text style={[styles.cellText, styles.colCount, { textAlign: 'center' }]}>
          {role.count}
        </Text>

        <View style={[styles.colType, styles.centerCell]}>
          <RoleBadge system={role.system} />
        </View>

        <View style={styles.actionsCell}>
          <IconButton onPress={onSaveEdit} disabled={isBusy} label={`Save ${role.name}`}>
            {isBusy ? (
              <ActivityIndicator size="small" color={colors.statusApprovedText} />
            ) : (
              <Feather name="check" size={18} color={colors.statusApprovedText} />
            )}
          </IconButton>

          <IconButton onPress={onCancelEdit} disabled={isBusy} label="Cancel editing role">
            <Feather name="x" size={18} color={colors.statusRevisionText} />
          </IconButton>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tableRow}>
      <Text style={[styles.cellTextBold, styles.colName]}>{role.name}</Text>

      <Text style={[styles.cellText, styles.colDescription]} numberOfLines={2}>
        {role.description}
      </Text>

      <Text style={[styles.cellText, styles.colCount, { textAlign: 'center' }]}>{role.count}</Text>

      <View style={[styles.colType, styles.centerCell]}>
        <RoleBadge system={role.system} />
      </View>

      <View style={styles.actionsCell}>
        <IconButton onPress={onStartEdit} disabled={isBusy} label={`Edit ${role.name}`}>
          <Feather name="edit-2" size={16} color={colors.primaryBlue} />
        </IconButton>

        <IconButton
          onPress={onConfigurePermissions}
          disabled={isBusy}
          label={`Configure permissions for ${role.name}`}
        >
          <Feather name="shield" size={16} color="#0284C7" />
        </IconButton>

        {!role.system && (
          <IconButton onPress={onDeleteRole} disabled={isBusy} label={`Delete ${role.name}`}>
            <Feather name="trash-2" size={16} color={colors.statusRevisionText} />
          </IconButton>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  addingRow: {
    backgroundColor: '#F0F9FF',
  },
  cellText: {
    fontSize: 13,
    color: colors.bodyText,
  },
  cellTextBold: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  colName: {
    flex: 2,
  },
  colDescription: {
    flex: 3,
  },
  colCount: {
    flex: 1,
    textAlign: 'center',
  },
  colType: {
    flex: 1,
  },
  centerCell: {
    alignItems: 'center',
  },
  inputCell: {
    paddingRight: spacing.xs,
  },
  actionsCell: {
    width: 90,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    fontSize: 13,
    backgroundColor: colors.bgCard,
  },
});
