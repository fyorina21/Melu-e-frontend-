import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveDirectorAssignment,
  getDirectorAssignmentsForTeacher,
  applyDirectorAssignmentsToBlocks,
  clearDirectorAssignmentsForBlock,
  resolveTeacherAssignedStudentIds,
  resolveEligibleTeacherStudents,
  onScheduleAssignmentsChanged,
} from '../../utils/teacherScheduleHelper';
import { isStudentEligibleForSession } from '../../utils/studentLifecycleHelper';
import { saveAssignment, getDirectorSchedule } from '../../api/directorApi';

describe('Director Scheduling to Teacher Session Sync', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('saves director assignment and retrieves them for the specific teacher', () => {
    const teacherId = 'teacher-101';
    const blockId = 'block-morning-1';
    const studentIds = ['stu-yonas', 'stu-meron'];
    const studentObjects = [
      { id: 'stu-yonas', name: 'Yonas Girma', age: 7 },
      { id: 'stu-meron', name: 'Meron Haile', age: 8 },
    ];

    saveDirectorAssignment(teacherId, blockId, studentIds, studentObjects);

    const savedIds = getDirectorAssignmentsForTeacher(teacherId);
    expect(savedIds).toEqual(['stu-yonas', 'stu-meron']);

    const blocks = [
      { id: 'block-morning-1', teacherId: 'teacher-101', teacherName: 'Teacher Abeba', studentIds: [] },
    ];
    const applied = applyDirectorAssignmentsToBlocks(blocks, teacherId);
    expect(applied[0].studentIds).toEqual(['stu-yonas', 'stu-meron']);
  });

  it('updates teacher session students when director changes assigned students', () => {
    const teacherId = 'teacher-101';
    const blockId = 'block-1';

    // Initial assignment: Yonas and Meron
    saveDirectorAssignment(teacherId, blockId, ['stu-yonas', 'stu-meron']);
    expect(getDirectorAssignmentsForTeacher(teacherId)).toEqual(['stu-yonas', 'stu-meron']);

    // Director edits assigned students: replaces with Sara and Dawit
    saveDirectorAssignment(teacherId, blockId, ['stu-sara', 'stu-dawit']);
    const updatedIds = getDirectorAssignmentsForTeacher(teacherId);
    expect(updatedIds).toEqual(['stu-sara', 'stu-dawit']);
  });

  it('ensures director-assigned students are eligible and marked in_session for session page', () => {
    const teacherId = 'teacher-101';
    const blockId = 'block-1';
    const studentIds = ['stu-new-1', 'stu-new-2'];
    const studentOptions = [
      { id: 'stu-new-1', name: 'Kidist Tefera', status: 'enrolled' },
      { id: 'stu-new-2', name: 'Natnael Assefa', status: 'enrolled' },
    ];

    saveDirectorAssignment(teacherId, blockId, studentIds, studentOptions);

    const resolvedStudents = resolveEligibleTeacherStudents(studentIds, studentOptions);
    expect(resolvedStudents).toHaveLength(2);
    expect(resolvedStudents[0].status).toBe('in_session');
    expect(resolvedStudents[0].sessionAssigned).toBe(true);
    expect(isStudentEligibleForSession(resolvedStudents[0])).toBe(true);
    expect(isStudentEligibleForSession(resolvedStudents[1])).toBe(true);
  });

  it('notifies listeners when director assignments change', () => {
    let callCount = 0;
    const unsubscribe = onScheduleAssignmentsChanged(() => {
      callCount += 1;
    });

    saveDirectorAssignment('t-1', 'b-1', ['s-1']);
    expect(callCount).toBe(1);

    saveDirectorAssignment('t-1', 'b-1', ['s-1', 's-2']);
    expect(callCount).toBe(2);

    unsubscribe();
  });

  it('strictly isolates assignments so Teacher A changes never affect Teacher B', () => {
    const teacherA = 'teacher-A';
    const teacherB = 'teacher-B';

    saveDirectorAssignment(teacherA, 'block-A', ['stu-A1', 'stu-A2']);
    saveDirectorAssignment(teacherB, 'block-B', ['stu-B1']);

    expect(getDirectorAssignmentsForTeacher(teacherA)).toEqual(['stu-A1', 'stu-A2']);
    expect(getDirectorAssignmentsForTeacher(teacherB)).toEqual(['stu-B1']);

    // Clearing teacher A does not clear teacher B
    clearDirectorAssignmentsForBlock('block-A', teacherA);
    expect(getDirectorAssignmentsForTeacher(teacherA)).toEqual([]);
    expect(getDirectorAssignmentsForTeacher(teacherB)).toEqual(['stu-B1']);
  });

  it('caps assigned students at 2 for 2-student therapist station capacity', () => {
    const teacherId = 'teacher-101';
    const blockId = 'block-1';

    // Trying to assign 3 students
    saveDirectorAssignment(teacherId, blockId, ['s-1', 's-2', 's-3']);
    const saved = getDirectorAssignmentsForTeacher(teacherId);

    expect(saved).toHaveLength(2);
    expect(saved).toEqual(['s-1', 's-2']);
  });
});
