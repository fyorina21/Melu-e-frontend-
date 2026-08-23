import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import type { NavigationContainerRef, NavigationState, PartialState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth, ROLES } from '../context/AuthContext';
import type { Role } from '../types';
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import SessionStack from './SessionStack';
import CoordinatorStack from './CoordinatorStack';
import ProgramDirectorStack from './ProgramDirectorStack';
import DirectorStack from './DirectorStack';
import InstitutionalAdminStack from './InstitutionalAdminStack';
import SystemAdminStack from './SystemAdminStack';
import ParentStack from './ParentStack';

const Stack = createNativeStackNavigator();

const STACK_BY_ROLE: Record<Role, () => React.JSX.Element> = {
  [ROLES.TEACHER]: SessionStack,
  [ROLES.COORDINATOR]: CoordinatorStack,
  [ROLES.PROGRAM_DIRECTOR]: ProgramDirectorStack,
  [ROLES.DIRECTOR]: DirectorStack,
  [ROLES.INSTITUTIONAL_ADMIN]: InstitutionalAdminStack,
  [ROLES.SYSTEM_ADMIN]: SystemAdminStack,
  [ROLES.PARENT]: ParentStack,
};

/** Recursively walks nested navigation state to find the active leaf screen name. */
function getActiveRouteName(
  state: NavigationState | PartialState<NavigationState> | undefined,
): string | undefined {
  if (!state || state.routes == null) return undefined;
  const index = state.index ?? state.routes.length - 1;
  const route = state.routes[index];
  if (route?.state) {
    return getActiveRouteName(route.state as NavigationState);
  }
  return route?.name;
}

/** Push the current screen name into the browser URL bar (web only). */
function syncUrlToScreen(state: NavigationState | undefined): void {
  if (Platform.OS !== 'web' || !state) return;
  const name = getActiveRouteName(state);
  if (name) {
    window.history.replaceState(null, '', `/${name}`);
  }
}

function AppNavigator() {
  const { session } = useAuth();

  if (!session) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      </Stack.Navigator>
    );
  }

  const RoleStack = STACK_BY_ROLE[session.role];
  if (!RoleStack) {
    throw new Error(`No navigation stack registered for role: ${session.role}`);
  }
  return <RoleStack />;
}

export default function RootNavigator() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navRef = React.useRef<NavigationContainerRef<any>>(null);

  return (
    <NavigationIndependentTree>
      <NavigationContainer
        ref={navRef}
        onStateChange={syncUrlToScreen}
        onReady={() => {
          // Sync URL for the very first screen since onStateChange only fires on changes.
          if (Platform.OS === 'web' && navRef.current) {
            syncUrlToScreen(navRef.current.getState() as NavigationState);
          }
        }}
      >
        <AppNavigator />
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}
