import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

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
 * Custom hook to trap keyboard focus within a modal on Web (WCAG 2.1 AA 2.1.2 & 2.4.3).
 * Automatically focuses the first focusable element when opened,
 * traps Tab/Shift+Tab inside the container, handles Escape key to dismiss,
 * and restores previous focus when closed.
 */
export function useFocusTrap(active: boolean, onDismiss?: () => void) {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !active || typeof window === 'undefined') return;

    const previousActiveElement = document.activeElement as HTMLElement | null;

    const getFocusable = (): HTMLElement[] => {
      const container = containerRef.current;
      if (!container) return [];
      const node: HTMLElement | null =
        container instanceof HTMLElement
          ? container
          : (container as any)._node || document.querySelector('[data-focus-trap="true"]') || null;
      if (!node) return [];

      const list = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      return list.filter((el) => {
        const style = window.getComputedStyle(el);
        return (
          style.display !== 'none' && style.visibility !== 'hidden' && !el.hasAttribute('disabled')
        );
      });
    };

    const timer = setTimeout(() => {
      const list = getFocusable();
      if (list.length > 0) {
        list[0].focus();
      }
    }, 40);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onDismiss?.();
        return;
      }

      if (e.key === 'Tab') {
        const list = getFocusable();
        if (list.length === 0) {
          e.preventDefault();
          return;
        }

        const first = list[0];
        const last = list[list.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            !containerRef.current?.contains?.(document.activeElement)
          ) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (
            document.activeElement === last ||
            !containerRef.current?.contains?.(document.activeElement)
          ) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown, true);
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        try {
          previousActiveElement.focus();
        } catch {
          // Ignore blur failures
        }
      }
    };
  }, [active, onDismiss]);

  return containerRef;
}
