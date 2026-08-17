import React from 'react';
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

export default function RootNavigator() {
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
    // Should never happen with the current ROLES/DEMO_ACCOUNTS set, but
    // fail loudly rather than silently rendering nothing if it ever does.
    throw new Error(`No navigation stack registered for role: ${session.role}`);
  }
  return <RoleStack />;
}
