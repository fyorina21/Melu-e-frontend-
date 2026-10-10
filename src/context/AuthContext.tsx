import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import type { AuthSession, Role } from '../types';
import { authApi } from '../api/resources/auth';
import {
  setAccessToken,
  clearAuthTokens,
  setActiveRole,
  setUserRoles,
  getActiveRole,
  getUserRoles,
} from '../api/token';
import { setTokenRefreshHandler, setSessionExpiredHandler } from '../api/http/client';
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
  const lower = rawRole
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_');
  if (lower === 'therapist') {
    return 'therapist';
  }
  if (lower === 'teacher' || lower === 'clinical_staff') {
    return 'teacher';
  }
  if (lower === 'coordinator' || lower === 'therapy_coordinator') {
    return 'coordinator';
  }
  if (lower === 'director') return 'director';
  if (lower === 'program_director') return 'program_director';
  if (
    lower === 'institutional_admin' ||
    lower === 'institutional_administrator' ||
    lower === 'admin'
  ) {
    return 'institutional_admin';
  }
  if (lower === 'system_admin' || lower === 'system_administrator' || lower === 'sysadmin') {
    return 'system_admin';
  }
  if (lower === 'parent') return 'parent';
  return lower as Role;
}

/**
 * Build the de-duplicated list of roles the user can switch between, with the
 * primary (currently active) role first. Falls back to the teacher role so the
 * navbar always has something to render.
 */
function resolveRoles(rawRoles?: string[], primary?: string, fallback?: string): Role[] {
  const candidates = [
    ...(primary ? [primary] : []),
    ...(rawRoles ?? []),
    ...(fallback ? [fallback] : []),
  ];
  const seen = new Set<Role>();
  const roles: Role[] = [];
  for (const candidate of candidates) {
    const role = normalizeRole(candidate);
    if (!seen.has(role)) {
      seen.add(role);
      roles.push(role);
    }
  }
  return roles.length ? roles : [ROLES.TEACHER];
}

interface AuthContextValue {
  session: AuthSession | null;
  loginWithCredentials: (
    email: string,
    password: string,
    rememberDevice?: boolean,
  ) => Promise<boolean>;
  switchRole: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    setTokenRefreshHandler(authApi.refreshToken);
    setSessionExpiredHandler(() => {
      setSession(null);
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(null, '', '/');
      }
      showToast('Your session has expired. Please sign in again.', 'info');
    });

    async function restoreSession() {
      try {
        const token = await authApi.restore();
        if (token) {
          try {
            const user = await authApi.me();
            const roles = resolveRoles(user.roles, user.role);
            setActiveRole(roles[0]);
            setUserRoles(roles);
            setSession({
              role: roles[0],
              roles,
              userName: user.name,
              email: user.email,
              modules: user.modules,
              permissions: user.permissions,
            });
          } catch (meErr) {
            // Attempt token refresh before discarding session
            const freshToken = await authApi.refreshToken();
            if (freshToken) {
              try {
                const user = await authApi.me();
                const roles = resolveRoles(user.roles, user.role);
                setActiveRole(roles[0]);
                setUserRoles(roles);
                setSession({
                  role: roles[0],
                  roles,
                  userName: user.name,
                  email: user.email,
                });
              } catch {
                await clearAuthTokens();
              }
            } else {
              console.warn('Failed to restore session (token expired and refresh failed):', meErr);
              await clearAuthTokens();
            }
          }
        }
      } catch (err) {
        console.warn('Failed to restore session:', err);
        await clearAuthTokens();
      } finally {
        setLoading(false);
      }
    }
    restoreSession();

    return () => {
      setTokenRefreshHandler(null);
      setSessionExpiredHandler(null);
    };
  }, [showToast]);

  const loginWithCredentials = async (
    email: string,
    password: string,
    rememberDevice = false,
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await authApi.login({
        email: email.trim(),
        password: password.trim(),
        rememberDevice,
      });
      const user = await authApi.me();
      const roles = resolveRoles(user.roles, result.role, user.role);
      setActiveRole(roles[0]);
      setUserRoles(roles);
      setSession({
        role: roles[0],
        roles,
        userName: user.name,
        email: user.email,
        modules: user.modules,
        permissions: user.permissions,
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

  /**
   * Switch the active role without re-authenticating. The token already
   * carries every granted role, so this only changes which role's tab set and
   * home route the shell renders.
   */
  const switchRole = useCallback((role: Role) => {
    setSession((prev) => {
      if (!prev) return prev;
      const roles = prev.roles?.length ? prev.roles : [role];
      if (!roles.includes(role)) return prev;
      if (prev.role === role) return prev;
      setActiveRole(role);
      return { ...prev, role };
    });
  }, []);

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API failed:', err);
    } finally {
      setActiveRole(null);
      setUserRoles([]);
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
      switchRole,
      logout,
    }),
    [session],
  );

  if (loading) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx) return ctx;

  const role = getActiveRole();
  const roles = getUserRoles();
  const session: AuthSession | null = role
    ? {
        role,
        roles: roles.length > 0 ? roles : [role],
        userName: 'User',
        email: '',
      }
    : null;

  return {
    session,
    loginWithCredentials: async () => false,
    switchRole: () => {},
    logout: () => {},
  };
}
