import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { radius, spacing } from '../../theme/colors';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
  bg?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  bg,
  textColor,
  style,
  textStyle,
  children,
}: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return { bg: '#D1FAE5', text: '#059669', dot: '#10B981' };
      case 'warning':
        return { bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' };
      case 'danger':
        return { bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444' };
      case 'info':
        return { bg: '#DBEAFE', text: '#2563EB', dot: '#3B82F6' };
      case 'neutral':
        return { bg: '#F3F4F6', text: '#4B5563', dot: '#9CA3AF' };
      case 'default':
      default:
        return { bg: '#FEF9C3', text: '#A16207', dot: '#EAB308' };
    }
  };

  const vStyles = getVariantStyles();
  const effectiveBg = bg || vStyles.bg;
  const effectiveText = textColor || vStyles.text;

  return (
    <View
      style={[
        styles.base,
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
        { backgroundColor: effectiveBg },
        style,
      ]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: vStyles.dot }]} /> : null}
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      {label ? (
        <Text
          style={[
            styles.baseText,
            size === 'sm' ? styles.textSm : styles.textMd,
            { color: effectiveText },
            textStyle,
          ]}
        >
          {label}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  sizeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sizeMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  baseText: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  iconContainer: {
    marginRight: 4,
  },
});

export default Badge;
