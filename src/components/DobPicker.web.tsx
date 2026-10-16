// components/DobPicker.web.tsx
// Web date-of-birth picker rendered as a native HTML date input,
// because @react-native-community/datetimepicker has no web build.

import React from 'react';

interface Props {
  value?: Date | string | null;
  maximumDate?: Date;
  onChange: (iso: string) => void;
  placeholder?: string;
}

function toISO(d?: Date | string | null): string {
  if (!d) return '';
  if (typeof d === 'string') return d;
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function DobPicker({
  value,
  maximumDate,
  onChange,
  placeholder = 'dd/mm/yyyy',
}: Props) {
  const formattedValue = toISO(value);

  return (
    <input
      type="date"
      aria-label="Date of Birth"
      placeholder={placeholder}
      value={formattedValue}
      max={maximumDate ? toISO(maximumDate) : undefined}
      onChange={(e) => {
        onChange(e.target.value || '');
      }}
      style={{
        border: '1px solid #D1D5DB',
        borderRadius: 10,
        padding: '11px 14px',
        backgroundColor: '#FFFFFF',
        fontSize: 14,
        color: formattedValue ? '#1F2937' : '#9CA3AF',
        fontFamily: 'inherit',
        maxWidth: 320,
        width: '100%',
        boxSizing: 'border-box',
        outline: 'none',
      }}
    />
  );
}
