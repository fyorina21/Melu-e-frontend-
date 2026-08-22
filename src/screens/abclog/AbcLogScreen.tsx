import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getAbcLog, exportAbcLog } from '../../api/teacherExtrasApi';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'AbcLog'>;

interface AbcStats {
  totalIncidents: number;
  mostCommonBehavior: string;
  mostCommonAntecedent: string;
  thisWeek: number;
}

interface AbcIncidentRow {
  studentId: string;
  [key: string]: string | undefined;
}

interface AbcLogData {
  stats: AbcStats;
  incidents: AbcIncidentRow[];
}

const STUDENT_OPTIONS = [
  { id: 'student-a', name: 'Student A', age: 7, code: 'SCR-003A' },
  { id: 'student-b', name: 'Student B', age: 6, code: 'SCR-003B' },
  { id: 'student-c', name: 'Student C', age: 8, code: 'SCR-003C' },
  { id: 'student-d', name: 'Student D', age: 7, code: 'SCR-003D' },
];
const COLUMNS = ['Date', 'Time', 'Location', 'Behavior', 'Frequency', 'Intensity', 'Category', 'Antecedent', 'Consequence', 'Teacher'];
const BEHAVIOR_OPTIONS = ['Aggression', 'Tantrum', 'Elopement', 'Non-compliance', 'Self-injury'];
const CATEGORY_OPTIONS = ['Physical', 'Verbal', 'Disruptive'];

