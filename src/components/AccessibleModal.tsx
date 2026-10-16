import React, { useEffect, useRef } from 'react';
import { Modal, ModalProps, View, StyleSheet, Platform, AccessibilityRole } from 'react-native';

export interface AccessibleModalProps extends ModalProps {
  children?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]:not([aria-disabled="true"])',
].join(',');

/**
 * AccessibleModal: Wraps React Native's Modal with WCAG 2.1 AA keyboard focus trapping,
 * accessibilityViewIsModal, aria-modal="true", and escape key handling.
 */
export function AccessibleModal({
  visible,
  onRequestClose,
  children,
  accessibilityLabel = 'Dialog window',
  accessibilityRole = 'summary',
  style,
  ...rest
}: AccessibleModalProps) {
  const containerRef = useRef<View>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible || typeof window === 'undefined') return;

    const previousElement = document.activeElement as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onRequestClose?.({} as any);
        return;
      }

      if (e.key === 'Tab') {
        const modalDom = document.querySelector('[data-accessible-modal="true"]');
        if (!modalDom) return;

        const focusables = Array.from(
          modalDom.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((el) => {
          const s = window.getComputedStyle(el);
          return s.display !== 'none' && s.visibility !== 'hidden' && !el.hasAttribute('disabled');
        });

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !modalDom.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !modalDom.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    const timer = setTimeout(() => {
      const modalDom = document.querySelector('[data-accessible-modal="true"]');
      if (modalDom) {
        const first = modalDom.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        first?.focus?.();
      }
    }, 50);

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown, true);
      if (previousElement && typeof previousElement.focus === 'function') {
        try {
          previousElement.focus();
        } catch {
          // ignore
        }
      }
    };
  }, [visible, onRequestClose]);

  return (
    <Modal
      visible={visible}
      onRequestClose={onRequestClose}
      accessibilityViewIsModal={true}
      aria-modal={true}
      {...rest}
    >
      <View
        ref={containerRef}
        style={[styles.container, style]}
        {...({ dataSet: { accessibleModal: 'true' } } as any)}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        accessibilityViewIsModal={true}
      >
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AccessibleModal;
