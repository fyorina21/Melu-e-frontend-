import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../../theme/colors';

interface Props {
  completedModules: number;
  percentage: number;
  size?: number;
}

export const StudentProgressRing: React.FC<Props> = React.memo(
  ({ completedModules, percentage, size = 56 }) => {
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clampedPct = Math.max(0, Math.min(100, percentage));
    const strokeDashoffset = circumference - (circumference * clampedPct) / 100;

    const ringColor = completedModules === 4 ? '#16A34A' : clampedPct > 0 ? '#3B82F6' : '#CBD5E1';

    return (
      <View style={styles.container}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={size} height={size}>
            {/* Background Track */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Active Progress Ring */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={ringColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View style={styles.centerTextContainer}>
            <Text style={styles.centerText}>{clampedPct}%</Text>
          </View>
        </View>
        <View style={styles.labelCol}>
          <Text style={styles.overallLabel}>OVERALL</Text>
          <Text style={styles.doneLabel}>{completedModules} of 4 Done</Text>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  centerTextContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navyText,
    fontVariant: ['tabular-nums'],
  },
  labelCol: {
    justifyContent: 'center',
  },
  overallLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  doneLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
});
