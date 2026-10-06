import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import StatusPill from '../../components/StatusPill';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { SYS_ROUTE_BY_TAB } from '../../components/appNavConfig';
import {
  getStaffAccounts,
  createStaffAccount,
  updateStaffAccount,
  deleteStaffAccount,
  resetStaffPassword,
  toggleStaffActive,
  bulkStaffAction,
  getRoles,
} from '../../api/SystemAdminApi';
import { getDirectorSchedule, saveAssignment } from '../../api/directorApi';
import { studentsApi } from '../../api/resources/students';
import { useToast } from '../../context/ToastContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SystemAdminStackParamList } from '../../types';

const ROLE_OPTIONS = [
  'Teacher',
  'Therapist',
  'Coordinator',
  'Director',
  'Program Director',
  'Institutional Admin',
  'System Admin',
];

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
  active: boolean;
}

// SCR-008: Teacher-Student Linking
type LinkStation = '1' | '2';
type LinkRoom = 1 | 2 | 3 | 4;

const LINK_ROOMS = [1, 2, 3, 4] as const;
const TEACHER_CAPACITY = 2;

interface LinkStudent {
  id: string;
  name: string;
  group: string;
  program: 'regular' | 'pooled-out';
}

interface TeacherLinkAssignment {
  teacherId: string;
  teacherName: string;
  station: LinkStation;
  room: LinkRoom;
  students: string[];
}

type StaffPayload = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  roles: string[];
  active: boolean;
};

interface RoleMeta {
  has_permissions?: boolean;
  permission_count?: number;
}

interface StaffFormModalProps {
  visible: boolean;
  staff: StaffMember | null | undefined;
  roleOptions?: string[];
  roleMetaMap?: Record<string, RoleMeta>;
  onClose: () => void;
  onSave: (payload: StaffPayload) => void;
}

