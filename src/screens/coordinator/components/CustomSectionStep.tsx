import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DynamicFormFields from '../../../components/DynamicFormFields';
import { spacing } from '../../../theme/colors';

interface CustomSectionStepProps {
  currentStep: string;
  customValues: Record<string, any>;
  setCustomValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  formFields: any[];
}

export function CustomSectionStep({
  currentStep,
  customValues,
  setCustomValues,
  formFields,
}: CustomSectionStepProps) {
  const fieldsForSection = formFields.filter(
    (f) =>
      f.visible !== false && f.section?.toLowerCase().trim() === currentStep.toLowerCase().trim(),
  );

  return (
    <View style={styles.container}>
      <View style={styles.customSectionHeader}>
        <Feather name="folder" size={16} color="#0284C7" />
        <Text style={styles.customSectionTitle}>{currentStep}</Text>
      </View>
      <Text style={styles.customSectionSubtitle}>
        Please fill in the information for {currentStep}.
      </Text>
      <DynamicFormFields
        formName="Enrollment Wizard"
        section={currentStep}
        initialFields={formFields.length ? formFields : undefined}
        values={customValues}
        onChange={(key, val) => setCustomValues((prev) => ({ ...prev, [key]: val }))}
      />
      {fieldsForSection.length === 0 && (
        <View style={styles.emptyCustomStepBox}>
          <Feather name="info" size={16} color="#64748B" />
          <Text style={styles.emptyCustomStepText}>
            No custom fields have been added to "{currentStep}" yet. You can add and customize
            fields for this info type in the Form Builder.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  customSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  customSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  customSectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  emptyCustomStepBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  emptyCustomStepText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
});
