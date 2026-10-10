// src/screens/coordinator/components/WizardHeader.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../../theme/colors';

export const WizardHeader: React.FC = React.memo(() => {
  return (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        <Text style={styles.headerTitle}>Enrollment Wizard</Text>
        <Text style={styles.headerSubtitle}>ABA Therapy Management — New Child Enrollment</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.white,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerInner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitle: {
    color: colors.navyText,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
});
