import React, { useCallback, useEffect, useState } from 'react';
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
import {
  Search,
  Flag,
  Printer,
  ChevronDown,
  X,
  Eye,
  AlertTriangle,
  CheckCircle,
  Target,
  Activity,
  FileText,
  Save,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CoordinatorStackParamList } from '../../types';
import AppNavbar from '../../components/AppNavbar';
import { getEnrollmentStudents, getStudentProgressOverview, flagStudent } from '../../api/coordinatorApi';
import { colors, radius, spacing } from '../../theme/colors';

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'CoordinatorStudentProgress'>;

const SKY = '#38BDF8';
const AMBER = '#FCD34D';
const DARK_TEXT = '#1F2937';

interface StudentListItem {
  id: string;
  fullName: string;
  age: number;
  programType: string;
  therapyGroup: string;
  status?: string;
}

interface GoalRow {
  id: string;
  name: string;
  percent: number;
  status: string;
  domain?: string;
  trend: number[];
}

interface SessionHistoryRow {
  id: string;
  date: string;
  stationName?: string;
  bodyPreview: string;
  status?: string;
  independencePercent: number;
}

interface ProgressOverview {
  name: string;
  age: number;
  program: string;
  assessmentSummary: { skills: string; behavior: string; preferences: string };
  goals: GoalRow[];
  sessionHistory: SessionHistoryRow[];
  incidentSummary: string;
  incidents: { date: string; type: string; detail: string }[];
}

const STATUS_PERCENT: Record<string, number> = {
  Completed: 100,
  'In Progress': 50,
  'Not Started': 0,
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    Active: { bg: '#E0F2FE', text: '#075985' },
    Mastered: { bg: '#DCFCE7', text: '#166534' },
    'On Hold': { bg: '#F3F4F6', text: '#4B5563' },
    'In Progress': { bg: '#FEF9C3', text: '#854D0E' },
    'Not Started': { bg: '#F3F4F6', text: '#6B7280' },
    Completed: { bg: '#DCFCE7', text: '#166534' },
  };
  const c = map[status] ?? { bg: '#F3F4F6', text: '#4B5563' };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{status}</Text>
    </View>
  );
}

