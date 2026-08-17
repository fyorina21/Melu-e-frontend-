// screens/assessments/AssessmentDashboardScreen.js
// SCR-010: 6-Week Assessment Dashboard - matches Figma exactly:
// period badge, 4 stat cards, per-student assessment cards with
// ABLLS/Behavior progress and launch buttons, guidelines footer.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import TopNav from '../../components/TopNav';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getAssessmentDashboard } from '../../api/teacherExtrasApi';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'AssessmentDashboard'>;

interface AssessmentStatusStyle {
  bg: string;
  text: string;
  barColor: string;
}

const STATUS_STYLE: Record<string, AssessmentStatusStyle> = {
  Completed: { bg: colors.statusApprovedBg, text: colors.statusApprovedText, barColor: '#22C55E' },
  'In Progress': { bg: colors.statusInProgressBg, text: colors.statusInProgressText, barColor: colors.statusInProgressText },
  'Not Started': { bg: colors.statusNotStartedBg, text: colors.mutedText, barColor: colors.mutedText },
};

function StatusPillLocal({ status }: { status: string }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE['Not Started'];
  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusPillText, { color: s.text }]}>{status}</Text>
    </View>
  );
}

function AssessmentRow({ label, status, progress }: { label: string; status: string; progress: number }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE['Not Started'];
  return (
    <View style={styles.assessmentBlock}>
      <View style={styles.assessmentHeaderRow}>
        <Text style={typography.bodyBold}>{label}</Text>
        <StatusPillLocal status={status} />
      </View>
      <View style={styles.progressRow}>
        <Text style={typography.caption}>Progress</Text>
        <Text style={typography.caption}>{progress}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: s.barColor }]} />
      </View>
    </View>
  );
}

interface AssessmentData {
  periodLabel: string;
  stats: { total: number; completed: number; inProgress: number; notStarted: number };
  students: {
    id: string;
    name: string;
    initial: string;
    age: number;
    program: string;
    therapist: string;
    lastAssessment: string;
    score: number;
    ablls: { status: string; progress: number };
    behavior: { status: string; progress: number };
  }[];
}

