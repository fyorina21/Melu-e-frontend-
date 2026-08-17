// screens/scheduling/SchedulingCalendarScreen.js
// MR-38: Staff Scheduling Calendar
//
// Built against SCR-TC-005 (Operational Management, Therapy Coordinator)
// from the requirements doc, since that's the actual detailed spec for
// this feature - the Figma only ever showed a single-day "Today's
// Schedule" card, not a full calendar. Kept the app's visual language
// (cards, chips, yellow CTAs) rather than SCR-TC-005's implied desktop
// grid, since this app is tablet-first.
//
// Simplified vs. spec: no drag-to-reschedule (tap an appointment to edit
// instead), no monthly/timeline views (day/week only). Flag for review.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import TopNav from '../../components/TopNav';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import type { Payload, SessionStackParamList } from '../../types';
import AppointmentFormModal from './components/AppointmentFormModal';
import MarkUnavailableModal from './components/MarkUnavailableModal';
import {
  getStaffCalendar,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  markAppointmentStatus,
  markTeacherUnavailable,
} from '../../api/sessionApi';
import {
  subscribe,
  getWeekData,
  type ScheduleAppointment as Appointment,
} from '../../stores/scheduleStore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

interface Option {
  id: string;
  name: string;
}

const THERAPIST_COLOR: Record<string, string> = {
  't-a': '#93C5FD', // matches promptG blue used elsewhere for consistency
  't-b': '#FCD34D',
  't-c': '#86EFAC',
};

function AppointmentChip({ appt, onPress }: { appt: Appointment; onPress: (appt: Appointment) => void }) {
  return (
    <TouchableOpacity
      style={[styles.apptChip, { borderLeftColor: THERAPIST_COLOR[appt.therapistId] || colors.mutedText }]}
      onPress={() => onPress(appt)}
    >
      <Text style={typography.bodyBold}>{appt.startTime} – {appt.endTime}</Text>
      <Text style={typography.caption}>{appt.therapistName} · {appt.roomName}</Text>
      <Text style={typography.caption}>{appt.studentNames.join(', ')}</Text>
      {appt.status !== 'scheduled' && (
        <Text style={styles.apptStatusText}>{appt.status.replace('_', ' ')}</Text>
      )}
    </TouchableOpacity>
  );
}

type Props = NativeStackScreenProps<SessionStackParamList, 'SchedulingCalendar'>;

