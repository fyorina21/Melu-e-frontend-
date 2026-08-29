// screens/admin/AdminPanelOverviewScreen.tsx
// Executive Dashboards for Institutional Admin (Clinical Ops) & System Admin (Security/Users)

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppNavbar from '../../components/AppNavbar';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { ROLE_TABS, IA_ROUTE_BY_TAB, SYS_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ExportPreviewModal from '../../components/ExportPreviewModal';

interface Props {
  navigation: { navigate: (name: string, params?: Record<string, unknown>) => void };
  route: { params?: { panel?: 'clinical' | 'system' } };
}

export default function AdminPanelOverviewScreen({ navigation, route }: Props) {
  const { session } = useAuth();
  const role = (session?.role ?? 'institutional_admin') as 'institutional_admin' | 'system_admin';
  const isSystem = role === 'system_admin';
  const [exportContent, setExportContent] = useState<string | null>(null);

  const handleExportAudit = () => {
    setExportContent(
      [
        '================================================================',
        `MELU'E FOUNDATION — ${isSystem ? 'SYSTEM AUDIT & SECURITY LOG' : 'CLINICAL CONFIGURATION AUDIT'}`,
        '================================================================',
        `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        `ADMIN OPERATOR: ${session?.userName || 'Administrator'} (${role})`,
        '----------------------------------------------------------------',
        '',
        isSystem
          ? [
              'SECURITY POLICIES & ACCOUNTS:',
              '• Active System Users: 35 total (12 Teachers, 3 Directors, 2 Admins, 18 Parents)',
              '• 2-Factor Authentication: Enforced across all staff accounts',
              '• Recent Audit: User account role changed for Sarah Miller (Teacher -> Coordinator)',
              '• Recent Audit: Password reset requested by parent@melue.org',
              '• Security Status: All systems nominal · 0 policy violations detected',
            ].join('\n')
          : [
              'CLINICAL GOALS & CONFIGURATION SNAPSHOT:',
              '• Active Goal Domains: 5 (Communication, Social, Motor, Self-Help, Cognition)',
              '• Task Analysis Master Templates: 18 step-by-step clinical routines',
              '• Session Rounds: 4 daily rotations (30 min pre-therapy + 60 min active)',
              '• Incident Antecedents: 8 active clinical categories',
              '• Draft Expiry Setting: 90 days retention with auto-archive warning',
            ].join('\n'),
        '',
        '================================================================',
      ].join('\n')
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Dashboard" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.badgeIcon, isSystem && { backgroundColor: '#DBEAFE' }]}>
              <Feather
                name={isSystem ? 'shield' : 'settings'}
                size={22}
                color={isSystem ? '#1E40AF' : colors.navyText}
              />
            </View>
            <View>
              <Text style={styles.pageTitle}>
                {isSystem ? 'System Administration Dashboard' : 'Institutional Administration'}
              </Text>
              <Text style={styles.pageSubtitle}>
                {isSystem
                  ? 'User accounts, role-based access control, security policies & audit logs'
                  : 'Master clinical configurations, goal banks, session schedules & capacity'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.auditBtn} onPress={handleExportAudit}>
            <Feather name="printer" size={14} color={colors.navyText} />
            <Text style={styles.auditBtnText}>
              {isSystem ? 'Export Security Log' : 'Export Clinical Config'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* INSTITUTIONAL ADMIN DASHBOARD VIEW */}
        {!isSystem && (
          <>
            {/* KPI Cards Grid */}
            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('GoalDomainDefinitions')}
                activeOpacity={0.7}
              >
                <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Feather name="target" size={20} color="#B45309" />
                </View>
                <Text style={styles.statVal}>5 Domains</Text>
                <Text style={styles.statLabel}>Active Goal Domains</Text>
                <Text style={styles.statSub}>18 Task Analysis Templates</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('ScheduleCapacityConfig')}
                activeOpacity={0.7}
              >
                <View style={[styles.statIconWrap, { backgroundColor: '#DCFCE7' }]}>
                  <Feather name="calendar" size={20} color="#166534" />
                </View>
                <Text style={styles.statVal}>4 Rounds</Text>
                <Text style={styles.statLabel}>Daily Session Blocks</Text>
                <Text style={styles.statSub}>6 Students Max / Block</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('SessionScheduleConfig')}
                activeOpacity={0.7}
              >
                <View style={[styles.statIconWrap, { backgroundColor: '#DBEAFE' }]}>
                  <Feather name="clock" size={20} color="#1E40AF" />
                </View>
                <Text style={styles.statVal}>90 Days</Text>
                <Text style={styles.statLabel}>Draft Expiry Window</Text>
                <Text style={styles.statSub}>Session summaries retention</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('AbcLoggingOptions')}
                activeOpacity={0.7}
              >
                <View style={[styles.statIconWrap, { backgroundColor: '#F3E8FF' }]}>
                  <Feather name="activity" size={20} color="#6B21A8" />
                </View>
                <Text style={styles.statVal}>ABC Master</Text>
                <Text style={styles.statLabel}>Antecedent & Consequence</Text>
                <Text style={styles.statSub}>Configured for therapy session logs</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Workbench Cards */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Clinical Configuration Modules</Text>
              <View style={styles.moduleGrid}>
                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => navigation.navigate('GoalDomainDefinitions')}
                >
                  <View style={styles.moduleHeader}>
                    <Feather name="layers" size={18} color={colors.navyText} />
                    <Feather name="chevron-right" size={16} color={colors.mutedText} />
                  </View>
                  <Text style={styles.moduleTitle}>Goal Domains & Task Analysis</Text>
                  <Text style={styles.moduleDesc}>
                    Manage combined master goal libraries, domain milestones, and task analysis step templates.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => navigation.navigate('ScheduleCapacityConfig')}
                >
                  <View style={styles.moduleHeader}>
                    <Feather name="users" size={18} color={colors.navyText} />
                    <Feather name="chevron-right" size={16} color={colors.mutedText} />
                  </View>
                  <Text style={styles.moduleTitle}>Scheduling & Capacity Limits</Text>
                  <Text style={styles.moduleDesc}>
                    Configure station rounds, pre-therapy setup durations, staff ratios, and draft expiry periods.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => navigation.navigate('AbcLoggingOptions')}
                >
                  <View style={styles.moduleHeader}>
                    <Feather name="edit-3" size={18} color={colors.navyText} />
                    <Feather name="chevron-right" size={16} color={colors.mutedText} />
                  </View>
                  <Text style={styles.moduleTitle}>ABC & Incident Customization</Text>
                  <Text style={styles.moduleDesc}>
                    Define standardized Antecedent, Consequence, and Location tags for behavior incident logs.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => navigation.navigate('SessionScheduleConfig')}
                >
                  <View style={styles.moduleHeader}>
                    <Feather name="clock" size={18} color={colors.navyText} />
                    <Feather name="chevron-right" size={16} color={colors.mutedText} />
                  </View>
                  <Text style={styles.moduleTitle}>Session Timetables & Draft Rules</Text>
                  <Text style={styles.moduleDesc}>
                    Set baseline operating hours, therapist break intervals, and automatic archival thresholds.
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent Clinical Changes */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Recent Clinical Configuration Updates</Text>
                <Feather name="check-circle" size={16} color={colors.successGreen} />
              </View>
              <View style={styles.historyList}>
                <View style={styles.historyItem}>
                  <View style={styles.historyDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyText}>
                      Updated Goal Domain: Added 4 new PECS Phase 1 milestones under Communication
                    </Text>
                    <Text style={styles.historyMeta}>Updated 2 hours ago by Institutional Admin</Text>
                  </View>
                </View>
                <View style={styles.historyItem}>
                  <View style={styles.historyDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyText}>
                      Modified ABC Options: Added "Sensory Overload" to standard Antecedent catalog
                    </Text>
                    <Text style={styles.historyMeta}>Updated yesterday by Institutional Admin</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* SYSTEM ADMIN DASHBOARD VIEW */}
        {isSystem && (
          <>
            {/* System Metrics */}
            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('UserManagement')}
                activeOpacity={0.7}
              >
                <View style={[styles.statIconWrap, { backgroundColor: '#DBEAFE' }]}>
                  <Feather name="users" size={20} color="#1E40AF" />
                </View>
                <Text style={styles.statVal}>35 Users</Text>
                <Text style={styles.statLabel}>Active Staff & Parents</Text>
                <Text style={styles.statSub}>100% Verified Accounts</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('RolePermissions')}
                activeOpacity={0.7}
              >
                <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Feather name="lock" size={20} color="#B45309" />
                </View>
                <Text style={styles.statVal}>7 Roles</Text>
                <Text style={styles.statLabel}>RBAC Access Policies</Text>
                <Text style={styles.statSub}>Strict least-privilege active</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('AuditLogs')}
                activeOpacity={0.7}
              >
                <View style={[styles.statIconWrap, { backgroundColor: '#DCFCE7' }]}>
                  <Feather name="shield" size={20} color="#166534" />
                </View>
                <Text style={styles.statVal}>Secure</Text>
                <Text style={styles.statLabel}>Security & 2FA Status</Text>
                <Text style={styles.statSub}>0 Breaches or Violations</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('AuditLogs')}
                activeOpacity={0.7}
              >
                <View style={[styles.statIconWrap, { backgroundColor: '#F3E8FF' }]}>
                  <Feather name="activity" size={20} color="#6B21A8" />
                </View>
                <Text style={styles.statVal}>Audit Live</Text>
                <Text style={styles.statLabel}>Real-Time System Log</Text>
                <Text style={styles.statSub}>HIPAA/FERPA compliant logging</Text>
              </TouchableOpacity>
            </View>

            {/* System Modules */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Security & Identity Controls</Text>
              <View style={styles.moduleGrid}>
                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => navigation.navigate('UserManagement')}
                >
                  <View style={styles.moduleHeader}>
                    <Feather name="user-check" size={18} color={colors.navyText} />
                    <Feather name="chevron-right" size={16} color={colors.mutedText} />
                  </View>
                  <Text style={styles.moduleTitle}>User Account Directory</Text>
                  <Text style={styles.moduleDesc}>
                    Create, deactivate, reset credentials, and assign clinical roles across all personnel.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => navigation.navigate('RolePermissions')}
                >
                  <View style={styles.moduleHeader}>
                    <Feather name="key" size={18} color={colors.navyText} />
                    <Feather name="chevron-right" size={16} color={colors.mutedText} />
                  </View>
                  <Text style={styles.moduleTitle}>Role & Permission Matrix</Text>
                  <Text style={styles.moduleDesc}>
                    Configure read/write/approve access grants per functional role (Teacher, Coordinator, Director, Admin).
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => navigation.navigate('AuditLogs')}
                >
                  <View style={styles.moduleHeader}>
                    <Feather name="file-text" size={18} color={colors.navyText} />
                    <Feather name="chevron-right" size={16} color={colors.mutedText} />
                  </View>
                  <Text style={styles.moduleTitle}>System Audit & Access Logs</Text>
                  <Text style={styles.moduleDesc}>
                    Inspect timestamped login records, permission changes, student record exports, and security events.
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <ExportPreviewModal
        visible={!!exportContent}
        title={isSystem ? 'System Audit Log' : 'Clinical Configuration Snapshot'}
        filename={`${isSystem ? 'SystemAudit' : 'ClinicalConfig'}_${new Date().toISOString().slice(0, 10)}.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 50 },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 280 },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 20, fontWeight: '700', color: colors.navyText },
  pageSubtitle: { fontSize: 12, color: colors.mutedText, marginTop: 2 },
  auditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  auditBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: {
    flexGrow: 1,
    minWidth: 180,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statVal: { fontSize: 22, fontWeight: '800', color: colors.navyText },
  statLabel: { fontSize: 12, fontWeight: '700', color: colors.bodyText },
  statSub: { fontSize: 11, color: colors.mutedText, marginTop: 2 },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  moduleCard: {
    flexGrow: 1,
    minWidth: 240,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  moduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  moduleTitle: { fontSize: 14, fontWeight: '700', color: colors.navyText, marginTop: 4 },
  moduleDesc: { fontSize: 12, color: colors.bodyText, lineHeight: 18 },

  historyList: { gap: spacing.md },
  historyItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryYellowDark,
    marginTop: 5,
  },
  historyText: { fontSize: 13, fontWeight: '600', color: colors.navyText },
  historyMeta: { fontSize: 11, color: colors.mutedText, marginTop: 2 },
});

