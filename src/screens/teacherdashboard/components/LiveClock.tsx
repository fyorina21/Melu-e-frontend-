import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';

interface LiveClockProps {
  showDate?: boolean;
}

export const LiveClock: React.FC<LiveClockProps> = React.memo(({ showDate = true }) => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <View style={styles.clockPill}>
      <Feather
        name="clock"
        size={14}
        color={colors.mutedText}
        style={{ marginRight: spacing.xs }}
      />
      <Text style={styles.clockText}>{timeStr}</Text>
    </View>
  );
});

export const LiveDateText: React.FC<{ roleName?: string }> = React.memo(
  ({ roleName = 'Teacher' }) => {
    const [now, setNow] = useState<Date>(() => new Date());

    useEffect(() => {
      // Only updates every minute for date string to be ultra-efficient
      const timer = setInterval(() => {
        setNow(new Date());
      }, 60000);
      return () => clearInterval(timer);
    }, []);

    const dateStr = now.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <Text style={styles.dateSubtext}>
        {dateStr} · {roleName} Workspace
      </Text>
    );
  },
);

const styles = StyleSheet.create({
  clockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  clockText: {
    fontWeight: '700',
    color: colors.navyText,
    fontVariant: ['tabular-nums'],
    fontSize: 13,
  },
  dateSubtext: {
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 2,
  },
});
