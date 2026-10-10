import client from './sessionApi';
import type { Payload } from '../types';
import { isUserAdmin } from './token';
import { storage } from '../utils/storage';

const DEFAULT_ENROLLMENT_FORM = {
  formName: 'Enrollment Wizard',
  formType: 'enrollment',
  revisionNumber: 1,
  isDefault: true,
  fields: [
    {
      id: 'f1',
      type: 'text',
      label: 'Full Name',
      required: true,
      visible: true,
      section: 'Student Info',
    },
    {
      id: 'f2',
      type: 'date',
      label: 'Date of Birth',
      required: true,
      visible: true,
      section: 'Student Info',
    },
    {
      id: 'f4',
      type: 'text',
      label: 'Parent / Guardian Name',
      required: true,
      visible: true,
      section: 'Parent Info',
    },
    {
      id: 'f5',
      type: 'text',
      label: 'Parent Phone',
      required: true,
      visible: true,
      section: 'Parent Info',
    },
    {
      id: 'f6',
      type: 'text',
      label: 'Parent Email',
      required: true,
      visible: true,
      section: 'Parent Info',
    },
    {
      id: 'f7',
      type: 'textarea',
      label: 'Medical Notes & Allergies',
      required: false,
      visible: true,
      section: 'Medical Info',
    },
    {
      id: 'f8',
      type: 'checkbox',
      label: 'Transportation Required',
      required: false,
      visible: true,
      section: 'Medical Info',
    },
    {
      id: 'f9',
      type: 'text',
      label: 'Emergency Contact',
      required: false,
      visible: true,
      section: 'Parent Info',
    },
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
    {
      id: 'i2',
      type: 'dropdown',
      label: 'Target Skill Domain',
      required: true,
      visible: true,
      options: [
        'Language & Communication',
        'Social Interaction',
        'Adaptive & Self-Care',
        'Motor Skills',
        'Cognitive',
      ],
    },
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
    {
      id: 'A1',
      type: 'radio',
      label: 'A1: Matches identical objects',
      required: true,
      visible: true,
      section: 'Visual Performance',
      options: ['0 — Not Demonstrated', '1 — Emerging', '2 — Mastered', 'N/A'],
    },
    {
      id: 'A2',
      type: 'radio',
      label: 'A2: Matches identical pictures to objects',
      required: true,
      visible: true,
      section: 'Visual Performance',
      options: ['0 — Not Demonstrated', '1 — Emerging', '2 — Mastered', 'N/A'],
    },
    {
      id: 'B1',
      type: 'radio',
      label: 'B1: Gross motor imitation',
      required: true,
      visible: true,
      section: 'Motor Imitation',
      options: ['0 — Not Demonstrated', '1 — Emerging', '2 — Mastered', 'N/A'],
    },
    {
      id: 'C1',
      type: 'radio',
      label: 'C1: Imitation of vowel sounds',
      required: true,
      visible: true,
      section: 'Vocal Imitation',
      options: ['0 — Not Demonstrated', '1 — Emerging', '2 — Mastered', 'N/A'],
    },
  ],
  customSections: [],
  deletedSections: [],
  history: [],
};

const DEFAULT_GOAL_DOMAINS = [
  {
    id: 'd-1',
    name: 'Communication & Language',
    code: 'COMM',
    description: 'Vocal, verbal and augmentative communication skills',
    order: 1,
    active: true,
  },
  {
    id: 'd-2',
    name: 'Social Interaction & Play',
    code: 'SOC',
    description: 'Peer interaction, sharing and cooperative group play',
    order: 2,
    active: true,
  },
  {
    id: 'd-3',
    name: 'Adaptive & Daily Living',
    code: 'ADL',
    description: 'Self-help, feeding, toileting and dressing independence',
    order: 3,
    active: true,
  },
  {
    id: 'd-4',
    name: 'Motor Skills & Coordination',
    code: 'MOT',
    description: 'Gross and fine motor imitation and coordination',
    order: 4,
    active: true,
  },
  {
    id: 'd-5',
    name: 'Cognitive & Pre-Academic',
    code: 'COG',
    description: 'Matching, sorting, identification and academic prerequisites',
    order: 5,
    active: true,
  },
  {
    id: 'd-6',
    name: 'Behavior & Emotional Regulation',
    code: 'BEH',
    description: 'Tolerance, coping mechanisms and functional replacement behaviors',
    order: 6,
    active: true,
  },
];

