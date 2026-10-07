import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { SYS_ROUTE_BY_TAB } from '../../components/appNavConfig';
import {
  getRoles,
  getPermissionCatalog,
  getPermissionMatrix,
  savePermissionMatrix,
  resetDefaultPermissions,
  copyPermissionsFromRole,
  getPermissionAuditTrail,
} from '../../api/SystemAdminApi';
import { useToast } from '../../context/ToastContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SystemAdminStackParamList } from '../../types';
import {
  ACTIONS,
  type ActionType,
  type CatalogModule,
  type PermissionRole,
  type PermissionMatrix,
  type AuditEntry,
  DEFAULT_SYSTEM_ROLES,
  FALLBACK_MODULES,
  blankActions,
  toDisplayMatrix,
} from './permissions/permissionTypes';
import { PermissionControlsBar } from './permissions/components/PermissionControlsBar';
import { PermissionMatrixGrid } from './permissions/components/PermissionMatrixGrid';
import { PermissionSummaryCard } from './permissions/components/PermissionSummaryCard';
import { RolePickerModal } from './permissions/components/RolePickerModal';
import { CopyPermissionsModal } from './permissions/components/CopyPermissionsModal';
import { AuditTrailModal } from './permissions/components/AuditTrailModal';

export { ACTIONS, DEFAULT_SYSTEM_ROLES };
export type {
  ActionType,
  CatalogPermission,
  CatalogModule,
  PermissionRole,
  PermissionMatrix,
} from './permissions/permissionTypes';

