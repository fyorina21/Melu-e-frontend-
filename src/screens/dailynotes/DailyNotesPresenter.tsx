import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import StatusPill from '../../components/StatusPill';
import AppNavbar from '../../components/AppNavbar';
import { radius, spacing } from '../../theme/colors';

export interface NoteRecord {
  id: string;
  date: string;
  students: string[];
  station: string;
  room: string;
  status: 'Approved' | 'Pending' | 'Revision Required' | 'Draft';
  coordinatorFeedback?: string;
}

export interface DailyNotesStats {
  sessionsCompleted: number;
  totalTrials: number;
  avgIndependence: number;
  reviewsPending: number;
}

export interface WeeklySummaryData {
  weekRange: string;
  sessionsThisWeek: number;
  totalTrialsThisWeek: number;
  avgIndependenceThisWeek: number;
}

export interface BehaviorRecord {
  id: string;
  behavior: string;
  frequency: string;
  duration: string;
  intensity: 'Low' | 'Medium' | 'High';
  trigger: string;
  consequence: string;
}

export interface BehaviorAssessmentData {
  massAnswers?: Record<string, string>;
  fastAnswers?: Record<string, boolean>;
  records?: BehaviorRecord[];
  draftRecord?: BehaviorRecord;
  status?: string;
}

export interface StudentOption {
  id: string;
  name: string;
  initial: string;
}

export interface DailyNotesPresenterProps {
  stats: DailyNotesStats;
  summary: WeeklySummaryData | null;
  filteredRecords: NoteRecord[];
  search: string;
  dateFilter: string;
  statusFilter: string;
  studentId?: string;
  studentOptions: StudentOption[];
  openDropdown: 'date' | 'status' | 'student' | null;
  behaviorAssessment: BehaviorAssessmentData | null;
  hasBehavior: boolean;
  massFunctionText?: string;
  fastCategoryText?: string;
  feedbackTarget: NoteRecord | null;
  dateOptions: string[];
  statusOptions: string[];
  onSearchChange: (text: string) => void;
  onDateFilterChange: (date: string) => void;
  onStatusFilterChange: (status: string) => void;
  onStudentSelect: (id?: string) => void;
  onToggleDropdown: (dropdown: 'date' | 'status' | 'student' | null) => void;
  onExportWeekly: () => void;
  onGoBack: () => void;
  onNavigateEditor: (sessionId: string, mode: 'view' | 'edit') => void;
  onNavigateBehaviorAssessment: (studentId: string) => void;
  onResubmitNote: (id: string) => void;
  onCloseFeedback: () => void;
  onOpenFeedback: (record: NoteRecord) => void;
  onNavbarTabPress: (tab: string) => void;
}

