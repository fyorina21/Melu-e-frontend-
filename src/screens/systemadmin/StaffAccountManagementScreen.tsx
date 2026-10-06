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
import { FlashList } from '@shopify/flash-list';
import { Button, Input, Card, Badge } from '../../shared/components';
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
import { useToast } from '../../context/ToastContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SystemAdminStackParamList } from '../../types';
import { type StaffMember, type RoleMeta, type StaffPayload, ROLE_OPTIONS } from './types';
import { StaffFormModal, ResetPasswordModal, TeacherLinkingPanel } from './components';

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

      <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
        <FlashList
          data={filtered}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          renderItem={({ item: s }) => (
            <View style={styles.row}>
              <TouchableOpacity onPress={() => toggleSelect(s.id)} style={styles.checkbox}>
                <View
                  style={[
                    styles.checkboxInner,
                    selectedIds.includes(s.id) && styles.checkboxChecked,
                  ]}
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
          )}
          ListFooterComponent={
            linkTarget ? (
              <TeacherLinkingPanel teacher={linkTarget} onClose={() => setLinkTarget(null)} />
            ) : null
          }
        />
      </View>

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
