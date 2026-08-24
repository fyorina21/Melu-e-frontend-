import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import { PARENT_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { downloadTextFile } from '../../utils/webExport';
import { parentApi } from '../../api';
import type { ParentStackParamList } from '../../types';

type GoalStatus = 'Active' | 'Mastered' | 'In Progress';

interface Goal {
  id: string;
  name: string;
  pct: number;
  status: GoalStatus;
  updated: string;
}

function goalStatus(pct: number, raw?: string): GoalStatus {
  if (raw === 'Mastered' || pct >= 80) return 'Mastered';
  if (raw === 'In Progress' || pct >= 60) return 'In Progress';
  return 'Active';
}

interface Session {
  id: string;
  date: string;
  teacher: string;
  duration: string;
  trials: number;
  independence: number;
  time: string;
  goals: string[];
  behavior: string;
  notes: string;
}

interface SessionSummary {
  id: string;
  date: string;
  teacher: string;
  duration: string;
  trials?: number;
  independence: number;
  time: string;
  goals: string[];
  behavior: string;
  notes: string;
}

interface BehaviorTrend {
  month: string;
  incidents: number;
}

interface ChildProgressData {
  childName: string;
  age: number;
  program: string;
  group: string;
  goals: Goal[];
  sessions: Session[];
  sessionsThisMonth: number;
  goalsMastered: number;
  totalTrials: number;
  averageIndependence: number;
  behaviorTrends: BehaviorTrend[];
  behaviorSummary: string;
  iupStation1: string[];
  iupStation2: string[];
}



function goalBarColor(pct: number) {
  if (pct >= 80) return '#4ADE80';
  if (pct >= 50) return '#FACC15';
  return '#F87171';
}

function statusBadge(status: GoalStatus): { bg: string; text: string } {
  if (status === 'Mastered') return { bg: '#DCFCE7', text: '#15803D' };
  if (status === 'Active') return { bg: '#E0F2FE', text: '#0369A1' };
  return { bg: '#FEF9C3', text: '#A16207' };
}

function independenceColor(pct: number) {
  if (pct >= 80) return '#16A34A';
  if (pct >= 60) return '#CA8A04';
  return '#EF4444';
}

function behaviorBox(behavior: string) {
  const clean = behavior === 'None' || behavior === 'No incidents' || !behavior;
  return {
    isClean: clean,
    bg: clean ? '#F0FDF4' : '#FEFCE8',
    text: clean ? '#15803D' : '#A16207',
  };
}

function SessionSummaryModal({ session, onClose }: { session: SessionSummary | null; onClose: () => void }) {
  if (!session) return null;
  const bh = behaviorBox(session.behavior);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay} onStartShouldSetResponder={() => true} onResponderRelease={onClose}>
        <View style={styles.modalCard} onStartShouldSetResponder={() => true} onResponderRelease={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Session Summary</Text>
            <TouchableOpacity style={styles.modalX} onPress={onClose}>
              <Feather name="x" size={16} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetBody}>
            <View style={styles.statPair}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Teacher</Text>
                <Text style={styles.statBoxValue}>{session.teacher}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Date</Text>
                <Text style={styles.statBoxValue}>{session.date}</Text>
              </View>
            </View>
            <View style={styles.statPair}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Time</Text>
                <Text style={styles.statBoxValue}>{session.time}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxLabel}>Duration</Text>
                <Text style={styles.statBoxValue}>{session.duration}</Text>
              </View>
            </View>

            <View style={[styles.sectionBox, styles.skyBox]}>
              <Text style={[styles.sectionBoxLabel, { color: '#0EA5E9' }]}>Goals Worked On</Text>
              {session.goals.map((g) => (
                <View key={g} style={styles.goalListItem}>
                  <View style={[styles.goalDot, { backgroundColor: '#38BDF8' }]} />
                  <Text style={styles.goalListText}>{g}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.sectionBox, { backgroundColor: '#F0FDF4', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <Text style={[styles.sectionBoxLabel, { color: '#15803D' }]}>Independence</Text>
              <Text style={styles.independenceValue}>{session.independence}%</Text>
            </View>

            <View style={[styles.sectionBox, { backgroundColor: bh.bg }]}>
              <Text style={styles.sectionBoxPlainLabel}>Behavior Observations</Text>
              <Text style={[styles.sectionBoxText, { color: bh.text }]}>{bh.isClean ? 'No incidents — great session!' : session.behavior}</Text>
            </View>

            <View style={[styles.sectionBox, { backgroundColor: '#F9FAFB' }]}>
              <Text style={styles.sectionBoxPlainLabel}>Teacher Notes</Text>
              <Text style={styles.notesText}>{session.notes}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Text style={styles.modalCloseBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function StatCard({ icon, bg, color, value, label }: { icon: keyof typeof Feather.glyphMap; bg: string; color: string; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BehaviorChart({ data }: { data: BehaviorTrend[] }) {
  const max = Math.max(1, ...data.map((d) => d.incidents));
  return (
    <View style={styles.chartWrap}>
      <View style={styles.chartRow}>
        {data.map((d) => (
          <View key={d.month} style={styles.chartCol}>
            <View style={[styles.chartBar, { height: `${Math.max(6, Math.round((d.incidents / max) * 100))}%`, backgroundColor: '#38BDF8' }]} />
            <Text style={styles.chartX}>{d.month}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.chartCaption}>Monthly behavior incidents — lower is better</Text>
    </View>
  );
}

export default function ChildProgressScreen({ navigation }: NativeStackScreenProps<ParentStackParamList, 'ChildProgress'>) {
  const [data, setData] = useState<ChildProgressData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(null);

  const load = useCallback(async () => {
    try {
      // Get the child ID from the parent dashboard
      const dashRes: any = await parentApi.dashboard();
      const childId = dashRes.childSummary?.id;
      if (!childId) {
        setLoadError(true);
        return;
      }
      const res: any = await parentApi.childProgress(childId);
      const goals: Goal[] = (res.goals || []).map((g: any) => ({
        id: String(g.id ?? g.name),
        name: g.friendlyName ?? g.name ?? 'Goal',
        pct: Number(g.percent ?? g.pct ?? 0),
        status: goalStatus(Number(g.percent ?? g.pct ?? 0), g.status),
        updated: g.updated ?? '',
      }));
      const sessions: Session[] = (res.sessionHistory || []).map((s: any, i: number) => ({
        id: String(s.id ?? i),
        date: s.date ?? '',
        teacher: s.teacher ?? '—',
        duration: s.duration ?? '—',
        trials: Number(s.trials ?? 0),
        independence: Number(s.independence ?? 0),
        time: s.time ?? '',
        goals: s.goals ?? [],
        behavior: s.behavior ?? 'None',
        notes: s.notes ?? '',
      }));
      setData({
        childName: res.childName ?? 'Student',
        age: Number(res.age ?? 0),
        program: res.program ?? 'ABA',
        group: res.group ?? '',
        goals,
        sessions,
        sessionsThisMonth: Number(res.sessionsThisMonth ?? 0),
        goalsMastered: Number(res.goalsMastered ?? goals.filter((g) => g.status === 'Mastered').length),
        totalTrials: Number(res.totalTrials ?? 0),
        averageIndependence: Number(res.averageIndependence ?? 0),
        behaviorTrends: res.behaviorTrends ?? [],
        behaviorSummary: res.behaviorSummary ?? 'No data yet.',
        iupStation1: res.iupStation1 ?? [],
        iupStation2: res.iupStation2 ?? [],
      });
    } catch (err) {
      setLoadError(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpenSession = async (session: Session) => {
    try {
      const res: any = await parentApi.sessionSummary(session.id);
      setSelectedSession({
        id: session.id,
        date: res.date ?? session.date ?? '',
        teacher: res.teacher ?? session.teacher ?? '—',
        duration: res.duration ?? session.duration ?? '—',
        independence: Number(res.independence ?? session.independence ?? 0),
        time: res.time ?? session.time ?? '',
        goals: res.goals ?? session.goals ?? [],
        behavior: res.behavior ?? session.behavior ?? 'None',
        notes: res.parentFriendlyNote ?? res.notes ?? session.notes ?? '',
      });
    } catch (err) {
      setSelectedSession({
        ...session,
        goals: session.goals,
        notes: session.notes || 'No notes available.',
      });
    }
  };

  const handleDownloadIup = () => {
    if (!data) return;
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const lines = [
      '<h1>Melu\'e Foundation</h1>',
      '<h2>Individualized Upgrade Plan (IUP)</h2>',
      `<p><strong>Child:</strong> ${esc(data.childName)} · Age ${data.age} · ${esc(data.program)} · Group: ${esc(data.group)}</p>`,
      `<p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>`,
      '<h3>Station 1 Goals</h3>',
      `<ul>${data.iupStation1.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>`,
      '<h3>Station 2 Goals</h3>',
      `<ul>${data.iupStation2.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>`,
      `<p><strong>Status:</strong> Finalized</p>`,
    ].join('');
    downloadTextFile(`Iup_${new Date().toISOString().slice(0, 10)}.html`, lines);
  };

  if (loadError) return <ScreenError onRetry={load} />;
  if (!data) return <ScreenLoader />;

  const thisMonthCount = data.sessions.filter((s) => s.date.includes('Aug')).length || data.sessionsThisMonth;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Progress" onTabPress={(t) => navigation?.navigate?.(PARENT_ROUTE_BY_TAB[t])} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{data.childName.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{data.childName}</Text>
            <Text style={styles.profileMeta}>Age {data.age} · Program: {data.program} · Group: {data.group}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="clipboard" bg="#E0F2FE" color="#38BDF8" value={String(data.goals.length)} label="Goals Active" />
          <StatCard icon="check-circle" bg="#DCFCE7" color="#22C55E" value={String(data.goalsMastered)} label="Goals Mastered" />
          <StatCard icon="calendar" bg="#FEF9C3" color="#EAB308" value={String(data.sessionsThisMonth)} label="Sessions This Month" />
          <StatCard icon="trending-up" bg="#F3E8FF" color="#A855F7" value={`${data.averageIndependence}%`} label="Independence Rate" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How is {data.childName} doing with their goals?</Text>
          {data.goals.map((g) => {
            const sb = statusBadge(g.status);
            return (
              <View key={g.id} style={styles.goalRow}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalName}>{g.name}</Text>
                  <View style={styles.goalHeaderRight}>
                    <Text style={styles.goalPct}>{g.pct}%</Text>
                    <View style={[styles.goalBadge, { backgroundColor: sb.bg }]}>
                      <Text style={[styles.goalBadgeText, { color: sb.text }]}>{g.status}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${g.pct}%`, backgroundColor: goalBarColor(g.pct) }]} />
                </View>
                {g.updated ? <Text style={styles.goalUpdated}>Last updated: {g.updated}</Text> : null}
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Sessions</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.thDate]}>Date</Text>
            <Text style={[styles.th, styles.thTeacher]}>Teacher</Text>
            <Text style={styles.th}>Duration</Text>
            <Text style={styles.th}>Trials</Text>
            <Text style={styles.th}>Indep.</Text>
          </View>
          {data.sessions.map((s) => (
            <TouchableOpacity key={s.id} style={styles.tableRow} onPress={() => handleOpenSession(s)}>
              <Text style={[styles.td, styles.tdDate]}>{s.date}</Text>
              <Text style={[styles.td, styles.tdTeacher]}>{s.teacher}</Text>
              <Text style={[styles.td, styles.tdCenter]}>{s.duration}</Text>
              <Text style={[styles.td, styles.tdCenter]}>{s.trials}</Text>
              <Text style={[styles.td, styles.tdCenter, { color: independenceColor(s.independence), fontWeight: '700' }]}>{s.independence}%</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.tableHint}>Tap any row to see session details</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Behavior Observations</Text>
          <Text style={styles.behaviorSub}>This month: <Text style={styles.behaviorSubBold}>3 incidents recorded</Text> <Text style={{ color: '#16A34A' }}>(improving from 8 last month)</Text></Text>
          <BehaviorChart data={data.behaviorTrends} />
        </View>

        <View style={styles.card}>
          <View style={styles.iupHeader}>
            <Text style={styles.cardTitle}>Therapy Plan (IUP)</Text>
            <View style={styles.finalizedBadge}>
              <Feather name="check-circle" size={14} color="#16A34A" />
              <Text style={styles.finalizedText}>Finalized</Text>
            </View>
          </View>
          <View style={[styles.iupStation, { backgroundColor: '#F0F9FF' }]}>
            <Text style={[styles.iupStationLabel, { color: '#0EA5E9' }]}>STATION 1 GOALS</Text>
            {data.iupStation1.map((g) => (
              <View key={g} style={styles.goalListItem}>
                <View style={[styles.goalDot, { backgroundColor: '#38BDF8' }]} />
                <Text style={styles.goalListText}>{g}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.iupStation, { backgroundColor: '#FFFBEB' }]}>
            <Text style={[styles.iupStationLabel, { color: '#EAB308' }]}>STATION 2 GOALS</Text>
            {data.iupStation2.map((g) => (
              <View key={g} style={styles.goalListItem}>
                <View style={[styles.goalDot, { backgroundColor: '#FACC15' }]} />
                <Text style={styles.goalListText}>{g}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.iupBtn} onPress={handleDownloadIup}>
            <Feather name="download" size={16} color={colors.navyText} />
            <Text style={styles.iupBtnText}>Download IUP (PDF)</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.navigate?.('ParentDashboard')}>
          <Text style={styles.backBtnText}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>

      <SessionSummaryModal session={selectedSession} onClose={() => setSelectedSession(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: '#F3F4F6', padding: spacing.lg },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#38BDF8', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26, fontWeight: '700', color: colors.white },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  profileMeta: { fontSize: 13, color: colors.mutedText, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: '#F3F4F6', padding: spacing.md, alignItems: 'center', gap: 2 },
  statIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  statLabel: { fontSize: 11, color: colors.mutedText, textAlign: 'center', fontWeight: '500' },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: '#F3F4F6', padding: spacing.lg },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: spacing.md },
  goalRow: { gap: 4, marginBottom: spacing.lg },
  goalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  goalName: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  goalHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  goalPct: { fontSize: 13, fontWeight: '700', color: '#374151' },
  goalBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 3 },
  goalBadgeText: { fontSize: 11, fontWeight: '500' },
  progressTrack: { height: 12, backgroundColor: '#F3F4F6', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6 },
  goalUpdated: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  tableHeader: { flexDirection: 'row', paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  th: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', flex: 1, textAlign: 'center' },
  thDate: { textAlign: 'left', flex: 1.4 },
  thTeacher: { flex: 1.3, textAlign: 'left' },
  tableRow: { flexDirection: 'row', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', alignItems: 'center' },
  td: { fontSize: 12, color: '#4B5563', flex: 1, textAlign: 'center' },
  tdDate: { textAlign: 'left', flex: 1.4, fontWeight: '600', color: '#374151' },
  tdTeacher: { flex: 1.3, textAlign: 'left' },
  tdCenter: {},
  tableHint: { fontSize: 11, color: '#9CA3AF', marginTop: spacing.md },
  behaviorSub: { fontSize: 13, color: colors.mutedText, marginBottom: spacing.md },
  behaviorSubBold: { fontWeight: '600', color: '#374151' },
  chartWrap: { gap: spacing.xs },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, height: 130 },
  chartCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4 },
  chartBar: { width: '70%', maxWidth: 28, borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 6 },
  chartX: { fontSize: 11, color: '#9CA3AF' },
  chartCaption: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: spacing.xs },
  iupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  finalizedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  finalizedText: { fontSize: 12, color: '#15803D', fontWeight: '500' },
  iupStation: { borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.xs },
  iupStationLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  goalListItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 },
  goalDot: { width: 6, height: 6, borderRadius: 3 },
  goalListText: { fontSize: 13, color: '#374151' },
  iupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: '#FCD34D', borderRadius: radius.md, paddingVertical: spacing.md, marginTop: spacing.xs },
  iupBtnText: { fontSize: 13, fontWeight: '700', color: colors.navyText },
  backBtn: { borderWidth: 2, borderColor: '#E5E7EB', borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: 'center' },
  backBtnText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  modalX: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  sheetBody: { gap: spacing.md },
  statPair: { flexDirection: 'row', gap: spacing.md },
  statBox: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: radius.md, padding: spacing.md },
  statBoxLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  statBoxValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  sectionBox: { borderRadius: radius.md, padding: spacing.md, gap: 4 },
  skyBox: { backgroundColor: '#F0F9FF' },
  sectionBoxLabel: { fontSize: 11, fontWeight: '500', marginBottom: spacing.xs },
  sectionBoxPlainLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginBottom: 2 },
  sectionBoxText: { fontSize: 13, fontWeight: '500' },
  independenceValue: { fontSize: 18, fontWeight: '700', color: '#16A34A' },
  notesText: { fontSize: 13, lineHeight: 19, color: '#374151' },
  modalCloseBtn: { marginTop: spacing.lg, backgroundColor: '#1F2937', borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  modalCloseBtnText: { fontSize: 13, fontWeight: '600', color: colors.white },
});