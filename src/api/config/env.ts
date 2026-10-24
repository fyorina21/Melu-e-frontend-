// src/api/config/env.ts
//
// Centralized environment configuration for the API layer.
// All HTTP calls in `src/api` should derive their base URL from here so a
// single edit points the whole app at a different environment.
//
// Real backend: dev `http://localhost:3000`, prod `https://api.melue.foundation`.
// Set `EXPO_PUBLIC_API_URL` in your environment to override the default.
// While the placeholder host is still in use the app runs in demo mode and
// the http client fails fast instead of hanging on a dead network call.

const PLACEHOLDER_HOST = 'REPLACE_WITH_REAL_API_HOST';

const DEFAULT_API_URL = 'http://localhost:3000';

const getFallbackApiUrl = (): string => {
  // In web environment, match the hostname to avoid cross-device or stale IP mismatches
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    if (host.endsWith('melue.foundation')) {
      return 'https://api.melue.foundation';
    }
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    return `http://${host}:3000`;
  }

  if (process.env.EXPO_PUBLIC_API_URL && !process.env.EXPO_PUBLIC_API_URL.includes('192.168.1.7')) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  return DEFAULT_API_URL;
};

export const env = {
  apiUrl: getFallbackApiUrl(),
  apiVersion: 'v1',
  apiTimeoutMs: process.env.VITEST ? 2000 : 10_000,
} as const;

export const apiBaseUrl = `${env.apiUrl}/api/${env.apiVersion}`;

/** Demo mode is disabled - application communicates with real backend / database API. */
export const isDemoMode = false;
