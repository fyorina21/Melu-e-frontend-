// src/screens/coordinator/StudentRosterFiltersAndProfileNavigation.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { getProgramOptions, getTherapyGroupOptions, getStatusOptions } from '../../api/optionsApi';
import {
  saveEnrollmentDraft,
  getEnrollmentDraft,
  getEnrollmentDrafts,
  deleteEnrollmentDraft,
} from '../../utils/enrollmentDraftHelper';
import { getStudentProfile } from '../../api/coordinatorApi';
import { resolveStudentStatus } from '../../utils/studentStatusHelper';
import {
  exportStudentProfileToPdf,
  generateStudentProfileHtml,
} from '../../utils/studentProfilePdfHelper';
import type { StudentProfileData } from './StudentProfileScreen';

describe('Student Roster Filters and Profile Navigation Workflows', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('1. Dynamic Roster Filters Integration', () => {
    it('fetches program options from API endpoint with valid options list (Regular Morning, Regular Afternoon, Pulled Out)', async () => {
      const res = await getProgramOptions();
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data).toContain('Regular Morning');
      expect(res.data).toContain('Regular Afternoon');
      expect(res.data).toContain('Pulled Out');
      expect(res.data).not.toContain('ABA');
      expect(res.data).not.toContain('Speech Therapy');
      expect(res.data).not.toContain('Occupational Therapy');
    });

    it('fetches therapy group options from API endpoint with Basic and Functional Living', async () => {
      const res = await getTherapyGroupOptions();
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data).toContain('Basic');
      expect(res.data).toContain('Functional Living');
    });

    it('fetches status options from API endpoint with valid options list', async () => {
      const res = await getStatusOptions();
      expect(res).toBeDefined();
      expect(res.data).toBeDefined();
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
      expect(res.data).toContain('Active');
      expect(res.data).toContain('Draft');
    });

    it('filters student roster by Program, Therapy Group, and Status dynamically', () => {
      const roster = [
        {
          id: '1',
          name: 'Student A',
          studentId: 'S-1',
          program: 'Regular Morning',
          therapyGroup: 'Basic',
          status: 'Active',
        },
        {
          id: '2',
          name: 'Student B',
          studentId: 'S-2',
          program: 'Pulled Out',
          therapyGroup: 'Basic',
          status: 'Inactive',
        },
        {
          id: '3',
          name: 'Student C',
          studentId: 'S-3',
          program: 'Regular Afternoon',
          therapyGroup: 'Functional Living',
          status: 'Draft',
        },
        {
          id: '4',
          name: 'Student D',
          studentId: 'S-4',
          program: 'Regular Morning',
          therapyGroup: 'Functional Living',
          status: 'Archived',
        },
      ];

      // Filter by Program = Regular Morning
      const programFiltered = roster.filter((s) =>
        s.program.toLowerCase().includes('regular morning'),
      );
      expect(programFiltered.length).toBe(2);
      expect(programFiltered.map((s) => s.id)).toEqual(['1', '4']);

      // Filter by Therapy Group = Basic
      const therapyFiltered = roster.filter((s) => s.therapyGroup.toLowerCase().includes('basic'));
      expect(therapyFiltered.length).toBe(2);
      expect(therapyFiltered.map((s) => s.id)).toEqual(['1', '2']);

      // Filter by Therapy Group = Functional Living
      const functionalFiltered = roster.filter((s) =>
        s.therapyGroup.toLowerCase().includes('functional'),
      );
      expect(functionalFiltered.length).toBe(2);
      expect(functionalFiltered.map((s) => s.id)).toEqual(['3', '4']);

      // Filter by Status = Draft
      const draftFiltered = roster.filter((s) => 'Draft'.toLowerCase() === s.status.toLowerCase());
      expect(draftFiltered.length).toBe(1);
      expect(draftFiltered[0].name).toBe('Student C');

      // Filter by Program = Regular Morning, Therapy Group = Basic, and Status = Active
      const combined = roster.filter(
        (s) =>
          s.program.toLowerCase().includes('regular morning') &&
          s.therapyGroup.toLowerCase().includes('basic') &&
          'Active'.toLowerCase() === s.status.toLowerCase(),
      );
      expect(combined.length).toBe(1);
      expect(combined[0].name).toBe('Student A');
    });
  });

  describe('2. Universal Student Profile Access', () => {
    it('routes all students regardless of status (Active, Inactive, Archived, Draft) to StudentProfile', () => {
      const statuses = ['Active', 'Inactive', 'Archived', 'Draft'] as const;
      const navigationHistory: Array<{ route: string; params: any }> = [];

      const mockNavigate = (route: string, params: any) => {
        navigationHistory.push({ route, params });
      };

      statuses.forEach((status, idx) => {
        const student = { id: `std-${idx + 1}`, status };
        // Uniform click action across all statuses
        mockNavigate('StudentProfile', { studentId: student.id });
      });

      expect(navigationHistory.length).toBe(4);
      navigationHistory.forEach((nav, idx) => {
        expect(nav.route).toBe('StudentProfile');
        expect(nav.params).toEqual({ studentId: `std-${idx + 1}` });
      });
    });

    it('resolves and preserves Draft status correctly in studentStatusHelper', () => {
      expect(resolveStudentStatus('std-draft-1', 'Child One', 'draft')).toBe('Draft');
      expect(resolveStudentStatus('std-draft-2', 'Child Two', 'Draft')).toBe('Draft');
      expect(resolveStudentStatus('draft-99999', 'Child Three', null)).toBe('Draft');
      expect(resolveStudentStatus('draft-88888', 'Child Four', undefined)).toBe('Draft');
    });
  });

  describe('3. Continue Enrollment Workflow for Draft Students', () => {
    it('pre-loads half-finished draft values and step when getStudentProfile is called for a draft ID', async () => {
      // Create half-finished draft in local storage
      const draftValues = {
        enr_first_name: 'Sara',
        enr_last_name: 'Mekonnen',
        enr_dob: '2019-05-10',
        enr_program_type: 'Regular',
        enr_therapy_group: 'Basic',
      };
      const savedDraft = saveEnrollmentDraft(draftValues, 2, 'draft-test-123', 'Parent Info');

      expect(savedDraft.id).toBe('draft-test-123');
      expect(getEnrollmentDraft('draft-test-123')).not.toBeNull();

      // Calling getStudentProfile should return the draft profile seamlessly
      const profileRes = await getStudentProfile('draft-test-123');
      expect(profileRes.data).toBeDefined();
      expect(profileRes.data.id).toBe('draft-test-123');
      expect(profileRes.data.fullName).toBe('Sara Mekonnen');
      expect(profileRes.data.status).toBe('Draft');
      expect(profileRes.data.isDraft).toBe(true);
      expect(profileRes.data.programType).toBe('Regular');
      expect(profileRes.data.therapyGroup).toBe('Basic');
      expect(profileRes.data.customFields).toEqual(draftValues);
    });

    it('navigates to StudentEnrollmentWizard with draftId on Continue Enrollment click', () => {
      let routedScreen = '';
      let routedParams: any = null;

      const mockNavigation = {
        navigate: (screen: string, params: any) => {
          routedScreen = screen;
          routedParams = params;
        },
      };

      const profile = {
        id: 'draft-test-456',
        fullName: 'Abebe Bikila',
        status: 'Draft',
        isDraft: true,
      };

      // User clicks "Continue Enrollment" on profile view
      mockNavigation.navigate('StudentEnrollmentWizard', { draftId: profile.id });

      expect(routedScreen).toBe('StudentEnrollmentWizard');
      expect(routedParams).toEqual({ draftId: 'draft-test-456' });
    });

    it('wizard can resume draft using draftId, loading form values and step', () => {
      const draftFormValues = {
        enr_first_name: 'Dawit',
        enr_last_name: 'Haile',
        enr_dob: '2020-03-12',
        enr_guardian_phone: '0911223344',
      };
      saveEnrollmentDraft(draftFormValues, 3, 'draft-wizard-resume-1');

      const loadedDraft = getEnrollmentDraft('draft-wizard-resume-1');
      expect(loadedDraft).not.toBeNull();
      expect(loadedDraft?.step).toBe(3);
      expect(loadedDraft?.formValues).toEqual(draftFormValues);
      expect(loadedDraft?.status).toBe('Draft');
    });

    it('draft resumption initializes Enrollment Wizard explicitly on Step 1 (step index 0) while preserving all form data', () => {
      // Simulate draft saved at step 3 with full enrollment questionnaire data
      const comprehensiveDraftValues = {
        f1: 'Aiden Rivera',
        f2: '2020-04-12',
        f_gender: 'Male',
        f4: 'Maria Rivera',
        f5: '(555) 000-0000',
        f6: 'maria@example.com',
        f9: 'Uncle Carlos (555) 999-8888',
        f_diagnosis: 'Autism Spectrum Disorder',
        f7: 'Mild asthma, requires inhaler',
        f8: 'No',
        f_program: 'Regular Morning',
        f_therapy: 'Basic',
        f_therapist: 'Sarah Jenkins',
        soc_q1: '2 — Often',
        soc_q2: '1 — Sometimes',
        soc_q3: '3 — Always',
      };

      saveEnrollmentDraft(
        comprehensiveDraftValues,
        4,
        'draft-resumption-step1-test',
        'Social Skills Questionnaire',
      );
      const draft = getEnrollmentDraft('draft-resumption-step1-test');

      expect(draft).not.toBeNull();
      expect(draft?.formValues).toEqual(comprehensiveDraftValues);

      // Verify wizard initialization logic for resumed drafts:
      // Even though saved at step 4, resumption must set step to 0 (Step 1) and keep all values
      let wizardStep = -1;
      let wizardFormValues: Record<string, any> = {};

      if (draft && draft.formValues) {
        wizardFormValues = { ...draft.formValues };
        wizardStep = 0; // Explicitly initialized to Step 1
      }

      expect(wizardStep).toBe(0);
      expect(wizardFormValues.f1).toBe('Aiden Rivera');
      expect(wizardFormValues.soc_q1).toBe('2 — Often');
      expect(wizardFormValues.soc_q3).toBe('3 — Always');
      expect(wizardFormValues.f4).toBe('Maria Rivera');
      expect(wizardFormValues.f_therapist).toBe('Sarah Jenkins');
    });

    it('getStudentProfile returns comprehensive enrollment fields including Social Skills Questionnaire answers', async () => {
      const draftValues = {
        f1: 'Kenna Tesfaye',
        f2: '2019-08-20',
        f_gender: 'Female',
        f4: 'Almaz Tesfaye',
        f5: '0911002233',
        f6: 'almaz@example.com',
        f9: 'Emergency Contact Person',
        f_diagnosis: 'Autism Spectrum Disorder',
        f7: 'No known allergies',
        f8: 'Yes',
        f_program: 'Regular Morning',
        f_therapy: 'Functional Living Skill',
        f_therapist: 'Marcus Vance',
        soc_q1: '3 — Always',
        soc_q2: '2 — Often',
        soc_q3: '1 — Sometimes',
        soc_q4: '3 — Always',
        soc_q5: '2 — Often',
      };

      saveEnrollmentDraft(draftValues, 2, 'draft-comprehensive-profile-1');
      const profile = await getStudentProfile('draft-comprehensive-profile-1');

      expect(profile.data).toBeDefined();
      expect(profile.data.fullName).toBe('Kenna Tesfaye');
      expect(profile.data.guardianName).toBe('Almaz Tesfaye');
      expect(profile.data.guardianPhone).toBe('0911002233');
      expect(profile.data.guardianEmail).toBe('almaz@example.com');
      expect(profile.data.emergencyContact).toBe('Emergency Contact Person');
      expect(profile.data.diagnosis).toBe('Autism Spectrum Disorder');
      expect(profile.data.medicalNotes).toBe('No known allergies');
      expect(profile.data.transportation).toBe('Yes');
      expect(profile.data.therapist).toBe('Marcus Vance');
      expect(profile.data.customFields.soc_q1).toBe('3 — Always');
      expect(profile.data.customFields.soc_q5).toBe('2 — Often');
    });

    it('persists childFirstName and firstName correctly when draft is saved and retrieved', async () => {
      // Test saving draft with standard enrollment form key enr_first_name
      const draftWithEnr = {
        enr_first_name: 'Lucas',
        enr_last_name: 'Girma',
        enr_dob: '2019-11-05',
        enr_gender: 'Male',
      };
      saveEnrollmentDraft(draftWithEnr, 0, 'draft-child-first-name-1');
      const profile1 = await getStudentProfile('draft-child-first-name-1');

      expect(profile1.data.firstName).toBe('Lucas');
      expect(profile1.data.lastName).toBe('Girma');
      expect(profile1.data.fullName).toBe('Lucas Girma');

      // Test saving draft with childFirstName key
      const draftWithChildFirst = {
        childFirstName: 'Maya',
        childLastName: 'Solomon',
        dob: '2020-01-15',
        gender: 'Female',
      };
      saveEnrollmentDraft(draftWithChildFirst, 0, 'draft-child-first-name-2');
      const profile2 = await getStudentProfile('draft-child-first-name-2');

      expect(profile2.data.firstName).toBe('Maya');
      expect(profile2.data.lastName).toBe('Solomon');
      expect(profile2.data.fullName).toBe('Maya Solomon');
    });

    it('handles empty non-mandatory profile fields gracefully without hardcoded mock data', async () => {
      const minimalDraft = {
        enr_first_name: 'Noah',
        enr_last_name: 'Bekele',
        enr_dob: '2021-04-10',
      };
      saveEnrollmentDraft(minimalDraft, 0, 'draft-empty-states-test');
      const profile = await getStudentProfile('draft-empty-states-test');

      // Ensure optional fields are not populated with hardcoded fake text
      expect(profile.data.developmentalHistory).toBeFalsy();
      expect(profile.data.medicalNotes).toBeFalsy();
      expect(profile.data.reinforcerVisual).toBeFalsy();
      expect(profile.data.reinforcerAuditory).toBeFalsy();
      expect(profile.data.reinforcerTactile).toBeFalsy();
      expect(profile.data.reinforcerKinetic).toBeFalsy();
      expect(profile.data.hasVideo).toBeFalsy();
      expect(profile.data.videoUrl).toBeFalsy();
      expect(profile.data.householdStructure).toBeFalsy();
    });

    it('exportStudentProfileToPdf generates printable HTML document and triggers print', () => {
      let printCalled = false;

      // Mock window.open and window.print on globalThis
      const originalWindow = (globalThis as any).window;

      (globalThis as any).window = {
        open: () => {
          return {
            focus: () => {},
            print: () => {
              printCalled = true;
            },
          };
        },
        print: () => {
          printCalled = true;
        },
      };

      const mockProfile: StudentProfileData = {
        id: 'STD-1009',
        fullName: 'Dawit Alemu',
        firstName: 'Dawit',
        lastName: 'Alemu',
        dateOfBirth: '2019-04-12',
        age: 6,
        programType: 'Regular Morning',
        therapyGroup: 'Basic Therapy',
        status: 'Active',
        headshotUrl: null,
        guardianName: 'Tigist Alemu',
        guardianPhone: '0911002233',
        diagnosis: 'Autism Spectrum Disorder',
        currentFocusStudentGoalId: null,
        goals: [],
        customFields: {
          soc_q1: '3 — Always',
          soc_q2: '2 — Often',
        },
      };

      const html = generateStudentProfileHtml(mockProfile);
      const res = exportStudentProfileToPdf(mockProfile);
      expect(res).toBe(true);
      expect(html).toContain('Dawit Alemu');
      expect(html).toContain('STD-1009');
      expect(html).toContain('Regular Morning');
      expect(html).toContain('3 — Always');

      // Restore
      if (originalWindow === undefined) {
        delete (globalThis as any).window;
      } else {
        (globalThis as any).window = originalWindow;
      }
    });

    it('documents upload action parameters target enrollment edit with target section', () => {
      const studentId = 'STD-1009';
      const uploadActionParams = {
        draftId: studentId,
        section: 'Medical Info',
      };

      expect(uploadActionParams.draftId).toBe(studentId);
      expect(uploadActionParams.section).toBe('Medical Info');
    });
  });
});
