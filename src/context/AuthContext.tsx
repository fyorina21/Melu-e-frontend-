import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { DemoAccount, AuthSession, Role } from '../types';
import { authApi } from '../api/resources/auth';
import { useToast } from './ToastContext';

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
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await authApi.restore();
        if (token) {
          const user = await authApi.me();
          setSession({
            role: user.role as Role,
            userName: user.name,
            email: user.email,
          });
        }
      } catch (err) {
        console.warn('Failed to restore session:', err);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  const loginAsRole = async (account: DemoAccount) => {
    try {
      setLoading(true);
      await authApi.login({ email: account.email, password: 'demo1234' });
      const user = await authApi.me();
      setSession({
        role: user.role as Role,
        userName: user.name,
        email: user.email,
      });
      showToast(`Welcome back, ${user.name}!`, 'success');
    } catch (err) {
      console.error('Login failed:', err);
      showToast('Login failed. Please check your credentials and try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API failed:', err);
    } finally {
      setSession(null);
      showToast('You have been signed out.', 'info');
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loginAsRole,
      logout,
    }),
    [session]
  );

  if (loading) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
