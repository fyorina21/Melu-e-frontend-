// components/DobPicker.tsx
// Native (iOS/Android) date-of-birth picker wrapping
// @react-native-community/datetimepicker. Web uses DobPicker.web.tsx.

import React from 'react';
import { View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Props {
  value: Date;
  maximumDate?: Date;
  onChange: (iso: string) => void;
}

export default function DobPicker({ value, maximumDate, onChange }: Props) {
  return (
    <View>
      <DateTimePicker
        value={value}
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
