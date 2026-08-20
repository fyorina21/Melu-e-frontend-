// src/api/resources/notifications.ts
//
// User-scoped notifications.
// Mirrors the backend routes:
//   GET  /notifications
//   POST /notifications/:id/mark_as_read

import { http } from '../http/client';
import type { Notification, UUID } from './types';

export const notificationsApi = {
  async list(): Promise<Notification[]> {
    const { data } = await http.get<Notification[]>('/notifications');
    return data;
  },

  async markAsRead(notificationId: UUID): Promise<void> {
    await http.post(`/notifications/${notificationId}/mark_as_read`);
  },
};