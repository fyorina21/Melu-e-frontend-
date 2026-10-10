import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import type { PermissionRole } from '../permissionTypes';

interface PermissionControlsBarProps {
  selectedRole: PermissionRole;
  onOpenRolePicker: () => void;
  onFullAccess: () => void;
  onReadOnly: () => void;
  onResetDefault: () => void;
  onOpenCopyModal: () => void;
}

export const PermissionControlsBar: React.FC<PermissionControlsBarProps> = React.memo(
  ({
    selectedRole,
    onOpenRolePicker,
    onFullAccess,
    onReadOnly,
    onResetDefault,
    onOpenCopyModal,
  }) => {
    return (
      <View style={styles.controlsRow}>
        <View style={styles.roleWrapper}>
          <Text style={typography.label}>CONFIGURING ROLE</Text>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={onOpenRolePicker}
            accessibilityRole="combobox"
            accessibilityLabel={`Configuring role: ${selectedRole.name}`}
          >
            <View style={styles.roleLabelRow}>
              <Feather name="shield" size={15} color="#0284C7" />
              <Text style={typography.bodyBold} numberOfLines={1}>
                {selectedRole.name}
              </Text>
            </View>
            <Feather name="chevron-down" size={16} color={colors.navyText} />
          </TouchableOpacity>
        </View>

        {/* Preset action buttons */}
        <View style={styles.presetsRow}>
          <TouchableOpacity
            style={styles.presetBtn}
            onPress={onFullAccess}
            accessibilityRole="button"
            accessibilityLabel="Grant full access"
          >
            <Feather name="check-circle" size={12} color={colors.bodyText} />
            <Text style={styles.presetBtnText}>Full Access</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetBtn}
            onPress={onReadOnly}
            accessibilityRole="button"
            accessibilityLabel="Grant read only access"
          >
            <Feather name="eye" size={12} color={colors.bodyText} />
            <Text style={styles.presetBtnText}>Read Only</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetBtn}
            onPress={onResetDefault}
            accessibilityRole="button"
            accessibilityLabel="Reset permissions to default template"
          >
            <Feather name="rotate-ccw" size={12} color={colors.bodyText} />
            <Text style={styles.presetBtnText}>Reset to Default</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetBtn}
            onPress={onOpenCopyModal}
            accessibilityRole="button"
            accessibilityLabel="Copy permissions from another role"
          >
            <Feather name="copy" size={12} color={colors.bodyText} />
            <Text style={styles.presetBtnText}>Copy from Role...</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  roleWrapper: {
    gap: spacing.xs,
    minWidth: 220,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    minWidth: 220,
  },
  roleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
});
