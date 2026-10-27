import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { StaffOption } from '../../../api/optionsApi';
import { colors, radius, spacing } from '../../../theme/colors';
import { type WizardState } from '../enrollmentWizardTypes';

interface AssignTherapistStepProps {
  form: WizardState;
  set: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  therapists: StaffOption[];
}

export function AssignTherapistStep({ form, set, therapists }: AssignTherapistStepProps) {
  const caseloadOf = (name: string) =>
    therapists.find((t) => t.name === name)?.assignedStudents?.length ?? 0;
  const therapistNames = therapists.map((t) => t.name);

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          Therapist / Staff Member <Text style={styles.requiredStar}>*</Text>
        </Text>
        <Text style={styles.fieldHint}>
          Select an assigned primary therapist or staff member for this student.
        </Text>
        {therapistNames.length ? (
          <View style={styles.chipRow}>
            {therapists.map((t) => {
              const count = t.assignedStudents?.length ?? 0;
              const selected = form.therapist === t.name;
              return (
                <TouchableOpacity
                  key={t.name}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => set('therapist', t.name)}
                  accessibilityRole="radio"
                  accessibilityLabel={`${t.name}${count > 0 ? `, ${count} students assigned` : ''}`}
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {t.name}
                    {count > 0 ? ` (${count} assigned)` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.fieldHint}>No staff members available.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  field: { gap: spacing.xs },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 2 },
  requiredStar: { color: '#DC2626', fontWeight: '700' },
  fieldHint: { fontSize: 12, color: '#9CA3AF', marginTop: 2, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  chipSelected: { backgroundColor: '#FCD34D', borderColor: '#FCD34D' },
  chipDisabled: { opacity: 0.45, borderStyle: 'dashed' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  chipTextSelected: { color: '#1F2937', fontWeight: '700' },
  chipTextDisabled: { color: '#9CA3AF' },
  capacityWarning: { color: '#DC2626', fontSize: 12, fontWeight: '600', marginTop: 6 },
});