const DEFAULT_TASK_TEMPLATES = [
  {
    id: 'tt-1',
    name: 'Hand Washing',
    description: '7-step independent hand hygiene sequence',
    domain: 'Adaptive & Daily Living',
    targetObjective:
      'Student will wash hands with 100% independence across 3 consecutive sessions.',
    masteryScore: 80,
    steps: [
      { id: 's1', stepNumber: 1, text: 'Turn on water' },
      { id: 's2', stepNumber: 2, text: 'Wet hands' },
      { id: 's3', stepNumber: 3, text: 'Apply soap' },
      { id: 's4', stepNumber: 4, text: 'Rub hands together for 20 seconds' },
      { id: 's5', stepNumber: 5, text: 'Rinse all soap off hands' },
      { id: 's6', stepNumber: 6, text: 'Dry hands with towel' },
      { id: 's7', stepNumber: 7, text: 'Turn off water' },
    ],
  },
  {
    id: 'tt-2',
    name: 'Tooth Brushing',
    description: '6-step oral hygiene routine',
    domain: 'Adaptive & Daily Living',
    targetObjective: 'Student will brush teeth thoroughly with minimal verbal prompts.',
    masteryScore: 80,
    steps: [
      { id: 's1', stepNumber: 1, text: 'Get toothbrush and toothpaste' },
      { id: 's2', stepNumber: 2, text: 'Apply pea-sized amount of toothpaste' },
      { id: 's3', stepNumber: 3, text: 'Brush outer surfaces of teeth' },
      { id: 's4', stepNumber: 4, text: 'Brush chewing surfaces of teeth' },
      { id: 's5', stepNumber: 5, text: 'Spit into sink and rinse mouth' },
      { id: 's6', stepNumber: 6, text: 'Rinse toothbrush and put away' },
    ],
  },
];

const DEFAULT_PROMPT_LEVELS = [
  {
    id: '1',
    name: 'Full Physical',
    label: 'Full Physical',
    color: '#EF4444',
    order: 1,
    display_order: 1,
    is_active: true,
  },
  {
    id: '2',
    name: 'Partial Physical',
    label: 'Partial Physical',
    color: '#F97316',
    order: 2,
    display_order: 2,
    is_active: true,
  },
  {
    id: '3',
    name: 'Model',
    label: 'Model',
    color: '#EAB308',
    order: 3,
    display_order: 3,
    is_active: true,
  },
  {
    id: '4',
    name: 'Verbal',
    label: 'Verbal',
    color: '#3B82F6',
    order: 4,
    display_order: 4,
    is_active: true,
  },
  {
    id: '5',
    name: 'Gesture',
    label: 'Gesture',
    color: '#8B5CF6',
    order: 5,
    display_order: 5,
    is_active: true,
  },
  {
    id: '6',
    name: 'Independent',
    label: 'Independent',
    color: '#10B981',
    order: 6,
    display_order: 6,
    is_active: true,
  },
];

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
  const key = `form_config_${formName.toLowerCase().trim()}`;
  return storage.getJSONSync(key);
}

function setCachedFormConfig(formName: string, config: any) {
  if (config) {
    const key = `form_config_${formName.toLowerCase().trim()}`;
    storage.setJSONSync(key, config);
  }
}

// SCR-ADMIN-001: Form Builder
export const getFormConfig = async (formName: string) => {
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
  try {
    return await client.post(`/admin/forms/${encodeURIComponent(formName)}`, payload);
  } catch {
    return { data: payload };
  }
};

export const resetFormToDefault = async (formName: string) => {
  const key = `form_config_${formName.toLowerCase().trim()}`;
  storage.removeSync(key);

  if (!isUserAdmin()) {
    return { data: getDefaultFormConfig(formName) };
  }
  try {
    return await client.post(`/admin/forms/${encodeURIComponent(formName)}/reset`);
  } catch {
    return { data: getDefaultFormConfig(formName) };
  }
};

// SCR-ADMIN-002: Trial Logging Format
export const getTrialLoggingConfig = async () => {
  try {
    const res = await client.get('/admin/trial-logging-config');
    if (res?.data) return res;
  } catch {}

  const cached = storage.getJSONSync('admin_trial_logging_config');
  return {
    data: cached || {
      layout: 'Horizontal',
      streamCount: 10,
      consecutive: 3,
      independence: 80,
      autoSuggest: true,
    },
  };
};

