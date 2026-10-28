import { describe, it, expect, beforeEach } from 'vitest';
import {
  isStudentAssignedToTherapist,
  assignStudentToTherapist,
  getTherapistAssignedStudents,
  THERAPIST_ASSIGNMENTS_STORAGE_KEY,
  ENROLLED_STUDENTS_CACHE_KEY,
} from '../../utils/therapistAssignmentHelper';
import { storage } from '../../utils/storage';

describe('Therapist Assignment & Student Differentiation', () => {
  beforeEach(() => {
    storage.setJSONSync(THERAPIST_ASSIGNMENTS_STORAGE_KEY, {});
    storage.setJSONSync(ENROLLED_STUDENTS_CACHE_KEY, []);
  });

  it('correctly associates student with therapist via persistent storage', () => {
    assignStudentToTherapist('Abeba Tadesse', 'Bereket Hailu', 't-1');
    assignStudentToTherapist('Abeba Tadesse', 'stu-1001', 't-1');

    const abebaStudents = getTherapistAssignedStudents('Abeba Tadesse');
    expect(abebaStudents).toContain('Bereket Hailu');
    expect(abebaStudents).toContain('stu-1001');

    const dawitStudents = getTherapistAssignedStudents('Dawit Bekele');
    expect(dawitStudents).not.toContain('Bereket Hailu');

    // Matching via isStudentAssignedToTherapist
    const studentObj = { id: 'stu-1001', name: 'Bereket Hailu' };
    expect(isStudentAssignedToTherapist(studentObj, { name: 'Abeba Tadesse', id: 't-1' })).toBe(true);
    expect(isStudentAssignedToTherapist(studentObj, { name: 'Dawit Bekele', id: 't-2' })).toBe(false);
  });

  it('matches student via explicit therapist field on student record', () => {
    const studentA = { id: 'stu-1', name: 'Natnael Assefa', therapist: 'Abeba Tadesse' };
    const studentB = { id: 'stu-2', name: 'Hiwot Tadesse', therapist: 'Dawit Bekele' };

    expect(isStudentAssignedToTherapist(studentA, { name: 'Abeba Tadesse' })).toBe(true);
    expect(isStudentAssignedToTherapist(studentA, { name: 'Dawit Bekele' })).toBe(false);

    expect(isStudentAssignedToTherapist(studentB, { name: 'Dawit Bekele' })).toBe(true);
    expect(isStudentAssignedToTherapist(studentB, { name: 'Abeba Tadesse' })).toBe(false);
  });

  it('matches student via enrolled students cache', () => {
    storage.setJSONSync(ENROLLED_STUDENTS_CACHE_KEY, [
      { id: 'stu-505', fullName: 'Sara Yohannes', therapist: 'Hiwot Solomon' },
    ]);

    const student = { id: 'stu-505', name: 'Sara Yohannes', therapist: 'Lead Teacher' };

    // Sara is assigned to Hiwot Solomon in cache, not to Abeba
    expect(isStudentAssignedToTherapist(student, { name: 'Hiwot Solomon' })).toBe(true);
    expect(isStudentAssignedToTherapist(student, { name: 'Abeba Tadesse' })).toBe(false);
  });

  it('filters students list strictly to logged in teacher on Assessment Dashboard and Teacher Dashboard', () => {
    // 3 students in assessment phase
    const allStudentsInAssessment = [
      { id: 's-1', name: 'Student Abeba Assigned', therapist: 'Abeba Tadesse', ablls: { status: 'in_progress', progress: 50 } },
      { id: 's-2', name: 'Student Dawit Assigned', therapist: 'Dawit Bekele', ablls: { status: 'in_progress', progress: 20 } },
      { id: 's-3', name: 'Student Unassigned', therapist: 'Unassigned', ablls: { status: 'not_started', progress: 0 } },
    ];

    const abebaTeacher = { id: 't-1', name: 'Abeba Tadesse', userName: 'abeba.t' };
    const dawitTeacher = { id: 't-2', name: 'Dawit Bekele', userName: 'dawit.b' };

    const abebaFiltered = allStudentsInAssessment.filter((s) => isStudentAssignedToTherapist(s, abebaTeacher));
    expect(abebaFiltered.map((s) => s.id)).toEqual(['s-1']);

    const dawitFiltered = allStudentsInAssessment.filter((s) => isStudentAssignedToTherapist(s, dawitTeacher));
    expect(dawitFiltered.map((s) => s.id)).toEqual(['s-2']);
  });
});
