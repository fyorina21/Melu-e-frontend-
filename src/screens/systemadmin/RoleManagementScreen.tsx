// src/screens/systemadmin/RoleManagementScreen.tsx

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
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
import { getRoles, createRole, updateRole, deleteRole } from '../../api/SystemAdminApi';

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
      const { data } = await getRoles();
      const list = parseRolesApiResponse(data);
      setRoles(list.map(toRoleRow));
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

  const saveEdit = async (id: string) => {
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

  const removeRole = async (id: string) => {
    setBusyId(id);
    try {
      await deleteRole(id);
      setRoles((rs) => rs.filter((r) => r.id !== id));
      showToast('Role deleted.', 'success');
    } catch {
      showToast('Failed to delete role.', 'error');
    } finally {
      setBusyId(null);
    }
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
                  onConfigurePermissions={() => navigation?.navigate?.('PermissionConfiguration')}
                  onDeleteRole={() => removeRole(role.id)}
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
