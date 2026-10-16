// src/screens/director/progress/components/DirectorBehaviorIncidentCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

interface DirectorBehaviorIncidentCardProps {
  incidentSummary: string;
}

export const DirectorBehaviorIncidentCard: React.FC<DirectorBehaviorIncidentCardProps> = React.memo(
  ({ incidentSummary }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Behavior Incident Trends</Text>
        <View style={styles.incidentBox}>
          <Feather name="alert-circle" size={16} color="#F59E0B" />
          <Text style={styles.incidentText}>
            {incidentSummary || 'No behavior incident data recorded.'}
          </Text>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  incidentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF3C7',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  incidentText: {
    fontSize: 13,
    color: '#92400E',
    flex: 1,
  },
});
