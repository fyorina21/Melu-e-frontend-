import { resolveEligibleTeacherStudents } from '../../utils/teacherScheduleHelper';
import { isStudentAssignedToTherapist } from '../../utils/therapistAssignmentHelper';
import { recordDeletedStudent, isStudentDeleted, filterOutDeletedStudents } from '../../utils/deletedStudentHelper';
import { describe, it, expect } from 'vitest';
import { getCountdown, NOTIF_ICON_MAP } from './teacherDashboardTypes';

describe('teacherDashboardTypes - getCountdown', () => {
  it('returns "Starts soon" when no time string is provided', () => {
    expect(getCountdown(undefined)).toBe('Starts soon');
    expect(getCountdown('')).toBe('Starts soon');
  });

  it('returns "Started" when target time is in the past', () => {
    const pastTime = '08:00 AM';
    const currentTime = new Date(2026, 9, 7, 9, 0, 0); // 9:00 AM
    expect(getCountdown(pastTime, currentTime)).toBe('Started');
  });

  it('formats countdown in hours, minutes, and seconds', () => {
    const futureTime = '11:30 AM';
    const currentTime = new Date(2026, 9, 7, 9, 0, 0); // 2 hours 30 mins away
    expect(getCountdown(futureTime, currentTime)).toBe('Starts in 2h 30m 0s');
  });

  it('formats countdown in minutes and seconds when under an hour away', () => {
    const futureTime = '09:45 AM';
    const currentTime = new Date(2026, 9, 7, 9, 0, 0); // 45 mins away
    expect(getCountdown(futureTime, currentTime)).toBe('Starts in 45m 0s');
  });

  it('formats countdown in seconds when under a minute away', () => {
    const futureTime = '09:00:30 AM';
    const currentTime = new Date(2026, 9, 7, 9, 0, 0); // 30 seconds away
    expect(getCountdown(futureTime, currentTime)).toBe('Starts in 30s');
  });

  it('handles 24-hour time format', () => {
    const futureTime = '16:00';
    const currentTime = new Date(2026, 9, 7, 14, 0, 0); // 2 hours away
    expect(getCountdown(futureTime, currentTime)).toBe('Starts in 2h 0m 0s');
  });
});

describe('teacherDashboardTypes - NOTIF_ICON_MAP', () => {
  it('has valid definitions for all standard notification types', () => {
    expect(NOTIF_ICON_MAP.approved).toBeDefined();
    expect(NOTIF_ICON_MAP.approved.name).toBe('check-circle');

    expect(NOTIF_ICON_MAP.revision).toBeDefined();
    expect(NOTIF_ICON_MAP.revision.name).toBe('refresh-cw');

    expect(NOTIF_ICON_MAP.alert).toBeDefined();
    expect(NOTIF_ICON_MAP.alert.name).toBe('bell');

    expect(NOTIF_ICON_MAP.message).toBeDefined();
    expect(NOTIF_ICON_MAP.message.name).toBe('message-circle');
  });
});

describe('Teacher Dashboard - Deleted Student Filtering', () => {
  it('excludes deleted students from eligible teacher session students', () => {
    const student1 = { id: 's-dash-keep', name: 'Active Student', status: 'ready_for_iup' };
    const student2 = { id: 's-dash-del', name: 'Deleted Student', status: 'ready_for_iup' };

    recordDeletedStudent({ id: 's-dash-del', name: 'Deleted Student' });
    expect(isStudentDeleted('s-dash-del')).toBe(true);

    const assignedIds = ['s-dash-keep', 's-dash-del'];
    const resolved = resolveEligibleTeacherStudents(assignedIds, [student1, student2]);

    expect(resolved.map((s) => s.id)).toContain('s-dash-keep');
    expect(resolved.map((s) => s.id)).not.toContain('s-dash-del');
  });

  it('prevents deleted student from being matched to any therapist', () => {
    const student = { id: 's-therapist-del', name: 'Tom Hardy', therapist: 'Abeba Tadesse' };
    recordDeletedStudent({ id: 's-therapist-del', name: 'Tom Hardy' });

    expect(isStudentAssignedToTherapist(student, 'Abeba Tadesse')).toBe(false);
    expect(isStudentAssignedToTherapist(student, { name: 'Abeba Tadesse', id: 't-1' })).toBe(false);
  });
});
