// src/api/http/errors.ts
//
// Normalized API error type used across the app. Screens can rely on a
// consistent shape instead of inspecting raw axios error objects.
// Contract:
//   - status:   HTTP status, or null when no response was received
//   - fields:   validation-field errors (array form of the `error` payload)
//   - isTimeout: the request aborted because it exceeded the configured timeout
//   - isNetwork: no response received (connection failure / server unreachable)
// Mirrors the error contract of the Rails backend (which returns either a
// string or an array of strings under the `error` key).

import { AxiosError } from 'axios';

export interface ApiErrorBody {
  error: string | string[];
}

export interface ApiErrorOptions {
  isTimeout?: boolean;
  isNetwork?: boolean;
}

export class ApiError extends Error {
  readonly status: number | null;
  readonly fields: string[];
  readonly isTimeout: boolean;
  readonly isNetwork: boolean;

  constructor(message: string, status: number | null = null, fields: string[] = [], options: ApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
    this.isTimeout = options.isTimeout ?? false;
    this.isNetwork = options.isNetwork ?? false;
  }

  /** True when the server was never reached (timeout, DNS, offline, demo mode). */
  get isUnreachable(): boolean {
    return this.status === null;
  }
}

function readPayloadError(error: AxiosError): string | null {
  const body = error.response?.data as Partial<ApiErrorBody> | undefined;
  if (!body || typeof body.error === 'undefined') return null;
  return typeof body.error === 'string' ? body.error : body.error.join(', ');
}

function readPayloadFields(error: AxiosError): string[] {
  const body = error.response?.data as Partial<ApiErrorBody> | undefined;
  return Array.isArray(body?.error) ? body.error : [];
}

function classify(error: AxiosError): Pick<ApiErrorOptions, 'isTimeout' | 'isNetwork'> {
  const code = error.code;
  const isTimeout = code === 'ECONNABORTED' || (code === undefined && /timeout/i.test(error.message));
  const isNetwork = code === 'ERR_NETWORK' || code === 'ENOTFOUND' || (!error.response && !isTimeout);
  return { isTimeout, isNetwork };
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof AxiosError) {
    const status = error.response?.status ?? null;
    const { isTimeout, isNetwork } = classify(error);
    const message =
      readPayloadError(error) ??
      (error.response ? error.message : 'Unable to reach the server. Please check your connection.');
    return new ApiError(message, status, readPayloadFields(error), { isTimeout, isNetwork });
  }

  if (error instanceof Error) return new ApiError(error.message);

  return new ApiError('An unexpected error occurred');
}