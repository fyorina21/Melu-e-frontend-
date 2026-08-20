import React, { useEffect, useState, useCallback } from 'react';
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import StatusPill, { StatusType } from '../../components/StatusPill';
import AppNavbar from '../../components/AppNavbar';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getDailyNotes, getWeeklySummary, resubmitSessionNote } from '../../api/sessionApi';
import { downloadTextFile } from '../../utils/webExport';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'DailyNotes'>;

interface NoteRecord {
  id: string;
  date: string;
  students: string[];
  station: string;
  room: string;
  status: string;
}

interface DailyNotesStats {
  sessionsCompleted: number;
  totalTrials: number;
  avgIndependence: number;
  reviewsPending: number;
}

interface WeeklySummaryData {
  weekRange: string;
  sessionsThisWeek: number;
  totalTrialsThisWeek: number;
  avgIndependenceThisWeek: number;
}

const STATUS_KEY_MAP: Record<string, StatusType> = {
  Approved: 'approved',
  Pending: 'pending',
  'Revision Required': 'revision',
};

export default function DailyNotesScreen({ navigation }: Props) {
  const { logout, session } = useAuth();
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<NoteRecord[]>([]);
  const [summary, setSummary] = useState<WeeklySummaryData | null>(null);
  const [stats, setStats] = useState<DailyNotesStats>({ sessionsCompleted: 0, totalTrials: 0, avgIndependence: 0, reviewsPending: 0 });
  const [feedbackTarget, setFeedbackTarget] = useState<NoteRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');

  const load = useCallback(async () => {
    try {
      const [notesRes, summaryRes] = await Promise.all([
        getDailyNotes({ search }),
        getWeeklySummary({}),
      ]);
      setRecords(notesRes.data.records);
      setStats(notesRes.data.stats);
      setSummary(summaryRes.data);
    } catch (err) {
      setRecords(DEMO_RECORDS);
      setStats(DEMO_STATS);
      setSummary(DEMO_WEEKLY_SUMMARY);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRecords = records.filter((r) => {
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    if (dateFilter !== 'All') {
      const d = new Date(r.date);
      if (isNaN(d.getTime())) return true;
      const now = new Date();
      if (dateFilter === 'This Week') {
        const day = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
        weekStart.setHours(0, 0, 0, 0);
        if (d < weekStart) return false;
      }
      if (dateFilter === 'This Month') {
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      }
    }
    return true;
  });

  const handleExportWeekly = () => {
    if (!summary) return;
    const lines = [
      'MELU\u2019E FOUNDATION \u2014 WEEKLY SUMMARY',
      `Week of: ${summary.weekRange}`,
      '',
      `Sessions completed: ${summary.sessionsThisWeek}`,
      `Total trials logged: ${summary.totalTrialsThisWeek}`,
      `Average independence: ${summary.avgIndependenceThisWeek}%`,
      '',
      'Teacher: ' + (session?.userName ?? 'Teacher A'),
    ];
    downloadTextFile(`WeeklySummary_${summary.weekRange.replace(/[^a-z0-9]/gi, '_')}.html`, lines.map((l) => `<p>${l}</p>`).join(''));
  };

  const handleResubmit = async (sessionId: string) => {
    try {
      await resubmitSessionNote(sessionId, {});
      load();
    } catch (err) {
      // TODO: surface a toast/error banner
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Daily Notes" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.h1}>Daily Notes & Summaries</Text>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <StatCard label="Sessions Completed" value={stats.sessionsCompleted} color={colors.statusInProgressText} />
          <StatCard label="Total Trials" value={stats.totalTrials} color="#D97706" />
          <StatCard label="Avg Independence" value={`${stats.avgIndependence}%`} color="#059669" />
          <StatCard label="Reviews Pending" value={stats.reviewsPending} color="#DC2626" />
        </View>

        {/* Search + filters */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search students, station..."
            placeholderTextColor={colors.mutedText}
            value={search}
            onChangeText={setSearch}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {['All', 'Approved', 'Pending', 'Revision Required', 'Draft'].map((s) => (
              <TouchableOpacity
                key={`status-${s}`}
                style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
                onPress={() => setStatusFilter(s)}
              >
                <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
            {['All', 'This Week', 'This Month'].map((d) => (
              <TouchableOpacity
                key={`date-${d}`}
                style={[styles.filterChip, dateFilter === d && styles.filterChipActive]}
                onPress={() => setDateFilter(d)}
              >
                <Text style={[styles.filterChipText, dateFilter === d && styles.filterChipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Session records */}
        <View style={styles.card}>
          <Text style={typography.h2}>Session Records</Text>
          {filteredRecords.length === 0 && (
            <Text style={styles.noRecordsText}>No sessions match the current filters.</Text>
          )}
          {filteredRecords.map((r) => (
            <View key={r.id} style={styles.recordRow}>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{r.date}</Text>
                <Text style={typography.caption}>{r.students.join(', ')}</Text>
                <Text style={typography.caption}>{r.station} · {r.room}</Text>
              </View>
              <StatusPill status={STATUS_KEY_MAP[r.status] || 'pending'} label={r.status} />
              <View style={styles.recordActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation?.navigate?.('SessionNoteEditor', { sessionId: r.id, mode: 'view' })}
                >
                  <Text style={styles.actionBtnText}>View</Text>
                </TouchableOpacity>
                {(r.status === 'Draft' || r.status === 'Revision Required') && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation?.navigate?.('SessionNoteEditor', { sessionId: r.id, mode: 'edit' })}
                  >
                    <Text style={styles.actionBtnText}>{r.status === 'Draft' ? 'Edit Draft' : 'Resubmit'}</Text>
                  </TouchableOpacity>
                )}
                {r.status === 'Revision Required' && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => setFeedbackTarget(r)}>
                    <Text style={[styles.actionBtnText, { color: colors.statusInProgressText }]}>View Feedback</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Weekly summary */}
        {summary && (
          <View style={styles.card}>
            <View style={styles.summaryHeader}>
              <Text style={typography.h2}>Weekly Summary</Text>
              <TouchableOpacity style={styles.exportBtn} onPress={handleExportWeekly}>
                <Feather name="download" size={13} color={colors.navyText} />
                <Text style={styles.exportBtnText}>Export PDF</Text>
              </TouchableOpacity>
            </View>
            <SummaryRow label="Week of" value={summary.weekRange} />
            <SummaryRow label="Sessions this week" value={summary.sessionsThisWeek} bold />
            <SummaryRow label="Total trials this week" value={summary.totalTrialsThisWeek} bold />
            <SummaryRow label="Avg independence this week" value={`${summary.avgIndependenceThisWeek}%`} bold color="#059669" />
          </View>
        )}
      </ScrollView>

      {/* View Feedback Modal */}
      <Modal visible={!!feedbackTarget} transparent animationType="slide" onRequestClose={() => setFeedbackTarget(null)}>
        <View style={styles.overlay}>
          <View style={styles.feedbackModal}>
            <View style={styles.feedbackHeader}>
              <Text style={typography.h2}>Coordinator Feedback</Text>
              <TouchableOpacity onPress={() => setFeedbackTarget(null)}>
                <Feather name="x" size={18} color={colors.navyText} />
              </TouchableOpacity>
            </View>
            {feedbackTarget && (
              <>
                <Text style={typography.caption}>{feedbackTarget.date} · {feedbackTarget.students.join(', ')} · {feedbackTarget.station} {feedbackTarget.room}</Text>
                <Text style={typography.caption}>From: Coordinator A</Text>
                <View style={styles.feedbackBody}>
                  <Text style={typography.body}>
                    Please revise the session notes for this block. Missing behavior data for {feedbackTarget.students[1] || feedbackTarget.students[0]} — include the antecedent, behavior, and consequence for the observed incident, and correct the trial counts to match the data collection sheet.
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={typography.caption}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function SummaryRow({ label, value, bold, color }: { label: string; value: number | string; bold?: boolean; color?: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={typography.body}>{label}</Text>
      <Text style={[bold ? typography.bodyBold : typography.body, color ? { color } : undefined]}>{value}</Text>
    </View>
  );
}

const DEMO_STATS: DailyNotesStats = { sessionsCompleted: 6, totalTrials: 124, avgIndependence: 68, reviewsPending: 1 };
const DEMO_RECORDS: NoteRecord[] = [
  { id: '1', date: 'Aug 4, 2026', students: ['Student A', 'Student B'], station: 'Station 1', room: 'Room 2', status: 'Approved' },
  { id: '2', date: 'Aug 3, 2026', students: ['Student A', 'Student B'], station: 'Station 1', room: 'Room 2', status: 'Pending' },
  { id: '3', date: 'Aug 1, 2026', students: ['Student A', 'Student B'], station: 'Station 1', room: 'Room 2', status: 'Revision Required' },
];
const DEMO_WEEKLY_SUMMARY: WeeklySummaryData = {
  weekRange: 'Jul 28 – Aug 4, 2026',
  sessionsThisWeek: 2,
  totalTrialsThisWeek: 42,
  avgIndependenceThisWeek: 69,
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: {
    flexGrow: 1,
    minWidth: '45%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 22, fontWeight: '700', marginTop: spacing.xs },
  searchRow: { gap: spacing.sm },
  searchInput: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  filterScroll: { gap: spacing.sm },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
  },
  filterChipActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  filterChipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  filterChipTextActive: { fontSize: 12, fontWeight: '700', color: colors.navyText },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  exportBtnText: { fontSize: 12, fontWeight: '700', color: colors.navyText },
  noRecordsText: { color: colors.mutedText, textAlign: 'center', paddingVertical: spacing.lg, fontSize: 13 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recordActions: { flexDirection: 'row', gap: spacing.xs },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  feedbackModal: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedbackBody: {
    backgroundColor: colors.statusRevisionBg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.statusRevisionText,
  },
});
