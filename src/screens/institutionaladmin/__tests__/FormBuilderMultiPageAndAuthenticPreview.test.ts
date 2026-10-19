import { describe, it, expect, vi } from 'vitest';
import {
  getPagesForForm,
  getSectionsForForm,
  FORM_METADATA,
  ENROLLMENT_SECTIONS,
  IUP_SECTIONS,
  ABLLS_SECTIONS,
  BEHAVIORAL_SECTIONS,
  SENSORY_SECTIONS,
  PREFERENCE_SECTIONS,
  SOCIAL_SKILLS_SECTIONS,
  BEHAVIOR_INCIDENT_SECTIONS,
} from '../formBuilderConfig';
import { PreviewFormModal } from '../components/PreviewFormModal';
import { DEFAULT_ENROLLMENT_FORM } from '../../../api/institutionalAdminApi';

describe('Form Builder Multi-Page Navigation and Authentic Preview', () => {
  describe('Multi-Page Detection & Classification', () => {
    it('classifies Enrollment Wizard with 6 canonical pages by default', () => {
      const pages = getPagesForForm('Enrollment Wizard');
      expect(pages).toEqual([
        'Student Info',
        'Parent Info',
        'Medical Info',
        'Program Placement',
        'Assign Therapist',
        'Review & Complete',
      ]);
      expect(pages.length).toBe(6);
    });

    it('dynamically inserts custom info types between Medical Info and Assign Therapist for Enrollment Wizard', () => {
      const pages = getPagesForForm('Enrollment Wizard', [
        'Emergency Contact Info',
        'Insurance & Billing',
      ]);
      expect(pages).toEqual([
        'Student Info',
        'Parent Info',
        'Medical Info',
        'Program Placement',
        'Emergency Contact Info',
        'Insurance & Billing',
        'Assign Therapist',
        'Review & Complete',
      ]);
      expect(pages.length).toBe(8);
    });

    it('excludes deleted sections from Enrollment Wizard pages', () => {
      const pages = getPagesForForm('Enrollment Wizard', [], ['Program Placement']);
      expect(pages).toEqual([
        'Student Info',
        'Parent Info',
        'Medical Info',
        'Assign Therapist',
        'Review & Complete',
      ]);
      expect(pages.length).toBe(5);
    });

    it('computes pages correctly for all clinical forms', () => {
      // IUP Form
      const iupPages = getPagesForForm('IUP Form');
      expect(iupPages).toEqual(IUP_SECTIONS);
      expect(iupPages.length).toBe(4);

      // ABLLS Assessment Form
      const abllsPages = getPagesForForm('ABLLS Assessment Form');
      expect(abllsPages).toEqual(ABLLS_SECTIONS);
      expect(abllsPages.length).toBe(10);

      // Behavioral Assessment
      const behPages = getPagesForForm('Behavioral Assessment');
      expect(behPages).toEqual(BEHAVIORAL_SECTIONS);
      expect(behPages.length).toBe(5);

      // Sensory Assessment
      const senPages = getPagesForForm('Sensory Assessment');
      expect(senPages).toEqual(SENSORY_SECTIONS);
      expect(senPages.length).toBe(4);

      // Preference Assessment
      const prefPages = getPagesForForm('Preference Assessment');
      expect(prefPages).toEqual(PREFERENCE_SECTIONS);
      expect(prefPages.length).toBe(6);

      // Social Skills Questionnaire
      const socPages = getPagesForForm('Social Skills Questionnaire');
      expect(socPages).toEqual(SOCIAL_SKILLS_SECTIONS);
      expect(socPages.length).toBe(4);

      // Behavior Incident Form
      const incPages = getPagesForForm('Behavior Incident Form');
      expect(incPages).toEqual(BEHAVIOR_INCIDENT_SECTIONS);
      expect(incPages.length).toBe(2);
    });

    it('verifies FORM_METADATA specifies accurate multi-page default counts for all forms', () => {
      expect(FORM_METADATA['Enrollment Wizard'].pages).toBe('Page 1 of 6');
      expect(FORM_METADATA['IUP Form'].pages).toBe('Page 1 of 4');
      expect(FORM_METADATA['ABLLS Assessment Form'].pages).toBe('Page 1 of 10');
      expect(FORM_METADATA['Behavioral Assessment'].pages).toBe('Page 1 of 5');
      expect(FORM_METADATA['Preference Assessment'].pages).toBe('Page 1 of 6');
      expect(FORM_METADATA['Sensory Assessment'].pages).toBe('Page 1 of 4');
      expect(FORM_METADATA['Social Skills Questionnaire'].pages).toBe('Page 1 of 4');
      expect(FORM_METADATA['Behavior Incident Form'].pages).toBe('Page 1 of 2');
    });

    it('ensures getSectionsForForm supports IUP Form and returns canonical IUP sections', () => {
      const sections = getSectionsForForm('IUP Form');
      expect(sections).toEqual([
        'Student & Assessment Summary',
        'Reinforcement & Behavioral Strategies',
        'Target Goals & Milestones',
        'Review & Approvals',
      ]);
    });
  });

  describe('PreviewFormModal Component Export & Behavior', () => {
    it('exports PreviewFormModal as a valid React component', () => {
      expect(PreviewFormModal).toBeDefined();
      expect(typeof PreviewFormModal).toBe('object'); // React.memo component
    });

    it('ensures DEFAULT_ENROLLMENT_FORM contains required student, parent, medical, and placement fields', () => {
      const ids = DEFAULT_ENROLLMENT_FORM.fields.map((f: any) => f.id);
      expect(ids).toContain('f_photo');
      expect(ids).toContain('f1'); // Full Name
      expect(ids).toContain('f2'); // DOB
      expect(ids).toContain('f_gender');
      expect(ids).toContain('f_program');
      expect(ids).toContain('f_therapy');
      expect(ids).toContain('f4'); // Parent Name
      expect(ids).toContain('f5'); // Phone
      expect(ids).toContain('f_diagnosis');
    });
  });
});
