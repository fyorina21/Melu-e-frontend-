// components/DobPicker.tsx
// Native (iOS/Android) date-of-birth picker wrapping
// @react-native-community/datetimepicker. Web uses DobPicker.web.tsx.

import React from 'react';
import { View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Props {
  value?: Date | string | null;
  maximumDate?: Date;
  onChange: (iso: string) => void;
  placeholder?: string;
}

export default function DobPicker({ value, maximumDate, onChange }: Props) {
  const dateObj = value
    ? typeof value === 'string'
      ? new Date(`${value}T00:00:00`)
      : value
    : new Date(2018, 0, 1);

  return (
    <View>
      <DateTimePicker
        value={dateObj}
        mode="date"
        display="default"
        maximumDate={maximumDate}
        onChange={(e) => {
          const ts = e.nativeEvent?.timestamp;
          if (ts) onChange(new Date(ts).toISOString().slice(0, 10));
        }}
      />
    </View>
  );
}
