import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function WorkingHoursConfigScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={typography.h1}>Working Hours</Text>
        <Text style={typography.body}>SCR-ADMIN-009 — configure institution working hours and availability windows.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.md },
});