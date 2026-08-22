import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { getSessionSummary, submitSessionSummary, saveSessionDraft } from '../../api/sessionApi';
import { openPrintWindow } from '../../utils/webExport';
import { resetSessionTimer } from '../../stores/sessionTimerStore';
import type { SessionStackParamList, SessionSummary, SessionSummaryStudent, Goal, Trial } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'SessionSummary'>;

const PROMPT_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  FP: { bg: '#FEE2E2', text: '#DC2626', label: 'FP' },
  PP: { bg: '#FFEDD5', text: '#EA580C', label: 'PP' },
  G: { bg: '#EFF6FF', text: '#2563EB', label: 'G' },
  INDEPENDENT: { bg: '#DCFCE7', text: '#16A34A', label: '+' },
  '+': { bg: '#DCFCE7', text: '#16A34A', label: '+' },
};

interface TrialLogModalProps {
  visible: boolean;
  goalName?: string;
  trials?: Trial[];
  onClose: () => void;
}

function TrialLogModal({ visible, goalName, trials, onClose }: TrialLogModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.trialLogSheet}>
          <View style={styles.trialLogHeader}>
            <Text style={typography.h3}>Trial Log — {goalName}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color={colors.navyText} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {(trials || []).map((t, i) => (
              <View key={i} style={styles.trialLogRow}>
                <Text style={typography.body}>{t.timestamp}</Text>
                <View
                  style={[
                    styles.trialBadge,
                    { backgroundColor: PROMPT_CONFIG[t.promptLevel]?.bg || '#F3F4F6' },
                  ]}
                >
                  <Text
                    style={[
                      styles.trialBadgeText,
                      { color: PROMPT_CONFIG[t.promptLevel]?.text || '#374151' },
                    ]}
                  >
                    {PROMPT_CONFIG[t.promptLevel]?.label || t.promptLevel}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface GoalSummaryRowProps {
  goal: Goal;
  onViewTrialLog: (goal: Goal) => void;
}

function GoalSummaryRow({ goal, onViewTrialLog }: GoalSummaryRowProps) {
  const isTA = goal.goalType === 'task_analysis';
  const promptCounts = goal.promptBreakdown || {};

  return (
    <View style={styles.goalCard}>
      <View style={styles.goalHeaderRow}>
        <View>
          <Text style={styles.goalTitle}>{goal.name}</Text>
          <Text style={styles.goalSubtitle}>{goal.totalTrials} trials</Text>
        </View>
        <View style={styles.independenceContainer}>
          <View style={styles.independenceTrend}>
            <Feather name="trending-up" size={14} color="#16A34A" />
            <Text style={styles.independencePercent}>{goal.independencePercent}%</Text>
          </View>
          <Text style={styles.independenceLabel}>Independence</Text>
        </View>
      </View>

      {isTA ? (
        <View style={styles.taContainer}>
          {(goal.steps || []).map((step, idx) => (
            <View key={step.id} style={styles.taStepSummaryRow}>
              <Text style={typography.body}>
                Step {idx + 1}: {step.description}
              </Text>
              <Text style={typography.caption}>
                {step.successCount}/{step.totalTrials} · {step.independencePercent}%
              </Text>
            </View>
          ))}
          <Text style={typography.caption}>
            Overall mastery status: {goal.overallMasteryStatus}
          </Text>
        </View>
      ) : (
        <View style={styles.promptGrid}>
          {[
            { key: 'FP', label: 'FP' },
            { key: 'PP', label: 'PP' },
            { key: 'G', label: 'G' },
            { key: 'INDEPENDENT', label: '+' },
          ].map(({ key, label }) => {
            const config = PROMPT_CONFIG[key];
            const count = promptCounts[key] ?? promptCounts[label] ?? 0;
            return (
              <View key={key} style={[styles.promptBox, { backgroundColor: config.bg }]}>
                <Text style={[styles.promptCount, { color: config.text }]}>{count}</Text>
                <Text style={[styles.promptLabel, { color: config.text }]}>{label}</Text>
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity onPress={() => onViewTrialLog(goal)} style={styles.trialLogBtn}>
        <Text style={styles.linkText}>View Trial Log →</Text>
      </TouchableOpacity>
    </View>
  );
}

interface StudentSummarySectionProps {
  student: SessionSummaryStudent;
  onViewTrialLog: (student: SessionSummaryStudent, goal: Goal) => void;
}

function StudentSummarySection({ student, onViewTrialLog }: StudentSummarySectionProps) {
  return (
    <View style={styles.studentSection}>
      <Text style={styles.studentSectionTitle}>{student.name}</Text>
      {student.goals.map((goal) => (
        <GoalSummaryRow
          key={goal.id}
          goal={goal}
          onViewTrialLog={(g) => onViewTrialLog(student, g)}
        />
      ))}
    </View>
  );
}

export function SessionSummaryScreen({ route, navigation }: Props) {
  const sessionId = route.params?.sessionId;

  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [notes, setNotes] = useState('');
  const [trialLogTarget, setTrialLogTarget] = useState<{ goalName: string; trials: Trial[] } | null>(null);

  const load = useCallback(async () => {
    try {
      if (sessionId) {
        const { data } = await getSessionSummary(sessionId);
        setSummary(data);
        return;
      }
    } catch (err) {
      // Fallback to DEMO_SUMMARY on error
    }
    setSummary(DEMO_SUMMARY);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBackToSession = () => {
    if (notes.trim()) {
      Alert.alert('Return to session?', 'Your notes are saved as a draft.', [
        { text: 'Stay here', style: 'cancel' },
        { text: 'Back to Session', onPress: () => navigation?.goBack?.() },
      ]);
    } else {
      navigation?.goBack?.();
    }
  };

  const handleSaveDraft = async () => {
    try {
      if (sessionId) await saveSessionDraft(sessionId, { notes });
      Alert.alert('Draft saved');
    } catch (err) {
      Alert.alert('Saved locally', 'Will sync once connected.');
    }
  };

  const handleSubmit = async () => {
    if (!notes.trim()) {
      Alert.alert('Notes required', 'Add qualitative notes before submitting.');
      return;
    }
    try {
      if (sessionId) await submitSessionSummary(sessionId, { notes });
      resetSessionTimer();
      Alert.alert('Session submitted', 'Sent to your Program Coordinator.');
      navigation?.navigate?.('SessionDataCollection');
    } catch (err) {
      Alert.alert('Submitted (offline)', 'Will sync once connected.');
    }
  };

  const handlePreviewPdf = () => {
    if (!summary) return;
    const lines = [
      `Melu'e Foundation — Session Summary`,
      `Station: ${summary.stationName}`,
      `Teacher: ${summary.teacherName}`,
      `Time: ${summary.startTime} – ${summary.endTime} (${summary.durationMinutes} minutes)`,
      '',
      'STUDENT GOAL DATA',
      ...summary.students.flatMap((s) => [
        `— ${s.name}`,
        ...s.goals.map((g) =>
          g.goalType === 'task_analysis'
            ? `  • ${g.name} (TA): ${g.independencePercent}% independent · mastery: ${g.overallMasteryStatus}`
            : `  • ${g.name}: ${g.independencePercent}% independent · ${g.totalTrials} trials · ${Object.entries(g.promptBreakdown || {}).map(([l, c]) => `${l}:${c}`).join(' ')}`
        ),
      ]),
      '',
      `BEHAVIOR INCIDENTS: ${summary.incidents.length}`,
      ...summary.incidents.map((inc) => `• ${inc.time} — ${inc.behavior} (${inc.studentName})`),
      '',
      'TEACHER QUALITATIVE NOTES',
      notes || '(no notes added yet)',
      '',
      `Preview generated ${new Date().toLocaleString()}`,
    ];
    const text = lines.join('\n');
    const title = 'Session Summary';
    const formattedHtml = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: monospace; white-space: pre-wrap; padding: 20px; font-size: 14px; line-height: 1.5; color: #1e293b; }
          </style>
        </head>
        <body>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
      </html>
    `;
    openPrintWindow(formattedHtml, title);
  };

  if (!summary) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={handleBackToSession} style={styles.topBackBtn}>
          <Feather name="arrow-left" size={16} color="#64748B" />
          <Text style={styles.topBackText}>Back to Session</Text>
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Session Summary</Text>
            <TouchableOpacity onPress={handlePreviewPdf} style={styles.previewPdfBtn}>
              <Feather name="file-text" size={16} color="#1E293B" />
              <Text style={styles.previewPdfText}>Preview PDF</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sessionMetaGrid}>
            <View style={styles.metaColumn}>
              <Text style={styles.metaLabel}>Station</Text>
              <Text style={styles.metaValue}>{summary.stationName}</Text>
            </View>
            <View style={styles.metaColumn}>
              <Text style={styles.metaLabel}>Teacher</Text>
              <Text style={styles.metaValue}>{summary.teacherName}</Text>
            </View>
            <View style={styles.metaColumn}>
              <Text style={styles.metaLabel}>Time</Text>
              <Text style={styles.metaValue}>{summary.startTime}</Text>
            </View>
            <View style={styles.metaColumn}>
              <Text style={styles.metaLabel}>Duration</Text>
              <Text style={styles.metaValue}>{summary.durationMinutes} minutes</Text>
            </View>
          </View>
        </View>

        {summary.students.map((student) => (
          <StudentSummarySection
            key={student.id}
            student={student}
            onViewTrialLog={(s, g) =>
              setTrialLogTarget({ goalName: `${s.name} — ${g.name}`, trials: g.trialLog || [] })
            }
          />
        ))}

        {summary.incidents.length > 0 && (
          <View style={styles.incidentCard}>
            <View style={styles.incidentHeader}>
              <Feather name="alert-triangle" size={18} color="#EA580C" />
              <Text style={styles.incidentTitle}>
                Behavior Incidents ({summary.incidents.length})
              </Text>
            </View>
            {summary.incidents.map((inc, i) => (
              <View key={i} style={styles.incidentBody}>
                <View style={styles.incidentRowTop}>
                  <Text style={styles.incidentTime}>{inc.time}</Text>
                  <TouchableOpacity>
                    <Text style={styles.linkText}>View Details</Text>
                  </TouchableOpacity>
                </View>
               <Text style={styles.incidentABC}>
                <Text style={styles.boldText}>A:</Text> {(inc as any).antecedent || 'Task demand'} •{' '}
                   <Text style={styles.boldText}>B:</Text> {inc.behavior} •{' '}
                   <Text style={styles.boldText}>C:</Text> {(inc as any).consequence || 'Offered break'}
              </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>
            Teacher Notes <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Summarize the session, student progress, any concerns, or recommendations..."
            placeholderTextColor="#94A3B8"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.saveDraftBtn} onPress={handleSaveDraft}>
            <Text style={styles.saveDraftText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, !notes.trim() && styles.submitBtnDisabled]}
            disabled={!notes.trim()}
            onPress={handleSubmit}
          >
            <Text style={styles.submitBtnText}>Submit & End Session</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TrialLogModal
        visible={!!trialLogTarget}
        goalName={trialLogTarget?.goalName}
        trials={trialLogTarget?.trials}
        onClose={() => setTrialLogTarget(null)}
      />
    </SafeAreaView>
  );
}

export default SessionSummaryScreen;

const DEMO_SUMMARY: SessionSummary = {
  stationName: 'Station A',
  teacherName: 'Teacher A',
  startTime: '9:00 AM',
  endTime: '9:30 AM',
  durationMinutes: 30,
  students: [
    {
      id: 's1',
      name: 'Student A',
      goals: [
        {
          id: 'g1',
          name: 'Identify Colors',
          goalType: 'standard',
          independencePercent: 40,
          totalTrials: 10,
          promptBreakdown: { FP: 1, PP: 2, G: 3, INDEPENDENT: 4 },
          trialLog: [],
        },
        {
          id: 'g2',
          name: 'Follow 2-Step Commands',
          goalType: 'standard',
          independencePercent: 70,
          totalTrials: 10,
          promptBreakdown: { FP: 0, PP: 1, G: 2, INDEPENDENT: 7 },
          trialLog: [],
        },
      ],
    },
    {
      id: 's2',
      name: 'Student B',
      goals: [
        {
          id: 'g5',
          name: 'Request Items',
          goalType: 'standard',
          independencePercent: 80,
          totalTrials: 10,
          promptBreakdown: { FP: 0, PP: 0, G: 2, INDEPENDENT: 8 },
          trialLog: [],
        },
        {
          id: 'g6',
          name: 'Eye Contact',
          goalType: 'standard',
          independencePercent: 50,
          totalTrials: 10,
          promptBreakdown: { FP: 0, PP: 1, G: 4, INDEPENDENT: 5 },
          trialLog: [],
        },
      ],
    },
  ],
  incidents: [
  {
    time: '9:15 AM',
    studentName: 'Student A',
    behavior: 'Threw materials',
    antecedent: 'Task demand',
    consequence: 'Offered break',
  } as any,
],
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  topBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs },
  topBackText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.md,
  },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  previewPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  previewPdfText: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  sessionMetaGrid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  metaColumn: { gap: 2 },
  metaLabel: { fontSize: 12, color: '#94A3B8' },
  metaValue: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  studentSection: { gap: spacing.sm, marginTop: spacing.xs },
  studentSectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.md,
  },
  goalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  goalTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  goalSubtitle: { fontSize: 13, color: '#94A3B8' },
  independenceContainer: { alignItems: 'flex-end' },
  independenceTrend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  independencePercent: { fontSize: 14, fontWeight: '700', color: '#16A34A' },
  independenceLabel: { fontSize: 11, color: '#94A3B8' },
  promptGrid: { flexDirection: 'row', gap: 8 },
  promptBox: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptCount: { fontSize: 16, fontWeight: '700' },
  promptLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  trialLogBtn: { marginTop: 2 },
  linkText: { fontSize: 13, color: '#0284C7', fontWeight: '500' },
  taContainer: { gap: 4 },
  taStepSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  incidentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.xs,
  },
  incidentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  incidentTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  incidentBody: {
    borderLeftWidth: 3,
    borderLeftColor: '#EA580C',
    paddingLeft: spacing.md,
    marginTop: spacing.xs,
  },
  incidentRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  incidentTime: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  incidentABC: { fontSize: 13, color: '#475569', marginTop: 2 },
  boldText: { fontWeight: '700' },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.sm,
  },
  notesTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  textArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 110,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#0F172A',
  },
  actionRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  saveDraftBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  saveDraftText: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  submitBtn: {
    flex: 2,
    backgroundColor: '#FACC15',
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  trialLogSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    maxHeight: '70%',
    padding: spacing.lg,
    gap: spacing.md,
  },
  trialLogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trialLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  trialBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  trialBadgeText: { fontSize: 12, fontWeight: '700' },
});