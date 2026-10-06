import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, radius } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { SystemAdminStackParamList } from '../../types';
import { useToast } from '../../context/ToastContext';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import IconButton from '../../components/IconButton';
import { SYS_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getRoles, createRole, updateRole, deleteRole } from '../../api/SystemAdminApi';

type Props = NativeStackScreenProps<SystemAdminStackParamList, 'RoleManagement'>;

/** Shape returned by GET /api/v1/sysadmin/roles. */
interface RoleRecord {
  id: string;
  name: string;
  description: string;
  is_system_critical: boolean;
  user_count: number;
}

/** Row model the table renders. */
interface RoleRow {
  id: string;
  name: string;
  description: string;
  count: number;
  system: boolean;
}

function toRow(role: RoleRecord): RoleRow {
  return {
    id: String(role.id),
    name: role.name ?? '',
    description: role.description ?? '',
    count: role.user_count ?? 0,
    system: Boolean(role.is_system_critical),
  };
}

function Badge({ children, system }: { children: React.ReactNode; system?: boolean }) {
  return (
    <View style={[styles.badge, system ? styles.badgeSystem : styles.badgeCustom]}>
      <Text style={system ? styles.badgeSystemText : styles.badgeCustomText}>{children}</Text>
    </View>
  );
}

export default function RoleManagementScreen({ navigation }: Props) {
  const { showToast } = useToast();

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [addingRole, setAddingRole] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
  });

  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
  });

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await getRoles();

      const rawRoles = Array.isArray(data) ? data : Array.isArray(data?.roles) ? data.roles : [];

      const list = rawRoles as RoleRecord[];

      setRoles(list.map(toRow));
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
    if (!editForm.name.trim()) {
      showToast('Role name is required.', 'error');
      return;
    }

    setBusyId(id);

    try {
      const { data } = await updateRole(id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      });

      const updated = toRow(data as RoleRecord);

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
    if (!newRole.name.trim()) {
      showToast('Role name is required.', 'error');
      return;
    }

    setBusyId('new');

    try {
      const { data } = await createRole({
        name: newRole.name.trim(),
        description: newRole.description.trim(),
      });

      setRoles((rs) => [...rs, toRow(data as RoleRecord)]);

      setNewRole({
        name: '',
        description: '',
      });

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

  const renderRowActions = (role: RoleRow, busy: boolean) => (
    <View style={styles.actionsCell}>
      <IconButton
        onPress={() => {
          setEditingRole(role.id);
          setEditForm({
            name: role.name,
            description: role.description,
          });
        }}
        disabled={busy}
        label={`Edit ${role.name}`}
      >
        <Feather name="edit-2" size={16} color={colors.primaryBlue} />
      </IconButton>

      <IconButton
        onPress={() => navigation?.navigate?.('PermissionConfiguration')}
        disabled={busy}
        label={`Configure permissions for ${role.name}`}
      >
        <Feather name="shield" size={16} color="#0284C7" />
      </IconButton>

      {!role.system && (
        <IconButton
          onPress={() => removeRole(role.id)}
          disabled={busy}
          label={`Delete ${role.name}`}
        >
          <Feather name="trash-2" size={16} color={colors.statusRevisionText} />
        </IconButton>
      )}
    </View>
  );

  const navbar = (
    <AppNavbar
      activeTab="Role Management"
      onTabPress={(tab) => navigation?.navigate?.(SYS_ROUTE_BY_TAB[tab])}
    />
  );

  // Edits are persisted immediately by saveEdit/addRole.
  // This button re-reads the list from the server so the user
  // can confirm what is actually stored.
  const handleRefresh = async () => {
    await load();
    showToast('Role list refreshed from the server.', 'success');
  };

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
        <View style={styles.sectionHeader}>
          <Text style={typography.h2}>Role Management</Text>

          <Text style={typography.caption}>
            SCR-SYS-002 • Configure staff roles and their descriptions
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={typography.bodyBold}>Roles</Text>

            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}
                onPress={() => navigation?.navigate?.('PermissionConfiguration')}
                accessibilityRole="button"
              >
                <Feather name="shield" size={14} color="#0284C7" />
                <Text style={[styles.addBtnText, { color: '#0284C7' }]}>Configure Permissions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setAddingRole(true)}
                accessibilityRole="button"
                disabled={addingRole}
              >
                <Feather name="plus" size={14} color={colors.primaryBlue} />

                <Text style={styles.addBtnText}>Add Role</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, styles.colName]}>Role Name</Text>

              <Text style={[styles.headerText, styles.colDescription]}>Description</Text>

              <Text style={[styles.headerText, styles.colCount]}>Staff Count</Text>

              <Text style={[styles.headerText, styles.colType]}>Type</Text>

              <Text style={[styles.headerText, styles.colActions]}>Actions</Text>
            </View>

            {roles.length === 0 && !addingRole && (
              <View style={styles.tableRow}>
                <Text style={[styles.cellText, styles.colFull, { textAlign: 'center' }]}>
                  No roles found.
                </Text>
              </View>
            )}

            {roles.map((role) =>
              editingRole === role.id ? (
                <View key={role.id} style={[styles.tableRow, styles.addingRow]}>
                  <View style={[styles.colName, styles.inputCell]}>
                    <TextInput
                      style={styles.input}
                      value={editForm.name}
                      onChangeText={(text) =>
                        setEditForm((prev) => ({
                          ...prev,
                          name: text,
                        }))
                      }
                      placeholder="Role name"
                      placeholderTextColor={colors.mutedText}
                      autoFocus
                    />
                  </View>

                  <View style={[styles.colDescription, styles.inputCell]}>
                    <TextInput
                      style={styles.input}
                      value={editForm.description}
                      onChangeText={(text) =>
                        setEditForm((prev) => ({
                          ...prev,
                          description: text,
                        }))
                      }
                      placeholder="Description"
                      placeholderTextColor={colors.mutedText}
                    />
                  </View>

                  <Text style={[styles.cellText, styles.colCount, { textAlign: 'center' }]}>
                    {role.count}
                  </Text>

                  <View style={[styles.colType, styles.centerCell]}>
                    <Badge system={role.system}>{role.system ? 'System' : 'Custom'}</Badge>
                  </View>

                  <View style={styles.actionsCell}>
                    <IconButton
                      onPress={() => saveEdit(role.id)}
                      disabled={busyId === role.id}
                      label={`Save ${role.name}`}
                    >
                      {busyId === role.id ? (
                        <ActivityIndicator size="small" color={colors.statusApprovedText} />
                      ) : (
                        <Feather name="check" size={18} color={colors.statusApprovedText} />
                      )}
                    </IconButton>

                    <IconButton
                      onPress={() => setEditingRole(null)}
                      disabled={busyId === role.id}
                      label="Cancel editing role"
                    >
                      <Feather name="x" size={18} color={colors.statusRevisionText} />
                    </IconButton>
                  </View>
                </View>
              ) : (
                <View key={role.id} style={styles.tableRow}>
                  <Text style={[styles.cellTextBold, styles.colName]}>{role.name}</Text>

                  <Text style={[styles.cellText, styles.colDescription]} numberOfLines={2}>
                    {role.description}
                  </Text>

                  <Text style={[styles.cellText, styles.colCount, { textAlign: 'center' }]}>
                    {role.count}
                  </Text>

                  <View style={[styles.colType, styles.centerCell]}>
                    <Badge system={role.system}>{role.system ? 'System' : 'Custom'}</Badge>
                  </View>

                  {renderRowActions(role, busyId === role.id)}
                </View>
              ),
            )}

            {addingRole && (
              <View style={[styles.tableRow, styles.addingRow]}>
                <View style={[styles.colName, styles.inputCell]}>
                  <TextInput
                    style={styles.input}
                    value={newRole.name}
                    onChangeText={(text) =>
                      setNewRole((prev) => ({
                        ...prev,
                        name: text,
                      }))
                    }
                    placeholder="Role name"
                    placeholderTextColor={colors.mutedText}
                    autoFocus
                  />
                </View>

                <View style={[styles.colDescription, styles.inputCell]}>
                  <TextInput
                    style={styles.input}
                    value={newRole.description}
                    onChangeText={(text) =>
                      setNewRole((prev) => ({
                        ...prev,
                        description: text,
                      }))
                    }
                    placeholder="Description"
                    placeholderTextColor={colors.mutedText}
                  />
                </View>

                <Text style={[styles.cellText, styles.colCount, { textAlign: 'center' }]}>0</Text>

                <View style={[styles.colType, styles.centerCell]}>
                  <Badge>Custom</Badge>
                </View>

                <View style={styles.actionsCell}>
                  <IconButton onPress={addRole} disabled={busyId === 'new'} label="Save new role">
                    {busyId === 'new' ? (
                      <ActivityIndicator size="small" color={colors.statusApprovedText} />
                    ) : (
                      <Feather name="check" size={18} color={colors.statusApprovedText} />
                    )}
                  </IconButton>

                  <IconButton
                    onPress={() => {
                      setAddingRole(false);
                      setNewRole({
                        name: '',
                        description: '',
                      });
                    }}
                    disabled={busyId === 'new'}
                    label="Cancel adding role"
                  >
                    <Feather name="x" size={18} color={colors.statusRevisionText} />
                  </IconButton>
                </View>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveMainBtn}
          onPress={handleRefresh}
          disabled={loading}
          accessibilityRole="button"
        >
          <Feather name="save" size={16} color={colors.navyText} />

          <Text style={styles.saveMainBtnText}>Save Changes</Text>
        </TouchableOpacity>
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
    gap: spacing.xl,
  },

  sectionHeader: {
    gap: spacing.xs,
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

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  addBtnText: {
    color: colors.primaryBlue,
    fontWeight: '600',
    fontSize: 13,
  },

  table: {
    flex: 1,
  },

  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },

  headerText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },

  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },

  addingRow: {
    backgroundColor: '#F0F9FF',
  },

  cellText: {
    fontSize: 13,
    color: colors.bodyText,
  },

  cellTextBold: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },

  colName: {
    flex: 2,
  },

  colDescription: {
    flex: 3,
  },

  colCount: {
    flex: 1,
    textAlign: 'center',
  },

  colType: {
    flex: 1,
  },

  colActions: {
    width: 70,
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

  colFull: {
    flex: 1,
  },

  centerCell: {
    alignItems: 'center',
  },

  inputCell: {
    paddingRight: spacing.xs,
  },

  actionsCell: {
    width: 70,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },

  badgeSystem: {
    backgroundColor: colors.statusInProgressBg,
  },

  badgeSystemText: {
    color: colors.statusInProgressText,
    fontSize: 11,
    fontWeight: '600',
  },

  badgeCustom: {
    backgroundColor: colors.statusPendingBg,
  },

  badgeCustomText: {
    color: colors.statusPendingText,
    fontSize: 11,
    fontWeight: '600',
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    fontSize: 13,
    backgroundColor: colors.bgCard,
  },
});
