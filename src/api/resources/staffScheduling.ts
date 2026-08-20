// src/api/resources/staffScheduling.ts
//
// Staff scheduling, teacher schedule, capacity and assignment management.
// Mirrors the backend routes:
//   GET  /staff_scheduling
//   GET  /staff_scheduling/teacher_schedule
//   GET  /staff_scheduling/capacity
//   POST/PATCH/DELETE /assignments

import { http } from '../http/client';
import type { UUID } from './types';

export interface TeacherScheduleEntry {
  id: UUID;
  teacherName: string;
  day: string;
  blockName: string;
  stationName: string;
  roomName: string;
  status: string;
}

export interface Assignment {
  id: UUID;
  teacherId: UUID;
  studentIds: UUID[];
  blockId: UUID | null;
  stationId: UUID | null;
  scheduledDate: string | null;
  status: string;
}

export const staffSchedulingApi = {
  async list(params: { weekStart?: string; teacherId?: UUID } = {}): Promise<unknown[]> {
    const { data } = await http.get<unknown[]>('/staff_scheduling', { params });
    return data;
  },

  async teacherSchedule(params: { teacherId?: UUID; weekStart?: string } = {}): Promise<TeacherScheduleEntry[]> {
    const { data } = await http.get<TeacherScheduleEntry[]>('/staff_scheduling/teacher_schedule', { params });
    return data;
  },

  async capacity(): Promise<Record<string, number>> {
    const { data } = await http.get<Record<string, number>>('/staff_scheduling/capacity');
    return data;
  },

  async createAssignment(payload: Record<string, unknown>): Promise<Assignment> {
    const { data } = await http.post<Assignment>('/assignments', payload);
    return data;
  },

  async updateAssignment(id: UUID, payload: Record<string, unknown>): Promise<Assignment> {
    const { data } = await http.patch<Assignment>(`/assignments/${id}`, payload);
    return data;
  },

  async deleteAssignment(id: UUID): Promise<void> {
    await http.delete(`/assignments/${id}`);
  },
};