import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { ApiError, toApiError } from './errors';

function makeAxiosError(overrides: {
  status?: number;
  data?: unknown;
  code?: string;
  message?: string;
} = {}) {
  return new AxiosError(
    overrides.message ?? 'Request failed',
    overrides.code,
    { headers: new AxiosHeaders() },
    undefined,
    overrides.status != null
      ? {
          status: overrides.status,
          data: overrides.data,
          headers: {},
          config: { headers: new AxiosHeaders() },
          statusText: '',
          request: {},
        }
      : undefined,
  );
}

describe('toApiError', () => {
  it('passes through existing ApiError instances', () => {
    const original = new ApiError('nope', 400, ['a']);
    const result = toApiError(original);
    expect(result).toBe(original);
  });

  it('extracts a string error message from the payload', () => {
    const err = makeAxiosError({ status: 422, data: { error: 'Email is taken' } });
    const result = toApiError(err);
    expect(result.message).toBe('Email is taken');
    expect(result.status).toBe(422);
    expect(result.fields).toEqual([]);
  });

  it('joins array payload errors into fields + message', () => {
    const err = makeAxiosError({ status: 400, data: { error: ['Name blank', 'Age blank'] } });
    const result = toApiError(err);
    expect(result.message).toBe('Name blank, Age blank');
    expect(result.fields).toEqual(['Name blank', 'Age blank']);
  });

  it('falls back to a connection message when there is no response', () => {
    const err = makeAxiosError();
    const result = toApiError(err);
    expect(result.status).toBeNull();
    expect(result.message).toBe('Unable to reach the server. Please check your connection.');
    expect(result.isNetwork).toBe(true);
    expect(result.isUnreachable).toBe(true);
  });

  it('marks timeout errors explicitly', () => {
    const err = makeAxiosError({ code: 'ECONNABORTED' });
    const result = toApiError(err);
    expect(result.isTimeout).toBe(true);
    expect(result.isNetwork).toBe(false);
    expect(result.status).toBeNull();
  });

  it('marks DNS / network failures explicitly', () => {
    const err = makeAxiosError({ code: 'ENOTFOUND' });
    const result = toApiError(err);
    expect(result.isNetwork).toBe(true);
    expect(result.isTimeout).toBe(false);
  });

  it('treats an HTTP error status as reachable', () => {
    const err = makeAxiosError({ status: 500, data: { error: 'boom' } });
    const result = toApiError(err);
    expect(result.status).toBe(500);
    expect(result.isNetwork).toBe(false);
    expect(result.isUnreachable).toBe(false);
  });

  it('handles non-Error unknowns gracefully', () => {
    const result = toApiError('garbage');
    expect(result).toBeInstanceOf(ApiError);
    expect(result.message).toBe('An unexpected error occurred');
  });
});