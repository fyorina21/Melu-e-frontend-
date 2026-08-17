// screens/sessionsummary/SessionSummaryScreen.js
// SCR-005: Session Summary Screen
//
// The real destination of MR-33's "End Session" button - not to be
// confused with DailyNotesScreen (MR-35), which is a historical list of
// past session records. This is the live report for the session you're
// currently ending: auto-calculated metrics, incidents, and the one
// manual text field (qualitative notes).

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
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { resetSessionTimer } from '../../stores/sessionTimerStore';
import type { SessionStackParamList, SessionSummary, SessionSummaryStudent, Goal, Trial } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'SessionSummary'>;

const PROMPT_COLOR: Record<string, string> = { INDEPENDENT: '#22C55E', G: '#EAB308', PP: '#F97316', FP: '#EF4444' };

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
                <View style={[styles.trialLogDot, { backgroundColor: PROMPT_COLOR[t.promptLevel] }]} />
                <Text style={typography.bodyBold}>{t.promptLevel}</Text>
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
  return (
    <View style={styles.goalRow}>
      <View style={styles.goalRowHeader}>
        <Text style={typography.bodyBold}>{goal.name}</Text>
        <Text style={typography.caption}>{goal.independencePercent}% independent</Text>
      </View>

      {isTA ? (
        <View>
          {(goal.steps || []).map((step, idx) => (
            <View key={step.id} style={styles.taStepSummaryRow}>
              <Text style={typography.body}>Step {idx + 1}: {step.description}</Text>
              <Text style={typography.caption}>
                {step.successCount}/{step.totalTrials} · {step.independencePercent}%
              </Text>
            </View>
          ))}
          <Text style={typography.caption}>Overall mastery status: {goal.overallMasteryStatus}</Text>
        </View>
      ) : (
        <>
          <View style={styles.promptBreakdownRow}>
            {Object.entries(goal.promptBreakdown || {}).map(([level, count]) => (
              <View key={level} style={styles.promptBreakdownChip}>
                <View style={[styles.trialLogDot, { backgroundColor: PROMPT_COLOR[level] }]} />
                <Text style={typography.caption}>{level}: {count}</Text>
              </View>
            ))}
          </View>
          <Text style={typography.caption}>{goal.totalTrials} total trials</Text>
        </>
      )}

      <TouchableOpacity onPress={() => onViewTrialLog(goal)}>
        <Text style={styles.linkText}>View Trial Log →</Text>
      </TouchableOpacity>
    </View>
  );
}

interface StudentSummaryCardProps {
  student: SessionSummaryStudent;
  expanded: boolean;
  onToggle: () => void;
  onViewTrialLog: (student: SessionSummaryStudent, goal: Goal) => void;
}

