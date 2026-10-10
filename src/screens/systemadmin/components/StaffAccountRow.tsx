import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import StatusPill from '../../../components/StatusPill';
import { type StaffMember } from '../types';

interface StaffAccountRowProps {
  staff: StaffMember;
  isSelected: boolean;
  isLinkingActive: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (staff: StaffMember) => void;
  onLinkToggle: (staff: StaffMember) => void;
  onResetPassword: (staff: StaffMember) => void;
  onToggleActive: (staff: StaffMember) => void;
  onDelete: (staff: StaffMember) => void;
}

export const StaffAccountRow: React.FC<StaffAccountRowProps> = React.memo(
  ({
    staff,
    isSelected,
    isLinkingActive,
    onToggleSelect,
    onEdit,
    onLinkToggle,
    onResetPassword,
    onToggleActive,
    onDelete,
  }) => {
    const isLinkable = staff.roles.includes('Teacher') || staff.roles.includes('Therapist');

    return (
      <View style={styles.row}>
        <TouchableOpacity
          onPress={() => onToggleSelect(staff.id)}
          style={styles.checkbox}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSelected }}
          accessibilityLabel={`Select ${staff.name}`}
        >
          <View style={[styles.checkboxInner, isSelected && styles.checkboxChecked]} />
        </TouchableOpacity>

        <View style={styles.infoCol}>
          <Text style={typography.bodyBold}>{staff.name}</Text>
          <Text style={typography.caption}>
            {staff.email} · {staff.roles.join(', ')}
          </Text>
        </View>

        <StatusPill
          status={staff.active ? 'approved' : 'revision'}
          label={staff.active ? 'Active' : 'Inactive'}
        />

        <View style={styles.rowActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            accessibilityLabel={`Edit ${staff.name}`}
            onPress={() => onEdit(staff)}
          >
            <Feather name="edit-2" size={14} color={colors.navyText} />
          </TouchableOpacity>

          {isLinkable && (
            <TouchableOpacity
              style={[styles.iconBtn, isLinkingActive && styles.iconBtnActive]}
              accessibilityLabel={`Link ${staff.name} to students`}
              onPress={() => onLinkToggle(staff)}
            >
              <Feather name="link-2" size={14} color={colors.navyText} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.iconBtn}
            accessibilityLabel={`Manage credentials for ${staff.name}`}
            onPress={() => onResetPassword(staff)}
          >
            <Ionicons name="key" size={14} color="#D97706" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            accessibilityLabel={`Toggle active status for ${staff.name}`}
            onPress={() => onToggleActive(staff)}
          >
            <Feather
              name={staff.active ? 'toggle-right' : 'toggle-left'}
              size={18}
              color={staff.active ? '#10B981' : '#EF4444'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            accessibilityLabel={`Delete ${staff.name}`}
            onPress={() => onDelete(staff)}
          >
            <Feather name="trash-2" size={14} color={colors.statusRevisionText} />
          </TouchableOpacity>
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