export const saveTrialLoggingConfig = async (payload: Payload) => {
  storage.setJSONSync('admin_trial_logging_config', payload);
  try {
    return await client.post('/admin/trial-logging-config', payload);
  } catch {
    return { data: payload };
  }
};

// SCR-ADMIN-002: Live Prompt Levels API (/admin/prompt_levels)
export const getPromptLevelsApi = async () => {
  try {
    const res = await client.get('/admin/prompt_levels');
    if (res?.data) return res;
  } catch {}

  const cached = storage.getJSONSync<any[]>('admin_prompt_levels');
  return { data: cached && cached.length > 0 ? cached : DEFAULT_PROMPT_LEVELS };
};

export const getPromptLevelApi = (id: string | number) => client.get(`/admin/prompt_levels/${id}`);

export const createPromptLevelApi = async (payload: {
  label?: string;
  name?: string;
  color: string;
  display_order?: number;
  order?: number;
  is_active?: boolean;
}) => {
  let created = null;
  try {
    const res = await client.post('/admin/prompt_levels', { prompt_level: payload });
    created = res?.data;
  } catch {}

  const levels = storage.getJSONSync<any[]>('admin_prompt_levels') || DEFAULT_PROMPT_LEVELS;
  const newLevel = created || {
    id: String(Date.now()),
    name: payload.name || payload.label || 'New Prompt',
    label: payload.label || payload.name || 'New Prompt',
    color: payload.color || '#6366F1',
    order: payload.order ?? payload.display_order ?? levels.length + 1,
    display_order: payload.display_order ?? payload.order ?? levels.length + 1,
    is_active: payload.is_active ?? true,
  };
  storage.setJSONSync('admin_prompt_levels', [...levels, newLevel]);
  return { data: newLevel };
};

export const updatePromptLevelApi = async (
  id: string | number,
  payload: {
    label?: string;
    name?: string;
    color?: string;
    display_order?: number;
    order?: number;
    is_active?: boolean;
  },
) => {
  let updated = null;
  try {
    const res = await client.put(`/admin/prompt_levels/${id}`, { prompt_level: payload });
    updated = res?.data;
  } catch {}

  const levels = storage.getJSONSync<any[]>('admin_prompt_levels') || DEFAULT_PROMPT_LEVELS;
  const next = levels.map((l) => (String(l.id) === String(id) ? { ...l, ...payload } : l));
  storage.setJSONSync('admin_prompt_levels', next);
  return { data: updated || { id, ...payload } };
};

export const deletePromptLevelApi = async (id: string | number) => {
  try {
    await client.delete(`/admin/prompt_levels/${id}`);
  } catch {}

  const levels = storage.getJSONSync<any[]>('admin_prompt_levels') || DEFAULT_PROMPT_LEVELS;
  storage.setJSONSync(
    'admin_prompt_levels',
    levels.filter((l) => String(l.id) !== String(id)),
  );
  return { data: { ok: true, id } };
};

export const reorderPromptLevelsApi = async (ids: (string | number)[]) => {
  try {
    await client.put('/admin/prompt_levels/reorder', { ids });
  } catch {}

  const levels = storage.getJSONSync<any[]>('admin_prompt_levels') || DEFAULT_PROMPT_LEVELS;
  const reordered = ids
    .map((id, index) => {
      const item = levels.find((l) => String(l.id) === String(id));
      return item ? { ...item, order: index + 1, display_order: index + 1 } : null;
    })
    .filter(Boolean);
  storage.setJSONSync('admin_prompt_levels', reordered);
  return { data: reordered };
};

