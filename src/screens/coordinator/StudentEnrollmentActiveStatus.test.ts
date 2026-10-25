// src/screens/coordinator/StudentEnrollmentActiveStatus.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveEnrolledStudentLocally,
  getEnrollmentStudents,
  getStoredEnrolledStudents,
  deleteStudentEnrollment,
  isStudentDeleted,
  markStudentDeleted,
} from '../../api/coordinatorApi';
import {
  markStudentActive,
  resolveStudentStatus,
  toggleStudentStatus,
  isStudentRegisteredActive,
} from '../../utils/studentStatusHelper';

describe('Student Enrollment Active Status Management', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('marks newly registered student as Active upon enrollment', () => {
    const studentId = 'stu-new-101';
    const studentName = 'Maya Lin';

    markStudentActive(studentId, studentName);

    expect(isStudentRegisteredActive(studentId, studentName)).toBe(true);
    expect(resolveStudentStatus(studentId, studentName, 'inactive')).toBe('Active');
    expect(resolveStudentStatus(studentId, studentName, null)).toBe('Active');
    expect(resolveStudentStatus(studentId, studentName, undefined)).toBe('Active');
  });

  it('resolves active status for standard active/enrolled raw API statuses', () => {
    expect(resolveStudentStatus('s-1', 'Alice', 'active')).toBe('Active');
    expect(resolveStudentStatus('s-2', 'Bob', 'enrolled')).toBe('Active');
    expect(resolveStudentStatus('s-3', 'Charlie', 'registered')).toBe('Active');
    expect(resolveStudentStatus('s-4', 'David', 'ready_for_iup')).toBe('Active');
    expect(resolveStudentStatus('s-5', 'Eva', 'new')).toBe('Active');
  });

  it('defaults newly enrolled/unspecified students on StudentEnrollment to Active', () => {
    expect(resolveStudentStatus('s-new-1', 'Leo Miller', null)).toBe('Active');
    expect(resolveStudentStatus('s-new-2', 'Samantha Wu', '')).toBe('Active');
  });

  it('preserves legacy demo inactive student as Inactive unless explicitly activated', () => {
    expect(resolveStudentStatus('stu-4', 'Liam Wilson', 'inactive')).toBe('Inactive');
    expect(resolveStudentStatus('MLU-0015', 'Liam Wilson', 'inactive')).toBe('Inactive');

    // If coordinator explicitly toggles or activates them
    markStudentActive('stu-4', 'Liam Wilson');
    expect(resolveStudentStatus('stu-4', 'Liam Wilson', 'inactive')).toBe('Active');
  });

  it('supports toggling student status between Active and Inactive', () => {
    const studentId = 'stu-toggle-1';
    const studentName = 'Test Student';

    // Initial state is Active
    expect(resolveStudentStatus(studentId, studentName, 'active')).toBe('Active');

    // Toggle to Inactive
    const next1 = toggleStudentStatus(studentId, studentName, 'Active');
    expect(next1).toBe('Inactive');
    expect(resolveStudentStatus(studentId, studentName, 'active')).toBe('Inactive');

    // Toggle back to Active
    const next2 = toggleStudentStatus(studentId, studentName, 'Inactive');
    expect(next2).toBe('Active');
    expect(resolveStudentStatus(studentId, studentName, 'inactive')).toBe('Active');
  });

  it('saves newly enrolled student locally and displays them at top of getEnrollmentStudents', async () => {
    const student = {
      id: 'stu-test-enrolled-1',
      studentId: 'stu-test-enrolled-1',
      name: 'Zara Williams',
      fullName: 'Zara Williams',
      age: 7,
      gender: 'Female',
      program: 'Comprehensive ABA',
      programType: 'Comprehensive ABA',
      therapyGroup: 'Basic',
      therapist: 'Abeba Tadesse',
      status: 'active',
    };

    saveEnrolledStudentLocally(student);

    const stored = getStoredEnrolledStudents();
    expect(stored.some((s) => s.fullName === 'Zara Williams')).toBe(true);

    const { data } = await getEnrollmentStudents({});
    expect(data.length).toBeGreaterThan(1);
    // Newly enrolled student should be at the top of the roster list
    const first = data[0];
    expect(first.fullName).toBe('Zara Williams');
    expect(first.age).toBe(7);
    expect(first.gender).toBe('Female');
    expect(first.therapist).toBe('Abeba Tadesse');
    expect(first.status).toBe('active');
    // Existing students are preserved
    expect(data.some((s) => s.fullName === 'Amir Hassan' || s.name === 'Amir Hassan')).toBe(true);
  });
it('deletes a student, permanently removing them from stored cache and roster list', async () => {
    const student = {
      id: 'stu-delete-target-99',
      studentId: 'stu-delete-target-99',
      name: 'Jonah Miller',
      fullName: 'Jonah Miller',
      age: 6,
      gender: 'Male',
      program: 'Regular',
      programType: 'Regular',
      therapyGroup: 'Basic',
      therapist: 'Abeba Tadesse',
      status: 'active',
    };

    saveEnrolledStudentLocally(student);
    let { data: initialList } = await getEnrollmentStudents({});
    expect(initialList.some((s) => s.fullName === 'Jonah Miller')).toBe(true);

    // Delete student
    const res = await deleteStudentEnrollment('stu-delete-target-99', 'Jonah Miller');
    expect(res.data.success).toBe(true);
    expect(isStudentDeleted('stu-delete-target-99', 'Jonah Miller')).toBe(true);

    // Verify removed from cache
    const stored = getStoredEnrolledStudents();
    expect(stored.some((s) => s.fullName === 'Jonah Miller')).toBe(false);

    // Verify removed from getEnrollmentStudents
    const { data: updatedList } = await getEnrollmentStudents({});
    expect(updatedList.some((s) => s.fullName === 'Jonah Miller' || s.name === 'Jonah Miller')).toBe(false);
  });

  it('filters out deleted default students from the roster list', async () => {
    // Delete Amir Hassan from default list
    markStudentDeleted('e12bff1b-a000-4fcd-ab3b-f8d035e45ba8', 'Amir Hassan');
    expect(isStudentDeleted('e12bff1b-a000-4fcd-ab3b-f8d035e45ba8', 'Amir Hassan')).toBe(true);

    const { data } = await getEnrollmentStudents({});
    expect(data.some((s) => s.fullName === 'Amir Hassan' || s.name === 'Amir Hassan')).toBe(false);
  });
});
