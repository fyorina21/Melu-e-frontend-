import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';

export const AssessmentEmptyState: React.FC = React.memo(() => {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Feather name="folder" size={32} color="#64748B" />
      </View>
      <Text style={styles.heading}>No Students in Assessment Assigned</Text>
      <Text style={styles.message}>
        You currently do not have any students assigned for 6-week baseline assessments. When
        students are enrolled and scheduled, they will appear here.
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    minHeight: 280,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.navyText,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: colors.mutedText,
    textAlign: 'center',
    maxWidth: 480,
    lineHeight: 19,
  },
});
