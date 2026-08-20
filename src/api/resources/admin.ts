// src/api/resources/admin.ts
//
// Institutional-admin configuration endpoints.
// Mirrors the backend routes under `/admin`:
//   roles, staff_members, goal_domains, prompt_levels,
//   session_block_definitions, abc_dropdown_options,
//   form_configurations, session_schedule_config

import { http } from '../http/client';
import type { UUID } from './types';

export interface NamedResource {
  id: UUID;
  name: string;
}

export interface RoleSummary {
  id: UUID;
  name: string;
  permissions: string[];
}

export interface StaffMemberSummary {
  id: UUID;
  fullName: string;
  email: string;
  status: string;
  roles: string[];
}

export const adminApi = {
  async roles(): Promise<RoleSummary[]> {
    const { data } = await http.get<RoleSummary[]>('/admin/roles');
    return data;
  },

  async createRole(payload: { name: string; permissions: string[] }): Promise<RoleSummary> {
    const { data } = await http.post<RoleSummary>('/admin/roles', payload);
    return data;
  },

  async updateRole(id: UUID, payload: { name?: string; permissions?: string[] }): Promise<RoleSummary> {
    const { data } = await http.patch<RoleSummary>(`/admin/roles/${id}`, payload);
    return data;
  },

  async staffMembers(): Promise<StaffMemberSummary[]> {
    const { data } = await http.get<StaffMemberSummary[]>('/admin/staff_members');
    return data;
  },

  async updateStaffStatus(id: UUID, status: string): Promise<StaffMemberSummary> {
    const { data } = await http.put<StaffMemberSummary>(`/admin/staff_members/${id}/update_status`, { status });
    return data;
  },

  async resetStaffPassword(id: UUID): Promise<void> {
    await http.post(`/admin/staff_members/${id}/reset_password`);
  },

  async goalDomains(): Promise<NamedResource[]> {
    const { data } = await http.get<NamedResource[]>('/admin/goal_domains');
    return data;
  },

  async reorderGoalDomains(orderedIds: UUID[]): Promise<void> {
    await http.put('/admin/goal_domains/reorder', { ids: orderedIds });
  },

  async promptLevels(): Promise<NamedResource[]> {
    const { data } = await http.get<NamedResource[]>('/admin/prompt_levels');
    return data;
  },

  async reorderPromptLevels(orderedIds: UUID[]): Promise<void> {
    await http.put('/admin/prompt_levels/reorder', { ids: orderedIds });
  },

  async sessionBlockDefinitions(): Promise<NamedResource[]> {
    const { data } = await http.get<NamedResource[]>('/admin/session_block_definitions');
    return data;
  },

  async abcDropdownOptions(): Promise<NamedResource[]> {
    const { data } = await http.get<NamedResource[]>('/admin/abc_dropdown_options');
    return data;
  },

  async reorderAbcDropdownOptions(orderedIds: UUID[]): Promise<void> {
    await http.put('/admin/abc_dropdown_options/reorder', { ids: orderedIds });
  },

  async formConfigurations(): Promise<unknown[]> {
    const { data } = await http.get<unknown[]>('/admin/form_configurations');
    return data;
  },

  async sessionScheduleConfig(): Promise<Record<string, unknown>> {
    const { data } = await http.get<Record<string, unknown>>('/admin/session_schedule_config');
    return data;
  },
};