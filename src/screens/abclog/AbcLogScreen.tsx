import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenLoader from '../../components/ScreenLoader';
import AppNavbar from '../../components/AppNavbar';
import { colors, radius, spacing } from '../../theme/colors';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getAbcLog, exportAbcLog, deleteAbcIncident } from '../../api/teacherExtrasApi';
import { getStudentOptions, type StudentOption } from '../../api/optionsApi';
import { openPrintWindow } from '../../utils/webExport';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'AbcLog'>;

interface AbcStats {
  totalIncidents: number;
  mostCommonBehavior: string;
  mostCommonAntecedent: string;
  thisWeek: number;
}

interface AbcIncident {
  id: string;
  date?: string;
  time?: string;
  location?: string;
  behavior?: string;
  frequency?: string;
  intensity?: string;
  category?: string;
  antecedent?: string;
  consequence?: string;
  notes?: string;
  teacher?: string;
}

const PAGE_SIZE = 10;

const TABLE_COLUMNS: Array<{ key: keyof AbcIncident; label: string; width: number }> = [
  { key: 'date', label: 'Date', width: 90 },
  { key: 'time', label: 'Time', width: 80 },
  { key: 'location', label: 'Location', width: 110 },
  { key: 'behavior', label: 'Behavior', width: 160 },
  { key: 'frequency', label: 'Frequency', width: 100 },
  { key: 'intensity', label: 'Intensity', width: 100 },
  { key: 'category', label: 'Category', width: 150 },
  { key: 'antecedent', label: 'Antecedent', width: 160 },
  { key: 'consequence', label: 'Consequence', width: 180 },
  { key: 'teacher', label: 'Teacher', width: 130 },
];

const isoDate = (d: Date) => d.toISOString().split('T')[0];

function getDefaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: isoDate(from), to: isoDate(to) };
}

const intensityStyle = (intensity?: string) => {
  switch (intensity) {
    case 'Low':
    case 'Mild':
      return { bg: '#F0FDF4', text: '#16A34A' };
    case 'Medium':
    case 'Moderate':
      return { bg: '#FEFCE8', text: '#A16207' };
    default:
      return { bg: '#FEF2F2', text: '#B91C1C' };
  }
};

