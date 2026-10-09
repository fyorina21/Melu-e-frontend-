import client from './sessionApi';
import type { Payload } from '../types';
import { isUserAdmin } from './token';

const DEFAULT_ENROLLMENT_FORM = {
  formName: 'Enrollment Wizard',
  formType: 'enrollment',
  revisionNumber: 1,
  isDefault: true,
  fields: [
    { id: 'f1', type: 'text', label: 'Full Name', required: true, visible: true, section: 'Student Info' },
    { id: 'f2', type: 'date', label: 'Date of Birth', required: true, visible: true, section: 'Student Info' },
    { id: 'f4', type: 'text', label: 'Parent / Guardian Name', required: true, visible: true, section: 'Parent Info' },
    { id: 'f5', type: 'text', label: 'Parent Phone', required: true, visible: true, section: 'Parent Info' },
    { id: 'f6', type: 'text', label: 'Parent Email', required: true, visible: true, section: 'Parent Info' },
    { id: 'f7', type: 'textarea', label: 'Medical Notes & Allergies', required: false, visible: true, section: 'Medical Info' },
    { id: 'f8', type: 'checkbox', label: 'Transportation Required', required: false, visible: true, section: 'Medical Info' },
    { id: 'f9', type: 'text', label: 'Emergency Contact', required: false, visible: true, section: 'Parent Info' },
  ],
  customSections: [],
  deletedSections: [],
  history: [],
};

const DEFAULT_IUP_FORM = {
  formName: 'IUP',
  formType: 'iup',
  revisionNumber: 1,
  isDefault: true,
  fields: [
    { id: 'i1', type: 'text', label: 'Student Name', required: true, visible: true },
    { id: 'i2', type: 'dropdown', label: 'Target Skill Domain', required: true, visible: true, options: ['Language & Communication', 'Social Interaction', 'Adaptive & Self-Care', 'Motor Skills', 'Cognitive'] },
    { id: 'i3', type: 'number', label: 'Baseline Mastery (%)', required: true, visible: true },
    { id: 'i4', type: 'textarea', label: 'Target Objective', required: true, visible: true },
  ],
  customSections: [],
  deletedSections: [],
  history: [],
};

const DEFAULT_ABLLS_FORM = {
  formName: 'ABLLS Assessment',
  formType: 'ablls',
  revisionNumber: 1,
  isDefault: true,
  fields: [
    { id: 'A1', type: 'radio', label: 'A1: Matches identical objects', required: true, visible: true, section: 'Visual Performance', options: ['0 — Not Demonstrated', '1 — Emerging', '2 — Mastered', 'N/A'] },
    { id: 'A2', type: 'radio', label: 'A2: Matches identical pictures to objects', required: true, visible: true, section: 'Visual Performance', options: ['0 — Not Demonstrated', '1 — Emerging', '2 — Mastered', 'N/A'] },
    { id: 'B1', type: 'radio', label: 'B1: Gross motor imitation', required: true, visible: true, section: 'Motor Imitation', options: ['0 — Not Demonstrated', '1 — Emerging', '2 — Mastered', 'N/A'] },
    { id: 'C1', type: 'radio', label: 'C1: Imitation of vowel sounds', required: true, visible: true, section: 'Vocal Imitation', options: ['0 — Not Demonstrated', '1 — Emerging', '2 — Mastered', 'N/A'] },
  ],
  customSections: [],
  deletedSections: [],
  history: [],
};

function getDefaultFormConfig(formName: string) {
  const name = (formName || '').toLowerCase();
  if (name.includes('enrollment')) return DEFAULT_ENROLLMENT_FORM;
  if (name.includes('iup')) return DEFAULT_IUP_FORM;
  if (name.includes('ablls') || name.includes('skill')) return DEFAULT_ABLLS_FORM;
  return {
    formName,
    formType: 'general',
    revisionNumber: 1,
    isDefault: true,
    fields: [],
    customSections: [],
    deletedSections: [],
    history: [],
  };
}

function getCachedFormConfig(formName: string) {
  if (typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem(`form_config_${formName.toLowerCase().trim()}`);
      if (cached) return JSON.parse(cached);
    } catch {}
  }
  return null;
}

