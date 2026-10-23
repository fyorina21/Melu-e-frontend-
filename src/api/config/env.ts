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
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // In production web (non-localhost), dynamically use origin or production API URL
  if (
    typeof window !== 'undefined' &&
    window.location?.origin &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
  ) {
    if (window.location.hostname.endsWith('melue.foundation')) {
      return 'https://api.melue.foundation';
    }
    return window.location.origin;
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