export default function AbcLogScreen({ navigation }: Props) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const defaultRange = useMemo(getDefaultDateRange, []);

  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState<string>('');
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [behaviorFilter, setBehaviorFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [behaviorMenuOpen, setBehaviorMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [behaviorOptions, setBehaviorOptions] = useState<string[]>(['All']);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(['All']);
  const [incidents, setIncidents] = useState<AbcIncident[]>([]);
  const [stats, setStats] = useState<AbcStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIncident, setSelectedIncident] = useState<AbcIncident | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const isSysadmin = session?.role === ROLES.SYSTEM_ADMIN;
  const currentStudent = studentOptions.find((s) => s.id === studentId);

  useEffect(() => {
    let active = true;
    getStudentOptions()
      .then(({ data: opts }) => {
        if (!active) return;
        const list = Array.isArray(opts) ? opts : [];
        const activeStudents = list.filter(
          (s: StudentOption) => !s.phase || s.phase.toLowerCase() === 'active'
        );
        const finalList = activeStudents.length > 0 ? activeStudents : list;
        setStudentOptions(finalList);
        if (finalList.length > 0) {
          setStudentId((prev) => prev || finalList[0].id);
        }
      })
      .catch(() => {
        if (active) {
          setStudentOptions([]);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: res } = await getAbcLog({
        studentId,
        from,
        to,
        behavior: behaviorFilter,
        category: categoryFilter,
      });
      const rows: AbcIncident[] = res?.incidents ?? res?.rows ?? [];
      setIncidents(rows);
      setStats(res?.stats ?? null);
    } catch (err) {
      setIncidents([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [studentId, from, to, behaviorFilter, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Load full option lists once so filters don't shrink as they are applied.
  useEffect(() => {
    if (!studentId) return;
    getAbcLog({ studentId })
      .then(({ data: res }) => {
        const rows: AbcIncident[] = res?.incidents ?? res?.rows ?? [];
        setBehaviorOptions(['All', ...Array.from(new Set(rows.map((r) => r.behavior).filter(Boolean) as string[])).sort()]);
        setCategoryOptions(['All', ...Array.from(new Set(rows.map((r) => r.category).filter(Boolean) as string[])).sort()]);
      })
      .catch(() => {});
  }, [studentId]);

  const totalPages = Math.max(1, Math.ceil(incidents.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = incidents.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleDeleteIncident = async () => {
    if (!selectedIncident) return;
    try {
      await deleteAbcIncident(selectedIncident.id);
      showToast('Incident deleted');
    } catch (err) {
      showToast('Failed to delete incident', 'error');
    }
    setSelectedIncident(null);
    setDeleteConfirm(false);
    load();
  };

  const handleExport = async (type: string) => {
    setExportMenuOpen(false);
    try {
      await exportAbcLog({ studentId, from, to });
    } catch (err) {}
    const header = TABLE_COLUMNS.map((c) => c.label).join(',');
    const lines = incidents.map((r) =>
      TABLE_COLUMNS.map((c) => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const content = [
      `Melu'e Foundation — ABC Data Sheet`,
      `Student: ${currentStudent?.name ?? ''}`,
      `Range: ${from} to ${to}`,
      `Filters: Behavior ${behaviorFilter} · Category ${categoryFilter}`,
      '',
      `TOTAL INCIDENTS: ${stats?.totalIncidents ?? 0}`,
      `MOST COMMON BEHAVIOR: ${stats?.mostCommonBehavior ?? 'N/A'}`,
      `MOST COMMON ANTECEDENT: ${stats?.mostCommonAntecedent ?? 'N/A'}`,
      `THIS WEEK: ${stats?.thisWeek ?? 0}`,
      '',
      header,
      ...lines,
    ].join('\n');

    const title = type === 'pdf' ? 'ABC Data Sheet Export (PDF)' : 'ABC Data Sheet Export (CSV)';
    const formattedHtml = `
      <html>
        <head><title>${title}</title>
        <style>
          body { font-family: monospace; white-space: pre-wrap; padding: 20px; font-size: 14px; line-height: 1.5; color: #1e293b; }
        </style></head>
        <body>${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
      </html>
    `;
    openPrintWindow(formattedHtml, title);
    showToast(`${type.toUpperCase()} export opened`);
  };

  if (loading && incidents.length === 0 && !stats) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="ABC Log" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      {/* Header card */}
      <View style={[styles.card, styles.headerCard]}>
        <View style={styles.headerRow}>
          <View style={styles.studentBlock}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{currentStudent?.name?.[0] ?? '?'}</Text>
            </View>
            <View>
              <View style={styles.studentSelector}>
                <TouchableOpacity
                  style={styles.studentDropdown}
                  onPress={() => setStudentMenuOpen((v) => !v)}
                >
                  <Text style={styles.studentName}>{currentStudent?.name ?? 'Select student'}</Text>
                  <Feather name="chevron-down" size={14} color="#64748B" />
                </TouchableOpacity>
                <Text style={styles.ageText}>Age {currentStudent?.age ?? '—'}</Text>
              </View>
              <Text style={styles.sheetLabel}>ABC Data Sheet</Text>
            </View>
            {studentMenuOpen && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={{ maxHeight: 220 }}>
                  {studentOptions.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.dropdownItem, s.id === studentId && styles.dropdownItemSelected]}
                      onPress={() => {
                        setStudentId(s.id);
                        setPage(1);
                        setStudentMenuOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          s.id === studentId && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          <View style={styles.codeBadge}>
            <Text style={styles.codeBadgeText}>SCR-003A</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Filter bar */}
        <View style={[styles.card, styles.filterCard]}>
          <View style={styles.filterRow}>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>From</Text>
              <TextInput
                style={styles.filterInput}
                value={from}
                onChangeText={(v) => {
                  setFrom(v);
                  setPage(1);
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>To</Text>
              <TextInput
                style={styles.filterInput}
                value={to}
                onChangeText={(v) => {
                  setTo(v);
                  setPage(1);
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Behavior</Text>
              <View>
                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => {
                    setBehaviorMenuOpen((v) => !v);
                    setCategoryMenuOpen(false);
                  }}
                >
                  <Text style={styles.selectBtnText}>{behaviorFilter}</Text>
                  <Feather name="chevron-down" size={12} color="#64748B" />
                </TouchableOpacity>
                {behaviorMenuOpen && (
                  <View style={styles.selectMenu}>
                    <ScrollView style={{ maxHeight: 200 }}>
                      {behaviorOptions.map((b) => (
                        <TouchableOpacity
                          key={b}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setBehaviorFilter(b);
                            setPage(1);
                            setBehaviorMenuOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{b}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Category</Text>
              <View>
                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => {
                    setCategoryMenuOpen((v) => !v);
                    setBehaviorMenuOpen(false);
                  }}
                >
                  <Text style={styles.selectBtnText}>{categoryFilter}</Text>
                  <Feather name="chevron-down" size={12} color="#64748B" />
                </TouchableOpacity>
                {categoryMenuOpen && (
                  <View style={styles.selectMenu}>
                    <ScrollView style={{ maxHeight: 200 }}>
                      {categoryOptions.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setCategoryFilter(c);
                            setPage(1);
                            setCategoryMenuOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Export */}
            <View style={styles.exportWrap}>
              <TouchableOpacity style={styles.exportBtn} onPress={() => setExportMenuOpen((v) => !v)}>
                <Text style={styles.exportBtnText}>Export</Text>
                <Feather name="chevron-down" size={14} color="#1E293B" />
              </TouchableOpacity>
              {exportMenuOpen && (
                <View style={styles.exportMenu}>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => handleExport('csv')}>
                    <Text style={styles.dropdownItemText}>Export CSV</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => handleExport('pdf')}>
                    <Text style={styles.dropdownItemText}>Export PDF</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statCaption}>Total Incidents</Text>
            <Text style={[styles.statValueLg, { color: '#0EA5E9' }]}>{stats?.totalIncidents ?? 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCaption}>Most Common Behavior</Text>
            <Text style={styles.statValueMd}>{stats?.mostCommonBehavior ?? 'N/A'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCaption}>Most Common Antecedent</Text>
            <Text style={styles.statValueMd}>{stats?.mostCommonAntecedent ?? 'N/A'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCaption}>This Week</Text>
            <Text style={[styles.statValueLg, { color: '#FACC15' }]}>{stats?.thisWeek ?? 0}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableCard}>
          <ScrollView horizontal>
            <View>
              <View style={styles.tableHeaderRow}>
                {TABLE_COLUMNS.map((col) => (
                  <View key={col.key} style={[styles.headerCell, { width: col.width }]}>
                    <Text style={styles.headerCellText}>{col.label}</Text>
                  </View>
                ))}
              </View>
              {paginated.length === 0 && (
                <Text style={styles.emptyText}>No incidents found for the selected filters.</Text>
              )}
              {paginated.map((inc, idx) => (
                <TouchableOpacity
                  key={inc.id}
                  style={[styles.tableRow, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}
                  onPress={() => {
                    setSelectedIncident(inc);
                    setDeleteConfirm(false);
                  }}
                >
                  {TABLE_COLUMNS.map((col) => (
                    <View key={col.key} style={[styles.cell, { width: col.width }]}>
                      {col.key === 'intensity' ? (
                        <View
                          style={[
                            styles.intensityBadge,
                            { backgroundColor: intensityStyle(inc.intensity).bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.intensityBadgeText,
                              { color: intensityStyle(inc.intensity).text },
                            ]}
                          >
                            {inc.intensity ?? '—'}
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={
                            col.key === 'behavior'
                              ? styles.cellTextStrong
                              : col.key === 'date'
                                ? styles.cellTextDate
                                : styles.cellText
                          }
                          numberOfLines={2}
                        >
                          {inc[col.key] || '—'}
                        </Text>
                      )}
                    </View>
                  ))}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.paginationBar}>
            <Text style={styles.paginationInfo}>
              Showing{' '}
              {incidents.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, incidents.length)} of {incidents.length} incidents
            </Text>
            {totalPages > 1 && (
              <View style={styles.paginationControls}>
                <TouchableOpacity
                  style={[styles.pageBtn, safePage === 1 && styles.pageBtnDisabled]}
                  disabled={safePage === 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <Text style={styles.pageBtnText}>Prev</Text>
                </TouchableOpacity>
                <Text style={styles.paginationInfo}>
                  {safePage} / {totalPages}
                </Text>
                <TouchableOpacity
                  style={[styles.pageBtn, safePage === totalPages && styles.pageBtnDisabled]}
                  disabled={safePage === totalPages}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <Text style={styles.pageBtnText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Incident Detail Modal */}
      <Modal visible={selectedIncident !== null} transparent animationType="fade" onRequestClose={() => setSelectedIncident(null)}>
        <View style={styles.overlay}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Incident Details</Text>
              <TouchableOpacity
                hitSlop={8}
                onPress={() => {
                  setSelectedIncident(null);
                  setDeleteConfirm(false);
                }}
              >
                <Feather name="x" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View style={styles.detailGrid}>
                {(
                  [
                    ['Date', selectedIncident?.date],
                    ['Time', selectedIncident?.time],
                    ['Location', selectedIncident?.location],
                    ['Teacher', selectedIncident?.teacher],
                    ['Behavior', selectedIncident?.behavior],
                    ['Frequency', selectedIncident?.frequency],
                    ['Intensity', selectedIncident?.intensity],
                    ['Category', selectedIncident?.category],
                    ['Antecedent', selectedIncident?.antecedent],
                    ['Consequence', selectedIncident?.consequence],
                  ] as Array<[string, string | undefined]>
                ).map(([label, value]) => (
                  <View key={label} style={styles.detailField}>
                    <Text style={styles.statCaption}>{label}</Text>
                    <Text style={styles.detailFieldValue}>{value || '—'}</Text>
                  </View>
                ))}
                <View style={styles.detailNotes}>
                  <Text style={styles.statCaption}>Notes</Text>
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{selectedIncident?.notes || 'No notes recorded.'}</Text>
                  </View>
                </View>
              </View>

              {isSysadmin && (
                <View style={styles.deleteSection}>
                  {!deleteConfirm ? (
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteConfirm(true)}>
                      <Text style={styles.deleteBtnText}>Delete Incident</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.confirmBox}>
                      <Text style={styles.confirmText}>
                        Are you sure you want to delete this incident? This action cannot be undone.
                      </Text>
                      <View style={styles.confirmRow}>
                        <TouchableOpacity style={styles.confirmDeleteBtn} onPress={handleDeleteIncident}>
                          <Text style={styles.deleteBtnText}>Yes, Delete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelDeleteBtn}
                          onPress={() => setDeleteConfirm(false)}
                        >
                          <Text style={styles.cancelDeleteText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  content: { padding: spacing.lg, gap: spacing.md },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  studentBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, position: 'relative', zIndex: 100 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#94A3B8' },
  studentSelector: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  studentDropdown: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  studentName: { fontSize: 20, fontWeight: '700', color: colors.navyText },
  ageText: { fontSize: 13, color: '#64748B' },
  sheetLabel: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  codeBadge: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  codeBadgeText: { fontSize: 11, fontWeight: '600', color: '#0369A1' },

  dropdownMenu: {
    position: 'absolute',
    top: 56,
    left: 64,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minWidth: 180,
    zIndex: 1000,
    elevation: 5,
  },
  selectMenu: {
    position: 'absolute',
    top: 38,
    left: 0,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minWidth: 170,
    zIndex: 1000,
    elevation: 5,
  },
  exportMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minWidth: 150,
    zIndex: 1000,
    elevation: 5,
  },
  dropdownItem: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  dropdownItemSelected: { backgroundColor: '#E0F2FE' },
  dropdownItemText: { fontSize: 13, color: colors.navyText },
  dropdownItemTextSelected: { fontWeight: '700', color: '#0369A1' },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: spacing.sm },
  filterField: { gap: 4 },
  filterLabel: { fontSize: 11, fontWeight: '500', color: '#64748B', textTransform: 'uppercase' },
  filterInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontSize: 13,
    color: colors.navyText,
    minWidth: 120,
    backgroundColor: colors.white,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    minWidth: 140,
    backgroundColor: colors.white,
  },
  selectBtnText: { fontSize: 13, color: colors.navyText },
  exportWrap: { marginLeft: 'auto', position: 'relative' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDE047',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
  },
  exportBtnText: { fontSize: 13, fontWeight: '600', color: '#1E293B' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 150,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  statCaption: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValueLg: { fontSize: 30, fontWeight: '700' },
  statValueMd: { fontSize: 15, fontWeight: '700', color: colors.navyText },

  tableCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#38BDF8' },
  headerCell: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  headerCellText: { color: colors.white, fontWeight: '600', fontSize: 13 },
  tableRow: { flexDirection: 'row' },
  rowEven: { backgroundColor: colors.white },
  rowOdd: { backgroundColor: '#F8FAFC' },
  cell: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, justifyContent: 'center' },
  cellText: { fontSize: 12, color: '#475569' },
  cellTextDate: { fontSize: 12, color: '#334155' },
  cellTextStrong: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  intensityBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  intensityBadgeText: { fontSize: 11, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#94A3B8', paddingVertical: 40 },

  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#F8FAFC',
  },
  paginationInfo: { fontSize: 12, color: '#64748B' },
  paginationControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pageBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 12, fontWeight: '500', color: '#475569' },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalPanel: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 640,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.navyText },
  modalBody: { padding: spacing.xl, gap: spacing.md },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  detailField: { flexBasis: '45%', flexGrow: 1, gap: 2 },
  detailFieldValue: { fontSize: 13, fontWeight: '600', color: colors.navyText },
  detailNotes: { flexBasis: '100%' },
  notesBox: { backgroundColor: '#F8FAFC', borderRadius: radius.md, padding: spacing.md },
  notesText: { fontSize: 13, color: '#334155', lineHeight: 19 },

  deleteSection: { marginTop: spacing.sm },
  deleteBtn: {
    backgroundColor: '#DC2626',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  deleteBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  confirmBox: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  confirmText: { fontSize: 13, fontWeight: '500', color: '#B91C1C' },
  confirmRow: { flexDirection: 'row', gap: spacing.md },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelDeleteBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelDeleteText: { color: '#374151', fontWeight: '600', fontSize: 13 },
  headerCard: { zIndex: 30, elevation: 30 },
  filterCard: { zIndex: 20, elevation: 20 },
});
