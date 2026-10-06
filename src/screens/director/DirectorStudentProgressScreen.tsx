// screens/director/DirectorStudentProgressScreen.tsx
// SCR-DIR-006: Student Progress Monitoring (Director View)

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import StatusPill, { type StatusType } from '../../components/StatusPill';
import { getDirectorStudentProgress, type DirectorStudentData } from '../../api/directorApi';
import { getStudentOptions } from '../../api/optionsApi';
import client from '../../api/sessionApi';
import { type StudentOption } from '../../api/optionsApi';
import type { DirectorStackParamList } from '../../types';

/** Maps the assessment status strings returned by the API to StatusPill keys. */
const ASSESSMENT_STATUS_KEY: Record<string, StatusType> = {
  Completed: 'completed',
  'In Progress': 'inProgress',
  'Not Started': 'notStarted',
};

/** Maps a session-history review status to a StatusPill key. */
const SESSION_STATUS_KEY: Record<string, StatusType> = {
  Approved: 'approved',
  Pending: 'pending',
  'Revision Required': 'revision',
};

function assessmentStatusType(status: string): StatusType {
  return ASSESSMENT_STATUS_KEY[status] ?? 'notStarted';
}

function sessionStatusType(status?: string): StatusType {
  return (status && SESSION_STATUS_KEY[status]) || 'pending';
}

