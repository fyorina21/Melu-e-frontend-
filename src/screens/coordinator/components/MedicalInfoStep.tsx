import React from 'react';
import { View, StyleSheet } from 'react-native';
import DynamicFormFields from '../../../components/DynamicFormFields';
import { spacing } from '../../../theme/colors';
import type { WizardState } from '../enrollmentWizardTypes';
import { WizardField } from './WizardField';

interface MedicalInfoStepProps {
  form: WizardState;
  set: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  isFieldVisible: (label: string, defaultVisible?: boolean) => boolean;
  customValues: Record<string, any>;
  setCustomValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  formFields: any[];
}

export function MedicalInfoStep({
  form,
  set,
  isFieldVisible,
  customValues,
  setCustomValues,
  formFields,
}: MedicalInfoStepProps) {
  return (
    <View style={styles.container}>
      {isFieldVisible('Diagnosis') && (
        <WizardField
          label="Diagnosis"
          value={form.diagnosis}
          onChangeText={(t) => set('diagnosis', t)}
          placeholder="e.g. Autism Spectrum Disorder"
        />
      )}

      {isFieldVisible('Medical Notes') && (
        <WizardField
          label="Medical Notes"
          value={form.medicalNotes}
          onChangeText={(t) => set('medicalNotes', t)}
          multiline
          placeholder="Enter any relevant medical notes..."
        />
      )}

      <DynamicFormFields
        formName="Enrollment Wizard"
        section="Medical Info"
        initialFields={formFields.length ? formFields : undefined}
        values={customValues}
        onChange={(key, val) => setCustomValues((prev) => ({ ...prev, [key]: val }))}
        excludeStandardLabels={['Diagnosis', 'Medical Notes']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
});
