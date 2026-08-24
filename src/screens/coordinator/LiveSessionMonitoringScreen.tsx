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
  Alert,
} from 'react-native';
import {
  Download,
  RefreshCw,
  Bell,
  Eye,
  AlertTriangle,
  Clock,
  Users,
  CheckCircle,
  Activity,
  X,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CoordinatorStackParamList } from '../../types';
import AppNavbar from '../../components/AppNavbar';
import { getActiveSessions, sendAlertToTeacher, exportSessionLog } from '../../api/coordinatorApi';
import { downloadTextFile } from '../../utils/webExport';
import { colors, radius, spacing } from '../../theme/colors';

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'LiveSessionMonitoring'>;

type SessionStatus = 'on-track' | 'needs-attention' | 'overdue';

interface ActiveSessionRow {
  id: string;
  teacherName: string;
  stationName: string;
  roomName?: string;
  status: string;
  timer: string;
  trialCount: number;
  studentNames: string[];
  incidents: unknown[];
}

const STATUS_FROM_API: Record<string, SessionStatus> = {
  'On Track': 'on-track',
  'Needs Attention': 'needs-attention',
  Overdue: 'overdue',
};

function mapActiveSession(row: ActiveSessionRow): Session {
  const [m, s] = String(row.timer ?? '0:00').split(':').map(Number);
  return {
    id: row.id,
    teacher: row.teacherName,
    station: row.stationName,
    room: row.roomName ?? '—',
    students: row.studentNames ?? [],
    timer: (m || 0) * 60 + (s || 0),
    trials: row.trialCount ?? 0,
    status: STATUS_FROM_API[row.status] ?? 'on-track',
    incidents: Array.isArray(row.incidents) ? row.incidents.length : 0,
  };
}

interface Session {
  id: string;
  teacher: string;
  station: string;
  room: string;
  students: string[];
  timer: number;
  trials: number;
  status: SessionStatus;
  incidents: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const STATUS_CONFIG: Record<
  SessionStatus,
  { border: string; dot: string; label: string; text: string }
> = {
  'on-track': { border: '#4ADE80', dot: '#4ADE80', label: 'On Track', text: '#4ADE80' },
  'needs-attention': { border: '#FCD34D', dot: '#FCD34D', label: 'Needs Attention', text: '#FCD34D' },
  overdue: { border: '#F87171', dot: '#F87171', label: 'Overdue', text: '#F87171' },
};

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'On Track', value: 'on-track' },
  { label: 'Needs Attention', value: 'needs-attention' },
  { label: 'Overdue', value: 'overdue' },
];

const STATION_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Stations', value: 'all' },
  { label: 'Station 1', value: 'Station 1' },
  { label: 'Station 2', value: 'Station 2' },
];

const ALERT_TYPES = ['Urgent', 'FYI', 'Check-in'];

const MOCK_GOALS = ['Identify Colors', 'Request Items', 'Follow 2-Step Instructions', 'Match Objects'];
const MOCK_TRIAL_BREAKDOWN: Record<string, number> = { FP: 5, PP: 4, G: 3, '+': 6 };
const TRIAL_COLORS: Record<string, string> = {
  FP: '#60A5FA',
  PP: '#C084FC',
  G: '#FCD34D',
  '+': '#4ADE80',
};
const STUDENT_ID_MAP: Record<string, string> = {
  'Student A': 's1',
  'Student B': 's2',
  'Student C': 's3',
  'Student D': 's4',
};

