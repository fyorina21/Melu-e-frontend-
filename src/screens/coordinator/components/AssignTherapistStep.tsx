import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { StaffOption } from '../../../api/optionsApi';
import { colors, radius, spacing } from '../../../theme/colors';
import { type WizardState, MAX_CASELOAD } from '../enrollmentWizardTypes';
import { resolveEnrichedTherapists } from '../StudentEnrollmentWizardScreen';

interface AssignTherapistStepProps {
  form: WizardState;
  set: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  therapists: StaffOption[];
}

export function AssignTherapistStep({ form, set, therapists }: AssignTherapistStepProps) {
  const enrichedTherapists = React.useMemo(
    () => resolveEnrichedTherapists(therapists),
    [therapists],
  );
  const caseloadOf = (name: string) =>
    enrichedTherapists.find((t) => t.name === name)?.assignedStudents?.length ?? 0;
  // Teachers can be assigned to more than two students at a time for assessment
  const isFull = (_name: string) => false;
  const therapistNames = enrichedTherapists.map((t) => t.name);

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          Therapist / Staff Member <Text style={styles.requiredStar}>*</Text>
        </Text>
        <Text style={styles.fieldHint}>
          Teachers can be assigned to more than two students at a time for assessment.
        </Text>
        {therapistNames.length ? (
          <View style={styles.chipRow}>
            {enrichedTherapists.map((t) => {
              const count = t.assignedStudents?.length ?? 0;
              const full = isFull(t.name);
              const selected = form.therapist === t.name;
              return (
                <TouchableOpacity
                  key={t.name}
                  disabled={full}
                  style={[
                    styles.chip,
                    selected && styles.chipSelected,
                    full && styles.chipDisabled,
                  ]}
                  onPress={() => set('therapist', t.name)}
                  accessibilityRole="radio"
                  accessibilityLabel={`${t.name}, ${count} students assigned for assessment`}
                  accessibilityState={{ selected, disabled: full }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                      full && styles.chipTextDisabled,
                    ]}
                  >
                    {t.name} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.fieldHint}>No staff members available.</Text>
        )}

        {form.therapist && isFull(form.therapist) && (
          <Text style={styles.capacityWarning}>
            {form.therapist} is at capacity — pick an available staff member to continue.
          </Text>
        )}

        {therapistNames.length > 0 && therapistNames.every(isFull) && (
          <Text style={styles.capacityWarning}>
            All staff members are at maximum capacity. Reassign a student before enrolling
            another.
          </Text>
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
