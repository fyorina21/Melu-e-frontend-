export const colors = {
  // Brand
  primaryYellow: '#F6C445', // main CTA buttons (Start Session, Sign In, active tab)
  primaryYellowDark: '#E0AE2E', // pressed state
  navyText: '#1A2233', // headings, nav text
  bodyText: '#4B5563', // secondary/body text
  mutedText: '#9CA3AF', // placeholders, timestamps

  // Backgrounds
  bgApp: '#F4F5F7', // page background (light grey)
  bgCard: '#FFFFFF', // card surfaces
  bgFooter: '#1A2233', // dark footer bar
  bgActiveCardBorder: '#3B82F6', // blue outline on "Active" student card (Image 2)

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

  // Prompt entry buttons (Image 2: FP / PP / G / +)
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
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

export default colors;
