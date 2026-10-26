import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getFormConfig,
  saveFormConfig,
  resetFormToDefault,
  getDefaultFormConfig,
  getCachedFormConfig,
} from '../../api/institutionalAdminApi';
import {
  getSectionsForForm,
  getPresetsForForm,
  getNextIdForSection,
  SOCIAL_SKILLS_SECTIONS,
  SOCIAL_SKILLS_PRESETS,
  ASSESSMENT_DIRECT_ROUTES,
} from './formBuilderConfig';

describe('Social Skills Questionnaire FormBuilder & Assessment Sync', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('provides default 10 social skills questions with appropriate sections and rating scales', () => {
    const defaultConfig = getDefaultFormConfig('Social Skills Questionnaire');
    expect(defaultConfig).toBeDefined();
    expect(defaultConfig.fields.length).toBe(10);

    const q1 = defaultConfig.fields.find((f: any) => f.id === 'q1');
    expect(q1).toBeDefined();
    expect(q1.label).toBe('Initiates interactions with peers without prompting');
    expect(q1.section).toBe('Social Interaction');
    expect(q1.type).toBe('Radio');
    expect(q1.options).toEqual(['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always']);

    const q2 = defaultConfig.fields.find((f: any) => f.id === 'q2');
    expect(q2).toBeDefined();
    expect(q2.label).toBe('Maintains eye contact during conversations');
    expect(q2.section).toBe('Communication');
  });

  it('exposes correct sections and presets for Social Skills Questionnaire', () => {
    const sections = getSectionsForForm('Social Skills Questionnaire');
    expect(sections).toEqual(SOCIAL_SKILLS_SECTIONS);
    expect(sections).toContain('Social Interaction');
    expect(sections).toContain('Communication');

    const presets = getPresetsForForm('Social Skills Questionnaire');
    expect(presets).toEqual(SOCIAL_SKILLS_PRESETS);
    expect(presets.length).toBeGreaterThanOrEqual(2);
    expect(presets.some((p) => p.short === '4-Pt (0-3)')).toBe(true);
  });

  it('computes next sequential question ID (e.g. q11) when adding a question', () => {
    const defaultFields = getDefaultFormConfig('Social Skills Questionnaire').fields;
    const nextId = getNextIdForSection(
      'Social Skills Questionnaire',
      'Social Interaction',
      defaultFields,
    );
    expect(nextId).toBe('q11');
  });

  it('allows institutional admin to edit questions in FormBuilder and persist them', async () => {
    const defaultConfig = getDefaultFormConfig('Social Skills Questionnaire');
    const modifiedFields = defaultConfig.fields.map((f: any) => {
      if (f.id === 'q1') {
        return { ...f, label: 'Custom: Initiates peer interaction independently' };
      }
      return f;
    });

    let eventFired = false;
    let detailReceived: any = null;
    const listener = (e: any) => {
      eventFired = true;
      detailReceived = e.detail;
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('melue_form_config_changed', listener);
    }

    await saveFormConfig('Social Skills Questionnaire', {
      fields: modifiedFields,
      customSections: ['Social Interaction', 'Communication'],
      deletedSections: [],
      isDefault: false,
    });

    if (typeof window !== 'undefined') {
      expect(eventFired).toBe(true);
      expect(detailReceived?.formName).toBe('Social Skills Questionnaire');
      window.removeEventListener('melue_form_config_changed', listener);
    }

    const loaded = await getFormConfig('Social Skills Questionnaire');
    expect(loaded.data.fields[0].label).toBe('Custom: Initiates peer interaction independently');
  });

  it('allows adding a new question and reflects it in the form config', async () => {
    const defaultConfig = getDefaultFormConfig('Social Skills Questionnaire');
    const newField = {
      id: 'q11',
      label: 'Expresses empathy towards upset classmates',
      type: 'Radio',
      required: true,
      visible: true,
      section: 'Social Interaction',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    };

    const updatedFields = [...defaultConfig.fields, newField];
    await saveFormConfig('Social Skills Questionnaire', {
      fields: updatedFields,
      customSections: ['Social Interaction', 'Communication'],
      deletedSections: [],
      isDefault: false,
    });

    const cached = getCachedFormConfig('Social Skills Questionnaire');
    expect(cached?.fields.length).toBe(11);
    expect(cached?.fields.find((f: any) => f.id === 'q11')?.label).toBe(
      'Expresses empathy towards upset classmates',
    );
  });

  it('links correctly to live assessment route', () => {
    const routeInfo = ASSESSMENT_DIRECT_ROUTES['Social Skills Questionnaire'];
    expect(routeInfo).toBeDefined();
    expect(routeInfo.url).toBe('http://localhost:8081/SocialSkillsAssessment');
    expect(routeInfo.route).toBe('SocialSkillsAssessment');
  });

  it('resets form configuration back to default 10 questions', async () => {
    // Save modified
    await saveFormConfig('Social Skills Questionnaire', {
      fields: [
        { id: 'q1', label: 'Only one question', type: 'Radio', required: true, visible: true },
      ],
      isDefault: false,
    });

    await resetFormToDefault('Social Skills Questionnaire');
    const resetConfig = await getFormConfig('Social Skills Questionnaire');
    expect(resetConfig.data.fields.length).toBe(10);
    expect(resetConfig.data.fields[0].id).toBe('q1');
  });

  it('ensures FormBuilderScreen does not reference undefined activeFilterSection', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const formBuilderFile = path.resolve(__dirname, 'FormBuilderScreen.tsx');
    const content = fs.readFileSync(formBuilderFile, 'utf-8');
    expect(content).not.toContain('activeFilterSection');
  });
});
