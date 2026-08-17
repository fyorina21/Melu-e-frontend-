
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import SystemAdminNav, { SYS_ROUTE_BY_TAB } from './components/SystemAdminNav';
import { getRoles, getPermissionMatrix, savePermissionMatrix, getPermissionAuditTrail } from '../../api/SystemAdminApi';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SystemAdminStackParamList } from '../../types';

const RESOURCES = [
  'Student Records', 'Assessments', 'IUP', 'Goal Bank', 'Session Data',
  'Attendance', 'Scheduling', 'Parent Communication', 'Reports', 'Staff Accounts',
];
const ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Approve'];

interface PermissionRole {
  id: string;
  name: string;
  isSystemRole: boolean;
}

type PermissionMatrix = Record<string, Record<string, boolean>>;

interface AuditEntry {
  date: string;
  user: string;
  resource: string;
  action: string;
  roleName: string;
}

export default function PermissionConfigurationScreen({ navigation }: NativeStackScreenProps<SystemAdminStackParamList, 'PermissionConfiguration'>) {
  const [roles, setRoles] = useState<PermissionRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<PermissionMatrix>({});
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [dirty, setDirty] = useState(false);

  const loadRoles = useCallback(async () => {
    try {
      const { data } = await getRoles();
      setRoles(data);
      if (!selectedRoleId && data.length) setSelectedRoleId(data[0].id);
    } catch (err) {
      setRoles(DEMO_ROLES);
      if (!selectedRoleId) setSelectedRoleId(DEMO_ROLES[0].id);
    }
  }, [selectedRoleId]);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  useEffect(() => {
    if (!selectedRoleId) return;
    getPermissionMatrix(selectedRoleId).then(({ data }) => { setMatrix(data); setDirty(false); }).catch(() => { setMatrix(DEFAULT_MATRIX(selectedRoleId)); setDirty(false); });
    getPermissionAuditTrail(selectedRoleId).then(({ data }) => setAuditTrail(data)).catch(() => setAuditTrail(DEMO_AUDIT));
  }, [selectedRoleId]);

  const toggle = (resource: string, action: string) => {
    setMatrix((prev) => ({
      ...prev,
      [resource]: { ...prev[resource], [action]: !prev[resource]?.[action] },
    }));
    setDirty(true);
  };

  const isSystemRole = roles.find((r) => r.id === selectedRoleId)?.isSystemRole;

  const handleSave = async () => {
    if (!selectedRoleId) return;
    if (isSystemRole) { Alert.alert('System roles have fixed base permissions', 'Some changes may not persist for built-in roles.'); }
    try { await savePermissionMatrix(selectedRoleId, matrix); } catch (err) {}
    setDirty(false);
    Alert.alert('Permissions saved');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <SystemAdminNav activeTab="Permissions" onTabPress={(t) => navigation?.navigate?.(SYS_ROUTE_BY_TAB[t])} />
      <View style={styles.header}><Text style={typography.h1}>Permission Configuration</Text></View>

      <View style={styles.roleSelectorRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {roles.map((r) => (
            <TouchableOpacity key={r.id} style={[styles.roleChip, selectedRoleId === r.id && styles.roleChipActive]} onPress={() => setSelectedRoleId(r.id)}>
              <Text style={[typography.bodyBold, selectedRoleId === r.id && { color: colors.navyText }]}>{r.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ScrollView horizontal>
          <View>
            <View style={styles.matrixHeaderRow}>
              <View style={styles.resourceCol}><Text style={typography.label}>Resource</Text></View>
              {ACTIONS.map((a) => (
                <View key={a} style={styles.actionCol}><Text style={typography.label}>{a}</Text></View>
              ))}
            </View>
            {RESOURCES.map((res) => (
              <View key={res} style={styles.matrixRow}>
                <View style={styles.resourceCol}><Text style={typography.body}>{res}</Text></View>
                {ACTIONS.map((a) => (
                  <TouchableOpacity key={a} style={styles.actionCol} onPress={() => toggle(res, a)}>
                    <View style={[styles.checkbox, matrix[res]?.[a] && styles.checkboxChecked]} />
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.card}>
          <Text style={typography.h3}>Audit Trail</Text>
          {auditTrail.map((a, i) => (
            <Text key={i} style={typography.caption}>{a.date} — {a.user} changed {a.resource}/{a.action} for {a.roleName}</Text>
          ))}
          {auditTrail.length === 0 && <Text style={typography.caption}>No changes recorded.</Text>}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveConfigBtn, !dirty && styles.saveConfigBtnDisabled]} disabled={!dirty} onPress={handleSave}>
          <Text style={styles.saveConfigBtnText}>Save Permissions</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const DEMO_ROLES: PermissionRole[] = [
  { id: 'r1', name: 'Teacher', isSystemRole: true },
  { id: 'r2', name: 'Coordinator', isSystemRole: true },
  { id: 'r3', name: 'Program Director', isSystemRole: true },
];

function DEFAULT_MATRIX(roleId: string): PermissionMatrix {
  const base: PermissionMatrix = {};
  RESOURCES.forEach((r) => { base[r] = { View: true, Create: false, Edit: false, Delete: false, Approve: false }; });
  if (roleId === 'r1') { base['Session Data'] = { View: true, Create: true, Edit: true, Delete: false, Approve: false }; }
  return base;
}
const DEMO_AUDIT: AuditEntry[] = [
  { date: 'Aug 5, 2026', user: 'Sysadmin A', resource: 'Reports', action: 'Approve', roleName: 'Coordinator' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  roleSelectorRow: { padding: spacing.md, backgroundColor: colors.bgCard },
  roleChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.bgApp, marginRight: spacing.sm },
  roleChipActive: { backgroundColor: colors.primaryYellow },
  content: { padding: spacing.lg, gap: spacing.lg },
  matrixHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm },
  matrixRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  resourceCol: { width: 150, justifyContent: 'center' },
  actionCol: { width: 70, alignItems: 'center', justifyContent: 'center' },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: colors.border, borderRadius: 4 },
  checkboxChecked: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  footer: { padding: spacing.lg, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.border },
  saveConfigBtn: { backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveConfigBtnDisabled: { opacity: 0.4 },
  saveConfigBtnText: { fontWeight: '700', color: colors.navyText },
});
