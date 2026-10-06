import React, { createContext, useContext, useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { AuthSession, Role } from '../types';
import { authApi } from '../api/resources/auth';
import { setAccessToken, getAccessTokenExpiryMs } from '../api/token';
import { setTokenRefreshHandler } from '../api/http/client';
import { useToast } from './ToastContext';

export const ROLES = {
  TEACHER: 'teacher',
  THERAPIST: 'therapist',
  COORDINATOR: 'coordinator',
  DIRECTOR: 'director',
  PROGRAM_DIRECTOR: 'program_director',
  INSTITUTIONAL_ADMIN: 'institutional_admin',
  SYSTEM_ADMIN: 'system_admin',
  PARENT: 'parent',
} as const;

export function normalizeRole(rawRole?: string): Role {
  if (!rawRole) return 'teacher';
  const lower = rawRole.toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (lower === 'therapist' || lower === 'teacher' || lower === 'clinical_staff') {
    return 'teacher';
  }
  if (lower === 'coordinator' || lower === 'therapy_coordinator') {
    return 'coordinator';
  }
  if (lower === 'director') return 'director';
  if (lower === 'program_director') return 'program_director';
  if (lower === 'institutional_admin' || lower === 'institutional_administrator' || lower === 'admin') {
    return 'institutional_admin';
  }
  if (lower === 'system_admin' || lower === 'system_administrator' || lower === 'sysadmin') {
    return 'system_admin';
  }
  if (lower === 'parent') return 'parent';
  return lower as Role;
}

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
          try {
            const user = await authApi.me();
            setSession({
              role: normalizeRole(user.role),
              userName: user.name,
              email: user.email,
            });
          } catch (meErr) {
            console.warn('Failed to restore session (token expired or invalid):', meErr);
            await setAccessToken(null);
          }
        }
      } catch (err) {
        console.warn('Failed to restore session:', err);
        await setAccessToken(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  // Let the http client refresh transparently when a request fails with 401 or
  // the backend's 400 "expired JWT access token".
  useEffect(() => {
    setTokenRefreshHandler(() => authApi.refresh());
    return () => setTokenRefreshHandler(null);
  }, []);

  const loginWithCredentials = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      await authApi.login({ email: email.trim(), password: password.trim() });
      const user = await authApi.me();
      setSession({
        role: normalizeRole(user.role),
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

  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  // Access tokens last 15 minutes and the backend rejects refresh requests once
  // they have expired, so refresh proactively before `exp`.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      const expMs = getAccessTokenExpiryMs();
      const leadMs = 60_000;
      const delay = expMs ? Math.max(5_000, expMs - Date.now() - leadMs) : 60_000;
      timer = setTimeout(async () => {
        if (cancelled) return;
        const ok = await authApi.refresh();
        if (cancelled) return;
        if (ok) {
          schedule();
          return;
        }
        const stillValid = getAccessTokenExpiryMs();
        if (stillValid && stillValid > Date.now()) {
          schedule(); // transient failure while the current token is still usable
          return;
        }
        logoutRef.current();
      }, delay);
    };

    schedule();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [session]);

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
