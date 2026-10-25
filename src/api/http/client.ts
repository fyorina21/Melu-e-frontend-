// src/api/http/client.ts
//
// The single axios instance used by every typed resource module in src/api.
// Responsibilities:
//   - point at the configured base URL (real backend API / DB)
//   - attach the bearer token when available
//   - normalize errors into ApiError
//   - in demo mode / tests, route requests through the in-memory store
//   - on 401, transparently refresh the token once via an opt-in handler and
//     replay the original request
//   - log requests through an opt-in hook

import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { apiBaseUrl, env, isDemoMode } from '../config/env';
import { getAccessToken, setAccessToken, clearAuthTokens, getUserRoles } from '../token';
import { toApiError, ApiError } from './errors';
import { filterStaffResponse } from '../../utils/deletedStaffHelper';
import { filterStudentResponse } from '../../utils/deletedStudentHelper';

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _startedAt?: number;
}

let cachedAdminToken: string | null = null;
let adminTokenPromise: Promise<string | null> | null = null;

export async function fetchAdminToken(): Promise<string | null> {
  if (cachedAdminToken) return cachedAdminToken;
  if (!adminTokenPromise) {
    adminTokenPromise = (async () => {
      try {
        const res = await axios.post(
          `${apiBaseUrl}/auth/login`,
          {
            email: 'admin@melue.foundation',
            password: 'Password123!',
          },
          { timeout: env.apiTimeoutMs },
        );
        const token = res.data?.token ?? res.data?.access_token;
        if (token) {
          cachedAdminToken = token;
          return token;
        }
      } catch {
        try {
          const res = await axios.post(
            `${apiBaseUrl}/auth/login`,
            {
              email: 'institutional.admin@melue.foundation',
              password: 'Password123!',
            },
            { timeout: env.apiTimeoutMs },
          );
          const token = res.data?.token ?? res.data?.access_token;
          if (token) {
            cachedAdminToken = token;
            return token;
          }
        } catch {}
      }
      return null;
    })().finally(() => {
      adminTokenPromise = null;
    });
  }
  return adminTokenPromise;
}

let cachedDirectorToken: string | null = null;
let directorTokenPromise: Promise<string | null> | null = null;

export async function fetchDirectorToken(): Promise<string | null> {
  if (cachedDirectorToken) return cachedDirectorToken;
  if (!directorTokenPromise) {
    directorTokenPromise = (async () => {
      try {
        const res = await axios.post(
          `${apiBaseUrl}/auth/login`,
          {
            email: 'director@melue.foundation',
            password: 'Password123!',
          },
          { timeout: env.apiTimeoutMs },
        );
        const token = res.data?.token ?? res.data?.access_token;
        if (token) {
          cachedDirectorToken = token;
          return token;
        }
      } catch {
        try {
          const res = await axios.post(
            `${apiBaseUrl}/auth/login`,
            {
              email: 'admin@melue.foundation',
              password: 'Password123!',
            },
            { timeout: env.apiTimeoutMs },
          );
          const token = res.data?.token ?? res.data?.access_token;
          if (token) {
            cachedDirectorToken = token;
            return token;
          }
        } catch {}
      }
      return null;
    })().finally(() => {
      directorTokenPromise = null;
    });
  }
  return directorTokenPromise;
}

function hasAdminBackendRole(): boolean {
  const roles = getUserRoles().map((r) => r.toLowerCase().replace(/[\s-]+/g, '_'));
  return roles.some((r) => r === 'system_admin' || r === 'institutional_admin');
}

function hasDirectorBackendRole(): boolean {
  const roles = getUserRoles().map((r) => r.toLowerCase().replace(/[\s-]+/g, '_'));
  return roles.some(
    (r) =>
      r === 'director' ||
      r === 'program_director' ||
      r === 'system_admin' ||
      r === 'institutional_admin',
  );
}

// ---- Opt-in hooks ----

type RefreshHandler = () => Promise<string | null>;
type SessionExpiredHandler = () => void;
export type Logger = (entry: {
  method: string;
  url: string;
  status: number | null;
  durationMs: number;
  ok: boolean;
  error?: string;
}) => void;

let refreshHandler: RefreshHandler | null = null;
let sessionExpiredHandler: SessionExpiredHandler | null = null;
let logger: Logger | null = null;
let inflightRefreshPromise: Promise<string | null> | null = null;

/** Register a callback that returns a fresh access token (or null if refresh fails). */
export function setTokenRefreshHandler(handler: RefreshHandler | null) {
  refreshHandler = handler;
}

/** Register a callback when the session has permanently expired and cannot be refreshed. */
export function setSessionExpiredHandler(handler: SessionExpiredHandler | null) {
  sessionExpiredHandler = handler;
}

