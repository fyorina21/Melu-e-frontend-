import React from 'react';
import { View, Text, TextInput, Switch, StyleSheet } from 'react-native';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';

interface MasteryCriteriaCardProps {
  consecutive: number;
  onConsecutiveChange: (val: number) => void;
  independence: number;
  onIndependenceChange: (val: number) => void;
  autoSuggest: boolean;
  onAutoSuggestChange: (val: boolean) => void;
}

export const MasteryCriteriaCard: React.FC<MasteryCriteriaCardProps> = React.memo(
  ({
    consecutive,
    onConsecutiveChange,
    independence,
    onIndependenceChange,
    autoSuggest,
    onAutoSuggestChange,
  }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mastery Criteria</Text>
        <View style={styles.contentCol}>
          <View>
            <Text style={styles.fieldLabel}>Consecutive Trials</Text>
            <TextInput
              value={String(consecutive)}
              onChangeText={(e) => onConsecutiveChange(Number(e) || 0)}
              style={styles.numberInput}
              keyboardType="numeric"
            />
          </View>
          <View>
            <Text style={styles.fieldLabel}>Independence % Threshold</Text>
            <TextInput
              value={String(independence)}
              onChangeText={(e) => onIndependenceChange(Number(e) || 0)}
              style={styles.numberInput}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>Auto-Suggestion</Text>
            <Switch
              value={autoSuggest}
              onValueChange={onAutoSuggestChange}
              trackColor={{ true: '#0284C7', false: '#CBD5E1' }}
            />
            <Text style={styles.fieldHint}>{autoSuggest ? 'On' : 'Off'}</Text>
          </View>
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
  contentCol: { flexDirection: 'column', gap: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#334155' },
  fieldHint: { fontSize: 12, color: '#9CA3AF' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
