import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
  Pressable,
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

export const ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE'] as const;
export type ActionType = (typeof ACTIONS)[number];

export interface CatalogPermission {
  id?: string;
  action: string;
  action_label: string;
  resource: string;
  name: string;
}

export interface CatalogModule {
  id: string;
  name: string;
  description: string;
  resource: string;
  permissions: CatalogPermission[];
}

export interface PermissionRole {
  id: string;
  name: string;
  description?: string;
  is_system_critical?: boolean;
}

export type PermissionMatrix = Record<string, Record<ActionType, boolean>>;

const blankActions = (): Record<ActionType, boolean> => ({
  VIEW: false,
  CREATE: false,
  EDIT: false,
  DELETE: false,
  APPROVE: false,
});

// Standard fallback modules if catalog request is offline or loading
const FALLBACK_MODULES: CatalogModule[] = [
  {
    id: 'students',
    name: 'Students / Enrollment',
    description: 'Student records, enrollment pipeline, and documents',
    resource: 'students',
    permissions: [],
  },
  {
    id: 'assessments',
    name: 'Clinical Assessments',
    description: '6-Week ABLLS skills, MASS/FAST behavior, and preference assessments',
    resource: 'assessments',
    permissions: [],
  },
  {
    id: 'iups',
    name: 'IUP & Goal Management',
    description: 'IUP generation, Goal Bank, prompt levels, and mastery checks',
    resource: 'iups',
    permissions: [],
  },
  {
    id: 'sessions',
    name: 'Daily Active Therapy',
    description: 'Session blocks, real-time trial logging, and session summaries',
    resource: 'sessions',
    permissions: [],
  },
  {
    id: 'behavior_incidents',
    name: 'Behavior & ABC Logging',
    description: 'Behavior incident recording, ABC logs, and antecedent lists',
    resource: 'behavior_incidents',
    permissions: [],
  },
  {
    id: 'staff',
    name: 'Staff & Scheduling',
    description: 'Staff accounts, teacher-student linking, and room capacity limits',
    resource: 'staff',
    permissions: [],
  },
  {
    id: 'reports',
    name: 'Reports & Oversight',
    description: 'Oversight analytics, bi-annual progress reports, and exports',
    resource: 'reports',
    permissions: [],
  },
  {
    id: 'parent_portal',
    name: 'Parent Portal',
    description: 'Guardian updates, home observations, and staff messaging',
    resource: 'parent_portal',
    permissions: [],
  },
  {
    id: 'admin',
    name: 'System & Clinical Admin',
    description: 'Role definitions, permissions configuration, and institutional settings',
    resource: 'admin',
    permissions: [],
  },
];

export const DEFAULT_SYSTEM_ROLES: PermissionRole[] = [
  { id: 'system_admin', name: 'System Administrator', is_system_critical: true },
  { id: 'institutional_admin', name: 'Institutional Administrator', is_system_critical: true },
  { id: 'director', name: 'Director' },
  { id: 'program_director', name: 'Program Director' },
  { id: 'coordinator', name: 'Therapy Coordinator' },
  { id: 'teacher', name: 'Teacher' },
  { id: 'therapist', name: 'Therapist' },
  { id: 'parent', name: 'Parent' },
];

const ACTION_ALIAS_MAP: Record<string, ActionType> = {
  view: 'VIEW',
  index: 'VIEW',
  show: 'VIEW',
  read: 'VIEW',
  create: 'CREATE',
  edit: 'EDIT',
  update: 'EDIT',
  manage: 'EDIT',
  delete: 'DELETE',
  destroy: 'DELETE',
  approve: 'APPROVE',
  update_status: 'APPROVE',
};

const RESOURCE_ALIAS_MAP: Record<string, string> = {
  students: 'students',
  enrollments: 'students',
  forms: 'students',
  assessments: 'assessments',
  skills_assessments: 'assessments',
  behavior_assessments: 'assessments',
  preference_assessments: 'assessments',
  iups: 'iups',
  goals: 'iups',
  goal_domains: 'iups',
  prompt_levels: 'iups',
  sessions: 'sessions',
  trials: 'sessions',
  session_summaries: 'sessions',
  behavior_incidents: 'behavior_incidents',
  abc_lists: 'behavior_incidents',
  staff_members: 'staff',
  staff_scheduling: 'staff',
  session_block_definitions: 'staff',
  session_schedule_configs: 'staff',
  reports: 'reports',
  oversight: 'reports',
  audit_logs: 'reports',
  parent_communications: 'parent_portal',
  home_observations: 'parent_portal',
  roles: 'admin',
  clinical_configs: 'admin',
  form_configurations: 'admin',
};

