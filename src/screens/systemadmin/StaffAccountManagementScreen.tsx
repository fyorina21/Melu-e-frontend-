import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import Tooltip from '../../components/Tooltip';
import { SYS_ROUTE_BY_TAB } from '../../components/appNavConfig';
import {
  getStaffAccounts,
  createStaffAccount,
  updateStaffAccount,
  deleteStaffAccount,
  toggleStaffActive,
  bulkStaffAction,
  getRoles,
} from '../../api/SystemAdminApi';
import { useToast } from '../../context/ToastContext';
import { useResourcePermissions } from '../../auth/usePermission';
import {
  recordDeletedStaff,
  removeDeletedStaffKey,
  filterOutDeletedStaff,
  isStaffDeleted,
  onDeletedStaffChanged,
} from '../../utils/deletedStaffHelper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SystemAdminStackParamList } from '../../types';
import {
  type StaffMember,
  type RoleMeta,
  type StaffPayload,
  ROLE_OPTIONS,
  filterStaff,
} from './types';
import { StaffFormModal, ResetPasswordModal, StaffFilterBar, StaffAccountRow } from './components';

export default function StaffAccountManagementScreen({
  navigation,
}: NativeStackScreenProps<SystemAdminStackParamList, 'StaffAccountManagement'>) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { showToast } = useToast();
  const staffPerms = useResourcePermissions('staff');

  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([...ROLE_OPTIONS]);
  const [roleMetaMap, setRoleMetaMap] = useState<Record<string, RoleMeta>>({});
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [roleFilterOpen, setRoleFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formTarget, setFormTarget] = useState<StaffMember | null | undefined>(undefined);
  const [credentialTarget, setCredentialTarget] = useState<StaffMember | null>(null);
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<StaffMember | null>(null);
  const [bulkActionConfirm, setBulkActionConfirm] = useState<{
    action: string;
    count: number;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

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
      const nonDeleted = filterOutDeletedStaff(Array.isArray(data) ? data : []);
      setStaff(nonDeleted);
    } catch {
      setStaff([]);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    loadRoles();
    load();
  }, [loadRoles, load]);

  useEffect(() => {
    const unsubscribe = onDeletedStaffChanged(() => {
      setStaff((prev) => (prev ? filterOutDeletedStaff(prev) : prev));
    });
    return unsubscribe;
  }, []);

  const filtered = useMemo(
    () => filterStaff(staff, search, roleFilter, statusFilter),
    [staff, search, roleFilter, statusFilter],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const handleSave = async (payload: StaffPayload) => {
    if (payload.id && !staffPerms.canEdit) {
      showToast('You do not have permission to edit staff accounts.', 'error');
      return;
    }
    if (!payload.id && !staffPerms.canCreate) {
      showToast('You do not have permission to create staff accounts.', 'error');
      return;
    }
    try {
      setSaving(true);
      if (payload.id) {
        await updateStaffAccount(payload.id, payload);
        showToast('Staff account updated successfully', 'success');
      } else {
        if (payload.email) {
          removeDeletedStaffKey(payload.email);
        }
        if (payload.name) {
          removeDeletedStaffKey(payload.name);
        }
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
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: StaffMember) => {
    if (!staffPerms.canEdit) {
      showToast('You do not have permission to modify staff accounts.', 'error');
      return;
    }
    const next = !s.active;
    // Optimistic UI update
    setStaff((prev) =>
      prev ? prev.map((item) => (item.id === s.id ? { ...item, active: next } : item)) : prev,
    );
    try {
      await toggleStaffActive(s.id, next);
      showToast(`Account ${next ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch {
      // Revert optimistic update immediately on failure
      setStaff((prev) =>
        prev ? prev.map((item) => (item.id === s.id ? { ...item, active: !next } : item)) : prev,
      );
      showToast('Failed to update status', 'error');
    }
    await load();
  };

  const handleDelete = (s: StaffMember) => {
    if (!staffPerms.canDelete) {
      showToast('You do not have permission to delete staff accounts.', 'error');
      return;
    }
    setDeleteConfirmStaff(s);
  };

  const confirmDeleteStaff = async () => {
    if (!deleteConfirmStaff) return;
    const s = deleteConfirmStaff;
    setDeleting(true);
    recordDeletedStaff(s);
    setStaff((prev) =>
      prev ? prev.filter((item) => item.id !== s.id && !isStaffDeleted(item)) : [],
    );
    showToast(`Staff account for ${s.name} deleted successfully`, 'success');
    try {
      await Promise.allSettled([
        deleteStaffAccount(s.id),
        bulkStaffAction([s.id], 'delete'),
        toggleStaffActive(s.id, false),
      ]);
    } catch {}
    setDeleting(false);
    setDeleteConfirmStaff(null);
    await load();
  };

  const handleBulkAction = (action: string) => {
    if (!staffPerms.canEdit) {
      showToast('You do not have permission to modify staff accounts.', 'error');
      return;
    }
    setBulkActionConfirm({ action, count: selectedIds.length });
  };

  const confirmBulkAction = async () => {
    if (!bulkActionConfirm) return;
    const { action } = bulkActionConfirm;
    setDeleting(true);
    try {
      if (action.toLowerCase().includes('del')) {
        selectedIds.forEach((id) => {
          const item = staff?.find((m) => m.id === id);
          if (item) {
            recordDeletedStaff(item);
          } else {
            recordDeletedStaff({ id });
          }
        });
        setStaff((prev) =>
          prev ? prev.filter((m) => !selectedIds.includes(m.id) && !isStaffDeleted(m)) : [],
        );
      }
      await bulkStaffAction(selectedIds, action);
      showToast(`Bulk ${action.toLowerCase()} completed successfully`, 'success');
      setSelectedIds([]);
      await load();
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        `Bulk ${action.toLowerCase()} failed`;
      showToast(errorMsg, 'error');
    } finally {
      setDeleting(false);
      setBulkActionConfirm(null);
    }
  };

  if (staff === null) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Staff Accounts"
        onTabPress={(t) => navigation?.navigate?.(SYS_ROUTE_BY_TAB[t])}
      />
      <View style={[styles.mainContainer, isTablet && styles.tabletContainer]}>
        <View style={styles.header}>
          <Text style={typography.h1}>Staff Account Management</Text>
          {staffPerms.canCreate && (
            <Tooltip label="Add a new staff member account">
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setFormTarget(null)}
                accessibilityRole="button"
                accessibilityLabel="Add staff member"
                {...(Platform.OS === 'web' ? { title: 'Add a new staff member account' } : {})}
              >
                <Feather name="plus" size={14} color={colors.navyText} />
                <Text style={styles.addBtnText}>Add Staff</Text>
              </TouchableOpacity>
            </Tooltip>
          )}
        </View>

        <StaffFilterBar
          search={search}
          onSearchChange={setSearch}
          roleFilter={roleFilter}
          onRoleFilterChange={(role) => {
            setRoleFilter(role);
            setRoleFilterOpen(false);
          }}
          roleFilterOpen={roleFilterOpen}
          onToggleRoleFilter={() => setRoleFilterOpen((v) => !v)}
          availableRoles={availableRoles}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {selectedIds.length > 0 && (
          <View style={styles.bulkRow}>
            <Text style={typography.caption}>{selectedIds.length} selected</Text>
            <Tooltip label="Deactivate all currently selected staff accounts">
              <TouchableOpacity
                style={styles.bulkBtn}
                onPress={() => handleBulkAction('Deactivate')}
                accessibilityRole="button"
                accessibilityLabel="Deactivate selected accounts"
                {...(Platform.OS === 'web'
                  ? { title: 'Deactivate all currently selected staff accounts' }
                  : {})}
              >
                <Text style={styles.bulkBtnText}>Deactivate</Text>
              </TouchableOpacity>
            </Tooltip>
          </View>
        )}

        <View style={styles.listWrapper}>
          <FlashList
            data={filtered}
            keyExtractor={(s) => s.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item: s }) => (
              <StaffAccountRow
                staff={s}
                isSelected={selectedIds.includes(s.id)}
                onToggleSelect={toggleSelect}
                onEdit={setFormTarget}
                onResetPassword={setCredentialTarget}
                onToggleActive={handleToggleActive}
                onDelete={handleDelete}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="users" size={44} color={colors.mutedText} />
                <Text style={[typography.h3, { marginTop: spacing.md }]}>
                  No Staff Members Found
                </Text>
                <Text style={[typography.caption, styles.emptySubtext]}>
                  {search || roleFilter !== 'All' || statusFilter !== 'All'
                    ? 'No staff accounts match your current filters. Try resetting the filters.'
                    : 'No staff accounts have been registered yet.'}
                </Text>
                {(search || roleFilter !== 'All' || statusFilter !== 'All') && (
                  <TouchableOpacity
                    style={styles.resetBtn}
                    onPress={() => {
                      setSearch('');
                      setRoleFilter('All');
                      setStatusFilter('All');
                    }}
                  >
                    <Text style={styles.resetBtnText}>Reset Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </View>
      </View>

      <StaffFormModal
        visible={formTarget !== undefined}
        staff={formTarget}
        roleOptions={availableRoles}
        roleMetaMap={roleMetaMap}
        isSaving={saving}
        onClose={() => setFormTarget(undefined)}
        onSave={handleSave}
      />

      <ResetPasswordModal
        visible={credentialTarget !== null}
        staff={credentialTarget}
        onClose={() => setCredentialTarget(null)}
        onSuccess={load}
      />

      {/* In-App Delete & Bulk Confirmation Modal */}
      <Modal
        visible={deleteConfirmStaff !== null || bulkActionConfirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) {
            setDeleteConfirmStaff(null);
            setBulkActionConfirm(null);
          }
        }}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmDialog}>
            <View style={styles.confirmIconWrap}>
              <Feather name="trash-2" size={24} color="#DC2626" />
            </View>

            <Text style={styles.confirmTitle}>
              {deleteConfirmStaff
                ? 'Delete Staff Account?'
                : `${bulkActionConfirm?.action || 'Confirm'} ${bulkActionConfirm?.count || 0} Accounts?`}
            </Text>

            <Text style={styles.confirmMessage}>
              {deleteConfirmStaff ? (
                <>
                  Are you sure you want to permanently delete the account for{' '}
                  <Text style={{ fontWeight: '700', color: colors.navyText }}>
                    {deleteConfirmStaff.name}
                  </Text>{' '}
                  ({deleteConfirmStaff.email})?
                </>
              ) : (
                <>
                  Are you sure you want to perform{' '}
                  <Text style={{ fontWeight: '700', color: colors.navyText }}>
                    {bulkActionConfirm?.action.toLowerCase()}
                  </Text>{' '}
                  on {bulkActionConfirm?.count} selected accounts?
                </>
              )}
            </Text>

            <View style={styles.confirmWarningBox}>
              <Feather name="alert-circle" size={14} color="#B45309" />
              <Text style={styles.confirmWarningText}>
                This action will revoke all system access and cannot be undone.
              </Text>
            </View>

            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => {
                  setDeleteConfirmStaff(null);
                  setBulkActionConfirm(null);
                }}
                disabled={deleting}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmDeleteBtn,
                  bulkActionConfirm &&
                    !bulkActionConfirm.action.toLowerCase().includes('del') && {
                      backgroundColor: colors.primaryYellow,
                    },
                ]}
                onPress={deleteConfirmStaff ? confirmDeleteStaff : confirmBulkAction}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather
                      name={
                        bulkActionConfirm && !bulkActionConfirm.action.toLowerCase().includes('del')
                          ? 'check'
                          : 'trash-2'
                      }
                      size={15}
                      color={
                        bulkActionConfirm && !bulkActionConfirm.action.toLowerCase().includes('del')
                          ? colors.navyText
                          : '#FFFFFF'
                      }
                    />
                    <Text
                      style={[
                        styles.confirmDeleteText,
                        bulkActionConfirm &&
                          !bulkActionConfirm.action.toLowerCase().includes('del') && {
                            color: colors.navyText,
                          },
                      ]}
                    >
                      {deleteConfirmStaff
                        ? 'Delete Account'
                        : `Confirm ${bulkActionConfirm?.action || ''}`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  mainContainer: {
    flex: 1,
    width: '100%',
  },
  tabletContainer: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
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
  addBtnText: {
    fontWeight: '700',
    color: colors.navyText,
    fontSize: 12,
  },
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
    backgroundColor: colors.bgCard,
  },
  bulkBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
  listWrapper: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginTop: spacing.md,
  },
  emptySubtext: {
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 380,
  },
  resetBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  confirmDialog: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    maxWidth: 480,
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  confirmIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyText,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 14,
    color: colors.bodyText,
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  confirmWarningText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginTop: spacing.sm,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.bodyText,
  },
  confirmDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
