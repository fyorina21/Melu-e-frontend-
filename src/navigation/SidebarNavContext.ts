// Shares the root NavigationContainer ref + a state-change version counter
// with the persistent role sidebar, which lives outside any Navigator and
// therefore cannot use react-navigation's useNavigation/useNavigationState.
/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from 'react';
import { createContext, useContext } from 'react';
import type { NavigationContainerRef } from '@react-navigation/native';

export interface SidebarNavValue {
  navRef: React.MutableRefObject<NavigationContainerRef<any> | null>;
  version: number;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
}

export const SidebarNavContext = createContext<SidebarNavValue>({
  navRef: { current: null },
  version: 0,
  isCollapsed: false,
  setIsCollapsed: () => {},
  toggleSidebar: () => {},
});

export function useSidebarNav() {
  return useContext(SidebarNavContext);
}
