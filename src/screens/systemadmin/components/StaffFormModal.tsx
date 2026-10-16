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
  ActivityIndicator,
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
  isSaving?: boolean;
  onClose: () => void;
  onSave: (payload: StaffPayload) => void;
}

export function StaffFormModal({
  visible,
  staff,
  roleOptions,
  roleMetaMap,
  isSaving = false,
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unconfiguredRoleNotice, setUnconfiguredRoleNotice] = useState<string | null>(null);

  useEffect(() => {
    setRolesDropdownOpen(false);
    setErrors({});
    setUnconfiguredRoleNotice(null);
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
    if (
      !roles.includes(r) &&
      meta &&
      (meta.has_permissions === false || meta.permission_count === 0)
    ) {
      setUnconfiguredRoleNotice(
        `The role "${r}" cannot be assigned because it does not have any permissions configured yet. Please configure permissions on the Permission Configuration screen first.`,
      );
      setErrors((prev) => ({
        ...prev,
        roles: `Please configure permissions first to assign "${r}".`,
      }));
      return;
    }
    setUnconfiguredRoleNotice(null);
    setErrors((prev) => ({ ...prev, roles: '' }));
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = 'Full name is required';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address (e.g. jdoe@melue.org)';
    }

    if (!staff && !password.trim()) {
      nextErrors.password = 'Login password is required for new staff members';
    } else if (password.trim() && password.trim().length < 4) {
      nextErrors.password = 'Password must be at least 4 characters long';
    }

    if (roles.length === 0) {
      nextErrors.roles = 'Please select at least one system role to assign';
    } else {
      for (const r of roles) {
        const meta = roleMetaMap?.[r];
        if (meta && (meta.has_permissions === false || meta.permission_count === 0)) {
          nextErrors.roles = `The role "${r}" has no permissions configured. Please configure permissions first to assign this role.`;
          break;
        }
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSave({
      id: staff?.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: password.trim() ? password.trim() : undefined,
      roles,
      active: staff?.active ?? true,
    });
  };

  const hasErrors = Object.keys(errors).some((k) => !!errors[k]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h2}>{staff ? 'Edit Staff Account' : 'Add New Staff Member'}</Text>

          {hasErrors && (
            <View style={styles.errorSummaryBanner}>
              <Feather name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorSummaryText}>
                Please resolve the validation errors below before proceeding.
              </Text>
            </View>
          )}

          <ScrollView contentContainerStyle={{ gap: spacing.md }}>
            <View style={styles.field}>
              <Text style={typography.label}>Full Name *</Text>
              <TextInput
                style={[styles.textInput, !!errors.name && styles.textInputError]}
                placeholder="e.g. John Doe"
                placeholderTextColor={colors.mutedText}
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
              />
              {!!errors.name && (
                <View style={styles.fieldErrorRow}>
                  <Feather name="alert-circle" size={12} color={colors.error} />
                  <Text style={styles.fieldErrorText}>{errors.name}</Text>
                </View>
              )}
            </View>

            <View style={styles.field}>
              <Text style={typography.label}>Email Address (Login Username) *</Text>
              <TextInput
                style={[styles.textInput, !!errors.email && styles.textInputError]}
                placeholder="e.g. jdoe@melue.org"
                placeholderTextColor={colors.mutedText}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {!!errors.email && (
                <View style={styles.fieldErrorRow}>
                  <Feather name="alert-circle" size={12} color={colors.error} />
                  <Text style={styles.fieldErrorText}>{errors.email}</Text>
                </View>
              )}
            </View>

            <View style={styles.field}>
              <Text style={typography.label}>
                {staff ? 'Change Password (Optional)' : 'Login Password *'}
              </Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[
                    styles.textInput,
                    { flex: 1 },
                    !!errors.password && styles.textInputError,
                  ]}
                  placeholder={
                    staff ? 'Leave blank to keep existing password' : 'Enter login password'
                  }
                  placeholderTextColor={colors.mutedText}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
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
              {!!errors.password ? (
                <View style={styles.fieldErrorRow}>
                  <Feather name="alert-circle" size={12} color={colors.error} />
                  <Text style={styles.fieldErrorText}>{errors.password}</Text>
                </View>
              ) : (
                <Text style={styles.fieldHintText}>
                  {staff
                    ? 'Enter a new password if you wish to reset this user credentials.'
                    : 'This password will allow the new staff member to sign in to the application.'}
                </Text>
              )}
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
                  !!errors.roles && styles.formDropdownTriggerError,
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

              {!!unconfiguredRoleNotice && (
                <View style={styles.unconfiguredCalloutBox}>
                  <Feather name="alert-triangle" size={14} color="#B45309" />
                  <Text style={styles.unconfiguredCalloutText}>{unconfiguredRoleNotice}</Text>
                </View>
              )}

              {!!errors.roles && (
                <View style={styles.fieldErrorRow}>
                  <Feather name="alert-circle" size={12} color={colors.error} />
                  <Text style={styles.fieldErrorText}>{errors.roles}</Text>
                </View>
              )}

              {rolesDropdownOpen && (
                <View style={styles.formDropdownMenu}>
                  <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                    {(roleOptions && roleOptions.length > 0 ? roleOptions : ROLE_OPTIONS).map(
                      (r) => {
                        const isSelected = roles.includes(r);
                        const meta = roleMetaMap?.[r];
                        const isUnconfigured =
                          meta?.has_permissions === false || meta?.permission_count === 0;
                        return (
                          <TouchableOpacity
                            key={r}
                            style={[
                              styles.formDropdownOption,
                              isSelected && styles.formDropdownOptionSelected,
                              isUnconfigured && styles.formDropdownOptionDisabled,
                            ]}
                            onPress={() => toggleRole(r)}
                          >
                            <Feather
                              name={isSelected ? 'check-square' : 'square'}
                              size={16}
                              color={
                                isSelected
                                  ? colors.navyText
                                  : isUnconfigured
                                    ? colors.border
                                    : colors.mutedText
                              }
                            />
                            <View style={{ flex: 1, gap: 2 }}>
                              <Text
                                style={[
                                  styles.formDropdownOptionText,
                                  isSelected && styles.formDropdownOptionTextSelected,
                                  isUnconfigured && { color: colors.mutedText },
                                ]}
                              >
                                {r}
                              </Text>
                              {isUnconfigured && (
                                <Text style={styles.unconfiguredRoleNoticeText}>
                                  Please configure permissions first to assign this role
                                </Text>
                              )}
                            </View>
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
                Users can hold multiple roles simultaneously.
              </Text>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSaving}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator size="small" color={colors.navyText} />
                  <Text style={styles.saveBtnText}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>
                  {staff ? 'Save Changes' : 'Create Staff Account'}
                </Text>
              )}
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
  textInputError: {
    borderColor: colors.error,
    backgroundColor: '#FEF2F2',
  },
  formDropdownTriggerError: {
    borderColor: colors.error,
    backgroundColor: '#FEF2F2',
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  fieldErrorText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '500',
  },
  errorSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorSummaryText: {
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '600',
    flex: 1,
  },
  unconfiguredCalloutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  unconfiguredCalloutText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '500',
    flex: 1,
  },
  formDropdownOptionDisabled: {
    backgroundColor: '#F8FAFC',
    opacity: 0.85,
  },
  unconfiguredRoleNoticeText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '500',
  },
});

export default StaffFormModal;
