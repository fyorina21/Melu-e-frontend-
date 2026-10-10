import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import { colors, radius, spacing } from '../../theme/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode | ((props: { color: string; size: number }) => React.ReactNode);
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  children,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const isInteractive = !disabled && !loading;

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: styles.btnPrimary,
          text: styles.btnTextPrimary,
          indicatorColor: colors.navyText,
          iconColor: colors.navyText,
        };
      case 'secondary':
        return {
          container: styles.btnSecondary,
          text: styles.btnTextSecondary,
          indicatorColor: colors.white,
          iconColor: colors.white,
        };
      case 'outline':
        return {
          container: styles.btnOutline,
          text: styles.btnTextOutline,
          indicatorColor: colors.navyText,
          iconColor: colors.navyText,
        };
      case 'danger':
        return {
          container: styles.btnDanger,
          text: styles.btnTextDanger,
          indicatorColor: colors.white,
          iconColor: colors.white,
        };
      case 'success':
        return {
          container: styles.btnSuccess,
          text: styles.btnTextSuccess,
          indicatorColor: colors.white,
          iconColor: colors.white,
        };
      case 'ghost':
        return {
          container: styles.btnGhost,
          text: styles.btnTextGhost,
          indicatorColor: colors.bodyText,
          iconColor: colors.bodyText,
        };
      default:
        return {
          container: styles.btnPrimary,
          text: styles.btnTextPrimary,
          indicatorColor: colors.navyText,
          iconColor: colors.navyText,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: styles.sizeSm,
          text: styles.textSm,
          iconSize: 14,
        };
      case 'lg':
        return {
          container: styles.sizeLg,
          text: styles.textLg,
          iconSize: 20,
        };
      case 'md':
      default:
        return {
          container: styles.sizeMd,
          text: styles.textMd,
          iconSize: 16,
        };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  const renderedIcon =
    typeof icon === 'function' ? icon({ color: vStyles.iconColor, size: sStyles.iconSize }) : icon;

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      activeOpacity={0.75}
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      style={[
        styles.base,
        sStyles.container,
        vStyles.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vStyles.indicatorColor} />
      ) : (
        <View style={styles.contentRow}>
          {iconPosition === 'left' && renderedIcon ? (
            <View style={styles.iconLeft}>{renderedIcon}</View>
          ) : null}
          {label ? (
            <Text style={[styles.baseText, sStyles.text, vStyles.text, textStyle]}>{label}</Text>
          ) : null}
          {children}
          {iconPosition === 'right' && renderedIcon ? (
            <View style={styles.iconRight}>{renderedIcon}</View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  // Sizes
  sizeSm: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    minHeight: 32,
  },
  sizeMd: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    minHeight: 42,
  },
  sizeLg: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    minHeight: 50,
  },
  // Text Sizes
  baseText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textSm: {
    fontSize: 12,
  },
  textMd: {
    fontSize: 14,
  },
  textLg: {
    fontSize: 16,
  },
  // Variants
  btnPrimary: {
    backgroundColor: colors.primaryYellow,
  },
  btnTextPrimary: {
    color: colors.navyText,
  },
  btnSecondary: {
    backgroundColor: colors.navyText,
  },
  btnTextSecondary: {
    color: colors.white,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnTextOutline: {
    color: colors.navyText,
  },
  btnDanger: {
    backgroundColor: '#EF4444',
  },
  btnTextDanger: {
    color: colors.white,
  },
  btnSuccess: {
    backgroundColor: colors.successGreen,
  },
  btnTextSuccess: {
    color: colors.white,
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  btnTextGhost: {
    color: colors.bodyText,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});

export default Button;
