import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../../theme/colors';
import { type TimeValue } from '../types';
import { TimePickerSelector } from './TimePickerSelector';

interface SessionScheduleCardProps {
  morningStart: TimeValue;
  morningEnd: TimeValue;
  afternoonStart: TimeValue;
  afternoonEnd: TimeValue;
  preTherapyDuration: string;
  onPreTherapyDurationChange: (val: string) => void;
  onOpenPicker: (field: 'morningStart' | 'morningEnd' | 'afternoonStart' | 'afternoonEnd') => void;
}

export const SessionScheduleCard: React.FC<SessionScheduleCardProps> = React.memo(
  ({
    morningStart,
    morningEnd,
    afternoonStart,
    afternoonEnd,
    preTherapyDuration,
    onPreTherapyDurationChange,
    onOpenPicker,
  }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Session Schedule & Operational Hours</Text>
          <Feather name="chevron-up" size={18} color="#64748B" />
        </View>

        {/* Morning Row */}
        <View style={styles.gridRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.label}>Morning Round Start</Text>
            <TimePickerSelector value={morningStart} onPress={() => onOpenPicker('morningStart')} />
          </View>

          <View style={styles.fieldCol}>
            <Text style={styles.label}>Morning Round End</Text>
            <TimePickerSelector value={morningEnd} onPress={() => onOpenPicker('morningEnd')} />
          </View>
        </View>

        {/* Afternoon Row */}
        <View style={styles.gridRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.label}>Afternoon Round Start</Text>
            <TimePickerSelector
              value={afternoonStart}
              onPress={() => onOpenPicker('afternoonStart')}
            />
          </View>

          <View style={styles.fieldCol}>
            <Text style={styles.label}>Afternoon Round End</Text>
            <TimePickerSelector value={afternoonEnd} onPress={() => onOpenPicker('afternoonEnd')} />
          </View>
        </View>

        {/* Pre-Therapy Duration */}
        <View style={styles.singleFieldRow}>
          <Text style={styles.label}>Pre-Therapy Duration (minutes)</Text>
          <TextInput
            style={styles.numberInput}
            value={preTherapyDuration}
            onChangeText={onPreTherapyDurationChange}
            keyboardType="number-pad"
            placeholder="30"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  fieldCol: {
    flex: 1,
    minWidth: 180,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  singleFieldRow: {
    gap: 6,
    maxWidth: 240,
  },
  numberInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
});
