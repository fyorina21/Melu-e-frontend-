// src/api/resources/sync.ts
//
// Offline sync endpoints for pulling pushed and pushing local changes.

import { http } from '../http/client';

export interface SyncPullResponse {
  entities: Record<string, unknown>;
  serverTime: string | null;
}

export interface SyncPushRequest {
  changes: Array<{
    entity: string;
    id: string | null;
    action: 'create' | 'update' | 'delete';
    payload: Record<string, unknown>;
  }>;
}

export interface SyncPushResponse {
  accepted: number;
  conflicts: Array<{ id: string; reason: string }>;
}

export const syncApi = {
  async pull(params: { since?: string } = {}): Promise<SyncPullResponse> {
    const { data } = await http.get<SyncPullResponse>('/sync/pull', { params });
    return data;
  },

  async push(payload: SyncPushRequest): Promise<SyncPushResponse> {
    const { data } = await http.post<SyncPushResponse>('/sync/push', payload);
    return data;
  },
};