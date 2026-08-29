// screens/programdirector/IupLibraryScreen.tsx
// SCR-PD-004: IUP Library Management

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import StatusPill from '../../components/StatusPill';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getIupLibrary, archiveIup } from '../../api/programDirectorApi';
import type { ProgramDirectorStackParamList } from '../../types';

interface IupRecord {
  id: string;
  studentId: string;
  studentName: string;
  program: string;
  finalizedDate: string;
  goalCount: number;
  version: string;
  status: string;
}

export default function IupLibraryScreen({
  navigation,
}: NativeStackScreenProps<ProgramDirectorStackParamList, 'IupLibrary'>) {
  const [list, setList] = useState<IupRecord[] | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [exportTarget, setExportTarget] = useState<IupRecord | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getIupLibrary({ search, status: statusFilter });
      setList(Array.isArray(res) ? res : []);
    } catch {
      setList([]);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleArchive = (iup: IupRecord) => {
    Alert.alert(`Archive ${iup.studentName}'s IUP?`, 'This will mark the plan as Archived.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            await archiveIup(iup.id);
            await load();
          } catch {}
        },
      },
    ]);
  };

  const buildExportText = (iup: IupRecord) =>
    [
      '================================================================',
      `MELU'E FOUNDATION — IUP RECORD ARCHIVE`,
      '================================================================',
      `Student: ${iup.studentName}`,
      `Program: ${iup.program}`,
      `Plan Status: ${iup.status}`,
      `Finalized Date: ${iup.finalizedDate}`,
      `Target Goals Assigned: ${iup.goalCount}`,
      `Plan Version: v${iup.version}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '================================================================',
    ].join('\n');

  const filtered = useMemo(() => {
    if (!list) return [];
    return list.filter(
      (i) =>
        (statusFilter === 'All' || i.status === statusFilter) &&
        (!search || i.studentName.toLowerCase().includes(search.toLowerCase()))
    );
  }, [list, statusFilter, search]);

  const stats = useMemo(() => {
    if (!list) return { total: 0, active: 0, drafts: 0, archived: 0 };
    return {
      total: list.length,
      active: list.filter((i) => i.status === 'Active').length,
      drafts: list.filter((i) => i.status === 'Draft').length,
      archived: list.filter((i) => i.status === 'Archived').length,
    };
  }, [list]);

  if (!list) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="IUP Library" onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t])} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeIcon}>
              <Feather name="folder" size={20} color={colors.navyText} />
            </View>
            <View>
              <Text style={styles.pageTitle}>IUP Library Management</Text>
              <Text style={styles.pageSubtitle}>Search, review, export, and manage all student intervention plans</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.newIupBtn}
            onPress={() => navigation?.navigate?.('IupGeneration')}
          >
            <Feather name="plus" size={16} color={colors.navyText} />
            <Text style={styles.newIupBtnText}>New IUP Plan</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Plans</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#166534' }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active Plans</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#B45309' }]}>{stats.drafts}</Text>
            <Text style={styles.statLabel}>Drafts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.mutedText }]}>{stats.archived}</Text>
            <Text style={styles.statLabel}>Archived</Text>
          </View>
        </View>

        {/* Search & Filter Header */}
        <View style={styles.card}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <Feather name="search" size={16} color={colors.mutedText} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search plans by student name..."
                placeholderTextColor={colors.mutedText}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Feather name="x" size={16} color={colors.mutedText} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Status Filter:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['All', 'Active', 'Draft', 'Archived'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
                  onPress={() => setStatusFilter(s)}
                >
                  <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* IUP Plans List */}
        <View style={styles.listSection}>
          {filtered.map((iup) => (
            <View key={iup.id} style={styles.iupCard}>
              <View style={styles.iupCardMain}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentAvatarText}>{iup.studentName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.iupTitleRow}>
                    <Text style={styles.iupStudentName}>{iup.studentName}</Text>
                    <View style={styles.versionBadge}>
                      <Text style={styles.versionBadgeText}>v{iup.version}</Text>
                    </View>
                  </View>
                  <Text style={styles.iupMeta}>
                    {iup.program} · Finalized: {iup.finalizedDate} · {iup.goalCount} Target Goals
                  </Text>
                </View>
                <StatusPill
                  status={iup.status === 'Active' ? 'approved' : iup.status === 'Draft' ? 'pending' : 'notStarted'}
                  label={iup.status}
                />
              </View>

              <View style={styles.iupCardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setExportTarget(iup)}
                >
                  <Feather name="eye" size={14} color={colors.navyText} />
                  <Text style={styles.actionBtnText}>View / Export</Text>
                </TouchableOpacity>

                {iup.status === 'Draft' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editDraftBtn]}
                    onPress={() => navigation?.navigate?.('IupGeneration', { studentId: iup.studentId })}
                  >
                    <Feather name="edit-2" size={14} color={colors.navyText} />
                    <Text style={styles.actionBtnText}>Edit Draft</Text>
                  </TouchableOpacity>
                )}

                {iup.status !== 'Archived' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.archiveBtn]}
                    onPress={() => handleArchive(iup)}
                  >
                    <Feather name="archive" size={14} color="#EF4444" />
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Archive</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {filtered.length === 0 && (
            <View style={styles.emptyCard}>
              <Feather name="inbox" size={36} color={colors.mutedText} />
              <Text style={styles.emptyTitle}>No IUP Plans Found</Text>
              <Text style={styles.emptySub}>No intervention plans matched your search or status filter.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <ExportPreviewModal
        visible={!!exportTarget}
        title="IUP Plan Record"
        filename={exportTarget ? `${exportTarget.studentName.replace(/\s+/g, '_')}_IUP_v${exportTarget.version}.txt` : ''}
        content={exportTarget ? buildExportText(exportTarget) : ''}
        onClose={() => setExportTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 40 },

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
  newIupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  newIupBtnText: { fontSize: 13, fontWeight: '700', color: colors.navyText },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: {
    flexGrow: 1,
    minWidth: 130,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statNumber: { fontSize: 22, fontWeight: '700', color: colors.navyText },
  statLabel: { fontSize: 11, fontWeight: '600', color: colors.bodyText, marginTop: 2 },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  searchRow: { flexDirection: 'row', gap: spacing.sm },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgApp,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 13, color: colors.navyText },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  filterLabel: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginRight: spacing.xs,
    backgroundColor: colors.bgApp,
  },
  filterChipActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellowDark },
  filterChipText: { fontSize: 11, fontWeight: '600', color: colors.bodyText },
  filterChipTextActive: { color: colors.navyText, fontWeight: '700' },

  listSection: { gap: spacing.md },
  iupCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  iupCardMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  studentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: { fontSize: 17, fontWeight: '700', color: colors.navyText },
  iupTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iupStudentName: { fontSize: 15, fontWeight: '700', color: colors.navyText },
  versionBadge: { backgroundColor: colors.bgApp, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill },
  versionBadgeText: { fontSize: 10, fontWeight: '700', color: colors.bodyText },
  iupMeta: { fontSize: 12, color: colors.bodyText, marginTop: 2 },

  iupCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.bgApp,
    paddingTop: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.bgApp,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  editDraftBtn: { backgroundColor: '#FEF9C3', borderColor: colors.primaryYellowDark },
  archiveBtn: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },

  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText, marginTop: spacing.xs },
  emptySub: { fontSize: 12, color: colors.mutedText, textAlign: 'center' },
});

