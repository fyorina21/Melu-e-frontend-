import React, { Suspense, lazy } from 'react';
import { Platform, View } from 'react-native';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import type {
  NavigationContainerRef,
  NavigationState,
  PartialState,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth, ROLES } from '../context/AuthContext';
import type { Role } from '../types';
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import RoleSidebar from '../components/RoleSidebar';
import ScreenLoader from '../components/ScreenLoader';
import { SidebarNavContext } from './SidebarNavContext';
import { storage } from '../utils/storage';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Lazy-loaded role stacks for optimal bundle splitting and fast initial page loads
const SessionStack = lazy(() => import('./SessionStack'));
const CoordinatorStack = lazy(() => import('./CoordinatorStack'));
const ProgramDirectorStack = lazy(() => import('./ProgramDirectorStack'));
const DirectorStack = lazy(() => import('./DirectorStack'));
const InstitutionalAdminStack = lazy(() => import('./InstitutionalAdminStack'));
const SystemAdminStack = lazy(() => import('./SystemAdminStack'));
const ParentStack = lazy(() => import('./ParentStack'));

const Stack = createNativeStackNavigator();

// Roles whose navigation lives in a persistent docked sidebar instead of
// the top navbar tabs.
const SIDEBAR_ROLES = new Set<string>([ROLES.INSTITUTIONAL_ADMIN, ROLES.SYSTEM_ADMIN]);

const STACK_BY_ROLE: Record<string, React.ComponentType> = {
  [ROLES.TEACHER]: SessionStack,
  [ROLES.THERAPIST]: SessionStack,
  [ROLES.COORDINATOR]: CoordinatorStack,
  [ROLES.PROGRAM_DIRECTOR]: ProgramDirectorStack,
  [ROLES.DIRECTOR]: DirectorStack,
  [ROLES.INSTITUTIONAL_ADMIN]: InstitutionalAdminStack,
  [ROLES.SYSTEM_ADMIN]: SystemAdminStack,
  [ROLES.PARENT]: ParentStack,
};

/** Recursively walks nested navigation state to find the active leaf screen name and route. */
function getActiveRoute(
  state: NavigationState | PartialState<NavigationState> | undefined,
): { name: string; params?: Record<string, any> } | undefined {
  if (!state || state.routes == null) return undefined;
  const index = state.index ?? state.routes.length - 1;
  const route = state.routes[index];
  if (route?.state) {
    return getActiveRoute(route.state as NavigationState);
  }
  return route as { name: string; params?: Record<string, any> } | undefined;
}

/** Push the current screen name into the browser URL bar (web only). */
function syncUrlToScreen(state: NavigationState | undefined): void {
  if (Platform.OS !== 'web' || !state) return;
  const route = getActiveRoute(state);
  if (route?.name) {
    const sid = route.params?.studentId;
    if (sid) {
      storage.setSync('last_assessment_student_id', sid);
    }
    const query = sid ? `?studentId=${encodeURIComponent(sid)}` : '';
    window.history.replaceState(null, '', `/${route.name}${query}`);
  }
}

function AppNavigator() {
  const { session } = useAuth();

  if (!session) {
    return (
      <ErrorBoundary screenName="Auth Navigator">
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
      </ErrorBoundary>
    );
  }

  // Resolves the role's stack; configured custom roles fall back to SessionStack
  const RoleStack = STACK_BY_ROLE[session.role] || STACK_BY_ROLE[ROLES.TEACHER];

  return (
    <ErrorBoundary screenName={`${session.role} Navigator`}>
      <Suspense fallback={<ScreenLoader />}>
        {SIDEBAR_ROLES.has(session.role) ? (
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <RoleSidebar role={session.role} />
            <View style={{ flex: 1 }}>
              <RoleStack />
            </View>
          </View>
        ) : (
          <RoleStack />
        )}
      </Suspense>
    </ErrorBoundary>
  );
}

export default function RootNavigator() {
  const navRef = React.useRef<NavigationContainerRef<any>>(null);
  const { session } = useAuth();
  const deepLinkRestored = React.useRef(false);
  const [navVersion, setNavVersion] = React.useState(0);

  // On web, restore the screen from the URL after login/session restore so a
  // refresh keeps the user where they were instead of bouncing to the
  // role's initial (dashboard) route.
  React.useEffect(() => {
    if (Platform.OS !== 'web' || !session || !navRef.current) return;
    if (deepLinkRestored.current) {
      syncUrlToScreen(navRef.current.getState() as NavigationState);
      return;
    }
    deepLinkRestored.current = true;

    const target = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (!target || target === 'Login' || target === 'ForgotPassword') {
      window.history.replaceState(null, '', '/');
      return;
    }

    const nav = navRef.current;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const sid =
        searchParams.get('studentId') ||
        storage.getSync('last_assessment_student_id') ||
        'student-a';
      nav.navigate(target, { studentId: sid });
    } catch {
      // Unknown route name — fall through and reset the URL below.
    }
    if (nav.getCurrentRoute()?.name !== target) {
      window.history.replaceState(null, '', '/');
    }
  }, [session]);

  return (
    <NavigationIndependentTree>
      <NavigationContainer
        key={session?.role ?? 'auth'}
        ref={navRef}
        onStateChange={(state) => {
          syncUrlToScreen(state);
          setNavVersion((v) => v + 1);
        }}
        onReady={() => {
          if (Platform.OS === 'web' && navRef.current) {
            syncUrlToScreen(navRef.current.getState());
          }
        }}
      >
        <SidebarNavContext.Provider value={{ navRef, version: navVersion }}>
          <AppNavigator />
        </SidebarNavContext.Provider>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}
