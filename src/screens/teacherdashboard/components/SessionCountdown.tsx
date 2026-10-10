import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius } from '../../../theme/colors';
import { getCountdown } from '../teacherDashboardTypes';

interface SessionCountdownProps {
  startTime?: string;
}

export const SessionCountdown: React.FC<SessionCountdownProps> = React.memo(({ startTime }) => {
  const [countdownText, setCountdownText] = useState(() => getCountdown(startTime));

  useEffect(() => {
    // Initial evaluation
    setCountdownText(getCountdown(startTime));

    // Update every second
    const timer = setInterval(() => {
      setCountdownText(getCountdown(startTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  return (
    <View style={styles.startsInPill}>
      <Text style={styles.startsInText}>{countdownText}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  startsInPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  startsInText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
});
