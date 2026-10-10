export const colors = {
  // Brand
  primaryYellow: '#F6C445', // main CTA buttons (Start Session, Sign In, active tab)
  primaryYellowDark: '#E0AE2E',
  primaryBlue: '#2563EB',
  purple: '#8B5CF6',
  successGreen: '#22C55E',
  navyText: '#1A2233', // headings, nav text
  bodyText: '#4B5563', // secondary/body text
  mutedText: '#6B7280', // placeholders, timestamps (WCAG AA compliant 4.5:1+ on white)

  // Backgrounds
  bgApp: '#F4F5F7', // page background (light grey)
  bgCard: '#FFFFFF', // card surfaces
  bgFooter: '#1A2233', // dark footer bar
  bgActiveCardBorder: '#3B82F6', // blue outline on "Active" student card

  // Semantic status & feedback
  error: '#DC2626',
  errorLight: '#FEE2E2',
  errorDark: '#991B1B',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#B45309',
  success: '#16A34A',
  successLight: '#DCFCE7',
  successDark: '#15803D',
  info: '#2563EB',
  infoLight: '#DBEAFE',
  infoDark: '#1D4ED8',

  // Dark surfaces & overlays
  surfaceDark: '#1E293B',
  surfaceDarkText: '#F8FAFC',

  // Status pills
  statusInProgressBg: '#DBEAFE',
  statusInProgressText: '#2563EB',
  statusCompletedBg: '#D1FAE5',
  statusCompletedText: '#059669',
  statusNotStartedBg: '#F3F4F6',
  statusNotStartedText: '#6B7280',
  statusPendingBg: '#FEF3C7',
  statusPendingText: '#B45309',
  statusRevisionBg: '#FEE2E2',
  statusRevisionText: '#DC2626',
  statusApprovedBg: '#D1FAE5',
  statusApprovedText: '#059669',

  // Prompt entry buttons (FP / PP / G / +)
  promptFP: '#FCA5A5', // full physical - red/pink
  promptPP: '#FCD34D', // partial physical - amber
  promptG: '#93C5FD', // gestural - blue
  promptIndependent: '#86EFAC', // "+" independent - green

  border: '#E5E7EB',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
  full: 999,
} as const;

import { Platform } from 'react-native';

export function makeShadow(offsetY = 2, blur = 4, opacity = 0.1, color = '0, 0, 0', elevation = 2) {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0px ${offsetY}px ${blur}px rgba(${color}, ${opacity})`,
    } as any;
  }
  return {
    shadowColor: `rgb(${color})`,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation,
  };
}

export default colors;
