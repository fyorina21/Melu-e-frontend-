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
  TextInput,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { SYS_ROUTE_BY_TAB } from '../../components/appNavConfig';
import {
  getRoles,
  getPermissionMatrix,
  savePermissionMatrix,
  resetDefaultPermissions,
  copyPermissionsFromRole,
  getPermissionAuditTrail,
  getPermissionsCatalog,
} from '../../api/SystemAdminApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SystemAdminStackParamList, Role } from '../../types';

// Re-export pure helpers, types, and constants for backward compatibility
export {
  ACTIONS,
  type ActionType,
  type PermissionMatrix,
  type AppPageModule,
  type PermissionRole,
  type AuditEntry,
  ALL_PAGE_MODULES,
  getDefaultMatrixForRole,
} from './permissionConfigHelpers';

import {
  ACTIONS,
  type ActionType,
  type PermissionMatrix,
  type AppPageModule,
  type PermissionRole,
  type AuditEntry,
  type CatalogPermission,
  ALL_PAGE_MODULES,
  getDefaultMatrixForRole,
  mapBackendPermissionsToMatrix,
  applyPermissionDependencies,
  checkHighRiskPermission,
  filterPageModules,
  groupPagesByCategory,
  buildSavePayload,
  blankActions,
} from './permissionConfigHelpers';

const ROLE_FILTER_OPTIONS = [
  'All',
  'Director',
  'Program Director',
  'Therapy Coordinator',
  'Teacher / Therapist',
  'Institutional Admin',
  'System Admin',
  'Parent',
];

const ROLE_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  director: { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' },
  program_director: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  coordinator: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  teacher: { bg: '#F0F9FF', text: '#0284C7', border: '#BAE6FD' },
  institutional_admin: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  system_admin: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  parent: { bg: '#FEFCE8', text: '#A16207', border: '#FEF08A' },
};