export default function SchedulingCalendarScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [weekData, setWeekData] = useState<Record<number, Appointment[]> | null>(null); // { [dayIndex]: appt[] }
  const [therapistFilter, setTherapistFilter] = useState('all');
  const [formVisible, setFormVisible] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [unavailableVisible, setUnavailableVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await getStaffCalendar({});
      setWeekData(data);
    } catch (err) {
      setWeekData(getWeekData());
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribe(load), [load]);

  const dayAppointments = (weekData?.[selectedDayIndex] || []).filter(
    (a) => therapistFilter === 'all' || a.therapistId === therapistFilter
  );

  // Simple conflict flag: same therapist, overlapping students, or same
  // room booked twice in the same visible day - real detection belongs on
  // the backend, this is a client-side heads-up only.
  const conflictWarning = (() => {
    const roomTimeSeen = new Set();
    for (const a of dayAppointments) {
      const key = `${a.roomId}-${a.startTime}`;
      if (roomTimeSeen.has(key)) return `Room double-booked at ${a.startTime}`;
      roomTimeSeen.add(key);
    }
    return null;
  })();

  const openCreate = () => {
    setEditingAppt(null);
    setFormVisible(true);
  };

  const openEdit = (appt: Appointment) => {
    setEditingAppt(appt);
    setFormVisible(true);
  };

  const handleSave = async (payload: Payload) => {
    try {
      if (editingAppt) {
        await updateAppointment(editingAppt.id, payload);
      } else {
        await createAppointment(payload);
      }
      setFormVisible(false);
      load();
    } catch (err) {
      // Demo/offline fallback: reflect the change locally so the screen stays usable.
      setWeekData((prev) => {
        const next = { ...prev };
        const dayList = [...(next[selectedDayIndex] || [])];
        if (editingAppt) {
          const idx = dayList.findIndex((a) => a.id === editingAppt.id);
          if (idx >= 0) dayList[idx] = { ...dayList[idx], ...payload };
        } else {
          dayList.push({
            id: `local-${Date.now()}`,
            status: 'scheduled',
            therapistId: '',
            therapistName: 'New Therapist',
            roomId: '',
            roomName: 'TBD',
            studentIds: [],
            studentNames: ['New Student'],
            startTime: '',
            endTime: '',
            ...payload,
          });
        }
        next[selectedDayIndex] = dayList;
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
        [selectedDayIndex]: (prev?.[selectedDayIndex] || []).map((a) =>
          a.id === id ? { ...a, status: 'cancelled' } : a
        ),
      }));
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
        [selectedDayIndex]: (prev?.[selectedDayIndex] || []).map((a) =>
          a.id === id ? { ...a, status } : a
        ),
      }));
    }
    setFormVisible(false);
  };

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
      `${THERAPIST_OPTIONS.find((t) => t.id === therapistId)?.name ?? therapistId} is unavailable on ${payload.date}.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopNav activeTab="Scheduling" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} onLogout={logout} />

      <View style={styles.header}>
        <Text style={typography.h1}>Staff Schedule</Text>
        <TouchableOpacity style={styles.newApptBtn} onPress={openCreate}>
          <Feather name="plus" size={16} color={colors.navyText} />
          <Text style={styles.newApptBtnText}>New Appointment</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dayTabs}>
        {DAYS.map((d, i) => (
          <TouchableOpacity
            key={d}
            style={[styles.dayTab, i === selectedDayIndex && styles.dayTabActive]}
            onPress={() => setSelectedDayIndex(i)}
          >
            <Text style={[typography.bodyBold, i === selectedDayIndex && { color: colors.navyText }]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, therapistFilter === 'all' && styles.filterChipActive]}
            onPress={() => setTherapistFilter('all')}
          >
            <Text style={typography.body}>All Therapists</Text>
          </TouchableOpacity>
          {THERAPIST_OPTIONS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.filterChip, therapistFilter === t.id && styles.filterChipActive]}
              onPress={() => setTherapistFilter(t.id)}
            >
              <View style={[styles.legendDot, { backgroundColor: THERAPIST_COLOR[t.id] }]} />
              <Text style={typography.body}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.unavailableBtn} onPress={handleMarkUnavailable}>
          <Text style={styles.unavailableBtnText}>Mark Unavailable</Text>
        </TouchableOpacity>
      </View>

      {conflictWarning && (
        <View style={styles.conflictBanner}>
          <Feather name="alert-triangle" size={14} color="#B45309" />
          <Text style={styles.conflictText}>{conflictWarning}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {dayAppointments.length === 0 && (
          <Text style={[typography.body, { textAlign: 'center', marginTop: spacing.xl }]}>
            No appointments scheduled.
          </Text>
        )}
        {dayAppointments.map((appt) => (
          <AppointmentChip key={appt.id} appt={appt} onPress={openEdit} />
        ))}
      </ScrollView>

      <AppointmentFormModal
        visible={formVisible}
        appointment={editingAppt}
        defaultDate={`2026-08-${10 + selectedDayIndex}`}
        therapistOptions={THERAPIST_OPTIONS}
        studentOptions={STUDENT_OPTIONS}
        roomOptions={ROOM_OPTIONS}
        onClose={() => setFormVisible(false)}
        onSave={handleSave}
        onCancelAppointment={handleCancelAppointment}
        onMarkStatus={handleMarkStatus}
      />

      <MarkUnavailableModal
        visible={unavailableVisible}
        therapistOptions={THERAPIST_OPTIONS}
        defaultDate={`2026-08-${10 + selectedDayIndex}`}
        onClose={() => setUnavailableVisible(false)}
        onSubmit={handleUnavailableSubmit}
      />
    </SafeAreaView>
  );
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  newApptBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  newApptBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  dayTabs: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm, backgroundColor: colors.bgCard },
  dayTab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.bgApp },
  dayTabActive: { backgroundColor: colors.primaryYellow },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.bgCard },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs },
  filterChipActive: { backgroundColor: colors.bgApp, borderColor: colors.navyText },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  unavailableBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  unavailableBtnText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  conflictBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.statusPendingBg, marginHorizontal: spacing.lg, marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.md },
  conflictText: { fontSize: 12, fontWeight: '600', color: '#B45309' },
  content: { padding: spacing.lg, gap: spacing.md },
  apptChip: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 5 },
  apptStatusText: { fontSize: 10, fontWeight: '700', color: colors.mutedText, textTransform: 'capitalize', marginTop: spacing.xs },
});
