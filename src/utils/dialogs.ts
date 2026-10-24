import { Alert, Platform } from 'react-native';
import { triggerInAppConfirm } from '../context/ConfirmDialogContext';

/**
 * Cross-platform in-app confirmation dialog.
 *
 * Uses an in-app confirmation modal (never native browser alert/confirm popups)
 * on Web and Native, guaranteeing a unified, high-aesthetic dialog experience.
 */
export function confirmAction(options: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}): void {
  // Always trigger the custom in-app confirmation modal
  triggerInAppConfirm(options);
}

/** Cross-platform informational alert. */
export function notify(title: string, message?: string): void {
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    typeof window.alert === 'function'
  ) {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