function StaffFormModal({
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
                                <Feather name="alert-circle" size={10} color="#DC2626" />
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

interface ResetPasswordModalProps {
  visible: boolean;
  staff: StaffMember | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ResetPasswordModal({ visible, staff, onClose, onSuccess }: ResetPasswordModalProps) {
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
    } catch (err) {
      showToast('Failed to update password', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalSheet, { maxWidth: 440, width: '100%', alignSelf: 'center' }]}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.xs,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.md,
                backgroundColor: '#FEF3C7',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
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

          <View
            style={{
              backgroundColor: colors.bgApp,
              padding: spacing.md,
              borderRadius: radius.md,
              gap: 4,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
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
              <Text style={{ fontWeight: '600', color: staff.active ? '#16A34A' : '#DC2626' }}>
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

interface TeacherLinkingPanelProps {
  teacher: StaffMember;
  onClose: () => void;
}

function TeacherLinkingPanel({ teacher, onClose }: TeacherLinkingPanelProps) {
  const { showToast } = useToast();
  const [station, setStation] = useState<LinkStation>('1');
  const [room, setRoom] = useState<LinkRoom>(1);
  const [assignments, setAssignments] = useState<TeacherLinkAssignment[]>([]);
  const [students, setStudents] = useState<LinkStudent[] | null>(null);
  const [selectedForAssign, setSelectedForAssign] = useState<string[]>([]);
  const [selectedForRemove, setSelectedForRemove] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const loadStudents = useCallback(async () => {
    try {
      const res = await studentsApi.list();
      setStudents(
        res.map((s) => ({
          id: s.id,
          name: s.fullName,
          group: s.therapyGroup,
          program: (s.programType === 'ABA' ? 'regular' : 'pooled-out') as LinkStudent['program'],
        })),
      );
    } catch (err) {
      setStudents([]);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const loadAssignments = useCallback(async () => {
    try {
      const { data } = await getDirectorSchedule({ teacherId: teacher.id });
      const mapped = data
        .filter((b: any) => (b.studentIds || []).length > 0)
        .map((b: any) => {
          const match = String(b.id).match(/^b(\d)_(\d)$/);
          let s = '1';
          let r = 1;
          if (match) {
            s = match[1];
            r = parseInt(match[2], 10);
          } else {
            s = b.stationName.includes('Station 2') ? '2' : '1';
            r = b.id === 'b1' ? 1 : 2;
          }
          return {
            teacherId: teacher.id,
            teacherName: teacher.name,
            station: s as LinkStation,
            room: r as LinkRoom,
            students: b.studentIds || [],
          };
        });
      setAssignments(mapped);
    } catch (err) {
      console.warn('Failed to load assignments:', err);
    }
  }, [teacher.id, teacher.name]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const currentAssignment = assignments.find(
    (a) => a.teacherId === teacher.id && a.station === station && a.room === room,
  );
  const assignedStudentIds = currentAssignment?.students ?? [];

  const groups = Array.from(new Set((students ?? []).map((s) => s.group)));
  let availableStudents = (students ?? []).filter((s) => !assignedStudentIds.includes(s.id));
  if (groupFilter !== 'all')
    availableStudents = availableStudents.filter((s) => s.group === groupFilter);
  if (programFilter !== 'all')
    availableStudents = availableStudents.filter((s) => s.program === programFilter);

  const canAssignMore = assignedStudentIds.length < TEACHER_CAPACITY;

  const switchContext = (fn: () => void) => {
    setSelectedForAssign([]);
    setSelectedForRemove([]);
    fn();
  };

  const handleStudentToggle = (studentId: string, isForAssign: boolean) => {
    if (isForAssign) {
      if (selectedForAssign.includes(studentId)) {
        setSelectedForAssign((prev) => prev.filter((id) => id !== studentId));
      } else {
        if (selectedForAssign.length + assignedStudentIds.length >= TEACHER_CAPACITY) return;
        setSelectedForAssign((prev) => [...prev, studentId]);
      }
    } else {
      if (selectedForRemove.includes(studentId)) {
        setSelectedForRemove((prev) => prev.filter((id) => id !== studentId));
      } else {
        setSelectedForRemove((prev) => [...prev, studentId]);
      }
    }
  };

  const handleAssign = async () => {
    if (!selectedForAssign.length) return;

    const newStudents = [...assignedStudentIds, ...selectedForAssign];
    const blockId = 'b' + station + '_' + room;

    try {
      await saveAssignment({ blockId, studentIds: newStudents, teacherId: teacher.id });
      await loadAssignments();
      showToast('Students assigned successfully', 'success');
    } catch (err) {
      console.warn('Failed to save assignment:', err);
      showToast('Failed to assign students', 'error');
    }

    setSelectedForAssign([]);
  };

  const handleRemove = () => {
    if (!selectedForRemove.length) {
      showToast('Please select students to remove', 'info');
      return;
    }
    setShowRemoveConfirm(true);
  };

  const handleRemoveConfirm = async () => {
    if (!selectedForRemove.length) return;

    const remainingStudents = assignedStudentIds.filter((id) => !selectedForRemove.includes(id));
    const blockId = 'b' + station + '_' + room;

    try {
      await saveAssignment({ blockId, studentIds: remainingStudents, teacherId: teacher.id });
      await loadAssignments();
      showToast('Students removed successfully', 'success');
    } catch (err) {
      console.warn('Failed to remove assignment:', err);
      showToast('Failed to remove students', 'error');
    }

    setSelectedForRemove([]);
    setShowRemoveConfirm(false);
  };

  const teacherAssignments = assignments.filter((a) => a.teacherId === teacher.id);

  if (students === null) return <ScreenLoader />;

  return (
    <Modal visible={true} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalSheet, { maxHeight: '90%', flex: 1, padding: 0 }]}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            <View style={styles.linkingHeader}>
              <View style={{ flex: 1 }}>
                <Text style={typography.h2}>Teacher-Student Linking</Text>
                <Text style={typography.caption}>
                  {teacher.name} — assign students to a station &amp; room (max {TEACHER_CAPACITY}{' '}
                  per room).
                </Text>
              </View>
              <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
                <Feather name="x" size={14} color={colors.navyText} />
              </TouchableOpacity>
            </View>

            {/* Station & Room Selection */}
            <View style={styles.field}>
              <Text style={typography.label}>Station</Text>
              <View style={styles.selectorRow}>
                {(['1', '2'] as LinkStation[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.selectorBtn, station === s && styles.selectorBtnStationActive]}
                    onPress={() => switchContext(() => setStation(s))}
                  >
                    <Text
                      style={[
                        styles.selectorBtnText,
                        station === s && styles.selectorBtnTextActive,
                      ]}
                    >
                      Station {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={typography.label}>Room</Text>
              <View style={styles.selectorRow}>
                {LINK_ROOMS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.selectorBtn, room === r && styles.selectorBtnRoomActive]}
                    onPress={() => switchContext(() => setRoom(r))}
                  >
                    <Text
                      style={[
                        styles.selectorBtnText,
                        room === r && styles.selectorBtnRoomTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Two-Panel Layout */}
            <View style={styles.linkingRow}>
              {/* Available Students Panel */}
              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Text style={typography.bodyBold}>Available Students</Text>
                  <Text style={typography.caption}>{selectedForAssign.length} selected</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {['all', ...groups].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.filterChip, groupFilter === g && styles.filterChipActive]}
                      onPress={() => setGroupFilter(g)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          groupFilter === g && styles.filterChipTextActive,
                        ]}
                      >
                        {g === 'all' ? 'All Groups' : g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {['all', 'regular', 'pooled-out'].map((p) => (
                    <TouchableOpacity
                      key={`p-${p}`}
                      style={[styles.filterChip, programFilter === p && styles.filterChipActive]}
                      onPress={() => setProgramFilter(p)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          programFilter === p && styles.filterChipTextActive,
                        ]}
                      >
                        {p === 'all' ? 'All Programs' : p === 'regular' ? 'Regular' : 'Pooled Out'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <ScrollView style={styles.panelList} nestedScrollEnabled={true}>
                  {availableStudents.length === 0 ? (
                    <Text style={styles.emptyText}>No available students</Text>
                  ) : (
                    availableStudents.map((s) => {
                      const selected = selectedForAssign.includes(s.id);
                      const disabled = !canAssignMore && !selected;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[
                            styles.checkRow,
                            selected && styles.checkRowAvailableSelected,
                            disabled && styles.checkRowDisabled,
                          ]}
                          onPress={() => handleStudentToggle(s.id, true)}
                          disabled={disabled}
                        >
                          <Feather
                            name={selected ? 'check-square' : 'square'}
                            size={16}
                            color={selected ? colors.statusInProgressText : colors.mutedText}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={typography.body}>{s.name}</Text>
                            <Text style={typography.caption}>
                              {s.group} • {s.program === 'pooled-out' ? 'Pooled Out' : 'Regular'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    selectedForAssign.length > 0 && styles.primaryBtnActive,
                  ]}
                  onPress={handleAssign}
                  disabled={selectedForAssign.length === 0}
                >
                  <Text
                    style={[
                      styles.primaryBtnText,
                      selectedForAssign.length > 0 && styles.primaryBtnTextActive,
                    ]}
                  >
                    Assign Selected
                  </Text>
                </TouchableOpacity>
                {!canAssignMore && (
                  <Text style={styles.warnText}>Maximum 2 students per teacher for this room</Text>
                )}
              </View>

              {/* Assigned Students Panel */}
              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Text style={typography.bodyBold}>Assigned Students</Text>
                  <Text style={typography.caption}>
                    {assignedStudentIds.length}/{TEACHER_CAPACITY}
                  </Text>
                </View>

                <ScrollView
                  style={[styles.panelList, styles.panelListAssigned]}
                  nestedScrollEnabled={true}
                >
                  {assignedStudentIds.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Feather name="users" size={40} color={colors.border} />
                      <Text style={styles.emptyStateText}>No students assigned</Text>
                    </View>
                  ) : (
                    assignedStudentIds.map((id) => {
                      const s = (students ?? []).find((x) => x.id === id);
                      if (!s) return null;
                      const selected = selectedForRemove.includes(s.id);
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[
                            styles.checkRow,
                            styles.assignedRow,
                            selected ? styles.checkRowRemoveSelected : styles.checkRowAssigned,
                          ]}
                          onPress={() => handleStudentToggle(s.id, false)}
                        >
                          <Feather
                            name={selected ? 'check-square' : 'square'}
                            size={16}
                            color={
                              selected ? colors.statusRevisionText : colors.statusInProgressText
                            }
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={typography.body}>{s.name}</Text>
                            <Text style={typography.caption}>
                              {s.group} • {s.program === 'pooled-out' ? 'Pooled Out' : 'Regular'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={[styles.removeBtn, selectedForRemove.length > 0 && styles.removeBtnActive]}
                  onPress={handleRemove}
                  disabled={selectedForRemove.length === 0}
                >
                  <Text
                    style={[
                      styles.removeBtnText,
                      selectedForRemove.length > 0 && styles.removeBtnTextActive,
                    ]}
                  >
                    Remove Selected
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* All Assignments Summary */}
            <View style={styles.field}>
              <Text style={typography.label}>All Assignments</Text>
              {teacherAssignments.length === 0 ? (
                <Text style={typography.caption}>No assignments yet for {teacher.name}.</Text>
              ) : (
                teacherAssignments.map((a) => {
                  const names = a.students
                    .map((id) => (students ?? []).find((x) => x.id === id)?.name)
                    .filter(Boolean);
                  return (
                    <View key={`${a.station}|${a.room}`} style={styles.summaryRow}>
                      <Text style={typography.bodyBold}>
                        Station {a.station} · Room {a.room}
                      </Text>
                      <Text style={typography.caption}>
                        {names.length ? names.join(' · ') : '—'}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>

            {/* Remove Confirmation Modal */}
            <Modal
              visible={showRemoveConfirm}
              transparent
              animationType="fade"
              onRequestClose={() => setShowRemoveConfirm(false)}
            >
              <View style={styles.overlay}>
                <View style={[styles.modalSheet, styles.confirmModal]}>
                  <Text style={typography.h2}>Remove Students?</Text>
                  <Text style={typography.body}>
                    Remove{' '}
                    {selectedForRemove
                      .map((id) => (students ?? []).find((s) => s.id === id)?.name)
                      .filter(Boolean)
                      .join(', ')}{' '}
                    from this assignment?
                  </Text>
                  <Text style={typography.caption}>Historical session data will be kept.</Text>
                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setShowRemoveConfirm(false)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveBtn, styles.confirmRemoveBtn]}
                      onPress={handleRemoveConfirm}
                    >
                      <Text style={styles.confirmRemoveBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Main Modal Footer */}
            <View style={[styles.modalFooter, { marginTop: 16 }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={async () => {
                  if (selectedForAssign.length > 0) await handleAssign();
                  if (selectedForRemove.length > 0) await handleRemoveConfirm();
                  onClose();
                }}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function StaffAccountManagementScreen({
  navigation,
}: NativeStackScreenProps<SystemAdminStackParamList, 'StaffAccountManagement'>) {
  const { showToast } = useToast();
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>(ROLE_OPTIONS);
  const [roleMetaMap, setRoleMetaMap] = useState<Record<string, RoleMeta>>({});
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [roleFilterOpen, setRoleFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formTarget, setFormTarget] = useState<StaffMember | null | undefined>(undefined);
  const [credentialTarget, setCredentialTarget] = useState<StaffMember | null>(null);
  const [linkTarget, setLinkTarget] = useState<StaffMember | null>(null);

  const loadRoles = useCallback(async () => {
    try {
      const { data } = await getRoles();
      if (Array.isArray(data) && data.length > 0) {
        const names = data.map((r: any) => r.name).filter(Boolean);
        const uniqueNames = Array.from(new Set([...ROLE_OPTIONS, ...names]));
        setAvailableRoles(uniqueNames);
        const metaMap: Record<string, RoleMeta> = {};
        data.forEach((r: any) => {
          if (r.name) {
            metaMap[r.name] = {
              has_permissions: r.has_permissions ?? r.permission_count > 0,
              permission_count: r.permission_count ?? 0,
            };
          }
        });
        setRoleMetaMap(metaMap);
      }
    } catch (err) {
      console.warn('Failed to fetch dynamic roles:', err);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const { data } = await getStaffAccounts({ search, role: roleFilter, status: statusFilter });
      setStaff(data);
    } catch (err) {
      setStaff([]);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    loadRoles();
    load();
  }, [loadRoles, load]);

  const filtered = (staff ?? []).filter(
    (s) =>
      (roleFilter === 'All' || s.roles.includes(roleFilter)) &&
      (statusFilter === 'All' || (statusFilter === 'Active') === s.active) &&
      (!search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())),
  );

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSave = async (payload: StaffPayload) => {
    try {
      if (payload.id) {
        await updateStaffAccount(payload.id, payload);
        showToast('Staff account updated successfully', 'success');
      } else {
        await createStaffAccount(payload);
        showToast('Staff account created successfully', 'success');
      }
      await load();
      setFormTarget(undefined);
    } catch (err: any) {
      console.error('Failed to save staff account:', err);
      const errMsg =
        err?.response?.data?.error ||
        (Array.isArray(err?.response?.data?.errors)
          ? err.response.data.errors.join(', ')
          : err?.response?.data?.errors) ||
        err?.message ||
        'Failed to save staff account';
      Alert.alert('Role Assignment / Account Error', errMsg);
      showToast(errMsg, 'error');
    }
  };

  const handleToggleActive = async (s: StaffMember) => {
    const next = !s.active;
    // Optimistic UI update
    setStaff((prev) =>
      prev ? prev.map((item) => (item.id === s.id ? { ...item, active: next } : item)) : prev,
    );
    try {
      await toggleStaffActive(s.id, next);
      showToast(`Account ${next ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
    await load();
  };

  const handleDelete = (s: StaffMember) => {
    Alert.alert(
      'Delete staff account?',
      `${s.name} (${s.email}) will be permanently removed. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStaffAccount(s.id);
              showToast('Staff account deleted successfully', 'success');
            } catch (err) {
              showToast('Failed to delete staff account', 'error');
            }
            load();
          },
        },
      ],
    );
  };

  const handleBulkAction = (action: string) => {
    Alert.alert(`${action} ${selectedIds.length} accounts?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await bulkStaffAction(selectedIds, action);
            showToast(`Bulk ${action.toLowerCase()} completed successfully`, 'success');
          } catch (err) {
            showToast(`Bulk ${action.toLowerCase()} failed`, 'error');
          }
          setSelectedIds([]);
          load();
        },
      },
    ]);
  };

  if (staff === null) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Staff Accounts"
        onTabPress={(t) => navigation?.navigate?.(SYS_ROUTE_BY_TAB[t])}
      />
      <View style={styles.header}>
        <Text style={typography.h1}>Staff Account Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setFormTarget(null)}>
          <Feather name="plus" size={14} color={colors.navyText} />
          <Text style={styles.addBtnText}>Add Staff</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.filtersRow, { zIndex: 100 }]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor={colors.mutedText}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
        />

        <View style={styles.filterControlsRow}>
          {/* Role Filter Dropdown */}
          <View style={styles.filterDropdownContainer}>
            <TouchableOpacity
              style={[
                styles.filterDropdownTrigger,
                roleFilter !== 'All' && styles.filterDropdownTriggerActive,
              ]}
              onPress={() => setRoleFilterOpen((v) => !v)}
              accessibilityRole="combobox"
              accessibilityLabel="Filter by role"
            >
              <Feather
                name="shield"
                size={14}
                color={roleFilter !== 'All' ? colors.navyText : colors.mutedText}
              />
              <Text
                style={[
                  styles.filterDropdownTriggerText,
                  roleFilter !== 'All' && styles.filterDropdownTriggerTextActive,
                ]}
              >
                {roleFilter === 'All' ? 'Role: All' : `Role: ${roleFilter}`}
              </Text>
              <Feather
                name={roleFilterOpen ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.navyText}
              />
            </TouchableOpacity>

            {roleFilterOpen && (
              <View style={styles.filterDropdownMenu}>
                <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                  {['All', ...availableRoles].map((r) => {
                    const isSelected = roleFilter === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.filterDropdownItem,
                          isSelected && styles.filterDropdownItemActive,
                        ]}
                        onPress={() => {
                          setRoleFilter(r);
                          setRoleFilterOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterDropdownItemText,
                            isSelected && styles.filterDropdownItemTextActive,
                          ]}
                        >
                          {r === 'All' ? 'All Roles' : r}
                        </Text>
                        {isSelected && <Feather name="check" size={14} color={colors.navyText} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Status Filter */}
          <View style={styles.statusChipsContainer}>
            <Text style={styles.filterLabel}>Status:</Text>
            {['All', 'Active', 'Inactive'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
                onPress={() => setStatusFilter(s)}
              >
                <Text
                  style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {selectedIds.length > 0 && (
        <View style={styles.bulkRow}>
          <Text style={typography.caption}>{selectedIds.length} selected</Text>
          <TouchableOpacity style={styles.bulkBtn} onPress={() => handleBulkAction('Deactivate')}>
            <Text style={styles.bulkBtnText}>Deactivate</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.map((s) => (
          <View key={s.id} style={styles.row}>
            <TouchableOpacity onPress={() => toggleSelect(s.id)} style={styles.checkbox}>
              <View
                style={[styles.checkboxInner, selectedIds.includes(s.id) && styles.checkboxChecked]}
              />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{s.name}</Text>
              <Text style={typography.caption}>
                {s.email} · {s.roles.join(', ')}
              </Text>
            </View>
            <StatusPill
              status={s.active ? 'approved' : 'revision'}
              label={s.active ? 'Active' : 'Inactive'}
            />
            <View style={styles.rowActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                accessibilityLabel="Edit staff member"
                onPress={() => setFormTarget(s)}
              >
                <Feather name="edit-2" size={14} color={colors.navyText} />
              </TouchableOpacity>
              {(s.roles.includes('Teacher') || s.roles.includes('Therapist')) && (
                <TouchableOpacity
                  style={[styles.iconBtn, linkTarget?.id === s.id && styles.iconBtnActive]}
                  accessibilityLabel="Link teacher or therapist to students"
                  onPress={() => setLinkTarget(linkTarget?.id === s.id ? null : s)}
                >
                  <Feather name="link-2" size={14} color={colors.navyText} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.iconBtn}
                accessibilityLabel="Manage credentials and password"
                onPress={() => setCredentialTarget(s)}
              >
                <Ionicons name="key" size={14} color="#D97706" />
              </TouchableOpacity>

              {/* Toggle switch icon: Green (Active/On) vs Red (Inactive/Off) */}
              <TouchableOpacity
                style={styles.iconBtn}
                accessibilityLabel="Toggle active status"
                onPress={() => handleToggleActive(s)}
              >
                <Feather
                  name={s.active ? 'toggle-right' : 'toggle-left'}
                  size={18}
                  color={s.active ? '#10B981' : '#EF4444'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconBtn}
                accessibilityLabel="Delete staff account"
                onPress={() => handleDelete(s)}
              >
                <Feather name="trash-2" size={14} color={colors.statusRevisionText} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {linkTarget && (
          <TeacherLinkingPanel teacher={linkTarget} onClose={() => setLinkTarget(null)} />
        )}
      </ScrollView>

      <StaffFormModal
        visible={formTarget !== undefined}
        staff={formTarget}
        roleOptions={availableRoles}
        roleMetaMap={roleMetaMap}
        onClose={() => setFormTarget(undefined)}
        onSave={handleSave}
      />

      <ResetPasswordModal
        visible={credentialTarget !== null}
        staff={credentialTarget}
        onClose={() => setCredentialTarget(null)}
        onSuccess={load}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addBtn: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  filtersRow: { padding: spacing.md, gap: spacing.sm, backgroundColor: colors.bgCard },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  filterChipActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  filterChipText: { fontSize: 11, fontWeight: '600', color: colors.bodyText },
  filterChipTextActive: { fontSize: 11, fontWeight: '700', color: colors.navyText },
  bulkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.statusPendingBg,
  },
  bulkBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  bulkBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  content: { padding: spacing.lg, gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkbox: { padding: spacing.xs },
  checkboxInner: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
  },
  checkboxChecked: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  rowActions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  linkingCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryYellow,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  linkingHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  field: { gap: spacing.xs },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  passwordEyeBtn: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldHintText: { fontSize: 11, color: colors.mutedText, marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, color: colors.bodyText },
  chipTextSelected: { fontWeight: '700', color: colors.navyText },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
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
  selectorRow: { flexDirection: 'row', gap: spacing.sm },
  selectorBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.bgApp,
  },
  selectorBtnText: { fontWeight: '600', color: colors.bodyText },
  selectorBtnStationActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  selectorBtnRoomActive: {
    backgroundColor: colors.statusInProgressText,
    borderColor: colors.statusInProgressText,
  },
  selectorBtnTextActive: { fontWeight: '700', color: colors.navyText },
  selectorBtnRoomTextActive: { fontWeight: '700', color: colors.white },
  linkingRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'stretch' },
  panel: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.bgApp,
  },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterRow: { gap: spacing.xs },
  panelList: { gap: spacing.xs, maxHeight: 260 },
  panelListAssigned: {
    minHeight: 160,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.mutedText,
    paddingVertical: spacing.xl,
    fontSize: 13,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.bgCard,
  },
  checkRowAvailableSelected: {
    borderColor: colors.statusInProgressText,
    backgroundColor: colors.statusInProgressBg,
  },
  checkRowAssigned: {
    borderColor: colors.statusInProgressText,
    backgroundColor: colors.statusInProgressBg,
  },
  checkRowRemoveSelected: {
    borderColor: colors.statusRevisionText,
    backgroundColor: colors.statusRevisionBg,
  },
  assignedRow: { borderWidth: 2 },
  checkRowDisabled: { opacity: 0.5 },
  primaryBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryBtnActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  primaryBtnText: { fontWeight: '600', color: colors.mutedText },
  primaryBtnTextActive: { fontWeight: '700', color: colors.navyText },
  warnText: { textAlign: 'center', fontSize: 11, color: '#EA580C', marginTop: spacing.xs },
  removeBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  removeBtnActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  removeBtnText: { fontWeight: '600', color: colors.mutedText },
  removeBtnTextActive: { fontWeight: '700', color: colors.white },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyStateText: { color: colors.mutedText, fontSize: 13 },
  confirmModal: { maxWidth: 420, width: '100%', alignSelf: 'center' },
  confirmRemoveBtn: { backgroundColor: '#DC2626' },
  confirmRemoveBtnText: { fontWeight: '700', color: colors.white },
  summaryRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },

  /* Role filter dropdown in list */
  filterControlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    alignItems: 'center',
  },
  filterDropdownContainer: { position: 'relative', zIndex: 200 },
  filterDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgApp,
  },
  filterDropdownTriggerActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  filterDropdownTriggerText: { fontSize: 13, fontWeight: '600', color: colors.bodyText },
  filterDropdownTriggerTextActive: { color: colors.navyText, fontWeight: '700' },
  filterDropdownMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    minWidth: 220,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  filterDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterDropdownItemActive: { backgroundColor: '#FEF9C3' },
  filterDropdownItemText: { fontSize: 13, color: colors.bodyText },
  filterDropdownItemTextActive: { fontWeight: '700', color: colors.navyText },
  statusChipsContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },

  /* Modal role dropdown in staff create/edit */
  formDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.bgApp,
    minHeight: 46,
  },
  formDropdownTriggerOpen: { borderColor: colors.navyText },
  formDropdownSelectedWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    marginRight: spacing.sm,
  },
  placeholderText: { color: colors.mutedText, fontSize: 13 },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  roleTagText: { fontSize: 12, fontWeight: '700', color: colors.navyText },
  formDropdownMenu: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    marginTop: 4,
    overflow: 'hidden',
  },
  formDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  formDropdownOptionSelected: { backgroundColor: '#FEF9C3' },
  formDropdownOptionText: { fontSize: 13, color: colors.bodyText, flex: 1 },
  formDropdownOptionTextSelected: { fontWeight: '700', color: colors.navyText },
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
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgApp,
  },
  formDropdownFooterText: { fontSize: 11, color: colors.mutedText, fontWeight: '600' },
  formDropdownDoneBtn: {
    backgroundColor: colors.navyText,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  formDropdownDoneBtnText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  unconfiguredBadge: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unconfiguredBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },
});
