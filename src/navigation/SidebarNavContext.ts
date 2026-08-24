// Shares the root NavigationContainer ref + a state-change version counter
// with the persistent role sidebar, which lives outside any Navigator and
// therefore cannot use react-navigation's useNavigation/useNavigationState.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext } from 'react';
import type { NavigationContainerRef } from '@react-navigation/native';

export interface SidebarNavValue {
  navRef: React.MutableRefObject<NavigationContainerRef<any> | null>;
  version: number;
}

export const SidebarNavContext = createContext<SidebarNavValue>({
  navRef: { current: null },
  version: 0,
});
