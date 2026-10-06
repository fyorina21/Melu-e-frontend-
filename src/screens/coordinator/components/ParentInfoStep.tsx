import React from 'react';
import { View, StyleSheet } from 'react-native';
import DynamicFormFields from '../../../components/DynamicFormFields';
import { spacing } from '../../../theme/colors';
import type { WizardState } from '../enrollmentWizardTypes';
import { WizardField } from './WizardField';

interface ParentInfoStepProps {
  form: WizardState;
  set: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  isFieldVisible: (label: string, defaultVisible?: boolean) => boolean;
  customValues: Record<string, any>;
  setCustomValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  formFields: any[];
}

export function ParentInfoStep({
  form,
  set,
  isFieldVisible,
  customValues,
  setCustomValues,
  formFields,
}: ParentInfoStepProps) {
  return (
    <View style={styles.container}>
      {isFieldVisible('Parent / Guardian Name') && isFieldVisible('Parent Name') && (
        <WizardField
          required
          label="Parent / Guardian Name"
          value={form.parentName}
          onChangeText={(t) => set('parentName', t)}
          placeholder="e.g. Maria Rivera"
        />
      )}

      {isFieldVisible('Phone') && isFieldVisible('Parent Phone') && (
        <WizardField
          required
          label="Phone"
          value={form.parentPhone}
          onChangeText={(t) => set('parentPhone', t)}
          keyboardType="phone-pad"
          maxWidth
          placeholder="(555) 000-0000"
        />
      )}

      {isFieldVisible('Email') && isFieldVisible('Parent Email') && (
        <WizardField
          label="Email"
          value={form.parentEmail}
          onChangeText={(t) => set('parentEmail', t)}
          keyboardType="email-address"
          maxWidth
          placeholder="guardian@example.com"
          hint="Optional"
        />
      )}

      <DynamicFormFields
        formName="Enrollment Wizard"
        section="Parent Info"
        initialFields={formFields.length ? formFields : undefined}
        values={customValues}
        onChange={(key, val) => setCustomValues((prev) => ({ ...prev, [key]: val }))}
        excludeStandardLabels={[
          'Parent / Guardian Name',
          'Parent Name',
          'Phone',
          'Parent Phone',
          'Email',
          'Parent Email',
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
});
