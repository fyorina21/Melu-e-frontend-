import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../theme/colors';

interface DailyNotesHeaderProps {
  onGoBack: () => void;
  onExportWeekly: () => void;
}

export const DailyNotesHeader: React.FC<DailyNotesHeaderProps> = React.memo(
  ({ onGoBack, onExportWeekly }) => {
    return (
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onGoBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={18} color="#475569" />
        </TouchableOpacity>
        <View>
          <Text style={styles.pageTitle}>Daily Notes & Summaries</Text>
        </View>
        <TouchableOpacity
          style={styles.topExportBtn}
          onPress={onExportWeekly}
          accessibilityRole="button"
          accessibilityLabel="Export weekly summary"
        >
          <Feather name="download" size={14} color="#334155" />
          <Text style={styles.topExportText}>Export</Text>
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  topExportBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  topExportText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
});