export default function LiveSessionMonitoringScreen({ navigation }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [alertSession, setAlertSession] = useState<Session | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('FYI');
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  const loadSessions = useCallback(async () => {
    try {
      const { data } = await getActiveSessions({});
      setSessions((Array.isArray(data) ? data : []).map(mapActiveSession));
    } catch (err) {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessions((prev) => prev.map((s) => ({ ...s, timer: s.timer + 1 })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) return 30;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = useCallback(() => {
    setRefreshCountdown(30);
    loadSessions();
  }, [loadSessions]);

  const handleExport = useCallback(async () => {
    try {
      const { data } = await exportSessionLog({});
      const csv = (data as { csv?: string })?.csv ?? '';
      downloadTextFile('session_log.csv', csv);
    } catch (err) {
      Alert.alert('Export failed', 'Could not export the session log.');
    }
  }, []);

  const filtered = sessions.filter((s) => {
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchStation = stationFilter === 'all' || s.station === stationFilter;
    return matchStatus && matchStation;
  });

  const counts = {
    total: sessions.length,
    onTrack: sessions.filter((s) => s.status === 'on-track').length,
    needsAttention: sessions.filter((s) => s.status === 'needs-attention').length,
    overdue: sessions.filter((s) => s.status === 'overdue').length,
  };

  const closeAlertModal = () => {
    setAlertSession(null);
    setAlertMessage('');
    setAlertType('FYI');
  };

  const handleSendAlert = async () => {
    if (!alertMessage.trim() || !alertSession) {
      Alert.alert('Error', 'Please enter an alert message');
      return;
    }
    try {
      await sendAlertToTeacher(alertSession.id, { type: alertType, message: alertMessage });
      Alert.alert('Sent', `Alert sent to ${alertSession.teacher}`);
    } catch (err) {
      Alert.alert('Failed', 'Could not deliver the alert.');
    }
    closeAlertModal();
  };

  const openStudent = (studentName: string) => {
    setSelectedSession(null);
    navigation?.navigate?.('StudentProfile', { studentId: STUDENT_ID_MAP[studentName] ?? 's1' });
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

  const summaryTiles = [
    { label: 'Active Sessions', value: counts.total, icon: Activity, color: SKY },
    { label: 'On Track', value: counts.onTrack, icon: CheckCircle, color: '#4ADE80' },
    { label: 'Needs Attention', value: counts.needsAttention, icon: AlertTriangle, color: '#FCD34D' },
    { label: 'Overdue', value: counts.overdue, icon: Clock, color: '#F87171' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Live Sessions" onTabPress={handleTabPress} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filter Row */}
        <View style={styles.filterRow}>
          <View style={[styles.pillWrap, { flex: 1, minWidth: 150 }]}>
            <Text style={styles.pillLabel}>{STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}</Text>
            <View style={styles.optionRow}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setStatusFilter(opt.value)}
                  style={[styles.optionChip, statusFilter === opt.value && styles.optionChipActive]}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      statusFilter === opt.value && { color: SKY, fontWeight: '700' as const },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={[styles.pillWrap, { flex: 1, minWidth: 140 }]}>
            <Text style={styles.pillLabel}>{STATION_OPTIONS.find((o) => o.value === stationFilter)?.label}</Text>
            <View style={styles.optionRow}>
              {STATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setStationFilter(opt.value)}
                  style={[styles.optionChip, stationFilter === opt.value && styles.optionChipActive]}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      stationFilter === opt.value && { color: SKY, fontWeight: '700' as const },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.skyButton} onPress={handleManualRefresh} activeOpacity={0.8}>
            <RefreshCw size={16} color={SKY} />
            <Text style={styles.skyButtonText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skyButton} onPress={handleExport} activeOpacity={0.8}>
            <Download size={16} color={SKY} />
            <Text style={styles.skyButtonText}>Export Session Log</Text>
          </TouchableOpacity>
          <View style={styles.autoRefreshBadge}>
            <View style={styles.autoRefreshDot} />
            <Text style={styles.autoRefreshText}>Auto-refresh: {refreshCountdown}s</Text>
          </View>
        </View>

        {/* Summary Stat Row */}
        <View style={styles.statsGrid}>
          {summaryTiles.map((tile) => (
            <View key={tile.label} style={[styles.statTile, { borderColor: `${tile.color}33` }]}>
              <View style={[styles.statIconWrap, { backgroundColor: `${tile.color}1A` }]}>
                <tile.icon size={20} color={tile.color} />
              </View>
              <View>
                <Text style={[styles.statValue, { color: tile.color }]}>{tile.value}</Text>
                <Text style={styles.statLabel}>{tile.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Session Cards Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {filtered.map((session) => {
            const sc = STATUS_CONFIG[session.status];
            return (
              <View key={session.id} style={[styles.sessionCard, { borderColor: sc.border }]}>
                <View style={styles.sessionHeaderRow}>
                  <View style={styles.sessionHeaderLeft}>
                    <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
                    <View style={{ flexShrink: 1 }}>
                      <Text style={styles.teacherName} numberOfLines={1}>
                        {session.teacher}
                      </Text>
                      <Text style={styles.stationRoom}>
                        {session.station} · {session.room}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { borderColor: sc.border }]}>
                    <Text style={[styles.statusBadgeText, { color: sc.text }]}>{sc.label}</Text>
                  </View>
                </View>

                <View style={styles.chipRow}>
                  {session.students.map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={styles.studentChip}
                      onPress={() => openStudent(st)}
                      activeOpacity={0.7}
                    >
                      <Users size={12} color={SKY} />
                      <Text style={styles.studentChipText}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.metricsRow}>
                  <View style={[styles.metricBox, { flex: 1 }]}>
                    <Clock size={14} color="#9CA3AF" />
                    <Text style={styles.timerText}>{formatTime(session.timer)}</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Trials</Text>
                    <Text style={styles.trialsValue}>{session.trials}</Text>
                  </View>
                  {session.incidents > 0 && (
                    <View style={styles.incidentChip}>
                      <AlertTriangle size={12} color="#FB923C" />
                      <Text style={styles.incidentChipText}>{session.incidents}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.detailButton}
                    onPress={() => setSelectedSession(session)}
                    activeOpacity={0.8}
                  >
                    <Eye size={14} color={SKY} />
                    <Text style={styles.detailButtonText}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.alertButton}
                    onPress={() => setAlertSession(session)}
                    activeOpacity={0.8}
                  >
                    <Bell size={14} color="#FCD34D" />
                    <Text style={styles.alertButtonText}>Send Alert</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No sessions match the selected filters.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Session Detail Modal */}
      <Modal visible={selectedSession !== null} animationType="slide" transparent onRequestClose={() => setSelectedSession(null)}>
        <View style={styles.overlay}>
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Session Details</Text>
                {selectedSession && (
                  <Text style={styles.modalSubtitle}>
                    {selectedSession.teacher} · {selectedSession.station} · {selectedSession.room}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setSelectedSession(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {selectedSession && (
              <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.statusInlineRow}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_CONFIG[selectedSession.status].dot }]} />
                  <Text style={[styles.statusText, { color: STATUS_CONFIG[selectedSession.status].text }]}>
                    {STATUS_CONFIG[selectedSession.status].label}
                  </Text>
                </View>

                <Text style={styles.sectionLabel}>STUDENTS</Text>
                <View style={styles.chipRow}>
                  {selectedSession.students.map((st) => (
                    <View key={st} style={styles.studentChip}>
                      <Text style={styles.studentChipText}>{st}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>GOALS BEING WORKED ON</Text>
                {MOCK_GOALS.slice(0, 2).map((g) => (
                  <View key={g} style={styles.goalRow}>
                    <CheckCircle size={14} color="#4ADE80" />
                    <Text style={styles.goalText}>{g}</Text>
                  </View>
                ))}

                <View style={styles.metricsGrid3}>
                  <View style={styles.metricTile}>
                    <Text style={styles.metricTileValue}>{formatTime(selectedSession.timer)}</Text>
                    <Text style={styles.metricTileLabel}>Duration</Text>
                  </View>
                  <View style={styles.metricTile}>
                    <Text style={[styles.metricTileValue, { color: SKY }]}>{selectedSession.trials}</Text>
                    <Text style={styles.metricTileLabel}>Trials</Text>
                  </View>
                  <View style={styles.metricTile}>
                    <Text
                      style={[
                        styles.metricTileValue,
                        { color: selectedSession.incidents > 0 ? '#FB923C' : '#4ADE80' },
                      ]}
                    >
                      {selectedSession.incidents}
                    </Text>
                    <Text style={styles.metricTileLabel}>Incidents</Text>
                  </View>
                </View>

                <Text style={styles.sectionLabel}>TRIAL BREAKDOWN</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {Object.entries(MOCK_TRIAL_BREAKDOWN).map(([key, val]) => (
                    <View key={key} style={styles.breakdownTile}>
                      <Text style={styles.breakdownValue}>{val}</Text>
                      <Text style={[styles.breakdownKey, { color: TRIAL_COLORS[key] ?? '#4ADE80' }]}>{key}</Text>
                    </View>
                  ))}
                </View>

                {selectedSession.incidents > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>INCIDENT LOG</Text>
                    {Array.from({ length: selectedSession.incidents }).map((_, i) => (
                      <View key={i} style={styles.incidentLogRow}>
                        <AlertTriangle size={14} color="#FDBA74" />
                        <Text style={styles.incidentLogText}>
                          Incident {i + 1}: Behavior during activity transition — managed with redirection.
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
            )}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedSession(null)} activeOpacity={0.8}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Send Alert Modal */}
      <Modal visible={alertSession !== null} animationType="slide" transparent onRequestClose={closeAlertModal}>
        <View style={styles.overlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Send Alert</Text>
                {alertSession && <Text style={styles.modalSubtitle}>To: {alertSession.teacher}</Text>}
              </View>
              <TouchableOpacity onPress={closeAlertModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <View style={styles.alertFormBody}>
              <Text style={styles.sectionLabel}>ALERT TYPE</Text>
              <View style={styles.optionRow}>
                {ALERT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setAlertType(t)}
                    style={[styles.optionChip, alertType === t && styles.optionChipActive]}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        alertType === t && { color: '#FCD34D', fontWeight: '700' as const },
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.sectionLabel}>MESSAGE</Text>
              <TextInput
                value={alertMessage}
                onChangeText={setAlertMessage}
                multiline
                numberOfLines={4}
                placeholder="Type your message to the teacher..."
                placeholderTextColor="#4B5563"
                style={styles.messageInput}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.modalFooterRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeAlertModal} activeOpacity={0.8}>
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendAlert} activeOpacity={0.8}>
                <Text style={styles.sendBtnText}>Send Alert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const SKY = '#38BDF8';
const DARK = '#FFFFFF';
const DARK_TEXT = '#1F2937';
const PANEL = '#F3F4F6';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgCard },
  content: { padding: spacing.lg, gap: spacing.lg },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  pillWrap: { gap: spacing.xs },
  pillLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '600' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  optionChipActive: { borderColor: SKY, backgroundColor: `${SKY}1A` },
  optionChipText: { fontSize: 12, color: '#4B5563' },

  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md },
  skyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${SKY}4D`,
    backgroundColor: `${SKY}1A`,
  },
  skyButtonText: { color: SKY, fontSize: 13, fontWeight: '600' },
  autoRefreshBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${SKY}4D`,
    backgroundColor: `${SKY}1A`,
  },
  autoRefreshDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: SKY },
  autoRefreshText: { color: SKY, fontSize: 11, fontWeight: '600' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statTile: {
    flexGrow: 1,
    minWidth: '46%',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: `${PANEL}`,
  },
  statIconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  sessionCard: {
    flexGrow: 1,
    minWidth: 300,
    flexBasis: '31%',
    borderWidth: 2,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: DARK,
  },
  sessionHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  sessionHeaderLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, flexShrink: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  teacherName: { color: DARK_TEXT, fontSize: 14, fontWeight: '600' },
  stationRoom: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  studentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: `${SKY}1A`,
    borderWidth: 1,
    borderColor: `${SKY}40`,
  },
  studentChipText: { color: SKY, fontSize: 12, fontWeight: '500' },

  metricsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  metricBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PANEL,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  metricLabel: { color: '#9CA3AF', fontSize: 12 },
  timerText: { color: DARK_TEXT, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  trialsValue: { color: SKY, fontSize: 13, fontWeight: '700' },
  incidentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: 'rgba(249,115,22,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.25)',
  },
  incidentChipText: { color: '#FB923C', fontSize: 12, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: spacing.sm },
  detailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${SKY}40`,
    backgroundColor: `${SKY}1A`,
  },
  detailButtonText: { color: SKY, fontSize: 12, fontWeight: '600' },
  alertButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${'#FCD34D'}40`,
    backgroundColor: `${'#FCD34D'}1A`,
  },
  alertButtonText: { color: '#FCD34D', fontSize: 12, fontWeight: '600' },

  emptyState: { flexBasis: '100%', alignItems: 'center', paddingVertical: 64 },
  emptyText: { color: '#6B7280', fontSize: 14 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalSheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: DARK,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl ?? spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { color: DARK_TEXT, fontSize: 18, fontWeight: '700' },
  modalSubtitle: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  modalBody: { paddingHorizontal: spacing.xl ?? spacing.lg, paddingVertical: spacing.lg, gap: spacing.md },
  modalFooter: { paddingHorizontal: spacing.xl ?? spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  modalFooterRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl ?? spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  statusInlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusText: { fontSize: 14, fontWeight: '600' },
  sectionLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: -spacing.xs },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: PANEL,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  goalText: { color: DARK_TEXT, fontSize: 13 },

  metricsGrid3: { flexDirection: 'row', gap: spacing.md },
  metricTile: { flex: 1, backgroundColor: PANEL, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  metricTileValue: { color: DARK_TEXT, fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  metricTileLabel: { color: '#9CA3AF', fontSize: 11, marginTop: 2 },

  breakdownTile: { flex: 1, backgroundColor: PANEL, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  breakdownValue: { color: DARK_TEXT, fontSize: 17, fontWeight: '700' },
  breakdownKey: { fontSize: 12, fontWeight: '700', fontFamily: undefined },

  incidentLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(249,115,22,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.2)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  incidentLogText: { color: '#FDBA74', fontSize: 13, flex: 1 },

  closeButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
  },
  closeButtonText: { color: DARK_TEXT, fontSize: 14, fontWeight: '600' },

  alertFormBody: { paddingHorizontal: spacing.xl ?? spacing.lg, paddingVertical: spacing.lg, gap: spacing.md },
  messageInput: {
    width: '100%',
    minHeight: 100,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: DARK_TEXT,
    fontSize: 13,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
  },
  sendBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: '#FCD34D', alignItems: 'center' },
  sendBtnText: { color: DARK, fontSize: 14, fontWeight: '700' },
});
