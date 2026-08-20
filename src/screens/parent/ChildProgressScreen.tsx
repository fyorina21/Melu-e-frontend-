import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { PARENT_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { downloadTextFile } from '../../utils/webExport';
import { getChildProgress, getSessionSummaryForParent } from '../../api/parentApi';
import type { ParentStackParamList } from '../../types';

interface SessionSummary {
  date: string;
  parentFriendlyNote: string;
}

function SessionSummaryModal({ visible, summary, onClose }: {
  visible: boolean;
  summary: SessionSummary | null;
  onClose: () => void;
}) {
  if (!summary) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h2}>{summary.date}</Text>
          <ScrollView style={{ maxHeight: 300 }}>
            <Text style={typography.body}>{summary.parentFriendlyNote}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

interface ProgressGoal {
  id: string;
  friendlyName: string;
  percent: number;
  weekly: number[];
}

function GoalChart({ weeks, percent }: { weeks: number[]; percent: number }) {
  const max = Math.max(100, ...weeks);
  return (
    <View style={styles.chartTrack}>
      {weeks.map((w, i) => (
        <View key={i} style={styles.chartCol}>
          <View style={[styles.chartBar, { height: `${Math.max(4, Math.round((w / max) * 100))}%` }]} />
          <Text style={styles.chartBarLabel}>W{i + 1}</Text>
        </View>
      ))}
      <View style={styles.chartPercentWrap}>
        <Text style={styles.chartBarLabel}>Now</Text>
        <Text style={styles.chartPercent}>{percent}%</Text>
      </View>
    </View>
  );
}

interface SessionHistoryEntry {
  id: string;
  date: string;
}

interface ChildProgressData {
  childName: string;
  age: number;
  program: string;
  overallSummary: string;
  goals: ProgressGoal[];
  sessionHistory: SessionHistoryEntry[];
  behaviorSummary: string;
  assessmentSummary: string;
  iupSummary: string;
  sharedNotes: string;
}

export default function ChildProgressScreen({ navigation }: NativeStackScreenProps<ParentStackParamList, 'ChildProgress'>) {
  const [data, setData] = useState<ChildProgressData | null>(null);
  const [summaryModal, setSummaryModal] = useState<SessionSummary | null>(null);
  const [exportContent, setExportContent] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getChildProgress('student-a');
      setData(res);
    } catch (err) {
      setData(DEMO_DATA);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpenSession = async (sessionId: string) => {
    try {
      const { data: res } = await getSessionSummaryForParent(sessionId);
      setSummaryModal(res);
    } catch (err) {
      setSummaryModal(DEMO_SESSION_SUMMARY);
    }
  };

  const handleExportIup = () => {
    if (!data) return;
    setExportContent(
      [
        'INDIVIDUALIZED UPGRADE PLAN (IUP) SUMMARY',
        `Child: ${data.childName} · Age ${data.age} · ${data.program}`,
        `Generated: ${new Date().toLocaleDateString()}`,
        '',
        'PLAN SUMMARY',
        data.iupSummary,
        '',
        'GOAL PROGRESS',
        ...data.goals.map((g) => `- ${g.friendlyName}: ${g.percent}% toward the goal`),
        '',
        'OVERALL PROGRESS',
        data.overallSummary,
        '',
        'BEHAVIOR TRENDS',
        data.behaviorSummary,
        '',
        'ASSESSMENT RESULTS',
        data.assessmentSummary,
      ].join('\n')
    );
  };

  const handleDownloadIupPdf = () => {
    if (!data) return;
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const lines = [
      '<h1>Melu\'e Foundation</h1>',
      '<h2>Individualized Upgrade Plan (IUP) Summary</h2>',
      `<p><strong>Child:</strong> ${esc(data.childName)} · Age ${data.age} · ${esc(data.program)}</p>`,
      `<p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>`,
      '<h3>Plan Summary</h3>',
      `<p>${esc(data.iupSummary)}</p>`,
      '<h3>Goal Progress</h3>',
      `<ul>${data.goals.map((g) => `<li>${esc(g.friendlyName)}: ${g.percent}% toward the goal</li>`).join('')}</ul>`,
      '<h3>Overall Progress</h3>',
      `<p>${esc(data.overallSummary)}</p>`,
      '<h3>Behavior Trends</h3>',
      `<p>${esc(data.behaviorSummary)}</p>`,
      '<h3>Assessment Results</h3>',
      `<p>${esc(data.assessmentSummary)}</p>`,
    ].join('');
    downloadTextFile(`IupSummary_${new Date().toISOString().slice(0, 10)}.html`, lines);
  };

  if (!data) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Progress" onTabPress={(t) => navigation?.navigate?.(PARENT_ROUTE_BY_TAB[t])} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={typography.h2}>{data.childName}</Text>
          <Text style={typography.caption}>Age {data.age} · {data.program}</Text>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Overall Progress</Text>
          {data.goals.length > 0 && (
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={typography.h3}>{data.goals.length}</Text>
                <Text style={styles.statLabel}>Goals</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={typography.h3}>{data.sessionHistory.length}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
            </View>
          )}
          <Text style={typography.body}>{data.overallSummary}</Text>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Goal Progress</Text>
          <Text style={styles.sectionHint}>Weekly visualization, updated after each session</Text>
          {data.goals.map((g) => (
            <View key={g.id} style={styles.goalRow}>
              <Text style={typography.bodyBold}>{g.friendlyName}</Text>
              <GoalChart weeks={g.weekly} percent={g.percent} />
              <Text style={typography.caption}>{g.percent}% toward the goal</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Session History</Text>
          {data.sessionHistory.map((s) => (
            <TouchableOpacity key={s.id} style={styles.sessionRow} onPress={() => handleOpenSession(s.id)}>
              <Text style={typography.body}>{s.date}</Text>
              <Text style={styles.linkText}>View →</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Behavior Trends</Text>
          <Text style={typography.body}>{data.behaviorSummary}</Text>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Assessment Results</Text>
          <Text style={typography.body}>{data.assessmentSummary}</Text>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Therapy Plan (IUP) Summary</Text>
          <Text style={typography.body}>{data.iupSummary}</Text>
          <View style={styles.exportRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleExportIup}>
              <Text style={styles.secondaryBtnText}>Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn} onPress={handleDownloadIupPdf}>
              <Feather name="download" size={14} color={colors.navyText} />
              <Text style={styles.secondaryBtnText}>Export PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Shared Notes</Text>
          <Text style={typography.body}>{data.sharedNotes}</Text>
        </View>
      </ScrollView>

      <SessionSummaryModal visible={!!summaryModal} summary={summaryModal} onClose={() => setSummaryModal(null)} />

      <ExportPreviewModal
        visible={!!exportContent}
        title="IUP Summary"
        filename={`IupSummary_${new Date().toISOString().slice(0, 10)}.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

const DEMO_DATA: ChildProgressData = {
  childName: 'Student A',
  age: 6,
  program: 'Regular Program',
  overallSummary: 'Making steady progress across all goal areas this month, with strong gains in requesting items.',
  goals: [
    { id: 'g1', friendlyName: 'Naming Colors', percent: 45, weekly: [20, 28, 36, 45] },
    { id: 'g2', friendlyName: 'Asking for Things', percent: 68, weekly: [41, 50, 58, 68] },
  ],
  sessionHistory: [
    { id: '1', date: 'Aug 11, 2026' },
    { id: '2', date: 'Aug 8, 2026' },
  ],
  behaviorSummary: 'A couple of tough moments during transitions this month, but overall behavior has been calm and cooperative.',
  assessmentSummary: 'Recent assessments show strengths in following directions and playing with others.',
  iupSummary: 'Current therapy plan focuses on communication and self-help skills, reviewed every 6 months.',
  sharedNotes: 'Loves bubbles and music during breaks - these work great as rewards at home too!',
};
const DEMO_SESSION_SUMMARY: SessionSummary = { date: 'Aug 11, 2026', parentFriendlyNote: 'Great session today! Student A asked for toys independently five times and stayed calm during cleanup.' };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  goalRow: { gap: spacing.xs, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  sectionHint: { fontSize: 11, color: colors.mutedText },
  statRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  statItem: { flex: 1, backgroundColor: colors.bgApp, borderRadius: radius.md, padding: spacing.md, gap: 2 },
  statLabel: { fontSize: 11, color: colors.mutedText },
  chartRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  chartTrack: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.xs, height: 80 },
  chartCol: { flex: 1, alignItems: 'center', gap: 2, height: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '100%', maxWidth: 28, backgroundColor: colors.statusInProgressText, borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm, minHeight: 3 },
  chartBarLabel: { fontSize: 9, color: colors.mutedText },
  chartPercentWrap: { alignItems: 'center', gap: 2 },
  chartPercent: { fontSize: 11, fontWeight: '700', color: colors.navyText },
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  linkText: { color: colors.statusInProgressText, fontWeight: '600', fontSize: 12 },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center', marginTop: spacing.sm },
  secondaryBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  exportRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  exportBtn: { flex: 1, flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryYellow, borderWidth: 1, borderColor: colors.primaryYellowDark, borderRadius: radius.md, paddingVertical: spacing.sm },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, maxHeight: '70%' },
  closeBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  closeBtnText: { fontWeight: '600', color: colors.navyText },
});
