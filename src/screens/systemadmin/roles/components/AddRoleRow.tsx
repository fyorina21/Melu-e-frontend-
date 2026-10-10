// src/screens/systemadmin/roles/components/AddRoleRow.tsx

import React from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import IconButton from '../../../../components/IconButton';
import RoleBadge from './RoleBadge';
import type { RoleFormData } from '../rolesTypes';

interface AddRoleRowProps {
  formData: RoleFormData;
  isBusy: boolean;
  onChangeFormData: (data: Partial<RoleFormData>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function AddRoleRow({
  formData,
  isBusy,
  onChangeFormData,
  onSave,
  onCancel,
}: AddRoleRowProps) {
  return (
    <View style={[styles.tableRow, styles.addingRow]}>
      <View style={[styles.colName, styles.inputCell]}>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => onChangeFormData({ name: text })}
          placeholder="Role name"
          placeholderTextColor={colors.mutedText}
          autoFocus
        />
      </View>

      <View style={[styles.colDescription, styles.inputCell]}>
        <TextInput
          style={styles.input}
          value={formData.description}
          onChangeText={(text) => onChangeFormData({ description: text })}
          placeholder="Description"
          placeholderTextColor={colors.mutedText}
        />
      </View>

      <Text style={[styles.cellText, styles.colCount, { textAlign: 'center' }]}>0</Text>

      <View style={[styles.colType, styles.centerCell]}>
        <RoleBadge />
      </View>

      <View style={styles.actionsCell}>
        <IconButton onPress={onSave} disabled={isBusy} label="Save new role">
          {isBusy ? (
            <ActivityIndicator size="small" color={colors.statusApprovedText} />
          ) : (
            <Feather name="check" size={18} color={colors.statusApprovedText} />
          )}
        </IconButton>

        <IconButton onPress={onCancel} disabled={isBusy} label="Cancel adding role">
          <Feather name="x" size={18} color={colors.statusRevisionText} />
        </IconButton>
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
