import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/api/queryClient';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Prevent pages from entering Back-Forward Cache (bfcache), which breaks
    // Metro HMR / Fast Refresh WebSockets when navigating away.
    const noopUnload = () => {};
    window.addEventListener('unload', noopUnload);

    // If restored from bfcache by the browser, force a reload to reconnect Metro WebSockets cleanly.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    // Filter out false-alarm Metro disconnect warnings emitted during bfcache / pagehide transitions
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      const msg = typeof args[0] === 'string' ? args[0] : '';
      if (
        msg.includes('Cannot connect to Metro') &&
        (document.visibilityState === 'hidden' || msg.includes('Error: undefined'))
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };

    return () => {
      window.removeEventListener('unload', noopUnload);
      window.removeEventListener('pageshow', handlePageShow);
      console.warn = originalWarn;
    };
  }, []);

  return (
    <ErrorBoundary screenName="Root Application">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
