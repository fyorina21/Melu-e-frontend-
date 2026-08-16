// screens/dailynotes/DailyNotesScreen.js
// MR-35: Session Notes & Attachments
// Matches Figma "Daily Notes & Summaries" frame.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import StatusPill, { StatusType } from '../../components/StatusPill';
import TopNav from '../../components/TopNav';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getDailyNotes, getWeeklySummary, resubmitSessionNote } from '../../api/sessionApi';
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
  const { logout } = useAuth();
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<NoteRecord[]>([]);
  const [summary, setSummary] = useState<WeeklySummaryData | null>(null);
  const [stats, setStats] = useState<DailyNotesStats>({ sessionsCompleted: 0, totalTrials: 0, avgIndependence: 0, reviewsPending: 0 });

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
      <TopNav activeTab="Daily Notes" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} onLogout={logout} />
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
          {/* TODO: wire real dropdowns; using static labels for now to match Figma */}
          <View style={styles.filterChip}><Text style={typography.body}>This Month</Text></View>
          <View style={styles.filterChip}><Text style={typography.body}>All Statuses</Text></View>
        </View>

        {/* Session records */}
        <View style={styles.card}>
          <Text style={typography.h2}>Session Records</Text>
          {records.map((r) => (
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
              </View>
            </View>
          ))}
        </View>

        {/* Weekly summary */}
        {summary && (
          <View style={styles.card}>
            <Text style={typography.h2}>Weekly Summary</Text>
            <SummaryRow label="Week of" value={summary.weekRange} />
            <SummaryRow label="Sessions this week" value={summary.sessionsThisWeek} bold />
            <SummaryRow label="Total trials this week" value={summary.totalTrialsThisWeek} bold />
            <SummaryRow label="Avg independence this week" value={`${summary.avgIndependenceThisWeek}%`} bold color="#059669" />
          </View>
        )}
      </ScrollView>
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
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgCard,
  },
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
});
