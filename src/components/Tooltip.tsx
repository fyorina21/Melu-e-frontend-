// src/components/Tooltip.tsx
//
// Cross-platform hover tooltip for web with screen-reader accessibility support.
// In react-native-web, the native `title` JSX prop is stripped from DOM output.
// This component renders an instant, sleek floating tooltip bubble on hover
// and imperatively binds the native DOM `title` attribute so browser tooltips
// and accessibility trees have full support.

import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import { View, Text, StyleSheet, Platform, type ViewStyle } from 'react-native';

export interface TooltipProps {
  label?: string;
  children: ReactNode;
  style?: ViewStyle;
  placement?: 'top' | 'bottom';
}

export default function Tooltip({ label, children, style, placement = 'top' }: TooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
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
    <View
      ref={containerRef}
      style={[styles.container, style]}
      {...(Platform.OS === 'web'
        ? {
            onMouseEnter: () => setIsHovered(true),
            onMouseLeave: () => setIsHovered(false),
          }
        : {})}
    >
      {children}
      {Platform.OS === 'web' && isHovered && (
        <View
          pointerEvents="none"
          style={[
            styles.tooltip,
            placement === 'bottom' ? styles.placementBottom : styles.placementTop,
          ]}
        >
          <Text style={styles.text}>{label}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#0F172A', // Slate-900
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 6,
    zIndex: 99999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 10,
    minWidth: 50,
    maxWidth: 240,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  placementTop: {
    bottom: '100%',
    marginBottom: 6,
  },
  placementBottom: {
    top: '100%',
    marginTop: 6,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
});
