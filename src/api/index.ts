// src/api/index.ts
//
// Public surface of the API layer. Screens import from '@/api' (or the
// relative path) rather than reaching into http/ internals.

export { ApiError, toApiError } from './http/errors';
export type { ApiErrorBody, ApiErrorOptions } from './http/errors';
export { http, setAuthToken, setTokenRefreshHandler, setApiLogger } from './http/client';
export type { Logger } from './http/client';
export { env, apiBaseUrl, isDemoMode } from './config/env';
export { getAccessToken, setAccessToken, loadToken } from './token';
export { queryKeys } from './query-keys';

export { authApi } from './resources/auth';
export { sessionsApi } from './resources/sessions';
export { trialsApi } from './resources/trials';
export { studentsApi } from './resources/students';
export { enrollmentsApi } from './resources/enrollments';
export { notificationsApi } from './resources/notifications';
export { masteryChecksApi } from './resources/masteryChecks';
export { sensoryApi } from './resources/sensory';
export { parentApi } from './resources/parent';
export { syncApi } from './resources/sync';
export { adminApi } from './resources/admin';
export { staffSchedulingApi } from './resources/staffScheduling';

export type * from './resources/types';