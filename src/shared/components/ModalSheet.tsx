import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme/colors';

export interface ModalSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
  maxHeightPercent?: number;
  scrollable?: boolean;
  showCloseButton?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  sheetStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function ModalSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 540,
  maxHeightPercent = 85,
  scrollable = true,
  showCloseButton = true,
  animationType = 'fade',
  sheetStyle,
  contentContainerStyle,
}: ModalSheetProps) {
  const ContentWrapper = scrollable ? ScrollView : View;
  const contentWrapperProps = scrollable
    ? {
        showsVerticalScrollIndicator: true,
        nestedScrollEnabled: true,
        contentContainerStyle: [styles.scrollContent, contentContainerStyle],
      }
    : { style: [styles.plainContent, contentContainerStyle] };

  return (
    <Modal visible={visible} transparent animationType={animationType} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Close modal"
        />

        <View
          style={[
            styles.sheetContainer,
            { maxWidth, maxHeight: `${maxHeightPercent}%` },
            sheetStyle,
          ]}
          onStartShouldSetResponder={() => true}
        >
          {title || showCloseButton ? (
            <View style={styles.header}>
              <View style={styles.titleArea}>
                {typeof title === 'string' ? <Text style={styles.titleText}>{title}</Text> : title}
                {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
              </View>

              {showCloseButton ? (
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Close"
                >
                  <Feather name="x" size={18} color={colors.navyText} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <ContentWrapper {...(contentWrapperProps as any)}>{children}</ContentWrapper>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    width: '100%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleArea: {
    flex: 1,
    marginRight: spacing.md,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyText,
  },
  subtitleText: {
    fontSize: 13,
    color: colors.bodyText,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  plainContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#FAFAFA',
    gap: spacing.sm,
  },
});

export default ModalSheet;
