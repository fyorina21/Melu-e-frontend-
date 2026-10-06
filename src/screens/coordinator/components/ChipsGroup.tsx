import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../theme/colors';

interface ChipsGroupProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabledOptions?: string[];
  renderBadge?: (opt: string) => React.ReactNode;
}

export function ChipsGroup({
  options,
  value,
  onChange,
  disabledOptions = [],
  renderBadge,
}: ChipsGroupProps) {
  return (
    <View style={styles.chipRow} accessibilityRole="radiogroup">
      {options.map((opt) => {
        const isSelected = value === opt;
        const isDisabled = disabledOptions.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            disabled={isDisabled}
            style={[
              styles.chip,
              isSelected && styles.chipSelected,
              isDisabled && styles.chipDisabled,
            ]}
            onPress={() => onChange(opt)}
            accessibilityRole="radio"
            accessibilityLabel={opt}
            accessibilityState={{ selected: isSelected, disabled: isDisabled }}
          >
            <Text
              style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
                isDisabled && styles.chipTextDisabled,
              ]}
            >
              {opt}
            </Text>
            {renderBadge?.(opt)}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  chipSelected: { backgroundColor: '#FCD34D', borderColor: '#FCD34D' },
  chipDisabled: { opacity: 0.45, borderStyle: 'dashed' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  chipTextSelected: { color: '#1F2937', fontWeight: '700' },
  chipTextDisabled: { color: '#9CA3AF' },
});