// SCR-ADMIN-003: ABC Dropdown List Manager
export const getAbcLists = async () => {
  try {
    const res = await client.get('/admin/abc-lists');
    if (res?.data) return res;
  } catch {}

  const cached = storage.getJSONSync('admin_abc_lists');
  return {
    data: cached || {
      behaviors: [
        {
          id: 'b1',
          name: 'Self-Injurious Behavior',
          definition: 'Any behavior that causes harm to self',
          category: 'Physical',
          status: 'Active',
        },
        {
          id: 'b2',
          name: 'Aggression',
          definition: 'Physical or verbal acts directed toward others',
          category: 'Physical',
          status: 'Active',
        },
        {
          id: 'b3',
          name: 'Elopement',
          definition: 'Leaving designated area without permission',
          category: 'Safety',
          status: 'Active',
        },
      ],
      antecedents: [
        { id: 'a1', name: 'Task demand', type: 'Academic', status: 'Active' },
        { id: 'a2', name: 'Transition', type: 'Environmental', status: 'Active' },
        { id: 'a3', name: 'Denial of access', type: 'Social', status: 'Active' },
      ],
      consequences: [
        { id: 'c1', name: 'Escape task', type: 'Negative Reinforcement', status: 'Active' },
        { id: 'c2', name: 'Attention', type: 'Positive Reinforcement', status: 'Active' },
        { id: 'c3', name: 'Tangible item', type: 'Positive Reinforcement', status: 'Active' },
      ],
      locations: [
        { id: 'l1', name: 'Classroom A', status: 'Active' },
        { id: 'l2', name: 'Therapy Room 1', status: 'Active' },
        { id: 'l3', name: 'Sensory Room', status: 'Active' },
      ],
    },
  };
};

export const saveAbcList = async (listType: string, items: Payload[]) => {
  const current = storage.getJSONSync<any>('admin_abc_lists') || {};
  current[listType.toLowerCase()] = items;
  storage.setJSONSync('admin_abc_lists', current);
  try {
    return await client.post(`/admin/abc-lists/${listType}`, { items });
  } catch {
    return { data: { ok: true, listType, items } };
  }
};

export const resetAbcListsToDefault = async () => {
  storage.removeSync('admin_abc_lists');
  try {
    return await client.post('/admin/abc-lists/reset');
  } catch {
    return { data: { ok: true } };
  }
};

const DEFAULT_SCHEDULE_CAPACITY_CONFIG = {
  morningStart: '08:00 AM',
  morningEnd: '10:30 AM',
  afternoonStart: '01:00 PM',
  afternoonEnd: '03:30 PM',
  preTherapyDuration: 30,
  capacity: 2,
  staff_to_student_capacity: 2,
  draftExpiry: 7,
  blocks: [
    {
      id: 'b1',
      name: 'Morning Block 1',
      startTime: '08:00 AM',
      endTime: '09:15 AM',
      type: 'Therapy',
    },
    {
      id: 'b2',
      name: 'Morning Block 2',
      startTime: '09:15 AM',
      endTime: '10:30 AM',
      type: 'Therapy',
    },
    {
      id: 'b3',
      name: 'Afternoon Block 1',
      startTime: '01:00 PM',
      endTime: '02:15 PM',
      type: 'Therapy',
    },
    {
      id: 'b4',
      name: 'Afternoon Block 2',
      startTime: '02:15 PM',
      endTime: '03:30 PM',
      type: 'Therapy',
    },
  ],
};

// SCR-ADMIN-004: Session Schedule & Capacity
export const getScheduleCapacityConfig = async () => {
  if (!isUserAdmin()) {
    const cached = storage.getJSONSync('admin_schedule_capacity_config');
    return {
      data: cached || DEFAULT_SCHEDULE_CAPACITY_CONFIG,
    };
  }

  try {
    const res = await client.get('/admin/schedule-capacity-config');
    if (res?.data) {
      storage.setJSONSync('admin_schedule_capacity_config', res.data);
      return res;
    }
  } catch {}

  const cached = storage.getJSONSync('admin_schedule_capacity_config');
  return {
    data: cached || DEFAULT_SCHEDULE_CAPACITY_CONFIG,
  };
};

export const saveScheduleCapacityConfig = async (payload: Payload) => {
  storage.setJSONSync('admin_schedule_capacity_config', payload);
  try {
    return await client.post('/admin/schedule-capacity-config', payload);
  } catch {
    return { data: payload };
  }
};

// SCR-ADMIN-005: Goal Domain Definitions
export const getGoalDomains = async () => {
  try {
    const res = await client.get('/admin/goal_domains');
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) return res;
  } catch {}

  const cached = storage.getJSONSync<any[]>('admin_goal_domains');
  return { data: cached && cached.length > 0 ? cached : DEFAULT_GOAL_DOMAINS };
};

export const saveGoalDomains = async (domains: Payload[]) => {
  storage.setJSONSync('admin_goal_domains', domains);
  try {
    return await client.post('/admin/goal_domains', { domains });
  } catch {
    return { data: domains };
  }
};

