// src/api/http/client.ts
//
// The single axios instance used by every typed resource module in src/api.
// Responsibilities:
//   - point at the configured base URL
//   - attach the bearer token when available
//   - normalize errors into ApiError
//   - in demo mode, route requests to the in-memory mock database
//     (src/api/mock) so the app is fully usable without a backend
//   - on 401, transparently refresh the token once via an opt-in handler and
//     replay the original request
//   - log requests through an opt-in hook
//
// Screens should never import this directly; use the typed resources in
// src/api/resources.

import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { apiBaseUrl, env, isDemoMode } from '../config/env';
import { getAccessToken, setAccessToken } from '../token';
import { toApiError, ApiError } from './errors';
import { mockHttp } from '../mock/client';

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _startedAt?: number;
}

// ---- Opt-in hooks (not wired to any auth context / screens) ----

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
let logger: Logger | null = null;

/** Register a callback that returns a fresh access token (or null if refresh fails). */
export function setTokenRefreshHandler(handler: RefreshHandler | null) {
  refreshHandler = handler;
}

/** Register an optional request/response logger for observability. */
export function setApiLogger(handler: Logger | null) {
  logger = handler;
}

// ---- Demo mode: route through the mock database ----

const demoClient = mockHttp as unknown as AxiosInstance;

// ---- Real client ----

function createHttpClient(): AxiosInstance {
  if (isDemoMode) return demoClient;

  const instance = axios.create({
    baseURL: apiBaseUrl,
    timeout: env.apiTimeoutMs,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
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

      // Transparent single-attempt refresh on 401 (opt-in, not wired to screens).
      const status = axiosError.response?.status;
      const shouldRefresh = status === 401 && cfg && !cfg._retry && !!refreshHandler;
      if (shouldRefresh) {
        cfg._retry = true;
        try {
          const token = await refreshHandler!();
          if (!token) return Promise.reject(toApiError(error));
          await setAccessToken(token);
          cfg.headers = cfg.headers ?? {};
          cfg.headers.Authorization = `Bearer ${token}`;
          return instance(cfg);
        } catch (refreshError) {
          return Promise.reject(toApiError(error));
        }
      }

      return Promise.reject(toApiError(error));
    },
  );

  return instance;
}

export const http = createHttpClient();

/** Attach the bearer token to every subsequent request (legacy helper). */
export function setAuthToken(token: string) {
  if (isDemoMode) return;
  http.defaults.headers.common.Authorization = `Bearer ${token}`;
}