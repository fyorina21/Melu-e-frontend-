import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import { colors, radius, spacing } from '../../theme/colors';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeletonBox,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonText({
  lines = 3,
  lineHeight = 14,
  gap = spacing.sm,
  lastLineWidth = '60%',
  style,
}: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  lastLineWidth?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.textContainer, { gap }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={lineHeight} width={i === lines - 1 ? lastLineWidth : '100%'} />
      ))}
    </View>
  );
}

export function SkeletonAvatar({
  size = 40,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;
}

export function SkeletonCard({
  height = 120,
  style,
}: {
  height?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.cardContainer, style]}>
      <View style={styles.cardHeader}>
        <SkeletonAvatar size={36} />
        <View style={{ flex: 1, marginLeft: spacing.md, gap: 6 }}>
          <Skeleton width="50%" height={14} />
          <Skeleton width="30%" height={10} />
        </View>
      </View>
      <SkeletonText lines={2} style={{ marginTop: spacing.md }} />
    </View>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 4,
  style,
}: {
  rows?: number;
  cols?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.tableContainer, style]}>
      <View style={styles.tableHeaderRow}>
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={`h-${c}`} width={`${Math.floor(80 / cols)}%`} height={14} />
        ))}
      </View>
      {Array.from({ length: rows }).map((_, r) => (
        <View key={`r-${r}`} style={styles.tableRow}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={`c-${r}-${c}`} width={`${Math.floor(75 / cols)}%`} height={12} />
          ))}
        </View>
      ))}
    </View>
  );
}

export function PageSkeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.pageContainer, style]}>
      {/* Header bar skeleton */}
      <View style={styles.pageHeader}>
        <Skeleton width={180} height={24} />
        <Skeleton width={100} height={36} borderRadius={radius.md} />
      </View>

      {/* Stats row skeleton */}
      <View style={styles.statsRow}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.statBox}>
            <Skeleton width="60%" height={12} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={22} />
          </View>
        ))}
      </View>

      {/* Content table skeleton */}
      <TableSkeleton rows={6} cols={5} style={{ marginTop: spacing.lg }} />
    </View>
  );
}

Skeleton.Text = SkeletonText;
Skeleton.Avatar = SkeletonAvatar;
Skeleton.Card = SkeletonCard;
Skeleton.Table = TableSkeleton;
Skeleton.Page = PageSkeleton;

const styles = StyleSheet.create({
  skeletonBox: {
    backgroundColor: '#CBD5E1',
  },
  textContainer: {
    width: '100%',
  },
  cardContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pageContainer: {
    flex: 1,
    padding: spacing.xl,
    backgroundColor: colors.bgApp,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  statBox: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
});

export default Skeleton;
