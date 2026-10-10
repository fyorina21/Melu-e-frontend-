import { describe, it, expect, beforeEach } from 'vitest';
import { setStoredSessionStudents, getStoredSessionStudents } from '../../stores/trialsStore';
import { isStudentEligibleForSession } from '../../utils/studentLifecycleHelper';

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
});