export default function DailyNotesPresenter({
  stats,
  summary,
  filteredRecords,
  search,
  dateFilter,
  statusFilter,
  studentId,
  studentOptions,
  openDropdown,
  behaviorAssessment,
  hasBehavior,
  massFunctionText,
  fastCategoryText,
  feedbackTarget,
  dateOptions,
  statusOptions,
  onSearchChange,
  onDateFilterChange,
  onStatusFilterChange,
  onStudentSelect,
  onToggleDropdown,
  onExportWeekly,
  onGoBack,
  onNavigateEditor,
  onNavigateBehaviorAssessment,
  onResubmitNote,
  onCloseFeedback,
  onOpenFeedback,
  onNavbarTabPress,
}: DailyNotesPresenterProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Daily Notes" onTabPress={onNavbarTabPress} />

      <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled>
        {/* Title Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onGoBack}>
            <Feather name="arrow-left" size={18} color="#475569" />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Daily Notes & Summaries</Text>
          </View>
          <TouchableOpacity style={styles.topExportBtn} onPress={onExportWeekly}>
            <Feather name="download" size={14} color="#334155" />
            <Text style={styles.topExportText}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* Stat Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Sessions Completed</Text>
            <Text style={[styles.statValue, { color: '#0284C7' }]}>{stats.sessionsCompleted}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Trials</Text>
            <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.totalTrials}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg Independence</Text>
            <Text style={[styles.statValue, { color: '#059669' }]}>{stats.avgIndependence}%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Reviews Pending</Text>
            <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.reviewsPending}</Text>
          </View>
        </View>

        {/* Filter Bar with Search and Dropdowns */}
        <View style={[styles.searchFilterCard, { zIndex: openDropdown ? 1000 : 1 }]}>
          <View style={styles.searchInputWrapper}>
            <Feather name="search" size={16} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students, station..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={onSearchChange}
            />
          </View>

          {/* Date Filter Dropdown */}
          <View style={[styles.dropdownContainer, { zIndex: openDropdown === 'date' ? 1001 : 1 }]}>
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                openDropdown === 'date' && styles.dropdownTriggerActive,
              ]}
              onPress={() => onToggleDropdown(openDropdown === 'date' ? null : 'date')}
            >
              <Text style={styles.dropdownTriggerText}>{dateFilter}</Text>
              <Feather name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>

            {openDropdown === 'date' && (
              <View style={styles.dropdownMenu}>
                {dateOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.dropdownOption,
                      dateFilter === opt && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      onDateFilterChange(opt);
                      onToggleDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        dateFilter === opt && styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Status Filter Dropdown */}
          <View
            style={[styles.dropdownContainer, { zIndex: openDropdown === 'status' ? 1001 : 1 }]}
          >
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                openDropdown === 'status' && styles.dropdownTriggerActive,
              ]}
              onPress={() => onToggleDropdown(openDropdown === 'status' ? null : 'status')}
            >
              <Text style={styles.dropdownTriggerText}>{statusFilter}</Text>
              <Feather name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>

            {openDropdown === 'status' && (
              <View style={styles.dropdownMenu}>
                {statusOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.dropdownOption,
                      statusFilter === opt && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      onStatusFilterChange(opt);
                      onToggleDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        statusFilter === opt && styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Student Selector Dropdown */}
          <View
            style={[styles.dropdownContainer, { zIndex: openDropdown === 'student' ? 1001 : 1 }]}
          >
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                openDropdown === 'student' && styles.dropdownTriggerActive,
              ]}
              onPress={() => onToggleDropdown(openDropdown === 'student' ? null : 'student')}
            >
              <Text style={styles.dropdownTriggerText}>
                {studentOptions.find((o) => o.id === studentId)?.name ?? 'Select Student'}
              </Text>
              <Feather name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>

            {openDropdown === 'student' && (
              <View style={styles.dropdownMenu}>
                {studentOptions.length === 0 ? (
                  <Text style={styles.dropdownOptionText}>No students available</Text>
                ) : (
                  studentOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.dropdownOption,
                        studentId === opt.id && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        onStudentSelect(opt.id);
                        onToggleDropdown(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          studentId === opt.id && styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {opt.name} ({opt.initial})
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        </View>

        {/* Behavior Assessment Card */}
        <View style={styles.behaviorAssessmentCard}>
          <View style={styles.behaviorAssessmentHeader}>
            <Text style={styles.behaviorAssessmentTitle}>Behavior Assessment</Text>
            {studentId && (
              <TouchableOpacity
                style={styles.behaviorAssessmentClose}
                onPress={() => onStudentSelect(undefined)}
              >
                <Feather name="x" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.behaviorAssessmentContent}>
            {!studentId ? (
              <Text style={styles.behaviorAssessmentEmpty}>
                Select a student to view their behavior assessment.
              </Text>
            ) : !hasBehavior ? (
              <Text style={styles.behaviorAssessmentEmpty}>
                No behavior assessment recorded yet.
              </Text>
            ) : (
              <>
                <View style={styles.behaviorAssessmentStatsRow}>
                  <Text style={styles.behaviorAssessmentSubtype}>
                    {Object.keys(behaviorAssessment?.massAnswers ?? {}).length} MASS answered
                  </Text>
                  <Text style={styles.behaviorAssessmentSubtype}>
                    {Object.values(behaviorAssessment?.fastAnswers ?? {}).filter(Boolean).length}{' '}
                    FAST yes
                  </Text>
                  <Text style={styles.behaviorAssessmentSubtype}>
                    {behaviorAssessment?.records?.length ?? 0} ABC incidents
                  </Text>
                  {behaviorAssessment?.status === 'submitted' ? (
                    <Text
                      style={[
                        styles.behaviorAssessmentSubtype,
                        { color: '#0284C7', fontWeight: '600' },
                      ]}
                    >
                      Submitted for review
                    </Text>
                  ) : (
                    <Text
                      style={[
                        styles.behaviorAssessmentSubtype,
                        { color: '#D97706', fontWeight: '600' },
                      ]}
                    >
                      Draft
                    </Text>
                  )}
                </View>

                {Object.keys(behaviorAssessment?.massAnswers ?? {}).length > 0 &&
                  massFunctionText && (
                    <View style={styles.behaviorAssessmentNote}>
                      <Text style={styles.behaviorAssessmentNoteLabel}>
                        MASS identified function
                      </Text>
                      <Text style={styles.behaviorAssessmentNoteText}>{massFunctionText}</Text>
                    </View>
                  )}

                {Object.keys(behaviorAssessment?.fastAnswers ?? {}).length > 0 &&
                  fastCategoryText && (
                    <View style={styles.behaviorAssessmentNote}>
                      <Text style={styles.behaviorAssessmentNoteLabel}>
                        FAST identified category
                      </Text>
                      <Text style={styles.behaviorAssessmentNoteText}>{fastCategoryText}</Text>
                    </View>
                  )}

                {(behaviorAssessment?.records?.length ?? 0) > 0 && (
                  <View style={styles.behaviorAssessmentNote}>
                    <Text style={styles.behaviorAssessmentNoteLabel}>ABC records</Text>
                    {behaviorAssessment?.records?.map((r, idx) => (
                      <Text key={r.id || idx} style={styles.behaviorAssessmentNoteText}>
                        {idx + 1}. {r.behavior} · {r.frequency}
                        {r.duration ? ` · ${r.duration}` : ''} · {r.intensity} intensity
                        {r.trigger ? ` · Trigger: ${r.trigger}` : ''}
                        {r.consequence ? ` · Consequence: ${r.consequence}` : ''}
                      </Text>
                    ))}
                  </View>
                )}

                {behaviorAssessment?.draftRecord &&
                  (behaviorAssessment.draftRecord.frequency?.trim() ||
                    behaviorAssessment.draftRecord.trigger?.trim() ||
                    behaviorAssessment.draftRecord.duration?.trim()) && (
                    <View style={styles.behaviorAssessmentNote}>
                      <Text style={styles.behaviorAssessmentNoteLabel}>
                        In-Progress Draft Incident
                      </Text>
                      <Text style={styles.behaviorAssessmentNoteText}>
                        {behaviorAssessment.draftRecord.behavior} ·{' '}
                        {behaviorAssessment.draftRecord.frequency || 'No frequency'}
                        {behaviorAssessment.draftRecord.duration
                          ? ` · ${behaviorAssessment.draftRecord.duration}`
                          : ''}
                        {behaviorAssessment.draftRecord.intensity
                          ? ` · ${behaviorAssessment.draftRecord.intensity} intensity`
                          : ''}
                        {behaviorAssessment.draftRecord.trigger
                          ? ` · Trigger: ${behaviorAssessment.draftRecord.trigger}`
                          : ''}
                      </Text>
                    </View>
                  )}

                <TouchableOpacity
                  style={styles.openBehaviorBtn}
                  onPress={() => onNavigateBehaviorAssessment(studentId ?? 'student-a')}
                >
                  <Feather name="edit-3" size={13} color="#0284C7" />
                  <Text style={styles.openBehaviorBtnText}>
                    {behaviorAssessment?.status === 'submitted'
                      ? 'View / Edit Assessment →'
                      : 'Continue Editing Draft →'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Session Records Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableCardHeader}>
            <Text style={styles.tableCardTitle}>Session Records</Text>
            <Text style={styles.resultsCount}>{filteredRecords.length} results</Text>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thText, styles.colDate]}>DATE</Text>
            <Text style={[styles.thText, styles.colStudents]}>STUDENTS</Text>
            <Text style={[styles.thText, styles.colStation]}>STATION</Text>
            <Text style={[styles.thText, styles.colStatus]}>STATUS</Text>
            <Text style={[styles.thText, styles.colActions]}>ACTIONS</Text>
          </View>

          {filteredRecords.length === 0 ? (
            <Text style={styles.noRecordsText}>No sessions match the current filters.</Text>
          ) : (
            <FlashList
              data={filteredRecords}
              keyExtractor={(r) => r.id}
              renderItem={({ item: r, index: i }) => (
                <View
                  style={[styles.tableRow, i === filteredRecords.length - 1 && styles.tableRowLast]}
                >
                  <Text style={[styles.tdText, styles.colDate]}>{r.date}</Text>

                  <View style={styles.colStudents}>
                    <View style={styles.pillsRow}>
                      {r.students.map((st) => (
                        <View key={st} style={styles.studentPill}>
                          <Text style={styles.studentPillText}>{st}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.subDetailText}>
                      {r.station} · {r.room}
                    </Text>
                  </View>

                  <Text style={[styles.tdText, styles.colStation]}>{r.station}</Text>

                  <View style={styles.colStatus}>
                    <StatusPill
                      status={
                        r.status === 'Approved'
                          ? 'approved'
                          : r.status === 'Revision Required'
                            ? 'revision'
                            : 'pending'
                      }
                      label={r.status}
                    />
                  </View>

                  <View style={[styles.colActions, styles.actionsRow]}>
                    <TouchableOpacity
                      style={styles.viewActionBtn}
                      onPress={() => onNavigateEditor(r.id, 'view')}
                    >
                      <Feather name="eye" size={13} color="#0284C7" />
                      <Text style={styles.viewActionText}>View</Text>
                    </TouchableOpacity>

                    {(r.status === 'Draft' || r.status === 'Revision Required') && (
                      <>
                        <TouchableOpacity
                          style={styles.editActionBtn}
                          onPress={() => onNavigateEditor(r.id, 'edit')}
                        >
                          <Text style={styles.editActionText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.resubmitActionBtn}
                          onPress={() => onResubmitNote(r.id)}
                        >
                          <Text style={styles.resubmitActionText}>Resubmit</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {r.status !== 'Pending' && r.coordinatorFeedback && (
                      <TouchableOpacity
                        style={styles.feedbackActionBtn}
                        onPress={() => onOpenFeedback(r)}
                      >
                        <Text style={styles.feedbackActionText}>View Feedback</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            />
          )}
        </View>

        {/* Weekly Summary Card */}
        {summary && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Weekly Summary</Text>
              <TouchableOpacity style={styles.exportSummaryBtn} onPress={onExportWeekly}>
                <Feather name="download" size={13} color="#0284C7" />
                <Text style={styles.exportSummaryText}>Export Summary</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Week of</Text>
              <Text style={styles.summaryValBold}>{summary.weekRange}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sessions this week</Text>
              <Text style={styles.summaryValBold}>{summary.sessionsThisWeek}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total trials this week</Text>
              <Text style={styles.summaryValBold}>{summary.totalTrialsThisWeek}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Avg independence this week</Text>
              <Text style={[styles.summaryValBold, { color: '#059669' }]}>
                {summary.avgIndependenceThisWeek}%
              </Text>
            </View>

            {/* Summary Status Badges */}
            {(() => {
              const approved = filteredRecords.filter((r) => r.status === 'Approved').length;
              const pending = filteredRecords.filter((r) => r.status === 'Pending').length;
              const revision = filteredRecords.filter(
                (r) => r.status === 'Revision Required',
              ).length;
              const draft = filteredRecords.filter((r) => r.status === 'Draft').length;
              return (
                <View style={styles.statusBadgesRow}>
                  {approved > 0 && (
                    <View style={styles.badgeApproved}>
                      <Feather name="check-circle" size={12} color="#166534" />
                      <Text style={styles.badgeApprovedText}>{approved} Approved</Text>
                    </View>
                  )}
                  {pending > 0 && (
                    <View style={styles.badgePending}>
                      <Feather name="clock" size={12} color="#854D0E" />
                      <Text style={styles.badgePendingText}>{pending} Pending</Text>
                    </View>
                  )}
                  {revision > 0 && (
                    <View style={styles.badgeRevision}>
                      <Feather name="alert-circle" size={12} color="#991B1B" />
                      <Text style={styles.badgeRevisionText}>{revision} Revision Required</Text>
                    </View>
                  )}
                  {draft > 0 && (
                    <View style={styles.badgeDraft}>
                      <Feather name="file-text" size={12} color="#334155" />
                      <Text style={styles.badgeDraftText}>{draft} Draft</Text>
                    </View>
                  )}
                </View>
              );
            })()}
          </View>
        )}
      </ScrollView>

      {/* View Feedback Modal */}
      <Modal
        visible={!!feedbackTarget}
        transparent
        animationType="fade"
        onRequestClose={onCloseFeedback}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onCloseFeedback}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Coordinator Feedback</Text>
              <TouchableOpacity onPress={onCloseFeedback}>
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSessionMeta}>
              <Text style={styles.modalSessionDate}>{feedbackTarget?.date}</Text>
              <Text style={styles.modalSessionSub}>
                {feedbackTarget?.station} · {feedbackTarget?.room}
              </Text>
            </View>

            <View style={styles.modalFeedbackBox}>
              <Text style={styles.modalFeedbackText}>
                {feedbackTarget?.coordinatorFeedback || 'No written feedback provided.'}
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={onCloseFeedback}>
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  topExportBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  topExportText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: 12,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchFilterCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: spacing.md,
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 2,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  dropdownContainer: {
    position: 'relative',
    minWidth: 130,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  dropdownTriggerActive: {
    borderColor: '#0284C7',
  },
  dropdownTriggerText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 9999,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownOptionSelected: {
    backgroundColor: '#E0F2FE',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#334155',
  },
  dropdownOptionTextSelected: {
    color: '#0284C7',
    fontWeight: '600',
  },
  behaviorAssessmentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  behaviorAssessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  behaviorAssessmentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  behaviorAssessmentClose: {
    padding: 4,
  },
  behaviorAssessmentContent: {
    gap: 8,
  },
  behaviorAssessmentEmpty: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  behaviorAssessmentStatsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  behaviorAssessmentSubtype: {
    fontSize: 12,
    color: '#475569',
  },
  behaviorAssessmentNote: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.sm,
    padding: 8,
    gap: 2,
  },
  behaviorAssessmentNoteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  behaviorAssessmentNoteText: {
    fontSize: 12,
    color: '#1E293B',
  },
  openBehaviorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  openBehaviorBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  resultsCount: {
    fontSize: 12,
    color: '#64748B',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.xs ?? radius.sm,
    marginBottom: 4,
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  colDate: { flex: 1.2 },
  colStudents: { flex: 2.5 },
  colStation: { flex: 1.2 },
  colStatus: { flex: 1.3 },
  colActions: { flex: 1.8 },
  noRecordsText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tdText: {
    fontSize: 12,
    color: '#334155',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 2,
  },
  studentPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  studentPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
  },
  subDetailText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  viewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs ?? radius.sm,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  viewActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  editActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs ?? radius.sm,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  editActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  resubmitActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs ?? radius.sm,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  resubmitActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  feedbackActionBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: radius.xs ?? radius.sm,
    backgroundColor: '#F1F5F9',
  },
  feedbackActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  exportSummaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exportSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryValBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  badgeApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeApprovedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  badgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgePendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  badgeRevision: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeRevisionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
  },
  badgeDraft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeDraftText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSessionMeta: {
    marginBottom: 10,
  },
  modalSessionDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  modalSessionSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  modalFeedbackBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 14,
  },
  modalFeedbackText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCloseBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.sm,
  },
  modalCloseBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
