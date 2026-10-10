import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import type { PermissionRole } from '../permissionTypes';

interface RolePickerModalProps {
  visible: boolean;
  roles: PermissionRole[];
  selectedRoleId: string;
  onSelectRole: (roleId: string) => void;
  onClose: () => void;
}

export const RolePickerModal: React.FC<RolePickerModalProps> = React.memo(
  ({ visible, roles, selectedRoleId, onSelectRole, onClose }) => {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.dropdownModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={styles.rolePickerCard}>
            <View style={styles.rolePickerHeader}>
              <View style={styles.titleRow}>
                <Feather name="shield" size={18} color="#0284C7" />
                <Text style={typography.h2}>Select Role to Configure</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Close role selector"
              >
                <Feather name="x" size={18} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <Text style={typography.caption}>
              Choose a role below to view, manage, and audit its access permissions across all
              modules.
            </Text>

            <ScrollView style={styles.rolePickerList} showsVerticalScrollIndicator={true}>
              {roles.map((r) => {
                const isSelected = selectedRoleId === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.rolePickerItem, isSelected && styles.rolePickerItemActive]}
                    onPress={() => onSelectRole(r.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select role ${r.name}`}
                  >
                    <View style={styles.roleContentRow}>
                      <View
                        style={[styles.roleIconCircle, isSelected && styles.roleIconCircleActive]}
                      >
                        <Feather
                          name="shield"
                          size={14}
                          color={isSelected ? colors.white : colors.navyText}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.bodyBold, isSelected && { color: '#0284C7' }]}>
                          {r.name}
                        </Text>
                        {r.description ? (
                          <Text style={typography.caption} numberOfLines={1}>
                            {r.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {isSelected && (
                      <View style={styles.roleSelectedBadge}>
                        <Feather name="check" size={14} color="#0284C7" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  rolePickerCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  rolePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rolePickerList: {
    maxHeight: 320,
  },
  rolePickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.bgApp,
  },
  rolePickerItemActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  roleContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  roleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconCircleActive: {
    backgroundColor: '#0284C7',
  },
  roleSelectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
