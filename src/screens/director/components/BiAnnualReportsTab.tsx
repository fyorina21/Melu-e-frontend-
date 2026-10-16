import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';

interface BiAnnualReportsTabProps {
  onGenerateBiAnnual: () => void;
  onPreview: () => void;
  onEmailParent: () => void;
}

export function BiAnnualReportsTab({
  onGenerateBiAnnual,
  onPreview,
  onEmailParent,
}: BiAnnualReportsTabProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Bi-Annual Progress Report Generator</Text>
      <Text style={styles.cardSub}>
        Compiles 6-month clinical progress metrics, session totals, and goal mastery status across
        all enrolled students into an executive report.
      </Text>

      <TouchableOpacity
        style={styles.generateBtn}
        onPress={onGenerateBiAnnual}
        accessibilityRole="button"
        accessibilityLabel="Generate bi-annual report"
      >
        <Feather name="play" size={16} color={colors.navyText} />
        <Text style={styles.generateBtnText}>Generate Bi-Annual Report</Text>
      </TouchableOpacity>

      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={onPreview}
          accessibilityRole="button"
          accessibilityLabel="Preview and print bi-annual report"
        >
          <Feather name="eye" size={16} color={colors.navyText} />
          <Text style={styles.actionCardText}>Preview / Print</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={onPreview}
          accessibilityRole="button"
          accessibilityLabel="Export bi-annual report file"
        >
          <Feather name="download" size={16} color={colors.navyText} />
          <Text style={styles.actionCardText}>Export File</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={onEmailParent}
          accessibilityRole="button"
          accessibilityLabel="Email bi-annual report to parents"
        >
          <Feather name="mail" size={16} color={colors.navyText} />
          <Text style={styles.actionCardText}>Email to Parents</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  cardSub: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 4,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF08A',
    borderRadius: radius.md,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  generateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionCard: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  actionCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
});
