import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import ScreenLoader from '../../components/ScreenLoader';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import StatusPill from '../../components/StatusPill';
import StudentAvatar from '../../components/StudentAvatar';
import AppNavbar from '../../components/AppNavbar';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import {
  getDailyNotes,
  getWeeklySummary,
  resubmitSessionNote,
  createSessionNote,
  deleteSessionNote,
} from '../../api/sessionApi';
import { getTeacherDashboard, getBehaviorAssessment } from '../../api/teacherExtrasApi';
import { getStudentOptions, getRoomOptions } from '../../api/optionsApi';
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
  coordinatorName?: string;
  bodyMarkdown?: string;
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

const DATE_OPTIONS = ['All Dates', 'Today', 'This Week', 'Last Week', 'This Month'];
const STATUS_OPTIONS = ['All Statuses', 'Approved', 'Pending', 'Revision Required', 'Draft'];
const DEFAULT_STATIONS = [
  'Communication Station',
  'Fine Motor Skills',
  'Social Play & Interaction',
  'Adaptive Learning',
  'Speech & Language',
];

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

  // Interactive modals and row expansion state
  const [feedbackTarget, setFeedbackTarget] = useState<NoteRecord | null>(null);
  const [viewNoteTarget, setViewNoteTarget] = useState<NoteRecord | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'date' | 'students' | 'station' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // New Note Modal state
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [newNoteDate, setNewNoteDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newNoteStudent, setNewNoteStudent] = useState('');
  const [newNoteStation, setNewNoteStation] = useState('Communication Station');
  const [newNoteRoom, setNewNoteRoom] = useState('Room 101');
  const [newNoteStatus, setNewNoteStatus] = useState<'Draft' | 'Pending'>('Pending');
  const [newNoteBody, setNewNoteBody] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Student and options state
  const routeSid = route?.params?.studentId;
  const localSid = typeof localStorage !== 'undefined' ? localStorage.getItem('last_assessment_student_id') : null;
  const initialStudentId = routeSid || localSid || undefined;

  const [studentId, setStudentId] = useState<string | undefined>(initialStudentId);
  const [behaviorAssessment, setBehaviorAssessment] = useState<BehaviorAssessmentData | null>(null);
  const [studentOptions, setStudentOptions] = useState<{ id: string; name: string; initial: string }[]>([]);
  const [roomOptions, setRoomOptions] = useState<{ id: string; name: string }[]>([]);

  // Dropdown filter states
  const [dateFilter, setDateFilter] = useState('All Dates');
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
      const [notesRes, summaryRes, dashboardRes, studentsRes, roomsRes] = await Promise.all([
        getDailyNotes({}),
        getWeeklySummary({}),
        getTeacherDashboard().catch(() => ({ data: {} })),
        getStudentOptions().catch(() => ({ data: [] })),
        getRoomOptions().catch(() => ({ data: [] })),
      ]);

      setRecords(notesRes.data.records as NoteRecord[]);
      setStats(notesRes.data.stats);
      setSummary(summaryRes.data);

      // Collect real students from /options/students or fallback to dashboard
      const rawStudents = Array.isArray(studentsRes.data) && studentsRes.data.length > 0
        ? studentsRes.data
        : (dashboardRes.data?.students ?? []);

      const mappedStudents = rawStudents.map((s: any) => {
        const fullName = s.name ?? s.fullName ?? s.id;
        return {
          id: String(s.id),
          name: fullName,
          initial: (fullName.charAt(0) || 'S').toUpperCase(),
        };
      });

      setStudentOptions(mappedStudents);

      if (Array.isArray(roomsRes.data) && roomsRes.data.length > 0) {
        setRoomOptions(roomsRes.data);
      } else {
        setRoomOptions([
          { id: 'room-1', name: 'Room 101' },
          { id: 'room-2', name: 'Room 102' },
          { id: 'room-3', name: 'Play Area B' },
          { id: 'room-4', name: 'Sensory Room' },
        ]);
      }

      setStudentId((current) => current || routeSid || localSid || mappedStudents[0]?.id);
    } catch {
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

  // Pull shared Behavior Assessment for selected student
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

  // Dynamic Date Bounds for Real Filtering
  const dateBounds = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(now.getTime() - dayOfWeek * 86400000);
    const sunday = new Date(monday.getTime() + 6 * 86400000);

    const lastMonday = new Date(monday.getTime() - 7 * 86400000);
    const lastSunday = new Date(monday.getTime() - 1 * 86400000);

    return {
      today,
      monday: monday.toISOString().split('T')[0],
      sunday: sunday.toISOString().split('T')[0],
      lastMonday: lastMonday.toISOString().split('T')[0],
      lastSunday: lastSunday.toISOString().split('T')[0],
      monthPrefix: today.substring(0, 7),
    };
  }, []);

  const selectedStudentObj = useMemo(() => {
    return studentOptions.find((o) => o.id === studentId);
  }, [studentOptions, studentId]);

  // Real Filtering Logic across search, date, status, and student
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Status filter
      if (statusFilter !== 'All Statuses' && r.status !== statusFilter) {
        return false;
      }

      // Student filter (if a specific student is selected)
      if (selectedStudentObj) {
        const targetName = selectedStudentObj.name.toLowerCase();
        const hasStudent = r.students.some((st) => {
          const lower = st.toLowerCase();
          return lower.includes(targetName) || targetName.includes(lower);
        });
        if (!hasStudent) return false;
      }

      // Date filter
      if (dateFilter === 'Today') {
        if (r.date !== dateBounds.today) return false;
      } else if (dateFilter === 'This Week') {
        if (r.date < dateBounds.monday || r.date > dateBounds.sunday) return false;
      } else if (dateFilter === 'Last Week') {
        if (r.date < dateBounds.lastMonday || r.date > dateBounds.lastSunday) return false;
      } else if (dateFilter === 'This Month') {
        if (!r.date.startsWith(dateBounds.monthPrefix)) return false;
      }

      // Search query filter
      if (search.trim() !== '') {
        const query = search.toLowerCase().trim();
        const matchesStudent = r.students.some((st) => st.toLowerCase().includes(query));
        const matchesStation = r.station.toLowerCase().includes(query);
        const matchesRoom = r.room.toLowerCase().includes(query);
        const matchesFeedback = r.coordinatorFeedback?.toLowerCase().includes(query);
        const matchesBody = r.bodyMarkdown?.toLowerCase().includes(query);
        return matchesStudent || matchesStation || matchesRoom || matchesFeedback || matchesBody;
      }

      return true;
    });
  }, [records, statusFilter, selectedStudentObj, dateFilter, dateBounds, search]);

  // Interactive Sorting
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        cmp = a.date.localeCompare(b.date);
      } else if (sortField === 'students') {
        cmp = (a.students[0] || '').localeCompare(b.students[0] || '');
      } else if (sortField === 'station') {
        cmp = a.station.localeCompare(b.station);
      } else if (sortField === 'status') {
        cmp = a.status.localeCompare(b.status);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredRecords, sortField, sortOrder]);

  const toggleSort = (field: 'date' | 'students' | 'station' | 'status') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleCreateNote = async () => {
    const studentToAssign = newNoteStudent || selectedStudentObj?.name || studentOptions[0]?.name;
    if (!studentToAssign) {
      showToast('Please select at least one student', 'error');
      return;
    }
    setSavingNote(true);
    try {
      const newId = `sn-${Date.now()}`;
      await createSessionNote(newId, {
        date: newNoteDate,
        students: [studentToAssign],
        station: newNoteStation,
        room: newNoteRoom,
        status: newNoteStatus,
        bodyMarkdown: newNoteBody.trim() || `### Session Overview\n- Session conducted for ${studentToAssign} at ${newNoteStation}.\n- Data recorded directly from Daily Notes screen.`,
      });
      showToast('Session note recorded successfully', 'success');
      setNewNoteOpen(false);
      setNewNoteBody('');
      load();
    } catch {
      showToast('Failed to record session note', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    try {
      await deleteSessionNote(id);
      showToast('Draft session note deleted', 'success');
      load();
    } catch {
      showToast('Failed to delete draft', 'error');
    }
  };

  const handleExportWeekly = () => {
    if (!summary) return;
    const teacherName = session?.userName || 'Lead Teacher';
    const lines = [
      'MELU’E FOUNDATION — WEEKLY SUMMARY',
      `Week of: ${summary.weekRange}`,
      '',
      `Sessions completed: ${summary.sessionsThisWeek}`,
      `Total trials logged: ${summary.totalTrialsThisWeek}`,
      `Average independence: ${summary.avgIndependenceThisWeek}%`,
      '',
      `Teacher: ${teacherName}`,
    ];
    downloadTextFile(
      `WeeklySummary_${summary.weekRange.replace(/[^a-z0-9]/gi, '_')}.html`,
      lines.map((l) => `<p>${l}</p>`).join('')
    );
  };

  const hasActiveFilters = Boolean(
    search.trim() ||
    dateFilter !== 'All Dates' ||
    statusFilter !== 'All Statuses' ||
    studentId !== undefined
  );

  const resetAllFilters = () => {
    setSearch('');
    setDateFilter('All Dates');
    setStatusFilter('All Statuses');
    setStudentId(undefined);
  };

  if (loading) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Daily Notes" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled>
        {/* Title Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
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

        {/* Dynamic Stat Cards */}
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
              placeholder="Search students, station, notes..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x" size={14} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Date Filter Dropdown */}
          <View style={[styles.dropdownContainer, { zIndex: openDropdown === 'date' ? 1001 : 1 }]}>
            <TouchableOpacity
              style={[styles.dropdownTrigger, openDropdown === 'date' && styles.dropdownTriggerActive]}
              onPress={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
            >
              <Text style={styles.dropdownTriggerText} numberOfLines={1}>{dateFilter}</Text>
              <Feather name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>

            {openDropdown === 'date' && (
              <View style={styles.dropdownMenu}>
                {DATE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.dropdownOption, dateFilter === opt && styles.dropdownOptionSelected]}
                    onPress={() => {
                      setDateFilter(opt);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text style={[styles.dropdownOptionText, dateFilter === opt && styles.dropdownOptionTextSelected]}>
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
              style={[styles.dropdownTrigger, openDropdown === 'status' && styles.dropdownTriggerActive]}
              onPress={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
            >
              <Text style={styles.dropdownTriggerText} numberOfLines={1}>{statusFilter}</Text>
              <Feather name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>

            {openDropdown === 'status' && (
              <View style={styles.dropdownMenu}>
                {STATUS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.dropdownOption, statusFilter === opt && styles.dropdownOptionSelected]}
                    onPress={() => {
                      setStatusFilter(opt);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text style={[styles.dropdownOptionText, statusFilter === opt && styles.dropdownOptionTextSelected]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Student Selector Dropdown with 'All Students' Clear option */}
          <View style={[styles.dropdownContainer, { zIndex: openDropdown === 'student' ? 1001 : 1 }]}>
            <TouchableOpacity
              style={[styles.dropdownTrigger, openDropdown === 'student' && styles.dropdownTriggerActive]}
              onPress={() => setOpenDropdown(openDropdown === 'student' ? null : 'student')}
            >
              <Text style={styles.dropdownTriggerText} numberOfLines={1}>
                {selectedStudentObj ? selectedStudentObj.name : 'All Students'}
              </Text>
              <Feather name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>

            {openDropdown === 'student' && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={[styles.dropdownOption, !studentId && styles.dropdownOptionSelected]}
                  onPress={() => {
                    setStudentId(undefined);
                    setOpenDropdown(null);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, !studentId && styles.dropdownOptionTextSelected]}>
                    All Students
                  </Text>
                </TouchableOpacity>
                {studentOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.dropdownOption, studentId === opt.id && styles.dropdownOptionSelected]}
                    onPress={() => {
                      setStudentId(opt.id);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text style={[styles.dropdownOptionText, studentId === opt.id && styles.dropdownOptionTextSelected]}>
                      {opt.name} ({opt.initial})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {hasActiveFilters && (
            <TouchableOpacity style={styles.resetFiltersBtn} onPress={resetAllFilters}>
              <Feather name="rotate-ccw" size={13} color="#64748B" />
              <Text style={styles.resetFiltersText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Behavior Assessment Card */}
        <View style={styles.behaviorAssessmentCard}>
          <View style={styles.behaviorAssessmentHeader}>
            <Text style={styles.behaviorAssessmentTitle}>Behavior Assessment</Text>
            {studentId && (
              <TouchableOpacity
                style={styles.behaviorAssessmentClose}
                onPress={() => setStudentId(undefined)}
                accessibilityLabel="Clear student filter"
              >
                <Feather name="x" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.behaviorAssessmentContent}>
            {!studentId ? (
              <Text style={styles.behaviorAssessmentEmpty}>
                Select a student in the filter above to inspect their behavior assessment.
              </Text>
            ) : !hasBehaviorData(behaviorAssessment) ? (
              <Text style={styles.behaviorAssessmentEmpty}>
                No behavior assessment recorded yet for {selectedStudentObj?.name ?? 'this student'}.
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
                  onPress={() => navigation?.navigate?.('BehaviorAssessment', { studentId: studentId ?? (studentOptions[0]?.id ?? 'student-1') })}
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

        {/* Interactive Session Records Card */}
        <View style={styles.tableCard}>
          <View style={styles.tableCardHeader}>
            <View>
              <Text style={styles.tableCardTitle}>Session Records</Text>
              <Text style={styles.resultsCount}>
                Showing {sortedRecords.length} of {records.length} total sessions
                {selectedStudentObj ? ` · filtered by ${selectedStudentObj.name}` : ''}
              </Text>
            </View>

            {/* Interactive Add Session Note Button */}
            <TouchableOpacity
              style={styles.addNoteBtn}
              onPress={() => {
                setNewNoteStudent(selectedStudentObj?.name || studentOptions[0]?.name || '');
                setNewNoteOpen(true);
              }}
            >
              <Feather name="plus" size={14} color="#FFFFFF" />
              <Text style={styles.addNoteBtnText}>Record Note</Text>
            </TouchableOpacity>
          </View>

          {/* Table Header with Interactive Column Sorting */}
          <View style={styles.tableHeaderRow}>
            <TouchableOpacity style={[styles.thCol, styles.colDate]} onPress={() => toggleSort('date')}>
              <Text style={styles.thText}>DATE</Text>
              {sortField === 'date' && (
                <Feather name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'} size={12} color="#0284C7" />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.thCol, styles.colStudents]} onPress={() => toggleSort('students')}>
              <Text style={styles.thText}>STUDENTS</Text>
              {sortField === 'students' && (
                <Feather name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'} size={12} color="#0284C7" />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.thCol, styles.colStation]} onPress={() => toggleSort('station')}>
              <Text style={styles.thText}>STATION</Text>
              {sortField === 'station' && (
                <Feather name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'} size={12} color="#0284C7" />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.thCol, styles.colStatus]} onPress={() => toggleSort('status')}>
              <Text style={styles.thText}>STATUS</Text>
              {sortField === 'status' && (
                <Feather name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'} size={12} color="#0284C7" />
              )}
            </TouchableOpacity>

            <View style={styles.colActions}>
              <Text style={styles.thText}>ACTIONS</Text>
            </View>
          </View>

          {sortedRecords.length === 0 ? (
            <View style={styles.noRecordsContainer}>
              <Feather name="inbox" size={32} color="#94A3B8" />
              <Text style={styles.noRecordsText}>No session records match the active filters.</Text>
              {hasActiveFilters && (
                <TouchableOpacity style={styles.clearFiltersBtn} onPress={resetAllFilters}>
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            sortedRecords.map((r, i) => {
              const isExpanded = expandedId === r.id;
              return (
                <View key={r.id} style={[styles.tableRowWrapper, i === sortedRecords.length - 1 && styles.tableRowLast]}>
                  <TouchableOpacity
                    style={styles.tableRow}
                    activeOpacity={0.7}
                    onPress={() => setExpandedId(isExpanded ? null : r.id)}
                  >
                    <View style={styles.colDate}>
                      <Text style={styles.tdText}>{r.date}</Text>
                    </View>

                    <View style={styles.colStudents}>
                      <View style={styles.pillsRow}>
                        {r.students.map((st) => (
                          <View key={st} style={styles.studentPill}>
                            <StudentAvatar name={st} size={18} />
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

                    <View style={[styles.colActions, styles.actionsRow]} onStartShouldSetResponder={() => true}>
                      <TouchableOpacity
                        style={styles.viewActionBtn}
                        onPress={() => setViewNoteTarget(r)}
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
                          <Text style={styles.feedbackActionText}>Feedback</Text>
                        </TouchableOpacity>
                      )}

                      {r.status === 'Draft' && (
                        <TouchableOpacity
                          style={styles.deleteActionBtn}
                          onPress={() => handleDeleteDraft(r.id)}
                        >
                          <Feather name="trash-2" size={12} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Interactive Inline Row Expansion Drawer */}
                  {isExpanded && (
                    <View style={styles.rowDrawer}>
                      <View style={styles.drawerHeader}>
                        <Feather name="file-text" size={14} color="#0284C7" />
                        <Text style={styles.drawerTitle}>Qualitative Session Notes</Text>
                        <TouchableOpacity
                          style={styles.openEditorLink}
                          onPress={() =>
                            navigation?.navigate?.('SessionNoteEditor', {
                              sessionId: r.id,
                              mode: r.status === 'Draft' ? 'edit' : 'view',
                            })
                          }
                        >
                          <Text style={styles.openEditorLinkText}>Open Full Editor →</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.drawerNotesBody}>
                        {r.bodyMarkdown || 'No extended notes written for this session.'}
                      </Text>
                      {r.coordinatorFeedback && (
                        <View style={styles.drawerFeedbackBox}>
                          <Text style={styles.drawerFeedbackLabel}>Coordinator Feedback:</Text>
                          <Text style={styles.drawerFeedbackText}>{r.coordinatorFeedback}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Weekly Summary Card with Interactive Badges */}
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

            {/* Interactive Summary Status Badges (Click to Filter) */}
            {(() => {
              const approved = records.filter((r) => r.status === 'Approved').length;
              const pending = records.filter((r) => r.status === 'Pending').length;
              const revision = records.filter((r) => r.status === 'Revision Required').length;
              const draft = records.filter((r) => r.status === 'Draft').length;
              return (
                <View style={styles.statusBadgesRow}>
                  {approved > 0 && (
                    <TouchableOpacity
                      style={[styles.badgeApproved, statusFilter === 'Approved' && styles.badgeActiveRing]}
                      onPress={() => setStatusFilter(statusFilter === 'Approved' ? 'All Statuses' : 'Approved')}
                    >
                      <Feather name="check-circle" size={12} color="#166534" />
                      <Text style={styles.badgeApprovedText}>{approved} Approved</Text>
                    </TouchableOpacity>
                  )}
                  {pending > 0 && (
                    <TouchableOpacity
                      style={[styles.badgePending, statusFilter === 'Pending' && styles.badgeActiveRing]}
                      onPress={() => setStatusFilter(statusFilter === 'Pending' ? 'All Statuses' : 'Pending')}
                    >
                      <Feather name="clock" size={12} color="#854D0E" />
                      <Text style={styles.badgePendingText}>{pending} Pending</Text>
                    </TouchableOpacity>
                  )}
                  {revision > 0 && (
                    <TouchableOpacity
                      style={[styles.badgeRevision, statusFilter === 'Revision Required' && styles.badgeActiveRing]}
                      onPress={() => setStatusFilter(statusFilter === 'Revision Required' ? 'All Statuses' : 'Revision Required')}
                    >
                      <Feather name="alert-circle" size={12} color="#991B1B" />
                      <Text style={styles.badgeRevisionText}>{revision} Revision Required</Text>
                    </TouchableOpacity>
                  )}
                  {draft > 0 && (
                    <TouchableOpacity
                      style={[styles.badgeDraft, statusFilter === 'Draft' && styles.badgeActiveRing]}
                      onPress={() => setStatusFilter(statusFilter === 'Draft' ? 'All Statuses' : 'Draft')}
                    >
                      <Feather name="file-text" size={12} color="#334155" />
                      <Text style={styles.badgeDraftText}>{draft} Draft</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}
          </View>
        )}
      </ScrollView>

      {/* View Coordinator Feedback Modal */}
      <Modal
        visible={!!feedbackTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setFeedbackTarget(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFeedbackTarget(null)}>
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
                  {feedbackTarget.station} ({feedbackTarget.room})
                </Text>
                <Text style={styles.modalFrom}>
                  From: {feedbackTarget.coordinatorName || (session?.role === 'coordinator' ? session.userName : 'Therapy Coordinator')}
                </Text>
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackBoxText}>
                    {feedbackTarget.coordinatorFeedback || 'No feedback provided yet for this note.'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Interactive Note Details View Modal */}
      <Modal
        visible={!!viewNoteTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setViewNoteTarget(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setViewNoteTarget(null)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.modalTitle}>Session Note Details</Text>
                {viewNoteTarget && (
                  <StatusPill
                    status={
                      viewNoteTarget.status === 'Approved'
                        ? 'approved'
                        : viewNoteTarget.status === 'Revision Required'
                        ? 'revision'
                        : 'pending'
                    }
                    label={viewNoteTarget.status}
                  />
                )}
              </View>
              <TouchableOpacity onPress={() => setViewNoteTarget(null)}>
                <Feather name="x" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {viewNoteTarget && (
              <>
                <View style={styles.modalInfoGrid}>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>Date</Text>
                    <Text style={styles.modalInfoVal}>{viewNoteTarget.date}</Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>Station</Text>
                    <Text style={styles.modalInfoVal}>{viewNoteTarget.station}</Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>Room</Text>
                    <Text style={styles.modalInfoVal}>{viewNoteTarget.room}</Text>
                  </View>
                </View>

                <View style={styles.modalStudentsSection}>
                  <Text style={styles.modalInfoLabel}>Assigned Students</Text>
                  <View style={styles.pillsRow}>
                    {viewNoteTarget.students.map((st) => (
                      <View key={st} style={styles.studentPill}>
                        <StudentAvatar name={st} size={18} />
                        <Text style={styles.studentPillText}>{st}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.modalNotesBox}>
                  <Text style={styles.modalNotesTitle}>Notes Summary</Text>
                  <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator>
                    <Text style={styles.modalNotesText}>
                      {viewNoteTarget.bodyMarkdown || 'No extended notes written for this session.'}
                    </Text>
                  </ScrollView>
                </View>

                {viewNoteTarget.coordinatorFeedback && (
                  <View style={styles.feedbackBox}>
                    <Text style={styles.modalInfoLabel}>Coordinator Feedback:</Text>
                    <Text style={styles.feedbackBoxText}>{viewNoteTarget.coordinatorFeedback}</Text>
                  </View>
                )}

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.modalSecondaryBtn}
                    onPress={() => setViewNoteTarget(null)}
                  >
                    <Text style={styles.modalSecondaryBtnText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalPrimaryBtn}
                    onPress={() => {
                      const sid = viewNoteTarget.id;
                      setViewNoteTarget(null);
                      navigation?.navigate?.('SessionNoteEditor', {
                        sessionId: sid,
                        mode: viewNoteTarget.status === 'Draft' ? 'edit' : 'view',
                      });
                    }}
                  >
                    <Feather name="external-link" size={14} color="#FFFFFF" />
                    <Text style={styles.modalPrimaryBtnText}>Open Full Editor</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Interactive New Session Note Modal */}
      <Modal
        visible={newNoteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNewNoteOpen(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setNewNoteOpen(false)}>
          <View style={[styles.modalCard, { maxWidth: 540 }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record New Session Note</Text>
              <TouchableOpacity onPress={() => setNewNoteOpen(false)}>
                <Feather name="x" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Student *</Text>
                <View style={styles.chipSelectRow}>
                  {studentOptions.map((st) => {
                    const isSelected = newNoteStudent === st.name;
                    return (
                      <TouchableOpacity
                        key={st.id}
                        style={[styles.chipSelectBtn, isSelected && styles.chipSelectBtnActive]}
                        onPress={() => setNewNoteStudent(st.name)}
                      >
                        <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>
                          {st.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Date</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newNoteDate}
                    onChangeText={setNewNoteDate}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Status</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.statusToggleBtn, newNoteStatus === 'Pending' && styles.statusToggleBtnActive]}
                      onPress={() => setNewNoteStatus('Pending')}
                    >
                      <Text style={[styles.statusToggleText, newNoteStatus === 'Pending' && styles.statusToggleTextActive]}>
                        Pending Review
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.statusToggleBtn, newNoteStatus === 'Draft' && styles.statusToggleBtnActive]}
                      onPress={() => setNewNoteStatus('Draft')}
                    >
                      <Text style={[styles.statusToggleText, newNoteStatus === 'Draft' && styles.statusToggleTextActive]}>
                        Draft
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Station</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newNoteStation}
                    onChangeText={setNewNoteStation}
                    placeholder="Station name"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Room</Text>
                  <View style={styles.chipSelectRow}>
                    {roomOptions.map((r) => {
                      const isSelected = newNoteRoom === r.name;
                      return (
                        <TouchableOpacity
                          key={r.id}
                          style={[styles.chipSelectBtn, isSelected && styles.chipSelectBtnActive]}
                          onPress={() => setNewNoteRoom(r.name)}
                        >
                          <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>
                            {r.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Qualitative Session Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={newNoteBody}
                  onChangeText={setNewNoteBody}
                  placeholder="Enter details about goals targeted, student responses, prompt levels, and transitions..."
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => setNewNoteOpen(false)}
                disabled={savingNote}
              >
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={handleCreateNote}
                disabled={savingNote}
              >
                {savingNote ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Feather name="check" size={14} color="#FFFFFF" />
                    <Text style={styles.modalPrimaryBtnText}>Save Session Note</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
    flexWrap: 'wrap',
  },
  searchInputWrapper: {
    flex: 1,
    minWidth: 180,
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
  dropdownTriggerText: { fontSize: 13, color: '#0F172A', flex: 1 },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    maxHeight: 220,
    overflow: 'scroll',
    zIndex: 9999,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 10,
        }),
  },
  dropdownOption: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFFFF' },
  dropdownOptionSelected: { backgroundColor: '#E0F2FE' },
  dropdownOptionText: { fontSize: 13, color: '#0F172A' },
  dropdownOptionTextSelected: { fontSize: 13, color: '#0284C7', fontWeight: '600' },
  resetFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  resetFiltersText: { fontSize: 12, color: '#475569', fontWeight: '500' },

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
  tableCardTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  resultsCount: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  addNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addNoteBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },

  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  thCol: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  thText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tableRowWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableRowLast: { borderBottomWidth: 0 },
  tdText: { fontSize: 13, color: '#0F172A' },

  colDate: { width: 120 },
  colStudents: { flex: 1 },
  colStation: { width: 140 },
  colStatus: { width: 140 },
  colActions: { width: 170 },

  pillsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  studentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  studentPillText: { fontSize: 12, color: '#0284C7', fontWeight: '500' },
  subDetailText: { fontSize: 11, color: '#94A3B8', marginTop: 4 },

  actionsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  viewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewActionText: { fontSize: 12, color: '#0284C7', fontWeight: '600' },
  feedbackActionBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  feedbackActionText: { fontSize: 12, color: '#DC2626', fontWeight: '600' },
  editActionBtn: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editActionText: { fontSize: 12, color: '#0284C7', fontWeight: '600' },
  resubmitActionBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resubmitActionText: { fontSize: 12, color: '#059669', fontWeight: '600' },
  deleteActionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },

  // Row Drawer for inline expansion
  rowDrawer: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    gap: 8,
  },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drawerTitle: { fontSize: 12, fontWeight: '700', color: '#334155', textTransform: 'uppercase' },
  openEditorLink: { marginLeft: 'auto' },
  openEditorLinkText: { fontSize: 12, color: '#0284C7', fontWeight: '600' },
  drawerNotesBody: { fontSize: 13, color: '#334155', lineHeight: 18 },
  drawerFeedbackBox: {
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    gap: 2,
  },
  drawerFeedbackLabel: { fontSize: 11, fontWeight: '700', color: '#991B1B' },
  drawerFeedbackText: { fontSize: 12, color: '#991B1B' },

  noRecordsContainer: { padding: 32, alignItems: 'center', gap: 8 },
  noRecordsText: { textAlign: 'center', color: '#64748B', fontSize: 13 },
  clearFiltersBtn: {
    marginTop: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearFiltersText: { fontSize: 12, color: '#0284C7', fontWeight: '600' },

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
  badgeActiveRing: { borderWidth: 2, borderColor: '#0284C7' },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
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
    gap: 14,
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

  modalInfoGrid: { flexDirection: 'row', gap: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8 },
  modalInfoItem: { flex: 1 },
  modalInfoLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: 2 },
  modalInfoVal: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  modalStudentsSection: { gap: 6 },
  modalNotesBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, gap: 6 },
  modalNotesTitle: { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase' },
  modalNotesText: { fontSize: 13, color: '#334155', lineHeight: 18 },
  modalActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  modalSecondaryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  modalSecondaryBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalPrimaryBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },

  // Forms in Modals
  formGroup: { gap: 6, marginBottom: 10 },
  formRow: { flexDirection: 'row', gap: 10 },
  formLabel: { fontSize: 12, fontWeight: '600', color: '#334155' },
  formInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  formTextArea: { minHeight: 90, textAlignVertical: 'top' },
  chipSelectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipSelectBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  chipSelectBtnActive: { borderColor: '#0284C7', backgroundColor: '#E0F2FE' },
  chipSelectText: { fontSize: 12, color: '#475569' },
  chipSelectTextActive: { color: '#0284C7', fontWeight: '600' },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  statusToggleBtnActive: { borderColor: '#0284C7', backgroundColor: '#E0F2FE' },
  statusToggleText: { fontSize: 12, color: '#475569' },
  statusToggleTextActive: { color: '#0284C7', fontWeight: '600' },

  // Behavior Assessment
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