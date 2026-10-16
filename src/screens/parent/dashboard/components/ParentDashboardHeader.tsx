// src/screens/parent/dashboard/components/ParentDashboardHeader.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing } from '../../../../theme/colors';

interface ParentDashboardHeaderProps {
  parentName: string;
  dateText: string;
}

export default function ParentDashboardHeader({
  parentName,
  dateText,
}: ParentDashboardHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Welcome back, {parentName} 👋</Text>
      <Text style={styles.date}>{dateText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
