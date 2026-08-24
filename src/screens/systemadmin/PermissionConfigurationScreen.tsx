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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { SYS_ROUTE_BY_TAB } from '../../components/appNavConfig';
import {
  getRoles,
  getPermissionMatrix,
  savePermissionMatrix,
  getPermissionAuditTrail,
} from '../../api/SystemAdminApi';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SystemAdminStackParamList } from '../../types';

const MODULES = [
  'Students / Enrollment',
  'Assessments',
  'IUP & Goals',
  'Active Therapy',
  'Reports',
  'Staff',
  'Admin',
];

const ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE'] as const;
type ActionType = typeof ACTIONS[number];

interface PermissionRole {
  id: string;
  name: string;
  isSystemRole?: boolean;
}

type PermissionMatrix = Record<string, Record<ActionType, boolean>>;

interface AuditEntry {
  date: string;
  user: string;
  resource: string;
  action: string;
  roleName: string;
}

export default function PermissionConfigurationScreen({
  navigation,
}: NativeStackScreenProps<SystemAdminStackParamList, 'PermissionConfiguration'>) {
  const [roles, setRoles] = useState<PermissionRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [matrix, setMatrix] = useState<PermissionMatrix>({});
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const loadRoles = useCallback(async () => {
    try {
      const { data } = await getRoles();
      setRoles(data);
      setSelectedRoleId((prev) => prev || data[0]?.id || '');
    } catch (err) {
      setRoles([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (!selectedRoleId) return;
    getPermissionMatrix(selectedRoleId)
      .then(({ data }) => {
        setMatrix(data.matrix);
        setDirty(false);
      })
      .catch(() => {
        setMatrix({});
        setDirty(false);
      });
    getPermissionAuditTrail(selectedRoleId)
      .then(({ data }) => setAuditTrail(data))
      .catch(() => setAuditTrail([]));
  }, [selectedRoleId]);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || { id: selectedRoleId, name: selectedRoleId },
    [roles, selectedRoleId]
  );

  const toggleCell = (module: string, action: ActionType) => {
    setMatrix((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action],
      },
    }));
    setDirty(true);
  };

  const toggleRow = (module: string) => {
    setMatrix((prev) => {
      const currentVal = prev[module];
      const allChecked = ACTIONS.every((a) => currentVal?.[a]);
      const nextState: Record<ActionType, boolean> = {
        VIEW: !allChecked,
        CREATE: !allChecked,
        EDIT: !allChecked,
        DELETE: !allChecked,
        APPROVE: !allChecked,
      };
      return { ...prev, [module]: nextState };
    });
    setDirty(true);
  };

  const toggleColumn = (action: ActionType) => {
    setMatrix((prev) => {
      const allChecked = MODULES.every((m) => prev[m]?.[action]);
      const updated = { ...prev };
      MODULES.forEach((m) => {
        updated[m] = { ...updated[m], [action]: !allChecked };
      });
      return updated;
    });
    setDirty(true);
  };

  const handleFullAccess = () => {
    const full: PermissionMatrix = {};
    MODULES.forEach((m) => {
      full[m] = { VIEW: true, CREATE: true, EDIT: true, DELETE: true, APPROVE: true };
    });
    setMatrix(full);
    setDirty(true);
  };

  const handleReadOnly = () => {
    const readOnly: PermissionMatrix = {};
    MODULES.forEach((m) => {
      readOnly[m] = { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
    });
    setMatrix(readOnly);
    setDirty(true);
  };

  const handleCopyFromRole = async (sourceRoleId: string) => {
    try {
      const { data } = await getPermissionMatrix(sourceRoleId);
      setMatrix(data.matrix);
    } catch (err) {
      setMatrix({});
    }
    setDirty(true);
    setCopyModalOpen(false);
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    try {
      await savePermissionMatrix(selectedRoleId, matrix);
      const { data } = await getPermissionAuditTrail(selectedRoleId);
      setAuditTrail(data);
    } catch (err) {}
    setDirty(false);
    Alert.alert('Permissions Saved', `Permissions for ${selectedRole.name} updated successfully.`);
  };

  // Helper function to format actions into dynamic sentence strings
  const summaryList = useMemo(() => {
    const statements: string[] = [];
    MODULES.forEach((mod) => {
      const perms = matrix[mod];
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
        // Capitalize first letter
        const sentence = `Can ${actionStr} ${mod}`;
        statements.push(sentence);
      }
    });
    return statements;
  }, [matrix]);

  if (loading) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Permissions"
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
          <Feather name="settings" size={12} color={colors.mutedText} /> System Configuration / Permission Configuration
        </Text>
        <Text style={typography.caption}>
          SCR-SYS-003 · Define module access permissions per role
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Controls Bar */}
        <View style={styles.controlsRow}>
          <View style={{ gap: spacing.xs }}>
            <Text style={typography.label}>Select Role</Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <Text style={typography.bodyBold}>{selectedRole.name}</Text>
              <Feather name="chevron-down" size={16} color={colors.navyText} />
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={styles.dropdownMenu}>
                {roles.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.dropdownItem,
                      selectedRoleId === r.id && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setSelectedRoleId(r.id);
                      setDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        typography.body,
                        selectedRoleId === r.id && { color: '#0284C7', fontWeight: '700' },
                      ]}
                    >
                      {r.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.presetsRow}>
            <TouchableOpacity style={styles.presetBtn} onPress={handleFullAccess}>
              <Text style={styles.presetBtnText}>Full Access</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={handleReadOnly}>
              <Text style={styles.presetBtnText}>Read Only</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setCopyModalOpen(true)}
            >
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

          {MODULES.map((mod) => {
            const isRowAllChecked = ACTIONS.every((a) => matrix[mod]?.[a]);

            return (
              <View key={mod} style={styles.tableRow}>
                <Text style={[typography.bodyBold, { flex: 2.2 }]}>{mod}</Text>

                {ACTIONS.map((act) => {
                  const checked = !!matrix[mod]?.[act];
                  return (
                    <TouchableOpacity
                      key={act}
                      style={styles.cellBtn}
                      onPress={() => toggleCell(mod, act)}
                    >
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && <Feather name="check" size={12} color={colors.white} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.cellBtn}
                  onPress={() => toggleRow(mod)}
                >
                  <View style={[styles.checkbox, isRowAllChecked && styles.checkboxCheckedRowAll]}>
                    {isRowAllChecked && <Feather name="check" size={12} color={colors.navyText} />}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* PERMISSION SUMMARY COMPONENT */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            PERMISSION SUMMARY — {selectedRole.name.toUpperCase()}
          </Text>
          {summaryList.length === 0 ? (
            <Text style={styles.summaryTextEmpty}>No active permissions configured for this role.</Text>
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
            style={[styles.saveConfigBtn, !dirty && styles.saveConfigBtnDisabled]}
            disabled={!dirty}
            onPress={handleSave}
          >
            <Feather name="save" size={16} color={colors.navyText} />
            <Text style={styles.saveConfigBtnText}>Save Configuration</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.auditTrailLink}
            onPress={() => setShowAuditModal(true)}
          >
            <Text style={styles.auditTrailLinkText}>View Audit Trail</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Copy Modal */}
      <Modal visible={copyModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={typography.h2}>Copy Permissions From</Text>
            <Text style={typography.caption}>Select a role to copy permissions into {selectedRole.name}:</Text>
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
          <View style={styles.modalContent}>
            <Text style={typography.h2}>Audit Trail</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {auditTrail.map((a, i) => (
                <Text key={i} style={[typography.caption, { marginBottom: spacing.xs }]}>
                  {a.date} — {a.user} updated {a.resource}/{a.action} for {a.roleName}
                </Text>
              ))}
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
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 10,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    minWidth: 180,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    zIndex: 99,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemActive: {
    backgroundColor: '#F0F9FF',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    color: colors.bodyText,
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
  columnHeaderCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  columnHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.5,
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
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0EA5E9',
  },
  checkboxCheckedRowAll: {
    backgroundColor: colors.border,
  },
  /* PERMISSION SUMMARY STYLES */
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  summaryTextEmpty: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  /* BOTTOM ACTIONS STYLES */
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  saveConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  saveConfigBtnDisabled: {
    opacity: 0.5,
  },
  saveConfigBtnText: {
    fontWeight: '700',
    color: colors.navyText,
    fontSize: 14,
  },
  auditTrailLink: {
    paddingVertical: spacing.xs,
  },
  auditTrailLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    width: '80%',
    maxWidth: 400,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  copyRoleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  closeModalBtn: {
    alignSelf: 'flex-end',
    paddingTop: spacing.xs,
  },
  closeModalBtnText: {
    color: colors.mutedText,
    fontWeight: '600',
  },
});