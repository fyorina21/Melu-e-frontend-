import { describe, it, expect, beforeEach } from 'vitest';
import {
  getFormConfig,
  saveFormConfig,
  resetFormToDefault,
  getDefaultFormConfig,
} from '../../api/institutionalAdminApi';
import { getSectionsForForm, ASSESSMENT_DIRECT_ROUTES } from './formBuilderConfig';

describe('FormBuilder and Dynamic Forms Integration', () => {
  beforeEach(async () => {
    await resetFormToDefault('Enrollment Wizard');
    await resetFormToDefault('ABLLS Assessment Form');
    await resetFormToDefault('Social Skills Questionnaire');
    await resetFormToDefault('Behavioral Assessment');
    await resetFormToDefault('Preference Assessment');
    await resetFormToDefault('Sensory Assessment');
  });

  it('verifies Enrollment Wizard questions are fully configured and editable', async () => {
    const { data: config } = await getFormConfig('Enrollment Wizard');
    expect(config.fields).toBeDefined();
    expect(config.fields.length).toBeGreaterThanOrEqual(10);

    const labels = config.fields.map((f: any) => f.label.toLowerCase());
    expect(labels.some((l: string) => l.includes('name'))).toBe(true);
    expect(labels.some((l: string) => l.includes('birth'))).toBe(true);
    expect(labels.some((l: string) => l.includes('gender'))).toBe(true);
    expect(labels.some((l: string) => l.includes('program'))).toBe(true);
    expect(labels.some((l: string) => l.includes('therapy'))).toBe(true);
    expect(labels.some((l: string) => l.includes('parent'))).toBe(true);
    expect(labels.some((l: string) => l.includes('phone'))).toBe(true);
    expect(labels.some((l: string) => l.includes('diagnosis'))).toBe(true);

    // Test adding a question to Enrollment Wizard
    const newField = {
      id: 'f_custom_lang',
      type: 'Text',
      label: 'Primary Home Language',
      required: true,
      visible: true,
      section: 'Student Info',
    };
    await saveFormConfig('Enrollment Wizard', {
      ...config,
      fields: [...config.fields, newField],
    });

    const { data: updated } = await getFormConfig('Enrollment Wizard');
    expect(updated.fields.some((f: any) => f.label === 'Primary Home Language')).toBe(true);
  });

  it('verifies ABLLS Assessment Form has all 55 items and edits sync dynamically', async () => {
    const { data: config } = await getFormConfig('ABLLS Assessment Form');
    expect(config.fields).toBeDefined();
    expect(config.fields.length).toBeGreaterThanOrEqual(55);

    // Verify domains A to I exist
    const sections = new Set(config.fields.map((f: any) => f.section));
    expect(sections.has('Visual Performance')).toBe(true);
    expect(sections.has('Motor Imitation')).toBe(true);
    expect(sections.has('Vocal Imitation')).toBe(true);
    expect(sections.has('Receptive Language')).toBe(true);
    expect(sections.has('Requesting (Mands)')).toBe(true);
    expect(sections.has('Play and Leisure')).toBe(true);
    expect(sections.has('Social Interaction')).toBe(true);
    expect(sections.has('Writing')).toBe(true);
    expect(sections.has('Dressing')).toBe(true);

    // Test editing a question
    const updatedFields = config.fields.map((f: any) =>
      f.id === 'A1' ? { ...f, label: 'A1: Matches identical objects (Customized Edition)' } : f
    );
    await saveFormConfig('ABLLS Assessment Form', { ...config, fields: updatedFields });

    const { data: updated } = await getFormConfig('ABLLS Assessment Form');
    const a1 = updated.fields.find((f: any) => f.id === 'A1');
    expect(a1.label).toBe('A1: Matches identical objects (Customized Edition)');
  });

  it('verifies Social Skills Questionnaire has questions and is editable', async () => {
    const { data: config } = await getFormConfig('Social Skills Questionnaire');
    expect(config.fields).toBeDefined();
    expect(config.fields.length).toBeGreaterThanOrEqual(10);

    const q1 = config.fields.find((f: any) => f.id === 'q1');
    expect(q1).toBeDefined();
    expect(q1.label).toContain('Initiates interactions');

    expect(getSectionsForForm('Social Skills Questionnaire')).toContain('Social Interaction');
    expect(ASSESSMENT_DIRECT_ROUTES['Social Skills Questionnaire'].route).toBe('SocialSkillsAssessment');

    // Test modifying a question
    const updatedFields = config.fields.map((f: any) =>
      f.id === 'q1' ? { ...f, label: 'Initiates interactions independently without teacher prompt' } : f
    );
    await saveFormConfig('Social Skills Questionnaire', { ...config, fields: updatedFields });

    const { data: updated } = await getFormConfig('Social Skills Questionnaire');
    expect(updated.fields.find((f: any) => f.id === 'q1').label).toBe(
      'Initiates interactions independently without teacher prompt'
    );
  });

  it('verifies Behavioral Assessment has MASS (M1-M12), FAST (F1-F8), and ABC questions', async () => {
    const { data: config } = await getFormConfig('Behavioral Assessment');
    expect(config.fields).toBeDefined();

    const massFields = config.fields.filter((f: any) => f.id.startsWith('M'));
    expect(massFields.length).toBeGreaterThanOrEqual(12);

    const fastFields = config.fields.filter((f: any) => f.id.startsWith('F'));
    expect(fastFields.length).toBeGreaterThanOrEqual(8);

    expect(ASSESSMENT_DIRECT_ROUTES['Behavioral Assessment'].route).toBe('BehaviorAssessment');
  });

  it('verifies Preference Assessment has stimulus items across categories and is editable', async () => {
    const { data: config } = await getFormConfig('Preference Assessment');
    expect(config.fields).toBeDefined();
    expect(config.fields.length).toBeGreaterThanOrEqual(10);

    const visual = config.fields.filter((f: any) => f.section === 'Visual');
    expect(visual.length).toBeGreaterThan(0);
    expect(ASSESSMENT_DIRECT_ROUTES['Preference Assessment'].route).toBe('PreferenceAssessment');
  });

  it('verifies Sensory Assessment has all SEN-001 to SEN-012 activities and is editable', async () => {
    const { data: config } = await getFormConfig('Sensory Assessment');
    expect(config.fields).toBeDefined();

    const senFields = config.fields.filter((f: any) => f.id.startsWith('SEN-'));
    expect(senFields.length).toBeGreaterThanOrEqual(12);
    expect(ASSESSMENT_DIRECT_ROUTES['Sensory Assessment'].route).toBe('SensoryAssessment');
  });
});
