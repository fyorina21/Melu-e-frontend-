import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Slot } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/api/queryClient';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';
import { ConfirmDialogProvider } from '../src/context/ConfirmDialogContext';
import { UnsavedChangesProvider } from '../src/context/UnsavedChangesContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Prevent pages from entering Back-Forward Cache (bfcache), which breaks
    // Metro HMR / Fast Refresh WebSockets when navigating away.
    const noopUnload = () => {};
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('unload', noopUnload);
      window.addEventListener('pageshow', handlePageShow);
    }

    // Filter out false-alarm Metro disconnect and WebSocket bfcache warnings/errors
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      const msg = typeof args[0] === 'string' ? args[0] : '';
      if (
        (msg.includes('Cannot connect to Metro') &&
          (document.visibilityState === 'hidden' || msg.includes('Error: undefined'))) ||
        msg.includes('Back-Forward Cache') ||
        (msg.includes('WebSocket') && msg.includes('/hot'))
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };

    const originalError = console.error;
    console.error = (...args: any[]) => {
      const msg = typeof args[0] === 'string' ? args[0] : String(args[0] || '');
      if (
        (msg.includes('WebSocket') || msg.includes('ws://')) &&
        (msg.includes('Back-Forward Cache') || msg.includes('/hot') || msg.includes('failed: Page entered'))
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    const handleGlobalError = (event: ErrorEvent) => {
      const msg = String(event?.message || '');
      if (
        (msg.includes('WebSocket') || msg.includes('ws://')) &&
        (msg.includes('Back-Forward Cache') || msg.includes('/hot') || msg.includes('failed: Page entered'))
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener('error', handleGlobalError, true);

    // Inject runtime font-display: swap for any dynamically generated web font styles
    if (typeof document !== 'undefined' && !document.getElementById('font-swap-enforcer')) {
      const fontStyle = document.createElement('style');
      fontStyle.id = 'font-swap-enforcer';
      fontStyle.textContent = `
        @font-face { font-family: 'Ionicons'; font-display: swap; }
        @font-face { font-family: 'ionicons'; font-display: swap; }
        @font-face { font-family: 'Feather'; font-display: swap; }
        @font-face { font-family: 'feather'; font-display: swap; }
      `;
      document.head.appendChild(fontStyle);
    }

    return () => {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('unload', noopUnload);
        window.removeEventListener('pageshow', handlePageShow);
      }
      console.warn = originalWarn;
      console.error = originalError;
      window.removeEventListener('error', handleGlobalError, true);
    };
  }, []);

  return (
    <ErrorBoundary screenName="Root Application">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <UnsavedChangesProvider>
              <ConfirmDialogProvider>
                <Slot />
              </ConfirmDialogProvider>
            </UnsavedChangesProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
