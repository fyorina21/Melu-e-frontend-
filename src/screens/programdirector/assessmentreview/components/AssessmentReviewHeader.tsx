// src/screens/programdirector/assessmentreview/components/AssessmentReviewHeader.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';

export const AssessmentReviewHeader: React.FC = React.memo(() => {
  return (
    <View style={styles.header}>
      <Text style={typography.h1}>Assessment Review & Approval</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
