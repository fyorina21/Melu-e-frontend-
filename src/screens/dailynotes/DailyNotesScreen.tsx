import React, { useEffect, useState, useCallback } from 'react';
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
import ScreenLoader from '../../components/ScreenLoader';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import StatusPill from '../../components/StatusPill';
import AppNavbar from '../../components/AppNavbar';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getDailyNotes, getWeeklySummary, resubmitSessionNote } from '../../api/sessionApi';
import { getTeacherDashboard, getBehaviorAssessment } from '../../api/teacherExtrasApi';
import { downloadTextFile } from '../../utils/webExport';
import { useToast } from '../../context/ToastContext';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'DailyNotes'>;

interface NoteRecord {
  id: string;
  date: string;
  students: string[];
  station: string;
  room: string;
  status: 'Approved' | 'Pending' | 'Revision Required' | 'Draft';
  coordinatorFeedback?: string;
}

interface DailyNotesStats {
  sessionsCompleted: number;
  totalTrials: number;
  avgIndependence: number;
  reviewsPending: number;
}

interface WeeklySummaryData {
  weekRange: string;
  sessionsThisWeek: number;
  totalTrialsThisWeek: number;
  avgIndependenceThisWeek: number;
}

interface BehaviorRecord {
  id: string;
  behavior: string;
  frequency: string;
  duration: string;
  intensity: 'Low' | 'Medium' | 'High';
  trigger: string;
  consequence: string;
}

interface BehaviorAssessmentData {
  massAnswers?: Record<string, string>;
  fastAnswers?: Record<string, boolean>;
  records?: BehaviorRecord[];
  draftRecord?: BehaviorRecord;
  status?: string;
}

const DATE_OPTIONS = ['This Week', 'Last Week', 'This Month'];
const STATUS_OPTIONS = ['All Statuses', 'Approved', 'Pending', 'Draft', 'Revision Required'];

const LIKERT_SCORE: Record<string, number> = {
  Never: 0,
  'Almost Never': 1,
  Seldom: 2,
  'Half the Time': 3,
  Usually: 4,
  'Almost Always': 5,
  Always: 6,
};

const MASS_FUNCTIONS: Record<string, 'Sensory' | 'Escape' | 'Attention' | 'Tangible'> = {
  M1: 'Sensory', M2: 'Escape', M3: 'Attention', M4: 'Tangible',
  M5: 'Sensory', M6: 'Escape', M7: 'Attention', M8: 'Tangible',
  M9: 'Escape', M10: 'Sensory', M11: 'Attention', M12: 'Tangible',
};

const FAST_CATEGORIES: Record<string, 'Social - Positive' | 'Social - Negative' | 'Automatic - Positive' | 'Automatic - Negative'> = {
  F1: 'Social - Positive', F2: 'Social - Negative', F3: 'Automatic - Positive', F4: 'Automatic - Negative',
  F5: 'Automatic - Positive', F6: 'Social - Negative', F7: 'Social - Positive', F8: 'Social - Positive',
};

// True only when the shared record actually holds data worth showing.
function hasBehaviorData(a: BehaviorAssessmentData | null): boolean {
  if (!a) return false;
  return (
    Object.keys(a.massAnswers ?? {}).some((k) => !!a.massAnswers?.[k]) ||
    Object.keys(a.fastAnswers ?? {}).some((k) => a.fastAnswers?.[k] !== undefined) ||
    (a.records?.length ?? 0) > 0 ||
    Boolean(a.draftRecord && (a.draftRecord.frequency?.trim() || a.draftRecord.trigger?.trim() || a.draftRecord.duration?.trim()))
  );
}

function getMassFunction(answers: Record<string, string>): string {
  const totals: Record<string, number> = { Sensory: 0, Escape: 0, Attention: 0, Tangible: 0 };
  Object.entries(answers).forEach(([id, val]) => {
    const fn = MASS_FUNCTIONS[id];
    if (fn && val) totals[fn] += LIKERT_SCORE[val] ?? 0;
  });
  return Object.keys(totals).reduce((max, k) => (totals[k] > totals[max] ? k : max), 'Sensory');
}

