// components/DobPicker.web.tsx
// Web date-of-birth picker rendered as a native HTML date input,
// because @react-native-community/datetimepicker has no web build.

import React from 'react';

interface Props {
  value: Date;
  maximumDate?: Date;
  onChange: (iso: string) => void;
}

function toISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function DobPicker({ value, maximumDate, onChange }: Props) {
  return (
    <input
      type="date"
      value={toISO(value)}
      max={maximumDate ? toISO(maximumDate) : undefined}
      onChange={(e) => {
        if (e.target.value) onChange(e.target.value);
      }}
      style={{
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        padding: '12px',
        backgroundColor: '#F4F5F7',
        fontSize: 14,
        color: '#111827',
        fontFamily: 'inherit',
      }}
    />
  );
}
