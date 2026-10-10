// src/screens/session/components/SessionEmptyStudents.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import type { SessionEmptyStudentsProps } from '../sessionDataTypes';

export const SessionEmptyStudents: React.FC<SessionEmptyStudentsProps> = React.memo(
  ({
    heading = 'Students',
    title = 'No student assigned yet',
    message = 'A student appears here once their assessment is completed and an IUP goal has been assigned.',
  }) => {
    return (
      <View style={styles.container}>
        <Text style={[typography.h2, styles.studentsHeading]}>{heading}</Text>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Feather name="users" size={26} color={colors.mutedText} />
          </View>
          <Text style={styles.emptyTitle}>{title}</Text>
          <Text style={styles.emptyText}>{message}</Text>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  studentsHeading: {
    marginBottom: spacing.md,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyText,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 20,
  },
});
