// src/api/resources/enrollments.ts
//
// Multi-step enrollment flow with media and document uploads.
// Mirrors the backend routes:
//   POST   /enrollments
//   GET    /enrollments/:id
//   PATCH  /enrollments/:id/update_step
//   PATCH  /enrollments/:id
//   POST   /enrollments/:id/complete
//   POST   /enrollments/:id/save_draft
//   POST   /enrollments/:id/attach_document
//   POST   /enrollments/:id/upload_photo
//   POST   /enrollments/:id/upload_video
//   DELETE /enrollments/:id/remove_photo
//   DELETE /enrollments/:id/remove_video

import { http } from '../http/client';
import type { EnrollmentDraft, UUID } from './types';

export const enrollmentsApi = {
  async create(): Promise<EnrollmentDraft> {
    const { data } = await http.post<EnrollmentDraft>('/enrollments');
    return data;
  },

  async show(enrollmentId: UUID): Promise<EnrollmentDraft> {
    const { data } = await http.get<EnrollmentDraft>(`/enrollments/${enrollmentId}`);
    return data;
  },

  async update(enrollmentId: UUID, payload: Record<string, unknown>): Promise<EnrollmentDraft> {
    const { data } = await http.patch<EnrollmentDraft>(`/enrollments/${enrollmentId}`, payload);
    return data;
  },

  async updateStep(enrollmentId: UUID, step: string, payload: Record<string, unknown>): Promise<EnrollmentDraft> {
    const { data } = await http.patch<EnrollmentDraft>(
      `/enrollments/${enrollmentId}/update_step`,
      { step, ...payload },
    );
    return data;
  },

  async complete(enrollmentId: UUID): Promise<EnrollmentDraft> {
    const { data } = await http.post<EnrollmentDraft>(`/enrollments/${enrollmentId}/complete`);
    return data;
  },

  async saveDraft(enrollmentId: UUID): Promise<EnrollmentDraft> {
    const { data } = await http.post<EnrollmentDraft>(`/enrollments/${enrollmentId}/save_draft`);
    return data;
  },

  async attachDocument(enrollmentId: UUID, file: FormData): Promise<EnrollmentDraft> {
    const { data } = await http.post<EnrollmentDraft>(
      `/enrollments/${enrollmentId}/attach_document`,
      file,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  async uploadPhoto(enrollmentId: UUID, file: FormData): Promise<EnrollmentDraft> {
    const { data } = await http.post<EnrollmentDraft>(
      `/enrollments/${enrollmentId}/upload_photo`,
      file,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  async uploadVideo(enrollmentId: UUID, file: FormData): Promise<EnrollmentDraft> {
    const { data } = await http.post<EnrollmentDraft>(
      `/enrollments/${enrollmentId}/upload_video`,
      file,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  async removePhoto(enrollmentId: UUID): Promise<EnrollmentDraft> {
    const { data } = await http.delete<EnrollmentDraft>(`/enrollments/${enrollmentId}/remove_photo`);
    return data;
  },

  async removeVideo(enrollmentId: UUID): Promise<EnrollmentDraft> {
    const { data } = await http.delete<EnrollmentDraft>(`/enrollments/${enrollmentId}/remove_video`);
    return data;
  },
};