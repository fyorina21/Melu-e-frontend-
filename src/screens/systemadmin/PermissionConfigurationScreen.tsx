// src/screens/systemadmin/PermissionConfigurationScreen.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, SafeAreaView, Alert, useWindowDimensions } from 'react-native';
import { colors, spacing } from '../../theme/colors';
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
  toDisplayMatrix,
} from './permissions/permissionTypes';

import {
  buildPermissionSummaryList,
  extractSelectedPermissionIds,
  buildFullAccessMatrix,
  buildReadOnlyMatrix,
  toggleCellAction,
  toggleRowActions,
  toggleColumnAction,
} from './permissions/permissionHelper';

import { PermissionControlsBar } from './permissions/components/PermissionControlsBar';
import { PermissionMatrixGrid } from './permissions/components/PermissionMatrixGrid';
import { PermissionSummaryCard } from './permissions/components/PermissionSummaryCard';
import { RolePickerModal } from './permissions/components/RolePickerModal';
import { CopyPermissionsModal } from './permissions/components/CopyPermissionsModal';
import { AuditTrailModal } from './permissions/components/AuditTrailModal';
import PermissionConfigHeader from './permissions/components/PermissionConfigHeader';
import PermissionSaveBar from './permissions/components/PermissionSaveBar';

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
  route,
}: NativeStackScreenProps<SystemAdminStackParamList, 'PermissionConfiguration'>) {
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const routeRoleId = route?.params?.roleId;

  const [roles, setRoles] = useState<PermissionRole[]>([]);
  const [catalogModules, setCatalogModules] = useState<CatalogModule[]>(FALLBACK_MODULES);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(routeRoleId || '');
  const [matrix, setMatrix] = useState<PermissionMatrix>({});
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Sync if route.params.roleId changes dynamically
  useEffect(() => {
    if (routeRoleId && routeRoleId !== selectedRoleId) {
      setSelectedRoleId(routeRoleId);
    }
  }, [routeRoleId]);

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
        setSelectedRoleId((prev) => prev || routeRoleId || data[0]?.id || '');
      } else {
        setRoles(DEFAULT_SYSTEM_ROLES);
        setSelectedRoleId((prev) => prev || routeRoleId || DEFAULT_SYSTEM_ROLES[0].id);
      }
    } catch (err) {
      console.warn('Failed to load roles from API, using fallback system roles:', err);
      setRoles(DEFAULT_SYSTEM_ROLES);
      setSelectedRoleId((prev) => prev || routeRoleId || DEFAULT_SYSTEM_ROLES[0].id);
    }
  }, [routeRoleId]);

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
    setMatrix((prev) => toggleCellAction(prev, moduleName, action));
    setDirty(true);
  }, []);

  const toggleRow = useCallback((moduleName: string) => {
    setMatrix((prev) => toggleRowActions(prev, moduleName));
    setDirty(true);
  }, []);

  const toggleColumn = useCallback(
    (action: ActionType) => {
      setMatrix((prev) => toggleColumnAction(prev, action, displayModules));
      setDirty(true);
    },
    [displayModules],
  );

  const handleFullAccess = useCallback(() => {
    setMatrix(buildFullAccessMatrix(displayModules));
    setDirty(true);
  }, [displayModules]);

  const handleReadOnly = useCallback(() => {
    setMatrix(buildReadOnlyMatrix(displayModules));
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
            } catch {
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
      } catch {
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
      const selectedIds = extractSelectedPermissionIds(matrix, displayModules);
      await savePermissionMatrix(selectedRoleId, selectedIds);
      showToast(`Permissions updated successfully for ${selectedRole.name}`, 'success');
      setDirty(false);

      getPermissionAuditTrail(selectedRoleId)
        .then(({ data }) => setAuditTrail(Array.isArray(data) ? data : []))
        .catch(() => {});
    } catch {
      showToast('Failed to save permissions. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }, [selectedRoleId, displayModules, matrix, selectedRole.name, showToast]);

  const summaryList = useMemo(
    () => buildPermissionSummaryList(matrix, displayModules),
    [matrix, displayModules],
  );

  const handleSelectRole = useCallback(
    (id: string) => {
      if (id === selectedRoleId) {
        setDropdownOpen(false);
        return;
      }
      if (dirty) {
        Alert.alert(
          'Unsaved Changes',
          `You have unsaved changes for "${selectedRole.name}". Switching roles will discard these changes. Do you want to proceed?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Discard & Switch',
              style: 'destructive',
              onPress: () => {
                setDirty(false);
                setSelectedRoleId(id);
                setDropdownOpen(false);
              },
            },
          ],
        );
      } else {
        setSelectedRoleId(id);
        setDropdownOpen(false);
      }
    },
    [dirty, selectedRoleId, selectedRole.name],
  );

  const handleTabPress = useCallback(
    (t: string) => {
      const targetRoute = SYS_ROUTE_BY_TAB[t];
      if (!targetRoute) return;

      if (dirty) {
        Alert.alert(
          'Unsaved Changes',
          'You have unsaved permission changes. Navigating away will discard them. Do you want to proceed?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Discard & Leave',
              style: 'destructive',
              onPress: () => {
                setDirty(false);
                navigation?.navigate?.(targetRoute);
              },
            },
          ],
        );
      } else {
        navigation?.navigate?.(targetRoute);
      }
    },
    [dirty, navigation],
  );

  if (loading) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Permission Configuration" onTabPress={handleTabPress} />

      <PermissionConfigHeader />

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

        <PermissionSaveBar
          dirty={dirty}
          saving={saving}
          onSave={handleSave}
          onViewAuditTrail={() => setShowAuditModal(true)}
        />
      </ScrollView>

      <RolePickerModal
        visible={dropdownOpen}
        roles={roles.length > 0 ? roles : DEFAULT_SYSTEM_ROLES}
        selectedRoleId={selectedRoleId}
        onSelectRole={handleSelectRole}
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
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    width: '100%',
  },
  contentTablet: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
});
