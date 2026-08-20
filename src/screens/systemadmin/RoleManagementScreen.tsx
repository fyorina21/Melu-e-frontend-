import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function RoleManagementScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={typography.h1}>Role Management</Text>
        <Text style={typography.body}>SCR-SYS-002 — manage system roles and role assignments.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.md },
});