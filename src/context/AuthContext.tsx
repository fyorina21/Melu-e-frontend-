import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import type { DemoAccount, AuthSession, Role } from '../types';

export const ROLES = {
  TEACHER: 'teacher',
  COORDINATOR: 'coordinator',
  DIRECTOR: 'director',
  PROGRAM_DIRECTOR: 'program_director',
  INSTITUTIONAL_ADMIN: 'institutional_admin',
  SYSTEM_ADMIN: 'system_admin',
  PARENT: 'parent',
} as const;

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: ROLES.TEACHER, label: 'Teacher', email: 'teacher@melue.org', userName: 'Teacher A' },
  { role: ROLES.COORDINATOR, label: 'Coordinator', email: 'coordinator@melue.org', userName: 'Coordinator A' },
  { role: ROLES.DIRECTOR, label: 'Director', email: 'director@melue.org', userName: 'Director A' },
  { role: ROLES.INSTITUTIONAL_ADMIN, label: 'Institutional Admin', email: 'admin@melue.org', userName: 'Admin A' },
  { role: ROLES.SYSTEM_ADMIN, label: 'System Admin', email: 'sysadmin@melue.org', userName: 'Sysadmin A' },
];
// Note: Program Director and Parent aren't in the Figma's demo account
// list, but exist in the spec docs. Added as selectable roles below even
// though there's no matching Figma demo row.
export const EXTRA_ROLES: DemoAccount[] = [
  { role: ROLES.PROGRAM_DIRECTOR, label: 'Program Director', email: 'pd@melue.org', userName: 'Program Director A' },
  { role: ROLES.PARENT, label: 'Parent', email: 'parent@melue.org', userName: 'Parent A' },
];

interface AuthContextValue {
  session: AuthSession | null;
  loginAsRole: (account: DemoAccount) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null); // { role, userName, email } | null

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loginAsRole: (account: DemoAccount) => setSession(account),
      logout: () => setSession(null),
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
