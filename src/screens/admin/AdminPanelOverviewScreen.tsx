// screens/admin/AdminPanelOverviewScreen.tsx
// SCR-ADMIN-000: Administration Panel - Overview
//
// Tabbed administration dashboard that separates Clinical Configuration
// (Institutional Admin) from System Configuration (System Admin). The
// screen renders in whichever stack opens it; the route param `panel`
// picks the default tab and the matching role nav bar.

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import InstitutionalAdminNav, { IA_ROUTE_BY_TAB } from '../institutionaladmin/components/InstitutionalAdminNav';
import SystemAdminNav, { SYS_ROUTE_BY_TAB } from '../systemadmin/components/SystemAdminNav';

interface ModuleItem {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
  spec: string;
  status: string;
}

const CLINICAL_MODULES: ModuleItem[] = [
  { key: 'forms', title: 'Form Builder', description: 'Enrollment Wizard, IUP, ABLLS form templates, field visibility & order.', icon: 'layout', route: 'FormBuilder', spec: 'SCR-ADMIN-001', status: 'Default template' },
  { key: 'trial', title: 'Trial Logging Format', description: 'Prompt levels, button colors, trial stream layout, mastery criteria.', icon: 'sliders', route: 'TrialLoggingFormat', spec: 'SCR-ADMIN-002', status: 'Default' },
  { key: 'abc', title: 'ABC Dropdown Lists', description: 'Behaviors, antecedents, consequences, locations, frequency & intensity options.', icon: 'list', route: 'AbcDropdownLists', spec: 'SCR-ADMIN-003', status: 'Default' },
  { key: 'schedule', title: 'Session Schedule & Capacity', description: 'Session times, block durations, staff-to-student capacity, draft expiry.', icon: 'clock', route: 'ScheduleCapacityConfig', spec: 'SCR-ADMIN-004', status: 'Configured' },
  { key: 'goals', title: 'Goal Domain Definitions', description: 'Goal domains used by the Goal Bank.', icon: 'target', route: 'GoalDomainDefinitions', spec: 'SCR-ADMIN-005', status: 'Default' },
  { key: 'task', title: 'Task Analysis Templates', description: 'Multi-step task analysis templates with mastery criteria.', icon: 'layers', route: 'TaskAnalysisTemplates', spec: 'SCR-ADMIN-006', status: 'Default' },
  { key: 'programs', title: 'Clinical Categories', description: 'Programs, assessment types, goal categories, therapy & behavior categories.', icon: 'folder', route: 'ClinicalCategoriesConfig', spec: 'SCR-ADMIN-007', status: 'Configured' },
  { key: 'clinic', title: 'Clinic Info', description: 'Organization name, logo, contact and system-wide form header settings.', icon: 'home', route: 'ClinicInfoConfig', spec: 'SCR-ADMIN-008', status: 'Configured' },
  { key: 'hours', title: 'Working Hours', description: 'Institution working hours and availability windows.', icon: 'sun', route: 'WorkingHoursConfig', spec: 'SCR-ADMIN-009', status: 'Configured' },
  { key: 'schools', title: 'School Settings', description: 'Affiliated schools and site-level configuration.', icon: 'book-open', route: 'SchoolSettingsConfig', spec: 'SCR-ADMIN-010', status: 'Default' },
];

const SYSTEM_MODULES: ModuleItem[] = [
  { key: 'staff', title: 'Staff Account Management', description: 'Create, edit, activate/deactivate staff, reset passwords, teacher-student linking (SCR-008).', icon: 'users', route: 'StaffAccountManagement', spec: 'SCR-SYS-001', status: 'Configured' },
  { key: 'roles', title: 'Role Management', description: 'Manage system roles and role assignments.', icon: 'shield', route: 'RoleManagement', spec: 'SCR-SYS-002', status: 'Default' },
  { key: 'perms', title: 'Permission Configuration', description: 'Role-based permission matrix: CRUD + Approve across modules.', icon: 'key', route: 'PermissionConfiguration', spec: 'SCR-SYS-003', status: 'Default' },
  { key: 'audit', title: 'Audit Log', description: 'User activity and configuration change history.', icon: 'file-text', route: 'AuditLog', spec: 'SCR-SYS-004', status: 'Active' },
];

