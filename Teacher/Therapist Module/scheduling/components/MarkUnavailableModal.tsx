// screens/scheduling/components/MarkUnavailableModal.tsx
// SCR-TC-005 / MR-38: Mark a teacher/therapist unavailable on a given
// date with a reason. Reused by the Scheduling Calendar (teacher) and the
// Coordinator Operational Management screen. Wires to
// markTeacherUnavailable() from the session API.

import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

const REASONS = ['Sick Leave', 'Training', 'Personal', 'Holiday', 'Other'];

export interface UnavailableOption {
  id: string;
  name: string;
}

interface Props {
  visible: boolean;
  therapistOptions?: UnavailableOption[];
  defaultDate?: string;
  onClose: () => void;
  onSubmit: (therapistId: string, payload: { date: string; reason: string }) => void;
}

export default function MarkUnavailableModal({
  visible,
  therapistOptions = [],
  defaultDate = '',
  onClose,
  onSubmit,
}: Props) {
  const [therapistId, setTherapistId] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [date, setDate] = useState(defaultDate);

  useEffect(() => {
    if (visible) {
      setTherapistId(null);
      setReason(null);
      setDate(defaultDate);
    }
  }, [visible, defaultDate]);

  const handleSubmit = () => {
    if (!therapistId) { Alert.alert('Missing info', 'Choose a therapist.'); return; }
    if (!reason) { Alert.alert('Missing info', 'Choose a reason.'); return; }
    if (!date.trim()) { Alert.alert('Missing info', 'Enter a date.'); return; }
    onSubmit(therapistId, { date: date.trim(), reason });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>Mark Teacher Unavailable</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <Feather name="x" size={22} color={colors.navyText} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
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
              <Text style={typography.label}>Reason</Text>
              <View style={styles.chipRow}>
                {REASONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.chip, reason === r && styles.chipSelected]}
                    onPress={() => setReason(r)}
                  >
                    <Text style={[styles.chipText, reason === r && styles.chipTextSelected]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={typography.label}>Date</Text>
              <TextInput
                style={styles.textInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.note}>
              <Feather name="info" size={14} color={colors.mutedText} />
              <Text style={styles.noteText}>The teacher's appointments for this date will be flagged for reassignment.</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
              <Text style={styles.saveBtnText}>Mark Unavailable</Text>
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
  body: { padding: spacing.lg, gap: spacing.lg },
  field: { gap: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.bgApp },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  chipTextSelected: { color: colors.navyText },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText },
  note: { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start', backgroundColor: colors.bgApp, borderRadius: radius.md, padding: spacing.md },
  noteText: { fontSize: 12, color: colors.mutedText, flex: 1 },
  footer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  saveBtn: { flex: 2, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
