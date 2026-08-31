// src/api/mock/client.ts
//
// Axios-compatible mock http client used in demo mode. It routes
// `resources/*` calls to the persisted mock database (src/api/mock/db.ts)
// instead of hitting a real backend:
//
//   screen -> resource -> http (mock) -> mockDb -> localStorage
//
// It mimics the axios surface the resources rely on (`get/post/patch/put/
// delete` resolving to `{ data }`), adds a small latency so loading states
// feel real, and throws ApiError for unknown routes or invalid auth.

import { ApiError } from '../http/errors';
import { MOCK_ROUTES, type MockHandlerContext, type HttpMethod } from './routes';
import { mockDb } from './db';

interface ResolvedRoute {
  method: HttpMethod;
  params: Record<string, string>;
  handler: (ctx: MockHandlerContext) => unknown;
}

function splitSegments(path: string): string[] {
  const clean = path.split('?')[0].replace(/^\/+|\/+$/g, '');
  return clean
    .split('/')
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
}

function decodeQuery(params: Record<string, unknown> = {}): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(params)) {
    out[key] = typeof value === 'string' ? value : value == null ? undefined : String(value);
  }
  return out;
}

function resolveRoute(method: HttpMethod, path: string): ResolvedRoute | null {
  const segments = splitSegments(path);
  for (const candidate of MOCK_ROUTES) {
    if (candidate.method !== method) continue;
    const pattern = splitSegments(candidate.pattern);
    if (pattern.length !== segments.length) continue;

    const params: Record<string, string> = {};
    let matched = true;
    for (let i = 0; i < pattern.length; i++) {
      const p = pattern[i];
      if (p.startsWith(':')) {
        params[p.slice(1)] = segments[i];
      } else if (p.toLowerCase() !== segments[i].toLowerCase()) {
        matched = false;
        break;
      }
    }
    if (matched) return { method, params, handler: candidate.handler };
  }
  return null;
}

const LATENCY_MIN = 120;
const LATENCY_MAX = 450;

function delay(): Promise<void> {
  const ms = LATENCY_MIN + Math.random() * (LATENCY_MAX - LATENCY_MIN);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function dispatch<T>(method: HttpMethod, url: string, body?: unknown, config?: { params?: Record<string, unknown> }): Promise<{ data: T; headers: Record<string, string> }> {
  await delay();

  const route = resolveRoute(method, url);
  if (!route) {
    throw new ApiError(`Route not found: ${method} ${url}`, 404);
  }

  const ctx: MockHandlerContext = {
    params: route.params,
    query: decodeQuery(config?.params),
    body,
  };

  try {
    const data = await route.handler(ctx);
    return { data: data as T, headers: {} };
  } catch (err) {
    throw err instanceof ApiError ? err : new ApiError(err instanceof Error ? err.message : 'Mock handler error');
  }
}

/**
 * Mock client with the axios-compatible surface used by src/api/resources.
 * Screens never reference this directly; it is installed as the demo-mode
 * `http` client in src/api/http/client.ts.
 */
export const mockHttp = {
  get: <T>(url: string, config?: { params?: Record<string, unknown> }) =>
    dispatch<T>('GET', url, undefined, config),
  post: <T>(url: string, body?: unknown, config?: { params?: Record<string, unknown> }) =>
    dispatch<T>('POST', url, body, config),
  patch: <T>(url: string, body?: unknown) =>
    dispatch<T>('PATCH', url, body),
  put: <T>(url: string, body?: unknown) =>
    dispatch<T>('PUT', url, body),
  delete: <T>(url: string) =>
    dispatch<T>('DELETE', url),
};

export function isMockClient(value: unknown): boolean {
  return value === mockHttp;
}

export { mockDb };