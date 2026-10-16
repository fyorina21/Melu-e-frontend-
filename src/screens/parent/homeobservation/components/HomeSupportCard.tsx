// src/screens/parent/homeobservation/components/HomeSupportCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';

interface HomeSupportCardProps {
  onRequestStrategy: () => void;
  onScheduleMeeting: () => void;
}

export const HomeSupportCard: React.FC<HomeSupportCardProps> = React.memo(
  ({ onRequestStrategy, onScheduleMeeting }) => {
    return (
      <View style={styles.supportCard}>
        <Text style={styles.supportTitle}>Need support from the team?</Text>
        <Text style={styles.supportSubtitle}>
          Reach out to your therapy team for strategies or to schedule a meeting.
        </Text>
        <View style={styles.supportRow}>
          <TouchableOpacity
            style={styles.strategyBtn}
            onPress={onRequestStrategy}
            accessibilityRole="button"
            accessibilityLabel="Request a home strategy"
          >
            <Text style={styles.strategyBtnText}>Request a home strategy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.meetingBtn}
            onPress={onScheduleMeeting}
            accessibilityRole="button"
            accessibilityLabel="Schedule a meeting"
          >
            <Text style={styles.meetingBtnText}>Schedule a meeting</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  supportCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: spacing.lg,
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
    marginBottom: 2,
  },
  supportSubtitle: {
    fontSize: 13,
    color: colors.mutedText,
    marginBottom: spacing.md,
  },
  supportRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  strategyBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#38BDF8',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  strategyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  meetingBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  meetingBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
});
