import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import type { PermissionRole } from '../permissionTypes';

interface CopyPermissionsModalProps {
  visible: boolean;
  roles: PermissionRole[];
  selectedRoleId: string;
  targetRoleName: string;
  onCopyFromRole: (sourceRoleId: string) => void;
  onClose: () => void;
}

export const CopyPermissionsModal: React.FC<CopyPermissionsModalProps> = React.memo(
  ({ visible, roles, selectedRoleId, targetRoleName, onCopyFromRole, onClose }) => {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={typography.h2}>Copy Permissions From</Text>
            <Text style={typography.caption}>
              Select a role to copy all permissions into {targetRoleName}:
            </Text>
            <ScrollView style={styles.optionsList}>
              {roles
                .filter((r) => r.id !== selectedRoleId)
                .map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={styles.copyRoleOption}
                    onPress={() => onCopyFromRole(r.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Copy permissions from ${r.name}`}
                  >
                    <Text style={typography.bodyBold}>{r.name}</Text>
                    <Feather name="arrow-right" size={14} color={colors.navyText} />
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.closeModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  optionsList: {
    maxHeight: 260,
    marginVertical: spacing.md,
  },
  copyRoleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  closeModalBtn: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  closeModalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mutedText,
  },
});
