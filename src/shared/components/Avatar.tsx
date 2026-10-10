import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle, ImageSourcePropType } from 'react-native';
import { colors, radius } from '../../theme';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

export interface AvatarProps {
  source?: ImageSourcePropType | { uri: string };
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 15,
  lg: 18,
  xl: 24,
};

const STATUS_COLOR_MAP: Record<AvatarStatus, string> = {
  online: colors.successGreen,
  offline: colors.mutedText,
  busy: colors.error,
  away: colors.warning,
};

export function Avatar({
  source,
  name,
  size = 'md',
  status,
  style,
  testID = 'avatar',
}: AvatarProps) {
  const dimension = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];

  const getInitials = (fullName?: string): string => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const statusSize = Math.max(8, Math.round(dimension * 0.28));

  return (
    <View style={[styles.wrapper, { width: dimension, height: dimension }, style]} testID={testID}>
      {source ? (
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
          accessibilityLabel={name || 'Avatar image'}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
        </View>
      )}

      {status && (
        <View
          style={[
            styles.statusDot,
            {
              width: statusSize,
              height: statusSize,
              borderRadius: statusSize / 2,
              backgroundColor: STATUS_COLOR_MAP[status],
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  image: {
    backgroundColor: '#E5E7EB',
  },
  fallback: {
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
    color: colors.primaryBlue,
  },
  statusDot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default Avatar;
