import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import StatusPill from '../../components/StatusPill';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { SYS_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getStaffAccounts, createStaffAccount, updateStaffAccount, deleteStaffAccount, resetStaffPassword, toggleStaffActive, bulkStaffAction } from '../../api/SystemAdminApi';
import { getDirectorSchedule, saveAssignment } from '../../api/directorApi';
import { studentsApi } from '../../api/resources/students';
import { useToast } from '../../context/ToastContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SystemAdminStackParamList } from '../../types';

const ROLE_OPTIONS = ['Teacher', 'Coordinator', 'Director', 'Program Director', 'Institutional Admin', 'System Admin'];

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
  roles: string[];
  active: boolean;
};

interface StaffFormModalProps {
  visible: boolean;
  staff: StaffMember | null | undefined;
  onClose: () => void;
  onSave: (payload: StaffPayload) => void;
}

function StaffFormModal({ visible, staff, onClose, onSave }: StaffFormModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    if (staff) { setName(staff.name); setEmail(staff.email); setPhone(staff.phone || ''); setRoles(staff.roles); }
    else { setName(''); setEmail(''); setPhone(''); setRoles([]); }
  }, [staff, visible]);

  const toggleRole = (r: string) => setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const handleSave = () => {
    if (!name.trim() || !email.trim()) { Alert.alert('Name and email required'); return; }
    onSave({ id: staff?.id, name, email, phone, roles, active: staff?.active ?? true });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h2}>{staff ? 'Edit Staff' : 'Add Staff'}</Text>
          <ScrollView contentContainerStyle={{ gap: spacing.md }}>
            <View style={styles.field}><Text style={typography.label}>Name</Text><TextInput style={styles.textInput} value={name} onChangeText={setName} /></View>
            <View style={styles.field}><Text style={typography.label}>Email</Text><TextInput style={styles.textInput} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /></View>
            <View style={styles.field}><Text style={typography.label}>Phone</Text><TextInput style={styles.textInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" /></View>
            <View style={styles.field}>
              <Text style={typography.label}>Roles</Text>
              <View style={styles.chipRow}>
                {ROLE_OPTIONS.map((r) => (
                  <TouchableOpacity key={r} style={[styles.chip, roles.includes(r) && styles.chipSelected]} onPress={() => toggleRole(r)}>
                    <Text style={[styles.chipText, roles.includes(r) && styles.chipTextSelected]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Save Changes</Text></TouchableOpacity>
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
        }))
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
      const mapped = data.map((b: any) => {
        const parsedStation: LinkStation = b.stationName.includes('Station 2') ? '2' : '1';
        return {
          teacherId: teacher.id,
          teacherName: teacher.name,
          station: parsedStation,
          room: (b.id === 'b1' ? 1 : 2) as LinkRoom,
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
    (a) => a.teacherId === teacher.id && a.station === station && a.room === room
  );
  const assignedStudentIds = currentAssignment?.students ?? [];

  const groups = Array.from(new Set((students ?? []).map((s) => s.group)));
  let availableStudents = (students ?? []).filter(
    (s) => !assignedStudentIds.includes(s.id)
  );
  if (groupFilter !== 'all') availableStudents = availableStudents.filter((s) => s.group === groupFilter);
  if (programFilter !== 'all') availableStudents = availableStudents.filter((s) => s.program === programFilter);

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
    const blockId = room === 1 ? 'b1' : 'b2';

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
    const blockId = room === 1 ? 'b1' : 'b2';

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
    <View style={styles.linkingCard}>
      <View style={styles.linkingHeader}>
        <View style={{ flex: 1 }}>
          <Text style={typography.h2}>Teacher-Student Linking</Text>
          <Text style={typography.caption}>{teacher.name} — assign students to a station &amp; room (max {TEACHER_CAPACITY} per room).</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onClose}><Feather name="x" size={14} color={colors.navyText} /></TouchableOpacity>
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
              <Text style={[styles.selectorBtnText, station === s && styles.selectorBtnTextActive]}>
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
              <Text style={[styles.selectorBtnText, room === r && styles.selectorBtnRoomTextActive]}>{r}</Text>
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {['all', ...groups].map((g) => (
              <TouchableOpacity key={g} style={[styles.filterChip, groupFilter === g && styles.filterChipActive]} onPress={() => setGroupFilter(g)}>
                <Text style={[styles.filterChipText, groupFilter === g && styles.filterChipTextActive]}>{g === 'all' ? 'All Groups' : g}</Text>
              </TouchableOpacity>
            ))}
            {['all', 'regular', 'pooled-out'].map((p) => (
              <TouchableOpacity key={`p-${p}`} style={[styles.filterChip, programFilter === p && styles.filterChipActive]} onPress={() => setProgramFilter(p)}>
                <Text style={[styles.filterChipText, programFilter === p && styles.filterChipTextActive]}>{p === 'all' ? 'All Programs' : p === 'regular' ? 'Regular' : 'Pooled Out'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.panelList}>
            {availableStudents.length === 0 ? (
              <Text style={styles.emptyText}>No available students</Text>
            ) : (
              availableStudents.map((s) => {
                const selected = selectedForAssign.includes(s.id);
                const disabled = !canAssignMore && !selected;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.checkRow, selected && styles.checkRowAvailableSelected, disabled && styles.checkRowDisabled]}
                    onPress={() => handleStudentToggle(s.id, true)}
                    disabled={disabled}
                  >
                    <Feather name={selected ? 'check-square' : 'square'} size={16} color={selected ? colors.statusInProgressText : colors.mutedText} />
                    <View style={{ flex: 1 }}>
                      <Text style={typography.body}>{s.name}</Text>
                      <Text style={typography.caption}>{s.group} • {s.program === 'pooled-out' ? 'Pooled Out' : 'Regular'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, selectedForAssign.length > 0 && styles.primaryBtnActive]}
            onPress={handleAssign}
            disabled={selectedForAssign.length === 0}
          >
            <Text style={[styles.primaryBtnText, selectedForAssign.length > 0 && styles.primaryBtnTextActive]}>Assign Selected</Text>
          </TouchableOpacity>
          {!canAssignMore && (
            <Text style={styles.warnText}>Maximum 2 students per teacher for this room</Text>
          )}
        </View>

        {/* Assigned Students Panel */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={typography.bodyBold}>Assigned Students</Text>
            <Text style={typography.caption}>{assignedStudentIds.length}/{TEACHER_CAPACITY}</Text>
          </View>

          <View style={[styles.panelList, styles.panelListAssigned]}>
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
                    style={[styles.checkRow, styles.assignedRow, selected ? styles.checkRowRemoveSelected : styles.checkRowAssigned]}
                    onPress={() => handleStudentToggle(s.id, false)}
                  >
                    <Feather name={selected ? 'check-square' : 'square'} size={16} color={selected ? colors.statusRevisionText : colors.statusInProgressText} />
                    <View style={{ flex: 1 }}>
                      <Text style={typography.body}>{s.name}</Text>
                      <Text style={typography.caption}>{s.group} • {s.program === 'pooled-out' ? 'Pooled Out' : 'Regular'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <TouchableOpacity
            style={[styles.removeBtn, selectedForRemove.length > 0 && styles.removeBtnActive]}
            onPress={handleRemove}
            disabled={selectedForRemove.length === 0}
          >
            <Text style={[styles.removeBtnText, selectedForRemove.length > 0 && styles.removeBtnTextActive]}>Remove Selected</Text>
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
            const names = a.students.map((id) => (students ?? []).find((x) => x.id === id)?.name).filter(Boolean);
            return (
              <View key={`${a.station}|${a.room}`} style={styles.summaryRow}>
                <Text style={typography.bodyBold}>Station {a.station} · Room {a.room}</Text>
                <Text style={typography.caption}>{names.length ? names.join(' · ') : '—'}</Text>
              </View>
            );
          })
        )}
      </View>

      {/* Remove Confirmation Modal */}
      <Modal visible={showRemoveConfirm} transparent animationType="fade" onRequestClose={() => setShowRemoveConfirm(false)}>
        <View style={styles.overlay}>
          <View style={[styles.modalSheet, styles.confirmModal]}>
            <Text style={typography.h2}>Remove Students?</Text>
            <Text style={typography.body}>
              Remove {selectedForRemove.map((id) => (students ?? []).find((s) => s.id === id)?.name).filter(Boolean).join(', ')} from this assignment?
            </Text>
            <Text style={typography.caption}>Historical session data will be kept.</Text>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRemoveConfirm(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, styles.confirmRemoveBtn]} onPress={handleRemoveConfirm}><Text style={styles.confirmRemoveBtnText}>Remove</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function StaffAccountManagementScreen({ navigation }: NativeStackScreenProps<SystemAdminStackParamList, 'StaffAccountManagement'>) {
  const { showToast } = useToast();
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formTarget, setFormTarget] = useState<StaffMember | null | undefined>(undefined);
  const [linkTarget, setLinkTarget] = useState<StaffMember | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getStaffAccounts({ search, role: roleFilter, status: statusFilter });
      setStaff(data);
    } catch (err) {
      setStaff([]);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = (staff ?? []).filter(
    (s) =>
      (roleFilter === 'All' || s.roles.includes(roleFilter)) &&
      (statusFilter === 'All' || (statusFilter === 'Active') === s.active) &&
      (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelect = (id: string) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

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
    } catch (err) {
      showToast('Failed to save staff account', 'error');
    }
    setFormTarget(undefined);
  };

  const handleResetPassword = (s: StaffMember) => {
    Alert.alert('Send password reset email?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: async () => { try { await resetStaffPassword(s.id); } catch (err) {} showToast('Reset email sent successfully', 'success'); } },
    ]);
  };

  const handleToggleActive = async (s: StaffMember) => {
    const next = !s.active;
    try {
      await toggleStaffActive(s.id, next);
      showToast(`Account ${next ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (err) {}
    load();
  };

  const handleDelete = (s: StaffMember) => {
    Alert.alert('Delete staff account?', `${s.name} (${s.email}) will be permanently removed. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteStaffAccount(s.id); showToast('Staff account deleted successfully', 'success'); } catch (err) { showToast('Failed to delete staff account', 'error'); }
          load();
        },
      },
    ]);
  };

  const handleBulkAction = (action: string) => {
    Alert.alert(`${action} ${selectedIds.length} accounts?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try { await bulkStaffAction(selectedIds, action); showToast(`Bulk ${action.toLowerCase()} completed successfully`, 'success'); } catch (err) { showToast(`Bulk ${action.toLowerCase()} failed`, 'error'); }
          setSelectedIds([]);
          load();
        },
      },
    ]);
  };

  if (staff === null) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Staff Accounts" onTabPress={(t) => navigation?.navigate?.(SYS_ROUTE_BY_TAB[t])} />
      <View style={styles.header}>
        <Text style={typography.h1}>Staff Account Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setFormTarget(null)}>
          <Feather name="plus" size={14} color={colors.navyText} />
          <Text style={styles.addBtnText}>Add Staff</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersRow}>
        <TextInput style={styles.searchInput} placeholder="Search by name or email..." placeholderTextColor={colors.mutedText} value={search} onChangeText={setSearch} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['All', ...ROLE_OPTIONS].map((r) => (
            <TouchableOpacity key={r} style={[styles.filterChip, roleFilter === r && styles.filterChipActive]} onPress={() => setRoleFilter(r)}>
              <Text style={typography.body}>{r}</Text>
            </TouchableOpacity>
          ))}
          {['All', 'Active', 'Inactive'].map((s) => (
            <TouchableOpacity key={s} style={[styles.filterChip, statusFilter === s && styles.filterChipActive]} onPress={() => setStatusFilter(s)}>
              <Text style={typography.body}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedIds.length > 0 && (
        <View style={styles.bulkRow}>
          <Text style={typography.caption}>{selectedIds.length} selected</Text>
          <TouchableOpacity style={styles.bulkBtn} onPress={() => handleBulkAction('Deactivate')}><Text style={styles.bulkBtnText}>Deactivate</Text></TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.map((s) => (
          <View key={s.id} style={styles.row}>
            <TouchableOpacity onPress={() => toggleSelect(s.id)} style={styles.checkbox}>
              <View style={[styles.checkboxInner, selectedIds.includes(s.id) && styles.checkboxChecked]} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{s.name}</Text>
              <Text style={typography.caption}>{s.email} · {s.roles.join(', ')}</Text>
            </View>
            <StatusPill status={s.active ? 'approved' : 'revision'} label={s.active ? 'Active' : 'Inactive'} />
            <View style={styles.rowActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setFormTarget(s)}><Feather name="edit-2" size={14} color={colors.navyText} /></TouchableOpacity>
              {s.roles.includes('Teacher') && (
                <TouchableOpacity style={[styles.iconBtn, linkTarget?.id === s.id && styles.iconBtnActive]} onPress={() => setLinkTarget(linkTarget?.id === s.id ? null : s)}>
                  <Feather name="link-2" size={14} color={colors.navyText} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleResetPassword(s)}><Feather name="key" size={14} color={colors.navyText} /></TouchableOpacity>
              
              {/* Toggle switch icon: Green (Active/On) vs Red (Inactive/Off) */}
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleToggleActive(s)}>
                <Feather 
                  name={s.active ? 'toggle-right' : 'toggle-left'} 
                  size={18} 
                  color={s.active ? '#10B981' : '#EF4444'} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(s)}><Feather name="trash-2" size={14} color={colors.statusRevisionText} /></TouchableOpacity>
            </View>
          </View>
        ))}
        {linkTarget && <TeacherLinkingPanel teacher={linkTarget} onClose={() => setLinkTarget(null)} />}
      </ScrollView>

      <StaffFormModal visible={formTarget !== undefined} staff={formTarget} onClose={() => setFormTarget(undefined)} onSave={handleSave} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  addBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  addBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  filtersRow: { padding: spacing.md, gap: spacing.sm, backgroundColor: colors.bgCard },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.bgApp },
  filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs },
  filterChipActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  filterChipText: { fontSize: 11, fontWeight: '600', color: colors.bodyText },
  filterChipTextActive: { fontSize: 11, fontWeight: '700', color: colors.navyText },
  bulkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.statusPendingBg },
  bulkBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  bulkBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  checkbox: { padding: spacing.xs },
  checkboxInner: { width: 18, height: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 4 },
  checkboxChecked: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  rowActions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: { width: 30, height: 30, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  iconBtnActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  linkingCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.primaryYellow, gap: spacing.md, marginTop: spacing.sm },
  linkingHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  field: { gap: spacing.xs },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.bgApp },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, color: colors.bodyText },
  chipTextSelected: { fontWeight: '700', color: colors.navyText },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  cancelBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  cancelBtnText: { color: colors.bodyText, fontWeight: '600' },
  saveBtn: { backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  saveBtnText: { color: colors.navyText, fontWeight: '700' },
  selectorRow: { flexDirection: 'row', gap: spacing.sm },
  selectorBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', backgroundColor: colors.bgApp },
  selectorBtnText: { fontWeight: '600', color: colors.bodyText },
  selectorBtnStationActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  selectorBtnRoomActive: { backgroundColor: colors.statusInProgressText, borderColor: colors.statusInProgressText },
  selectorBtnTextActive: { fontWeight: '700', color: colors.navyText },
  selectorBtnRoomTextActive: { fontWeight: '700', color: colors.white },
  linkingRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'stretch' },
  panel: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, backgroundColor: colors.bgApp },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterRow: { gap: spacing.xs },
  panelList: { gap: spacing.xs, maxHeight: 260 },
  panelListAssigned: { minHeight: 160, backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.xs },
  emptyText: { textAlign: 'center', color: colors.mutedText, paddingVertical: spacing.xl, fontSize: 13 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, backgroundColor: colors.bgCard },
  checkRowAvailableSelected: { borderColor: colors.statusInProgressText, backgroundColor: colors.statusInProgressBg },
  checkRowAssigned: { borderColor: colors.statusInProgressText, backgroundColor: colors.statusInProgressBg },
  checkRowRemoveSelected: { borderColor: colors.statusRevisionText, backgroundColor: colors.statusRevisionBg },
  assignedRow: { borderWidth: 2 },
  checkRowDisabled: { opacity: 0.5 },
  primaryBtn: { alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  primaryBtnActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  primaryBtnText: { fontWeight: '600', color: colors.mutedText },
  primaryBtnTextActive: { fontWeight: '700', color: colors.navyText },
  warnText: { textAlign: 'center', fontSize: 11, color: '#EA580C', marginTop: spacing.xs },
  removeBtn: { alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  removeBtnActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  removeBtnText: { fontWeight: '600', color: colors.mutedText },
  removeBtnTextActive: { fontWeight: '700', color: colors.white },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyStateText: { color: colors.mutedText, fontSize: 13 },
  confirmModal: { maxWidth: 420, width: '100%', alignSelf: 'center' },
  confirmRemoveBtn: { backgroundColor: '#DC2626' },
  confirmRemoveBtnText: { fontWeight: '700', color: colors.white },
  summaryRow: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, gap: spacing.xs },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
});