import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import CoordinatorNav from "./components/CoordinatorNav";
import AppointmentFormModal from '../scheduling/components/AppointmentFormModal';
import MarkUnavailableModal from '../scheduling/components/MarkUnavailableModal';
import ReassignStudentsModal from './components/ReassignStudentsModal';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import type { CoordinatorStackParamList, Payload } from '../../types';
import {
  getOperationalSchedule,
  getTeacherPerformanceMetrics,
} from '../../api/coordinatorApi';
import {
  createAppointment,
  updateAppointment,
  cancelAppointment,
  markAppointmentStatus,
  markTeacherUnavailable,
} from '../../api/sessionApi';
import {
  subscribe,
  getWeekData,
  reassignStudentsInStore,
  type ScheduleAppointment as Appointment,
  type WeekData,
} from '../../stores/scheduleStore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

interface Option {
  id: string;
  name: string;
}

interface Metric {
  teacherId: string;
  teacherName: string;
  sessions: number;
  trials: number;
  independencePercent: number;
  incidents: number;
}

const THERAPIST_OPTIONS: Option[] = [
  { id: 't-a', name: 'Teacher A' },
  { id: 't-b', name: 'Teacher B' },
  { id: 't-c', name: 'Teacher C' },
];
const STUDENT_OPTIONS: Option[] = [
  { id: 'student-a', name: 'Student A' },
  { id: 'student-b', name: 'Student B' },
  { id: 'student-c', name: 'Student C' },
];
const ROOM_OPTIONS: Option[] = [
  { id: 'room-1', name: 'Room 1' },
  { id: 'room-2', name: 'Room 2' },
  { id: 'room-3', name: 'Room 3' },
];

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'CoordinatorSchedule'>;

