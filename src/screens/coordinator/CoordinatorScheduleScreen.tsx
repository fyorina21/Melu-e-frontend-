import React, { useState } from 'react';
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
  Calendar,
  X,
  AlertTriangle,
  Download,
  ChevronDown,
  Eye,
  UserMinus,
  ArrowRightLeft,
  CheckCircle,
  Clock,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CoordinatorStackParamList } from '../../types';
import AppNavbar from '../../components/AppNavbar';
import { colors, radius, spacing } from '../../theme/colors';

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'CoordinatorSchedule'>;

const SKY = '#38BDF8';
const AMBER = '#FCD34D';
const DARK_TEXT = '#1F2937';

interface Teacher {
  id: string;
  name: string;
  station: string;
  room: string;
  students: string[];
  sessions: number;
  trials: number;
  independence: number;
  incidents: number;
  available: boolean;
}

const INITIAL_TEACHERS: Teacher[] = [
  { id: '1', name: 'Teacher A', station: 'Station 1', room: 'Room 2', students: ['Student A', 'Student B'], sessions: 24, trials: 312, independence: 72, incidents: 3, available: true },
  { id: '2', name: 'Teacher B', station: 'Station 1', room: 'Room 1', students: ['Student C', 'Student D'], sessions: 20, trials: 260, independence: 68, incidents: 5, available: true },
  { id: '3', name: 'Teacher C', station: 'Station 2', room: 'Room 1', students: [], sessions: 22, trials: 286, independence: 70, incidents: 2, available: false },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

type Cell = { station: string; room: string } | null;

const SCHEDULE_DATA: Record<string, Record<string, Cell>> = {
  '1': {
    Mon: { station: 'Station 1', room: 'Room 2' },
    Tue: { station: 'Station 1', room: 'Room 2' },
    Wed: null,
    Thu: { station: 'Station 1', room: 'Room 2' },
    Fri: { station: 'Station 1', room: 'Room 2' },
  },
  '2': {
    Mon: { station: 'Station 1', room: 'Room 1' },
    Tue: null,
    Wed: { station: 'Station 1', room: 'Room 1' },
    Thu: { station: 'Station 1', room: 'Room 1' },
    Fri: { station: 'Station 1', room: 'Room 1' },
  },
  '3': {
    Mon: { station: 'Station 2', room: 'Room 1' },
    Tue: { station: 'Station 2', room: 'Room 1' },
    Wed: { station: 'Station 2', room: 'Room 1' },
    Thu: null,
    Fri: { station: 'Station 2', room: 'Room 1' },
  },
};

function StationChip({ station }: { station: string }) {
  const isStation1 = station === 'Station 1';
  return (
    <View style={[styles.stationChip, { backgroundColor: isStation1 ? '#E0F2FE' : '#FEF9C3' }]}>
      <Text style={[styles.stationChipText, { color: isStation1 ? '#0369A1' : '#A16207' }]}>{station}</Text>
    </View>
  );
}

function KpiCard({ label, value, unit = '' }: { label: string; value: number | string; unit?: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>
        {value}
        <Text style={styles.kpiUnit}>{unit}</Text>
      </Text>
    </View>
  );
}

export default function CoordinatorScheduleScreen({ navigation }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [unavailableModal, setUnavailableModal] = useState<Teacher | null>(null);
  const [reassignModal, setReassignModal] = useState<Teacher | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [cellModal, setCellModal] = useState<{ teacher: Teacher; day: string; cell: { station: string; room: string } } | null>(null);

  // Unavailable modal state
  const [unavailableFrom, setUnavailableFrom] = useState('');
  const [unavailableTo, setUnavailableTo] = useState('');
  const [unavailableReason, setUnavailableReason] = useState('');

  // Reassign modal state
  const [reassignTarget, setReassignTarget] = useState('');
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignError, setReassignError] = useState('');

  const filteredTeachers =
    teacherFilter === 'all' ? teachers : teachers.filter((t) => t.id === teacherFilter);

  const unassignedTeachers = teachers.filter((t) => t.students.length === 0);

  const handleMarkUnavailable = () => {
    if (!unavailableModal) return;
    setTeachers((prev) => prev.map((t) => (t.id === unavailableModal.id ? { ...t, available: false } : t)));
    Alert.alert('Done', `${unavailableModal.name} marked as unavailable.`);
    setUnavailableModal(null);
    setUnavailableFrom('');
    setUnavailableTo('');
    setUnavailableReason('');
  };

  const handleReassign = () => {
    if (!reassignModal || !reassignTarget) return;
    const target = teachers.find((t) => t.id === reassignTarget);
    if (!target) return;
    if (target.students.length >= 2) {
      setReassignError('Target teacher already has 2 students. Please choose a different teacher.');
      return;
    }
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id === reassignModal.id) return { ...t, students: [] };
        if (t.id === reassignTarget) return { ...t, students: [...t.students, ...reassignModal.students] };
        return t;
      })
    );
    Alert.alert('Done', `Students reassigned to ${target.name}.`);
    setReassignModal(null);
    setReassignTarget('');
    setReassignError('');
    setReassignOpen(false);
  };

  const handleExport = () => {
    Alert.alert('Exporting...', 'Exporting schedule...');
    setTimeout(() => {
      Alert.alert('Export complete', 'Schedule exported as PDF');
    }, 1500);
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

  const closeReassign = () => {
    setReassignModal(null);
    setReassignError('');
    setReassignTarget('');
    setReassignOpen(false);
  };

  const selectedFilterLabel =
    teacherFilter === 'all'
      ? 'All Teachers'
      : teachers.find((t) => t.id === teacherFilter)?.name ?? 'All Teachers';

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Schedule" onTabPress={handleTabPress} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Operational Management</Text>
            <Text style={styles.headerSubtitle}>Teacher schedules, assignments & performance logistics</Text>
          </View>
          <TouchableOpacity style={styles.exportButton} onPress={handleExport} activeOpacity={0.8}>
            <Download size={16} color={DARK_TEXT} />
            <Text style={styles.exportButtonText}>Export Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Unassigned Alert */}
        {unassignedTeachers.length > 0 && (
          <View style={styles.unassignedAlert}>
            <AlertTriangle size={20} color="#EAB308" />
            <View style={{ flex: 1 }}>
              {unassignedTeachers.map((t) => (
                <Text key={t.id} style={styles.unassignedText}>
                  ⚠ {t.name} has no students assigned. Please reassign.
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Teacher Filter */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>FILTER:</Text>
          <TouchableOpacity style={styles.selectBox} onPress={() => setFilterOpen((v) => !v)} activeOpacity={0.8}>
            <Text style={styles.selectText}>{selectedFilterLabel}</Text>
            <ChevronDown size={16} color="#9CA3AF" />
          </TouchableOpacity>
          {filterOpen && (
            <View style={styles.selectDropdown}>
              <TouchableOpacity
                style={[styles.selectOption, teacherFilter === 'all' && styles.selectOptionActive]}
                onPress={() => {
                  setTeacherFilter('all');
                  setFilterOpen(false);
                }}
              >
                <Text style={[styles.selectOptionText, teacherFilter === 'all' && { color: SKY, fontWeight: '700' }]}>
                  All Teachers
                </Text>
              </TouchableOpacity>
              {teachers.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.selectOption, teacherFilter === t.id && styles.selectOptionActive]}
                  onPress={() => {
                    setTeacherFilter(t.id);
                    setFilterOpen(false);
                  }}
                >
                  <Text style={[styles.selectOptionText, teacherFilter === t.id && { color: SKY, fontWeight: '700' }]}>
                    {t.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Weekly Schedule Grid */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Calendar size={16} color={SKY} />
            <Text style={styles.cardTitle}>Weekly Schedule Grid</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Header row */}
              <View style={styles.gridHeaderRow}>
                <Text style={[styles.gridCellHeader, styles.gridFirstCol]}>TEACHER</Text>
                {DAYS.map((day) => (
                  <Text key={day} style={[styles.gridCellHeader, styles.gridDayCol]}>
                    {day.toUpperCase()}
                  </Text>
                ))}
              </View>
              {filteredTeachers.map((teacher) => (
                <View key={teacher.id} style={styles.gridRow}>
                  <View style={[styles.teacherCell, styles.gridFirstCol]}>
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarSmallText}>{teacher.name.charAt(teacher.name.length - 1)}</Text>
                    </View>
                    <View>
                      <Text style={styles.gridTeacherName}>{teacher.name}</Text>
                      {!teacher.available && (
                        <View style={styles.unavailableInline}>
                          <Clock size={12} color="#EF4444" />
                          <Text style={styles.unavailableInlineText}>Unavailable</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {DAYS.map((day) => {
                    const cell = SCHEDULE_DATA[teacher.id]?.[day];
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[styles.dayCell, styles.gridDayCol]}
                        onPress={() => cell && setCellModal({ teacher, day, cell })}
                        disabled={!cell}
                        activeOpacity={cell ? 0.7 : 1}
                      >
                        {cell ? (
                          <>
                            <StationChip station={cell.station} />
                            <Text style={styles.roomText}>{cell.room}</Text>
                          </>
                        ) : (
                          <Text style={styles.emptyCellText}>—</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Performance Metrics */}
        <Text style={styles.sectionHeading}>PERFORMANCE METRICS</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {filteredTeachers.map((teacher) => (
            <View
              key={teacher.id}
              style={[
                styles.card,
                styles.metricCard,
                !teacher.available && { borderColor: '#FECACA', backgroundColor: '#FFFBFA' },
              ]}
            >
              <View style={styles.metricHeader}>
                <View style={styles.metricHeaderLeft}>
                  <View style={styles.avatarMedium}>
                    <Text style={styles.avatarMediumText}>{teacher.name.charAt(teacher.name.length - 1)}</Text>
                  </View>
                  <View>
                    <Text style={styles.metricTeacherName}>{teacher.name}</Text>
                    <Text style={styles.metricTeacherMeta}>
                      {teacher.station} · {teacher.room}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.availabilityBadge,
                    { backgroundColor: !teacher.available ? '#FEE2E2' : '#DCFCE7' },
                  ]}
                >
                  <Text style={[styles.availabilityBadgeText, { color: !teacher.available ? '#DC2626' : '#16A34A' }]}>
                    {!teacher.available ? 'Unavailable' : 'Available'}
                  </Text>
                </View>
              </View>

              <View>
                <Text style={styles.assignedLabel}>Assigned Students</Text>
                {teacher.students.length === 0 ? (
                  <View style={styles.noStudentsBox}>
                    <Text style={styles.noStudentsText}>No students assigned</Text>
                  </View>
                ) : (
                  <View style={styles.chipWrap}>
                    {teacher.students.map((s) => (
                      <View key={s} style={styles.grayChip}>
                        <Text style={styles.grayChipText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.kpiGrid}>
                <KpiCard label="Sessions" value={teacher.sessions} />
                <KpiCard label="Trials" value={teacher.trials} />
                <KpiCard label="Indep." value={teacher.independence} unit="%" />
                <KpiCard label="Incidents" value={teacher.incidents} />
              </View>

              <View style={{ gap: spacing.sm }}>
                <TouchableOpacity
                  style={styles.summaryButton}
                  onPress={() => setSelectedTeacher(teacher)}
                  activeOpacity={0.8}
                >
                  <Eye size={14} color="#4B5563" />
                  <Text style={styles.summaryButtonText}>View Teacher Summary</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <TouchableOpacity
                    style={styles.unavailableButton}
                    onPress={() => setUnavailableModal(teacher)}
                    activeOpacity={0.8}
                  >
                    <UserMinus size={14} color="#EA580C" />
                    <Text style={styles.unavailableButtonText}>Mark Unavailable</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reassignButton, teacher.students.length === 0 && { opacity: 0.4 }]}
                    onPress={() => {
                      setReassignModal(teacher);
                      setReassignError('');
                    }}
                    disabled={teacher.students.length === 0}
                    activeOpacity={0.8}
                  >
                    <ArrowRightLeft size={14} color="#0284C7" />
                    <Text style={styles.reassignButtonText}>Reassign Students</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Cell Detail Modal */}
      <Modal visible={cellModal !== null} animationType="fade" transparent onRequestClose={() => setCellModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 340 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assignment Detail</Text>
              <TouchableOpacity onPress={() => setCellModal(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {cellModal && (
              <>
                <View style={styles.modalBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Teacher</Text>
                    <Text style={styles.detailValue}>{cellModal.teacher.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Day</Text>
                    <Text style={styles.detailValue}>{cellModal.day}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Station</Text>
                    <StationChip station={cellModal.cell.station} />
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Room</Text>
                    <Text style={styles.detailValue}>{cellModal.cell.room}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Status</Text>
                    <View style={styles.statusInline}>
                      {cellModal.teacher.available ? (
                        <>
                          <CheckCircle size={14} color="#16A34A" />
                          <Text style={[styles.statusText, { color: '#16A34A' }]}>Scheduled</Text>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={14} color="#EF4444" />
                          <Text style={[styles.statusText, { color: '#EF4444' }]}>Unavailable</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.modalFooterSingle}>
                  <TouchableOpacity style={styles.closeDarkButton} onPress={() => setCellModal(null)} activeOpacity={0.8}>
                    <Text style={styles.closeDarkButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Teacher Summary Modal */}
      <Modal visible={selectedTeacher !== null} animationType="fade" transparent onRequestClose={() => setSelectedTeacher(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.summaryHeaderLeft}>
                <View style={styles.avatarMedium}>
                  <Text style={styles.avatarMediumText}>
                    {selectedTeacher?.name.charAt(selectedTeacher.name.length - 1)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.modalTitle}>{selectedTeacher?.name}</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedTeacher?.station} · {selectedTeacher?.room}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedTeacher(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {selectedTeacher && (
              <>
                <View style={styles.modalBody}>
                  <View style={styles.statsGrid2x2}>
                    <View style={styles.statTile}>
                      <Text style={styles.statTileLabel}>Total Sessions</Text>
                      <Text style={styles.statTileValue}>{selectedTeacher.sessions}</Text>
                    </View>
                    <View style={styles.statTile}>
                      <Text style={styles.statTileLabel}>Total Trials</Text>
                      <Text style={styles.statTileValue}>{selectedTeacher.trials}</Text>
                    </View>
                    <View style={[styles.statTile, { backgroundColor: '#F0F9FF' }]}>
                      <Text style={styles.statTileLabel}>Avg Independence</Text>
                      <Text style={[styles.statTileValue, { color: '#0284C7' }]}>{selectedTeacher.independence}%</Text>
                    </View>
                    <View
                      style={[
                        styles.statTile,
                        { backgroundColor: selectedTeacher.incidents > 3 ? '#FEF2F2' : '#F0FDF4' },
                      ]}
                    >
                      <Text style={styles.statTileLabel}>Incidents</Text>
                      <Text
                        style={[
                          styles.statTileValue,
                          { color: selectedTeacher.incidents > 3 ? '#DC2626' : '#16A34A' },
                        ]}
                      >
                        {selectedTeacher.incidents}
                      </Text>
                    </View>
                  </View>

                  <View>
                    <Text style={styles.notesSectionLabel}>ASSIGNED STUDENTS</Text>
                    {selectedTeacher.students.length === 0 ? (
                      <View style={styles.noStudentsBox}>
                        <Text style={styles.noStudentsText}>No students currently assigned</Text>
                      </View>
                    ) : (
                      <View style={{ gap: spacing.sm }}>
                        {selectedTeacher.students.map((s) => (
                          <View key={s} style={styles.studentRow}>
                            <View style={styles.studentAvatar}>
                              <Text style={styles.studentAvatarText}>{s.charAt(s.length - 1)}</Text>
                            </View>
                            <Text style={styles.studentRowName}>{s}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  <View>
                    <Text style={styles.notesSectionLabel}>AVAILABILITY</Text>
                    <View
                      style={[
                        styles.availabilityRow,
                        { backgroundColor: selectedTeacher.available ? '#F0FDF4' : '#FEF2F2' },
                      ]}
                    >
                      {selectedTeacher.available ? (
                        <CheckCircle size={16} color="#15803D" />
                      ) : (
                        <AlertTriangle size={16} color="#DC2626" />
                      )}
                      <Text style={[styles.availabilityRowText, { color: selectedTeacher.available ? '#15803D' : '#DC2626' }]}>
                        {selectedTeacher.available ? 'Available this week' : 'Marked as unavailable'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.modalFooterSingle}>
                  <TouchableOpacity
                    style={styles.closeDarkButton}
                    onPress={() => setSelectedTeacher(null)}
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

      {/* Mark Unavailable Modal */}
      <Modal visible={unavailableModal !== null} animationType="fade" transparent onRequestClose={() => setUnavailableModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.flagHeaderLeft}>
                <UserMinus size={16} color="#F97316" />
                <Text style={styles.modalTitle}>Mark Teacher Unavailable</Text>
              </View>
              <TouchableOpacity onPress={() => setUnavailableModal(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {unavailableModal && (
              <>
                <View style={styles.modalBody}>
                  <Text style={styles.descriptionText}>
                    Mark <Text style={{ fontWeight: '700' }}>{unavailableModal.name}</Text> as unavailable for a date range.
                    Their schedule will show a warning indicator.
                  </Text>
                  <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>FROM</Text>
                      <TextInput
                        value={unavailableFrom}
                        onChangeText={setUnavailableFrom}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#9CA3AF"
                        style={styles.textInput}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>TO</Text>
                      <TextInput
                        value={unavailableTo}
                        onChangeText={setUnavailableTo}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#9CA3AF"
                        style={styles.textInput}
                      />
                    </View>
                  </View>
                  <View>
                    <Text style={styles.fieldLabel}>REASON</Text>
                    <TextInput
                      value={unavailableReason}
                      onChangeText={setUnavailableReason}
                      placeholder="Enter reason for unavailability..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={3}
                      style={[styles.textInput, { minHeight: 70 }]}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
                <View style={styles.modalFooterRow}>
                  <TouchableOpacity
                    style={styles.cancelOutlineButton}
                    onPress={() => setUnavailableModal(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelOutlineText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmAmberButton,
                      (!unavailableFrom || !unavailableTo || !unavailableReason.trim()) && { opacity: 0.4 },
                    ]}
                    onPress={handleMarkUnavailable}
                    disabled={!unavailableFrom || !unavailableTo || !unavailableReason.trim()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmAmberText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Reassign Students Modal */}
      <Modal visible={reassignModal !== null} animationType="fade" transparent onRequestClose={closeReassign}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.flagHeaderLeft}>
                <ArrowRightLeft size={16} color={SKY} />
                <Text style={styles.modalTitle}>Reassign Students</Text>
              </View>
              <TouchableOpacity onPress={closeReassign} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {reassignModal && (
              <>
                <View style={styles.modalBody}>
                  <View>
                    <Text style={styles.fieldLabel}>CURRENT STUDENTS — {reassignModal.name.toUpperCase()}</Text>
                    {reassignModal.students.length === 0 ? (
                      <Text style={styles.noStudentsItalic}>No students assigned</Text>
                    ) : (
                      <View style={styles.chipWrap}>
                        {reassignModal.students.map((s) => (
                          <View key={s} style={styles.grayChip}>
                            <Text style={styles.grayChipText}>{s}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <View>
                    <Text style={styles.fieldLabel}>REASSIGN TO</Text>
                    <TouchableOpacity style={styles.selectBoxFull} onPress={() => setReassignOpen((v) => !v)} activeOpacity={0.8}>
                      <Text style={[styles.selectText, !reassignTarget && { color: '#9CA3AF' }]}>
                        {reassignTarget
                          ? `${teachers.find((t) => t.id === reassignTarget)?.name} (${
                              teachers.find((t) => t.id === reassignTarget)?.students.length
                            }/2 students)`
                          : 'Select target teacher...'}
                      </Text>
                      <ChevronDown size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                    {reassignOpen && (
                      <View style={[styles.selectDropdown, { position: 'relative', marginTop: spacing.xs }]}>
                        {teachers
                          .filter((t) => t.id !== reassignModal.id)
                          .map((t) => (
                            <TouchableOpacity
                              key={t.id}
                              style={[styles.selectOption, reassignTarget === t.id && styles.selectOptionActive]}
                              disabled={t.students.length >= 2}
                              onPress={() => {
                                setReassignTarget(t.id);
                                setReassignError('');
                                setReassignOpen(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.selectOptionText,
                                  t.students.length >= 2 && { color: '#D1D5DB' },
                                  reassignTarget === t.id && { color: SKY, fontWeight: '700' },
                                ]}
                              >
                                {t.name} ({t.students.length}/2 students){t.students.length >= 2 ? ' — Full' : ''}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    )}
                    {reassignError && (
                      <View style={styles.errorRow}>
                        <AlertTriangle size={14} color="#EF4444" />
                        <Text style={styles.errorText}>{reassignError}</Text>
                      </View>
                    )}
                    <Text style={styles.hintText}>Target teacher must have fewer than 2 students assigned.</Text>
                  </View>
                </View>
                <View style={styles.modalFooterRow}>
                  <TouchableOpacity style={styles.cancelOutlineButton} onPress={closeReassign} activeOpacity={0.8}>
                    <Text style={styles.cancelOutlineText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmAmberButton, !reassignTarget && { opacity: 0.4 }]}
                    onPress={handleReassign}
                    disabled={!reassignTarget}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmAmberText}>Confirm Reassignment</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerTitle: { fontSize: 20, fontWeight: '700', color: DARK_TEXT },
  headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: AMBER,
  },
  exportButtonText: { fontSize: 13, fontWeight: '700', color: DARK_TEXT },

  unassignedAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  unassignedText: { fontSize: 13, fontWeight: '600', color: '#854D0E' },

  filterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  filterLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 1 },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minWidth: 180,
  },
  selectText: { fontSize: 14, color: '#374151' },
  selectDropdown: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    minWidth: 200,
  },
  selectOption: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  selectOptionActive: { backgroundColor: '#F0F9FF' },
  selectOptionText: { fontSize: 14, color: '#374151' },
  selectBoxFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  metricCard: { flexGrow: 1, minWidth: 300, maxWidth: '100%' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '700', color: DARK_TEXT },
  sectionHeading: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 1, marginBottom: -spacing.xs },

  gridHeaderRow: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  gridRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  gridCellHeader: { fontSize: 11, fontWeight: '600', color: '#6B7280', letterSpacing: 1, paddingVertical: spacing.md, textAlign: 'center' },
  gridFirstCol: { width: 150, paddingLeft: spacing.md, textAlign: 'left', textAlignVertical: 'center' },
  gridDayCol: { width: 110 },
  teacherCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, paddingRight: spacing.sm },
  gridTeacherName: { fontSize: 14, fontWeight: '500', color: DARK_TEXT },
  dayCell: { alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: spacing.md },
  roomText: { fontSize: 11, color: '#9CA3AF' },
  emptyCellText: { color: '#D1D5DB', fontSize: 14 },
  avatarSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: DARK_TEXT, alignItems: 'center', justifyContent: 'center' },
  avatarSmallText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  avatarMedium: { width: 40, height: 40, borderRadius: 20, backgroundColor: DARK_TEXT, alignItems: 'center', justifyContent: 'center' },
  avatarMediumText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  unavailableInline: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  unavailableInlineText: { fontSize: 11, color: '#EF4444' },

  stationChip: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999 },
  stationChipText: { fontSize: 12, fontWeight: '500' },

  metricHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  metricHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  metricTeacherName: { fontSize: 15, fontWeight: '600', color: DARK_TEXT },
  metricTeacherMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  availabilityBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999 },
  availabilityBadgeText: { fontSize: 12, fontWeight: '600' },

  assignedLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  grayChip: { backgroundColor: '#F3F4F6', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999 },
  grayChipText: { fontSize: 12, color: '#4B5563' },
  noStudentsBox: {
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  noStudentsText: { fontSize: 12, color: '#A16207' },
  noStudentsItalic: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },

  kpiGrid: {
    flexDirection: 'row',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  kpiCard: { flex: 1, alignItems: 'center' },
  kpiLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  kpiValue: { fontSize: 19, fontWeight: '700', color: DARK_TEXT, fontVariant: ['tabular-nums'] },
  kpiUnit: { fontSize: 13, fontWeight: '400', color: '#9CA3AF' },

  summaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  summaryButtonText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  unavailableButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: radius.md,
  },
  unavailableButtonText: { fontSize: 12, fontWeight: '600', color: '#EA580C' },
  reassignButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.md,
  },
  reassignButtonText: { fontSize: 12, fontWeight: '600', color: '#0284C7' },

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
    maxHeight: '90%',
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

  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailKey: { fontSize: 14, color: '#6B7280' },
  detailValue: { fontSize: 14, fontWeight: '600', color: DARK_TEXT },
  statusInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 14, fontWeight: '600' },

  summaryHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statsGrid2x2: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statTile: {
    flexGrow: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statTileLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  statTileValue: { fontSize: 22, fontWeight: '700', color: DARK_TEXT, fontVariant: ['tabular-nums'] },

  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  studentAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: SKY, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  studentRowName: { fontSize: 14, color: '#374151' },

  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  availabilityRowText: { fontSize: 14, fontWeight: '600' },

  descriptionText: { fontSize: 13, color: '#4B5563', lineHeight: 19 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 1, marginBottom: 6 },
  notesSectionLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 1, marginBottom: spacing.xs },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 14,
    color: '#374151',
    backgroundColor: colors.bgCard,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  errorText: { fontSize: 12, color: '#EF4444' },
  hintText: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },

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
  confirmAmberButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: AMBER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmAmberText: { fontSize: 13, fontWeight: '700', color: DARK_TEXT },

  closeDarkButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: DARK_TEXT,
    alignItems: 'center',
  },
  closeDarkButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
});