export default function PermissionConfigurationScreen({
  navigation,
}: NativeStackScreenProps<SystemAdminStackParamList, 'PermissionConfiguration'>) {
  const { showToast } = useToast();
  const { session } = useAuth();

  const [roles, setRoles] = useState<PermissionRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [matrix, setMatrix] = useState<PermissionMatrix>({});
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [catalogPermissions, setCatalogPermissions] = useState<CatalogPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [groupedView, setGroupedView] = useState(true);

  // Modals & Confirmation dialogs
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [highRiskPrompt, setHighRiskPrompt] = useState<{
    page: AppPageModule;
    action: ActionType;
    reason: string;
  } | null>(null);

  // Load available roles & catalog
  const loadRoles = useCallback(async () => {
    try {
      const { data } = await getRoles();
      const list = Array.isArray(data) ? data : [];
      setRoles(list);
      setSelectedRoleId((prev) => prev || list[0]?.id || '');
    } catch {
      setRoles([]);
    }

    try {
      const { data: catalog } = await getPermissionsCatalog();
      if (Array.isArray(catalog?.all_permissions)) {
        setCatalogPermissions(catalog.all_permissions);
      }
    } catch {
      // Backend catalog optional
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // Load matrix for selected role with strict backend authority
  const loadRolePermissions = useCallback(async (roleId: string, roleName: string) => {
    if (!roleId) return;

    try {
      const { data } = await getPermissionMatrix(roleId);
      const backendPerms = data?.permissions;
      // Strict backend authority: derive matrix from server response
      const serverMatrix = mapBackendPermissionsToMatrix(backendPerms, roleName);
      setMatrix(serverMatrix);
      setDirty(false);
    } catch (err) {
      // If server request fails, load safe least-privilege defaults
      setMatrix(getDefaultMatrixForRole(roleName));
      setDirty(false);
      showToast('Could not reach permissions server. Displaying role defaults.', 'info');
    }

    // Load audit trail
    try {
      const { data } = await getPermissionAuditTrail(roleId);
      if (Array.isArray(data)) {
        const formatted: AuditEntry[] = data.map((a: any) => ({
          id: String(a.id || Math.random()),
          date: a.created_at ? new Date(a.created_at).toLocaleString() : a.date || 'Recent',
          user: a.changed_by || a.metadata?.updated_by || a.user || 'System Admin',
          resource: a.resource_type || a.resource || 'Role Permissions',
          action: (a.action || 'Updated permissions').replace(/_/g, ' '),
          roleName: a.metadata?.role_name || a.roleName || roleName,
          changeData: a.change_data,
        }));
        setAuditTrail(formatted);
      }
    } catch {
      setAuditTrail([]);
    }
  }, [showToast]);

  useEffect(() => {
    if (!selectedRoleId) return;
    const currentRole = roles.find((r) => r.id === selectedRoleId);
    const roleName = currentRole?.name || selectedRoleId;
    loadRolePermissions(selectedRoleId, roleName);
  }, [selectedRoleId, roles, loadRolePermissions]);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || { id: selectedRoleId, name: selectedRoleId },
    [roles, selectedRoleId]
  );

  // Filtered pages based on search query and role filter
  const filteredPages = useMemo(() => {
    return filterPageModules(ALL_PAGE_MODULES, searchQuery, roleFilter);
  }, [searchQuery, roleFilter]);

  // Grouped pages by category
  const categorizedPages = useMemo(() => {
    return groupPagesByCategory(filteredPages);
  }, [filteredPages]);

  // Cell toggle with dependency enforcement and high-risk detection
  const performToggleCell = (pageId: string, action: ActionType) => {
    setMatrix((prev) => {
      const current = prev[pageId] ?? blankActions();
      const nextVal = !current[action];
      const updated = applyPermissionDependencies(current, action, nextVal);
      return { ...prev, [pageId]: updated };
    });
    setDirty(true);
  };

  const handleCellPress = (page: AppPageModule, action: ActionType) => {
    const current = matrix[page.id] ?? blankActions();
    const willEnable = !current[action];

    if (willEnable) {
      const hr = checkHighRiskPermission(page, action, selectedRole.name);
      if (hr.isHighRisk) {
        setHighRiskPrompt({
          page,
          action,
          reason: hr.reason || 'This permission grants elevated capabilities.',
        });
        return;
      }
    }

    performToggleCell(page.id, action);
  };

  const toggleRow = (pageId: string) => {
    setMatrix((prev) => {
      const currentVal = prev[pageId] ?? blankActions();
      const allChecked = ACTIONS.every((a) => currentVal[a]);
      const nextState: Record<ActionType, boolean> = allChecked
        ? blankActions()
        : { VIEW: true, CREATE: true, EDIT: true, DELETE: true, APPROVE: true };
      return { ...prev, [pageId]: nextState };
    });
    setDirty(true);
  };

  const toggleColumn = (action: ActionType) => {
    setMatrix((prev) => {
      const allChecked = filteredPages.every((page) => prev[page.id]?.[action]);
      const updated = { ...prev };
      filteredPages.forEach((page) => {
        const cur = updated[page.id] ?? blankActions();
        updated[page.id] = applyPermissionDependencies(cur, action, !allChecked);
      });
      return updated;
    });
    setDirty(true);
  };

  const toggleAllVisible = () => {
    setMatrix((prev) => {
      const allChecked = filteredPages.every((p) =>
        ACTIONS.every((a) => prev[p.id]?.[a])
      );
      const updated = { ...prev };
      filteredPages.forEach((p) => {
        updated[p.id] = allChecked
          ? blankActions()
          : { VIEW: true, CREATE: true, EDIT: true, DELETE: true, APPROVE: true };
      });
      return updated;
    });
    setDirty(true);
  };

  // Quick Action Presets
  const handleFullAccess = () => {
    const full: PermissionMatrix = { ...matrix };
    filteredPages.forEach((p) => {
      full[p.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: true, APPROVE: true };
    });
    setMatrix(full);
    setDirty(true);
  };

  const handleReadOnly = () => {
    const ro: PermissionMatrix = { ...matrix };
    filteredPages.forEach((p) => {
      ro[p.id] = { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
    });
    setMatrix(ro);
    setDirty(true);
  };

  const handleRoleRecommended = () => {
    const recommended = getDefaultMatrixForRole(selectedRole.name);
    setMatrix(recommended);
    setDirty(true);
    showToast(`Loaded least-privilege defaults for ${selectedRole.name}`, 'info');
  };

  const handleClearAll = () => {
    const empty: PermissionMatrix = { ...matrix };
    filteredPages.forEach((p) => {
      empty[p.id] = blankActions();
    });
    setMatrix(empty);
    setDirty(true);
  };

  // Copy authoritative permissions from source role
  const handleCopyFromRole = async (sourceRoleId: string) => {
    const sourceRole = roles.find((r) => r.id === sourceRoleId);
    if (!sourceRole) return;

    try {
      const { data } = await getPermissionMatrix(sourceRoleId);
      const sourcePerms = data?.permissions;
      // Copy exact authoritative permissions from server
      const mapped = mapBackendPermissionsToMatrix(sourcePerms, sourceRole.name);
      setMatrix(mapped);
      setDirty(true);
      setCopyModalOpen(false);
      showToast(
        `Copied authoritative permissions from "${sourceRole.name}". Review and save to confirm.`,
        'success'
      );
    } catch {
      setCopyModalOpen(false);
      showToast('Failed to fetch source role permissions from server.', 'error');
    }
  };

  // Reset to Defaults with backend confirmation
  const handleResetDefault = () => {
    Alert.alert(
      'Reset Permissions to System Defaults?',
      `Are you sure you want to reset all permissions for ${selectedRole.name}? This will enforce least-privilege system defaults on the server.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Default',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await resetDefaultPermissions(selectedRoleId);
              const serverPerms = res?.data?.permissions;
              const defaults = mapBackendPermissionsToMatrix(serverPerms, selectedRole.name);
              setMatrix(defaults);
              setDirty(false);

              // Record confirmed audit entry
              const resetAudit: AuditEntry = {
                id: String(Date.now()),
                date: new Date().toLocaleString(),
                user: session?.userName || 'System Admin',
                resource: 'Role Permissions',
                action: 'Reset to system defaults',
                roleName: selectedRole.name,
              };
              setAuditTrail((prev) => [resetAudit, ...prev]);
              showToast(`Permissions for ${selectedRole.name} reset to defaults`, 'success');
            } catch {
              showToast(
                'Failed to reset permissions on server. No changes were applied.',
                'error'
              );
            }
          },
        },
      ]
    );
  };

  // Save Configuration Handler with backend authority & error handling
  const executeSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    setShowReviewModal(false);

    try {
      const payload = buildSavePayload(matrix, catalogPermissions, selectedRole.name);

      const res = await savePermissionMatrix(selectedRoleId, {
        matrix: payload.matrix,
        permission_ids: payload.permission_ids,
      });

      // Update state with confirmed server response
      const confirmedPerms = res?.data?.permissions;
      if (Array.isArray(confirmedPerms)) {
        const confirmedMatrix = mapBackendPermissionsToMatrix(confirmedPerms, selectedRole.name);
        setMatrix(confirmedMatrix);
      }

      // Record confirmed audit entry
      const newAudit: AuditEntry = {
        id: String(Date.now()),
        date: new Date().toLocaleString(),
        user: session?.userName || 'System Admin',
        resource: 'Role Permissions',
        action: 'Updated page permissions',
        roleName: selectedRole.name,
        changeData: { activePermissions: payload.activeCount },
      };
      setAuditTrail((prev) => [newAudit, ...prev]);

      setDirty(false);
      showToast(`Permissions for "${selectedRole.name}" successfully saved!`, 'success');
    } catch {
      // Preserve unsaved changes, keep dirty = true, allow retries
      showToast(
        'Failed to save permissions to server. Your unsaved changes are preserved—please retry.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  // Permission summary statistics
  const { activeCount, totalPossible, highRiskCount } = useMemo(() => {
    const payload = buildSavePayload(matrix, catalogPermissions, selectedRole.name);
    return {
      activeCount: payload.activeCount,
      totalPossible: ALL_PAGE_MODULES.length * ACTIONS.length,
      highRiskCount: payload.highRiskCount,
    };
  }, [matrix, catalogPermissions, selectedRole.name]);

  if (loading) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Permissions"
        onTabPress={(t) => navigation?.navigate?.(SYS_ROUTE_BY_TAB[t])}
      />

      <View style={styles.subHeader}>
        <View style={styles.titleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.headerIconWrap}>
              <Feather name="shield" size={20} color={colors.navyText} />
            </View>
            <View>
              <Text style={typography.h1}>Role-Based Permission Configuration</Text>
              <Text style={styles.breadcrumbText}>
                System Administration · Granular Page & Action Privileges per Role
              </Text>
            </View>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>RBAC MATRIX</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Control Bar: Role Selection & Quick Presets */}
        <View style={styles.controlsCard}>
          <View style={styles.roleSelectorBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.fieldLabel}>ACTIVE ROLE TO CONFIGURE</Text>
              {dirty && (
                <View style={[styles.unsavedBadge, { marginBottom: 6 }]}>
                  <Feather name="alert-circle" size={12} color="#D97706" />
                  <Text style={styles.unsavedBadgeText}>Unsaved Changes</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setDropdownOpen(!dropdownOpen)}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownBtnContent}>
                <Feather name="user-check" size={16} color="#0284C7" />
                <Text style={styles.dropdownBtnText}>{selectedRole.name}</Text>
              </View>
              <Feather name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.navyText} />
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
                  {roles.map((r) => {
                    const isSelected = selectedRoleId === r.id;
                    return (
                      <TouchableOpacity
                        key={r.id}
                        style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                        onPress={() => {
                          setSelectedRoleId(r.id);
                          setDropdownOpen(false);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.dropdownItemTitle, isSelected && styles.dropdownItemTitleActive]}>
                            {r.name}
                          </Text>
                          {Boolean(r.description) && (
                            <Text style={styles.dropdownItemDesc} numberOfLines={1}>
                              {r.description}
                            </Text>
                          )}
                        </View>
                        {isSelected && <Feather name="check" size={16} color="#0284C7" />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.presetsBox}>
            <Text style={styles.fieldLabel}>QUICK PERMISSION ACTIONS</Text>
            <View style={styles.presetsRow}>
              <TouchableOpacity style={styles.presetBtn} onPress={handleRoleRecommended}>
                <Feather name="shield" size={13} color="#0284C7" />
                <Text style={styles.presetBtnText}>Defaults</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={handleFullAccess}>
                <Feather name="check-circle" size={13} color="#059669" />
                <Text style={styles.presetBtnText}>Full Access</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={handleReadOnly}>
                <Feather name="eye" size={13} color="#0284C7" />
                <Text style={styles.presetBtnText}>Read Only</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={() => setCopyModalOpen(true)}>
                <Feather name="copy" size={13} color="#475569" />
                <Text style={styles.presetBtnText}>Copy Role...</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={handleClearAll}>
                <Feather name="x-circle" size={13} color="#DC2626" />
                <Text style={styles.presetBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtnDanger} onPress={handleResetDefault}>
                <Feather name="rotate-ccw" size={13} color="#DC2626" />
                <Text style={styles.presetBtnTextDanger}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Filter & Search Toolbar */}
        <View style={styles.filterToolbar}>
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color="#64748B" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search application pages by name, route, or category..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {Boolean(searchQuery) && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.roleFilterStrip}
          >
            {ROLE_FILTER_OPTIONS.map((opt) => {
              const active = roleFilter === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.roleFilterTab, active && styles.roleFilterTabActive]}
                  onPress={() => setRoleFilter(opt)}
                >
                  <Text style={[styles.roleFilterTabText, active && styles.roleFilterTabTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.filterMetaRow}>
            <Text style={styles.filterCountText}>
              Showing {filteredPages.length} of {ALL_PAGE_MODULES.length} application pages
            </Text>
            <TouchableOpacity
              style={styles.groupToggleBtn}
              onPress={() => setGroupedView((v) => !v)}
            >
              <Feather name={groupedView ? 'list' : 'layers'} size={13} color="#0284C7" />
              <Text style={styles.groupToggleText}>
                {groupedView ? 'Grouped by Category' : 'Flat List'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Matrix Grid Table */}
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={{ minWidth: 880 }}>
              {/* Header */}
              <View style={styles.tableHeaderRow}>
                <View style={{ width: 380, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.columnHeader}>APPLICATION PAGE MODULE ({filteredPages.length})</Text>
                </View>

                {ACTIONS.map((act) => (
                  <TouchableOpacity
                    key={act}
                    style={styles.columnHeaderCell}
                    onPress={() => toggleColumn(act)}
                    accessibilityLabel={`Toggle all ${act}`}
                  >
                    <Text style={styles.columnHeader}>{act}</Text>
                    <Feather name="check-square" size={12} color="#0284C7" />
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[styles.columnHeaderCell, { width: 60 }]}
                  onPress={toggleAllVisible}
                  accessibilityLabel="Toggle all actions"
                >
                  <Text style={styles.columnHeader}>ALL</Text>
                  <Feather name="toggle-left" size={13} color="#0284C7" />
                </TouchableOpacity>
              </View>

              {/* Rows */}
              {filteredPages.length === 0 ? (
                <View style={styles.emptyResultsBox}>
                  <Feather name="search" size={28} color="#94A3B8" />
                  <Text style={styles.emptyResultsText}>No application pages match the current filter.</Text>
                </View>
              ) : groupedView ? (
                Object.entries(categorizedPages).map(([categoryName, pages]) => (
                  <View key={categoryName}>
                    {/* Category Section Banner */}
                    <View style={styles.categoryHeaderRow}>
                      <Feather name="folder" size={14} color="#0369A1" />
                      <Text style={styles.categoryHeaderText}>{categoryName}</Text>
                      <View style={styles.categoryBadgePill}>
                        <Text style={styles.categoryBadgePillText}>{pages.length} pages</Text>
                      </View>
                    </View>

                    {pages.map((page, idx) =>
                      renderTableRow(page, idx, matrix, selectedRole.name, handleCellPress, toggleRow)
                    )}
                  </View>
                ))
              ) : (
                filteredPages.map((page, idx) =>
                  renderTableRow(page, idx, matrix, selectedRole.name, handleCellPress, toggleRow)
                )
              )}
            </View>
          </ScrollView>
        </View>

        {/* Permission Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeaderRow}>
            <View>
              <Text style={styles.summaryTitle}>
                PERMISSION SUMMARY — {selectedRole.name.toUpperCase()}
              </Text>
              <Text style={styles.summarySub}>
                {activeCount} of {totalPossible} total available permissions granted
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {highRiskCount > 0 && (
                <View style={[styles.statCapsule, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                  <Feather name="alert-triangle" size={12} color="#DC2626" />
                  <Text style={[styles.statCapsuleText, { color: '#DC2626' }]}>
                    {highRiskCount} Elevated
                  </Text>
                </View>
              )}
              <View style={styles.statCapsule}>
                <Text style={styles.statCapsuleText}>{activeCount} Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Actions Bar */}
        <View style={styles.bottomActionsRow}>
          <TouchableOpacity
            style={[styles.saveConfigBtn, (!dirty || saving) && styles.saveConfigBtnDisabled]}
            disabled={!dirty || saving}
            onPress={() => setShowReviewModal(true)}
          >
            <Feather name={saving ? 'loader' : 'save'} size={17} color={colors.navyText} />
            <Text style={styles.saveConfigBtnText}>
              {saving ? 'Saving...' : dirty ? 'Review & Save Configuration' : 'Configuration Saved'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.auditTrailLink}
            onPress={() => setShowAuditModal(true)}
          >
            <Feather name="clock" size={14} color="#0284C7" />
            <Text style={styles.auditTrailLinkText}>View Audit Trail ({auditTrail.length})</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* High-Risk Permission Confirmation Modal */}
      <Modal visible={Boolean(highRiskPrompt)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 480 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <View style={styles.highRiskIconBox}>
                <Feather name="alert-triangle" size={20} color="#DC2626" />
              </View>
              <Text style={typography.h2}>High-Risk Permission</Text>
            </View>
            <Text style={styles.highRiskPromptText}>
              {highRiskPrompt?.reason}
            </Text>
            <Text style={[styles.highRiskPromptText, { marginTop: 8, fontWeight: '600' }]}>
              Page: {highRiskPrompt?.page.name} ({highRiskPrompt?.page.route})
              {'\n'}Action: {highRiskPrompt?.action}
              {'\n'}Role: {selectedRole.name}
            </Text>
            <View style={styles.highRiskActionsRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setHighRiskPrompt(null)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmHighRiskBtn}
                onPress={() => {
                  if (highRiskPrompt) {
                    performToggleCell(highRiskPrompt.page.id, highRiskPrompt.action);
                    setHighRiskPrompt(null);
                  }
                }}
              >
                <Text style={styles.confirmHighRiskBtnText}>Acknowledge & Enable</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Review Summary Before Saving Modal */}
      <Modal visible={showReviewModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 540 }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="check-circle" size={20} color="#0284C7" />
                <Text style={typography.h2}>Review Changes Before Saving</Text>
              </View>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Feather name="x" size={18} color={colors.navyText} />
              </TouchableOpacity>
            </View>

            <Text style={typography.caption}>
              Confirm permission updates for <Text style={{ fontWeight: '700' }}>{selectedRole.name}</Text>:
            </Text>

            <View style={styles.reviewStatsRow}>
              <View style={styles.reviewStatCard}>
                <Text style={styles.reviewStatLabel}>TOTAL ACTIVE</Text>
                <Text style={styles.reviewStatValue}>{activeCount}</Text>
              </View>
              <View style={styles.reviewStatCard}>
                <Text style={styles.reviewStatLabel}>TARGET ROLE</Text>
                <Text style={[styles.reviewStatValue, { fontSize: 13 }]}>{selectedRole.name}</Text>
              </View>
              <View style={styles.reviewStatCard}>
                <Text style={styles.reviewStatLabel}>STATUS</Text>
                <Text style={[styles.reviewStatValue, { color: '#059669', fontSize: 13 }]}>Ready</Text>
              </View>
            </View>

            {highRiskCount > 0 && (
              <View style={styles.highRiskBanner}>
                <Feather name="alert-triangle" size={16} color="#DC2626" />
                <Text style={styles.highRiskBannerText}>
                  Notice: {highRiskCount} elevated or high-risk permission assignments detected.
                </Text>
              </View>
            )}

            <View style={styles.reviewModalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowReviewModal(false)}
                disabled={saving}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmSaveBtn}
                onPress={executeSave}
                disabled={saving}
              >
                <Feather name={saving ? 'loader' : 'check'} size={16} color={colors.navyText} />
                <Text style={styles.confirmSaveBtnText}>
                  {saving ? 'Saving to Server...' : 'Confirm & Save to Backend'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Copy From Role Modal */}
      <Modal visible={copyModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={typography.h2}>Copy Permissions From Role</Text>
              <TouchableOpacity onPress={() => setCopyModalOpen(false)}>
                <Feather name="x" size={18} color={colors.navyText} />
              </TouchableOpacity>
            </View>
            <Text style={typography.caption}>
              Select a source role. Its server-verified permissions will be loaded into{' '}
              <Text style={{ fontWeight: '700' }}>{selectedRole.name}</Text>:
            </Text>
            <ScrollView style={{ maxHeight: 260 }}>
              {roles
                .filter((r) => r.id !== selectedRoleId)
                .map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={styles.copyRoleOption}
                    onPress={() => handleCopyFromRole(r.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={typography.bodyBold}>{r.name}</Text>
                      {Boolean(r.description) && (
                        <Text style={styles.dropdownItemDesc}>{r.description}</Text>
                      )}
                    </View>
                    <Feather name="arrow-right" size={16} color="#0284C7" />
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setCopyModalOpen(false)}
            >
              <Text style={styles.closeModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Audit Trail Modal */}
      <Modal visible={showAuditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 540 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={typography.h2}>Role Permission Audit Trail</Text>
              <TouchableOpacity onPress={() => setShowAuditModal(false)}>
                <Feather name="x" size={18} color={colors.navyText} />
              </TouchableOpacity>
            </View>
            <Text style={typography.caption}>
              Change history log for <Text style={{ fontWeight: '700' }}>{selectedRole.name}</Text>:
            </Text>
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator>
              {auditTrail.length === 0 ? (
                <Text style={styles.summaryTextEmpty}>No recorded audit events for this role yet.</Text>
              ) : (
                auditTrail.map((a, i) => (
                  <View key={a.id || i} style={styles.auditEntryRow}>
                    <View style={styles.auditEntryDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.auditEntryTitle}>
                        {a.action} by <Text style={{ fontWeight: '700' }}>{a.user}</Text>
                      </Text>
                      <Text style={styles.auditEntryMeta}>
                        Target: {a.roleName} · {a.date}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowAuditModal(false)}
            >
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function renderTableRow(
  page: AppPageModule,
  idx: number,
  matrix: PermissionMatrix,
  roleName: string,
  onCellPress: (page: AppPageModule, action: ActionType) => void,
  onRowToggle: (pageId: string) => void
) {
  const rowAllChecked = ACTIONS.every((a) => matrix[page.id]?.[a]);
  const badgeStyle = ROLE_BADGE_COLORS[page.roleKey] || {
    bg: '#F1F5F9',
    text: '#475569',
    border: '#CBD5E1',
  };

  return (
    <View
      key={page.id}
      style={[
        styles.tableRow,
        idx % 2 === 1 && styles.tableRowAlt,
        rowAllChecked && styles.tableRowAllActive,
      ]}
    >
      {/* Page Module Info */}
      <View style={{ width: 380, paddingRight: spacing.sm }}>
        <View style={styles.pageTitleRow}>
          <Text style={styles.pageNameText}>{page.name}</Text>
          <View
            style={[
              styles.roleBadgePill,
              {
                backgroundColor: badgeStyle.bg,
                borderColor: badgeStyle.border,
              },
            ]}
          >
            <Text style={[styles.roleBadgePillText, { color: badgeStyle.text }]}>
              {page.role}
            </Text>
          </View>
        </View>
        <Text style={styles.pageDescText} numberOfLines={1}>
          {page.description}
        </Text>
        <Text style={styles.pageRouteMeta}>
          Route: <Text style={{ fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) }}>{page.route}</Text> · {page.category}
        </Text>
      </View>

      {/* Actions Checkboxes */}
      {ACTIONS.map((act) => {
        const checked = !!matrix[page.id]?.[act];
        const isHR = checkHighRiskPermission(page, act, roleName).isHighRisk;

        return (
          <TouchableOpacity
            key={act}
            style={styles.cellBtn}
            onPress={() => onCellPress(page, act)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                checked && styles.checkboxChecked,
                isHR && checked && styles.checkboxHighRisk,
              ]}
            >
              {checked && <Feather name="check" size={13} color={colors.white} />}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Row ALL Checkbox */}
      <TouchableOpacity
        style={[styles.cellBtn, { width: 60 }]}
        onPress={() => onRowToggle(page.id)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            styles.checkboxRowAll,
            rowAllChecked && styles.checkboxRowAllChecked,
          ]}
        >
          {rowAllChecked && <Feather name="check" size={13} color={colors.navyText} />}
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  subHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  breadcrumbText: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 60,
  },

  /* Controls Card */
  controlsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    zIndex: 50,
  },
  roleSelectorBox: {
    flex: 1,
    minWidth: 260,
    position: 'relative',
    zIndex: 60,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 42,
    backgroundColor: colors.bgCard,
  },
  dropdownBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 68,
    left: 0,
    right: 0,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    zIndex: 100,
    ...makeShadow(4, 12, 0.15, '0, 0, 0', 8),
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemActive: {
    backgroundColor: '#F0F9FF',
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  dropdownItemTitleActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  dropdownItemDesc: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },

  presetsBox: {
    flexDirection: 'column',
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 8,
    backgroundColor: colors.bgApp,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
  presetBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
  },
  presetBtnTextDanger: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },

  /* Filter & Search Toolbar */
  filterToolbar: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.navyText,
  },
  roleFilterStrip: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  roleFilterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bgApp,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleFilterTabActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellowDark,
  },
  roleFilterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.bodyText,
  },
  roleFilterTabTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
  filterMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  filterCountText: {
    fontSize: 12,
    color: colors.mutedText,
  },
  groupToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: '#F0F9FF',
  },
  groupToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  unsavedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  unsavedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },

  /* Table Grid */
  tableCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...makeShadow(2, 6, 0.05, '0, 0, 0', 4),
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  columnHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.5,
  },
  columnHeaderCell: {
    width: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: '#F0F9FF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#BAE6FD',
  },
  categoryHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryBadgePill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  categoryBadgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  tableRowAllActive: {
    backgroundColor: '#F0FDF4',
  },
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  pageNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  roleBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  roleBadgePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pageDescText: {
    fontSize: 11,
    color: colors.mutedText,
    marginBottom: 2,
  },
  pageRouteMeta: {
    fontSize: 10,
    color: '#94A3B8',
  },
  cellBtn: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  checkboxHighRisk: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  checkboxRowAll: {
    borderRadius: radius.pill,
  },
  checkboxRowAllChecked: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellowDark,
  },
  emptyResultsBox: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyResultsText: {
    fontSize: 13,
    color: colors.mutedText,
  },

  /* Summary Card */
  summaryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
    letterSpacing: 0.5,
  },
  summarySub: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  statCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  statCapsuleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  /* Bottom Actions */
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  saveConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryYellowDark,
    ...makeShadow(1, 4, 0.1, '0, 0, 0', 3),
  },
  saveConfigBtnDisabled: {
    opacity: 0.6,
  },
  saveConfigBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
  auditTrailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
  },
  auditTrailLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...makeShadow(4, 16, 0.25, '0, 0, 0', 12),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyRoleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeModalBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  closeModalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  auditEntryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  auditEntryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284C7',
    marginTop: 5,
  },
  auditEntryTitle: {
    fontSize: 12,
    color: colors.navyText,
  },
  auditEntryMeta: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
  summaryTextEmpty: {
    fontSize: 12,
    color: colors.mutedText,
    fontStyle: 'italic',
    paddingVertical: 8,
  },

  /* High-Risk Prompt */
  highRiskIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highRiskPromptText: {
    fontSize: 13,
    color: colors.navyText,
    lineHeight: 18,
  },
  highRiskActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: spacing.sm,
  },
  cancelModalBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgApp,
  },
  cancelModalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  confirmHighRiskBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: '#DC2626',
  },
  confirmHighRiskBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },

  /* Review Summary Modal */
  reviewStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reviewStatCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    alignItems: 'center',
  },
  reviewStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
  },
  reviewStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyText,
    marginTop: 2,
  },
  highRiskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  highRiskBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  reviewModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: spacing.sm,
  },
  confirmSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primaryYellow,
    borderWidth: 1,
    borderColor: colors.primaryYellowDark,
  },
  confirmSaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
});