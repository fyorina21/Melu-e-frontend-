// src/api/resources/students.ts
//
// Student registration and management.
// Mirrors the backend routes:
//   GET  /students (with optional filters)
//   GET  /students/:id
//   POST /students
//   PATCH /students/:id

import { http } from '../http/client';
import type { StudentSummary, UUID } from './types';

export interface StudentCreateRequest {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  programType: string;
  therapyGroup: string;
}

export type StudentUpdateRequest = Partial<StudentCreateRequest>;

export interface StudentQuery {
  status?: string;
  programType?: string;
  therapyGroup?: string;
  q?: string;
}

export const studentsApi = {
  async list(params: StudentQuery = {}): Promise<StudentSummary[]> {
    const { data } = await http.get<StudentSummary[]>('/students', { params });
    return data;
  },

  async show(studentId: UUID): Promise<StudentSummary> {
    const { data } = await http.get<StudentSummary>(`/students/${studentId}`);
    return data;
  },

  async create(payload: StudentCreateRequest): Promise<StudentSummary> {
    const { data } = await http.post<StudentSummary>('/students', payload);
    return data;
  },

  async update(studentId: UUID, payload: StudentUpdateRequest): Promise<StudentSummary> {
    const { data } = await http.patch<StudentSummary>(`/students/${studentId}`, payload);
    return data;
  },
};