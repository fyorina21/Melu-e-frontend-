import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import AppNavbar from '../../components/AppNavbar';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import {
  getSessionSummary,
  submitSessionSummary,
  saveSessionDraft,
  resubmitSessionNote,
} from '../../api/sessionApi';
import { openPrintWindow } from '../../utils/webExport';
import { resetSessionTimer } from '../../stores/sessionTimerStore';
import { useToast } from '../../context/ToastContext';
import type {
  SessionStackParamList,
  SessionSummary,
  SessionSummaryStudent,
  Goal,
  Trial,
  IncidentPayload,
} from '../../types';
import { spacing } from '../../theme/colors';

import { type DisplayIncident, mergeIncidents, generateSummaryReportText } from './types';
import { TrialLogModal } from './components/TrialLogModal';
import { StudentSummarySection } from './components/StudentSummarySection';
import { SessionSummaryHeader } from './components/SessionSummaryHeader';
import { BehaviorIncidentsCard } from './components/BehaviorIncidentsCard';
import { TeacherNotesCard } from './components/TeacherNotesCard';

type Props = NativeStackScreenProps<SessionStackParamList, 'SessionSummary'>;

export function SessionSummaryScreen({ route, navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const sessionId = route.params?.sessionId ?? 'active';
  const localIncidents = useMemo(
    () => (route.params?.localIncidents as IncidentPayload[]) || [],
    [route.params?.localIncidents],
  );
  const { showToast } = useToast();

  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [notes, setNotes] = useState('');
  const [trialLogTarget, setTrialLogTarget] = useState<{
    goalName: string;
    trials: Trial[];
  } | null>(null);

  const load = useCallback(async () => {
    try {
      if (sessionId) {
        const { data } = await getSessionSummary(sessionId);
        const rawStudents = Array.isArray(data?.students) ? data.students : [];
        const rawIncidents = Array.isArray(data?.incidents) ? data.incidents : [];
        const mergedIncidents = mergeIncidents(rawIncidents, localIncidents);

        setSummary({
          ...data,
          stationName: data?.stationName || data?.station || 'Station A',
          teacherName: data?.teacherName || data?.teacher || 'Teacher',
          startTime: data?.startTime || '9:00 AM',
          endTime: data?.endTime || '10:30 AM',
          durationMinutes: data?.durationMinutes || 90,
          students: rawStudents,
          incidents: mergedIncidents as any,
        });
      }
      setLoadError(false);
    } catch {
      if ((localIncidents || []).length > 0) {
        setSummary({
          stationName: '',
          teacherName: '',
          startTime: '',
          endTime: '',
          durationMinutes: 0,
          students: [],
          incidents: mergeIncidents([], localIncidents) as any,
        });
        setLoadError(false);
      } else {
        setLoadError(true);
      }
    }
  }, [sessionId, localIncidents]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBackToSession = useCallback(() => {
    if (notes.trim()) {
      Alert.alert('Return to session?', 'Your notes are saved as a draft.', [
        { text: 'Stay here', style: 'cancel' },
        { text: 'Back to Session', onPress: () => navigation?.goBack?.() },
      ]);
    } else {
      navigation?.goBack?.();
    }
  }, [notes, navigation]);

  const handleSaveDraft = useCallback(async () => {
    try {
      if (sessionId) await saveSessionDraft(sessionId, { notes });
      Alert.alert('Draft saved');
    } catch {
      Alert.alert('Saved locally', 'Will sync once connected.');
    }
  }, [sessionId, notes]);

  const handleSubmit = useCallback(async () => {
    if (!notes.trim()) {
      Alert.alert('Notes required', 'Add qualitative notes before submitting.');
      return;
    }
    try {
      if (sessionId) await submitSessionSummary(sessionId, { notes });
      resetSessionTimer();
      Alert.alert('Session submitted', 'Sent to your Program Coordinator.');
      navigation?.navigate?.('SessionDataCollection');
    } catch {
      Alert.alert('Submitted (offline)', 'Will sync once connected.');
    }
  }, [notes, sessionId, navigation]);

  const handleResubmit = useCallback(async () => {
    try {
      if (sessionId) await resubmitSessionNote(sessionId, { notes });
      showToast('Draft resubmitted for review', 'success');
    } catch {
      showToast('Resubmitted (offline)', 'info');
    }
  }, [sessionId, notes, showToast]);

  const handlePreviewPdf = useCallback(() => {
    if (!summary) return;
    const students = Array.isArray(summary.students) ? summary.students : [];
    const incidents = (Array.isArray(summary.incidents)
      ? summary.incidents
      : []) as unknown as DisplayIncident[];
    const text = generateSummaryReportText(
      summary.stationName || '',
      summary.teacherName || '',
      students,
      incidents,
      notes,
    );
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
  }, [summary, notes]);

  const handleViewTrialLog = useCallback((student: SessionSummaryStudent, goal: Goal) => {
    setTrialLogTarget({ goalName: `${student.name} — ${goal.name}`, trials: goal.trialLog || [] });
  }, []);

  const contentStyle = useMemo(
    () => [styles.content, isTablet && styles.tabletContent],
    [isTablet],
  );

  if (loadError) return <ScreenError onRetry={load} />;
  if (!summary) return <ScreenLoader />;

  const students = Array.isArray(summary.students) ? summary.students : [];
  const incidents = (Array.isArray(summary.incidents)
    ? summary.incidents
    : []) as unknown as DisplayIncident[];

  if (students.length === 0 && incidents.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppNavbar
          activeTab="Session"
          onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
        />
        <ScrollView contentContainerStyle={contentStyle} showsVerticalScrollIndicator={false}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No session data found.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const summaryStatus = summary.status || 'pending_review';
  const isDraft = summaryStatus === 'draft';

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Session" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />
      <ScrollView contentContainerStyle={contentStyle}>
        <SessionSummaryHeader
          stationName={summary.stationName || 'Station A'}
          teacherName={summary.teacherName || 'Teacher'}
          status={summaryStatus}
          coordinatorFeedback={(summary as any).coordinatorFeedback}
          onBack={handleBackToSession}
          onPreviewPdf={handlePreviewPdf}
        />

        {students.map((student) => (
          <StudentSummarySection
            key={student.id}
            student={student}
            onViewTrialLog={handleViewTrialLog}
          />
        ))}

        <BehaviorIncidentsCard incidents={incidents} />

        <TeacherNotesCard
          notes={notes}
          onNotesChange={setNotes}
          isDraft={isDraft}
          onSaveDraft={handleSaveDraft}
          onResubmit={handleResubmit}
          onSubmit={handleSubmit}
        />
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: 60,
  },
  tabletContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
  },
});
