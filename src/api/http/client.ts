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
import { apiBaseUrl, env } from '../config/env';
import { getAccessToken, setAccessToken } from '../token';
import { toApiError } from './errors';

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _startedAt?: number;
}

// ---- Opt-in hooks ----

type RefreshHandler = () => Promise<string | null>;
export type Logger = (entry: {
  method: string;
  url: string;
  status: number | null;
  durationMs: number;
  ok: boolean;
  error?: string;
}) => void;

let refreshHandler: RefreshHandler | null = null;
let refreshPromise: Promise<string | null> | null = null;
let logger: Logger | null = null;

/** Register a callback that returns a fresh access token (or null if refresh fails). */
export function setTokenRefreshHandler(handler: RefreshHandler | null) {
  refreshHandler = handler;
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

  instance.interceptors.request.use((config) => {
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
      const token = getAccessToken();
      if (token) {
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

      const shouldRefresh = isExpiredJwt && cfg && !cfg._retry && !!refreshHandler;
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
          if (!refreshPromise) {
            refreshPromise = (async () => {
              try {
                const newToken = await refreshHandler!();
                if (newToken) {
                  await setAccessToken(newToken);
                } else {
                  await setAccessToken(null);
                }
                return newToken;
              } catch (err) {
                await setAccessToken(null);
                throw err;
              } finally {
                refreshPromise = null;
              }
            })();
          }

          const token = await refreshPromise;
          if (!token) {
            return Promise.reject(toApiError(error));
          }

          cfg.headers = cfg.headers ?? {};
          if (typeof (cfg.headers as any).set === 'function') {
            (cfg.headers as any).set('Authorization', `Bearer ${token}`);
          } else {
            cfg.headers.Authorization = `Bearer ${token}`;
          }
          return instance(cfg);
        } catch (_refreshError) {
          return Promise.reject(toApiError(error));
        }
      }

      if (isExpiredJwt && !refreshPromise) {
        await setAccessToken(null);
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
