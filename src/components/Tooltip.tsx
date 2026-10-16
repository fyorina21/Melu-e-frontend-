// src/components/Tooltip.tsx
//
// Cross-platform hover tooltip for web with screen-reader accessibility support.
// In react-native-web, the native `title` JSX prop is stripped from DOM output.
// This component imperatively binds the native DOM `title` attribute directly on
// the DOM node so standard browser hover tooltips and accessibility trees work properly.

import React, { useRef, useEffect, type ReactNode } from 'react';
import { View, StyleSheet, Platform, type ViewStyle } from 'react-native';

export interface TooltipProps {
  label?: string;
  children: ReactNode;
  style?: ViewStyle;
  placement?: 'top' | 'bottom';
}

export default function Tooltip({ label, children, style }: TooltipProps) {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && containerRef.current && label) {
      try {
        const el = containerRef.current;
        if (typeof el.setAttribute === 'function') {
          el.setAttribute('title', label);
        }
        el.title = label;
      } catch {}
    }
  }, [label]);

  if (!label) {
    return <>{children}</>;
  }

  return (
    <View ref={containerRef} style={[styles.container, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
