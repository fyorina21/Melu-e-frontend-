// src/screens/systemadmin/roles/components/RoleTableHeader.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../../../theme/colors';

export default function RoleTableHeader() {
  return (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerText, styles.colName]}>Role Name</Text>
      <Text style={[styles.headerText, styles.colDescription]}>Description</Text>
      <Text style={[styles.headerText, styles.colCount]}>Staff Count</Text>
      <Text style={[styles.headerText, styles.colType]}>Type</Text>
      <Text style={[styles.headerText, styles.colActions]}>Actions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  colName: {
    flex: 2,
  },
  colDescription: {
    flex: 3,
  },
  colCount: {
    flex: 1,
    textAlign: 'center',
  },
  colType: {
    flex: 1,
    textAlign: 'center',
  },
  colActions: {
    width: 90,
    textAlign: 'center',
  },
});
