// components/ScreenLoader.tsx
// Structure-preserving skeleton loader to eliminate cumulative layout shift (CLS) during network loading phases.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { PageSkeleton } from '../shared/components/Skeleton';

export interface ScreenLoaderProps {
  children?: React.ReactNode;
}

export default function ScreenLoader({ children }: ScreenLoaderProps) {
  if (children) {
    return <View style={styles.wrap}>{children}</View>;
  }

  return (
    <View style={styles.wrap}>
      <PageSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
});
