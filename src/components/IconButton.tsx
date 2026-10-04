// src/components/IconButton.tsx
//
// Icon-only button that carries a hover tooltip.
//
// `title` is a DOM attribute, so React Native's own TouchableOpacity types do
// not declare it. react-native-web forwards unrecognised props to the
// underlying element and the browser renders `title` as a native tooltip, so
// it is worth setting. React Native itself has no hover, so `label` is also
// mirrored onto accessibilityLabel for screen readers.
//
// The double cast is deliberately confined to this file so call sites can just
// pass `label` without fighting the type checker.

import React from 'react';
import { TouchableOpacity, type TouchableOpacityProps } from 'react-native';

export interface IconButtonProps extends TouchableOpacityProps {
  /** Tooltip text. Rendered as a hover tooltip on web and read aloud on native. */
  label?: string;
}

export default function IconButton({ label, accessibilityLabel, ...rest }: IconButtonProps) {
  const tooltip = label ? ({ title: label } as unknown as TouchableOpacityProps) : {};

  return (
    <TouchableOpacity
      accessibilityRole="button"
      {...rest}
      accessibilityLabel={accessibilityLabel ?? label}
      {...tooltip}
    />
  );
}
