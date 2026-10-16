// src/screens/parent/homeobservation/components/HomeObservationHeader.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';

interface HomeObservationHeaderProps {
  onAddObservation: () => void;
}

export const HomeObservationHeader: React.FC<HomeObservationHeaderProps> = React.memo(
  ({ onAddObservation }) => {
    return (
      <View style={styles.header}>
        <Text style={typography.h1}>Home Observations</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={onAddObservation}
          accessibilityRole="button"
          accessibilityLabel="Add Observation"
        >
          <Feather name="plus" size={16} color={colors.navyText} />
          <Text style={styles.addBtnText}>Add Observation</Text>
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addBtn: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    backgroundColor: '#FCD34D',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addBtnText: {
    fontWeight: '700',
    color: colors.navyText,
    fontSize: 13,
  },
});
