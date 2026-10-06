import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radius, spacing } from '../../theme/colors';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  title?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  extra?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  testID?: string;
}

export function Card({
  title,
  subtitle,
  extra,
  header,
  footer,
  variant = 'default',
  padding = 'md',
  onPress,
  style,
  contentStyle,
  titleStyle,
  subtitleStyle,
  children,
  testID,
}: CardProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return styles.cardElevated;
      case 'outlined':
        return styles.cardOutlined;
      case 'flat':
        return styles.cardFlat;
      case 'default':
      default:
        return styles.cardDefault;
    }
  };

  const getPaddingStyle = () => {
    switch (padding) {
      case 'none':
        return styles.paddingNone;
      case 'sm':
        return styles.paddingSm;
      case 'lg':
        return styles.paddingLg;
      case 'md':
      default:
        return styles.paddingMd;
    }
  };

  const ContainerComponent = onPress ? TouchableOpacity : View;
  const containerProps = onPress ? { activeOpacity: 0.85, onPress, testID } : { testID };

  const hasDefaultHeader = Boolean(title || subtitle || extra);

  return (
    <ContainerComponent
      {...containerProps}
      style={[styles.baseCard, getVariantStyle(), getPaddingStyle(), style]}
    >
      {header ? (
        header
      ) : hasDefaultHeader ? (
        <View style={styles.headerRow}>
          <View style={styles.titleArea}>
            {typeof title === 'string' ? (
              <Text style={[styles.title, titleStyle]}>{title}</Text>
            ) : (
              title
            )}
            {typeof subtitle === 'string' ? (
              <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
            ) : (
              subtitle
            )}
          </View>
          {extra ? <View style={styles.extraArea}>{extra}</View> : null}
        </View>
      ) : null}

      <View style={[styles.contentArea, contentStyle]}>{children}</View>

      {footer ? <View style={styles.footerArea}>{footer}</View> : null}
    </ContainerComponent>
  );
}

const styles = StyleSheet.create({
  baseCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
  },
  // Variants
  cardDefault: {
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardElevated: {
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardOutlined: {
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 0,
  },
  cardFlat: {
    borderWidth: 0,
    backgroundColor: '#F9FAFB',
    elevation: 0,
  },
  // Paddings
  paddingNone: {
    padding: 0,
  },
  paddingSm: {
    padding: spacing.sm,
  },
  paddingMd: {
    padding: spacing.lg,
  },
  paddingLg: {
    padding: spacing.xl,
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleArea: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  subtitle: {
    fontSize: 13,
    color: colors.bodyText,
    marginTop: 2,
  },
  extraArea: {
    flexShrink: 0,
  },
  contentArea: {
    width: '100%',
  },
  footerArea: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default Card;
