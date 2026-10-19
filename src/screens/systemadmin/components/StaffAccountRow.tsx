import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import StatusPill from '../../../components/StatusPill';
import IconButton from '../../../components/IconButton';
import { type StaffMember, getSafeStaffRoles } from '../types';

interface StaffAccountRowProps {
  staff: StaffMember;
  isSelected: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (staff: StaffMember) => void;
  onResetPassword: (staff: StaffMember) => void;
  onToggleActive: (staff: StaffMember) => void;
  onDelete: (staff: StaffMember) => void;
}

export const StaffAccountRow: React.FC<StaffAccountRowProps> = React.memo(
  ({
    staff,
    isSelected,
    canEdit = true,
    canDelete = true,
    onToggleSelect,
    onEdit,
    onResetPassword,
    onToggleActive,
    onDelete,
  }) => {
    const safeRoles = getSafeStaffRoles(staff);

    return (
      <View style={styles.row}>
        <Pressable
          onPress={() => onToggleSelect(staff.id)}
          style={styles.checkbox}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSelected }}
          accessibilityLabel={isSelected ? `Deselect ${staff.name}` : `Select ${staff.name}`}
        >
          <View style={[styles.checkboxInner, isSelected && styles.checkboxChecked]} />
        </Pressable>

        <View style={styles.infoCol}>
          <Text style={typography.bodyBold}>{staff.name}</Text>
          <Text style={typography.caption}>
            {staff.email} · {safeRoles.length > 0 ? safeRoles.join(', ') : 'No roles assigned'}
          </Text>
        </View>

        <StatusPill
          status={staff.active ? 'approved' : 'revision'}
          label={staff.active ? 'Active' : 'Inactive'}
        />

        <View style={styles.rowActions}>
          {canEdit && (
            <>
              <IconButton
                style={styles.iconBtn}
                label={`Edit details and roles for ${staff.name}`}
                onPress={() => onEdit(staff)}
              >
                <Feather name="edit-2" size={14} color={colors.navyText} />
              </IconButton>

              <IconButton
                style={styles.iconBtn}
                label={`Manage credentials & reset password for ${staff.name}`}
                onPress={() => onResetPassword(staff)}
              >
                <Ionicons name="key" size={14} color="#D97706" />
              </IconButton>

              <IconButton
                style={styles.iconBtn}
                label={
                  staff.active
                    ? `Deactivate account for ${staff.name}`
                    : `Activate account for ${staff.name}`
                }
                onPress={() => onToggleActive(staff)}
              >
                <Feather
                  name={staff.active ? 'toggle-right' : 'toggle-left'}
                  size={18}
                  color={staff.active ? '#10B981' : '#EF4444'}
                />
              </IconButton>
            </>
          )}

          {canDelete && (
            <IconButton
              style={styles.iconBtn}
              label={`Delete staff account for ${staff.name}`}
              onPress={() => onDelete(staff)}
            >
              <Feather name="trash-2" size={14} color={colors.statusRevisionText} />
            </IconButton>
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  checkbox: {
    padding: spacing.xs,
  },
  checkboxInner: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  infoCol: {
    flex: 1,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgApp,
  },
  iconBtnActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
});