export default function PermissionConfigurationScreen({
  navigation,
}: NativeStackScreenProps<SystemAdminStackParamList, 'PermissionConfiguration'>) {
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [roles, setRoles] = useState<PermissionRole[]>([]);
  const [catalogModules, setCatalogModules] = useState<CatalogModule[]>(FALLBACK_MODULES);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [matrix, setMatrix] = useState<PermissionMatrix>({});
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // 1. Load permission catalog
  const loadCatalog = useCallback(async () => {
    try {
      const { data } = await getPermissionCatalog();
      if (data?.modules && Array.isArray(data.modules) && data.modules.length > 0) {
        setCatalogModules(data.modules);
        return data.modules as CatalogModule[];
      }
    } catch (err) {
      console.warn('Failed to load permission catalog, using fallback modules:', err);
    }
    return FALLBACK_MODULES;
  }, []);

  // 2. Load system roles
  const loadRoles = useCallback(async () => {
    try {
      const { data } = await getRoles();
      if (Array.isArray(data) && data.length > 0) {
        setRoles(data);
        setSelectedRoleId((prev) => prev || data[0]?.id || '');
      } else {
        setRoles(DEFAULT_SYSTEM_ROLES);
        setSelectedRoleId((prev) => prev || DEFAULT_SYSTEM_ROLES[0].id);
      }
    } catch (err) {
      console.warn('Failed to load roles from API, using fallback system roles:', err);
      setRoles(DEFAULT_SYSTEM_ROLES);
      setSelectedRoleId((prev) => prev || DEFAULT_SYSTEM_ROLES[0].id);
    }
  }, []);

  // Initialize screen data
  useEffect(() => {
    Promise.all([loadCatalog(), loadRoles()]).finally(() => {
      setLoading(false);
    });
  }, [loadCatalog, loadRoles]);

  // Load role's permissions matrix and audit logs when role changes
  useEffect(() => {
    if (!selectedRoleId) return;
    getPermissionMatrix(selectedRoleId)
      .then(({ data }) => {
        setMatrix(toDisplayMatrix(data?.permissions, catalogModules));
        setDirty(false);
      })
      .catch(() => {
        setMatrix(toDisplayMatrix([], catalogModules));
        setDirty(false);
      });

    getPermissionAuditTrail(selectedRoleId)
      .then(({ data }) => setAuditTrail(Array.isArray(data) ? data : []))
      .catch(() => setAuditTrail([]));
  }, [selectedRoleId, catalogModules]);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || { id: selectedRoleId, name: 'Select Role' },
    [roles, selectedRoleId],
  );

  const displayModules = useMemo(
    () => (catalogModules.length > 0 ? catalogModules : FALLBACK_MODULES),
    [catalogModules],
  );

  const toggleCell = useCallback((moduleName: string, action: ActionType) => {
    setMatrix((prev) => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        [action]: !prev[moduleName]?.[action],
      },
    }));
    setDirty(true);
  }, []);

  const toggleRow = useCallback((moduleName: string) => {
    setMatrix((prev) => {
      const currentVal = prev[moduleName] ?? blankActions();
      const allChecked = ACTIONS.every((a) => currentVal[a]);
      const nextState: Record<ActionType, boolean> = {
        VIEW: !allChecked,
        CREATE: !allChecked,
        EDIT: !allChecked,
        DELETE: !allChecked,
        APPROVE: !allChecked,
      };
      return { ...prev, [moduleName]: nextState };
    });
    setDirty(true);
  }, []);

  const toggleColumn = useCallback(
    (action: ActionType) => {
      setMatrix((prev) => {
        const allChecked = displayModules.every((m) => prev[m.name]?.[action]);
        const updated = { ...prev };
        displayModules.forEach((m) => {
          updated[m.name] = {
            ...(updated[m.name] ?? blankActions()),
            [action]: !allChecked,
          };
        });
        return updated;
      });
      setDirty(true);
    },
    [displayModules],
  );

  const handleFullAccess = useCallback(() => {
    const full: PermissionMatrix = {};
    displayModules.forEach((m) => {
      full[m.name] = { VIEW: true, CREATE: true, EDIT: true, DELETE: true, APPROVE: true };
    });
    setMatrix(full);
    setDirty(true);
  }, [displayModules]);

  const handleReadOnly = useCallback(() => {
    const readOnly: PermissionMatrix = {};
    displayModules.forEach((m) => {
      readOnly[m.name] = { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
    });
    setMatrix(readOnly);
    setDirty(true);
  }, [displayModules]);

  const handleResetDefault = useCallback(() => {
    if (!selectedRoleId) return;
    Alert.alert(
      'Reset to Default Permissions?',
      `Are you sure you want to restore the standard system template permissions for "${selectedRole.name}"? (FR-018)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Default',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const { data } = await resetDefaultPermissions(selectedRoleId);
              if (data?.permissions) {
                setMatrix(toDisplayMatrix(data.permissions, displayModules));
                setDirty(false);
                showToast(
                  `Permissions reset to standard template for ${selectedRole.name}`,
                  'success',
                );
                getPermissionAuditTrail(selectedRoleId)
                  .then(({ data: logs }) => setAuditTrail(Array.isArray(logs) ? logs : []))
                  .catch(() => {});
              }
            } catch (err) {
              showToast('Failed to reset permissions to default', 'error');
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }, [selectedRoleId, selectedRole.name, displayModules, showToast]);

  const handleCopyFromRole = useCallback(
    async (sourceRoleId: string) => {
      try {
        setSaving(true);
        const { data } = await copyPermissionsFromRole(selectedRoleId, sourceRoleId);
        if (data?.permissions) {
          setMatrix(toDisplayMatrix(data.permissions, displayModules));
          setDirty(false);
          const sourceRole = roles.find((r) => r.id === sourceRoleId);
          showToast(`Permissions copied from ${sourceRole?.name || 'selected role'}`, 'success');
          getPermissionAuditTrail(selectedRoleId)
            .then(({ data: logs }) => setAuditTrail(Array.isArray(logs) ? logs : []))
            .catch(() => {});
        }
      } catch (err) {
        try {
          const { data } = await getPermissionMatrix(sourceRoleId);
          setMatrix(toDisplayMatrix(data?.permissions, displayModules));
          setDirty(true);
          showToast('Permissions loaded from role (unsaved)', 'info');
        } catch {
          showToast('Failed to copy permissions from selected role', 'error');
        }
      } finally {
        setSaving(false);
        setCopyModalOpen(false);
      }
    },
    [selectedRoleId, displayModules, roles, showToast],
  );

  const handleSave = useCallback(async () => {
    if (!selectedRoleId) return;
    setSaving(true);

    try {
      const selectedIds: string[] = [];
      displayModules.forEach((mod) => {
        ACTIONS.forEach((act) => {
          if (matrix[mod.name]?.[act]) {
            const p = mod.permissions?.find((cp) => cp.action.toLowerCase() === act.toLowerCase());
            if (p?.id) {
              selectedIds.push(p.id);
            }
          }
        });
      });

      await savePermissionMatrix(selectedRoleId, selectedIds);
      showToast(`Permissions updated successfully for ${selectedRole.name}`, 'success');
      setDirty(false);

      getPermissionAuditTrail(selectedRoleId)
        .then(({ data }) => setAuditTrail(Array.isArray(data) ? data : []))
        .catch(() => {});
    } catch (err) {
      showToast('Failed to save permissions. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }, [selectedRoleId, displayModules, matrix, selectedRole.name, showToast]);

  const summaryList = useMemo(() => {
    const statements: string[] = [];
    displayModules.forEach((mod) => {
      const perms = matrix[mod.name];
      if (!perms) return;

      const activeActions: string[] = [];
      if (perms.VIEW) activeActions.push('view');
      if (perms.CREATE) activeActions.push('create');
      if (perms.EDIT) activeActions.push('edit');
      if (perms.DELETE) activeActions.push('delete');
      if (perms.APPROVE) activeActions.push('approve');

      if (activeActions.length > 0) {
        let actionStr = '';
        if (activeActions.length === 1) {
          actionStr = activeActions[0];
        } else if (activeActions.length === 2) {
          actionStr = `${activeActions[0]} and ${activeActions[1]}`;
        } else {
          const last = activeActions.pop();
          actionStr = `${activeActions.join(', ')}, ${last}`;
        }
        statements.push(`Can ${actionStr} ${mod.name}`);
      }
    });
    return statements;
  }, [matrix, displayModules]);

  if (loading) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Permission Configuration"
        onTabPress={(t) => navigation?.navigate?.(SYS_ROUTE_BY_TAB[t])}
      />

      <View style={styles.subHeader}>
        <View style={styles.titleRow}>
          <Text style={typography.h1}>Permission Configuration</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SCR-SYS-003</Text>
          </View>
        </View>
        <Text style={styles.breadcrumbText}>
          <Feather name="settings" size={12} color={colors.mutedText} /> System Configuration /
          Permission Configuration (RBAC)
        </Text>
        <Text style={typography.caption}>
          SCR-SYS-003 · Configure granular action-level permissions (View, Create, Edit, Delete,
          Approve) per role across all system modules
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}>
        <PermissionControlsBar
          selectedRole={selectedRole}
          onOpenRolePicker={() => setDropdownOpen(true)}
          onFullAccess={handleFullAccess}
          onReadOnly={handleReadOnly}
          onResetDefault={handleResetDefault}
          onOpenCopyModal={() => setCopyModalOpen(true)}
        />

        <PermissionMatrixGrid
          modules={displayModules}
          matrix={matrix}
          onToggleCell={toggleCell}
          onToggleRow={toggleRow}
          onToggleColumn={toggleColumn}
        />

        <PermissionSummaryCard roleName={selectedRole.name} summaryList={summaryList} />

        <View style={styles.bottomActionsRow}>
          <TouchableOpacity
            style={[styles.saveConfigBtn, (!dirty || saving) && styles.saveConfigBtnDisabled]}
            disabled={!dirty || saving}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save permission configuration"
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.navyText} />
            ) : (
              <Feather name="save" size={16} color={colors.navyText} />
            )}
            <Text style={styles.saveConfigBtnText}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.auditTrailLink}
            onPress={() => setShowAuditModal(true)}
            accessibilityRole="button"
            accessibilityLabel="View audit trail"
          >
            <Feather name="file-text" size={14} color="#0284C7" />
            <Text style={styles.auditTrailLinkText}>View Audit Trail</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <RolePickerModal
        visible={dropdownOpen}
        roles={roles.length > 0 ? roles : DEFAULT_SYSTEM_ROLES}
        selectedRoleId={selectedRoleId}
        onSelectRole={(id) => {
          setSelectedRoleId(id);
          setDropdownOpen(false);
        }}
        onClose={() => setDropdownOpen(false)}
      />

      <CopyPermissionsModal
        visible={copyModalOpen}
        roles={roles}
        selectedRoleId={selectedRoleId}
        targetRoleName={selectedRole.name}
        onCopyFromRole={handleCopyFromRole}
        onClose={() => setCopyModalOpen(false)}
      />

      <AuditTrailModal
        visible={showAuditModal}
        roleName={selectedRole.name}
        auditTrail={auditTrail}
        onClose={() => setShowAuditModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  subHeader: {
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breadcrumbText: {
    fontSize: 12,
    color: colors.mutedText,
  },
  badge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navyText,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    width: '100%',
  },
  contentTablet: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
  bottomActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  saveConfigBtnDisabled: {
    opacity: 0.45,
  },
  saveConfigBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  auditTrailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: spacing.sm,
  },
  auditTrailLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
    textDecorationLine: 'underline',
  },
});
