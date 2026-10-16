import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { type TrialLayout } from '../types';

interface TrialLayoutConfigCardProps {
  layout: TrialLayout;
  onLayoutChange: (layout: TrialLayout) => void;
  streamCount: number;
  onStreamCountChange: (count: number) => void;
}

export const TrialLayoutConfigCard: React.FC<TrialLayoutConfigCardProps> = React.memo(
  ({ layout, onLayoutChange, streamCount, onStreamCountChange }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trial Stream Layout</Text>
        <View style={styles.radioGroup}>
          {(['Horizontal', 'Vertical', 'Card Grid'] as const).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.radioRow}
              onPress={() => onLayoutChange(opt)}
              accessibilityRole="radio"
              accessibilityState={{ checked: layout === opt }}
              accessibilityLabel={`Select ${opt} trial stream layout`}
            >
              <View style={[styles.radioOuter, layout === opt && styles.radioOuterActive]}>
                {layout === opt && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.streamCountWrap}>
          <Text style={styles.fieldLabel}>Trial Stream Count (3–20)</Text>
          <TextInput
            value={String(streamCount)}
            onChangeText={(e) => onStreamCountChange(Number(e) || 0)}
            style={styles.numberInput}
            keyboardType="numeric"
          />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardTitle: { ...typography.h3 },
  radioGroup: { flexDirection: 'column', gap: 8 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: '#0284C7' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0284C7' },
  radioLabel: { fontSize: 13, color: '#374151' },
  streamCountWrap: { marginTop: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#334155' },
  numberInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    width: 60,
    marginTop: 4,
  },
});
