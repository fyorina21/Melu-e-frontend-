// api/institutionalAdminApi.ts
// Institutional Administrator role - assumed contract, no real backend.

import client from './sessionApi';
import type { Payload } from '../types';

// SCR-ADMIN-001: Form Builder
export const getFormConfig = (formName: string) => client.get(`/admin/forms/${formName}`);
export const saveFormConfig = (formName: string, payload: Payload) => client.post(`/admin/forms/${formName}`, payload);
export const resetFormToDefault = (formName: string) => client.post(`/admin/forms/${formName}/reset`);

// SCR-ADMIN-002: Trial Logging Format
export const getTrialLoggingConfig = () => client.get('/admin/trial-logging-config');
export const saveTrialLoggingConfig = (payload: Payload) => client.post('/admin/trial-logging-config', payload);

// SCR-ADMIN-003: ABC Dropdown List Manager
export const getAbcLists = () => client.get('/admin/abc-lists');
export const saveAbcList = (listType: string, items: Payload[]) => client.post(`/admin/abc-lists/${listType}`, { items });
export const resetAbcListsToDefault = () => client.post('/admin/abc-lists/reset');

// SCR-ADMIN-004: Session Schedule & Capacity
export const getScheduleCapacityConfig = () => client.get('/admin/schedule-capacity-config');
export const saveScheduleCapacityConfig = (payload: Payload) => client.post('/admin/schedule-capacity-config', payload);

// SCR-ADMIN-005: Goal Domain Definitions
export const getGoalDomains = () => client.get('/admin/goal-domains');
export const saveGoalDomains = (domains: Payload[]) => client.post('/admin/goal-domains', { domains });

// SCR-ADMIN-006: Task Analysis Templates
export const getTaskAnalysisTemplates = () => client.get('/admin/task-analysis-templates');
export const saveTaskAnalysisTemplate = (templateId: string | null, payload: Payload) =>
  templateId
    ? client.patch(`/admin/task-analysis-templates/${templateId}`, payload)
    : client.post('/admin/task-analysis-templates', payload);
export const deleteTaskAnalysisTemplate = (templateId: string) => client.delete(`/admin/task-analysis-templates/${templateId}`);

// MR-6: Clinic Info / Working Hours / School Settings configuration
export const getClinicInfo = () => client.get('/admin/clinic-info');
export const saveClinicInfo = (payload: Payload) => client.post('/admin/clinic-info', payload);
export const getWorkingHours = () => client.get('/admin/working-hours');
export const saveWorkingHours = (payload: Payload) => client.post('/admin/working-hours', payload);
export const getSchoolSettings = () => client.get('/admin/school-settings');
export const saveSchoolSettings = (payload: Payload) => client.post('/admin/school-settings', payload);

// MR-6: Clinical categories CRUD (Programs / Assessment Types / Therapy Types)
export const getClinicalCategories = () => client.get('/admin/clinical-categories');
export const saveClinicalCategory = (category: string, item: Payload) =>
  client.post(`/admin/clinical-categories/${category}`, item);
export const updateClinicalCategory = (category: string, itemId: string, payload: Payload) =>
  client.patch(`/admin/clinical-categories/${category}/${itemId}`, payload);
export const deleteClinicalCategory = (category: string, itemId: string) =>
  client.delete(`/admin/clinical-categories/${category}/${itemId}`);
