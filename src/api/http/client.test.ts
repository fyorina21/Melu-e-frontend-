import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, setTokenRefreshHandler } from './client';
import { setAccessToken, getAccessToken } from '../token';

describe('HTTP client token refresh mutex and queue', () => {
  beforeEach(async () => {
    await setAccessToken('initial-token');
    setTokenRefreshHandler(null);
  });

  it('serializes concurrent 401s into a single refresh call and retries all requests', async () => {
    let refreshCalls = 0;
    const refreshHandler = vi.fn(async () => {
      refreshCalls++;
      // Simulate network latency for token refresh
      await new Promise((r) => setTimeout(r, 20));
      return 'fresh-token-xyz';
    });
    setTokenRefreshHandler(refreshHandler);

    // Mock http instance adapter / request dispatch
    const originalAdapter = http.defaults.adapter;
    let requestCount = 0;
    const receivedAuthHeaders: (string | undefined)[] = [];

    // Custom test adapter simulating 401 on initial requests, 200 on retry
    http.defaults.adapter = async (config) => {
      requestCount++;
      const authHeader = config.headers?.Authorization as string | undefined;
      receivedAuthHeaders.push(authHeader);

      if (authHeader === 'Bearer fresh-token-xyz') {
        return {
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      // First attempt returns 401 expired
      const err: any = new Error('Request failed with status code 401');
      err.response = {
        status: 401,
        data: { message: 'jwt expired' },
        headers: {},
        config,
      };
      err.config = config;
      err.isAxiosError = true;
      throw err;
    };

    try {
      // Fire 3 concurrent requests
      const [res1, res2, res3] = await Promise.all([
        http.get('/endpoint-1'),
        http.get('/endpoint-2'),
        http.get('/endpoint-3'),
      ]);

      // All 3 succeeded
      expect(res1.data).toEqual({ success: true });
      expect(res2.data).toEqual({ success: true });
      expect(res3.data).toEqual({ success: true });

      // Mutex guarantee: refreshHandler was called exactly once!
      expect(refreshCalls).toBe(1);
      expect(getAccessToken()).toBe('fresh-token-xyz');
    } finally {
      http.defaults.adapter = originalAdapter;
    }
  });

  it('rejects all queued requests and clears token when refresh fails', async () => {
    let refreshCalls = 0;
    const refreshHandler = vi.fn(async () => {
      refreshCalls++;
      await new Promise((r) => setTimeout(r, 10));
      return null; // refresh failed
    });
    setTokenRefreshHandler(refreshHandler);

    const originalAdapter = http.defaults.adapter;
    http.defaults.adapter = async (config) => {
      const err: any = new Error('Unauthorized');
      err.response = {
        status: 401,
        data: { message: 'token expired' },
        headers: {},
        config,
      };
      err.config = config;
      err.isAxiosError = true;
      throw err;
    };

    try {
      const results = await Promise.allSettled([http.get('/queued-1'), http.get('/queued-2')]);

      expect(results[0].status).toBe('rejected');
      expect(results[1].status).toBe('rejected');
      expect(refreshCalls).toBe(1);
      expect(getAccessToken()).toBeNull();
    } finally {
      http.defaults.adapter = originalAdapter;
    }
  });
});
