import React, { useEffect, useState, useCallback } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
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
    phase?: string; // e.g., '6-week', 'active', 'maintenance'
  }[];
}

export default function AssessmentDashboardScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [data, setData] = useState<AssessmentData | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getAssessmentDashboard();
      setData(res);
      setLoadError(false);
    } catch (err) {
      setLoadError(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter students to only show those in 6-week assessment phase
  const filteredStudents = data?.students.filter((s) => s.phase === '6-week' || !s.phase) ?? [];

  if (loadError) return <ScreenError onRetry={load} />;
  if (!data) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Assessments" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="clipboard" size={18} color={colors.navyText} />
          <View>
            <Text style={typography.h1}>6 Week Assessment Dashboard</Text>
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
            <Text style={typography.caption}>Assigned Students</Text>
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
          {filteredStudents.map((s) => (
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

              <AssessmentRow label="Skills Assessment" status={s.ablls.status} progress={s.ablls.progress} />
              <AssessmentRow label="Behavior Assessment" status={s.behavior.status} progress={s.behavior.progress} />

              <View style={styles.studentBtnRow}>
                <TouchableOpacity style={[styles.launchBtn, { backgroundColor: '#3B82F6' }]} onPress={() => navigation?.navigate?.('SkillsAssessment', { studentId: s.id })}>
                  <Text style={styles.launchBtnTextLight}>Skills Assessment →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.launchBtn, { backgroundColor: '#EF4444' }]} onPress={() => navigation?.navigate?.('BehaviorAssessment', { studentId: s.id })}>
                  <Text style={styles.launchBtnTextLight}>Behavior Assessment →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.studentBtnRow}>
                <TouchableOpacity style={[styles.launchBtn, { backgroundColor: '#22C55E' }]} onPress={() => navigation?.navigate?.('PreferenceAssessment', { studentId: s.id })}>
                  <Text style={styles.launchBtnTextLight}>Preference →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.launchBtn, { backgroundColor: '#A855F7' }]} onPress={() => navigation?.navigate?.('SensoryAssessment', { studentId: s.id })}>
                  <Text style={styles.launchBtnTextLight}>Sensory →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.studentBtnRow}>
                <TouchableOpacity style={[styles.launchBtn, { backgroundColor: '#D97706' }]} onPress={() => navigation?.navigate?.('SocialSkillsAssessment', { studentId: s.id })}>
                  <Text style={styles.launchBtnTextLight}>Social Skills Questionnaire →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.guidelinesBox}>
          <Feather name="info" size={16} color={colors.primaryYellowDark} />
          <Text style={styles.guidelinesText}>
            All students must complete the Skills and Behavior assessments within the 6-week window. Contact your coordinator if you need an extension.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  launchBtn: { flex: 1, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  launchBtnTextLight: { fontWeight: '700', color: colors.white, fontSize: 11 },
  guidelinesBox: { flexDirection: 'row', gap: spacing.sm, backgroundColor: '#FEF3C7', borderRadius: radius.md, padding: spacing.lg },
  guidelinesText: { flex: 1, fontSize: 13, color: '#92400E' },
});
