// components/ScreenLoader.tsx
// Full-screen loading state shown while a page fetches its initial data.

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

export default function ScreenLoader() {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color="#0284C7" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgApp },
});
