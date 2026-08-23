// src/api/mock/persistence.test.ts
//
// Verifies that demo-mode writes persist to the mock database and surface
// on the intended read endpoints (the screens' save -> display loops).

import { beforeEach, describe, expect, it } from 'vitest';
import { mockHttp } from './client';
import { mockDb } from './db';

beforeEach(() => {
  localStorage.clear();
  mockDb.reset();
});

describe('demo-mode persistence', () => {
  it('persists a behavior incident and surfaces it on the ABC log', async () => {
    await mockHttp.post('/sessions/sess-1/students/stu-001/incidents', {
      date: 'Aug 22, 2026',
      time: '10:00 AM',
      location: 'Therapy Room',
      behavior: 'Screaming',
      behaviorDefinition: 'Loud vocalization',
      frequency: 'Occasionally',
      intensity: 'Mild',
      category: 'Making noises/interrupting conversation',
      antecedent: 'Demand placed',
      consequence: 'Redirected',
      notes: 'test note',
      recordedBy: 'Teacher A',
    });

    const { data } = await mockHttp.get<{ incidents: Array<{ behavior: string }> }>('/teacher/abc-log', {
      params: { studentId: 'stu-001' },
    });
    expect(data.incidents.some((i) => i.behavior === 'Screaming')).toBe(true);
    // New incident plus any seeded incidents.
    expect(mockDb.all('incidents').length).toBeGreaterThanOrEqual(1);
  });

  it('persists a session summary and routes it through coordinator review', async () => {
    const { data: created } = await mockHttp.post<{ id: string; status: string }>('/sessions/sess-9/summary', {
      notes: 'Good session',
    });
    expect(created.status).toBe('pending_review');

    const { data: pending } = await mockHttp.get<Array<{ id: string }>>('/coordinator/summaries/pending');
    expect(pending.some((s) => s.id === created.id)).toBe(true);

    await mockHttp.post(`/coordinator/summaries/${created.id}/approve`);
    const approved = mockDb.findById('sessionSummaries', created.id);
    expect(approved?.status).toBe('approved');

    const { data: reports } = await mockHttp.get<Array<{ id: string }>>('/director/reports/sessions');
    expect(reports.some((s) => s.id === created.id)).toBe(true);
  });

  it('creates a session note and lists it on the daily notes screen', async () => {
    const { data: note } = await mockHttp.post<{ id: string }>('/session-notes/sess-5', {
      bodyMarkdown: 'Worked on manding.',
    });
    const { data: list } = await mockHttp.get<{ records: Array<{ id: string; room: string; status: string }> }>('/session-notes');
    expect(list.records.some((n) => n.id === note.id)).toBe(true);
    // Records carry the display fields DailyNotesScreen renders
    expect(list.records.every((r) => typeof r.room === 'string')).toBe(true);
  });

  it('CRUDs goals in the goal bank', async () => {
    const { data: goal } = await mockHttp.post<{ id: string; name: string }>('/program-director/goal-bank', {
      name: 'New goal',
      domain: 'Communication',
      description: 'desc',
      masteryCriteria: '100%',
    });
    expect(mockDb.findById('goalBank', goal.id)).toBeDefined();

    await mockHttp.patch(`/program-director/goal-bank/${goal.id}`, { name: 'Renamed' });
    expect(mockDb.findById('goalBank', goal.id)?.name).toBe('Renamed');

    await mockHttp.delete(`/program-director/goal-bank/${goal.id}`);
    expect(mockDb.findById('goalBank', goal.id)).toBeUndefined();
  });

  it('records attendance and returns it in history', async () => {
    const { data: created } = await mockHttp.post<{ id: string }>('/students', {
      firstName: 'Att', lastName: 'Student', dateOfBirth: '2019-01-01', programType: 'ABA', therapyGroup: 'Sunrise',
    });
    await mockHttp.post('/sessions/sess-1/attendance', {
      personId: created.id,
      personType: 'student',
      status: 'present',
    });
    const { data } = await mockHttp.get<{ student: Array<{ id: string; status: string | null }> }>('/attendance');
    const stu = data.student.find((r) => r.id === created.id);
    expect(stu).toBeDefined();
    expect(stu?.status).toBe('Present');
  });

  it('manages staff accounts for the system admin screen', async () => {
    const { data: staff } = await mockHttp.post<{ id: string; email: string }>('/sysadmin/staff', {
      name: 'New Teacher',
      email: 'new@melue.org',
      role: 'teacher',
    });
    expect(staff.email).toBe('new@melue.org');

    await mockHttp.patch(`/sysadmin/staff/${staff.id}`, { name: 'Updated Teacher' });
    expect(mockDb.findById('staffMembers', staff.id)?.name).toBe('Updated Teacher');

    const { data: all } = await mockHttp.get<Array<{ id: string }>>('/sysadmin/staff');
    expect(all.some((s) => s.id === staff.id)).toBe(true);
  });

  it('serves the teacher assessment dashboard in the shape SCR-010 expects', async () => {
    const { data: created } = await mockHttp.post<{ id: string }>('/students', {
      firstName: 'Assess', lastName: 'Student', dateOfBirth: '2018-01-01', programType: 'ABA', therapyGroup: 'Sunrise',
    });
    const { data } = await mockHttp.get<{
      periodLabel: string;
      stats: { total: number; completed: number; inProgress: number; notStarted: number };
      students: Array<{ id: string; ablls: { status: string }; behavior: { status: string } }>;
    }>('/teacher/assessments/dashboard');
    expect(typeof data.periodLabel).toBe('string');
    expect(data.stats.total).toBeGreaterThanOrEqual(1);
    expect(data.stats.total).toBe(data.stats.completed + data.stats.inProgress + data.stats.notStarted);
    expect(data.students.length).toBe(data.stats.total);

    // Saving a skills assessment flips that student's ABLLS row
    await mockHttp.post(`/teacher/students/${created.id}/assessments/skills`, { scores: { B1: 2 } });
    const { data: after } = await mockHttp.get<typeof data>('/teacher/assessments/dashboard');
    const stu1 = after.students.find((s) => s.id === created.id);
    expect(stu1?.ablls.status).toBe('In Progress');
    expect((stu1!.ablls as any).progress).toBeGreaterThan(0);
  });

  it('logs an audit entry when permissions are saved', async () => {
    await mockHttp.post('/sysadmin/roles/role-2/permissions', { matrix: { students: ['view'] } });
    const { data: logs } = await mockHttp.get<Array<{ action: string; date: string; time: string; resource: string }>>('/sysadmin/audit-logs');
    expect(logs.some((l) => l.action === 'changed' && l.resource.includes('permissions'))).toBe(true);
    // Display-safe entries for AuditLogScreen
    expect(logs.every((l) => ['created', 'updated', 'deleted', 'changed'].includes(l.action))).toBe(true);
  });

  it('delivers staff messages (teacher/coordinator/PD) into the parent-visible thread', async () => {
    // Conversations start empty — sending a message bootstraps the thread.
    await mockHttp.post('/teacher/conversations/conv-1/messages', { text: 'Hello from teacher' });
    await mockHttp.post('/coordinator/conversations/conv-1/messages', { text: 'From coordinator' });
    await mockHttp.post('/program-director/conversations/conv-1/messages', { text: 'From PD' });

    const convo = mockDb.findById('conversations', 'conv-1');
    expect(convo?.messages.some((m) => m.text === 'Hello from teacher' && m.from === 'team')).toBe(true);
    expect(convo?.lastMessage).toBe('From PD');

    // The parent reads the same shared thread and can reply into it
    const { data } = await mockHttp.get<{ messages: Array<{ text: string }> }>('/parent/conversations/conv-1');
    expect(data.messages.some((m) => m.text === 'Hello from teacher')).toBe(true);

    await mockHttp.post('/parent/conversations/conv-1/messages', { text: 'Thanks, noted!' });
    const updated = mockDb.findById('conversations', 'conv-1');
    expect(updated?.messages.some((m) => m.from === 'parent' && m.text === 'Thanks, noted!')).toBe(true);

    // Empty text is still rejected
    await expect(
      mockHttp.post('/teacher/conversations/conv-1/messages', { text: '' }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('serves display-safe shapes for every audited screen (crash regression guard)', async () => {
    // Baseline business data built entirely through the mock API.
    const { data: stuA } = await mockHttp.post<{ id: string }>('/students', {
      firstName: 'Shape', lastName: 'Guard', dateOfBirth: '2018-01-01', programType: 'ABA', therapyGroup: 'Sunrise',
    });
    await mockHttp.post<{ id: string }>('/students', {
      firstName: 'Second', lastName: 'Student', dateOfBirth: '2019-01-01', programType: 'PECS', therapyGroup: 'Horizon',
    });
    await mockHttp.post('/sysadmin/staff', { name: 'Staff One', email: 's1@melue.org', role: 'teacher' });
    await mockHttp.post('/sysadmin/staff', { name: 'Staff Two', email: 's2@melue.org', role: 'teacher' });
    await mockHttp.post('/sessions/sess-shape/summary', { notes: 'Baseline summary' });
    await mockHttp.post(`/sessions/sess-shape/students/${stuA.id}/incidents`, {
      behavior: 'Flopping', recordedBy: 'Teacher A', location: 'Therapy Room', antecedent: 'Transition',
      consequence: 'Redirected', category: 'Safety concerns', date: 'Aug 22, 2026', time: '09:00 AM',
      frequency: 'Rarely', intensity: 'Mild', notes: '', behaviorDefinition: '',
    });
    await mockHttp.post(`/program-director/iup/${stuA.id}/draft`, { goals: ['g1'] });
    await mockHttp.post('/notifications', { type: 'message' });
    // Assign a goal so charts/progress have a series to render
    const { data: createdGoal } = await mockHttp.post<{ id: string; name: string }>('/program-director/goal-bank', {
      name: 'Chart Goal', domain: 'Communication', description: 'd', masteryCriteria: '100%',
    });
    await mockHttp.post(`/program-director/caseload/${stuA.id}/assign-goal`, { goalId: createdGoal.id });

    // A1: LiveSessionMonitoringScreen maps over an array
    const active = await mockHttp.get<Array<Record<string, unknown>>>('/coordinator/sessions/active');
    expect(Array.isArray(active.data)).toBe(true);
    expect(active.data[0].studentNames).toBeDefined();

    // A2/B23: workload trend is a bare array; metrics have numeric fields
    const trend = await mockHttp.get<Array<{ label: string; sessions: number }>>('/coordinator/teachers/workload/trend');
    expect(Array.isArray(trend.data)).toBe(true);
    const metrics = await mockHttp.get<Array<{ teacherName: string; sessions: number; independencePercent: number }>>('/coordinator/teachers/metrics');
    expect(metrics.data[0].sessions).toBeGreaterThan(0);

    // A3: charts expose goalCharts
    const charts = await mockHttp.get<{ goalCharts: Array<{ goalId: string; series: unknown[] }> }>('/program-director/charts', {
      params: { studentId: stuA.id },
    });
    expect(charts.data.goalCharts.length).toBeGreaterThan(0);

    // A4/A5: progress screens get assessmentSummary + sessionHistory
    for (const url of [`/coordinator/students/${stuA.id}/progress`, `/director/students/${stuA.id}/progress`]) {
      const { data } = await mockHttp.get<{
        name: string;
        assessmentSummary: { skills: string };
        goals: Array<{ percent: number; trend: number[] }>;
        sessionHistory: unknown[];
        incidents: unknown[];
      }>(url);
      expect(data.name).toBeTruthy();
      expect(typeof data.assessmentSummary.skills).toBe('string');
      expect(Array.isArray(data.sessionHistory)).toBe(true);
      expect(Array.isArray(data.goals[0].trend)).toBe(true);
    }

    // A6: staff rows use roles[] + active
    const staff = await mockHttp.get<Array<{ roles: string[]; active: boolean; email: string }>>('/sysadmin/staff');
    expect(staff.data.length).toBeGreaterThan(1);
    expect(Array.isArray(staff.data[0].roles)).toBe(true);

    // A7/A8: summary rows expose studentNames/teacherName/bodyPreview
    const pending = await mockHttp.get<Array<{ studentNames: string[]; teacherName: string }>>('/coordinator/summaries/pending');
    expect(pending.data[0].studentNames.length).toBeGreaterThan(0);
    const reports = await mockHttp.get<Array<{ studentNames: string[]; date: string }>>('/director/reports/sessions');
    expect(reports.data[0].date).toBeTruthy();

    // A10: schedule capacity includes blocks
    const sched = await mockHttp.get<{ morningStart: string; blocks: unknown[] }>('/admin/schedule-capacity-config');
    expect(sched.data.blocks.length).toBeGreaterThan(0);

    // A11: attendance roster grouped by person type
    const roster = await mockHttp.get<{ student: unknown[]; therapist: unknown[]; support_staff: unknown[] }>('/attendance');
    expect(roster.data.student.length).toBeGreaterThan(0);

    // A12: notifications carry title/body/type/date/read
    for (const url of ['/parent/notifications', '/teacher/notifications', '/coordinator/notifications']) {
      const { data } = await mockHttp.get<Array<{ title: string; body: string; type: string; read: boolean }>>(url);
      expect(data[0].title).toBeTruthy();
      expect(['announcement', 'goal', 'appointment', 'alert'].includes(data[0].type)).toBe(true);
    }

    // A13: IUP context exposes reinforcers array
    const ctxData = await mockHttp.get<{ studentName: string; topReinforcers: string[] }>(`/program-director/iup/${stuA.id}/context`);
    expect(ctxData.data.topReinforcers.length).toBeGreaterThan(0);

    // B16: coordinator dashboard counters exist
    const dash = await mockHttp.get<{
      unreadCount: number;
      activeSessionsCount: number;
      pendingReviewCount: number;
      studentsInTherapyCount: number;
      teachersOnDutyCount: number;
      liveSessions: Array<{ status: string }>;
      pendingReviews: unknown[];
    }>('/coordinator/dashboard');
    expect(dash.data.studentsInTherapyCount).toBeGreaterThan(0);
    expect(dash.data.liveSessions.every((s) => ['green', 'yellow', 'red'].includes(s.status))).toBe(true);

    // B17: IUP library rows are display-mapped
    const lib = await mockHttp.get<Array<{ studentName: string; status: string; goalCount: number }>>('/program-director/iup-library');
    expect(lib.data[0].status).toMatch(/^(Active|Draft|Archived)$/);

    // B20: foundation overview has the four keys the tab renders
    const overview = await mockHttp.get<{ totalStudents: number; totalTeachers: number; sessionsThisMonth: number; avgGoalProgress: number }>('/director/reports/foundation-overview');
    expect(overview.data.totalStudents).toBeGreaterThan(0);
    expect(typeof overview.data.avgGoalProgress).toBe('number');

    // B24: ABC lists keyed by display names with item objects
    const lists = await mockHttp.get<Record<string, Array<{ id: string; name: string; active: boolean }>>>('/admin/abc-lists');
    expect(lists.data.Behaviors.length).toBeGreaterThan(0);
    expect(lists.data.Locations[0].active).toBe(true);

    // B27/B28: clinic info + school settings return full field sets
    const clinic = await mockHttp.get<Record<string, unknown>>('/admin/clinic-info');
    expect(['name', 'address', 'phone', 'email'].every((k) => k in clinic.data)).toBe(true);
    const school = await mockHttp.get<Record<string, unknown>>('/admin/school-settings');
    expect('schoolName' in school.data).toBe(true);

    // B31: rooms/resources populated
    const rooms = await mockHttp.get<{ rooms: Array<{ status: string }>; resources: Array<{ total: number }> }>('/coordinator/rooms-resources');
    expect(rooms.data.rooms.length).toBeGreaterThan(0);

    // B33: abc log returns stats + aliased teacher
    const abc = await mockHttp.get<{
      rows: Array<{ teacher: string }>;
      stats: { totalIncidents: number; mostCommonBehavior: string };
    }>('/teacher/abc-log');
    expect(abc.data.rows.length).toBeGreaterThan(0);
    expect(abc.data.rows[0].teacher).toBeTruthy();
    expect(typeof abc.data.stats.totalIncidents).toBe('number');
  }, 30000);
});
