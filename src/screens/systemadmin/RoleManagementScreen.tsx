// src/screens/systemadmin/RoleManagementScreen.tsx

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, radius } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { SystemAdminStackParamList } from '../../types';
import { useToast } from '../../context/ToastContext';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { SYS_ROUTE_BY_TAB } from '../../components/appNavConfig';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getStaffAccounts,
} from '../../api/SystemAdminApi';
import { confirmAction } from '../../utils/dialogs';
import { useResourcePermissions } from '../../auth/usePermission';
import {
  filterOutDeletedStaff,
  isStaffDeleted,
  onDeletedStaffChanged,
} from '../../utils/deletedStaffHelper';

import {
  type RoleRecord,
  type RoleRow,
  type RoleFormData,
  toRoleRow,
  parseRolesApiResponse,
  validateRoleInput,
} from './roles/rolesTypes';

import {
  RoleTableHeader,
  RoleTableRow,
  AddRoleRow,
  RoleManagementHeader,
} from './roles/components';

type Props = NativeStackScreenProps<SystemAdminStackParamList, 'RoleManagement'>;

export default function RoleManagementScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const { canCreate, canEdit, canDelete } = useResourcePermissions('admin');

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [addingRole, setAddingRole] = useState(false);
  const [newRole, setNewRole] = useState<RoleFormData>({
    name: '',
    description: '',
  });

  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RoleFormData>({
    name: '',
    description: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, staffRes] = await Promise.allSettled([getRoles(), getStaffAccounts({})]);
      const rolesData = rolesRes.status === 'fulfilled' ? rolesRes.value?.data : [];
      const staffData = staffRes.status === 'fulfilled' ? staffRes.value?.data : [];
      const activeStaff = filterOutDeletedStaff(Array.isArray(staffData) ? staffData : []).filter(
        (s: any) => s.active !== false && !isStaffDeleted(s),
      );

      // Compute staff count per role name
      const countsByRole: Record<string, number> = {};
      activeStaff.forEach((s: any) => {
        const staffRoles: string[] = Array.isArray(s.roles) ? s.roles : s.role ? [s.role] : [];
        staffRoles.forEach((rName) => {
          const norm = rName.toLowerCase();
          countsByRole[norm] = (countsByRole[norm] || 0) + 1;
        });
      });

      const list = parseRolesApiResponse(rolesData);
      setRoles(
        list.map((r) => {
          const row = toRoleRow(r);
          const computedCount = countsByRole[r.name.toLowerCase()];
          if (computedCount !== undefined) {
            row.count = computedCount;
          }
          return row;
        }),
      );
    } catch {
      setRoles([]);
      showToast('Could not load roles. Check your connection and try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = onDeletedStaffChanged(() => {
      load();
    });
    return unsubscribe;
  }, [load]);

  const saveEdit = async (id: string) => {
    if (!canEdit) {
      showToast('You do not have permission to edit roles.', 'error');
      return;
    }
    const validation = validateRoleInput(editForm.name);
    if (!validation.valid) {
      showToast(validation.error || 'Role name is required.', 'error');
      return;
    }

    setBusyId(id);
    try {
      const { data } = await updateRole(id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      });
      const updated = toRoleRow(data as RoleRecord);
      setRoles((rs) => rs.map((r) => (r.id === id ? updated : r)));
      setEditingRole(null);
      showToast('Role updated.', 'success');
    } catch {
      showToast('Failed to update role.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const addRole = async () => {
    if (!canCreate) {
      showToast('You do not have permission to create roles.', 'error');
      return;
    }
    const validation = validateRoleInput(newRole.name);
    if (!validation.valid) {
      showToast(validation.error || 'Role name is required.', 'error');
      return;
    }

    setBusyId('new');
    try {
      const { data } = await createRole({
        name: newRole.name.trim(),
        description: newRole.description.trim(),
      });
      setRoles((rs) => [...rs, toRoleRow(data as RoleRecord)]);
      setNewRole({ name: '', description: '' });
      setAddingRole(false);
      showToast('Role created.', 'success');
    } catch {
      showToast('Failed to create role.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const removeRole = (role: RoleRow) => {
    if (!canDelete) {
      showToast('You do not have permission to delete roles.', 'error');
      return;
    }
    confirmAction({
      title: 'Delete Role?',
      message: `Are you sure you want to permanently delete the role "${role.name}"?\n\nStaff accounts assigned this role may lose access to associated modules.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
      onConfirm: async () => {
        setBusyId(role.id);
        try {
          await deleteRole(role.id);
          setRoles((rs) => rs.filter((r) => r.id !== role.id));
          showToast(`Role "${role.name}" deleted successfully.`, 'success');
        } catch (err: any) {
          const msg = err?.response?.data?.error || err?.message || 'Failed to delete role.';
          showToast(msg, 'error');
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const handleRefresh = async () => {
    await load();
    showToast('Role list refreshed from the server.', 'success');
  };

  const navbar = (
    <AppNavbar
      activeTab="Role Management"
      onTabPress={(tab) => navigation?.navigate?.(SYS_ROUTE_BY_TAB[tab])}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        {navbar}
        <ScreenLoader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {navbar}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.container, { maxWidth: Math.min(width - 32, 1200) }]}>
          <RoleManagementHeader
            onConfigurePermissions={() => navigation?.navigate?.('PermissionConfiguration')}
            onAddRole={() => setAddingRole(true)}
            addingRole={addingRole}
            canCreate={canCreate}
          />

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={typography.bodyBold}>Roles Directory</Text>
              <Text style={styles.roleCountBadge}>{roles.length} roles</Text>
            </View>

            <View style={styles.table}>
              <RoleTableHeader />

              {roles.length === 0 && !addingRole && (
                <View style={styles.tableRow}>
                  <Text style={[styles.cellText, styles.colFull, { textAlign: 'center' }]}>
                    No roles found.
                  </Text>
                </View>
              )}

              {roles.map((role) => (
                <RoleTableRow
                  key={role.id}
                  role={role}
                  isEditing={editingRole === role.id}
                  isBusy={busyId === role.id}
                  editForm={editForm}
                  onChangeEditForm={(partial) => setEditForm((prev) => ({ ...prev, ...partial }))}
                  onStartEdit={() => {
                    setEditingRole(role.id);
                    setEditForm({
                      name: role.name,
                      description: role.description,
                    });
                  }}
                  onCancelEdit={() => setEditingRole(null)}
                  onSaveEdit={() => saveEdit(role.id)}
                  onConfigurePermissions={() =>
                    navigation?.navigate?.('PermissionConfiguration', { roleId: role.id })
                  }
                  onDeleteRole={() => removeRole(role)}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              ))}

              {addingRole && (
                <AddRoleRow
                  formData={newRole}
                  isBusy={busyId === 'new'}
                  onChangeFormData={(partial) => setNewRole((prev) => ({ ...prev, ...partial }))}
                  onSave={addRole}
                  onCancel={() => {
                    setAddingRole(false);
                    setNewRole({ name: '', description: '' });
                  }}
                />
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveMainBtn}
            onPress={handleRefresh}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Refresh roles from server"
          >
            <Feather name="refresh-cw" size={16} color={colors.navyText} />
            <Text style={styles.saveMainBtnText}>Refresh from Server</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    gap: spacing.xl,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  roleCountBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  table: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  cellText: {
    fontSize: 13,
    color: colors.bodyText,
  },
  colFull: {
    flex: 1,
  },
  saveMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryYellow,
    padding: spacing.md,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xl,
  },
  saveMainBtnText: {
    color: colors.navyText,
    fontWeight: '700',
    fontSize: 14,
  },
});
