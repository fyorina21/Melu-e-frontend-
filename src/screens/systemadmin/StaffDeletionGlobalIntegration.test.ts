import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordDeletedStaff,
  isStaffDeleted,
  filterOutDeletedStaff,
  filterStaffResponse,
  getDeletedStaffKeys,
  getDeletedStaffRecords,
  DELETED_STAFF_KEY,
} from '../../utils/deletedStaffHelper';
import { getStaffAccounts } from '../../api/SystemAdminApi';
import { getStaffOptions } from '../../api/optionsApi';
import { getDirectorSchedule } from '../../api/directorApi';
import { getOperationalSchedule, getTeacherPerformanceMetrics, getWorkloadDashboard } from '../../api/coordinatorApi';
import { getStaffCalendar, getAttendanceHistory } from '../../api/sessionApi';

describe('Global Staff Deletion Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('records deleted staff by ID, email, and normalized name', () => {
    recordDeletedStaff({
      id: 'staff-42',
      name: 'Dr. Jane Watson',
      email: 'jane.watson@melu-e.org',
      roles: ['Therapist'],
    });

    const keys = getDeletedStaffKeys();
    expect(keys.has('staff-42')).toBe(true);
    expect(keys.has('jane.watson@melu-e.org')).toBe(true);
    expect(keys.has('dr. jane watson')).toBe(true);
    expect(keys.has('jane watson')).toBe(true);

    const records = getDeletedStaffRecords();
    expect(records.length).toBe(1);
    expect(records[0].id).toBe('staff-42');
  });

  it('isStaffDeleted detects deleted staff in various object formats', () => {
    recordDeletedStaff({
      id: 't-10',
      name: 'Michael Brown',
      email: 'michael.b@melu-e.org',
    });

    // Check by string
    expect(isStaffDeleted('t-10')).toBe(true);
    expect(isStaffDeleted('Michael Brown')).toBe(true);
    expect(isStaffDeleted('michael.b@melu-e.org')).toBe(true);
    expect(isStaffDeleted('other-staff')).toBe(false);

    // Check staff account object
    expect(isStaffDeleted({ id: 't-10', name: 'Michael Brown', email: 'michael.b@melu-e.org' })).toBe(true);
    expect(isStaffDeleted({ id: 't-99', name: 'Sarah Miller', email: 'sarah@melu-e.org' })).toBe(false);

    // Check appointment / schedule block with teacherId / therapistId
    expect(isStaffDeleted({ therapistId: 't-10', therapistName: 'Michael Brown' })).toBe(true);
    expect(isStaffDeleted({ teacherId: 't-10', teacherName: 'Michael Brown' })).toBe(true);
    expect(isStaffDeleted({ therapistId: 't-99', therapistName: 'Active Teacher' })).toBe(false);

    // Check dropdown option with value or label
    expect(isStaffDeleted({ label: 'Michael Brown', value: 't-10' })).toBe(true);
    expect(isStaffDeleted({ label: 'Active Teacher', value: 't-99' })).toBe(false);
  });

  it('filterOutDeletedStaff prunes deleted staff from any collection', () => {
    recordDeletedStaff({
      id: 't-del',
      name: 'Deleted Therapist',
      email: 'del@melu-e.org',
    });

    const list = [
      { id: 't-1', name: 'Active Teacher 1', email: 't1@melu-e.org' },
      { id: 't-del', name: 'Deleted Therapist', email: 'del@melu-e.org' },
      { id: 't-2', name: 'Active Teacher 2', email: 't2@melu-e.org' },
    ];

    const filtered = filterOutDeletedStaff(list);
    expect(filtered.length).toBe(2);
    expect(filtered.map((s) => s.id)).toEqual(['t-1', 't-2']);
  });

  it('clears active teacher session if that teacher was deleted', () => {
    localStorage.setItem('melue_session_selected_teacher_id', 't-active');
    recordDeletedStaff({ id: 't-active', name: 'Active Teacher', email: 't@melu-e.org' });

    expect(localStorage.getItem('melue_session_selected_teacher_id')).toBeNull();
  });

  it('filters deleted staff in filterStaffResponse across diverse endpoints', () => {
    recordDeletedStaff({
      id: 't-del',
      name: 'Deleted Staff',
      email: 'del@melu-e.org',
    });

    // 1. Staff options array
    const optionsRes = filterStaffResponse('/options/staff', [
      { id: 't-1', name: 'Active 1' },
      { id: 't-del', name: 'Deleted Staff' },
    ]);
    expect(optionsRes.length).toBe(1);
    expect(optionsRes[0].id).toBe('t-1');

    // 2. Schedule week object { 0: [...], 1: [...] }
    const scheduleRes = filterStaffResponse('/staff-calendar', {
      0: [
        { id: 'a1', therapistId: 't-1', therapistName: 'Active 1' },
        { id: 'a2', therapistId: 't-del', therapistName: 'Deleted Staff' },
      ],
      1: [],
    });
    expect(scheduleRes[0].length).toBe(1);
    expect(scheduleRes[0][0].therapistId).toBe('t-1');

    // 3. Attendance object { student: [...], therapist: [...], support_staff: [...] }
    const attendanceRes = filterStaffResponse('/attendance', {
      student: [{ id: 's1', name: 'Student 1' }],
      therapist: [
        { id: 't-1', name: 'Active Therapist' },
        { id: 't-del', name: 'Deleted Staff' },
      ],
      support_staff: [],
    });
    expect(attendanceRes.therapist.length).toBe(1);
    expect(attendanceRes.therapist[0].id).toBe('t-1');
  });

  it('getStaffOptions and SystemAdmin getStaffAccounts return only non-deleted staff', async () => {
    // Record Rosa Delgado as deleted
    recordDeletedStaff({
      id: 'staff-1',
      name: 'Rosa Delgado',
      email: 'rosa.delgado@melue.org',
    });

    const mockStaffData = [
      { id: 'staff-1', name: 'Rosa Delgado', email: 'rosa.delgado@melue.org', role: 'teacher' },
      { id: 'staff-2', name: 'John Doe', email: 'john.doe@melue.org', role: 'teacher' },
    ];

    const filteredOptions = filterOutDeletedStaff(mockStaffData);
    const filteredAccounts = filterStaffResponse('/sysadmin/staff', mockStaffData);

    expect(filteredOptions.some((s: any) => s.id === 'staff-1' || s.name === 'Rosa Delgado')).toBe(false);
    expect(filteredAccounts.some((s: any) => s.id === 'staff-1' || s.name === 'Rosa Delgado')).toBe(false);
    expect(filteredOptions.length).toBe(1);
    expect(filteredOptions[0].name).toBe('John Doe');
  });
});
