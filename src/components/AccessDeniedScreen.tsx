// src/components/AccessDeniedScreen.tsx

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing, shadows } from '../theme';
import { typography } from '../theme/typography';
import { useToast } from '../context/ToastContext';
import Button from '../shared/components/Button';

interface Props {
  screenName?: string;
  moduleName?: string;
}

export default function AccessDeniedScreen({ screenName, moduleName }: Props) {
  const navigation = useNavigation();
  const { showToast } = useToast();

  useEffect(() => {
    showToast(
      `You don't have access to ${moduleName || screenName || 'this page'}. ` +
        `Contact your administrator to request access.`,
      'error',
    );
  }, [moduleName, screenName, showToast]);

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      const state = navigation.getState();
      const firstRoute = state?.routeNames?.[0];
      if (firstRoute) {
        navigation.reset({ index: 0, routes: [{ name: firstRoute as never }] });
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Feather name="lock" size={32} color={colors.error} />
        </View>
        <Text style={styles.title}>Access Restricted</Text>
        <Text style={styles.description}>
          You don't have permission to access{' '}
          {moduleName ? `the "${moduleName}" module` : 'this page'}. Please contact your System
          Administrator to request access.
        </Text>
        <Button label="Go Back" onPress={handleGoBack} variant="primary" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    maxWidth: 480,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.errorLight,
    ...shadows.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.errorDark,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.bodyText,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
});