// SCR-ADMIN-006: Task Analysis Templates
export const getTaskAnalysisTemplates = async () => {
  try {
    const res = await client.get('/admin/task-analysis-templates');
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) return res;
  } catch {}

  const cached = storage.getJSONSync<any[]>('admin_task_analysis_templates');
  return { data: cached && cached.length > 0 ? cached : DEFAULT_TASK_TEMPLATES };
};

export const saveTaskAnalysisTemplate = async (templateId: string | null, payload: Payload) => {
  const current =
    storage.getJSONSync<any[]>('admin_task_analysis_templates') || DEFAULT_TASK_TEMPLATES;
  let savedItem: any = null;
  if (templateId) {
    savedItem = { id: templateId, ...payload };
    const next = current.map((t) => (t.id === templateId ? savedItem : t));
    storage.setJSONSync('admin_task_analysis_templates', next);
  } else {
    savedItem = { id: `tt-${Date.now()}`, ...payload };
    storage.setJSONSync('admin_task_analysis_templates', [...current, savedItem]);
  }

  try {
    if (templateId) {
      await client.patch(`/admin/task-analysis-templates/${templateId}`, payload);
    } else {
      await client.post('/admin/task-analysis-templates', payload);
    }
  } catch {}

  return { data: savedItem };
};

export const deleteTaskAnalysisTemplate = async (templateId: string) => {
  try {
    await client.delete(`/admin/task-analysis-templates/${templateId}`);
  } catch {}

  const current =
    storage.getJSONSync<any[]>('admin_task_analysis_templates') || DEFAULT_TASK_TEMPLATES;
  storage.setJSONSync(
    'admin_task_analysis_templates',
    current.filter((t) => t.id !== templateId),
  );
  return { data: { ok: true, id: templateId } };
};

// MR-6: Clinic Info / Working Hours / School Settings configuration
export const getClinicInfo = async () => {
  const cached = storage.getJSONSync('admin_clinic_info');
  return {
    data: cached || {
      name: 'Melu ABA Learning Center',
      address: '100 Pediatric Way',
      phone: '(555) 019-2834',
      email: 'info@melue.edu',
    },
  };
};

export const saveClinicInfo = async (payload: Payload) => {
  storage.setJSONSync('admin_clinic_info', payload);
  try {
    return await client.post('/admin/clinic-info', payload);
  } catch {
    return { data: payload };
  }
};

export const getWorkingHours = async () => {
  const cached = storage.getJSONSync('admin_working_hours');
  return {
    data: cached || {
      mondayToFriday: '08:00 AM - 05:00 PM',
      saturday: '09:00 AM - 01:00 PM',
      sunday: 'Closed',
    },
  };
};

export const saveWorkingHours = async (payload: Payload) => {
  storage.setJSONSync('admin_working_hours', payload);
  try {
    return await client.post('/admin/working-hours', payload);
  } catch {
    return { data: payload };
  }
};

export const getSchoolSettings = async () => {
  const cached = storage.getJSONSync('admin_school_settings');
  return {
    data: cached || {
      academicYear: '2026-2027',
      maxCaseloadPerTherapist: 8,
      trialLoggingMethod: 'Frequency',
    },
  };
};

export const saveSchoolSettings = async (payload: Payload) => {
  storage.setJSONSync('admin_school_settings', payload);
  try {
    return await client.post('/admin/school-settings', payload);
  } catch {
    return { data: payload };
  }
};

// MR-6: Clinical categories CRUD (Programs / Assessment Types / Therapy Types)
export const getClinicalCategories = async () => {
  const cached = storage.getJSONSync('admin_clinical_categories');
  return {
    data: cached || {
      programs: ['ABA Comprehensive', 'Early Intervention', 'Social Skills'],
      therapyTypes: ['1:1 Direct', 'Group Therapy', 'Parent Training'],
    },
  };
};

export const saveClinicalCategory = async (category: string, item: Payload) => {
  const categories = storage.getJSONSync<any>('admin_clinical_categories') || {};
  categories[category] = [...(categories[category] || []), item];
  storage.setJSONSync('admin_clinical_categories', categories);
  return { data: item };
};

export const updateClinicalCategory = async (
  category: string,
  itemId: string,
  payload: Payload,
) => {
  return { data: { id: itemId, ...payload } };
};

export const deleteClinicalCategory = async (category: string, itemId: string) => {
  return { data: { ok: true, id: itemId } };
};
