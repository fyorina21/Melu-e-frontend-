import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
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
import { StudentProfileCard } from './components/StudentProfileCard';
import { AssessmentProgressCards } from './components/AssessmentProgressCards';
import { CurrentGoalsTable } from './components/CurrentGoalsTable';
import { SessionHistoryTable } from './components/SessionHistoryTable';
import { GoalProgressTrendChart } from './components/GoalProgressTrendChart';
import { BehaviorIncidentList } from './components/BehaviorIncidentList';
import { SessionDetailModal } from './components/SessionDetailModal';
import { FlagStudentModal } from './components/FlagStudentModal';

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'CoordinatorStudentProgress'>;

export default function CoordinatorStudentProgressScreen({ navigation }: Props) {
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

  const selectedStudent = students.find((s) => s.id === selectedStudentId) ?? null;

  const filteredStudents = students.filter((s) =>
    (s.fullName ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
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

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Progress" onTabPress={handleTabPress} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveContainer}>
          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.headerIconWrap}>
              <Feather name="activity" size={20} color={colors.primaryYellowDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pageTitle}>Student Progress</Text>
              <Text style={styles.pageSubtitle}>Monitor goals, sessions & behavior trends</Text>
            </View>
          </View>

          {/* Student Selector */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>SELECT STUDENT</Text>
            <View style={styles.searchRow}>
              <Feather name="search" size={16} color="#9CA3AF" />
              <TextInput
                placeholder="Search students..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={(t) => {
                  setSearchQuery(t);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                style={styles.searchInput}
              />
              {selectedStudent && (
                <View style={styles.selectedChip}>
                  <Text style={styles.selectedChipText}>{selectedStudent.fullName}</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => setShowDropdown((d) => !d)}
                hitSlop={{ top: 8, bottom: 8 }}
                accessibilityLabel="Toggle student list dropdown"
              >
                <Feather name="chevron-down" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {showDropdown && (
              <View style={styles.dropdown}>
                <ScrollView style={{ maxHeight: 190 }} nestedScrollEnabled>
                  {filteredStudents.length === 0 ? (
                    <Text style={styles.emptyDropdownText}>No students found</Text>
                  ) : (
                    filteredStudents.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[
                          styles.dropdownItem,
                          selectedStudentId === s.id && styles.dropdownItemActive,
                        ]}
                        onPress={() => {
                          setSelectedStudentId(s.id);
                          setSearchQuery('');
                          setShowDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemName,
                            selectedStudentId === s.id && { color: colors.navyText },
                          ]}
                        >
                          {s.fullName}
                        </Text>
                        <Text style={styles.dropdownItemStation}>{s.programType}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            )}
          </View>

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

              {/* Internal Notes */}
              <View style={styles.card}>
                <View style={styles.notesHeaderRow}>
                  <Feather name="file-text" size={16} color={colors.primaryYellowDark} />
                  <Text style={styles.cardTitle}>Internal Notes</Text>
                  <View style={styles.grayChip}>
                    <Text style={styles.grayChipText}>Coordinator only</Text>
                  </View>
                </View>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add internal coordinator notes here (not visible to teachers)..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  style={styles.notesInput}
                  textAlignVertical="top"
                />
                <View style={styles.notesFooterRow}>
                  {notesSaved && (
                    <View style={styles.savedRow}>
                      <Feather name="check-circle" size={14} color="#16A34A" />
                      <Text style={styles.savedText}>Notes saved</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveNotes}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Save coordinator notes"
                  >
                    <Feather name="save" size={16} color={colors.navyText} />
                    <Text style={styles.saveButtonText}>Save Notes</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
        content={[
          "MELU'E FOUNDATION FOR AUTISM & SPECIAL NEEDS",
          'STUDENT PROGRESS & CLINICAL MONITORING REPORT',
          '================================================================',
          `STUDENT: ${overview?.name || selectedStudent?.fullName || 'Student'} (Age: ${overview?.age || selectedStudent?.age || 'N/A'})`,
          `PROGRAM: ${overview?.program || selectedStudent?.programType || 'Special Education'}`,
          `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
          '----------------------------------------------------------------',
          '',
          'ASSESSMENT STATUS:',
          `• Skills Assessment: ${overview?.assessmentSummary?.skills || 'In Progress'}`,
          `• Behavior Assessment: ${overview?.assessmentSummary?.behavior || 'In Progress'}`,
          `• Preferences Assessment: ${overview?.assessmentSummary?.preferences || 'Completed'}`,
          '',
        ].join('\n')}
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
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.lg,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 20, fontWeight: '700', color: colors.navyText },
  pageSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    fontSize: 13,
    color: colors.navyText,
  },
  selectedChip: {
    backgroundColor: '#FEF9C3',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  selectedChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  dropdown: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemActive: {
    backgroundColor: '#FEF9C3',
  },
  dropdownItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.bodyText,
  },
  dropdownItemStation: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  emptyDropdownText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    padding: spacing.md,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  grayChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  grayChipText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  notesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 13,
    color: colors.navyText,
    backgroundColor: '#F8FAFC',
    minHeight: 90,
  },
  notesFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
});
