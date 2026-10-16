import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius } from '../../../../theme/colors';
import { type TimeValue } from '../types';

interface TimePickerSelectorProps {
  value: TimeValue;
  onPress: () => void;
  accessibilityLabel?: string;
}

export const TimePickerSelector: React.FC<TimePickerSelectorProps> = React.memo(
  ({ value, onPress, accessibilityLabel }) => {
    return (
      <TouchableOpacity
        style={styles.timeInputContainer}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={
          accessibilityLabel ||
          `Select time, currently ${value.hour}:${value.minute} ${value.period}`
        }
      >
        <Text style={styles.timeValueText}>
          {value.hour}:{value.minute} {value.period}
        </Text>
        <Feather name="clock" size={14} color="#64748B" />
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timeValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
});
