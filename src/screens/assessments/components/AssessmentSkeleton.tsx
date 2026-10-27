import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, radius, spacing } from '../../../theme/colors';

export const AssessmentSkeleton: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {/* 4-Card Metric Strip Skeleton */}
      <View style={styles.kpiRow}>
        {[1, 2, 3, 4].map((i) => (
          <Animated.View key={i} style={[styles.kpiCard, { opacity: pulseAnim }]}>
            <View style={styles.kpiIcon} />
            <View style={styles.kpiLineLarge} />
            <View style={styles.kpiLineSmall} />
          </Animated.View>
        ))}
      </View>

      {/* 2 Student Cards Skeleton */}
      <View style={styles.caseloadHeaderLine}>
        <View style={styles.sectionTitleSkeleton} />
      </View>

      <View style={styles.cardsGrid}>
        {[1, 2].map((i) => (
          <Animated.View key={i} style={[styles.studentCard, { opacity: pulseAnim }]}>
            {/* Header */}
            <View style={styles.studentHeader}>
              <View style={styles.avatarSkeleton} />
              <View style={styles.infoSkeleton}>
                <View style={styles.nameSkeleton} />
                <View style={styles.metaSkeleton} />
              </View>
              <View style={styles.ringSkeleton} />
            </View>

            {/* 2x2 Modules Skeleton */}
            <View style={styles.modulesSkeleton}>
              {[1, 2, 3, 4].map((m) => (
                <View key={m} style={styles.moduleBoxSkeleton}>
                  <View style={styles.moduleLine1} />
                  <View style={styles.moduleLine2} />
                  <View style={styles.moduleBar} />
                </View>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.footerSkeleton}>
              <View style={styles.footerLine} />
              <View style={styles.footerBtn} />
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    width: '100%',
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#E2E8F0',
    borderRadius: radius.lg,
    padding: spacing.md,
    height: 110,
    gap: 8,
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#CBD5E1',
  },
  kpiLineLarge: {
    width: '50%',
    height: 18,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  kpiLineSmall: {
    width: '75%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },

  caseloadHeaderLine: {
    marginTop: spacing.xs,
  },
  sectionTitleSkeleton: {
    width: 200,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#CBD5E1',
  },

  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  studentCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.md,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarSkeleton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#CBD5E1',
  },
  infoSkeleton: {
    flex: 1,
    gap: 6,
  },
  nameSkeleton: {
    width: '60%',
    height: 16,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  metaSkeleton: {
    width: '80%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  ringSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#CBD5E1',
  },

  modulesSkeleton: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  moduleBoxSkeleton: {
    flex: 1,
    minWidth: '47%',
    height: 80,
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    padding: 8,
    gap: 6,
  },
  moduleLine1: {
    width: '70%',
    height: 12,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  moduleLine2: {
    width: '40%',
    height: 10,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  moduleBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    marginTop: 'auto',
  },

  footerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  footerLine: {
    width: 120,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  footerBtn: {
    width: 140,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: '#CBD5E1',
  },
});
