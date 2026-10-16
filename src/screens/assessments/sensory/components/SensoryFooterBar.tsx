import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../../theme/colors';

interface SensoryFooterBarProps {
  onPrint: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export const SensoryFooterBar: React.FC<SensoryFooterBarProps> = React.memo(
  ({ onPrint, onSaveDraft, onSubmit }) => {
    return (
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.printBtn}
          onPress={onPrint}
          accessibilityRole="button"
          accessibilityLabel="Print or export assessment"
        >
          <Feather name="printer" size={16} color="#334155" />
          <Text style={styles.printBtnText}>Print / Export</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.draftBtn}
          onPress={onSaveDraft}
          accessibilityRole="button"
          accessibilityLabel="Save assessment draft"
        >
          <Text style={styles.draftBtnText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={onSubmit}
          accessibilityRole="button"
          accessibilityLabel="Submit assessment"
        >
          <Text style={styles.submitBtnText}>Submit Assessment</Text>
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  printBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  draftBtn: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  draftBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  submitBtn: {
    flex: 1.5,
    minWidth: 160,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: '#0284C7',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
