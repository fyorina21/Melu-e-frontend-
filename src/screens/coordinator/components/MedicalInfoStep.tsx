import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../../../theme/colors';
import type { WizardState } from '../enrollmentWizardTypes';
import { DynamicFieldItem } from './DynamicFieldItem';

interface MedicalInfoStepProps {
  form: WizardState;
  set: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  isFieldVisible?: (label: string, defaultVisible?: boolean) => boolean;
  customValues?: Record<string, any>;
  setCustomValues?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  formFields: any[];
}

export function MedicalInfoStep({
  form,
  set,
  isFieldVisible,
  customValues = {},
  setCustomValues,
  formFields,
}: MedicalInfoStepProps) {
  // Dynamically filter fields belonging to 'Medical Info' from Form Builder schema
  const stepFields = formFields.filter(
    (f) =>
      f.visible !== false &&
      f.section?.toLowerCase().trim() === 'medical info' &&
      (isFieldVisible ? isFieldVisible(f.label) : true),
  );

  return (
    <View style={styles.container}>
      {stepFields.map((field) => {
        const value = customValues[field.id] ?? (form as any)[field.id] ?? '';
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
              if (normLabel.includes('diagnosis')) {
                set('diagnosis', val);
              } else if (normLabel.includes('medical') || normLabel.includes('note')) {
                set('medicalNotes', val);
              } else if (normLabel.includes('transportation')) {
                set('transportation', val);
              }
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
});