function setCachedFormConfig(formName: string, config: any) {
  if (typeof localStorage !== 'undefined' && config) {
    try {
      localStorage.setItem(`form_config_${formName.toLowerCase().trim()}`, JSON.stringify(config));
    } catch {}
  }
}

// SCR-ADMIN-001: Form Builder
export const getFormConfig = async (formName: string) => {
  // If user is not an institutional admin, avoid calling /admin/forms/:name which returns 403 Forbidden
  if (!isUserAdmin()) {
    const cached = getCachedFormConfig(formName);
    return { data: cached || getDefaultFormConfig(formName) };
  }

  try {
    const res = await client.get(`/admin/forms/${encodeURIComponent(formName)}`);
    if (res?.data) {
      setCachedFormConfig(formName, res.data);
    }
    return res;
  } catch (err: any) {
    if (
      err?.status === 403 ||
      err?.response?.status === 403 ||
      err?.status === 404 ||
      err?.response?.status === 404
    ) {
      const cached = getCachedFormConfig(formName);
      return { data: cached || getDefaultFormConfig(formName) };
    }
    throw err;
  }
};

export const saveFormConfig = async (formName: string, payload: Payload) => {
  setCachedFormConfig(formName, payload);
  return client.post(`/admin/forms/${encodeURIComponent(formName)}`, payload);
};

export const resetFormToDefault = async (formName: string) => {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(`form_config_${formName.toLowerCase().trim()}`);
    } catch {}
  }
  if (!isUserAdmin()) {
    return { data: getDefaultFormConfig(formName) };
  }
  try {
    return await client.post(`/admin/forms/${encodeURIComponent(formName)}/reset`);
  } catch (err: any) {
    if (err?.status === 403 || err?.response?.status === 403) {
      return { data: getDefaultFormConfig(formName) };
    }
    throw err;
  }
};

// SCR-ADMIN-002: Trial Logging Format
export const getTrialLoggingConfig = () => client.get('/admin/trial-logging-config');
export const saveTrialLoggingConfig = (payload: Payload) => client.post('/admin/trial-logging-config', payload);

// SCR-ADMIN-002: Live Prompt Levels API (/admin/prompt_levels)
export const getPromptLevelsApi = () => client.get('/admin/prompt_levels');
export const getPromptLevelApi = (id: string | number) => client.get(`/admin/prompt_levels/${id}`);
export const createPromptLevelApi = (payload: { label?: string; name?: string; color: string; display_order?: number; order?: number; is_active?: boolean }) =>
  client.post('/admin/prompt_levels', { prompt_level: payload });
export const updatePromptLevelApi = (id: string | number, payload: { label?: string; name?: string; color?: string; display_order?: number; order?: number; is_active?: boolean }) =>
  client.put(`/admin/prompt_levels/${id}`, { prompt_level: payload });
export const deletePromptLevelApi = (id: string | number) =>
  client.delete(`/admin/prompt_levels/${id}`);
export const reorderPromptLevelsApi = (ids: (string | number)[]) =>
  client.put('/admin/prompt_levels/reorder', { ids });

// SCR-ADMIN-003: ABC Dropdown List Manager
export const getAbcLists = () => client.get('/admin/abc-lists');
export const saveAbcList = (listType: string, items: Payload[]) => client.post(`/admin/abc-lists/${listType}`, { items });
export const resetAbcListsToDefault = () => client.post('/admin/abc-lists/reset');

// SCR-ADMIN-004: Session Schedule & Capacity
export const getScheduleCapacityConfig = () => client.get('/admin/schedule-capacity-config');
export const saveScheduleCapacityConfig = (payload: Payload) => client.post('/admin/schedule-capacity-config', payload);

// SCR-ADMIN-005: Goal Domain Definitions
// Backend route is /admin/goal_domains (underscore) — see goal_domains_controller.rb
export const getGoalDomains = () => client.get('/admin/goal_domains');
export const saveGoalDomains = (domains: Payload[]) => client.post('/admin/goal_domains', { domains });

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