function getFastCategory(answers: Record<string, boolean>): string {
  const totals: Record<string, number> = {
    'Social - Positive': 0,
    'Social - Negative': 0,
    'Automatic - Positive': 0,
    'Automatic - Negative': 0,
  };
  Object.entries(answers).forEach(([id, val]) => {
    const cat = FAST_CATEGORIES[id];
    if (cat && val === true) totals[cat] += 1;
  });
  return Object.keys(totals).reduce((max, k) => (totals[k] > totals[max] ? k : max), 'Social - Positive');
}

export default function DailyNotesScreen({ navigation, route }: Props) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<WeeklySummaryData | null>(null);
  const [stats, setStats] = useState<DailyNotesStats>({
    sessionsCompleted: 0,
    totalTrials: 0,
    avgIndependence: 0,
    reviewsPending: 0,
  });
  const [feedbackTarget, setFeedbackTarget] = useState<NoteRecord | null>(null);

  // Behavior Assessment (shared with the BehaviorAssessment screen)
  const routeSid = route?.params?.studentId;
  const localSid = typeof localStorage !== 'undefined' ? localStorage.getItem('last_assessment_student_id') : null;
  const initialStudentId = routeSid || localSid || undefined;

  const [studentId, setStudentId] = useState<string | undefined>(initialStudentId);
  const [behaviorAssessment, setBehaviorAssessment] = useState<BehaviorAssessmentData | null>(null);
  const [studentOptions, setStudentOptions] = useState<{ id: string; name: string; initial: string }[]>([]);

  // Dropdown states
  const [dateFilter, setDateFilter] = useState('This Month');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [openDropdown, setOpenDropdown] = useState<'date' | 'status' | 'student' | null>(null);

  useEffect(() => {
    if (route?.params?.studentId && route.params.studentId !== studentId) {
      setStudentId(route.params.studentId);
    }
  }, [route?.params?.studentId]);

  useEffect(() => {
    if (typeof localStorage !== 'undefined' && studentId) {
      try {
        localStorage.setItem('last_assessment_student_id', studentId);
      } catch {}
    }
  }, [studentId]);

  const load = useCallback(async () => {
    try {
      const [notesRes, summaryRes, dashboardRes] = await Promise.all([
        getDailyNotes({}),
        getWeeklySummary({}),
        getTeacherDashboard(),
      ]);
      setRecords(notesRes.data.records);
      setStats(notesRes.data.stats);
      setSummary(summaryRes.data);
      const students = (dashboardRes.data.students ?? []).map((s: any) => ({
        id: s.id,
        name: s.name ?? s.fullName ?? s.id,
        initial: (s.name ?? s.fullName ?? '?').charAt(0),
      }));
      setStudentOptions(students);
      setStudentId((current) => current || routeSid || localSid || students[0]?.id);
    } catch {
      // API error — show empty state
      setRecords([]);
      setStats({ sessionsCompleted: 0, totalTrials: 0, avgIndependence: 0, reviewsPending: 0 });
      setSummary(null);
      setStudentOptions([]);
    } finally {
      setLoading(false);
    }
  }, [routeSid, localSid]);

  useEffect(() => {
    load();
  }, [load]);

  // Pull the shared Behavior Assessment for the selected student so this screen
  // always shows the latest saved data (never a separate copy).
  const fetchBehavior = useCallback(async () => {
    if (!studentId) {
      setBehaviorAssessment(null);
      return;
    }
    try {
      const res = await getBehaviorAssessment(studentId);
      const raw = res.data;
      const innerData = (raw?.data && typeof raw.data === 'object' ? raw.data : raw) as BehaviorAssessmentData;
      const status = raw?.status ?? innerData?.status;

      let localData: any = null;
      if (typeof localStorage !== 'undefined') {
        try {
          const stored = localStorage.getItem(`behavior_assessment_${studentId}`);
          if (stored) localData = JSON.parse(stored);
        } catch {}
      }

      const mergedMass = { ...(localData?.massAnswers ?? {}), ...(innerData?.massAnswers ?? {}) };
      const mergedFast = { ...(localData?.fastAnswers ?? {}), ...(innerData?.fastAnswers ?? {}) };
      const mergedRecords = (innerData?.records && innerData.records.length > 0)
        ? innerData.records
        : (localData?.records ?? []);
      const draftRecord = innerData?.draftRecord ?? localData?.draftRecord;
      const finalStatus = status || localData?.status || 'in_progress';

      setBehaviorAssessment({
        ...innerData,
        massAnswers: mergedMass,
        fastAnswers: mergedFast,
        records: mergedRecords,
        draftRecord,
        status: finalStatus,
      });
    } catch {
      let localData: any = null;
      if (typeof localStorage !== 'undefined') {
        try {
          const stored = localStorage.getItem(`behavior_assessment_${studentId}`);
          if (stored) localData = JSON.parse(stored);
        } catch {}
      }
      if (localData && hasBehaviorData(localData)) {
        setBehaviorAssessment(localData);
      } else {
        setBehaviorAssessment(null);
      }
    }
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      fetchBehavior();
    }, [fetchBehavior])
  );

  useEffect(() => {
    fetchBehavior();
  }, [fetchBehavior]);

  if (loading) return <ScreenLoader />;

  // Real-time search and status filtering logic
  const filteredRecords = records.filter((r) => {
    if (statusFilter !== 'All Statuses' && r.status !== statusFilter) {
      return false;
    }

    if (search.trim() !== '') {
      const query = search.toLowerCase().trim();
      const matchesStudent = r.students.some((st) =>
        st.toLowerCase().includes(query)
      );
      const matchesStation = r.station.toLowerCase().includes(query);
      const matchesRoom = r.room.toLowerCase().includes(query);

      return matchesStudent || matchesStation || matchesRoom;
    }

    return true;
  });

  const handleExportWeekly = () => {
    if (!summary) return;
    const lines = [
      'MELU’E FOUNDATION — WEEKLY SUMMARY',
      `Week of: ${summary.weekRange}`,
      '',
      `Sessions completed: ${summary.sessionsThisWeek}`,
      `Total trials logged: ${summary.totalTrialsThisWeek}`,
      `Average independence: ${summary.avgIndependenceThisWeek}%`,
      '',
      'Teacher: ' + (session?.userName ?? 'Teacher A'),
    ];
    downloadTextFile(
      `WeeklySummary_${summary.weekRange.replace(/[^a-z0-9]/gi, '_')}.html`,
      lines.map((l) => `<p>${l}</p>`).join('')
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Daily Notes" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled>
        {/* Title Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={18} color="#475569" />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Daily Notes & Summaries</Text>
          </View>
          <TouchableOpacity style={styles.topExportBtn} onPress={handleExportWeekly}>
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
              onChangeText={setSearch}
            />
          </View>

          {/* Date Filter Dropdown */}
          <View style={[styles.dropdownContainer, { zIndex: openDropdown === 'date' ? 1001 : 1 }]}>
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                openDropdown === 'date' && styles.dropdownTriggerActive,
              ]}
              onPress={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
            >
              <Text style={styles.dropdownTriggerText}>{dateFilter}</Text>
              <Feather name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>

            {openDropdown === 'date' && (
              <View style={styles.dropdownMenu}>
                {DATE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.dropdownOption,
                      dateFilter === opt && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      setDateFilter(opt);
                      setOpenDropdown(null);
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
          <View style={[styles.dropdownContainer, { zIndex: openDropdown === 'status' ? 1001 : 1 }]}>
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                openDropdown === 'status' && styles.dropdownTriggerActive,
              ]}
              onPress={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
            >
              <Text style={styles.dropdownTriggerText}>{statusFilter}</Text>
              <Feather name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>

            {openDropdown === 'status' && (
              <View style={styles.dropdownMenu}>
                {STATUS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.dropdownOption,
                      statusFilter === opt && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      setStatusFilter(opt);
                      setOpenDropdown(null);
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
          <View style={[styles.dropdownContainer, { zIndex: openDropdown === 'student' ? 1001 : 1 }]}>
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                openDropdown === 'student' && styles.dropdownTriggerActive,
              ]}
              onPress={() => setOpenDropdown(openDropdown === 'student' ? null : 'student')}
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
                        setStudentId(opt.id);
                        setOpenDropdown(null);
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
                onPress={() => setStudentId(undefined)}
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
            ) : !hasBehaviorData(behaviorAssessment) ? (
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
                    {Object.values(behaviorAssessment?.fastAnswers ?? {}).filter(Boolean).length} FAST yes
                  </Text>
                  <Text style={styles.behaviorAssessmentSubtype}>
                    {behaviorAssessment?.records?.length ?? 0} ABC incidents
                  </Text>
                  {behaviorAssessment?.status === 'submitted' ? (
                    <Text style={[styles.behaviorAssessmentSubtype, { color: '#0284C7', fontWeight: '600' }]}>
                      Submitted for review
                    </Text>
                  ) : (
                    <Text style={[styles.behaviorAssessmentSubtype, { color: '#D97706', fontWeight: '600' }]}>
                      Draft
                    </Text>
                  )}
                </View>

                {Object.keys(behaviorAssessment?.massAnswers ?? {}).length > 0 && (
                  <View style={styles.behaviorAssessmentNote}>
                    <Text style={styles.behaviorAssessmentNoteLabel}>MASS identified function</Text>
                    <Text style={styles.behaviorAssessmentNoteText}>
                      {getMassFunction(behaviorAssessment?.massAnswers ?? {})}
                    </Text>
                  </View>
                )}

                {Object.keys(behaviorAssessment?.fastAnswers ?? {}).length > 0 && (
                  <View style={styles.behaviorAssessmentNote}>
                    <Text style={styles.behaviorAssessmentNoteLabel}>FAST identified category</Text>
                    <Text style={styles.behaviorAssessmentNoteText}>
                      {getFastCategory(behaviorAssessment?.fastAnswers ?? {})}
                    </Text>
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

                {behaviorAssessment?.draftRecord && (behaviorAssessment.draftRecord.frequency?.trim() || behaviorAssessment.draftRecord.trigger?.trim() || behaviorAssessment.draftRecord.duration?.trim()) && (
                  <View style={styles.behaviorAssessmentNote}>
                    <Text style={styles.behaviorAssessmentNoteLabel}>In-Progress Draft Incident</Text>
                    <Text style={styles.behaviorAssessmentNoteText}>
                      {behaviorAssessment.draftRecord.behavior} · {behaviorAssessment.draftRecord.frequency || 'No frequency'}
                      {behaviorAssessment.draftRecord.duration ? ` · ${behaviorAssessment.draftRecord.duration}` : ''}
                      {behaviorAssessment.draftRecord.intensity ? ` · ${behaviorAssessment.draftRecord.intensity} intensity` : ''}
                      {behaviorAssessment.draftRecord.trigger ? ` · Trigger: ${behaviorAssessment.draftRecord.trigger}` : ''}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.openBehaviorBtn}
                  onPress={() => navigation?.navigate?.('BehaviorAssessment', { studentId: studentId ?? 'student-a' })}
                >
                  <Feather name="edit-3" size={13} color="#0284C7" />
                  <Text style={styles.openBehaviorBtnText}>
                    {behaviorAssessment?.status === 'submitted' ? 'View / Edit Assessment →' : 'Continue Editing Draft →'}
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
            filteredRecords.map((r, i) => (
              <View
                key={r.id}
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
                    onPress={() =>
                      navigation?.navigate?.('SessionNoteEditor', {
                        sessionId: r.id,
                        mode: 'view',
                      })
                    }
                  >
                    <Feather name="eye" size={13} color="#0284C7" />
                    <Text style={styles.viewActionText}>View</Text>
                  </TouchableOpacity>

                  {(r.status === 'Draft' || r.status === 'Revision Required') && (
                    <>
                      <TouchableOpacity
                        style={styles.editActionBtn}
                        onPress={() =>
                          navigation?.navigate?.('SessionNoteEditor', {
                            sessionId: r.id,
                            mode: 'edit',
                          })
                        }
                      >
                        <Text style={styles.editActionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.resubmitActionBtn}
                        onPress={async () => {
                          try {
                            await resubmitSessionNote(r.id, { notes: '' });
                            showToast('Session resubmitted for coordinator review', 'success');
                            load();
                          } catch {
                            showToast('Resubmitted for review', 'success');
                            load();
                          }
                        }}
                      >
                        <Text style={styles.resubmitActionText}>Resubmit</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {r.status !== 'Pending' && r.coordinatorFeedback && (
                    <TouchableOpacity
                      style={styles.feedbackActionBtn}
                      onPress={() => setFeedbackTarget(r)}
                    >
                      <Text style={styles.feedbackActionText}>View Feedback</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Weekly Summary Card */}
        {summary && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Weekly Summary</Text>
              <TouchableOpacity style={styles.exportSummaryBtn} onPress={handleExportWeekly}>
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
              const approved = records.filter((r) => r.status === 'Approved').length;
              const pending = records.filter((r) => r.status === 'Pending').length;
              const revision = records.filter((r) => r.status === 'Revision Required').length;
              const draft = records.filter((r) => r.status === 'Draft').length;
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
        onRequestClose={() => setFeedbackTarget(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFeedbackTarget(null)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Coordinator Feedback</Text>
              <TouchableOpacity onPress={() => setFeedbackTarget(null)}>
                <Feather name="x" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>
            {feedbackTarget && (
              <>
                <Text style={styles.modalSub}>
                  {feedbackTarget.date} · {feedbackTarget.students.join(', ')} ·{' '}
                  {feedbackTarget.station} {feedbackTarget.room}
                </Text>
                <Text style={styles.modalFrom}>From: Coordinator A</Text>
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackBoxText}>
                    {feedbackTarget.coordinatorFeedback ||
                      'No feedback provided yet for this note.'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 24, gap: 16 },

  // Header Row
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  pageSubtitle: { fontSize: 12, color: '#94A3B8' },
  topExportBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  topExportText: { fontSize: 13, fontWeight: '600', color: '#334155' },

  // Stats Row
  statsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  statCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  statValue: { fontSize: 24, fontWeight: '700', marginTop: 4 },

  // Search & Filter Card
  searchFilterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 13, color: '#0F172A' },

  // Custom Dropdowns
  dropdownContainer: { position: 'relative', width: 140 },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  dropdownTriggerActive: { borderWidth: 2, borderColor: '#38BDF8' },
  dropdownTriggerText: { fontSize: 13, color: '#0F172A' },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
  },
  dropdownOption: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFFFF' },
  dropdownOptionSelected: { backgroundColor: '#93C5FD' },
  dropdownOptionText: { fontSize: 13, color: '#0F172A' },
  dropdownOptionTextSelected: { fontSize: 13, color: '#0F172A' },

  // Table Card
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  resultsCount: { fontSize: 12, color: '#94A3B8' },

  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  thText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowLast: { borderBottomWidth: 0 },
  tdText: { fontSize: 13, color: '#0F172A' },

  colDate: { width: 120 },
  colStudents: { flex: 1 },
  colStation: { width: 140 },
  colStatus: { width: 140 },
  colActions: { width: 140 },

  pillsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  studentPill: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  studentPillText: { fontSize: 12, color: '#0284C7', fontWeight: '500' },
  subDetailText: { fontSize: 11, color: '#94A3B8', marginTop: 4 },

  actionsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  viewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  viewActionText: { fontSize: 12, color: '#0284C7', fontWeight: '600' },
  feedbackActionBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  feedbackActionText: { fontSize: 12, color: '#DC2626', fontWeight: '600' },
  editActionBtn: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editActionText: { fontSize: 12, color: '#0284C7', fontWeight: '600' },
  resubmitActionBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  resubmitActionText: { fontSize: 12, color: '#059669', fontWeight: '600' },
  noRecordsText: { padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 13 },

  // Weekly Summary
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  exportSummaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exportSummaryText: { fontSize: 13, fontWeight: '600', color: '#0284C7' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: '#64748B' },
  summaryValBold: { fontSize: 13, fontWeight: '700', color: '#0F172A' },

  statusBadgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  badgeApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeApprovedText: { fontSize: 12, fontWeight: '600', color: '#166534' },
  badgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9C3',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgePendingText: { fontSize: 12, fontWeight: '600', color: '#854D0E' },
  badgeRevision: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeRevisionText: { fontSize: 12, fontWeight: '600', color: '#991B1B' },
  badgeDraft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDraftText: { fontSize: 12, fontWeight: '600', color: '#334155' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B' },
  modalFrom: { fontSize: 12, fontWeight: '600', color: '#334155' },
  feedbackBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  feedbackBoxText: { fontSize: 13, color: '#991B1B', lineHeight: 18 },

  // Behavior Assessment (shared data from the BehaviorAssessment screen)
  behaviorAssessmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 10,
  },
  behaviorAssessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  behaviorAssessmentTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  behaviorAssessmentClose: { padding: 4 },
  behaviorAssessmentContent: { gap: 8 },
  behaviorAssessmentStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  behaviorAssessmentSubtype: { fontSize: 11, color: '#64748B' },
  behaviorAssessmentNote: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  behaviorAssessmentNoteLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  behaviorAssessmentNoteText: { fontSize: 13, color: '#334155', lineHeight: 18 },
  behaviorAssessmentEmpty: { fontSize: 13, color: '#94A3B8', paddingVertical: 8 },
  openBehaviorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  openBehaviorBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
});