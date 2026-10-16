// src/screens/systemadmin/AuditLogScreen.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Platform,
  Share,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { SYS_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getAuditLogs } from '../../api/SystemAdminApi';
import { useToast } from '../../context/ToastContext';
import type { SystemAdminStackParamList } from '../../types';

interface AuditEntry {
  id: string;
  user: string;
  action: 'created' | 'updated' | 'deleted' | 'changed';
  date: string;
  time: string;
  resource: string;
  ip?: string;
  oldValue?: string;
  newValue?: string;
}

const ACTION_STYLE: Record<AuditEntry['action'], { bg: string; text: string }> = {
  created: { bg: colors.statusCompletedBg, text: colors.statusCompletedText },
  updated: { bg: colors.statusInProgressBg, text: colors.statusInProgressText },
  deleted: { bg: colors.statusRevisionBg, text: colors.statusRevisionText },
  changed: { bg: colors.statusPendingBg, text: colors.statusPendingText },
};

const ACTIONS = ['created', 'updated', 'deleted', 'changed'];

type Props = NativeStackScreenProps<SystemAdminStackParamList, 'AuditLog'>;

export default function AuditLogScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [userFilter, setUserFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await getAuditLogs({ user: userFilter, action: actionFilter, search });
      setEntries(data || []);
    } catch {
      setEntries([]);
    }
  }, [userFilter, actionFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const availableUsers = useMemo(() => {
    if (!entries) return ['All'];
    const unique = Array.from(new Set(entries.map((e) => e.user).filter(Boolean)));
    return ['All', ...unique];
  }, [entries]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    const term = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (userFilter !== 'All' && e.user !== userFilter) return false;
      if (actionFilter !== 'All' && e.action !== actionFilter) return false;
      if (term) {
        const matchResource = (e.resource || '').toLowerCase().includes(term);
        const matchUser = (e.user || '').toLowerCase().includes(term);
        const matchIp = (e.ip || '').toLowerCase().includes(term);
        const matchAction = (e.action || '').toLowerCase().includes(term);
        if (!matchResource && !matchUser && !matchIp && !matchAction) return false;
      }
      return true;
    });
  }, [entries, userFilter, actionFilter, search]);

  const handleExportCsv = useCallback(() => {
    if (!filtered || filtered.length === 0) {
      showToast('No log entries available to export', 'error');
      return;
    }

    const headers = [
      'ID',
      'Date',
      'Time',
      'User',
      'Action',
      'Resource',
      'IP Address',
      'Old Value',
      'New Value',
    ];
    const rows = filtered.map((e) => [
      `"${e.id}"`,
      `"${e.date}"`,
      `"${e.time}"`,
      `"${(e.user || '').replace(/"/g, '""')}"`,
      `"${e.action}"`,
      `"${(e.resource || '').replace(/"/g, '""')}"`,
      `"${e.ip || ''}"`,
      `"${(e.oldValue || '').replace(/"/g, '""')}"`,
      `"${(e.newValue || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Audit logs exported as CSV', 'success');
    } else {
      Share.share({
        title: 'Melue Audit Logs',
        message: csvContent,
      });
    }
  }, [filtered, showToast]);

  const handleExportJson = useCallback(() => {
    if (!filtered || filtered.length === 0) {
      showToast('No log entries available to export', 'error');
      return;
    }

    const jsonContent = JSON.stringify(filtered, null, 2);

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Audit logs exported as JSON', 'success');
    } else {
      Share.share({
        title: 'Melue Audit Logs JSON',
        message: jsonContent,
      });
    }
  }, [filtered, showToast]);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setUserFilter('All');
    setActionFilter('All');
  }, []);

  if (entries === null) return <ScreenLoader />;

  const Chip = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Audit Log"
        onTabPress={(t) => navigation?.navigate?.(SYS_ROUTE_BY_TAB[t])}
      />

      <View style={[styles.mainWrapper, isTablet && styles.containerTablet]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={typography.h1}>Audit Log</Text>
            <Text style={[typography.caption, { color: colors.mutedText }]}>
              Regulatory activity records and system traceability
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExportCsv}
              accessibilityRole="button"
              accessibilityLabel="Export audit logs as CSV"
              {...(Platform.OS === 'web'
                ? { title: 'Export all filtered audit records as a CSV file' }
                : {})}
            >
              <Feather name="download" size={14} color={colors.navyText} />
              <Text style={styles.exportBtnText}>Export CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportBtnSecondary}
              onPress={handleExportJson}
              accessibilityRole="button"
              accessibilityLabel="Export audit logs as JSON"
              {...(Platform.OS === 'web'
                ? { title: 'Export all filtered audit records as a JSON file' }
                : {})}
            >
              <Feather name="file-text" size={14} color={colors.navyText} />
              <Text style={styles.exportBtnText}>Export JSON</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filtersRow}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={16} color={colors.mutedText} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by user, action, resource, or IP..."
              placeholderTextColor={colors.mutedText}
              value={search}
              onChangeText={setSearch}
              accessibilityLabel="Search audit logs"
            />
            {search ? (
              <TouchableOpacity
                onPress={() => setSearch('')}
                style={styles.clearSearchBtn}
                accessibilityRole="button"
                accessibilityLabel="Clear search text"
                {...(Platform.OS === 'web' ? { title: 'Clear search query' } : {})}
              >
                <Feather name="x" size={16} color={colors.mutedText} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>User:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {availableUsers.map((u) => (
                <Chip
                  key={u}
                  label={u}
                  selected={userFilter === u}
                  onPress={() => setUserFilter(u)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Action:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['All', ...ACTIONS].map((a) => (
                <Chip
                  key={a}
                  label={a}
                  selected={actionFilter === a}
                  onPress={() => setActionFilter(a)}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statsRow}>
            <Text style={typography.caption}>
              Showing <Text style={{ fontWeight: '700' }}>{filtered.length}</Text> of{' '}
              {entries.length} log entr(ies)
            </Text>
            {(userFilter !== 'All' || actionFilter !== 'All' || search) && (
              <TouchableOpacity onPress={handleResetFilters}>
                <Text style={styles.resetText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>

          {filtered.map((e) => {
            const s = ACTION_STYLE[e.action] || {
              bg: colors.statusPendingBg,
              text: colors.statusPendingText,
            };
            return (
              <View key={e.id} style={styles.row}>
                <View style={styles.rowHeader}>
                  <View style={[styles.actionPill, { backgroundColor: s.bg }]}>
                    <Text style={[styles.actionPillText, { color: s.text }]}>{e.action}</Text>
                  </View>
                  <Text style={typography.caption}>
                    {e.date} · {e.time}
                    {e.ip ? ` · ${e.ip}` : ''}
                  </Text>
                </View>

                <Text style={typography.bodyBold}>
                  {e.user} <Text style={{ fontWeight: '400' }}>{e.action}</Text> {e.resource}
                </Text>

                {Boolean(e.oldValue || e.newValue) && (
                  <View style={styles.changeBlock}>
                    {Boolean(e.oldValue) && <Text style={styles.oldValue}>Old: {e.oldValue}</Text>}
                    {Boolean(e.newValue) && <Text style={styles.newValue}>New: {e.newValue}</Text>}
                  </View>
                )}
              </View>
            );
          })}

          {filtered.length === 0 && (
            <View style={styles.emptyContainer}>
              <Feather name="file-text" size={44} color={colors.mutedText} />
              <Text style={[typography.h3, { marginTop: spacing.md }]}>
                No Audit Log Entries Found
              </Text>
              <Text style={[typography.caption, styles.emptySubtext]}>
                {search || userFilter !== 'All' || actionFilter !== 'All'
                  ? 'No activity matches your current filters. Try resetting your search or filter options.'
                  : 'No audit records have been captured yet.'}
              </Text>
              {(search || userFilter !== 'All' || actionFilter !== 'All') && (
                <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters}>
                  <Text style={styles.resetBtnText}>Reset All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  mainWrapper: {
    flex: 1,
    width: '100%',
  },
  containerTablet: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerLeft: { gap: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  exportBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  filtersRow: {
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
    paddingHorizontal: spacing.md,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    color: colors.navyText,
    fontSize: 14,
  },
  clearSearchBtn: { padding: spacing.xs },
  filterGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  filterLabel: { fontSize: 12, fontWeight: '700', color: colors.mutedText, width: 50 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginRight: spacing.xs,
    backgroundColor: colors.bgApp,
  },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  chipTextSelected: { color: colors.navyText, fontWeight: '700' },
  content: { padding: spacing.lg, gap: spacing.md },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.statusInProgressText,
  },
  row: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  actionPillText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  changeBlock: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  oldValue: { fontSize: 12, color: colors.statusRevisionText },
  newValue: { fontSize: 12, color: colors.statusCompletedText, fontWeight: '700' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptySubtext: {
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 400,
  },
  resetBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
});
