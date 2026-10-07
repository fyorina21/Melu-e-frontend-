import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SystemAdminStackParamList } from '../../types';
import {
  type StaffMember,
  type RoleMeta,
  type StaffPayload,
  ROLE_OPTIONS,
  filterStaff,
} from './types';
import {
  StaffFormModal,
  ResetPasswordModal,
  TeacherLinkingPanel,
  StaffFilterBar,
  StaffAccountRow,
} from './components';

export default function StaffAccountManagementScreen({
  navigation,
}: NativeStackScreenProps<SystemAdminStackParamList, 'StaffAccountManagement'>) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { showToast } = useToast();

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
    } catch {
      setStaff([]);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    loadRoles();
    load();
  }, [loadRoles, load]);

  const filtered = useMemo(
    () => filterStaff(staff, search, roleFilter, statusFilter),
    [staff, search, roleFilter, statusFilter],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

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
    } catch {
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
            } catch {
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
          } catch {
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
      <View style={[styles.mainContainer, isTablet && styles.tabletContainer]}>
        <View style={styles.header}>
          <Text style={typography.h1}>Staff Account Management</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setFormTarget(null)}
            accessibilityRole="button"
            accessibilityLabel="Add staff member"
          >
            <Feather name="plus" size={14} color={colors.navyText} />
            <Text style={styles.addBtnText}>Add Staff</Text>
          </TouchableOpacity>
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
            <TouchableOpacity
              style={styles.bulkBtn}
              onPress={() => handleBulkAction('Deactivate')}
              accessibilityRole="button"
              accessibilityLabel="Deactivate selected accounts"
            >
              <Text style={styles.bulkBtnText}>Deactivate</Text>
            </TouchableOpacity>
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
                isLinkingActive={linkTarget?.id === s.id}
                onToggleSelect={toggleSelect}
                onEdit={setFormTarget}
                onLinkToggle={(target) =>
                  setLinkTarget(linkTarget?.id === target.id ? null : target)
                }
                onResetPassword={setCredentialTarget}
                onToggleActive={handleToggleActive}
                onDelete={handleDelete}
              />
            )}
            ListFooterComponent={
              linkTarget ? (
                <TeacherLinkingPanel teacher={linkTarget} onClose={() => setLinkTarget(null)} />
              ) : null
            }
          />
        </View>
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
});
