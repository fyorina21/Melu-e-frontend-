// src/screens/session/components/SessionHeaderTimer.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import type { SessionHeaderTimerProps } from '../sessionDataTypes';

export const SessionHeaderTimer: React.FC<SessionHeaderTimerProps> = React.memo(
  ({ teacherName, stationName, roomName, secondsRemaining, isRunning, onToggleTimer }) => {
    const totalSecs = secondsRemaining ?? 0;
    const minutes = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const seconds = String(totalSecs % 60).padStart(2, '0');

    return (
      <View style={styles.header}>
        <View>
          <Text style={typography.h1}>Today's Session</Text>
          <Text style={typography.body}>
            {teacherName} • {stationName} • {roomName}
          </Text>
        </View>

        <View style={styles.timerRow}>
          <View style={styles.timerPill}>
            <Feather
              name="clock"
              size={14}
              color={colors.mutedText}
              style={{ marginRight: spacing.xs }}
            />
            <Text style={styles.timerText}>
              {minutes}:{seconds}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.playPauseBtn}
            onPress={onToggleTimer}
            accessibilityRole="button"
            accessibilityLabel={isRunning ? 'Pause timer' : 'Resume timer'}
          >
            <Feather name={isRunning ? 'pause' : 'play'} size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  timerText: {
    fontWeight: '700',
    color: '#16A34A',
  },
  playPauseBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
