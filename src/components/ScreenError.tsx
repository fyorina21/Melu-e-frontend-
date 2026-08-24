// components/ScreenError.tsx
// Full-screen error state shown when a page fails to load its data.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function ScreenError({ onRetry }: { onRetry?: () => void }) {
  return (
    <View style={styles.wrap}>
      <Feather name="alert-circle" size={40} color="#EF4444" />
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.subtitle}>We couldn't load the data for this page.</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.bgApp, padding: 24 },
  title: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  subtitle: { fontSize: 13, color: colors.mutedText, textAlign: 'center' },
  retryBtn: { marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.bgCard },
  retryText: { fontSize: 13, fontWeight: '600', color: colors.navyText },
});
