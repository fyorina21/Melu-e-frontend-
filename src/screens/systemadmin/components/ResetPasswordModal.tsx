import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { typography } from '../../../theme/typography';
import { useToast } from '../../../context/ToastContext';
import { resetStaffPassword } from '../../../api/SystemAdminApi';
import type { StaffMember } from '../types';

export interface ResetPasswordModalProps {
  visible: boolean;
  staff: StaffMember | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResetPasswordModal({
  visible,
  staff,
  onClose,
  onSuccess,
}: ResetPasswordModalProps) {
  const { showToast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNewPassword('');
    setShowPassword(false);
  }, [staff, visible]);

  if (!staff) return null;

  const handleCustomReset = async () => {
    if (!newPassword.trim()) {
      showToast('Please enter a new password', 'error');
      return;
    }
    try {
      setSaving(true);
      await resetStaffPassword(staff.id, newPassword.trim());
      showToast(`Password updated for ${staff.name} (${staff.email})`, 'success');
      onSuccess();
      onClose();
    } catch {
      showToast('Failed to update password', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalSheet, { maxWidth: 440, width: '100%', alignSelf: 'center' }]}>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="key" size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.h2}>Manage Credentials</Text>
              <Text style={typography.caption}>
                {staff.name} · {staff.email}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          <View style={styles.detailsCard}>
            <Text style={[typography.caption, { fontWeight: '700', color: colors.navyText }]}>
              Account Details
            </Text>
            <Text style={typography.caption}>
              Login Email:{' '}
              <Text style={{ fontWeight: '600', color: colors.navyText }}>{staff.email}</Text>
            </Text>
            <Text style={typography.caption}>
              Role(s):{' '}
              <Text style={{ fontWeight: '600', color: colors.navyText }}>
                {staff.roles.join(', ')}
              </Text>
            </Text>
            <Text style={typography.caption}>
              Status:{' '}
              <Text
                style={{ fontWeight: '600', color: staff.active ? colors.success : colors.error }}
              >
                {staff.active ? 'Active' : 'Inactive'}
              </Text>
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={typography.label}>Set New Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Enter new custom password"
                placeholderTextColor={colors.mutedText}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.passwordEyeBtn}
                onPress={() => setShowPassword((p) => !p)}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={colors.navyText}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldHintText}>
              Updating password will change this staff member's login credentials immediately.
            </Text>
          </View>

          <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
            <TouchableOpacity
              style={[styles.saveBtn, { alignItems: 'center', paddingVertical: spacing.md }]}
              onPress={handleCustomReset}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save New Password'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelBtn, { alignItems: 'center', paddingVertical: spacing.sm }]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCard: {
    backgroundColor: colors.bgApp,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  field: { gap: spacing.xs },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.navyText,
    backgroundColor: colors.bgApp,
  },
  passwordEyeBtn: {
    padding: spacing.sm,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldHintText: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  saveBtnText: { color: colors.navyText, fontWeight: '700' },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelBtnText: { color: colors.bodyText, fontWeight: '600' },
});

export default ResetPasswordModal;
