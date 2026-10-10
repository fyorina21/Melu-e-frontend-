import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirmation dialog.
 *
 * `react-native-web`'s `Alert` is a no-op, so any screen that relies on
 * `Alert.alert` for confirmations has a dead button on web. This helper falls
 * back to the browser's native `window.confirm` when running on web, and to
 * `Alert.alert` on native platforms.
 */
export function confirmAction(options: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}): void {
  const {
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive = false,
    onConfirm,
  } = options;

  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    typeof window.confirm === 'function'
  ) {
    const prompt = message ? `${title}\n\n${message}` : title;
    if (window.confirm(prompt)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    {
      text: confirmLabel,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}

/** Cross-platform informational alert (web uses `window.alert`). */
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
