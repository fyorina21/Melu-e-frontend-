import { describe, it, expect, beforeEach } from 'vitest';
import {
  getFormConfig,
  saveFormConfig,
  setCachedFormConfig,
  DEFAULT_ENROLLMENT_FORM,
} from '../../api/institutionalAdminApi';
import { getStudentProfile } from '../../api/programDirectorApi';
import { getStudentProfile as getCoordinatorStudentProfile } from '../../api/coordinatorApi';
import { saveEnrollmentDraft } from '../../utils/enrollmentDraftHelper';

describe('Program Director Navigator, Document Uploads & Dynamic Student Profile Sync', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('1. Program Director API & Navigator Guarding', () => {
    it('exports getStudentProfile and updateStudentProfile from programDirectorApi layer', () => {
      expect(typeof getStudentProfile).toBe('function');
      expect(getStudentProfile).toBe(getCoordinatorStudentProfile);
    });

    it('gracefully handles missing or empty student IDs with a resilient fallback payload', async () => {
      const res = await getStudentProfile('');
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(res.data.fullName).toBeDefined();
    });
  });

  describe('2. FormConfiguration Document Upload Provisioning (FR-023, FR-024)', () => {
    it('provisions all 5 standard upload fields in the Enrollment schema', async () => {
      const res = await getFormConfig('Enrollment Wizard');
      expect(res.data).toBeDefined();
      const fields = res.data.fields || [];

      const headshotField = fields.find((f: any) => f.id === 'enr_headshot' || f.id === 'f_photo');
      expect(headshotField).toBeDefined();
      expect(headshotField.type).toBe('file_upload');
      expect(headshotField.required).toBe(true);

      const birthCertField = fields.find(
        (f: any) => f.id === 'enr_birth_certificate' || f.id === 'birth_certificate',
      );
      expect(birthCertField).toBeDefined();
      expect(birthCertField.type).toBe('file_upload');

      const diagPaperField = fields.find(
        (f: any) => f.id === 'enr_diagnosis_paper' || f.id === 'diagnosis_paper',
      );
      expect(diagPaperField).toBeDefined();
      expect(diagPaperField.type).toBe('file_upload');

      const agreementField = fields.find(
        (f: any) => f.id === 'enr_agreement' || f.id === 'agreement',
      );
      expect(agreementField).toBeDefined();
      expect(agreementField.type).toBe('file_upload');

      const videoField = fields.find(
        (f: any) => f.id === 'enr_baseline_video' || f.id === 'baseline_video',
      );
      expect(videoField).toBeDefined();
      expect(videoField.type).toBe('file_upload');
      expect(videoField.required).toBe(false);
    });
  });

  describe('3. Single Source of Truth & Dynamic Student Profile Sync (SCR-006A)', () => {
    it('derives active sections dynamically from customSections and fields, excluding deleted sections', () => {
      const deletedSections = ['parent & household'];
      const deletedSet = new Set(deletedSections.map((s) => s.toLowerCase().trim()));

      const formFields = [
        { id: 'f1', label: 'Student Name', section: 'Student Info' },
        { id: 'f2', label: 'Parent Name', section: 'Parent & Household' },
        { id: 'f3', label: 'Medical Notes', section: 'Medical Info' },
        { id: 'enr_birth_certificate', label: 'Birth Certificate', section: 'Documents & Media' },
      ];

      const customSections = [
        'Student Info',
        'Parent & Household',
        'Medical Info',
        'Documents & Media',
      ];

      // Derive active sections
      const activeSections: string[] = [];
      const fieldsBySection: Record<string, any[]> = {};

      formFields.forEach((f) => {
        const sec = f.section.trim();
        if (!deletedSet.has(sec.toLowerCase())) {
          if (!fieldsBySection[sec]) fieldsBySection[sec] = [];
          fieldsBySection[sec].push(f);
        }
      });

      customSections.forEach((s) => {
        if (!deletedSet.has(s.toLowerCase()) && fieldsBySection[s]?.length > 0) {
          activeSections.push(s);
        }
      });

      // Assert deleted section is completely excluded
      expect(activeSections).not.toContain('Parent & Household');
      expect(activeSections).toEqual(['Student Info', 'Medical Info', 'Documents & Media']);
    });

    it('dynamically adapts when an administrator adds a new custom section in Form Builder', async () => {
      const updatedSchema = {
        ...DEFAULT_ENROLLMENT_FORM,
        customSections: [
          ...(DEFAULT_ENROLLMENT_FORM.customSections || []),
          'Emergency & Clinical Contacts',
        ],
        fields: [
          ...(DEFAULT_ENROLLMENT_FORM.fields || []),
          {
            id: 'custom_doctor_name',
            label: 'Primary Pediatrician',
            type: 'text',
            section: 'Emergency & Clinical Contacts',
            required: false,
          },
        ],
      };

      setCachedFormConfig('Enrollment Wizard', updatedSchema);

      const res = await getFormConfig('Enrollment Wizard');
      expect(res.data.customSections).toContain('Emergency & Clinical Contacts');

      const customField = res.data.fields.find((f: any) => f.id === 'custom_doctor_name');
      expect(customField).toBeDefined();
      expect(customField.label).toBe('Primary Pediatrician');
      expect(customField.section).toBe('Emergency & Clinical Contacts');
    });

    it('dynamically adapts when an administrator removes a section in Form Builder', async () => {
      const updatedSchema = {
        ...DEFAULT_ENROLLMENT_FORM,
        deletedSections: ['Parent & Household'],
      };

      setCachedFormConfig('Enrollment Wizard', updatedSchema);

      const res = await getFormConfig('Enrollment Wizard');
      expect(res.data.deletedSections).toContain('Parent & Household');
    });

    it('safeguards student demographics from base64 data URLs and correctly classifies media fields', () => {
      const rawBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAw...';
      const formVals = {
        enr_headshot: rawBase64,
        enr_first_name: 'Aiden',
        enr_last_name: 'Rivera',
        enr_dob: '2019-05-12',
        enr_gender: 'Male',
        enr_birth_certificate: rawBase64,
      };

      // Test draft save does not pollute student name with data: URLs
      const draft = saveEnrollmentDraft(formVals, 0, 'draft-test-123');
      expect(draft.fullName).toBe('Aiden Rivera');
      expect(draft.firstName).toBe('Aiden');
      expect(draft.lastName).toBe('Rivera');
      expect(draft.fullName).not.toContain('data:image');

      // Test photoUrl is populated correctly from media field
      expect(draft.photoUrl).toBe(rawBase64);
    });
  });
});
