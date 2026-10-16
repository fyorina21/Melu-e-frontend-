import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import type { ButtonProps } from './Button';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
    icon?: keyof typeof Feather.glyphMap;
    variant?: ButtonProps['variant'];
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  secondaryAction,
  style,
  testID = 'empty-state',
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.iconCircle}>
        <Feather name={icon} size={32} color={colors.bodyText} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {(action || secondaryAction) && (
        <View style={styles.actionsRow}>
          {action && (
            <Button
              label={action.label}
              onPress={action.onPress}
              variant={action.variant || 'primary'}
              size="md"
              icon={action.icon ? <Feather name={action.icon} size={16} /> : undefined}
            />
          )}
          {secondaryAction && (
            <Button
              label={secondaryAction.label}
              onPress={secondaryAction.onPress}
              variant="outline"
              size="md"
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.navyText,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.bodyText,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 400,
    marginBottom: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
});

export default EmptyState;