interface BackendPermission {
  id?: string;
  resource?: string;
  action?: string;
  name?: string;
}

function toDisplayMatrix(permissions: unknown, modules: CatalogModule[]): PermissionMatrix {
  const matrix: PermissionMatrix = {};
  modules.forEach((mod) => {
    matrix[mod.name] = blankActions();
  });

  if (!Array.isArray(permissions)) return matrix;

  for (const p of permissions as BackendPermission[]) {
    const rawRes = (p.resource || '').toLowerCase();
    const rawAct = (p.action || '').toLowerCase();

    // Map resource to module id
    const mappedModId = RESOURCE_ALIAS_MAP[rawRes] || rawRes;
    const targetModule = modules.find(
      (m) =>
        m.id === mappedModId || m.resource === mappedModId || m.name.toLowerCase().includes(rawRes),
    );
    const targetAction = ACTION_ALIAS_MAP[rawAct];

    if (targetModule && targetAction) {
      matrix[targetModule.name] = {
        ...(matrix[targetModule.name] ?? blankActions()),
        [targetAction]: true,
      };
    }
  }

  return matrix;
}

interface AuditEntry {
  id?: string | number;
  date?: string;
  created_at?: string;
  user?: string;
  changed_by?: string;
  resource?: string;
  action?: string;
  roleName?: string;
  metadata?: Record<string, any>;
  change_data?: Record<string, any>;
}

