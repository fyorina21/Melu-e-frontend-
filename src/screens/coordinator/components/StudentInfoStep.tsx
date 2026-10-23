import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../../../theme/colors';
import type { WizardState } from '../enrollmentWizardTypes';
import { DynamicFieldItem } from './DynamicFieldItem';

interface StudentInfoStepProps {
  form: WizardState;
  set: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  isFieldVisible?: (label: string, defaultVisible?: boolean) => boolean;
  onTakePhoto?: () => void;
  onChoosePhoto?: () => void;
  onRemovePhoto?: () => void;
  customValues?: Record<string, any>;
  setCustomValues?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  formFields: any[];
}

export function StudentInfoStep({
  form,
  set,
  isFieldVisible,
  onTakePhoto,
  onChoosePhoto,
  onRemovePhoto,
  customValues = {},
  setCustomValues,
  formFields,
}: StudentInfoStepProps) {
  // Dynamically filter fields belonging to 'Student Info' from Form Builder schema
  const stepFields = formFields.filter(
    (f) =>
      f.visible !== false &&
      (f.section?.toLowerCase().trim() === 'student info' || !f.section) &&
      (isFieldVisible ? isFieldVisible(f.label) : true),
  );

  return (
    <View style={styles.container}>
      {stepFields.map((field) => {
        const value = customValues[field.id] ?? (form as any)[field.id] ?? form.name ?? '';
        return (
          <DynamicFieldItem
            key={field.id}
            field={field}
            value={value}
            onChange={(val) => {
              if (setCustomValues) {
                setCustomValues((prev) => ({ ...prev, [field.id]: val }));
              }
              const normLabel = (field.label || '').toLowerCase();
              if (normLabel.includes('student') || normLabel.includes('name')) {
                set('name', val);
              } else if (normLabel.includes('birth') || normLabel.includes('dob')) {
                set('dob', val);
              } else if (normLabel.includes('gender')) {
                set('gender', val);
              } else if (normLabel.includes('program')) {
                set('program', val);
              } else if (normLabel.includes('therapy')) {
                set('therapyGroup', val);
              }
            }}
            onTakePhoto={onTakePhoto}
            onChoosePhoto={onChoosePhoto}
            onRemovePhoto={onRemovePhoto}
            studentDob={form.dob}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
});