function MiniProgressBar({ value, color = SKY }: { value: number; color?: string }) {
  return (
    <View style={styles.miniBarRow}>
      <View style={styles.miniBarTrack}>
        <View style={[styles.miniBarFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.miniBarText}>{value}%</Text>
    </View>
  );
}

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
    (s.fullName ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFlagConfirm = async () => {
    if (selectedStudentId && flagReason.trim()) {
      try {
        await flagStudent(selectedStudentId, { reason: flagReason });
      } catch (err) {}
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

  const chartGoals = (overview?.goals ?? []).slice(0, 2);
  const maxChartValue = Math.max(1, ...chartGoals.flatMap((g) => g.trend ?? []));

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Progress" onTabPress={handleTabPress} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Student Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>SELECT STUDENT</Text>
          <View style={styles.searchRow}>
            <Search size={16} color="#9CA3AF" />
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
            <TouchableOpacity onPress={() => setShowDropdown((d) => !d)} hitSlop={{ top: 8, bottom: 8 }}>
              <ChevronDown size={16} color="#9CA3AF" />
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
                      style={[styles.dropdownItem, selectedStudentId === s.id && styles.dropdownItemActive]}
                      onPress={() => {
                        setSelectedStudentId(s.id);
                        setSearchQuery('');
                        setShowDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemName, selectedStudentId === s.id && { color: '#0369A1' }]}>
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
              <Search size={24} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>Select a student to view progress</Text>
            <Text style={styles.emptySubtitle}>Choose from the dropdown above to load full progress data.</Text>
          </View>
        )}

        {selectedStudent && (
          <>
            {/* Student Profile Card */}
            <View style={styles.card}>
              <View style={styles.profileRow}>
                <View style={styles.profileLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{selectedStudent.fullName.charAt(0)}</Text>
                  </View>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={styles.studentName}>{selectedStudent.fullName}</Text>
                    <View style={styles.chipRow}>
                      <View style={styles.grayChip}>
                        <Text style={styles.grayChipText}>Age {selectedStudent.age}</Text>
                      </View>
                      <View style={styles.skyChip}>
                        <Text style={styles.skyChipText}>{selectedStudent.programType}</Text>
                      </View>
                      <View style={styles.amberChip}>
                        <Text style={styles.amberChipText}>{selectedStudent.therapyGroup} group</Text>
                      </View>
                      <View style={styles.grayChip}>
                        <Text style={styles.grayChipText}>{selectedStudent.status}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.profileActions}>
                <TouchableOpacity
                  style={[styles.actionButton, flagged ? styles.flaggedButton : styles.outlineButton]}
                  onPress={() => (flagged ? setFlagged(false) : setShowFlagModal(true))}
                  activeOpacity={0.8}
                >
                  <Flag size={16} color={flagged ? '#DC2626' : '#4B5563'} fill={flagged ? '#DC2626' : 'none'} />
                  <Text style={[styles.actionButtonText, { color: flagged ? '#DC2626' : '#4B5563' }]}>
                    {flagged ? 'Flagged' : 'Flag Student'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.outlineButton]} activeOpacity={0.8}>
                  <Printer size={16} color="#4B5563" />
                  <Text style={[styles.actionButtonText, { color: '#4B5563' }]}>Print Report</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Assessment Summary */}
            <Text style={styles.sectionHeading}>ASSESSMENT SUMMARY</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              {overview
                ? [
                    { label: 'Skills Assessment', status: overview.assessmentSummary.skills },
                    { label: 'Behavior Assessment', status: overview.assessmentSummary.behavior },
                    { label: 'Preferences Assessment', status: overview.assessmentSummary.preferences },
                  ].map((item) => {
                    const progress = STATUS_PERCENT[item.status] ?? 0;
                    const color = progress === 100 ? '#22C55E' : progress > 0 ? SKY : '#9CA3AF';
                    return (
                <View key={item.label} style={[styles.card, { flexGrow: 1, minWidth: 250 }]}>
                  <View style={styles.assessmentHeader}>
                    <Text style={styles.assessmentLabel}>{item.label}</Text>
                    <StatusBadge status={item.status} />
                  </View>
                  <View style={styles.barTrackTall}>
                    <View style={[styles.barFillTall, { width: `${progress}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={styles.assessmentPct}>{progress}% complete</Text>
                </View>
                    );
                  })
                : (
                  <Text style={styles.emptyDropdownText}>Loading assessment data...</Text>
                )}
            </View>

            {/* Current Goals */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Target size={16} color={SKY} />
                <Text style={styles.cardTitle}>Current Goals</Text>
              </View>
              {(overview?.goals ?? []).slice(0, 6).map((goal, i, arr) => (
                <View key={goal.id} style={[styles.tableRow, i < arr.length - 1 && styles.tableRowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalCellName}>{goal.name}</Text>
                  </View>
                  <View style={styles.goalRightCol}>
                    <StatusBadge status={goal.status} />
                    <MiniProgressBar
                      value={goal.percent}
                      color={goal.status === 'Mastered' ? '#22C55E' : SKY}
                    />
                  </View>
                </View>
              ))}
              {overview && (overview?.goals.length ?? 0) === 0 && (
                <Text style={styles.emptyDropdownText}>No goals assigned yet.</Text>
              )}
            </View>

            {/* Session History */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Activity size={16} color={SKY} />
                <Text style={styles.cardTitle}>Session History</Text>
              </View>
              {(overview?.sessionHistory ?? []).map((session, i, arr) => (
                <View key={session.id} style={[styles.tableRow, i < arr.length - 1 && styles.tableRowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalCellName}>{session.date}</Text>
                    <Text style={styles.goalCellDomain}>
                      {session.stationName ?? 'Session'}
                      {session.status ? ` · ${session.status}` : ''}
                    </Text>
                  </View>
                  <View style={styles.sessionRightCol}>
                    <MiniProgressBar value={session.independencePercent ?? 0} />
                    <View style={styles.incidentInline}>
                      <CheckCircle size={14} color="#16A34A" />
                      <Text style={[styles.incidentCountText, { color: '#16A34A' }]}>✓</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => setSelectedSession(session)}
                      activeOpacity={0.8}
                    >
                      <Eye size={14} color={SKY} />
                      <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {overview && (overview?.sessionHistory.length ?? 0) === 0 && (
                <Text style={styles.emptyDropdownText}>No session history yet.</Text>
              )}
            </View>

            {/* Goal Progress Chart */}
            <View style={styles.card}>
              <View style={styles.chartHeaderRow}>
                <Activity size={16} color={SKY} />
                <Text style={styles.cardTitle}>Goal Progress Trend</Text>
              </View>
              {chartGoals.length > 0 ? (
                <>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: SKY }]} />
                  <Text style={styles.legendText}>{chartGoals[0]?.name ?? 'Goal 1'}</Text>
                </View>
                {chartGoals[1] && (
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: AMBER }]} />
                    <Text style={styles.legendText}>{chartGoals[1].name}</Text>
                  </View>
                )}
              </View>
              <View style={styles.chartArea}>
                {(chartGoals[0]?.trend ?? []).map((v1, wi) => {
                  const v2 = chartGoals[1]?.trend?.[wi];
                  return (
                    <View key={wi} style={styles.chartCol}>
                      <View style={styles.barsRow}>
                        <View style={[styles.chartBar, { height: `${(v1 / maxChartValue) * 100}%`, backgroundColor: SKY }]}>
                          <Text style={styles.chartBarValue}>{v1}%</Text>
                        </View>
                        {v2 !== undefined && (
                          <View style={[styles.chartBar, { height: `${(v2 / maxChartValue) * 100}%`, backgroundColor: AMBER }]}>
                            <Text style={styles.chartBarValueDark}>{v2}%</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.chartWeekLabel}>Wk {wi + 1}</Text>
                    </View>
                  );
                })}
              </View>
                </>
              ) : (
                <Text style={styles.emptyDropdownText}>No goal trend data yet.</Text>
              )}
            </View>

            {/* Behavior Incident Trends */}
            <View style={styles.card}>
              <View style={styles.chartHeaderRow}>
                <AlertTriangle size={16} color={AMBER} />
                <Text style={styles.cardTitle}>Behavior Incidents</Text>
              </View>
              {(overview?.incidents ?? []).map((incident, i) => (
                <View key={`${incident.date}-${i}`} style={[styles.incidentTrendRow, { alignItems: 'flex-start' }]}>
                  <Text style={styles.incidentWeekLabel}>{incident.date}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: DARK_TEXT }}>{incident.type}</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{incident.detail}</Text>
                  </View>
                </View>
              ))}
              {!overview && (
                <Text style={styles.emptyDropdownText}>Loading incident data...</Text>
              )}
              {overview && (overview.incidents.length ?? 0) === 0 && (
                <Text style={styles.emptyDropdownText}>{overview.incidentSummary || 'No incidents recorded.'}</Text>
              )}
            </View>

            {/* Internal Notes */}
            <View style={styles.card}>
              <View style={styles.notesHeaderRow}>
                <FileText size={16} color={SKY} />
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
                    <CheckCircle size={14} color="#16A34A" />
                    <Text style={styles.savedText}>Notes saved</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveNotes} activeOpacity={0.8}>
                  <Save size={16} color={DARK_TEXT} />
                  <Text style={styles.saveButtonText}>Save Notes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Session Modal */}
      <Modal visible={selectedSession !== null} animationType="fade" transparent onRequestClose={() => setSelectedSession(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Session Notes</Text>
                {selectedSession && (
                  <Text style={styles.modalSubtitle}>
                    {selectedSession.date}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setSelectedSession(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {selectedSession && (
              <>
                <View style={styles.modalBody}>
                  <Text style={styles.modalSubtitle}>
                    {selectedSession.stationName}
                    {selectedSession.status ? ` · ${selectedSession.status}` : ''}
                  </Text>
                  <View style={styles.sessionStatsGrid}>
                    <View style={[styles.sessionStatTile, { backgroundColor: '#F0F9FF' }]}>
                      <Text style={styles.statTileLabel}>Independence</Text>
                      <Text style={[styles.statTileValue, { color: '#0284C7' }]}>{selectedSession.independencePercent ?? 0}%</Text>
                    </View>
                  </View>
                  <Text style={styles.notesSectionLabel}>SESSION NOTES</Text>
                  <Text style={styles.sessionNotesText}>{selectedSession.bodyPreview}</Text>
                </View>
                <View style={styles.modalFooterSingle}>
                  <TouchableOpacity
                    style={styles.closeDarkButton}
                    onPress={() => setSelectedSession(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.closeDarkButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Flag Modal */}
      <Modal visible={showFlagModal} animationType="fade" transparent onRequestClose={() => setShowFlagModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.flagHeaderLeft}>
                <Flag size={16} color="#EF4444" />
                <Text style={styles.modalTitle}>Flag Student</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFlagModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.flagDescription}>
                This will create a priority alert for{' '}
                <Text style={{ fontWeight: '700' }}>{selectedStudent?.fullName}</Text>. All supervisors will be notified.
              </Text>
              <Text style={styles.notesSectionLabel}>
                REASON FOR FLAG <Text style={{ color: '#F87171' }}>*</Text>
              </Text>
              <TextInput
                value={flagReason}
                onChangeText={setFlagReason}
                placeholder="Describe the concern requiring immediate attention..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                style={[styles.notesInput, styles.flagInput]}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.cancelOutlineButton}
                onPress={() => setShowFlagModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelOutlineText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmFlagButton, !flagReason.trim() && { opacity: 0.4 }]}
                onPress={handleFlagConfirm}
                disabled={!flagReason.trim()}
                activeOpacity={0.8}
              >
                <Flag size={16} color={colors.white} />
                <Text style={styles.confirmFlagText}>Confirm Flag</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '700', color: DARK_TEXT },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 1 },
  sectionHeading: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 1, marginBottom: -spacing.xs },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm + 2, fontSize: 14, color: DARK_TEXT },
  selectedChip: { backgroundColor: '#E0F2FE', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 999 },
  selectedChipText: { fontSize: 12, fontWeight: '600', color: '#075985' },
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  dropdownItemActive: { backgroundColor: '#F0F9FF' },
  dropdownItemName: { fontSize: 14, color: DARK_TEXT },
  dropdownItemStation: { fontSize: 12, color: '#9CA3AF' },
  emptyDropdownText: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 13, color: '#9CA3AF' },

  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: spacing.xs },

  profileRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  profileLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, minWidth: 260 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: SKY, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 22, fontWeight: '700' },
  studentName: { fontSize: 18, fontWeight: '600', color: DARK_TEXT },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  grayChip: { backgroundColor: '#F3F4F6', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999, alignSelf: 'flex-start' },
  grayChipText: { fontSize: 12, color: '#4B5563' },
  skyChip: { backgroundColor: '#E0F2FE', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999 },
  skyChipText: { fontSize: 12, color: '#0369A1' },
  amberChip: { backgroundColor: '#FEF9C3', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999 },
  amberChipText: { fontSize: 12, color: '#A16207' },
  profileActions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  outlineButton: { borderColor: colors.border, backgroundColor: colors.bgCard },
  flaggedButton: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  actionButtonText: { fontSize: 13, fontWeight: '600' },

  assessmentHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  assessmentLabel: { fontSize: 14, fontWeight: '500', color: '#374151', flexShrink: 1 },
  barTrackTall: { height: 8, borderRadius: 999, backgroundColor: '#F3F4F6', overflow: 'hidden' },
  barFillTall: { height: '100%', borderRadius: 999 },
  assessmentPct: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },

  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '500' },

  miniBarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  miniBarTrack: { width: 80, height: 6, borderRadius: 999, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 999 },
  miniBarText: { fontSize: 12, color: '#4B5563', fontVariant: ['tabular-nums'] },

  tableRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  goalCellName: { fontSize: 14, fontWeight: '600', color: DARK_TEXT },
  goalCellDomain: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  goalRightCol: { alignItems: 'flex-end', gap: spacing.xs },
  lastSessionText: { fontSize: 11, color: '#9CA3AF' },

  sessionRightCol: { alignItems: 'flex-end', gap: spacing.xs },
  incidentInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  incidentCountText: { fontSize: 13, fontWeight: '600' },
  viewButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewButtonText: { fontSize: 12, fontWeight: '600', color: SKY },

  chartHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#4B5563' },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 220,
    paddingTop: spacing.sm,
  },
  chartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: spacing.xs },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, flex: 1 },
  chartBar: { width: 12, borderRadius: 3, justifyContent: 'flex-start', alignItems: 'center', minHeight: 18 },
  chartBarValue: { fontSize: 8, fontWeight: '700', color: colors.white, marginTop: 2 },
  chartBarValueDark: { fontSize: 8, fontWeight: '700', color: DARK_TEXT, marginTop: 2 },
  chartWeekLabel: { fontSize: 10, color: '#6B7280' },

  incidentTrendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  incidentWeekLabel: { fontSize: 13, color: '#6B7280', width: 60 },
  incidentBarTrack: { flex: 1, height: 24, borderRadius: radius.md, backgroundColor: '#F3F4F6', overflow: 'hidden' },
  incidentBarFill: { height: '100%', borderRadius: radius.md },
  incidentCount: { fontSize: 13, fontWeight: '700', width: 16, textAlign: 'right' },
  incidentWord: { fontSize: 11, color: '#9CA3AF', width: 58 },

  notesHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 90,
    fontSize: 14,
    color: '#374151',
    backgroundColor: colors.bgCard,
  },
  notesFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 36 },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  savedText: { fontSize: 12, color: '#16A34A' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: AMBER,
    marginLeft: 'auto',
  },
  saveButtonText: { fontSize: 13, fontWeight: '700', color: DARK_TEXT },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl ?? spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  flagHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  modalTitle: { fontSize: 16, fontWeight: '700', color: DARK_TEXT },
  modalSubtitle: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  modalBody: { paddingHorizontal: spacing.xl ?? spacing.lg, paddingVertical: spacing.lg, gap: spacing.md },
  modalFooterSingle: { paddingHorizontal: spacing.xl ?? spacing.lg, paddingBottom: spacing.lg },
  modalFooterRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl ?? spacing.lg,
    paddingBottom: spacing.lg,
  },

  sessionStatsGrid: { flexDirection: 'row', gap: spacing.md },
  sessionStatTile: { flex: 1, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', backgroundColor: '#F9FAFB' },
  statTileLabel: { fontSize: 11, color: '#9CA3AF' },
  statTileValue: { fontSize: 17, fontWeight: '700', color: DARK_TEXT, fontVariant: ['tabular-nums'], marginTop: 2 },
  notesSectionLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 1 },
  sessionNotesText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  closeDarkButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: DARK_TEXT,
    alignItems: 'center',
  },
  closeDarkButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },

  flagDescription: { fontSize: 13, color: '#4B5563', lineHeight: 19 },
  flagInput: { minHeight: 70 },
  cancelOutlineButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOutlineText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  confirmFlagButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  confirmFlagText: { color: colors.white, fontSize: 13, fontWeight: '700' },
});
