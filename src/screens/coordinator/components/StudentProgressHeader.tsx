// src/screens/coordinator/components/StudentProgressHeader.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../../theme/colors';

export default function StudentProgressHeader() {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.headerIconWrap}>
        <Feather name="activity" size={20} color={colors.primaryYellowDark} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.pageTitle}>Student Progress</Text>
        <Text style={styles.pageSubtitle}>Monitor goals, sessions & behavior trends</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navyText,
  },
  pageSubtitle: {
    fontSize: 13,
    color: colors.mutedText,
    marginTop: 2,
  },
});
