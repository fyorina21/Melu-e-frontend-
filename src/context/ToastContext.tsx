import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-triangle';
      default: return 'info';
    }
  };

  const getBgColor = (type: ToastType) => {
    switch (type) {
      case 'success': return '#E6F4EA';
      case 'error': return '#FCE8E6';
      default: return '#E8F0FE';
    }
  };

  const getTextColor = (type: ToastType) => {
    switch (type) {
      case 'success': return '#137333';
      case 'error': return '#C5221F';
      default: return '#1A73E8';
    }
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((toast) => (
          <View
            key={toast.id}
            style={[styles.toast, { backgroundColor: getBgColor(toast.type) }]}
          >
            <Feather
              name={getIcon(toast.type)}
              size={16}
              color={getTextColor(toast.type)}
              style={styles.icon}
            />
            <Text style={[styles.text, { color: getTextColor(toast.type) }]}>
              {toast.message}
            </Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 24 : 48,
    right: 24,
    alignItems: 'flex-end',
    gap: spacing.sm,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: 480,
    width: '100%',
  },
  icon: { marginRight: spacing.sm },
  text: { fontSize: 13, fontWeight: '600' },
});
