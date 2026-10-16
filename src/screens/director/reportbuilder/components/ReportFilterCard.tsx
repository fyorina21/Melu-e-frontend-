// src/screens/director/reportbuilder/components/ReportFilterCard.tsx

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import {
  PROGRAMS,
  PERIODS,
  SCORE_FILTERS,
  GOAL_STATUSES,
  BEHAVIOR_TYPES,
  DIAGNOSES,
  ATTENDANCE_OPTIONS,
  AGE_OPTIONS,
  type ReportFilterState,
} from '../reportBuilderTypes';

interface ReportFilterCardProps {
  filters: ReportFilterState;
  onFilterChange: <K extends keyof ReportFilterState>(key: K, value: ReportFilterState[K]) => void;
  therapists: string[];
  generating: boolean;
  onGenerate: () => void;
  onOpenPicker: (data: {
    title: string;
    options: string[];
    selected: string;
    onSelect: (val: string) => void;
  }) => void;
}

export const ReportFilterCard: React.FC<ReportFilterCardProps> = React.memo(
  ({ filters, onFilterChange, therapists, generating, onGenerate, onOpenPicker }) => {
    const renderSelectButton = (
      label: string,
      value: string,
      options: string[],
      onSelect: (v: string) => void,
    ) => (
      <View style={styles.filterCol}>
        <Text style={styles.filterLabel}>{label}</Text>
        <TouchableOpacity
          style={styles.selectDropdown}
          onPress={() =>
            onOpenPicker({
              title: label,
              options,
              selected: value,
              onSelect,
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`Select ${label}, current value is ${value}`}
        >
          <Text style={styles.selectDropdownText} numberOfLines={1}>
            {value}
          </Text>
          <Feather name="chevron-down" size={14} color={colors.bodyText} />
        </TouchableOpacity>
      </View>
    );

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Report Criteria & Filter Parameters</Text>

        {/* Row 1 */}
        <View style={styles.filterGrid}>
          {renderSelectButton('Therapy Program', filters.program, PROGRAMS, (v) =>
            onFilterChange('program', v),
          )}
          {renderSelectButton('Assigned Therapist', filters.therapist, therapists, (v) =>
            onFilterChange('therapist', v),
          )}
        </View>

        {/* Row 2 */}
        <View style={styles.filterGrid}>
          {renderSelectButton('Age Bracket', filters.ageRange, AGE_OPTIONS, (v) =>
            onFilterChange('ageRange', v),
          )}
          {renderSelectButton(
            'Attendance Threshold',
            filters.attendanceFilter,
            ATTENDANCE_OPTIONS,
            (v) => onFilterChange('attendanceFilter', v),
          )}
        </View>

        {/* Row 3 */}
        <View style={styles.filterGrid}>
          {renderSelectButton('Reporting Period', filters.period, PERIODS, (v) =>
            onFilterChange('period', v),
          )}
          {renderSelectButton('Clinical Diagnosis', filters.diagnosis, DIAGNOSES, (v) =>
            onFilterChange('diagnosis', v),
          )}
        </View>

        {/* Row 4 */}
        <View style={styles.filterGrid}>
          {renderSelectButton('Assessment Score', filters.scoreFilter, SCORE_FILTERS, (v) =>
            onFilterChange('scoreFilter', v),
          )}
          {renderSelectButton('Goal Progress Status', filters.goalStatus, GOAL_STATUSES, (v) =>
            onFilterChange('goalStatus', v),
          )}
        </View>

        {/* Row 5 */}
        <View style={styles.filterGrid}>
          {renderSelectButton(
            'Target Behavior Category',
            filters.behaviorType,
            BEHAVIOR_TYPES,
            (v) => onFilterChange('behaviorType', v),
          )}
          <View style={styles.filterCol}>
            <Text style={styles.filterLabel}>Student Name Search</Text>
            <View style={styles.searchWrap}>
              <Feather name="search" size={14} color={colors.mutedText} />
              <TextInput
                style={styles.searchInput}
                placeholder="Optional student name..."
                placeholderTextColor={colors.mutedText}
                value={filters.studentSearch}
                onChangeText={(v) => onFilterChange('studentSearch', v)}
                accessibilityRole="search"
                accessibilityLabel="Optional student name search"
              />
            </View>
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={onGenerate}
          disabled={generating}
          accessibilityRole="button"
          accessibilityLabel="Generate Report Results"
          accessibilityState={{ busy: generating, disabled: generating }}
        >
          <Feather name="play" size={16} color={colors.navyText} />
          <Text style={styles.generateBtnText}>
            {generating ? 'Generating Custom Report...' : 'Generate Report Results'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  filterGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  filterCol: {
    flexGrow: 1,
    minWidth: 220,
    gap: spacing.xs,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.bodyText,
  },
  selectDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.bgApp,
  },
  selectDropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
    flex: 1,
    paddingRight: 6,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgApp,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.navyText,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  generateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
});
