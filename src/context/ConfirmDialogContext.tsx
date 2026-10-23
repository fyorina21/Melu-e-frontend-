import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../theme/colors';

export interface ConfirmDialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmDialogContextValue {
  showConfirmDialog: (options: ConfirmDialogOptions) => void;
  hideConfirmDialog: () => void;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

// Global subscriber so non-React utility calls (e.g. in dialogs.ts) can invoke the in-app modal
let globalShowConfirm: ((options: ConfirmDialogOptions) => void) | null = null;
let globalHideConfirm: (() => void) | null = null;

export function triggerInAppConfirm(options: ConfirmDialogOptions): void {
  if (globalShowConfirm) {
    globalShowConfirm(options);
  } else {
    // Fallback if provider not mounted
    const proceed = window?.confirm
      ? window.confirm(options.message ? `${options.title}\n\n${options.message}` : options.title)
      : true;
    if (proceed) {
      options.onConfirm();
    } else {
      options.onCancel?.();
    }
  }
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    visible: boolean;
    options: ConfirmDialogOptions | null;
    isBusy: boolean;
  }>({
    visible: false,
    options: null,
    isBusy: false,
  });

  const hideConfirmDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, visible: false, isBusy: false }));
  }, []);

  const showConfirmDialog = useCallback((options: ConfirmDialogOptions) => {
    setDialogState({
      visible: true,
      options,
      isBusy: false,
    });
  }, []);

  // Register global bridge
  globalShowConfirm = showConfirmDialog;
  globalHideConfirm = hideConfirmDialog;

  const handleConfirm = async () => {
    if (!dialogState.options) return;
    setDialogState((prev) => ({ ...prev, isBusy: true }));
    try {
      await dialogState.options.onConfirm();
    } finally {
      hideConfirmDialog();
    }
  };

  const handleCancel = () => {
    dialogState.options?.onCancel?.();
    hideConfirmDialog();
  };

  const value = useMemo(
    () => ({ showConfirmDialog, hideConfirmDialog }),
    [showConfirmDialog, hideConfirmDialog],
  );

  const opts = dialogState.options;
  const isDestructive = opts?.destructive ?? false;

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      {dialogState.visible && opts && (
        <Modal
          transparent
          visible={dialogState.visible}
          animationType="fade"
          onRequestClose={handleCancel}
        >
          <Pressable
            style={styles.backdrop}
            onPress={handleCancel}
            accessibilityRole="alert"
            accessibilityLabel={opts.title}
          >
            <Pressable
              style={styles.modalCard}
              onPress={(e) => e.stopPropagation()}
              accessibilityRole="alert"
              aria-modal={true}
            >
              {/* Header Icon & Title */}
              <View style={styles.headerRow}>
                <View
                  style={[
                    styles.iconCircle,
                    isDestructive ? styles.iconCircleDestructive : styles.iconCirclePrimary,
                  ]}
                >
                  <Feather
                    name={opts.icon || (isDestructive ? 'trash-2' : 'alert-circle')}
                    size={22}
                    color={isDestructive ? '#DC2626' : '#2563EB'}
                  />
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.titleText}>{opts.title}</Text>
                  {isDestructive && (
                    <Text style={styles.destructiveTag}>Action cannot be undone</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handleCancel}
                  hitSlop={8}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close dialog"
                >
                  <Feather name="x" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Message Body */}
              {opts.message ? (
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>{opts.message}</Text>
                </View>
              ) : null}

              {/* Actions Footer */}
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancel}
                  disabled={dialogState.isBusy}
                  accessibilityRole="button"
                  accessibilityLabel={opts.cancelLabel || 'Cancel'}
                >
                  <Text style={styles.cancelBtnText}>{opts.cancelLabel || 'Cancel'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    isDestructive ? styles.confirmBtnDestructive : styles.confirmBtnPrimary,
                    dialogState.isBusy && styles.btnDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={dialogState.isBusy}
                  accessibilityRole="button"
                  accessibilityLabel={opts.confirmLabel || (isDestructive ? 'Delete' : 'Confirm')}
                >
                  <Text style={styles.confirmBtnText}>
                    {dialogState.isBusy
                      ? 'Processing...'
                      : opts.confirmLabel || (isDestructive ? 'Delete' : 'Confirm')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    return {
      showConfirmDialog: triggerInAppConfirm,
      hideConfirmDialog: () => globalHideConfirm?.(),
    };
  }
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    ...Platform.select({
      web: {
        zIndex: 99999,
      },
    }),
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 480,
    ...makeShadow(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDestructive: {
    backgroundColor: '#FEE2E2',
  },
  iconCirclePrimary: {
    backgroundColor: '#DBEAFE',
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 24,
  },
  destructiveTag: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  messageBox: {
    marginBottom: spacing.xl,
  },
  messageText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  confirmBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  confirmBtnPrimary: {
    backgroundColor: '#2563EB',
  },
  confirmBtnDestructive: {
    backgroundColor: '#DC2626',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