export default function DirectorStudentProgressScreen({
  navigation,
}: NativeStackScreenProps<DirectorStackParamList, 'DirectorStudentProgress'>) {
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [data, setData] = useState<DirectorStudentData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [exportContent, setExportContent] = useState<string | null>(null);

  // Dropdown Picker State
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');

  // Load the student list first; progress data waits until one is selected.
  useEffect(() => {
    let cancelled = false;
    getStudentOptions()
      .then(({ data: opts }) => {
        if (cancelled) return;
        const list = Array.isArray(opts) ? opts : [];
        setStudentOptions(list);
        if (list.length > 0) setSelectedStudentId(list[0].id);
        else setLoadError(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    if (!selectedStudentId) return;
    try {
      const { data: res } = await getDirectorStudentProgress(selectedStudentId);
      setData(res);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    load();
  }, [load]);

  // Retry either refetches the student list (if that part failed) or the
  // currently selected student's progress payload.
  const retry = useCallback(async () => {
    setLoadError(false);
    if (selectedStudentId) {
      await load();
      return;
    }
    try {
      const { data: opts } = await getStudentOptions();
      const list = Array.isArray(opts) ? opts : [];
      setStudentOptions(list);
      if (list.length > 0) {
        setSelectedStudentId(list[0].id);
        return;
      }
    } catch {}
    setLoadError(true);
  }, [selectedStudentId, load]);

  const selectedStudentObj = useMemo(
    () => studentOptions.find((s) => s.id === selectedStudentId) ?? null,
    [studentOptions, selectedStudentId]
  );

  const filteredStudents = useMemo(() => {
    if (!searchStudent.trim()) return studentOptions;
    return studentOptions.filter((s) =>
      s.name.toLowerCase().includes(searchStudent.toLowerCase())
    );
  }, [studentOptions, searchStudent]);

  const handleSaveNotes = async () => {
    if (!selectedStudentId || !notes.trim()) return;
    try {
      await client.post(`/students/${selectedStudentId}/internal_notes`, {
        content: notes.trim(),
        recorded_at: new Date().toISOString(),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to save internal note';
      Alert.alert('Error', msg);
    }
  };

  const handlePrint = () => {
    if (!data) return;
    setExportContent(
      [
        '================================================================',
        `MELU'E FOUNDATION — STUDENT PROGRESS REPORT (DIRECTOR OVERSIGHT)`,
        '================================================================',
        `STUDENT: ${data.name}`,
        `AGE: ${data.age}  |  PROGRAM: ${data.program}`,
        `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        '----------------------------------------------------------------',
        '',
        'CLINICAL ASSESSMENT SUMMARY:',
        `• Skills Assessment: ${data.assessmentSummary.skills}`,
        `• Behavior Assessment: ${data.assessmentSummary.behavior}`,
        `• Preferences & Reinforcers: ${data.assessmentSummary.preferences}`,
        '',
        '----------------------------------------------------------------',
        'CURRENT GOALS & MASTERY:',
        ...data.goals.filter((g, index, self) => index === self.findIndex((t) => t.name === g.name)).map((g, i) => `  ${i + 1}. ${g.name} — ${g.percent}% Independent`),
        '',
        '----------------------------------------------------------------',
        'SESSION HISTORY LOG:',
        ...data.sessionHistory.map((s) => `  • ${s.date} — Therapist: ${s.teacherName}${s.status ? ` (${s.status})` : ''}`),
        '',
        '----------------------------------------------------------------',
        'BEHAVIOR INCIDENT TRENDS:',
        `  ${data.incidentSummary}`,
        '',
        '----------------------------------------------------------------',
        'DIRECTOR INTERNAL NOTES:',
        notes ? `  ${notes}` : '  (None entered)',
        '================================================================',
      ].join('\n')
    );
  };

  if (loadError) return <ScreenError onRetry={retry} />;
  if (!data) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Student Progress" onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t])} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.headerTitleWrap}>
            <View style={styles.badgeIcon}>
              <Feather name="activity" size={20} color={colors.navyText} />
            </View>
            <View>
              <Text style={styles.pageTitle}>Student Progress Monitoring</Text>
              <Text style={styles.pageSubtitle}>Clinical oversight of goals, sessions, assessments & behavior trends</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
            <Feather name="printer" size={14} color={colors.navyText} />
            <Text style={styles.printBtnText}>Print Report</Text>
          </TouchableOpacity>
        </View>

        {/* Student Selector Dropdown */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>SELECT STUDENT</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setDropdownOpen((prev) => !prev)}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(data.name || 'S').charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.selectedStudentName}>{data.name}</Text>
                <Text style={styles.selectedStudentMeta}>Age {data.age} · {data.program}</Text>
              </View>
            </View>
            <Feather name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.bodyText} />
          </TouchableOpacity>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <View style={styles.dropdownMenu}>
              <View style={styles.searchBar}>
                <Feather name="search" size={14} color={colors.mutedText} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search students..."
                  placeholderTextColor={colors.mutedText}
                  value={searchStudent}
                  onChangeText={setSearchStudent}
                />
              </View>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {filteredStudents.map((s) => {
                  const isSelected = s.id === selectedStudentId;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                      onPress={() => {
                        setSelectedStudentId(s.id);
                        setDropdownOpen(false);
                        setSearchStudent('');
                      }}
                    >
                                            <View style={{ flex: 1 }}>
                        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                          {s.name}
                        </Text>
                        <Text style={styles.dropdownItemSub}>
                          {s.assessmentStatus ?? s.status} · {s.program || 'ABA Therapy'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          s.status === 'Active' ? styles.statusActive : styles.statusPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            s.status === 'Active' ? styles.statusActiveText : styles.statusPendingText,
                          ]}
                        >
                          {s.status}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Assessment Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Clinical Assessment Summary</Text>
          <View style={styles.assessmentGrid}>
            <View style={styles.assessmentItem}>
              <Text style={styles.assessmentLabel}>Skills Assessment</Text>
              <StatusPill status={assessmentStatusType(data.assessmentSummary.skills)} />
            </View>
            <View style={styles.assessmentItem}>
              <Text style={styles.assessmentLabel}>Behavior Assessment</Text>
              <StatusPill status={assessmentStatusType(data.assessmentSummary.behavior)} />
            </View>
            <View style={styles.assessmentItem}>
              <Text style={styles.assessmentLabel}>Preferences Assessment</Text>
              <StatusPill status={assessmentStatusType(data.assessmentSummary.preferences)} />
            </View>
          </View>
        </View>

        {/* Current Goals */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Current Active Goals</Text>
            <Text style={styles.countBadge}>{Array.from(new Set(data.goals.map(g => g.name))).length} Goals Assigned</Text>
          </View>
          {data.goals.length === 0 && (
            <Text style={styles.emptyText}>No active goals assigned to this student yet.</Text>
          )}
          {data.goals
            .filter((g, index, self) => index === self.findIndex((t) => t.name === g.name))
            .map((g) => (
            <View key={g.id} style={styles.goalRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.goalName}>{g.name}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, g.percent)}%` }]} />
                </View>
              </View>
              <View style={styles.goalRight}>
                <Text style={styles.goalPercent}>{g.percent}%</Text>
                <Text style={styles.goalStatusText}>{g.percent >= 80 ? 'Mastery Ready' : 'In Progress'}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Goal Progress Trend Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Goal Progress Trend (Weekly)</Text>
          <View style={styles.chartWrap}>
            {data.goals[0]?.trend?.length ? (
              data.goals[0].trend.map((v, i) => (
                <View key={i} style={styles.chartCol}>
                  <View style={styles.barWrap}>
                    <View style={[styles.bar, { height: `${Math.max(10, v)}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>Wk {i + 1}</Text>
                  <Text style={styles.barValue}>{v}%</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No weekly trend data recorded yet.</Text>
            )}
          </View>
        </View>

        {/* Session History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Session History</Text>
          {data.sessionHistory.length === 0 && (
            <Text style={styles.emptyText}>No sessions recorded for this student yet.</Text>
          )}
          {data.sessionHistory.map((s, i) => (
            <View key={s.id || i} style={styles.sessionRow}>
              <View style={styles.sessionIconWrap}>
                <Feather name="calendar" size={14} color={colors.navyText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionDate}>{s.date}</Text>
                <Text style={styles.sessionTherapist}>Therapist: {s.teacherName}</Text>
              </View>
              <View style={styles.sessionRight}>
                <StatusPill status={sessionStatusType(s.status)} />
              </View>
            </View>
          ))}
        </View>

        {/* Behavior Incident Trends */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Behavior Incident Trends</Text>
          <View style={styles.incidentBox}>
            <Feather name="alert-circle" size={16} color="#F59E0B" />
            <Text style={styles.incidentText}>{data.incidentSummary}</Text>
          </View>
        </View>

        {/* Director Internal Notes */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Director Notes & Instructions</Text>
            {notesSaved && (
              <Text style={styles.savedNoteText}>
                <Feather name="check" size={12} color={colors.successGreen} /> Saved
              </Text>
            )}
          </View>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Add timestamped clinical supervisory notes..."
            placeholderTextColor={colors.mutedText}
            value={notes}
            onChangeText={setNotes}
          />
          <TouchableOpacity style={styles.saveNoteBtn} onPress={handleSaveNotes}>
            <Feather name="save" size={14} color={colors.navyText} />
            <Text style={styles.saveNoteBtnText}>Save Notes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ExportPreviewModal
        visible={!!exportContent}
        title="Student Progress Report"
        filename={`${data.name.replace(/\s+/g, '_')}_ProgressReport.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 50 },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 260 },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 20, fontWeight: '700', color: colors.navyText },
  pageSubtitle: { fontSize: 12, color: colors.mutedText, marginTop: 2 },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  printBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  emptyText: { fontSize: 13, color: colors.mutedText, fontStyle: 'italic' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.bodyText, letterSpacing: 0.8 },
  countBadge: { fontSize: 12, color: colors.bodyText, fontWeight: '600' },

  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
  },
  dropdownLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  selectedStudentName: { fontSize: 15, fontWeight: '700', color: colors.navyText },
  selectedStudentMeta: { fontSize: 12, color: colors.bodyText, marginTop: 2 },

  dropdownMenu: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    overflow: 'hidden',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgApp,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 13, color: colors.navyText },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  dropdownItemActive: { backgroundColor: '#FEF9C3' },
  dropdownItemText: { fontSize: 13, color: colors.navyText, fontWeight: '500' },
  dropdownItemTextActive: { fontWeight: '700' },

  assessmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  assessmentItem: {
    flexGrow: 1,
    minWidth: 200,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  assessmentLabel: { fontSize: 11, fontWeight: '600', color: colors.mutedText },

  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  goalName: { fontSize: 14, fontWeight: '600', color: colors.navyText },
  progressTrack: { height: 6, backgroundColor: '#E5E7EB', borderRadius: radius.pill, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primaryYellowDark, borderRadius: radius.pill },
  goalRight: { alignItems: 'flex-end', minWidth: 80 },
  goalPercent: { fontSize: 14, fontWeight: '700', color: colors.navyText },
  goalStatusText: { fontSize: 10, fontWeight: '600', color: colors.bodyText },

  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 160, paddingTop: spacing.md },
  chartCol: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', gap: 4 },
  barWrap: { width: 16, height: 110, justifyContent: 'flex-end', backgroundColor: colors.bgApp, borderRadius: 4 },
  bar: { width: '100%', backgroundColor: colors.primaryYellow, borderRadius: 4 },
  barLabel: { fontSize: 10, color: colors.bodyText },
  barValue: { fontSize: 10, fontWeight: '700', color: colors.navyText },

  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  sessionIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgApp, alignItems: 'center', justifyContent: 'center' },
  sessionDate: { fontSize: 13, fontWeight: '600', color: colors.navyText },
  sessionTherapist: { fontSize: 11, color: colors.bodyText },
  sessionRight: { alignSelf: 'center' },

  incidentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF3C7',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  incidentText: { fontSize: 13, color: '#92400E', flex: 1 },

  textArea: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
    textAlignVertical: 'top',
    color: colors.navyText,
    fontSize: 13,
  },
  saveNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  saveNoteBtnText: { fontSize: 13, fontWeight: '700', color: colors.navyText },
  savedNoteText: { fontSize: 11, color: colors.successGreen, fontWeight: '600' },
  dropdownItemSub: { fontSize: 11, color: colors.mutedText, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  statusBadgeText: { fontSize: 10, fontWeight: "700" },
  statusActive: { backgroundColor: "#DCFCE7" },
  statusActiveText: { fontSize: 10, fontWeight: "700", color: "#166534" },
  statusPending: { backgroundColor: "#FEF3C7" },
  statusPendingText: { fontSize: 10, fontWeight: "700", color: "#B45309" },
});