export default function PermissionConfigurationScreen({
  navigation,
}: NativeStackScreenProps<SystemAdminStackParamList, 'PermissionConfiguration'>) {
  const { showToast } = useToast();
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

  const toggleCell = (moduleName: string, action: ActionType) => {
    setMatrix((prev) => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        [action]: !prev[moduleName]?.[action],
      },
    }));
    setDirty(true);
  };

  const toggleRow = (moduleName: string) => {
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
  };

  const toggleColumn = (action: ActionType) => {
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
  };

  const handleFullAccess = () => {
    const full: PermissionMatrix = {};
    displayModules.forEach((m) => {
      full[m.name] = { VIEW: true, CREATE: true, EDIT: true, DELETE: true, APPROVE: true };
    });
    setMatrix(full);
    setDirty(true);
  };

  const handleReadOnly = () => {
    const readOnly: PermissionMatrix = {};
    displayModules.forEach((m) => {
      readOnly[m.name] = { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
    });
    setMatrix(readOnly);
    setDirty(true);
  };

  const handleResetDefault = () => {
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
  };

  const handleCopyFromRole = async (sourceRoleId: string) => {
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
      // Fallback: copy local matrix state if API fails
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
  };

  // Collect checked permission UUIDs from the matrix and save
  const handleSave = async () => {
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

      // Refresh audit trail
      getPermissionAuditTrail(selectedRoleId)
        .then(({ data }) => setAuditTrail(Array.isArray(data) ? data : []))
        .catch(() => {});
    } catch (err) {
      showToast('Failed to save permissions. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Helper function to format actions into dynamic sentence strings
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

      <ScrollView contentContainerStyle={styles.content}>
        {/* Controls Bar */}
        <View style={styles.controlsRow}>
          <View style={{ gap: spacing.xs, minWidth: 220 }}>
            <Text style={typography.label}>Configuring Role</Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setDropdownOpen(true)}
              accessibilityRole="combobox"
              accessibilityLabel={`Configuring role: ${selectedRole.name}`}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 }}
              >
                <Feather name="shield" size={15} color="#0284C7" />
                <Text style={typography.bodyBold} numberOfLines={1}>
                  {selectedRole.name}
                </Text>
              </View>
              <Feather name="chevron-down" size={16} color={colors.navyText} />
            </TouchableOpacity>
          </View>

          {/* Preset action buttons (FR-018) */}
          <View style={styles.presetsRow}>
            <TouchableOpacity style={styles.presetBtn} onPress={handleFullAccess}>
              <Feather name="check-circle" size={12} color={colors.bodyText} />
              <Text style={styles.presetBtnText}>Full Access</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={handleReadOnly}>
              <Feather name="eye" size={12} color={colors.bodyText} />
              <Text style={styles.presetBtnText}>Read Only</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={handleResetDefault}>
              <Feather name="rotate-ccw" size={12} color={colors.bodyText} />
              <Text style={styles.presetBtnText}>Reset to Default</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={() => setCopyModalOpen(true)}>
              <Feather name="copy" size={12} color={colors.bodyText} />
              <Text style={styles.presetBtnText}>Copy from Role...</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Permission Grid Card */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.columnHeader, { flex: 2.2 }]}>MODULE</Text>
            {ACTIONS.map((act) => (
              <TouchableOpacity
                key={act}
                style={[styles.columnHeaderCell, { flex: 1 }]}
                onPress={() => toggleColumn(act)}
              >
                <Text style={styles.columnHeader}>{act}</Text>
                <Feather name="check-square" size={12} color="#0284C7" />
              </TouchableOpacity>
            ))}
            <Text style={[styles.columnHeader, { flex: 0.8, textAlign: 'center' }]}>ALL</Text>
          </View>

          {displayModules.map((mod) => {
            const isRowAllChecked = ACTIONS.every((a) => matrix[mod.name]?.[a]);

            return (
              <View key={mod.id || mod.name} style={styles.tableRow}>
                <View style={{ flex: 2.2 }}>
                  <Text style={typography.bodyBold}>{mod.name}</Text>
                  {mod.description ? (
                    <Text
                      style={[typography.caption, { color: colors.mutedText }]}
                      numberOfLines={1}
                    >
                      {mod.description}
                    </Text>
                  ) : null}
                </View>

                {ACTIONS.map((act) => {
                  const checked = !!matrix[mod.name]?.[act];
                  return (
                    <TouchableOpacity
                      key={act}
                      style={styles.cellBtn}
                      onPress={() => toggleCell(mod.name, act)}
                      accessibilityLabel={`Toggle ${act} on ${mod.name}`}
                    >
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && <Feather name="check" size={12} color={colors.white} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.cellBtn}
                  onPress={() => toggleRow(mod.name)}
                  accessibilityLabel={`Toggle all permissions for ${mod.name}`}
                >
                  <View style={[styles.checkbox, isRowAllChecked && styles.checkboxCheckedRowAll]}>
                    {isRowAllChecked && <Feather name="check" size={12} color={colors.navyText} />}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Dynamic Permission Summary Component */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            PERMISSION SUMMARY — {selectedRole.name.toUpperCase()}
          </Text>
          {summaryList.length === 0 ? (
            <Text style={styles.summaryTextEmpty}>
              No active permissions configured for this role.
            </Text>
          ) : (
            summaryList.map((statement, idx) => (
              <View key={idx} style={styles.summaryRow}>
                <Feather name="check" size={14} color="#10B981" />
                <Text style={styles.summaryText}>{statement}</Text>
              </View>
            ))
          )}
        </View>

        {/* Bottom Actions Row */}
        <View style={styles.bottomActionsRow}>
          <TouchableOpacity
            style={[styles.saveConfigBtn, (!dirty || saving) && styles.saveConfigBtnDisabled]}
            disabled={!dirty || saving}
            onPress={handleSave}
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

          <TouchableOpacity style={styles.auditTrailLink} onPress={() => setShowAuditModal(true)}>
            <Feather name="file-text" size={14} color="#0284C7" />
            <Text style={styles.auditTrailLinkText}>View Audit Trail</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Role Selection Dropdown Modal */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <View style={styles.dropdownModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDropdownOpen(false)} />
          <View style={styles.rolePickerCard}>
            <View style={styles.rolePickerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Feather name="shield" size={18} color="#0284C7" />
                <Text style={typography.h2}>Select Role to Configure</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDropdownOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={18} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <Text style={typography.caption}>
              Choose a role below to view, manage, and audit its access permissions across all
              modules.
            </Text>

            <ScrollView style={styles.rolePickerList} showsVerticalScrollIndicator={true}>
              {(roles.length > 0 ? roles : DEFAULT_SYSTEM_ROLES).map((r) => {
                const isSelected = selectedRoleId === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.rolePickerItem, isSelected && styles.rolePickerItemActive]}
                    onPress={() => {
                      setSelectedRoleId(r.id);
                      setDropdownOpen(false);
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                        flex: 1,
                      }}
                    >
                      <View
                        style={[styles.roleIconCircle, isSelected && styles.roleIconCircleActive]}
                      >
                        <Feather
                          name="shield"
                          size={14}
                          color={isSelected ? colors.white : colors.navyText}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.bodyBold, isSelected && { color: '#0284C7' }]}>
                          {r.name}
                        </Text>
                        {r.description ? (
                          <Text style={typography.caption} numberOfLines={1}>
                            {r.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {isSelected && (
                      <View style={styles.roleSelectedBadge}>
                        <Feather name="check" size={14} color="#0284C7" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Copy Modal (FR-018) */}
      <Modal
        visible={copyModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCopyModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={typography.h2}>Copy Permissions From</Text>
            <Text style={typography.caption}>
              Select a role to copy all permissions into {selectedRole.name}:
            </Text>
            <ScrollView style={{ maxHeight: 260, marginVertical: spacing.md }}>
              {roles
                .filter((r) => r.id !== selectedRoleId)
                .map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={styles.copyRoleOption}
                    onPress={() => handleCopyFromRole(r.id)}
                  >
                    <Text style={typography.bodyBold}>{r.name}</Text>
                    <Feather name="arrow-right" size={14} color={colors.navyText} />
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setCopyModalOpen(false)}>
              <Text style={styles.closeModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Audit Trail Modal */}
      <Modal
        visible={showAuditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAuditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={typography.h2}>Audit Trail</Text>
            <Text style={typography.caption}>
              Recent permission changes for {selectedRole.name}
            </Text>
            <ScrollView style={{ maxHeight: 300, marginVertical: spacing.md }}>
              {auditTrail.length === 0 ? (
                <Text
                  style={[typography.caption, { fontStyle: 'italic', paddingVertical: spacing.md }]}
                >
                  No recorded audit log changes for this role.
                </Text>
              ) : (
                auditTrail.map((a, i) => {
                  const dateStr = a.created_at || a.date || '';
                  const userStr = a.changed_by || a.user || 'Administrator';
                  const actionStr = a.action || 'update_permissions';
                  return (
                    <View key={a.id || i} style={styles.auditItem}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={typography.bodyBold}>{userStr}</Text>
                        <Text style={typography.caption}>
                          {dateStr ? new Date(dateStr).toLocaleString() : ''}
                        </Text>
                      </View>
                      <Text style={[typography.caption, { color: colors.navyText }]}>
                        Action: {actionStr}
                      </Text>
                      {a.change_data?.added?.length ? (
                        <Text style={[typography.caption, { color: '#10B981' }]}>
                          + Added {a.change_data.added.length} permission(s)
                        </Text>
                      ) : null}
                      {a.change_data?.removed?.length ? (
                        <Text style={[typography.caption, { color: '#EF4444' }]}>
                          - Removed {a.change_data.removed.length} permission(s)
                        </Text>
                      ) : null}
                    </View>
                  );
                })
              )}
            </ScrollView>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowAuditModal(false)}>
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    minWidth: 220,
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  rolePickerCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  rolePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rolePickerList: {
    maxHeight: 320,
  },
  rolePickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.bgApp,
  },
  rolePickerItemActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  roleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconCircleActive: {
    backgroundColor: '#0284C7',
  },
  roleSelectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
  tableCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  columnHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navyText,
    letterSpacing: 0.5,
  },
  columnHeaderCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cellBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgApp,
  },
  checkboxChecked: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  checkboxCheckedRowAll: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  summaryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 13,
    color: colors.navyText,
  },
  summaryTextEmpty: {
    fontSize: 13,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  copyRoleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  closeModalBtn: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  closeModalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mutedText,
  },
  auditItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 2,
  },
});
