import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { typography } from '../../../theme/typography';
import { type StaffMember, type StaffPayload, type RoleMeta, ROLE_OPTIONS } from '../types';

export interface StaffFormModalProps {
  visible: boolean;
  staff: StaffMember | null | undefined;
  roleOptions?: string[];
  roleMetaMap?: Record<string, RoleMeta>;
  onClose: () => void;
  onSave: (payload: StaffPayload) => void;
}

export function StaffFormModal({
  visible,
  staff,
  roleOptions,
  roleMetaMap,
  onClose,
  onSave,
}: StaffFormModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [rolesDropdownOpen, setRolesDropdownOpen] = useState(false);

  useEffect(() => {
    setRolesDropdownOpen(false);
    if (staff) {
      setName(staff.name);
      setEmail(staff.email);
      setPhone(staff.phone || '');
      setPassword('');
      setRoles(staff.roles || []);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRoles([]);
    }
  }, [staff, visible]);

  const toggleRole = (r: string) => {
    const meta = roleMetaMap?.[r];
    if (!roles.includes(r) && meta && meta.has_permissions === false) {
      Alert.alert(
        'Unconfigured Role',
        `The role "${r}" cannot be assigned because it does not have any permissions configured yet.\n\nPlease configure permissions on the Permission Configuration page first before assigning it to staff.`,
      );
      return;
    }
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Validation Error', 'Name and email are required.');
      return;
    }
    if (!staff && !password.trim()) {
      Alert.alert('Validation Error', 'Please enter a password for the new staff member.');
      return;
    }
    if (roles.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one role for this staff member.');
      return;
    }

    // Pre-validate that no unconfigured role is selected
    for (const r of roles) {
      const meta = roleMetaMap?.[r];
      if (meta && meta.has_permissions === false) {
        Alert.alert(
          'Unconfigured Role Selected',
          `The role "${r}" does not have any permissions configured yet.\n\nPlease configure its permissions on the Permission Configuration page before assigning it to staff.`,
        );
        return;
      }
    }

    onSave({
      id: staff?.id,
      name,
      email,
      phone,
      password: password.trim() ? password.trim() : undefined,
      roles,
      active: staff?.active ?? true,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h2}>{staff ? 'Edit Staff Account' : 'Add New Staff Member'}</Text>
          <ScrollView contentContainerStyle={{ gap: spacing.md }}>
            <View style={styles.field}>
              <Text style={typography.label}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. John Doe"
                placeholderTextColor={colors.mutedText}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.field}>
              <Text style={typography.label}>Email Address (Login Username) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. jdoe@melue.org"
                placeholderTextColor={colors.mutedText}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.field}>
              <Text style={typography.label}>
                {staff ? 'Change Password (Optional)' : 'Login Password *'}
              </Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder={
                    staff ? 'Leave blank to keep existing password' : 'Enter login password'
                  }
                  placeholderTextColor={colors.mutedText}
                  value={password}
                  onChangeText={setPassword}
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
                {staff
                  ? 'Enter a new password if you wish to reset this user credentials.'
                  : 'This password will allow the new staff member to sign in to the application.'}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={typography.label}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. +1 (555) 019-2834"
                placeholderTextColor={colors.mutedText}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.field}>
              <Text style={typography.label}>Assigned System Role(s) *</Text>

              <TouchableOpacity
                style={[
                  styles.formDropdownTrigger,
                  rolesDropdownOpen && styles.formDropdownTriggerOpen,
                ]}
                onPress={() => setRolesDropdownOpen((v) => !v)}
                accessibilityRole="combobox"
                accessibilityLabel="Select system roles"
              >
                <View style={styles.formDropdownSelectedWrap}>
                  {roles.length === 0 ? (
                    <Text style={styles.placeholderText}>Select role(s) to assign...</Text>
                  ) : (
                    roles.map((r) => (
                      <View key={r} style={styles.roleTag}>
                        <Text style={styles.roleTagText}>{r}</Text>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation?.();
                            toggleRole(r);
                          }}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Feather name="x" size={12} color={colors.navyText} />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
                <Feather
                  name={rolesDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.navyText}
                />
              </TouchableOpacity>

              {rolesDropdownOpen && (
                <View style={styles.formDropdownMenu}>
                  <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                    {(roleOptions && roleOptions.length > 0 ? roleOptions : ROLE_OPTIONS).map(
                      (r) => {
                        const isSelected = roles.includes(r);
                        const isUnconfigured = roleMetaMap?.[r]?.has_permissions === false;
                        return (
                          <TouchableOpacity
                            key={r}
                            style={[
                              styles.formDropdownOption,
                              isSelected && styles.formDropdownOptionSelected,
                              isUnconfigured && { opacity: 0.75 },
                            ]}
                            onPress={() => toggleRole(r)}
                          >
                            <Feather
                              name={isSelected ? 'check-square' : 'square'}
                              size={16}
                              color={isSelected ? colors.navyText : colors.mutedText}
                            />
                            <Text
                              style={[
                                styles.formDropdownOptionText,
                                isSelected && styles.formDropdownOptionTextSelected,
                              ]}
                            >
                              {r}
                            </Text>
                            {isUnconfigured && (
                              <View style={styles.unconfiguredBadge}>
                                <Feather name="alert-circle" size={10} color={colors.error} />
                                <Text style={styles.unconfiguredBadgeText}>No Perms</Text>
                              </View>
                            )}
                            {isSelected && (
                              <View style={styles.optionCheckBadge}>
                                <Feather name="check" size={12} color={colors.navyText} />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      },
                    )}
                  </ScrollView>
                  <View style={styles.formDropdownFooter}>
                    <Text style={styles.formDropdownFooterText}>
                      {roles.length} role{roles.length === 1 ? '' : 's'} selected
                    </Text>
                    <TouchableOpacity
                      style={styles.formDropdownDoneBtn}
                      onPress={() => setRolesDropdownOpen(false)}
                    >
                      <Text style={styles.formDropdownDoneBtnText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <Text style={styles.fieldHintText}>
                Users can hold multiple roles simultaneously (FR-007). Click to toggle.
              </Text>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>
                {staff ? 'Save Changes' : 'Create Staff Account'}
              </Text>
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
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  field: { gap: spacing.xs },
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelBtnText: { color: colors.bodyText, fontWeight: '600' },
  saveBtn: {
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  saveBtnText: { color: colors.navyText, fontWeight: '700' },
  formDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgApp,
    minHeight: 44,
  },
  formDropdownTriggerOpen: { borderColor: colors.primaryYellow },
  formDropdownSelectedWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingRight: spacing.xs,
  },
  placeholderText: { fontSize: 13, color: colors.mutedText },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
  },
  roleTagText: { fontSize: 11, fontWeight: '700', color: colors.navyText },
  formDropdownMenu: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  formDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  formDropdownOptionSelected: { backgroundColor: '#FEF9C3' },
  formDropdownOptionText: { fontSize: 13, color: colors.bodyText, flex: 1 },
  formDropdownOptionTextSelected: { fontWeight: '700', color: colors.navyText },
  unconfiguredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.errorLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  unconfiguredBadgeText: { fontSize: 10, fontWeight: '700', color: colors.errorDark },
  optionCheckBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formDropdownFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.bgApp,
  },
  formDropdownFooterText: { fontSize: 11, color: colors.mutedText },
  formDropdownDoneBtn: {
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  formDropdownDoneBtnText: { fontSize: 11, fontWeight: '700', color: colors.navyText },
});

export default StaffFormModal;
