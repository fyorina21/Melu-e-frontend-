import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius } from '../../../../theme/colors';
import { type TimeValue } from '../types';

interface TimePickerSelectorProps {
  value: TimeValue;
  onChange?: (val: TimeValue) => void;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export const TimePickerSelector: React.FC<TimePickerSelectorProps> = React.memo(
  ({ value, onChange, onPress, accessibilityLabel }) => {
    const [localText, setLocalText] = useState(`${value.hour}:${value.minute}`);
    const [isFocused, setIsFocused] = useState(false);

    // Only synchronize localText from external value when NOT actively typing
    useEffect(() => {
      if (!isFocused) {
        setLocalText(`${value.hour}:${value.minute}`);
      }
    }, [value.hour, value.minute, isFocused]);

    const handleTextChange = (text: string) => {
      setLocalText(text);
    };

    const commitParsedTime = (raw: string) => {
      const clean = raw.trim();
      let h = 8;
      let m = 0;

      // Match "HH:MM" or "H:MM" or "HH:M"
      const colonMatch = clean.match(/^(\d{1,2}):(\d{0,2})$/);
      if (colonMatch) {
        h = parseInt(colonMatch[1], 10);
        m = colonMatch[2] ? parseInt(colonMatch[2], 10) : 0;
      } else {
        // Match 3 or 4 digits like "830" or "0830" or "1230"
        const digitMatch = clean.match(/^(\d{1,2})(\d{2})$/);
        if (digitMatch) {
          h = parseInt(digitMatch[1], 10);
          m = parseInt(digitMatch[2], 10);
        } else {
          // Just a single or double digit hour like "8" or "10"
          const hourOnly = clean.match(/^(\d{1,2})$/);
          if (hourOnly) {
            h = parseInt(hourOnly[1], 10);
            m = 0;
          }
        }
      }

      if (isNaN(h) || h < 1) h = 8;
      if (h > 12) h = 12;
      if (isNaN(m) || m < 0) m = 0;
      if (m > 59) m = 59;

      const nextVal: TimeValue = {
        hour: String(h).padStart(2, '0'),
        minute: String(m).padStart(2, '0'),
        period: value.period,
      };

      setLocalText(`${nextVal.hour}:${nextVal.minute}`);
      if (onChange) {
        onChange(nextVal);
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      commitParsedTime(localText);
    };

    const togglePeriod = () => {
      const nextPeriod = value.period === 'AM' ? 'PM' : 'AM';
      if (onChange) {
        onChange({
          ...value,
          period: nextPeriod,
        });
      }
    };

    return (
      <View style={styles.timeInputContainer}>
        <Feather name="clock" size={14} color="#64748B" style={{ marginRight: 6 }} />
        <TextInput
          style={styles.timeTextInput}
          value={localText}
          onFocus={() => setIsFocused(true)}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          onSubmitEditing={handleBlur}
          placeholder="08:00"
          placeholderTextColor="#94A3B8"
          keyboardType="numbers-and-punctuation"
          accessibilityLabel={
            accessibilityLabel ||
            `Time input, currently ${value.hour}:${value.minute} ${value.period}`
          }
        />
        <TouchableOpacity
          style={styles.periodToggleBtn}
          onPress={togglePeriod}
          accessibilityRole="button"
          accessibilityLabel={`Toggle period, currently ${value.period}`}
        >
          <Text style={styles.periodToggleText}>{value.period}</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timeTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 2,
    fontVariant: ['tabular-nums'],
  },
  periodToggleBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 6,
  },
  periodToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  timeValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
});
