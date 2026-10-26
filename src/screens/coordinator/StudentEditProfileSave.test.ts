import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getStudentProfile,
  updateStudentProfile,
  getStoredEnrolledStudents,
  saveOrUpdateEnrolledStudentLocally,
} from '../../api/coordinatorApi';
import { storage } from '../../utils/storage';
import { saveEnrollmentDraft, getEnrollmentDraft } from '../../utils/enrollmentDraftHelper';

describe('StudentEditProfileSave - Persistent profile updates', () => {
  const studentId = 'stu-1792778146849';

  beforeEach(() => {
    storage.removeSync('melue_enrolled_students_cache');
    storage.removeSync('melue_enrollment_drafts_v1');
    storage.removeSync('melue_student_status_overrides_v1');
  });

  it('saves updates for a client-generated student ID like stu-1792778146849', async () => {
    // Seed an enrolled student locally with initial values
    saveOrUpdateEnrolledStudentLocally(studentId, {
      id: studentId,
      studentId,
      fullName: 'Initial Student',
      firstName: 'Initial',
      lastName: 'Student',
      dateOfBirth: '2019-05-15',
      age: 7,
      programType: 'Regular Morning',
      therapyGroup: 'Basic',
      therapist: 'Teacher One',
      status: 'in_assessment',
      guardianName: 'Initial Parent',
      guardianPhone: '555-0100',
      guardianEmail: 'parent@example.com',
      diagnosis: 'Autism Spectrum Disorder',
    });

    // Verify initial load
    const initialRes = await getStudentProfile(studentId);
    expect(initialRes.data.fullName).toBe('Initial Student');
    expect(initialRes.data.therapist).toBe('Teacher One');
    expect(initialRes.data.guardianName).toBe('Initial Parent');

    // Update the profile with changes
    const updatePayload = {
      firstName: 'Updated',
      lastName: 'Learner',
      fullName: 'Updated Learner',
      dateOfBirth: '2018-03-20',
      age: 8,
      programType: 'Pulled Out',
      program: 'Pulled Out',
      therapyGroup: 'Functional Living',
      status: 'Active',
      therapist: 'Teacher Two',
      assignedTherapist: 'Teacher Two',
      guardianName: 'Updated Guardian',
      guardianPhone: '555-9999',
      guardianEmail: 'updated@example.com',
      diagnosis: 'ADHD and Speech Delay',
      medicalNotes: 'Nut allergy',
      transportation: 'Yes',
      custom_fields: {
        f_favorite_reinforcer: 'Bubbles',
      },
    };

    const updateRes = await updateStudentProfile(studentId, updatePayload);
    expect(updateRes.data.fullName).toBe('Updated Learner');

    // Re-fetch student profile: all updated attributes must persist
    const refetched = await getStudentProfile(studentId);
    expect(refetched.data.fullName).toBe('Updated Learner');
    expect(refetched.data.firstName).toBe('Updated');
    expect(refetched.data.lastName).toBe('Learner');
    expect(refetched.data.dateOfBirth).toBe('2018-03-20');
    expect(refetched.data.therapist).toBe('Teacher Two');
    expect(refetched.data.programType).toBe('Pulled Out');
    expect(refetched.data.therapyGroup).toBe('Functional Living');
    expect(refetched.data.status).toBe('Active');
    expect(refetched.data.guardianName).toBe('Updated Guardian');
    expect(refetched.data.guardianPhone).toBe('555-9999');
    expect(refetched.data.guardianEmail).toBe('updated@example.com');
    expect(refetched.data.diagnosis).toBe('ADHD and Speech Delay');
    expect(refetched.data.medicalNotes).toBe('Nut allergy');
    expect(refetched.data.transportation).toBe('Yes');
    expect(refetched.data.customFields.f_favorite_reinforcer).toBe('Bubbles');
  });

  it('updates draft form values if student is currently a draft', async () => {
    saveEnrollmentDraft(
      {
        enr_first_name: 'DraftChild',
        enr_last_name: 'Test',
        f1: 'DraftChild Test',
        f_therapist: 'Teacher One',
      },
      1,
      studentId,
    );

    const draftBefore = getEnrollmentDraft(studentId);
    expect(draftBefore?.fullName).toBe('DraftChild Test');

    await updateStudentProfile(studentId, {
      firstName: 'EditedDraft',
      lastName: 'Success',
      fullName: 'EditedDraft Success',
      therapist: 'Teacher Two',
    });

    const draftAfter = getEnrollmentDraft(studentId);
    expect(draftAfter?.fullName).toBe('EditedDraft Success');
    expect(draftAfter?.therapist).toBe('Teacher Two');
  });

  it('dispatches melue_student_profile_updated event on update', async () => {
    const handler = vi.fn();
    const eventTarget =
      typeof window !== 'undefined'
        ? window
        : (globalThis as any).window || ((globalThis as any).window = new EventTarget());

    eventTarget.addEventListener('melue_student_profile_updated', handler);

    await updateStudentProfile(studentId, {
      fullName: 'Event Test Student',
      therapist: 'Teacher Two',
    });

    expect(handler).toHaveBeenCalled();
    eventTarget.removeEventListener('melue_student_profile_updated', handler);
  });
});
