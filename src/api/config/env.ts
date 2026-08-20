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

const DEFAULT_API_URL = `https://${PLACEHOLDER_HOST}`;

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
  apiVersion: 'v1',
  apiTimeoutMs: 10_000,
} as const;

export const apiBaseUrl = `${env.apiUrl}/api/${env.apiVersion}`;

/** True while the backend host has not been configured yet. */
export const isDemoMode = env.apiUrl.includes(PLACEHOLDER_HOST);