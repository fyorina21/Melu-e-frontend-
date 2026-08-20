import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function TrialLoggingFormatScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={typography.h1}>Trial Logging Format</Text>
        <Text style={typography.body}>SCR-ADMIN-002 — configure prompt levels, button colors, trial stream layout and mastery criteria.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.md },
});