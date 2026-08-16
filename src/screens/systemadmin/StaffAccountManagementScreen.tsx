// screens/systemadmin/StaffAccountManagementScreen.js
// SCR-SYS-001: Staff Account Management

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import StatusPill from '../../components/StatusPill';
import SystemAdminNav, { SYS_ROUTE_BY_TAB } from './components/SystemAdminNav';
import { getStaffAccounts, createStaffAccount, updateStaffAccount, deleteStaffAccount, resetStaffPassword, toggleStaffActive, bulkStaffAction } from '../../api/systemAdminApi';
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

// SCR-008: Teacher-Student Linking demo data
const LINK_STATIONS = ['Station 1 (Basic Skills)', 'Station 2 (Advanced Skills)'];
const LINK_BLOCKS = [
  'Monday AM (8:07-12:00)',
  'Monday PM (1:10-4:45)',
  'Tuesday AM (8:07-12:00)',
  'Tuesday PM (1:10-4:45)',
  'Wednesday AM (8:07-12:00)',
  'Wednesday PM (1:10-4:45)',
  'Thursday AM (8:07-12:00)',
  'Thursday PM (1:10-4:45)',
  'Friday AM (8:07-12:00)',
  'Friday PM (1:10-4:45)',
];
const STATION_GROUP: Record<string, string> = {
  'Station 1 (Basic Skills)': 'Basic Therapy',
  'Station 2 (Advanced Skills)': 'Functional Living',
};
const TEACHER_CAPACITY = 2;

interface LinkStudent {
  id: string;
  name: string;
  group: string;
}

const LINK_STUDENTS: LinkStudent[] = [
  { id: 'student-a', name: 'Student A', group: 'Basic Therapy' },
  { id: 'student-b', name: 'Student B', group: 'Basic Therapy' },
  { id: 'student-c', name: 'Student C', group: 'Basic Therapy' },
  { id: 'student-d', name: 'Student D', group: 'Basic Therapy' },
  { id: 'student-e', name: 'Student E', group: 'Functional Living' },
  { id: 'student-f', name: 'Student F', group: 'Functional Living' },
];

const LINK_KEY = (station: string, block: string) => `${station}|${block}`;

