import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import DynamicFormFields from '../../../../components/DynamicFormFields';
import { colors, radius, spacing } from '../../../../theme/colors';

interface StrategiesProtocolsTabProps {
  reinforcementSchedule: string;
  accommodations: string;
  crisisProtocol: string;
  reviewCycle: string;
  customIupValues: Record<string, any>;
  onReinforcementScheduleChange: (val: string) => void;
  onAccommodationsChange: (val: string) => void;
  onCrisisProtocolChange: (val: string) => void;
  onReviewCycleChange: (val: string) => void;
  onCustomIupValuesChange: (key: string, val: any) => void;
}

const REVIEW_CYCLES = ['4 Weeks', '6 Weeks', '8 Weeks', 'Quarterly'];

export function StrategiesProtocolsTab({
  reinforcementSchedule,
  accommodations,
  crisisProtocol,
  reviewCycle,
  customIupValues,
  onReinforcementScheduleChange,
  onAccommodationsChange,
  onCrisisProtocolChange,
  onReviewCycleChange,
  onCustomIupValuesChange,
}: StrategiesProtocolsTabProps) {
  return (
    <View style={styles.tabContentWrap}>
      <View style={styles.card}>
        <DynamicFormFields
          formName="IUP Form"
          values={customIupValues}
          onChange={onCustomIupValuesChange}
          excludeStandardLabels={[
            'Student Name',
            'Target Skill Domain',
            'Baseline Mastery (%)',
            'Target Objective',
            'Environmental Accommodations & Visual Supports',
            'Crisis De-escalation Protocol',
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContentWrap: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
    marginBottom: spacing.md,
  },
  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.navyText,
  },
  fieldTextArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  cycleRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  cycleChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  cycleChipSelected: {
    backgroundColor: '#FEF08A',
  },
  cycleChipText: {
    fontSize: 12,
    color: colors.bodyText,
    fontWeight: '600',
  },
  cycleChipTextSelected: {
    color: colors.navyText,
    fontWeight: '700',
  },
});
