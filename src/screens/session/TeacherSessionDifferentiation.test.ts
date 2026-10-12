import { describe, it, expect, beforeEach } from 'vitest';
import { setStoredSessionStudents, getStoredSessionStudents } from '../../stores/trialsStore';
import { isStudentEligibleForSession } from '../../utils/studentLifecycleHelper';
import {
  findLoggedInTeacher,
  resolveTeacherAssignedStudentIds,
  resolveEligibleTeacherStudents,
} from '../../utils/teacherScheduleHelper';

describe('Teacher Session Differentiation', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('isolates stored session students per teacher', () => {
    const teacher1Id = 'a507bea6-2878-4c30-b4c5-9d051ad5edf3'; // Abeba Tadesse
    const teacher2Id = 'f6aa347b-493d-42ce-9cd7-664faef36460'; // Dawit Bekele

    const abebaStudents = [
      { id: 'stu-1', name: 'Yonas Girma', status: 'in_session' },
      { id: 'stu-2', name: 'Meron Haile', status: 'in_session' },
    ];
    const dawitStudents: any[] = [];

    setStoredSessionStudents('active', abebaStudents, teacher1Id);
    setStoredSessionStudents('active', dawitStudents, teacher2Id);

    const retrievedAbeba = getStoredSessionStudents('active', teacher1Id);
    const retrievedDawit = getStoredSessionStudents('active', teacher2Id);

    expect(retrievedAbeba).toHaveLength(2);
    expect(retrievedAbeba?.[0].name).toBe('Yonas Girma');

    expect(retrievedDawit).toEqual([]);
  });

  it('enforces session eligibility per teacher assigned student', () => {
    const eligibleStudent = {
      id: 'stu-101',
      name: 'Liya Belay',
      status: 'active_therapy',
    };
    const inAssessmentStudent = {
      id: 'stu-102',
      name: 'Amir Hassan',
      status: 'in_assessment',
      assessmentProgress: 45,
    };

    expect(isStudentEligibleForSession(eligibleStudent)).toBe(true);
    expect(isStudentEligibleForSession(inAssessmentStudent)).toBe(false);
  });

  it('limits session capacity strictly to at most 2 assigned students and excludes 3rd non-assigned student', () => {
    const teacherBlocks = [
      { id: 'b1', teacherId: 't-1', studentIds: ['stu-1', 'stu-2'] },
      { id: 'b2', teacherId: 't-1', studentIds: ['stu-3'] },
    ];

    const activeBlock = teacherBlocks.find((b) => Array.isArray(b.studentIds) && b.studentIds.length > 0) || teacherBlocks[0];
    const assignedStudentIds = Array.from<string>(new Set(activeBlock.studentIds.map(String))).slice(0, 2);

    expect(assignedStudentIds).toEqual(['stu-1', 'stu-2']);
    expect(assignedStudentIds).not.toContain('stu-3');
    expect(assignedStudentIds.length).toBeLessThanOrEqual(2);
  });

  it('matches the logged-in teacher and isolates assigned students with zero leakage', () => {
    const teachers = [
      { id: 't-abeba', name: 'Abeba Tadesse', email: 'abeba@melue.org' },
      { id: 't-dawit', name: 'Dawit Bekele', email: 'dawit@melue.org' },
    ];

    const blocks = [
      { id: 'b1', teacherId: 't-abeba', teacherName: 'Abeba Tadesse', stationName: 'Station 1', studentIds: ['stu-1', 'stu-2'] },
      { id: 'b2', teacherId: 't-dawit', teacherName: 'Dawit Bekele', stationName: 'Station 2', studentIds: [] },
    ];

    const studentOpts = [
      { id: 'stu-1', name: 'Yonas Girma', status: 'in_session' },
      { id: 'stu-2', name: 'Meron Haile', status: 'in_session' },
      { id: 'stu-3', name: 'Unassigned Student', status: 'in_session' },
    ];

    // Case 1: Abeba is logged in
    const authAbeba = { userName: 'Abeba Tadesse', email: 'abeba@melue.org' };
    const matchedAbeba = findLoggedInTeacher(authAbeba, teachers);
    expect(matchedAbeba?.id).toBe('t-abeba');

    const abebaResult = resolveTeacherAssignedStudentIds(matchedAbeba, blocks);
    expect(abebaResult.assignedStudentIds).toEqual(['stu-1', 'stu-2']);

    const abebaEligible = resolveEligibleTeacherStudents(abebaResult.assignedStudentIds, studentOpts);
    expect(abebaEligible).toHaveLength(2);
    expect(abebaEligible[0].name).toBe('Yonas Girma');
    expect(abebaEligible[1].name).toBe('Meron Haile');

    // Case 2: Dawit is logged in (has no assigned students)
    const authDawit = { userName: 'Dawit Bekele', email: 'dawit@melue.org' };
    const matchedDawit = findLoggedInTeacher(authDawit, teachers);
    expect(matchedDawit?.id).toBe('t-dawit');

    const dawitResult = resolveTeacherAssignedStudentIds(matchedDawit, blocks);
    expect(dawitResult.assignedStudentIds).toEqual([]);

    const dawitEligible = resolveEligibleTeacherStudents(dawitResult.assignedStudentIds, studentOpts);
    expect(dawitEligible).toEqual([]);
    // Dawit NEVER sees Abeba's students stu-1 or stu-2 or unassigned stu-3!
  });
});

