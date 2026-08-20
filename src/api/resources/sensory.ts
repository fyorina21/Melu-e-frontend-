// src/api/resources/sensory.ts
//
// Sensory activities and sensory assessments.
// Mirrors the backend routes:
//   GET  /sensory_activities
//   GET  /sensory_assessments/:id
//   POST /sensory_assessments
//   PATCH /sensory_assessments/:id
//   POST /sensory_assessments/:id/submit

import { http } from '../http/client';
import type { UUID } from './types';

export interface SensoryActivity {
  id: UUID;
  name: string;
  category: string | null;
  description: string | null;
}

export interface SensoryAssessment {
  id: UUID;
  studentId: UUID | null;
  status: string | null;
  submittedAt: string | null;
  records: Array<Record<string, unknown>>;
}

export const sensoryApi = {
  async activities(): Promise<SensoryActivity[]> {
    const { data } = await http.get<SensoryActivity[]>('/sensory_activities');
    return data;
  },

  async list(): Promise<SensoryAssessment[]> {
    const { data } = await http.get<SensoryAssessment[]>('/sensory_assessments');
    return data;
  },

  async show(assessmentId: UUID): Promise<SensoryAssessment> {
    const { data } = await http.get<SensoryAssessment>(`/sensory_assessments/${assessmentId}`);
    return data;
  },

  async create(payload: Partial<SensoryAssessment>): Promise<SensoryAssessment> {
    const { data } = await http.post<SensoryAssessment>('/sensory_assessments', payload);
    return data;
  },

  async update(assessmentId: UUID, payload: Partial<SensoryAssessment>): Promise<SensoryAssessment> {
    const { data } = await http.patch<SensoryAssessment>(`/sensory_assessments/${assessmentId}`, payload);
    return data;
  },

  async submit(assessmentId: UUID): Promise<SensoryAssessment> {
    const { data } = await http.post<SensoryAssessment>(`/sensory_assessments/${assessmentId}/submit`);
    return data;
  },
};