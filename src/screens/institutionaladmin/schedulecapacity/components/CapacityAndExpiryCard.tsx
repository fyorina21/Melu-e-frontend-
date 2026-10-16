import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { radius, spacing } from '../../../../theme/colors';

interface CapacityAndExpiryCardProps {
  capacity: string;
  draftExpiry: string;
  onCapacityChange: (val: string) => void;
  onDraftExpiryChange: (val: string) => void;
}

export const CapacityAndExpiryCard: React.FC<CapacityAndExpiryCardProps> = React.memo(
  ({ capacity, draftExpiry, onCapacityChange, onDraftExpiryChange }) => {
    return (
      <View style={styles.capacityGridRow}>
        {/* Staff-to-Student Capacity Card */}
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Staff-to-Student Capacity</Text>
          <View style={styles.cardInnerField}>
            <Text style={styles.label}>Students per Staff Member</Text>
            <TextInput
              style={styles.numberInput}
              value={capacity}
              onChangeText={onCapacityChange}
              keyboardType="number-pad"
              placeholder="2"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.fieldHint}>
              Recommended standard ratio is 2 students per therapist.
            </Text>
          </View>
        </View>

        {/* Draft Expiry Period Card */}
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Draft Expiry Period</Text>
          <View style={styles.cardInnerField}>
            <Text style={styles.label}>Days until draft expires (1–30)</Text>
            <TextInput
              style={styles.numberInput}
              value={draftExpiry}
              onChangeText={onDraftExpiryChange}
              keyboardType="number-pad"
              placeholder="7"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.fieldHint}>
              Unsubmitted Session Summaries and Daily Notes saved in draft status will be
              automatically flagged or archived after this period.
            </Text>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  capacityGridRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  halfCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardInnerField: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
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
  fieldHint: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
});
