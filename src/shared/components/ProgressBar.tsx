import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export type ProgressBarVariant = 'primary' | 'success' | 'warning' | 'info';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  variant?: ProgressBarVariant;
  height?: number;
  showLabel?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ProgressBar({
  progress,
  variant = 'primary',
  height = 8,
  showLabel = false,
  label,
  style,
  testID = 'progress-bar',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  const getBarColor = () => {
    switch (variant) {
      case 'success':
        return colors.successGreen;
      case 'warning':
        return colors.statusPendingText;
      case 'info':
        return colors.primaryBlue;
      case 'primary':
      default:
        return colors.primaryYellow;
    }
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      {(showLabel || label) && (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {showLabel && <Text style={styles.percentage}>{Math.round(clamped)}%</Text>}
        </View>
      )}
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clamped}%`,
              backgroundColor: getBarColor(),
              height,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bodyText,
  },
  track: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  fill: {
    minWidth: 0,
  },
});

export default ProgressBar;