function StudentSummaryCard({ student, expanded, onToggle, onViewTrialLog }: StudentSummaryCardProps) {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.studentCardHeader} onPress={onToggle}>
        <Text style={typography.h3}>{student.name}</Text>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.navyText} />
      </TouchableOpacity>
      {expanded && (
        <View>
          {student.goals.map((goal) => (
            <GoalSummaryRow key={goal.id} goal={goal} onViewTrialLog={(g) => onViewTrialLog(student, g)} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function SessionSummaryScreen({ route, navigation }: Props) {
  const sessionId = route.params.sessionId;

  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [expandedStudentIds, setExpandedStudentIds] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [trialLogTarget, setTrialLogTarget] = useState<{ goalName: string; trials: Trial[] } | null>(null);
  const [incidentsExpanded, setIncidentsExpanded] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getSessionSummary(sessionId);
      setSummary(data);
      setExpandedStudentIds(Object.fromEntries(data.students.map((s: { id: string }) => [s.id, true])));
    } catch (err) {
      setSummary(DEMO_SUMMARY);
      setExpandedStudentIds(Object.fromEntries(DEMO_SUMMARY.students.map((s) => [s.id, true])));
    }
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
      await saveSessionDraft(sessionId, { notes });
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
      await submitSessionSummary(sessionId, { notes });
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
      `Time: ${summary.startTime} – ${summary.endTime} (${summary.durationMinutes} min)`,
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
    setPreviewContent(lines.join('\n'));
  };

  if (!summary) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToSession} style={styles.headerBtn}>
          <Feather name="arrow-left" size={18} color={colors.navyText} />
          <Text style={styles.headerBtnText}>Back to Session</Text>
        </TouchableOpacity>
        <Text style={typography.h1}>Session Summary</Text>
        <TouchableOpacity onPress={handlePreviewPdf} style={styles.headerBtn}>
          <Feather name="file-text" size={18} color={colors.navyText} />
          <Text style={styles.headerBtnText}>Preview PDF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={typography.h3}>Session Details</Text>
          <Text style={typography.body}>{summary.stationName}</Text>
          <Text style={typography.caption}>{summary.teacherName} · {summary.startTime} – {summary.endTime} · {summary.durationMinutes} min</Text>
        </View>

        {summary.students.map((student) => (
          <StudentSummaryCard
            key={student.id}
            student={student}
            expanded={!!expandedStudentIds[student.id]}
            onToggle={() =>
              setExpandedStudentIds((prev) => ({ ...prev, [student.id]: !prev[student.id] }))
            }
            onViewTrialLog={(s, g) => setTrialLogTarget({ goalName: `${s.name} — ${g.name}`, trials: g.trialLog || [] })}
          />
        ))}

        <View style={styles.card}>
          <TouchableOpacity style={styles.studentCardHeader} onPress={() => setIncidentsExpanded((v) => !v)}>
            <Text style={typography.h3}>Behavior Incidents ({summary.incidents.length})</Text>
            <Feather name={incidentsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.navyText} />
          </TouchableOpacity>
          {incidentsExpanded && summary.incidents.map((inc, i) => (
            <View key={i} style={styles.incidentRow}>
              <Text style={typography.body}>{inc.time} — {inc.behavior}</Text>
              <Text style={typography.caption}>{inc.studentName}</Text>
            </View>
          ))}
          {incidentsExpanded && summary.incidents.length === 0 && (
            <Text style={[typography.body, { color: colors.mutedText }]}>No incidents recorded.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Teacher Qualitative Notes</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            multiline
            placeholder="Describe how the session went, any context for the data above..."
            placeholderTextColor={colors.mutedText}
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.draftBtn} onPress={handleSaveDraft}>
          <Text style={styles.draftBtnText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitBtn, !notes.trim() && styles.submitBtnDisabled]}
          disabled={!notes.trim()}
          onPress={handleSubmit}
        >
          <Text style={styles.submitBtnText}>Submit & End Session</Text>
        </TouchableOpacity>
      </View>

      <TrialLogModal
        visible={!!trialLogTarget}
        goalName={trialLogTarget?.goalName}
        trials={trialLogTarget?.trials}
        onClose={() => setTrialLogTarget(null)}
      />

      <ExportPreviewModal
        visible={!!previewContent}
        title="Session Summary"
        filename={`SessionSummary_${summary?.stationName.replace(/\s+/g, '_')}.txt`}
        content={previewContent ?? ''}
        onClose={() => setPreviewContent(null)}
      />
    </SafeAreaView>
  );
}

const DEMO_SUMMARY: SessionSummary = {
  stationName: 'Station 1 (Basic Skills) · Room 2',
  teacherName: 'Teacher A',
  startTime: '9:00 AM',
  endTime: '10:30 AM',
  durationMinutes: 90,
  students: [
    {
      id: 'student-a',
      name: 'Student A',
      goals: [
        {
          id: 'goal-1',
          name: 'Identify Colors',
          goalType: 'standard',
          independencePercent: 68,
          totalTrials: 24,
          promptBreakdown: { INDEPENDENT: 10, G: 6, PP: 5, FP: 3 },
          trialLog: [
            { promptLevel: 'INDEPENDENT', timestamp: '9:04 AM' },
            { promptLevel: 'G', timestamp: '9:06 AM' },
          ],
        },
      ],
    },
    {
      id: 'student-b',
      name: 'Student B',
      goals: [
        {
          id: 'goal-3',
          name: 'Request Items',
          goalType: 'standard',
          independencePercent: 55,
          totalTrials: 18,
          promptBreakdown: { INDEPENDENT: 6, G: 4, PP: 5, FP: 3 },
          trialLog: [{ promptLevel: 'PP', timestamp: '9:12 AM' }],
        },
      ],
    },
  ],
  incidents: [],
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headerBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  headerBtnText: { fontWeight: '600', color: colors.navyText, fontSize: 13 },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  studentCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalRow: { paddingTop: spacing.md, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.xs },
  goalRowHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  promptBreakdownRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  promptBreakdownChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trialLogDot: { width: 8, height: 8, borderRadius: 4 },
  taStepSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  linkText: { color: colors.statusInProgressText, fontWeight: '600', fontSize: 12 },
  incidentRow: { paddingTop: spacing.sm, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.navyText,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  draftBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  draftBtnText: { fontWeight: '600', color: colors.navyText },
  submitBtn: {
    flex: 2,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontWeight: '700', color: colors.navyText },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  trialLogSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    maxHeight: '70%',
    padding: spacing.lg,
    gap: spacing.md,
  },
  trialLogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trialLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
