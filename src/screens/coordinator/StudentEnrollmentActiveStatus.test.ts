// src/screens/coordinator/StudentEnrollmentActiveStatus.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
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
});
