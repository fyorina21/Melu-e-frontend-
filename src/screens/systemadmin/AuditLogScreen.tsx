
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { SYS_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getAuditLogs } from '../../api/SystemAdminApi';
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

const USERS = ['Sysadmin A', 'Teacher A', 'Coordinator A', 'Director A', 'Institutional Admin'];
const ACTIONS = ['created', 'updated', 'deleted', 'changed'];

type Props = NativeStackScreenProps<SystemAdminStackParamList, 'AuditLog'>;

export default function AuditLogScreen({ navigation }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [userFilter, setUserFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await getAuditLogs({ user: userFilter, action: actionFilter, search });
      setEntries(data);
    } catch (err) {
      setEntries(DEMO_ENTRIES);
    }
  }, [userFilter, actionFilter, search]);

  useEffect(() => { load(); }, [load]);

  const filtered = entries.filter(
    (e) =>
      (userFilter === 'All' || e.user === userFilter) &&
      (actionFilter === 'All' || e.action === actionFilter) &&
      (!search || e.resource.toLowerCase().includes(search.toLowerCase()) || e.user.toLowerCase().includes(search.toLowerCase()))
  );

  const Chip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Audit Log" onTabPress={(t) => navigation?.navigate?.(SYS_ROUTE_BY_TAB[t])} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View>
            <Text style={typography.h1}>Audit Log</Text>
          </View>
        </View>
      </View>

      <View style={styles.filtersRow}>
        <TextInput style={styles.searchInput} placeholder="Search by user or resource..." placeholderTextColor={colors.mutedText} value={search} onChangeText={setSearch} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['All', ...USERS].map((u) => <Chip key={u} label={u} selected={userFilter === u} onPress={() => setUserFilter(u)} />)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['All', ...ACTIONS].map((a) => <Chip key={a} label={a} selected={actionFilter === a} onPress={() => setActionFilter(a)} />)}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.caption}>{filtered.length} log entr(ies)</Text>
        {filtered.map((e) => {
          const s = ACTION_STYLE[e.action];
          return (
            <View key={e.id} style={styles.row}>
              <View style={styles.rowHeader}>
                <View style={[styles.actionPill, { backgroundColor: s.bg }]}><Text style={[styles.actionPillText, { color: s.text }]}>{e.action}</Text></View>
                <Text style={typography.caption}>{e.date} · {e.time}{e.ip ? ` · ${e.ip}` : ''}</Text>
              </View>
              <Text style={typography.bodyBold}>{e.user} {e.action} {e.resource}</Text>
              {(e.oldValue || e.newValue) && (
                <View style={styles.changeBlock}>
                  {e.oldValue && <Text style={styles.oldValue}>Old: {e.oldValue}</Text>}
                  {e.newValue && <Text style={styles.newValue}>New: {e.newValue}</Text>}
                </View>
              )}
            </View>
          );
        })}
        {filtered.length === 0 && <Text style={[typography.body, { color: colors.mutedText, textAlign: 'center', padding: spacing.xl }]}>No log entries match these filters.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const DEMO_ENTRIES: AuditEntry[] = [
  { id: 'l1', user: 'Sysadmin A', action: 'created', date: 'Aug 12, 2026', time: '09:14', resource: 'Staff Account #102 (Teacher C)', oldValue: undefined, newValue: 'teacher_c@melue.org' },
  { id: 'l2', user: 'Teacher A', action: 'updated', date: 'Aug 12, 2026', time: '11:40', resource: 'Goal #45 (Eye Contact)', oldValue: 'Progress 55%', newValue: 'Progress 72%' },
  { id: 'l3', user: 'Coordinator A', action: 'deleted', date: 'Aug 11, 2026', time: '15:22', resource: 'Assessment #13 (Old Skills Form)', oldValue: 'status: active', newValue: 'status: archived' },
  { id: 'l4', user: 'Institutional Admin', action: 'changed', date: 'Aug 11, 2026', time: '16:05', resource: 'Clinic Settings', oldValue: 'session length: 30 min', newValue: 'session length: 45 min' },
  { id: 'l5', user: 'Director A', action: 'updated', date: 'Aug 10, 2026', time: '10:31', resource: 'Schedule Block #7', oldValue: 'Room 1', newValue: 'Room 2' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  filtersRow: { padding: spacing.md, gap: spacing.sm, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.bgApp },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs, backgroundColor: colors.bgApp },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  chipTextSelected: { color: colors.navyText },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  actionPillText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  changeBlock: { backgroundColor: colors.bgApp, borderRadius: radius.sm, padding: spacing.sm, gap: spacing.xs },
  oldValue: { fontSize: 12, color: colors.statusRevisionText },
  newValue: { fontSize: 12, color: colors.statusCompletedText, fontWeight: '700' },
});
