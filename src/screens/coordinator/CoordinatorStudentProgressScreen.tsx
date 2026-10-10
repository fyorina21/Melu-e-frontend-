// src/screens/coordinator/CoordinatorStudentProgressScreen.tsx

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CoordinatorStackParamList } from '../../types';
import AppNavbar from '../../components/AppNavbar';
import {
  getEnrollmentStudents,
  getStudentProgressOverview,
  flagStudent,
} from '../../api/coordinatorApi';
import { colors, radius, spacing } from '../../theme/colors';
import ExportPreviewModal from '../../components/ExportPreviewModal';

import type { StudentListItem, ProgressOverview, SessionHistoryRow } from './studentProgressTypes';
import { filterStudentsBySearch, buildStudentProgressExportReport } from './studentProgressHelper';

import { StudentProfileCard } from './components/StudentProfileCard';
import { AssessmentProgressCards } from './components/AssessmentProgressCards';
import { CurrentGoalsTable } from './components/CurrentGoalsTable';
import { SessionHistoryTable } from './components/SessionHistoryTable';
import { GoalProgressTrendChart } from './components/GoalProgressTrendChart';
import { BehaviorIncidentList } from './components/BehaviorIncidentList';
import { SessionDetailModal } from './components/SessionDetailModal';
import { FlagStudentModal } from './components/FlagStudentModal';
import StudentProgressHeader from './components/StudentProgressHeader';
import StudentSelectorCard from './components/StudentSelectorCard';
import InternalNotesCard from './components/InternalNotesCard';

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'CoordinatorStudentProgress'>;

export default function CoordinatorStudentProgressScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionHistoryRow | null>(null);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getEnrollmentStudents({})
      .then(({ data }) => {
        if (!cancelled) setStudents(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setStudents([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setOverview(null);
      return;
    }
    let cancelled = false;
    setOverview(null);
    getStudentProgressOverview(selectedStudentId)
      .then(({ data }) => {
        if (!cancelled) setOverview(data as ProgressOverview);
      })
      .catch(() => {
        if (!cancelled) setOverview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedStudentId]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  const filteredStudents = useMemo(
    () => filterStudentsBySearch(students, searchQuery),
    [students, searchQuery],
  );

  const handleFlagConfirm = async () => {
    if (selectedStudentId && flagReason.trim()) {
      try {
        await flagStudent(selectedStudentId, { reason: flagReason });
      } catch {}
    }
    setFlagged(true);
    setShowFlagModal(false);
    setFlagReason('');
  };

  const handleSaveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleTabPress = (tab: string) => {
    const routeByTab: Record<string, keyof CoordinatorStackParamList> = {
      Dashboard: 'CoordinatorDashboard',
      'Live Sessions': 'LiveSessionMonitoring',
      Review: 'SessionSummaryReview',
      Progress: 'CoordinatorStudentProgress',
      Schedule: 'CoordinatorSchedule',
      Parents: 'CoordinatorParentCommunication',
      Notifications: 'Notifications',
    };
    const route = routeByTab[tab];
    if (route) navigation?.navigate?.(route as never);
  };

  const exportReportContent = useMemo(
    () => buildStudentProgressExportReport(overview, selectedStudent),
    [overview, selectedStudent],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Progress" onTabPress={handleTabPress} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.responsiveContainer, { maxWidth: Math.min(width - 32, 1200) }]}>
          {/* Page Header */}
          <StudentProgressHeader />

          {/* Student Selector Card */}
          <StudentSelectorCard
            searchQuery={searchQuery}
            onSearchQueryChange={(t) => {
              setSearchQuery(t);
              setShowDropdown(true);
            }}
            showDropdown={showDropdown}
            onToggleDropdown={() => setShowDropdown((d) => !d)}
            selectedStudent={selectedStudent}
            filteredStudents={filteredStudents}
            onSelectStudent={(s) => {
              setSelectedStudentId(s.id);
              setSearchQuery('');
              setShowDropdown(false);
            }}
          />

          {/* Empty State */}
          {!selectedStudent && (
            <View style={[styles.card, styles.emptyState]}>
              <View style={styles.emptyIconWrap}>
                <Feather name="search" size={24} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>Select a student to view progress</Text>
              <Text style={styles.emptySubtitle}>
                Choose from the dropdown above to load full progress data.
              </Text>
            </View>
          )}

          {selectedStudent && (
            <>
              {/* Student Profile Card */}
              <StudentProfileCard
                selectedStudent={selectedStudent}
                flagged={flagged}
                onToggleFlag={() => (flagged ? setFlagged(false) : setShowFlagModal(true))}
                onPrintReport={() => setShowExport(true)}
              />

              {/* Assessment Summary */}
              <Text style={styles.sectionHeading}>ASSESSMENT SUMMARY</Text>
              <AssessmentProgressCards overview={overview} />

              {/* Current Goals */}
              <CurrentGoalsTable goals={overview?.goals ?? []} />

              {/* Session History */}
              <SessionHistoryTable
                sessions={overview?.sessionHistory ?? []}
                onSelectSession={(session) => setSelectedSession(session)}
              />

              {/* Goal Progress Chart */}
              <GoalProgressTrendChart goals={overview?.goals ?? []} />

              {/* Behavior Incident Trends */}
              <BehaviorIncidentList overview={overview} />

              {/* Internal Notes Card */}
              <InternalNotesCard
                notes={notes}
                notesSaved={notesSaved}
                onNotesChange={setNotes}
                onSaveNotes={handleSaveNotes}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* Session Modal */}
      <SessionDetailModal
        selectedSession={selectedSession}
        onClose={() => setSelectedSession(null)}
      />

      {/* Flag Modal */}
      <FlagStudentModal
        visible={showFlagModal}
        studentName={selectedStudent?.fullName}
        flagReason={flagReason}
        onReasonChange={setFlagReason}
        onClose={() => setShowFlagModal(false)}
        onConfirm={handleFlagConfirm}
      />

      {/* Student Progress Export Modal */}
      <ExportPreviewModal
        visible={showExport}
        filename="student_progress_report.txt"
        title={`Student Progress Report — ${overview?.name || selectedStudent?.fullName || 'Student'}`}
        content={exportReportContent}
        formId="FRM-COORD-PROG-002"
        revisionNumber="Rev 1.3 · 2026-09-20"
        pageNumber={1}
        totalPages={1}
        onClose={() => setShowExport(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg },
  responsiveContainer: {
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 1.5,
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.mutedText,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.8,
  },
});