export default function CoordinatorScheduleScreen({ navigation }: Props) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [formVisible, setFormVisible] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [exportContent, setExportContent] = useState<string | null>(null);
  const [unavailableVisible, setUnavailableVisible] = useState(false);
  const [reassignVisible, setReassignVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await getOperationalSchedule({});
      setWeekData(data);
    } catch (err) {
      setWeekData(getWeekData());
    }
    try {
      const { data } = await getTeacherPerformanceMetrics({});
      setMetrics(data);
    } catch (err) {
      setMetrics(DEMO_METRICS);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribe(load), [load]);

  const dayAppointments = (weekData?.[selectedDay] || []).filter(
    (a) => teacherFilter === 'all' || a.therapistId === teacherFilter
  );
  const unassignedStudents = STUDENT_OPTIONS.filter(
    (s) => !dayAppointments.some((a) => a.studentIds?.includes(s.id))
  );

  const openCreate = () => { setEditingAppt(null); setFormVisible(true); };
  const openEdit = (appt: Appointment) => { setEditingAppt(appt); setFormVisible(true); };

  const handleSave = async (payload: Payload) => {
    try {
      if (editingAppt) await updateAppointment(editingAppt.id, payload);
      else await createAppointment(payload);
      setFormVisible(false);
      load();
    } catch (err) {
      setWeekData((prev) => {
        const next = { ...(prev || {}) } as WeekData;
        const list = [...(next[selectedDay] || [])];
        if (editingAppt) {
          const idx = list.findIndex((a) => a.id === editingAppt.id);
          if (idx >= 0) list[idx] = { ...list[idx], ...payload };
        } else {
          list.push({ id: `local-${Date.now()}`, status: 'scheduled', therapistId: '', therapistName: 'New Therapist', roomId: '', roomName: 'TBD', studentIds: [], studentNames: ['New Student'], startTime: '', endTime: '', ...payload });
        }
        next[selectedDay] = list;
        return next;
      });
      setFormVisible(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      await cancelAppointment(id, {});
      await load();
    } catch (err) {
      setWeekData((prev) => ({
        ...(prev || {}),
        [selectedDay]: (prev?.[selectedDay] || []).map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)),
      }) as WeekData);
    }
    setFormVisible(false);
  };

  const handleMarkStatus = async (id: string, status: string) => {
    try {
      await markAppointmentStatus(id, status);
      await load();
    } catch (err) {
      setWeekData((prev) => ({
        ...(prev || {}),
        [selectedDay]: (prev?.[selectedDay] || []).map((a) => (a.id === id ? { ...a, status } : a)),
      }) as WeekData);
    }
    setFormVisible(false);
  };

  const handleReassign = () => setReassignVisible(true);

  const handleMarkUnavailable = () => setUnavailableVisible(true);

  const handleUnavailableSubmit = async (therapistId: string, payload: { date: string; reason: string }) => {
    try {
      await markTeacherUnavailable(therapistId, payload);
    } catch (err) {
      // Demo/offline fallback below still applies.
    }
    setUnavailableVisible(false);
    Alert.alert(
      'Marked Unavailable',
      `${THERAPIST_OPTIONS.find((t) => t.id === therapistId)?.name ?? therapistId} is unavailable on ${payload.date} (${payload.reason}).`,
      [{ text: 'OK' }]
    );
  };

  const handleReassignSubmit = async (payload: { fromTherapistId: string; toTherapistId: string; studentIds: string[] }) => {
    reassignStudentsInStore(selectedDay, payload.fromTherapistId, payload.toTherapistId, payload.studentIds);
    setWeekData(getWeekData());
    setReassignVisible(false);
    const targetName = THERAPIST_OPTIONS.find((t) => t.id === payload.toTherapistId)?.name ?? payload.toTherapistId;
    Alert.alert('Students Reassigned', `Moved ${payload.studentIds.length} student(s) to ${targetName}.`, [{ text: 'OK' }]);
  };

  const handleExport = () => {
    const lines = [
      `Melu'e Foundation — Staff Schedule`,
      `Day: ${DAYS[selectedDay]}`,
      `Teacher filter: ${teacherFilter === 'all' ? 'All' : THERAPIST_OPTIONS.find((t) => t.id === teacherFilter)?.name}`,
      '',
      'APPOINTMENTS',
      ...dayAppointments.map((a) => `• ${a.startTime} – ${a.endTime} | ${a.therapistName} | ${a.roomName} | ${a.studentNames.join(', ')}`),
      dayAppointments.length === 0 ? '(none)' : '',
      '',
      'PERFORMANCE METRICS',
      ...metrics.map((m) => `• ${m.teacherName}: ${m.sessions} sessions, ${m.trials} trials, ${m.independencePercent}% independence, ${m.incidents} incidents`),
      '',
      `Unassigned students: ${unassignedStudents.length}`,
    ];
    setExportContent(lines.join('\n'));
  };

  if (!weekData) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <CoordinatorNav activeTab="Schedule" onTabPress={(t) => t !== 'Schedule' && navigation?.navigate?.(navRouteForTab(t) as never)} />

      <View style={styles.header}>
        <Text style={typography.h1}>Operational Management</Text>
        <TouchableOpacity style={styles.newApptBtn} onPress={openCreate}>
          <Feather name="plus" size={16} color={colors.navyText} />
          <Text style={styles.newApptBtnText}>New Appointment</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dayTabs}>
        {DAYS.map((d, i) => (
          <TouchableOpacity key={d} style={[styles.dayTab, i === selectedDay && styles.dayTabActive]} onPress={() => setSelectedDay(i)}>
            <Text style={[typography.bodyBold, i === selectedDay && { color: colors.navyText }]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={[styles.filterChip, teacherFilter === 'all' && styles.filterChipActive]} onPress={() => setTeacherFilter('all')}>
            <Text style={typography.body}>All Teachers</Text>
          </TouchableOpacity>
          {THERAPIST_OPTIONS.map((t) => (
            <TouchableOpacity key={t.id} style={[styles.filterChip, teacherFilter === t.id && styles.filterChipActive]} onPress={() => setTeacherFilter(t.id)}>
              <Text style={typography.body}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {unassignedStudents.length > 0 && (
        <View style={styles.unassignedBanner}>
          <Feather name="alert-triangle" size={14} color="#B45309" />
          <Text style={styles.unassignedText}>{unassignedStudents.length} student(s) unassigned today: {unassignedStudents.map((s) => s.name).join(', ')}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={typography.h3}>Teacher Schedule</Text>
          {dayAppointments.map((appt) => (
            <TouchableOpacity key={appt.id} style={styles.apptRow} onPress={() => openEdit(appt)}>
              <Text style={typography.bodyBold}>{appt.startTime} – {appt.endTime}</Text>
              <Text style={typography.caption}>{appt.therapistName} · {appt.roomName} · {appt.studentNames.join(', ')}</Text>
            </TouchableOpacity>
          ))}
          {dayAppointments.length === 0 && (
            <Text style={[typography.body, { color: colors.mutedText }]}>No appointments this day.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Performance Metrics</Text>
          {metrics.map((m) => (
            <View key={m.teacherId} style={styles.metricsRow}>
              <Text style={typography.bodyBold}>{m.teacherName}</Text>
              <Text style={typography.caption}>{m.sessions} sessions · {m.trials} trials · {m.independencePercent}% independence · {m.incidents} incidents</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleMarkUnavailable}>
            <Text style={styles.secondaryBtnText}>Mark Unavailable</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleReassign}>
            <Text style={styles.secondaryBtnText}>Reassign Students</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleExport}>
            <Text style={styles.secondaryBtnText}>Export Schedule</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AppointmentFormModal
        visible={formVisible}
        appointment={editingAppt}
        defaultDate={`2026-08-${10 + selectedDay}`}
        therapistOptions={THERAPIST_OPTIONS}
        studentOptions={STUDENT_OPTIONS}
        roomOptions={ROOM_OPTIONS}
        onClose={() => setFormVisible(false)}
        onSave={handleSave}
        onCancelAppointment={handleCancelAppointment}
        onMarkStatus={handleMarkStatus}
      />

      <ExportPreviewModal
        visible={!!exportContent}
        title="Schedule Export"
        filename={`StaffSchedule_${DAYS[selectedDay]}.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />

      <MarkUnavailableModal
        visible={unavailableVisible}
        therapistOptions={THERAPIST_OPTIONS}
        defaultDate={`2026-08-${10 + selectedDay}`}
        onClose={() => setUnavailableVisible(false)}
        onSubmit={handleUnavailableSubmit}
      />

      <ReassignStudentsModal
        visible={reassignVisible}
        therapistOptions={THERAPIST_OPTIONS}
        appointments={weekData?.[selectedDay] ?? []}
        onClose={() => setReassignVisible(false)}
        onSubmit={handleReassignSubmit}
      />
    </SafeAreaView>
  );
}

function navRouteForTab(tab: string): keyof CoordinatorStackParamList {
  return ({
    Dashboard: 'CoordinatorDashboard',
    'Live Sessions': 'LiveSessionMonitoring',
    Review: 'SessionSummaryReview',
    Progress: 'CoordinatorStudentProgress',
    Parents: 'CoordinatorParentCommunication',
    Enrollment: 'StudentEnrollment',
    Workload: 'WorkloadDashboard',
    Notifications: 'Notifications',
    Rooms: 'RoomResourceScheduling',
  } as Record<string, keyof CoordinatorStackParamList>)[tab];
}

const DEMO_METRICS: Metric[] = [
  { teacherId: 't-a', teacherName: 'Teacher A', sessions: 6, trials: 124, independencePercent: 68, incidents: 1 },
  { teacherId: 't-b', teacherName: 'Teacher B', sessions: 4, trials: 80, independencePercent: 55, incidents: 0 },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  newApptBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  newApptBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  dayTabs: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm, backgroundColor: colors.bgCard },
  dayTab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.bgApp },
  dayTabActive: { backgroundColor: colors.primaryYellow },
  filterRow: { padding: spacing.md, backgroundColor: colors.bgCard },
  filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs },
  filterChipActive: { backgroundColor: colors.bgApp, borderColor: colors.navyText },
  unassignedBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.statusPendingBg, marginHorizontal: spacing.lg, marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.md },
  unassignedText: { fontSize: 12, fontWeight: '600', color: '#B45309', flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  apptRow: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  metricsRow: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  secondaryBtnText: { fontWeight: '600', fontSize: 11, color: colors.navyText, textAlign: 'center' },
});