function ModuleGrid({ modules, onOpen }: { modules: ModuleItem[]; onOpen: (route: string) => void }) {
  return (
    <View style={styles.grid}>
      {modules.map((m) => (
        <TouchableOpacity key={m.key} style={styles.moduleCard} onPress={() => onOpen(m.route)}>
          <View style={styles.moduleIconWrap}>
            <Feather name={m.icon} size={18} color={colors.navyText} />
          </View>
          <Text style={typography.bodyBold}>{m.title}</Text>
          <Text style={typography.caption}>{m.spec}</Text>
          <Text style={styles.moduleDesc}>{m.description}</Text>
          <View style={styles.moduleFooter}>
            <Text style={styles.moduleStatus}>{m.status}</Text>
            <Feather name="chevron-right" size={14} color={colors.mutedText} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

type Props = NativeStackScreenProps<ParamListBase, 'AdminPanelOverview'>;

export default function AdminPanelOverviewScreen({ navigation, route }: Props) {
  const params = route.params as { panel?: 'clinical' | 'system' } | undefined;
  const initialPanel: 'clinical' | 'system' = params?.panel ?? 'clinical';
  const [panel, setPanel] = useState<'clinical' | 'system'>(initialPanel);

  const openModule = (routeName: string) => navigation?.navigate?.(routeName as never);

  return (
    <SafeAreaView style={styles.safe}>
      {panel === 'system' ? (
        <SystemAdminNav activeTab="Admin Panel" onTabPress={(t) => navigation?.navigate?.(SYS_ROUTE_BY_TAB[t] as never)} />
      ) : (
        <InstitutionalAdminNav activeTab="Admin Panel" onTabPress={(t) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t] as never)} />
      )}

      <View style={styles.header}>
        <Feather name="settings" size={18} color={colors.navyText} />
        <View>
          <Text style={typography.h1}>Administration Panel</Text>
          <Text style={typography.caption}>SCR-ADMIN-000 — Overview</Text>
        </View>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tab, panel === 'clinical' && styles.tabActive]} onPress={() => setPanel('clinical')}>
          <Feather name="clipboard" size={14} color={panel === 'clinical' ? colors.navyText : colors.bodyText} />
          <Text style={[styles.tabText, panel === 'clinical' && styles.tabTextActive]}>Clinical Configuration</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, panel === 'system' && styles.tabActive]} onPress={() => setPanel('system')}>
          <Feather name="users" size={14} color={panel === 'system' ? colors.navyText : colors.bodyText} />
          <Text style={[styles.tabText, panel === 'system' && styles.tabTextActive]}>System Configuration</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {panel === 'clinical' ? (
          <>
            <Text style={typography.body}>
              Clinical configuration for the {CLINICAL_MODULES.length} institutional modules. Changes take effect immediately in the live application.
            </Text>
            <ModuleGrid modules={CLINICAL_MODULES} onOpen={openModule} />
          </>
        ) : (
          <>
            <Text style={typography.body}>
              System and user configuration for the {SYSTEM_MODULES.length} administration modules.
            </Text>
            <ModuleGrid modules={SYSTEM_MODULES} onOpen={openModule} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabsRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm },
  tabActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.bodyText },
  tabTextActive: { color: colors.navyText, fontWeight: '700' },
  content: { padding: spacing.lg, gap: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  moduleCard: { width: '48%', backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.xs, minHeight: 170 },
  moduleIconWrap: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.statusPendingBg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  moduleDesc: { fontSize: 11, color: colors.mutedText, flex: 1 },
  moduleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  moduleStatus: { fontSize: 10, fontWeight: '700', color: colors.bodyText, textTransform: 'uppercase' },
});