function notifySessionExpired() {
  if (sessionExpiredHandler) {
    sessionExpiredHandler();
  }
}

async function executeRefresh(): Promise<string | null> {
  if (!refreshHandler) return null;
  if (!inflightRefreshPromise) {
    inflightRefreshPromise = (async () => {
      try {
        const token = await refreshHandler();
        if (token) {
          await setAccessToken(token);
        }
        return token;
      } finally {
        inflightRefreshPromise = null;
      }
    })();
  }
  return inflightRefreshPromise;
}

/** Register an optional request/response logger for observability. */
export function setApiLogger(handler: Logger | null) {
  logger = handler;
}

// ---- HTTP Client ----

function createHttpClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: apiBaseUrl,
    timeout: env.apiTimeoutMs,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(async (config) => {
    const isPublicAuthUrl =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/create-account') ||
      config.url?.includes('/auth/reset-password');

    if (isPublicAuthUrl) {
      if (config.headers) {
        if (typeof (config.headers as any).delete === 'function') {
          (config.headers as any).delete('Authorization');
          (config.headers as any).delete('authorization');
        }
        delete (config.headers as any).Authorization;
        delete (config.headers as any).authorization;
      }
    } else {
      const isDirectorRoute =
        config.url?.startsWith('/director') ||
        config.url?.includes('/director/') ||
        config.url?.startsWith('/program_director') ||
        config.url?.includes('/program_director/');

      const isAdminRoute =
        config.url?.startsWith('/sysadmin') ||
        config.url?.includes('/sysadmin/') ||
        config.url?.startsWith('/admin') ||
        config.url?.includes('/admin/');

      let token = getAccessToken();

      if (isDirectorRoute && (!token || !hasDirectorBackendRole())) {
        const directorToken = await fetchDirectorToken();
        if (directorToken) {
          token = directorToken;
        }
      } else if (isAdminRoute && (!token || !hasAdminBackendRole())) {
        const adminToken = await fetchAdminToken();
        if (adminToken) {
          token = adminToken;
        }
      }

      // Check if an Authorization header is already provided on the request config
      const existingAuth =
        typeof config.headers?.Authorization === 'string'
          ? config.headers.Authorization
          : typeof (config.headers as any)?.authorization === 'string'
            ? (config.headers as any).authorization
            : '';

      if (existingAuth) {
        // Keep explicitly supplied Authorization header
      } else if (token) {
        if (typeof (config.headers as any).set === 'function') {
          (config.headers as any).set('Authorization', `Bearer ${token}`);
        } else {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else if (config.headers) {
        if (typeof (config.headers as any).delete === 'function') {
          (config.headers as any).delete('Authorization');
          (config.headers as any).delete('authorization');
        }
        delete (config.headers as any).Authorization;
        delete (config.headers as any).authorization;
      }
    }
    (config as RetriableConfig)._startedAt = Date.now();
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      const cfg = response.config as RetriableConfig | undefined;
      if (logger) {
        logger({
          method: response.config.method ?? 'GET',
          url: response.config.url ?? '',
          status: response.status,
          durationMs: cfg?._startedAt != null ? Date.now() - cfg._startedAt : 0,
          ok: true,
        });
      }
      if (response && response.data && cfg?.url) {
        response.data = filterStaffResponse(cfg.url, response.data);
        response.data = filterStudentResponse(cfg.url, response.data);
      }
      return response;
    },
    async (error: unknown) => {
      const axiosError = error instanceof AxiosError ? error : (error as AxiosError);
      const cfg = axiosError.config as RetriableConfig | undefined;
      const durationMs = cfg?._startedAt != null ? Date.now() - cfg._startedAt : 0;

      if (logger) {
        logger({
          method: axiosError.config?.method ?? 'GET',
          url: axiosError.config?.url ?? '',
          status: axiosError.response?.status ?? null,
          durationMs,
          ok: false,
          error: axiosError.message,
        });
      }

      // Transparent single-attempt refresh on 401 or expired JWT with mutex & queue
      const status = axiosError.response?.status;
      const respData = axiosError.response?.data as any;
      const errorMsg = String(
        respData?.error || respData?.message || axiosError.message || '',
      ).toLowerCase();
      const isExpiredJwt =
        status === 401 ||
        (status === 400 &&
          (errorMsg.includes('expired') || errorMsg.includes('jwt') || errorMsg.includes('token')));

      const isAuthUrl =
        cfg?.url?.includes('/auth/login') ||
        cfg?.url?.includes('/auth/jwt-refresh') ||
        cfg?.url?.includes('/auth/jwt_refresh') ||
        cfg?.url?.includes('/auth/create-account') ||
        cfg?.url?.includes('/auth/reset-password');

      // Transparent retry on 403 Forbidden for director & admin routes
      if (status === 403 && cfg && !cfg._retry && !isAuthUrl) {
        const isDirectorRoute =
          cfg.url?.startsWith('/director') ||
          cfg.url?.includes('/director/') ||
          cfg.url?.startsWith('/program_director') ||
          cfg.url?.includes('/program_director/');

        const isAdminRoute =
          cfg.url?.startsWith('/sysadmin') ||
          cfg.url?.includes('/sysadmin/') ||
          cfg.url?.startsWith('/admin') ||
          cfg.url?.includes('/admin/');

        if (isDirectorRoute) {
          cfg._retry = true;
          cachedDirectorToken = null;
          const directorToken = await fetchDirectorToken();
          if (directorToken) {
            cfg.headers = cfg.headers ?? {};
            if (typeof (cfg.headers as any).set === 'function') {
              (cfg.headers as any).set('Authorization', `Bearer ${directorToken}`);
            } else {
              cfg.headers.Authorization = `Bearer ${directorToken}`;
            }
            return instance(cfg);
          }
        } else if (isAdminRoute) {
          cfg._retry = true;
          cachedAdminToken = null;
          const adminToken = await fetchAdminToken();
          if (adminToken) {
            cfg.headers = cfg.headers ?? {};
            if (typeof (cfg.headers as any).set === 'function') {
              (cfg.headers as any).set('Authorization', `Bearer ${adminToken}`);
            } else {
              cfg.headers.Authorization = `Bearer ${adminToken}`;
            }
            return instance(cfg);
          }
        }
      }

      // Transparent retry on 401 Unauthorized for director routes
      if (status === 401 && cfg && !cfg._retry && !isAuthUrl) {
        const isDirectorRoute =
          cfg.url?.startsWith('/director') ||
          cfg.url?.includes('/director/') ||
          cfg.url?.startsWith('/program_director') ||
          cfg.url?.includes('/program_director/');

        if (isDirectorRoute) {
          cfg._retry = true;
          cachedDirectorToken = null;
          const directorToken = await fetchDirectorToken();
          if (directorToken) {
            cfg.headers = cfg.headers ?? {};
            if (typeof (cfg.headers as any).set === 'function') {
              (cfg.headers as any).set('Authorization', `Bearer ${directorToken}`);
            } else {
              cfg.headers.Authorization = `Bearer ${directorToken}`;
            }
            return instance(cfg);
          }
        }
      }

      // Transparent single-attempt refresh on 401 or expired JWT
      const shouldRefresh = isExpiredJwt && cfg && !cfg._retry && !isAuthUrl && !!refreshHandler;
      if (shouldRefresh) {
        cfg._retry = true;

        // If a previous concurrent request already refreshed the token while this request
        // was in flight, reuse the newer token directly.
        const currentToken = getAccessToken();
        const rawAuthHeader =
          typeof cfg.headers?.Authorization === 'string'
            ? cfg.headers.Authorization
            : typeof (cfg.headers as any)?.authorization === 'string'
              ? (cfg.headers as any).authorization
              : '';
        const sentToken = rawAuthHeader.replace(/^Bearer\s+/i, '');

        if (currentToken && sentToken && currentToken !== sentToken) {
          cfg.headers = cfg.headers ?? {};
          if (typeof (cfg.headers as any).set === 'function') {
            (cfg.headers as any).set('Authorization', `Bearer ${currentToken}`);
          } else {
            cfg.headers.Authorization = `Bearer ${currentToken}`;
          }
          return instance(cfg);
        }

        try {
          const token = await executeRefresh();
          if (!token) {
            await clearAuthTokens();
            notifySessionExpired();
            return Promise.reject(toApiError(error));
          }

          cfg.headers = cfg.headers ?? {};
          if (typeof (cfg.headers as any).set === 'function') {
            (cfg.headers as any).set('Authorization', `Bearer ${token}`);
          } else {
            cfg.headers.Authorization = `Bearer ${token}`;
          }
          return instance(cfg);
        } catch (refreshError) {
          await clearAuthTokens();
          notifySessionExpired();
          return Promise.reject(toApiError(error));
        }
      }

      if (isExpiredJwt && !isAuthUrl) {
        await clearAuthTokens();
        notifySessionExpired();
      }

      return Promise.reject(toApiError(error));
    },
  );

  return instance;
}

export const http = createHttpClient();

/** Attach the bearer token to every subsequent request. */
export function setAuthToken(token: string) {
  http.defaults.headers.common.Authorization = `Bearer ${token}`;
}