export default function AbcLogScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [studentId, setStudentId] = useState('student-a');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [from, setFrom] = useState('07/23/2026');
  const [to, setTo] = useState('08/22/2026');
  const [behaviorFilter, setBehaviorFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [data, setData] = useState<AbcLogData | null>(null);
  const [exportContent, setExportContent] = useState<string | null>(null);

  const buildData = useCallback((currentStudentId: string, behavior: string, category: string): AbcLogData => {
    // Filter by studentId as well as selected behavior/category
    const filtered = DEMO_INCIDENTS.filter(
      (r) =>
        r.studentId === currentStudentId &&
        (behavior === 'All' || r.behavior === behavior) &&
        (category === 'All' || r.category === category)
    );

    const behaviorCounts: Record<string, number> = {};
    const antecedentCounts: Record<string, number> = {};

    filtered.forEach((r) => {
      const b = r.behavior ?? '';
      const a = r.antecedent ?? '';
      if (b) behaviorCounts[b] = (behaviorCounts[b] || 0) + 1;
      if (a) antecedentCounts[a] = (antecedentCounts[a] || 0) + 1;
    });

    const top = (counts: Record<string, number>) =>
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

    const thisWeek = filtered.filter((r) => (r.date ?? '').startsWith('08/')).length;

    return {
      stats: {
        totalIncidents: filtered.length,
        mostCommonBehavior: top(behaviorCounts),
        mostCommonAntecedent: top(antecedentCounts),
        thisWeek,
      },
      incidents: filtered,
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getAbcLog({ studentId, from, to, behavior: behaviorFilter, category: categoryFilter });
      setData(res);
    } catch (err) {
      setData(buildData(studentId, behaviorFilter, categoryFilter));
    }
  }, [studentId, from, to, behaviorFilter, categoryFilter, buildData]);

  useEffect(() => { load(); }, [load]);

  const cycleFilter = (current: string, options: string[]) => {
    const idx = options.indexOf(current);
    return options[(idx + 1) % options.length];
  };

  const handleExport = async () => {
    try {
      await exportAbcLog({ studentId, from, to });
    } catch (err) {}
    const rows = data?.incidents ?? [];
    const header = COLUMNS.join(',');
    const lines = rows.map((r) => COLUMNS.map((c) => `"${(r[c.toLowerCase()] || '').replace(/"/g, '""')}"`).join(','));
    const stats = data?.stats;
    const content = [
      `Melu'e Foundation — ABC Data Sheet`,
      `Student: ${currentStudent?.name}`,
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
    setExportContent(content);
  };

  const currentStudent = STUDENT_OPTIONS.find((s) => s.id === studentId);

  if (!data) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="ABC Log" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      {/* Header Profile Card */}
      <View style={styles.header}>
        <View style={styles.studentSelectorRow}>
          <View style={styles.studentAvatar}>
            <Text style={styles.studentAvatarText}>{currentStudent?.name?.[0]}</Text>
          </View>
          <TouchableOpacity
            style={styles.studentDropdown}
            onPress={() => setShowStudentModal(true)}
          >
            <Text style={styles.studentDropdownName}>{currentStudent?.name}</Text>
            <Feather name="chevron-down" size={16} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.ageText}>Age {currentStudent?.age}</Text>

          <View style={{ flex: 1 }} />
          <View style={styles.badgeCode}>
            <Text style={styles.badgeCodeText}>{currentStudent?.code}</Text>
          </View>
        </View>
      </View>

      {/* Filters Row */}
      <View style={styles.filtersCard}>
        <View style={styles.filtersRow}>
          <Text style={styles.filterInlineLabel}>From</Text>
          <TextInput style={styles.textInputDate} value={from} onChangeText={setFrom} />

          <Text style={styles.filterInlineLabel}>To</Text>
          <TextInput style={styles.textInputDate} value={to} onChangeText={setTo} />

          <Text style={styles.filterInlineLabel}>Behavior</Text>
          <TouchableOpacity
            style={styles.selectChip}
            onPress={() => setBehaviorFilter((prev) => cycleFilter(prev, ['All', ...BEHAVIOR_OPTIONS]))}
          >
            <Text style={styles.selectChipText}>{behaviorFilter}</Text>
            <Feather name="chevron-down" size={14} color="#64748B" />
          </TouchableOpacity>

          <Text style={styles.filterInlineLabel}>Category</Text>
          <TouchableOpacity
            style={styles.selectChip}
            onPress={() => setCategoryFilter((prev) => cycleFilter(prev, ['All', ...CATEGORY_OPTIONS]))}
          >
            <Text style={styles.selectChipText}>{categoryFilter}</Text>
            <Feather name="chevron-down" size={14} color="#64748B" />
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <Text style={styles.exportBtnText}>Export</Text>
            <Feather name="chevron-down" size={14} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL INCIDENTS</Text>
            <Text style={styles.statValue}>{data.stats.totalIncidents}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>MOST COMMON BEHAVIOR</Text>
            <Text style={styles.statValueSmall}>{data.stats.mostCommonBehavior}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>MOST COMMON ANTECEDENT</Text>
            <Text style={styles.statValueSmall}>{data.stats.mostCommonAntecedent}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>THIS WEEK</Text>
            <Text style={styles.statValue}>{data.stats.thisWeek}</Text>
          </View>
        </View>

        {/* Data Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              {COLUMNS.map((c) => (
                <Text key={c} style={styles.tableHeaderCell}>{c}</Text>
              ))}
            </View>
            {data.incidents.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={[typography.body, { color: colors.mutedText }]}>No incidents found for the selected filters.</Text>
              </View>
            ) : (
              data.incidents.map((inc, i) => (
                <View key={i} style={styles.tableRow}>
                  {COLUMNS.map((c) => (
                    <Text key={c} style={styles.tableCell}>{inc[c.toLowerCase()] || '—'}</Text>
                  ))}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Student Select Dropdown Menu */}
      <Modal visible={showStudentModal} transparent animationType="fade" onRequestClose={() => setShowStudentModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowStudentModal(false)}>
          <View style={styles.studentDropdownMenu}>
            {STUDENT_OPTIONS.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={[styles.dropdownOption, student.id === studentId && styles.dropdownOptionActive]}
                onPress={() => {
                  setStudentId(student.id);
                  setShowStudentModal(false);
                }}
              >
                <Text style={[styles.dropdownOptionText, student.id === studentId && styles.dropdownOptionTextActive]}>
                  {student.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <ExportPreviewModal
        visible={!!exportContent}
        title="ABC Data Sheet Export"
        filename={`ABC_Data_${currentStudent?.name?.replace(/\s+/g, '_')}_${from}_to_${to}.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

// Demo Dataset with distinct student records
const DEMO_INCIDENTS: AbcIncidentRow[] = [
  // Student A records (matches screenshot defaults when 0 records show up if filters mismatch or custom values added)
  { studentId: 'student-a', date: '08/01/2026', time: '9:12 AM', location: 'Room 2', behavior: 'Tantrum', frequency: '2 times', intensity: 'High', category: 'Disruptive', antecedent: 'Transitions', consequence: 'Verbal redirection', teacher: 'Teacher A' },
  { studentId: 'student-a', date: '08/01/2026', time: '10:40 AM', location: 'Playground', behavior: 'Aggression', frequency: '1 time', intensity: 'High', category: 'Physical', antecedent: 'Peer proximity', consequence: 'Time-out', teacher: 'Teacher A' },
  
  // Student B records
  { studentId: 'student-b', date: '08/04/2026', time: '9:05 AM', location: 'Room 2', behavior: 'Elopement', frequency: '1 time', intensity: 'Medium', category: 'Physical', antecedent: 'Non-preferred task', consequence: 'Blocking + redirect', teacher: 'Teacher B' },
  { studentId: 'student-b', date: '08/05/2026', time: '1:22 PM', location: 'Room 1', behavior: 'Non-compliance', frequency: '4 times', intensity: 'Low', category: 'Verbal', antecedent: 'Instructions', consequence: 'Prompt hierarchy', teacher: 'Teacher A' },

  // Student C records
  { studentId: 'student-c', date: '07/29/2026', time: '11:00 AM', location: 'Room 2', behavior: 'Self-injury', frequency: '3 times', intensity: 'High', category: 'Physical', antecedent: 'Demand removal', consequence: 'Sensory break', teacher: 'Teacher B' },

  // Student D records
  { studentId: 'student-d', date: '07/25/2026', time: '8:55 AM', location: 'Cafeteria', behavior: 'Tantrum', frequency: '2 times', intensity: 'Medium', category: 'Disruptive', antecedent: 'Waiting', consequence: 'Attention', teacher: 'Teacher A' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
  studentSelectorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: { fontSize: 18, fontWeight: '700', color: '#64748B' },
  studentDropdown: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  studentDropdownName: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  ageText: { fontSize: 13, color: '#64748B', marginLeft: 4 },
  badgeCode: {
    backgroundColor: '#E0F2FE',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeCodeText: { fontSize: 12, fontWeight: '600', color: '#0284C7' },

  filtersCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filtersRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterInlineLabel: { fontSize: 13, color: '#64748B' },
  textInputDate: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    width: 105,
  },
  selectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 36,
    width: 120,
    backgroundColor: '#FFFFFF',
  },
  selectChipText: { fontSize: 13, color: '#0F172A' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FACC15',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 36,
  },
  exportBtnText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },

  content: { padding: 16, gap: 16 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#0284C7' },
  statValueSmall: { fontSize: 15, fontWeight: '700', color: '#0F172A' },

  table: { minWidth: 900, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#0EA5E9' },
  tableHeaderCell: { width: 90, padding: 10, fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  tableCell: { width: 90, padding: 10, fontSize: 12, color: '#334155' },
  emptyRow: { padding: 24, alignItems: 'center', backgroundColor: '#FFFFFF', width: 900 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 80,
    paddingLeft: 85,
  },
  studentDropdownMenu: {
    width: 130,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  dropdownOptionActive: {
    backgroundColor: '#93C5FD',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#0F172A',
  },
  dropdownOptionTextActive: {
    color: '#0F172A',
  },
});