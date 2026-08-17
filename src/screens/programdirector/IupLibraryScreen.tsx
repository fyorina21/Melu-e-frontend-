// screens/programdirector/IupLibraryScreen.js
// SCR-PD-004: IUP Library Management

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import StatusPill from '../../components/StatusPill';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import ProgramDirectorNav from './components/ProgramDirectorNav';
import { PD_ROUTE_BY_TAB } from './components/pdNavRoutes';
import { getIupLibrary, archiveIup } from '../../api/programDirectorApi';
import type { ProgramDirectorStackParamList } from '../../types';

interface IupRecord {
  id: string;
  studentId: string;
  studentName: string;
  program: string;
  finalizedDate: string;
  goalCount: number;
  version: number;
  status: string;
}

export default function IupLibraryScreen({ navigation }: NativeStackScreenProps<ProgramDirectorStackParamList, 'IupLibrary'>) {
  const [list, setList] = useState<IupRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [exportTarget, setExportTarget] = useState<IupRecord | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getIupLibrary({ search, status: statusFilter });
      setList(data);
    } catch (err) {
      setList(DEMO_LIST);
    }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleArchive = (iup: IupRecord) => {
    Alert.alert(`Archive ${iup.studentName}'s IUP?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try { await archiveIup(iup.id); } catch (err) {}
          setList((prev) => prev.map((i) => (i.id === iup.id ? { ...i, status: 'Archived' } : i)));
        },
      },
    ]);
  };

  const buildExportText = (iup: IupRecord) =>
    [
      `Melu'e Foundation — IUP Record`,
      `Student: ${iup.studentName}`,
      `Program: ${iup.program}`,
      `Status: ${iup.status}`,
      `Finalized: ${iup.finalizedDate}`,
      `Goal count: ${iup.goalCount}`,
      `Version: v${iup.version}`,
      '',
      `Exported ${new Date().toLocaleDateString()}`,
    ].join('\n');

  const filtered = list.filter(
    (i) =>
      (statusFilter === 'All' || i.status === statusFilter) &&
      (!search || i.studentName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ProgramDirectorNav activeTab="Library" onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t])} />
      <View style={styles.header}>
        <Text style={typography.h1}>IUP Library Management</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} placeholder="Search by student name..." placeholderTextColor={colors.mutedText} value={search} onChangeText={setSearch} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['All', 'Active', 'Draft', 'Archived'].map((s) => (
            <TouchableOpacity key={s} style={[styles.filterChip, statusFilter === s && styles.filterChipActive]} onPress={() => setStatusFilter(s)}>
              <Text style={typography.body}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.map((iup) => (
          <View key={iup.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{iup.studentName}</Text>
              <Text style={typography.caption}>{iup.program} · Finalized {iup.finalizedDate} · {iup.goalCount} goals · v{iup.version}</Text>
            </View>
            <StatusPill status={iup.status === 'Active' ? 'approved' : iup.status === 'Draft' ? 'pending' : 'notStarted'} label={iup.status} />
            <View style={styles.rowActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setExportTarget(iup)}>
                <Feather name="eye" size={16} color={colors.navyText} />
              </TouchableOpacity>
              {iup.status === 'Draft' && (
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation?.navigate?.('IupGeneration', { studentId: iup.studentId })}>
                  <Feather name="edit-2" size={16} color={colors.navyText} />
                </TouchableOpacity>
              )}
              {iup.status !== 'Archived' && (
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleArchive(iup)}>
                  <Feather name="archive" size={16} color={colors.navyText} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        {filtered.length === 0 && <Text style={[typography.body, { color: colors.mutedText, textAlign: 'center' }]}>No IUPs match these filters.</Text>}
      </ScrollView>

      <ExportPreviewModal
        visible={!!exportTarget}
        title="IUP Record"
        filename={exportTarget ? `${exportTarget.studentName.replace(/\s+/g, '_')}_IUP_v${exportTarget.version}.txt` : ''}
        content={exportTarget ? buildExportText(exportTarget) : ''}
        onClose={() => setExportTarget(null)}
      />
    </SafeAreaView>
  );
}

const DEMO_LIST: IupRecord[] = [
  { id: '1', studentId: 'student-a', studentName: 'Student A', program: 'Pooled-Out', finalizedDate: 'Jun 2, 2026', goalCount: 4, version: 2, status: 'Active' },
  { id: '2', studentId: 'student-b', studentName: 'Student B', program: 'Regular Program', finalizedDate: 'May 20, 2026', goalCount: 3, version: 1, status: 'Active' },
  { id: '3', studentId: 'student-d', studentName: 'Student D', program: 'Regular Program', finalizedDate: '—', goalCount: 2, version: 1, status: 'Draft' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchRow: { padding: spacing.md, gap: spacing.sm, backgroundColor: colors.bgCard },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.bgApp },
  filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs },
  filterChipActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  rowActions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: { width: 32, height: 32, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
});