export default function AssessmentDashboardScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [data, setData] = useState<AssessmentData | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getAssessmentDashboard();
      setData(res);
    } catch (err) {
      setData(DEMO_DATA);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <TopNav activeTab="Assessments" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} onLogout={logout} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="clipboard" size={18} color={colors.navyText} />
          <View>
            <Text style={typography.h1}>6-Week Assessment Dashboard</Text>
            <Text style={typography.caption}>SCR-010 — ABLLS + Behavior Assessment Launcher</Text>
          </View>
        </View>
        <View style={styles.periodPill}>
          <Feather name="clock" size={12} color={colors.primaryYellowDark} />
          <Text style={styles.periodPillText}>Assessment Period: {data.periodLabel}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Feather name="users" size={16} color={colors.mutedText} />
            <Text style={styles.statValue}>{data.stats.total}</Text>
            <Text style={typography.caption}>Total Students</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="check-circle" size={16} color="#22C55E" />
            <Text style={styles.statValue}>{data.stats.completed}</Text>
            <Text style={typography.caption}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="clock" size={16} color={colors.statusInProgressText} />
            <Text style={styles.statValue}>{data.stats.inProgress}</Text>
            <Text style={typography.caption}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="alert-circle" size={16} color={colors.mutedText} />
            <Text style={styles.statValue}>{data.stats.notStarted}</Text>
            <Text style={typography.caption}>Not Started</Text>
          </View>
        </View>

        <Text style={typography.h3}>Student Assessments</Text>
        <View style={styles.studentsGrid}>
          {data.students.map((s) => (
            <View key={s.id} style={styles.studentCard}>
                <View style={styles.studentHeaderRow}>
                  <View style={styles.studentAvatar}><Text style={styles.studentAvatarText}>{s.initial}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.bodyBold}>{s.name}</Text>
                    <Text style={typography.caption}>Age {s.age} · {s.program}</Text>
                    <Text style={typography.caption}>Therapist: {s.therapist} · Last assessment: {s.lastAssessment}</Text>
                  </View>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreBadgeValue}>{s.score}%</Text>
                    <Text style={styles.scoreBadgeLabel}>Score</Text>
                  </View>
                </View>

              <AssessmentRow label="ABLLS Assessment" status={s.ablls.status} progress={s.ablls.progress} />
              <AssessmentRow label="Behavior Assessment" status={s.behavior.status} progress={s.behavior.progress} />

              <View style={styles.studentBtnRow}>
                <TouchableOpacity style={styles.primaryLaunchBtn} onPress={() => navigation?.navigate?.('SkillsAssessment', { studentId: s.id })}>
                  <Text style={styles.primaryLaunchBtnText}>ABLLS Assessment →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryLaunchBtn} onPress={() => navigation?.navigate?.('BehaviorAssessment', { studentId: s.id })}>
                  <Text style={styles.secondaryLaunchBtnText}>Behavior Assessment →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.studentBtnRow}>
                <TouchableOpacity style={styles.secondaryLaunchBtn} onPress={() => navigation?.navigate?.('PreferenceAssessment', { studentId: s.id })}>
                  <Text style={styles.secondaryLaunchBtnText}>Preference →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryLaunchBtn} onPress={() => navigation?.navigate?.('SensoryAssessment', { studentId: s.id })}>
                  <Text style={styles.secondaryLaunchBtnText}>Sensory →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.guidelinesBox}>
          <Feather name="info" size={16} color={colors.primaryYellowDark} />
          <Text style={styles.guidelinesText}>
            All students must complete ABLLS and Behavior assessments within the 6-week window. Contact your coordinator if you need an extension.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DEMO_DATA: AssessmentData = {
  periodLabel: 'Jul 28 – Aug 8, 2026',
  stats: { total: 4, completed: 1, inProgress: 2, notStarted: 1 },
  students: [
    { id: 'student-a', name: 'Student A', initial: 'S', age: 6, program: 'Regular Program', therapist: 'Teacher A', lastAssessment: 'Jul 28, 2026', score: 62, ablls: { status: 'In Progress', progress: 45 }, behavior: { status: 'Not Started', progress: 0 } },
    { id: 'student-b', name: 'Student B', initial: 'S', age: 7, program: 'Regular Program', therapist: 'Teacher B', lastAssessment: 'Aug 2, 2026', score: 88, ablls: { status: 'Completed', progress: 100 }, behavior: { status: 'Completed', progress: 100 } },
    { id: 'student-c', name: 'Student C', initial: 'S', age: 5, program: 'Pooled-Out', therapist: 'Teacher C', lastAssessment: 'Jul 30, 2026', score: 41, ablls: { status: 'In Progress', progress: 20 }, behavior: { status: 'In Progress', progress: 20 } },
    { id: 'student-d', name: 'Student D', initial: 'S', age: 6, program: 'Regular Program', therapist: 'Teacher A', lastAssessment: '—', score: 0, ablls: { status: 'Not Started', progress: 0 }, behavior: { status: 'Not Started', progress: 0 } },
  ],
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, flexWrap: 'wrap', gap: spacing.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  periodPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: '#FEF3C7', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill },
  periodPillText: { fontSize: 12, fontWeight: '700', color: colors.primaryYellowDark },
  content: { padding: spacing.lg, gap: spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { flexGrow: 1, minWidth: '22%', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.navyText },
  studentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  studentCard: { flexGrow: 1, minWidth: '45%', backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  studentHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  studentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.promptG, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { color: colors.white, fontWeight: '700' },
  scoreBadge: { alignItems: 'center', backgroundColor: colors.bgApp, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.border },
  scoreBadgeValue: { fontSize: 14, fontWeight: '700', color: colors.navyText },
  scoreBadgeLabel: { fontSize: 9, fontWeight: '700', color: colors.mutedText, textTransform: 'uppercase' },
  assessmentBlock: { gap: spacing.xs },
  assessmentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTrack: { height: 6, borderRadius: radius.pill, backgroundColor: colors.bgApp, overflow: 'hidden' },
  progressFill: { height: '100%' },
  studentBtnRow: { flexDirection: 'row', gap: spacing.sm },
  primaryLaunchBtn: { flex: 1, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  primaryLaunchBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 11 },
  secondaryLaunchBtn: { flex: 1, borderWidth: 1, borderColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  secondaryLaunchBtnText: { fontWeight: '700', color: colors.primaryYellowDark, fontSize: 11 },
  guidelinesBox: { flexDirection: 'row', gap: spacing.sm, backgroundColor: '#FEF3C7', borderRadius: radius.md, padding: spacing.lg },
  guidelinesText: { flex: 1, fontSize: 13, color: '#92400E' },
});
