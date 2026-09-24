import { describe, it, expect, beforeEach } from 'vitest';
import { getFormConfig, saveFormConfig, resetFormToDefault } from '../../api/institutionalAdminApi';
import {
  FORMS,
  FIELD_TYPES,
  ASSESSMENT_DIRECT_ROUTES,
  getSectionsForForm,
  getPresetsForForm,
  getNextIdForSection,
  COMMON_SKILL_TYPES,
  COMMON_INFO_TYPES,
  getDomainLetterForAblls,
} from './formBuilderConfig';
import {
  buildAbllsDomainsFromConfig,
  getItemScoreOptions,
} from '../assessments/abllsConfigHelper';

describe('FormBuilder Assessment Integration', () => {
  beforeEach(async () => {
    await resetFormToDefault('Behavioral Assessment');
    await resetFormToDefault('Preference Assessment');
    await resetFormToDefault('Sensory Assessment');
    await resetFormToDefault('ABLLS Assessment Form');
  });

  it('includes Behavioral, Preference, and Sensory assessments in the FORMS dropdown list', () => {
    expect(FORMS).toContain('Behavioral Assessment');
    expect(FORMS).toContain('Preference Assessment');
    expect(FORMS).toContain('Sensory Assessment');
  });

  it('maps direct assessment routes accurately', () => {
    expect(ASSESSMENT_DIRECT_ROUTES['Behavioral Assessment'].route).toBe('BehaviorAssessment');
    expect(ASSESSMENT_DIRECT_ROUTES['Preference Assessment'].route).toBe('PreferenceAssessment');
    expect(ASSESSMENT_DIRECT_ROUTES['Sensory Assessment'].route).toBe('SensoryAssessment');
  });

  it('provides sections for assessments and restricts scale presets strictly to ABLLS Assessment Form', () => {
    expect(getSectionsForForm('Behavioral Assessment')).toContain('MASS');
    expect(getSectionsForForm('Preference Assessment')).toContain('Visual');
    expect(getSectionsForForm('Sensory Assessment')).toContain('Tactile');

    expect(getPresetsForForm('ABLLS Assessment Form').length).toBeGreaterThan(0);
    expect(getPresetsForForm('Behavioral Assessment')).toEqual([]);
    expect(getPresetsForForm('Preference Assessment')).toEqual([]);
    expect(getPresetsForForm('Sensory Assessment')).toEqual([]);
  });

  it('loads default configurations with real domain fields for Behavioral Assessment', async () => {
    const { data: config } = await getFormConfig('Behavioral Assessment');
    expect(config.fields).toBeDefined();
    expect(config.fields.length).toBeGreaterThan(0);

    const massFields = config.fields.filter((f: any) => f.id.startsWith('M'));
    expect(massFields.length).toBeGreaterThanOrEqual(12);
    massFields.forEach((f: any) => {
      if (f.options) {
        expect(f.options).not.toContain('Seldom');
      }
    });

    const fastFields = config.fields.filter((f: any) => f.id.startsWith('F'));
    expect(fastFields.length).toBeGreaterThanOrEqual(8);
  });

  it('loads default configurations with real stimulus items for Preference Assessment', async () => {
    const { data: config } = await getFormConfig('Preference Assessment');
    expect(config.fields.length).toBeGreaterThan(0);

    const visualItems = config.fields.filter((f: any) => f.section === 'Visual');
    expect(visualItems.length).toBeGreaterThan(0);
  });

  it('loads default configurations with sensory activities for Sensory Assessment', async () => {
    const { data: config } = await getFormConfig('Sensory Assessment');
    expect(config.fields.length).toBeGreaterThan(0);

    const senItems = config.fields.filter((f: any) => f.id.startsWith('SEN-'));
    expect(senItems.length).toBeGreaterThanOrEqual(10);
  });

  it('saves and persists custom fields and updates via saveFormConfig', async () => {
    const { data: initialConfig } = await getFormConfig('Behavioral Assessment');
    const newField = {
      id: 'M13',
      type: 'Radio' as const,
      label: 'M13: Engages in task when given immediate praise',
      required: true,
      visible: true,
      section: 'MASS',
      options: ['0 - Never', '1 - Rarely', '2 - Sometimes', '3 - Frequently', '4 - Usually', '5 - Always'],
    };

    await saveFormConfig('Behavioral Assessment', {
      fields: [...initialConfig.fields, newField],
      history: [{ date: '2026-09-19', user: 'Admin A', field: newField.label, oldValue: 'None', newValue: 'Added' }],
      isDefault: false,
    });

    const { data: updatedConfig } = await getFormConfig('Behavioral Assessment');
    expect(updatedConfig.isDefault).toBe(false);
    expect(updatedConfig.fields.some((f: any) => f.id === 'M13')).toBe(true);
  });

  it('generates appropriate sequential IDs for each assessment type and section', () => {
    const existingBehFields = [
      { id: 'M1', type: 'Radio' as const, label: 'Item 1', required: true, visible: true },
      { id: 'M2', type: 'Radio' as const, label: 'Item 2', required: true, visible: true },
      { id: 'F1', type: 'Radio' as const, label: 'Item 3', required: true, visible: true },
    ];
    expect(getNextIdForSection('Behavioral Assessment', 'MASS (Motivation Assessment)', existingBehFields)).toBe('M3');
    expect(getNextIdForSection('Behavioral Assessment', 'FAST (Functional Analysis)', existingBehFields)).toBe('F2');
    expect(getNextIdForSection('Behavioral Assessment', 'ABC Tracking', existingBehFields)).toBe('ABC-1');

    const existingPrefFields = [
      { id: 'P1', type: 'Radio' as const, label: 'Item 1', required: true, visible: true },
      { id: 'P2', type: 'Radio' as const, label: 'Item 2', required: true, visible: true },
    ];
    expect(getNextIdForSection('Preference Assessment', 'Visual', existingPrefFields)).toBe('P3');

    const existingSensoryFields = [
      { id: 'SEN-001', type: 'Radio' as const, label: 'Item 1', required: true, visible: true },
      { id: 'SEN-002', type: 'Radio' as const, label: 'Item 2', required: true, visible: true },
    ];
    expect(getNextIdForSection('Sensory Assessment', 'Tactile', existingSensoryFields)).toBe('SEN-003');
  });

  it('provides COMMON_SKILL_TYPES including Visual Performance and Motor Imitation', () => {
    expect(COMMON_SKILL_TYPES).toContain('Visual Performance');
    expect(COMMON_SKILL_TYPES).toContain('Motor Imitation');
    expect(COMMON_SKILL_TYPES).toContain('Vocal Imitation');
    expect(COMMON_SKILL_TYPES).toContain('Receptive Language');
  });

  it('generates sequential IDs for custom skill types and safely handles parentheses and special characters', () => {
    const emptyFields: any[] = [];
    expect(getNextIdForSection('IUP Form', 'Visual Performance', emptyFields)).toBe('VP-1');

    const withOneField = [
      { id: 'VP-1', type: 'Radio', label: 'Item 1', required: true, visible: true, section: 'Visual Performance' },
    ];
    expect(getNextIdForSection('IUP Form', 'Visual Performance', withOneField)).toBe('VP-2');

    expect(getNextIdForSection('IUP Form', 'Motor Imitation', emptyFields)).toBe('MI-1');

    // Section with parentheses like "Requesting (Mands)" must never crash regex
    expect(getNextIdForSection('IUP Form', 'Requesting (Mands)', emptyFields)).toBe('RM-1');
    const withRmField = [
      { id: 'RM-1', type: 'Radio', label: 'Item 1', required: true, visible: true, section: 'Requesting (Mands)' },
    ];
    expect(getNextIdForSection('IUP Form', 'Requesting (Mands)', withRmField)).toBe('RM-2');

    // Section with symbols like "Visual & Auditory"
    expect(getNextIdForSection('Enrollment Wizard', 'Visual & Auditory', emptyFields)).toBe('VA-1');
  });

  it('persists custom skill types and allows managing items inside them', async () => {
    const customSections = ['Visual Performance', 'Motor Imitation'];
    const fields = [
      {
        id: 'VP-1',
        type: 'Radio',
        label: 'VP-1: Matches identical cards',
        required: true,
        visible: true,
        section: 'Visual Performance',
        options: ['0 — Not Demonstrated', '1 — Emerging', '2 — Mastered', 'N/A'],
      },
    ];

    await saveFormConfig('IUP Form', {
      fields,
      customSections,
      isDefault: false,
    });

    const { data: savedConfig } = await getFormConfig('IUP Form');
    expect(savedConfig.customSections).toContain('Visual Performance');
    expect(savedConfig.customSections).toContain('Motor Imitation');
    expect(savedConfig.fields.some((f: any) => f.section === 'Visual Performance')).toBe(true);

    await resetFormToDefault('IUP Form');
  });

  it('assigns sequential domain letter code and generates IDs for newly added ABLLS skill domain', () => {
    // Existing letters A..I are Visual Performance through Dressing
    expect(getDomainLetterForAblls('Visual Performance')).toBe('A');
    expect(getDomainLetterForAblls('Motor Imitation')).toBe('B');
    expect(getDomainLetterForAblls('Vocal Imitation')).toBe('C');
    expect(getDomainLetterForAblls('Receptive Language')).toBe('D');

    // New domain e.g. Visual Imitation gets next letter 'J'
    expect(getDomainLetterForAblls('Visual Imitation', [])).toBe('J');
    expect(getNextIdForSection('ABLLS Assessment Form', 'Visual Imitation', [])).toBe('J1');

    const existingJ = [
      { id: 'J1', type: 'Radio', label: 'J1: Imitates hand movements', required: true, visible: true, section: 'Visual Imitation' },
    ];
    expect(getNextIdForSection('ABLLS Assessment Form', 'Visual Imitation', existingJ)).toBe('J2');
  });

  it('ensures newly created skill domain has full scoring features identical to Vocal Imitation and displays on SkillsAssessment', async () => {
    const { data: abllsConfig } = await getFormConfig('ABLLS Assessment Form');

    const newSkillDomain = 'Visual Imitation';
    const newItems = [
      {
        id: 'J1',
        type: 'Radio' as const,
        label: 'J1: Imitates simple finger movements',
        required: true,
        visible: true,
        section: newSkillDomain,
        options: ['0 — Not Demonstrated', '1 — Emerging', '2 — Mastered', 'N/A'],
      },
      {
        id: 'J2',
        type: 'Radio' as const,
        label: 'J2: Replicates block structures',
        required: true,
        visible: true,
        section: newSkillDomain,
        options: ['0 — Not Demonstrated', '1 — Emerging', '2 — Mastered', 'N/A'],
      },
    ];

    // Save with the new skill domain in ABLLS configuration
    await saveFormConfig('ABLLS Assessment Form', {
      fields: [...abllsConfig.fields, ...newItems],
      customSections: [newSkillDomain],
      isDefault: false,
    });

    const { data: updatedConfig } = await getFormConfig('ABLLS Assessment Form');

    // SkillsAssessment loads domains using buildAbllsDomainsFromConfig
    const domains = buildAbllsDomainsFromConfig(updatedConfig.fields, updatedConfig.customSections);

    // Verify the new skill domain is present alongside Motor Imitation, Vocal Imitation, Receptive Language
    const domainNames = domains.map((d) => d.name);
    expect(domainNames).toContain('Visual Performance');
    expect(domainNames).toContain('Motor Imitation');
    expect(domainNames).toContain('Vocal Imitation');
    expect(domainNames).toContain('Receptive Language');
    expect(domainNames).toContain('Visual Imitation');

    const visualImitationDomain = domains.find((d) => d.name === 'Visual Imitation');
    expect(visualImitationDomain).toBeDefined();
    expect(visualImitationDomain?.code).toBe('J');
    expect(visualImitationDomain?.items.length).toBe(2);
    expect(visualImitationDomain?.items[0].id).toBe('J1');
    expect(visualImitationDomain?.items[0].description).toBe('Imitates simple finger movements');

    // Verify it has the exact same scoring features (0, 1, 2, N/A with colors)
    const scoreOptions = getItemScoreOptions(visualImitationDomain?.items[0]);
    expect(scoreOptions.map((o) => o.label)).toEqual(['0', '1', '2', 'N/A']);
    expect(scoreOptions[0].color).toBe('#EF4444'); // Red for 0
    expect(scoreOptions[1].color).toBe('#EAB308'); // Yellow for 1
    expect(scoreOptions[2].color).toBe('#16A34A'); // Green for 2
    expect(scoreOptions[3].color).toBe('#94A3B8'); // Gray for N/A

    await resetFormToDefault('ABLLS Assessment Form');
  });

  it('supports editing/renaming and deleting both old and new skill types with persistent sync', async () => {
    const { data: initialConfig } = await getFormConfig('ABLLS Assessment Form');

    // 1. Add a new custom skill type: 'Tactile Discrimination'
    const newSkillDomain = 'Tactile Discrimination';
    const tactileItem = {
      id: 'TD-1',
      type: 'Radio' as const,
      label: 'TD-1: Discriminates smooth vs rough textures',
      required: true,
      visible: true,
      section: newSkillDomain,
      options: ['0 — Not Demonstrated', '1 — Emerging', '2 — Mastered', 'N/A'],
    };

    await saveFormConfig('ABLLS Assessment Form', {
      fields: [...initialConfig.fields, tactileItem],
      customSections: [newSkillDomain],
      deletedSections: [],
      isDefault: false,
    });

    // 2. Edit (rename) the new skill type: 'Tactile Discrimination' -> 'Tactile Skills'
    const renamedNewSkill = 'Tactile Skills';
    const { data: beforeRenameNew } = await getFormConfig('ABLLS Assessment Form');
    const updatedNewFields = beforeRenameNew.fields.map((f: any) =>
      f.section === newSkillDomain ? { ...f, section: renamedNewSkill } : f
    );
    const updatedCustomSections = beforeRenameNew.customSections.map((s: string) =>
      s === newSkillDomain ? renamedNewSkill : s
    );

    await saveFormConfig('ABLLS Assessment Form', {
      fields: updatedNewFields,
      customSections: updatedCustomSections,
      deletedSections: [],
      isDefault: false,
    });

    const { data: afterRenameNew } = await getFormConfig('ABLLS Assessment Form');
    expect(afterRenameNew.customSections).toContain('Tactile Skills');
    expect(afterRenameNew.customSections).not.toContain('Tactile Discrimination');
    const renamedNewDomains = buildAbllsDomainsFromConfig(afterRenameNew.fields, afterRenameNew.customSections, afterRenameNew.deletedSections);
    expect(renamedNewDomains.map((d) => d.name)).toContain('Tactile Skills');

    // 3. Edit (rename) an OLD preset skill type: 'Motor Imitation' -> 'Gross & Fine Motor Skills'
    const oldSkill = 'Motor Imitation';
    const renamedOldSkill = 'Gross & Fine Motor Skills';
    const { data: beforeRenameOld } = await getFormConfig('ABLLS Assessment Form');
    const updatedOldFields = beforeRenameOld.fields.map((f: any) =>
      f.section === oldSkill ? { ...f, section: renamedOldSkill } : f
    );
    const customSectionsWithOld = [...(beforeRenameOld.customSections || []), renamedOldSkill];
    const deletedSectionsWithOld = [...(beforeRenameOld.deletedSections || []), oldSkill];

    await saveFormConfig('ABLLS Assessment Form', {
      fields: updatedOldFields,
      customSections: customSectionsWithOld,
      deletedSections: deletedSectionsWithOld,
      isDefault: false,
    });

    const { data: afterRenameOld } = await getFormConfig('ABLLS Assessment Form');
    expect(afterRenameOld.customSections).toContain('Gross & Fine Motor Skills');
    expect(afterRenameOld.deletedSections).toContain('Motor Imitation');

    const domainsAfterOldRename = buildAbllsDomainsFromConfig(
      afterRenameOld.fields,
      afterRenameOld.customSections,
      afterRenameOld.deletedSections
    );
    const domainNamesAfterOldRename = domainsAfterOldRename.map((d) => d.name);
    expect(domainNamesAfterOldRename).toContain('Gross & Fine Motor Skills');
    expect(domainNamesAfterOldRename).not.toContain('Motor Imitation');

    // 4. Delete the new skill type ('Tactile Skills')
    const { data: beforeDeleteNew } = await getFormConfig('ABLLS Assessment Form');
    const fieldsAfterDeleteNew = beforeDeleteNew.fields.filter((f: any) => f.section !== 'Tactile Skills');
    const customAfterDeleteNew = beforeDeleteNew.customSections.filter((s: string) => s !== 'Tactile Skills');

    await saveFormConfig('ABLLS Assessment Form', {
      fields: fieldsAfterDeleteNew,
      customSections: customAfterDeleteNew,
      deletedSections: beforeDeleteNew.deletedSections,
      isDefault: false,
    });

    const { data: afterDeleteNew } = await getFormConfig('ABLLS Assessment Form');
    expect(afterDeleteNew.customSections).not.toContain('Tactile Skills');
    const domainsAfterDeleteNew = buildAbllsDomainsFromConfig(
      afterDeleteNew.fields,
      afterDeleteNew.customSections,
      afterDeleteNew.deletedSections
    );
    expect(domainsAfterDeleteNew.map((d) => d.name)).not.toContain('Tactile Skills');

    // 5. Delete an OLD skill type ('Writing')
    const oldToDelete = 'Writing';
    const { data: beforeDeleteOld } = await getFormConfig('ABLLS Assessment Form');
    const fieldsAfterDeleteOld = beforeDeleteOld.fields.filter((f: any) => f.section !== oldToDelete);
    const deletedSectionsWithWriting = [...(beforeDeleteOld.deletedSections || []), oldToDelete];

    await saveFormConfig('ABLLS Assessment Form', {
      fields: fieldsAfterDeleteOld,
      customSections: beforeDeleteOld.customSections,
      deletedSections: deletedSectionsWithWriting,
      isDefault: false,
    });

    const { data: afterDeleteOld } = await getFormConfig('ABLLS Assessment Form');
    expect(afterDeleteOld.deletedSections).toContain('Writing');
    const domainsAfterDeleteOld = buildAbllsDomainsFromConfig(
      afterDeleteOld.fields,
      afterDeleteOld.customSections,
      afterDeleteOld.deletedSections
    );
    expect(domainsAfterDeleteOld.map((d) => d.name)).not.toContain('Writing');

    await resetFormToDefault('ABLLS Assessment Form');
  });

  it('supports adding Info Types to Enrollment Wizard and displays them with fields in StudentEnrollmentWizard', async () => {
    // 1. Verify COMMON_INFO_TYPES includes expected standard enrollment categories
    expect(COMMON_INFO_TYPES).toContain('Emergency Contact Info');
    expect(COMMON_INFO_TYPES).toContain('Insurance & Billing');
    expect(COMMON_INFO_TYPES).toContain('Behavioral Background');

    // 2. Fetch default Enrollment Wizard config
    const { data: initialConfig } = await getFormConfig('Enrollment Wizard');
    const existingFields = initialConfig?.fields || [];

    // 3. Generate sequential ID for new info type "Emergency Contact Info"
    const firstFieldId = getNextIdForSection('Enrollment Wizard', 'Emergency Contact Info', existingFields);
    expect(firstFieldId).toBe('ECI-1');

    const newField = {
      id: firstFieldId,
      type: 'Text' as const,
      label: 'Secondary Emergency Contact Name',
      required: true,
      visible: true,
      section: 'Emergency Contact Info',
    };

    const secondFieldId = getNextIdForSection('Enrollment Wizard', 'Emergency Contact Info', [...existingFields, newField]);
    expect(secondFieldId).toBe('ECI-2');

    const newField2 = {
      id: secondFieldId,
      type: 'Text' as const,
      label: 'Secondary Emergency Contact Phone',
      required: true,
      visible: true,
      section: 'Emergency Contact Info',
    };

    // 4. Save updated Enrollment Wizard configuration with custom info type
    const updatedCustomSections = ['Emergency Contact Info'];
    await saveFormConfig('Enrollment Wizard', {
      fields: [...existingFields, newField, newField2],
      customSections: updatedCustomSections,
      deletedSections: [],
      history: [],
      isDefault: false,
    });

    // 5. Verify getFormConfig reflects the new info type and its fields
    const { data: savedConfig } = await getFormConfig('Enrollment Wizard');
    expect(savedConfig.customSections).toContain('Emergency Contact Info');
    expect(savedConfig.fields.some((f: any) => f.id === 'ECI-1' && f.section === 'Emergency Contact Info')).toBe(true);
    expect(savedConfig.fields.some((f: any) => f.id === 'ECI-2' && f.section === 'Emergency Contact Info')).toBe(true);

    // 6. Verify step computation for StudentEnrollmentWizard
    const baseSteps = ['Student Info', 'Parent Info', 'Medical Info'];
    const activeBaseSteps = baseSteps.filter((s) => !savedConfig.deletedSections?.includes(s));
    const activeCustomSections = (savedConfig.customSections || []).filter(
      (s: string) => !savedConfig.deletedSections?.includes(s)
    );
    const activeInfoTypes = [...activeBaseSteps, ...activeCustomSections];
    const wizardSteps = [...activeInfoTypes, 'Assign Therapist', 'Review'];

    expect(wizardSteps).toEqual([
      'Student Info',
      'Parent Info',
      'Medical Info',
      'Emergency Contact Info',
      'Assign Therapist',
      'Review',
    ]);

    // Clean up
    await resetFormToDefault('Enrollment Wizard');
  });

  it('ensures each info type on Enrollment Wizard displays strictly its own fields without bringing fields from other sections (e.g. Current Status)', async () => {
    // 1. Fetch default Enrollment Wizard configuration
    const { data: initialConfig } = await getFormConfig('Enrollment Wizard');
    const existingFields = initialConfig?.fields || [];

    // 2. Add a new Info Type called "Current Status" and add a single field to it
    const currentStatusFieldId = getNextIdForSection('Enrollment Wizard', 'Current Status', existingFields);
    expect(currentStatusFieldId).toBe('CS-1');

    const newFieldCurrentStatus = {
      id: currentStatusFieldId,
      type: 'Text' as const,
      label: 'Current Classroom Placement',
      required: true,
      visible: true,
      section: 'Current Status',
    };

    // Save with new section "Current Status"
    await saveFormConfig('Enrollment Wizard', {
      fields: [...existingFields, newFieldCurrentStatus],
      customSections: ['Current Status'],
      deletedSections: [],
      history: [],
      isDefault: false,
    });

    const { data: updatedConfig } = await getFormConfig('Enrollment Wizard');
    const allFields = updatedConfig.fields;

    // Helper implementing the DynamicFormFields section filtering logic
    const filterForSection = (targetSection: string, fieldsToFilter: any[], excludeLabels: string[] = []) => {
      return fieldsToFilter.filter((f) => {
        if (excludeLabels.some((l) => l.toLowerCase() === f.label.toLowerCase())) {
          return false;
        }
        if (targetSection) {
          if (f.section) {
            return f.section.toLowerCase().trim() === targetSection.toLowerCase().trim();
          }
          const normLabel = f.label.toLowerCase();
          const normSec = targetSection.toLowerCase().trim();
          if (normSec === 'parent info' || normSec === 'parent') {
            return (
              normLabel.includes('parent') ||
              normLabel.includes('guardian') ||
              normLabel.includes('mother') ||
              normLabel.includes('father') ||
              normLabel.includes('emergency') ||
              normLabel.includes('family') ||
              normLabel.includes('contact')
            );
          }
          if (normSec === 'medical info' || normSec === 'medical') {
            return (
              normLabel.includes('medical') ||
              normLabel.includes('allerg') ||
              normLabel.includes('doctor') ||
              normLabel.includes('health') ||
              normLabel.includes('insurance') ||
              normLabel.includes('medication') ||
              normLabel.includes('hospital') ||
              normLabel.includes('physician') ||
              normLabel.includes('diet')
            );
          }
          if (normSec === 'student info' || normSec === 'student') {
            const isParent =
              normLabel.includes('parent') ||
              normLabel.includes('guardian') ||
              normLabel.includes('mother') ||
              normLabel.includes('father') ||
              normLabel.includes('emergency') ||
              normLabel.includes('family') ||
              normLabel.includes('contact');
            const isMed =
              normLabel.includes('medical') ||
              normLabel.includes('allerg') ||
              normLabel.includes('doctor') ||
              normLabel.includes('health') ||
              normLabel.includes('insurance') ||
              normLabel.includes('medication') ||
              normLabel.includes('hospital') ||
              normLabel.includes('physician') ||
              normLabel.includes('diet');
            return !isParent && !isMed;
          }
          return false;
        }
        return true;
      });
    };

    // 3. Verify that "Current Status" ONLY has the new field and NONE of the student or parent or medical fields
    const currentStatusFields = filterForSection('Current Status', allFields);
    expect(currentStatusFields).toHaveLength(1);
    expect(currentStatusFields[0].id).toBe('CS-1');
    expect(currentStatusFields[0].label).toBe('Current Classroom Placement');
    expect(currentStatusFields[0].section).toBe('Current Status');

    // Verify it doesn't contain Student Info fields like Full Name, Date of Birth, Transportation, etc.
    const currentStatusLabels = currentStatusFields.map((f) => f.label);
    expect(currentStatusLabels).not.toContain('Full Name');
    expect(currentStatusLabels).not.toContain('Date of Birth');
    expect(currentStatusLabels).not.toContain('Transportation Required');
    expect(currentStatusLabels).not.toContain('Parent / Guardian Name');
    expect(currentStatusLabels).not.toContain('Medical Notes & Allergies');

    // 4. Verify that "Student Info" does not include "Current Classroom Placement"
    const studentInfoFields = filterForSection('Student Info', allFields);
    const studentInfoLabels = studentInfoFields.map((f) => f.label);
    expect(studentInfoLabels).not.toContain('Current Classroom Placement');

    // Clean up
    await resetFormToDefault('Enrollment Wizard');
  });

  it('restricts FIELD_TYPES to strictly Text, Number, Date, Dropdown, Radio, File and persists input specifications', async () => {
    // 1. Verify FIELD_TYPES contains only the 6 required types
    expect(FIELD_TYPES).toEqual(['Text', 'Number', 'Date', 'Dropdown', 'Radio', 'File']);
    expect(FIELD_TYPES).not.toContain('Checkbox');
    expect(FIELD_TYPES).not.toContain('TextArea');

    // 2. Verify creating fields of each type with input specifications (options for Dropdown/Radio, placeholder for Number/Date/File/Text)
    const { data: initialConfig } = await getFormConfig('Behavioral Assessment');
    const testFields = [
      {
        id: 'TST-1',
        type: 'Number',
        label: 'Trial Count',
        required: true,
        visible: true,
        placeholder: 'Count of trials (1-50)',
      },
      {
        id: 'TST-2',
        type: 'Date',
        label: 'Evaluation Date',
        required: true,
        visible: true,
        placeholder: 'YYYY-MM-DD',
      },
      {
        id: 'TST-3',
        type: 'Dropdown',
        label: 'Intervention Strategy',
        required: false,
        visible: true,
        options: ['Redirection', 'Prompting', 'Extinction'],
      },
      {
        id: 'TST-4',
        type: 'Radio',
        label: 'Goal Met',
        required: true,
        visible: true,
        options: ['Yes', 'No', 'Partial'],
      },
      {
        id: 'TST-5',
        type: 'File',
        label: 'IEP Document',
        required: false,
        visible: true,
        placeholder: 'PDF Assessment File',
      },
      {
        id: 'TST-6',
        type: 'Text',
        label: 'Behavior Notes',
        required: false,
        visible: true,
        placeholder: 'Enter clinical observations...',
      },
    ];

    await saveFormConfig('Behavioral Assessment', {
      fields: [...initialConfig.fields, ...testFields],
      isDefault: false,
    });

    const { data: updatedConfig } = await getFormConfig('Behavioral Assessment');
    const numberField = updatedConfig.fields.find((f: any) => f.id === 'TST-1');
    expect(numberField).toBeDefined();
    expect(numberField.type).toBe('Number');
    expect(numberField.placeholder).toBe('Count of trials (1-50)');

    const dateField = updatedConfig.fields.find((f: any) => f.id === 'TST-2');
    expect(dateField).toBeDefined();
    expect(dateField.type).toBe('Date');
    expect(dateField.placeholder).toBe('YYYY-MM-DD');

    const dropdownField = updatedConfig.fields.find((f: any) => f.id === 'TST-3');
    expect(dropdownField).toBeDefined();
    expect(dropdownField.options).toEqual(['Redirection', 'Prompting', 'Extinction']);

    const radioField = updatedConfig.fields.find((f: any) => f.id === 'TST-4');
    expect(radioField).toBeDefined();
    expect(radioField.options).toEqual(['Yes', 'No', 'Partial']);

    const fileField = updatedConfig.fields.find((f: any) => f.id === 'TST-5');
    expect(fileField).toBeDefined();
    expect(fileField.placeholder).toBe('PDF Assessment File');

    // Reset to default
    await resetFormToDefault('Behavioral Assessment');
  });
});