const DEMO_LINK_ASSIGNMENTS: Record<string, Record<string, string[]>> = {
  's1': {
    [LINK_KEY('Station 1 (Basic Skills)', 'Monday AM (8:07-12:00)')]: ['student-a', 'student-b'],
  },
  't-b': {},
};

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
  const [station, setStation] = useState(LINK_STATIONS[0]);
  const [block, setBlock] = useState(LINK_BLOCKS[0]);
  const [assignments, setAssignments] = useState<Record<string, Record<string, string[]>>>(DEMO_LINK_ASSIGNMENTS);
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [selectedAssigned, setSelectedAssigned] = useState<string[]>([]);

  const group = STATION_GROUP[station];
  const key = LINK_KEY(station, block);
  const mineInBlock = assignments[teacher.id]?.[key] ?? [];
  const allInBlock = Object.keys(assignments).flatMap((tid) => assignments[tid][key] ?? []);
  const available = LINK_STUDENTS.filter((s) => s.group === group && !allInBlock.includes(s.id));

  const toggleAvailable = (id: string) => setSelectedAvailable((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAssigned = (id: string) => setSelectedAssigned((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const setKey = (key: string, ids: string[]) =>
    setAssignments((prev) => ({
      ...prev,
      [teacher.id]: { ...prev[teacher.id], [key]: ids },
    }));

  const handleAssign = () => {
    if (selectedAvailable.length === 0) { Alert.alert('Select students first'); return; }
    const combined = [...mineInBlock, ...selectedAvailable];
    if (combined.length > TEACHER_CAPACITY) { Alert.alert('Capacity exceeded', `Each teacher is limited to ${TEACHER_CAPACITY} students per block (already ${mineInBlock.length}).`); return; }
    setKey(key, combined);
    setSelectedAvailable([]);
  };

  const handleRemove = () => {
    if (selectedAssigned.length === 0) { Alert.alert('Select assigned students first'); return; }
    Alert.alert('Unlink students?', 'The selected students will be freed for other teachers in this block.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unlink', style: 'destructive', onPress: () => { setKey(key, mineInBlock.filter((id) => !selectedAssigned.includes(id))); setSelectedAssigned([]); } },
    ]);
  };

  const summaryKeys = Object.keys(assignments[teacher.id] ?? {}).filter((k) => (assignments[teacher.id]?.[k]?.length ?? 0) > 0);

  return (
    <View style={styles.linkingCard}>
      <View style={styles.linkingHeader}>
        <View style={{ flex: 1 }}>
          <Text style={typography.h2}>Teacher-Student Linking</Text>
          <Text style={typography.caption}>SCR-008 · {teacher.name} — assign students to a station &amp; time block (max {TEACHER_CAPACITY} per block).</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onClose}><Feather name="x" size={14} color={colors.navyText} /></TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={typography.label}>Station</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {LINK_STATIONS.map((s) => (
            <TouchableOpacity key={s} style={[styles.chip, station === s && styles.chipSelected]} onPress={() => setStation(s)}>
              <Text style={[styles.chipText, station === s && styles.chipTextSelected]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.field}>
        <Text style={typography.label}>Time Block</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {LINK_BLOCKS.map((b) => (
            <TouchableOpacity key={b} style={[styles.chip, block === b && styles.chipSelected]} onPress={() => setBlock(b)}>
              <Text style={[styles.chipText, block === b && styles.chipTextSelected]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={typography.caption}>Assigned in {block}: {mineInBlock.length}/{TEACHER_CAPACITY}</Text>

      <View style={styles.linkingRow}>
        <View style={styles.linkingList}>
          <Text style={typography.label}>Available Students</Text>
          <Text style={typography.caption}>{group} group · not assigned this block</Text>
          {available.length === 0 && <Text style={typography.caption}>No students available.</Text>}
          {available.map((s) => (
            <TouchableOpacity key={s.id} style={[styles.linkingItem, selectedAvailable.includes(s.id) && styles.linkingItemActive]} onPress={() => toggleAvailable(s.id)}>
              <Text style={typography.body}>{s.name}</Text>
              <Feather name={selectedAvailable.includes(s.id) ? 'check-square' : 'square'} size={14} color={colors.navyText} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.linkingActions}>
          <TouchableOpacity style={styles.moveBtn} onPress={handleAssign}><Feather name="chevron-right" size={14} color={colors.navyText} /><Text style={styles.moveBtnText}>Assign</Text></TouchableOpacity>
          <TouchableOpacity style={styles.moveBtn} onPress={handleRemove}><Feather name="chevron-left" size={14} color={colors.navyText} /><Text style={styles.moveBtnText}>Unlink</Text></TouchableOpacity>
        </View>
        <View style={styles.linkingList}>
          <Text style={typography.label}>Assigned Students</Text>
          <Text style={typography.caption}>{mineInBlock.length} of {TEACHER_CAPACITY} capacity</Text>
          {mineInBlock.length === 0 && <Text style={typography.caption}>No students assigned in this block.</Text>}
          {mineInBlock.map((id) => {
            const s = LINK_STUDENTS.find((x) => x.id === id);
            if (!s) return null;
            return (
              <TouchableOpacity key={id} style={[styles.linkingItem, selectedAssigned.includes(id) && styles.linkingItemActive]} onPress={() => toggleAssigned(id)}>
                <Text style={typography.body}>{s.name}</Text>
                <Feather name={selectedAssigned.includes(id) ? 'check-square' : 'square'} size={14} color={colors.navyText} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={typography.label}>Current Assignments Summary</Text>
        {summaryKeys.length === 0 && <Text style={typography.caption}>No assignments yet for {teacher.name}.</Text>}
        {summaryKeys.map((k) => {
          const [st, bl] = k.split('|');
          const ids = assignments[teacher.id][k];
          return (
            <View key={k} style={styles.summaryRow}>
              <Text style={typography.bodyBold}>{st}</Text>
              <Text style={typography.caption}>{bl} · {ids.map((id) => LINK_STUDENTS.find((x) => x.id === id)?.name).join(', ')}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function StaffAccountManagementScreen({ navigation }: NativeStackScreenProps<SystemAdminStackParamList, 'StaffAccountManagement'>) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
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
      setStaff(DEMO_STAFF);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = staff.filter(
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
        setStaff((prev) => prev.map((s) => (s.id === payload.id ? { ...s, ...payload, id: s.id } : s)));
      } else {
        const { data } = await createStaffAccount(payload);
        setStaff((prev) => [...prev, data]);
      }
    } catch (err) {
      if (payload.id) setStaff((prev) => prev.map((s) => (s.id === payload.id ? { ...s, ...payload, id: s.id } : s)));
      else setStaff((prev) => [...prev, { ...payload, id: `local-${Date.now()}` }]);
    }
    setFormTarget(undefined);
  };

  const handleResetPassword = (s: StaffMember) => {
    Alert.alert('Send password reset email?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: async () => { try { await resetStaffPassword(s.id); } catch (err) {} Alert.alert('Reset email sent'); } },
    ]);
  };

  const handleToggleActive = async (s: StaffMember) => {
    const next = !s.active;
    setStaff((prev) => prev.map((x) => (x.id === s.id ? { ...x, active: next } : x)));
    try { await toggleStaffActive(s.id, next); } catch (err) {}
  };

  const handleDelete = (s: StaffMember) => {
    Alert.alert('Delete staff account?', `${s.name} (${s.email}) will be permanently removed. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteStaffAccount(s.id); } catch (err) {}
          setStaff((prev) => prev.filter((x) => x.id !== s.id));
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
          try { await bulkStaffAction(selectedIds, action); } catch (err) {}
          if (action === 'Deactivate') setStaff((prev) => prev.map((s) => (selectedIds.includes(s.id) ? { ...s, active: false } : s)));
          setSelectedIds([]);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <SystemAdminNav activeTab="Staff Accounts" onTabPress={(t) => navigation?.navigate?.(SYS_ROUTE_BY_TAB[t])} />
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
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleToggleActive(s)}><Feather name={s.active ? 'user-x' : 'user-check'} size={14} color={colors.navyText} /></TouchableOpacity>
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

const DEMO_STAFF: StaffMember[] = [
  { id: 's1', name: 'Teacher A', email: 'teacher@melue.org', phone: '', roles: ['Teacher'], active: true },
  { id: 's2', name: 'Coordinator A', email: 'coordinator@melue.org', phone: '', roles: ['Coordinator'], active: true },
  { id: 's3', name: 'Director A', email: 'director@melue.org', phone: '', roles: ['Director'], active: true },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  addBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  addBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  filtersRow: { padding: spacing.md, gap: spacing.sm, backgroundColor: colors.bgCard },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.bgApp },
  filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs },
  filterChipActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
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
  linkingRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' },
  linkingList: { flex: 1, gap: spacing.xs },
  linkingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm },
  linkingItemActive: { backgroundColor: colors.statusPendingBg, borderColor: colors.primaryYellow },
  linkingActions: { justifyContent: 'center', gap: spacing.sm },
  moveBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.bgApp },
  moveBtnText: { fontSize: 11, fontWeight: '700', color: colors.navyText },
  summaryRow: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, gap: spacing.xs },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, maxHeight: '90%' },
  field: { gap: spacing.xs },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  chipTextSelected: { color: colors.navyText },
  modalFooter: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  saveBtn: { flex: 2, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
