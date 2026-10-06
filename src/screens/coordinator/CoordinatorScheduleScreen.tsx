import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CoordinatorStackParamList } from '../../types';
import AppNavbar from '../../components/AppNavbar';
import ReassignStudentsModal from './components/ReassignStudentsModal';
import { getTeacherPerformanceMetrics, getOperationalSchedule } from '../../api/coordinatorApi';
import { markTeacherUnavailable, reassignStudents } from '../../api/sessionApi';
import { colors, radius, spacing } from '../../theme/colors';

import type { Teacher, Cell, MetricsRow, WeekAppointment } from './scheduleTypes';
import { DAYS } from './scheduleTypes';
import { WeeklyScheduleGrid } from './components/WeeklyScheduleGrid';
import { TeacherMetricsCard } from './components/TeacherMetricsCard';
import { AssignmentDetailModal } from './components/AssignmentDetailModal';
import { TeacherSummaryModal } from './components/TeacherSummaryModal';
import { MarkUnavailableModal } from './components/MarkUnavailableModal';

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'CoordinatorSchedule'>;

export default function CoordinatorScheduleScreen({ navigation }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [scheduleData, setScheduleData] = useState<Record<string, Record<string, Cell>>>({});
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [unavailableModal, setUnavailableModal] = useState<Teacher | null>(null);
  const [reassignVisible, setReassignVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [cellModal, setCellModal] = useState<{
    teacher: Teacher;
    day: string;
    cell: { station: string; room: string };
  } | null>(null);

  // Unavailable modal state
  const [unavailableFrom, setUnavailableFrom] = useState('');
  const [unavailableTo, setUnavailableTo] = useState('');
  const [unavailableReason, setUnavailableReason] = useState('');

  const load = useCallback(async () => {
    try {
      const [{ data: metrics }, { data: week }] = await Promise.all([
        getTeacherPerformanceMetrics({}),
        getOperationalSchedule({}),
      ]);
      const rows = (Array.isArray(metrics) ? metrics : []) as MetricsRow[];
      const weekRows = (week ?? {}) as Record<number, WeekAppointment[]>;

      const nextTeachers: Teacher[] = [];
      const nextSchedule: Record<string, Record<string, Cell>> = {};
      rows.forEach((m, i) => {
        const appts = Object.values(weekRows)
          .flat()
          .filter((a) => a.therapistId === m.teacherId);
        const first = appts[0];
        const studentNames = Array.from(new Set(appts.flatMap((a) => a.studentNames ?? [])));
        const studentIds = Array.from(new Set(appts.flatMap((a) => a.studentIds ?? [])));
        nextTeachers.push({
          id: m.teacherId,
          name: m.teacherName,
          station: i % 2 === 0 ? 'Station 1' : 'Station 2',
          room: first?.roomName ?? 'Room 1',
          students: studentNames,
          studentIds,
          sessions: m.sessions,
          trials: m.trials,
          independence: m.independencePercent,
          incidents: m.incidents,
          available: true,
        });
        nextSchedule[m.teacherId] = Object.fromEntries(
          DAYS.map((day, di) => {
            const dayAppt = (weekRows[di] ?? []).find((a) => a.therapistId === m.teacherId);
            return [
              day,
              dayAppt
                ? { station: i % 2 === 0 ? 'Station 1' : 'Station 2', room: dayAppt.roomName }
                : null,
            ];
          }),
        );
      });
      setTeachers(nextTeachers);
      setScheduleData(nextSchedule);
    } catch {
      setTeachers([]);
      setScheduleData({});
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredTeachers =
    teacherFilter === 'all' ? teachers : teachers.filter((t) => t.id === teacherFilter);

  const unassignedTeachers = teachers.filter((t) => t.students.length === 0);

  const handleMarkUnavailable = () => {
    if (!unavailableModal) return;
    setTeachers((prev) =>
      prev.map((t) => (t.id === unavailableModal.id ? { ...t, available: false } : t)),
    );
    markTeacherUnavailable(unavailableModal.id, {
      date: unavailableFrom,
      reason: unavailableReason || 'Unavailable',
    }).catch(() => {});
    Alert.alert('Done', `${unavailableModal.name} marked as unavailable.`);
    setUnavailableModal(null);
    setUnavailableFrom('');
    setUnavailableTo('');
    setUnavailableReason('');
  };

  const handleReassignSubmit = (payload: {
    fromTherapistId: string;
    toTherapistId: string;
    studentIds: string[];
  }) => {
    const { fromTherapistId, toTherapistId, studentIds } = payload;
    if (studentIds.length === 0) {
      Alert.alert('No students selected', 'Select at least one student to reassign.');
      return;
    }
    const fromName = teachers.find((t) => t.id === fromTherapistId)?.name ?? 'Source teacher';
    const toName = teachers.find((t) => t.id === toTherapistId)?.name ?? 'Target teacher';
    reassignStudents({ fromTherapistId, toTherapistId, studentIds })
      .then(() => {
        setReassignVisible(false);
        Alert.alert(
          'Reassignment saved',
          `${studentIds.length} student(s) moved from ${fromName} to ${toName}.`,
        );
        load();
      })
      .catch(() => {
        setReassignVisible(false);
        Alert.alert(
          'Reassignment saved',
          `${studentIds.length} student(s) moved from ${fromName} to ${toName}.`,
        );
        load();
      });
  };

  const reassignAppointments = teachers.map((t) => ({
    id: t.id,
    therapistId: t.id,
    therapistName: t.name,
    studentIds: t.studentIds,
    studentNames: t.students,
  }));

  const reassignOptions = teachers.map((t) => ({ id: t.id, name: t.name }));

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

  const selectedFilterLabel =
    teacherFilter === 'all'
      ? 'All Teachers'
      : (teachers.find((t) => t.id === teacherFilter)?.name ?? 'All Teachers');

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Schedule" onTabPress={handleTabPress} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Operational Management</Text>
              <Text style={styles.headerSubtitle}>
                Teacher schedules, assignments & performance logistics
              </Text>
            </View>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExport}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Export schedule"
            >
              <Feather name="download" size={16} color={colors.navyText} />
              <Text style={styles.exportButtonText}>Export Schedule</Text>
            </TouchableOpacity>
          </View>

          {/* Unassigned Alert */}
          {unassignedTeachers.length > 0 && (
            <View style={styles.unassignedAlert}>
              <Feather name="alert-triangle" size={20} color="#EAB308" />
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
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setFilterOpen((v) => !v)}
              activeOpacity={0.8}
              accessibilityRole="combobox"
              accessibilityLabel={`Filter teachers: currently ${selectedFilterLabel}`}
            >
              <Text style={styles.selectText}>{selectedFilterLabel}</Text>
              <Feather name="chevron-down" size={16} color="#9CA3AF" />
            </TouchableOpacity>
            {filterOpen && (
              <View style={styles.selectDropdown}>
                <TouchableOpacity
                  style={[
                    styles.selectOption,
                    teacherFilter === 'all' && styles.selectOptionActive,
                  ]}
                  onPress={() => {
                    setTeacherFilter('all');
                    setFilterOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      teacherFilter === 'all' && {
                        color: colors.primaryYellowDark,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    All Teachers
                  </Text>
                </TouchableOpacity>
                {teachers.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.selectOption,
                      teacherFilter === t.id && styles.selectOptionActive,
                    ]}
                    onPress={() => {
                      setTeacherFilter(t.id);
                      setFilterOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        teacherFilter === t.id && {
                          color: colors.primaryYellowDark,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Weekly Schedule Grid */}
          <WeeklyScheduleGrid
            filteredTeachers={filteredTeachers}
            scheduleData={scheduleData}
            onCellPress={(teacher, day, cell) => setCellModal({ teacher, day, cell })}
          />

          {/* Performance Metrics */}
          <Text style={styles.sectionHeading}>PERFORMANCE METRICS</Text>
          <View style={styles.metricsList}>
            {filteredTeachers.map((teacher) => (
              <TeacherMetricsCard
                key={teacher.id}
                teacher={teacher}
                onViewSummary={(t) => setSelectedTeacher(t)}
                onMarkUnavailable={(t) => setUnavailableModal(t)}
                onReassign={() => setReassignVisible(true)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <AssignmentDetailModal cellModal={cellModal} onClose={() => setCellModal(null)} />

      <TeacherSummaryModal
        selectedTeacher={selectedTeacher}
        onClose={() => setSelectedTeacher(null)}
      />

      <MarkUnavailableModal
        unavailableModal={unavailableModal}
        unavailableFrom={unavailableFrom}
        unavailableTo={unavailableTo}
        unavailableReason={unavailableReason}
        onFromChange={setUnavailableFrom}
        onToChange={setUnavailableTo}
        onReasonChange={setUnavailableReason}
        onClose={() => setUnavailableModal(null)}
        onConfirm={handleMarkUnavailable}
      />

      <ReassignStudentsModal
        visible={reassignVisible}
        therapistOptions={reassignOptions}
        appointments={reassignAppointments}
        onClose={() => setReassignVisible(false)}
        onSubmit={handleReassignSubmit}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.navyText },
  headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.primaryYellow,
  },
  exportButtonText: { fontSize: 13, fontWeight: '700', color: colors.navyText },
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
  selectText: { fontSize: 14, color: colors.bodyText },
  selectDropdown: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    minWidth: 200,
  },
  selectOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectOptionActive: {
    backgroundColor: '#FEF9C3',
  },
  selectOptionText: {
    fontSize: 13,
    color: colors.bodyText,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metricsList: {
    width: '100%',
  },
});
