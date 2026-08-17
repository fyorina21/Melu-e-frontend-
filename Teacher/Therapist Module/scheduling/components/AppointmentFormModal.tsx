// screens/scheduling/components/AppointmentFormModal.js
// MR-39: Appointment & Session Management
//
// Handles the full appointment lifecycle per the issues doc: Create, Edit,
// Cancel, Reschedule, Mark Completed, Mark Missed (No Show). Reused from
// both the Scheduling Calendar (MR-38, tap a slot) and could be reused by
// a standalone appointment list if one gets built later.

import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import type { Payload } from '../../../types';

const STATUS_FLOW: string[] = ['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed'];
const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};
const STATUS_COLOR: Record<string, string> = {
  scheduled: colors.statusNotStartedBg,
  confirmed: colors.statusInProgressBg,
  checked_in: '#DDD6FE',
  in_progress: colors.statusPendingBg,
  completed: colors.statusApprovedBg,
  cancelled: colors.statusRevisionBg,
  no_show: colors.statusRevisionBg,
};

export interface AppointmentOption {
  id: string;
  name: string;
}

export interface Appointment {
  id: string;
  status: string;
  therapistId?: string | null;
  therapistName?: string;
  roomId?: string | null;
  roomName?: string;
  studentIds?: string[];
  studentNames?: string[];
  startTime?: string;
  endTime?: string;
  date?: string;
}

interface Props {
  visible: boolean;
  appointment: Appointment | null; // null = creating new; object = editing existing
  defaultDate?: string;
  defaultStartTime?: string;
  therapistOptions?: AppointmentOption[];
  studentOptions?: AppointmentOption[];
  roomOptions?: AppointmentOption[];
  onClose: () => void;
  onSave: (payload: Payload) => void;
  onCancelAppointment?: (appointmentId: string) => void;
  onReschedule?: (appointmentId: string, payload: Payload) => void;
  onMarkStatus?: (appointmentId: string, status: string) => void;
}

export default function AppointmentFormModal({
  visible,
  appointment, // null = creating new; object = editing existing
  defaultDate,
  defaultStartTime,
  therapistOptions = [],
  studentOptions = [],
  roomOptions = [],
  onClose,
  onSave,
  onCancelAppointment,
  onReschedule,
  onMarkStatus,
}: Props) {
  const isEditing = !!appointment;

  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [therapistId, setTherapistId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [date, setDate] = useState(defaultDate || '');
  const [startTime, setStartTime] = useState(defaultStartTime || '');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (appointment) {
      setStudentIds(appointment.studentIds || []);
      setTherapistId(appointment.therapistId || null);
      setRoomId(appointment.roomId || null);
      setDate(appointment.date || '');
      setStartTime(appointment.startTime || '');
      setEndTime(appointment.endTime || '');
    } else {
      setStudentIds([]);
      setTherapistId(null);
      setRoomId(null);
      setDate(defaultDate || '');
      setStartTime(defaultStartTime || '');
      setEndTime('');
    }
  }, [appointment, visible, defaultDate, defaultStartTime]);

  const toggleStudent = (id: string) => {
    setStudentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = () => {
    if (!therapistId || studentIds.length === 0 || !date || !startTime || !endTime) {
      Alert.alert('Missing info', 'Therapist, at least one student, date, and time are required.');
      return;
    }
    onSave?.({ studentIds, therapistId, roomId, date, startTime, endTime });
  };

  const handleCancel = () => {
    Alert.alert('Cancel appointment?', 'This cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel Appointment',
        style: 'destructive',
        onPress: () => appointment?.id && onCancelAppointment?.(appointment.id),
      },
    ]);
  };

  const handleMarkMissed = () => {
    Alert.alert('Mark as No Show?', undefined, [
      { text: 'Back', style: 'cancel' },
      {
        text: 'Mark No Show',
        style: 'destructive',
        onPress: () => appointment?.id && onMarkStatus?.(appointment.id, 'no_show'),
      },
    ]);
  };

  const currentStatusIdx = appointment ? STATUS_FLOW.indexOf(appointment.status) : -1;
  const nextStatus = currentStatusIdx >= 0 && currentStatusIdx < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentStatusIdx + 1]
    : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>{isEditing ? 'Edit Appointment' : 'New Appointment'}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <Feather name="x" size={22} color={colors.navyText} />
            </TouchableOpacity>
          </View>

          {isEditing && (
            <View style={styles.statusRow}>
              <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[appointment.status] }]}>
                <Text style={styles.statusPillText}>{STATUS_LABEL[appointment.status]}</Text>
              </View>
            </View>
          )}

          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.field}>
              <Text style={typography.label}>Students</Text>
              <View style={styles.chipRow}>
                {studentOptions.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.chip, studentIds.includes(s.id) && styles.chipSelected]}
                    onPress={() => toggleStudent(s.id)}
                  >
                    <Text style={[styles.chipText, studentIds.includes(s.id) && styles.chipTextSelected]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={typography.label}>Therapist</Text>
              <View style={styles.chipRow}>
                {therapistOptions.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.chip, therapistId === t.id && styles.chipSelected]}
                    onPress={() => setTherapistId(t.id)}
                  >
                    <Text style={[styles.chipText, therapistId === t.id && styles.chipTextSelected]}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={typography.label}>Room</Text>
              <View style={styles.chipRow}>
                {roomOptions.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.chip, roomId === r.id && styles.chipSelected]}
                    onPress={() => setRoomId(r.id)}
                  >
                    <Text style={[styles.chipText, roomId === r.id && styles.chipTextSelected]}>{r.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.row3}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={typography.label}>Date</Text>
                <TextInput style={styles.textInput} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedText} />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={typography.label}>Start</Text>
                <TextInput style={styles.textInput} value={startTime} onChangeText={setStartTime} placeholder="9:00 AM" placeholderTextColor={colors.mutedText} />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={typography.label}>End</Text>
                <TextInput style={styles.textInput} value={endTime} onChangeText={setEndTime} placeholder="10:30 AM" placeholderTextColor={colors.mutedText} />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {isEditing && (
              <>
                <TouchableOpacity style={styles.dangerBtn} onPress={handleCancel}>
                  <Text style={styles.dangerBtnText}>Cancel Appt.</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dangerBtn} onPress={handleMarkMissed}>
                  <Text style={styles.dangerBtnText}>No Show</Text>
                </TouchableOpacity>
              </>
            )}
            {isEditing && nextStatus && (
              <TouchableOpacity style={styles.advanceBtn} onPress={() => onMarkStatus?.(appointment.id, nextStatus)}>
                <Text style={styles.advanceBtnText}>Mark {STATUS_LABEL[nextStatus]}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Create Appointment'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bgCard, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  statusRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  statusPillText: { fontWeight: '700', fontSize: 12, color: colors.navyText },
  body: { padding: spacing.lg, gap: spacing.lg },
  field: { gap: spacing.xs },
  row3: { flexDirection: 'row', gap: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.bgApp },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  chipTextSelected: { color: colors.navyText },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  dangerBtn: { borderWidth: 1, borderColor: '#EF4444', borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md, alignItems: 'center' },
  dangerBtnText: { fontWeight: '600', color: '#EF4444', fontSize: 12 },
  advanceBtn: { flex: 1, backgroundColor: '#DDD6FE', borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', minWidth: 120 },
  advanceBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  saveBtn: { flex: 2, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', minWidth: 150 },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
