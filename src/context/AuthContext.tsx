import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { AuthSession, Role } from '../types';
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

interface AuthContextValue {
  session: AuthSession | null;
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
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

  const loginWithCredentials = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      await authApi.login({ email: email.trim(), password: password.trim() });
      const user = await authApi.me();
      setSession({
        role: user.role as Role,
        userName: user.name,
        email: user.email,
      });
      showToast(`Welcome back, ${user.name}!`, 'success');
      return true;
    } catch (err: any) {
      console.error('Login failed:', err);
      const msg = err?.response?.data?.message || err?.message || 'Invalid email or password.';
      showToast(msg, 'error');
      return false;
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
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(null, '', '/');
      }
      showToast('You have been signed out.', 'info');
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loginWithCredentials,
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
