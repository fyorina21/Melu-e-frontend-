// src/screens/parent/homeobservation/components/HomeObservationBanner.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, spacing } from '../../../../theme/colors';

interface HomeObservationBannerProps {
  childName?: string;
}

export const HomeObservationBanner: React.FC<HomeObservationBannerProps> = React.memo(
  ({ childName }) => {
    return (
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          Recording what you see at home helps the therapy team understand{' '}
          {childName || 'your child'} better. Share behaviors, achievements, or concerns.
        </Text>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  bannerText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#075985',
  },
});
