import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export const MOBILE = 640;
export const DESKTOP = 1024;

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  if (width >= DESKTOP) return 'desktop';
  if (width >= MOBILE) return 'tablet';
  return 'mobile';
}