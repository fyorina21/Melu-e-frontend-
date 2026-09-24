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

  it('persists deactivate/activate in the shared bank and blocks new assignment of inactive goals', async () => {
    // Create a goal and a student to assign it to.
    const { data: goal } = await mockHttp.post<{ id: string }>('/program-director/goal-bank', {
      name: 'Status Goal',
      domain: 'Cognitive',
      description: 'Track active/inactive round-trip',
      masteryCriteria: '100%',
    });
    const { data: stu } = await mockHttp.post<{ id: string }>('/students', {
      firstName: 'Stat',
      lastName: 'Student',
      dateOfBirth: '2018-01-01',
      programType: 'ABA',
      therapyGroup: 'Sunrise',
    });

    // Assignment succeeds while the goal is active.
    await mockHttp.post(`/program-director/caseload/${stu.id}/assign-goal`, {
      goalId: goal.id,
      station: 1,
      slot: 1,
    });

    // Deactivate the goal through the shared bank API.
    await mockHttp.post(`/program-director/goal-bank/${goal.id}/deactivate`);
    const { data: bankRows } = await mockHttp.get<Array<{ id: string; status: string; active: boolean }>>('/program-director/goal-bank');
    const row = bankRows.find((r) => r.id === goal.id);
    expect(row?.status).toBe('inactive');
    expect(row?.active).toBe(false);

    // The existing assignment is preserved but flagged inactive.
    const { data: caseload } = await mockHttp.get<{ goals: Array<{ goalId: string; station: number | null; slot: number | null; bankActive: boolean }> }>(`/program-director/caseload/${stu.id}`);
    const assigned = caseload.goals.find((g) => g.goalId === goal.id);
    expect(assigned).toBeDefined();
    expect(assigned?.station).toBe(1);
    expect(assigned?.slot).toBe(1);
    expect(assigned?.bankActive).toBe(false);

    // New assignment of the inactive goal is rejected.
    await expect(
      mockHttp.post(`/program-director/caseload/${stu.id}/assign-goal`, { goalId: goal.id, station: 1, slot: 2 }),
    ).rejects.toMatchObject({ status: 409 });

    // Reactivating flips the shared status back and re-enables assignment.
    await mockHttp.post(`/program-director/goal-bank/${goal.id}/activate`);
    const { data: reactivated } = await mockHttp.get<Array<{ id: string; status: string; active: boolean }>>('/program-director/goal-bank');
    expect(reactivated.find((r) => r.id === goal.id)?.active).toBe(true);

    await mockHttp.post(`/program-director/caseload/${stu.id}/assign-goal`, {
      goalId: goal.id,
      station: 1,
      slot: 2,
    });
    const { data: after } = await mockHttp.get<{ goals: Array<{ goalId: string; station: number | null; slot: number | null; bankActive: boolean }> }>(`/program-director/caseload/${stu.id}`);
    expect(after.goals.some((g) => g.goalId === goal.id && g.station === 1 && g.slot === 2)).toBe(true);
  });

  it('resolves session roster goals from the goal bank by assigned goalId', async () => {
    // A seeded student (student-c) has a goal id (goal-5) with NO matching bank goal.
    const { data: goal } = await mockHttp.post<{ id: string; name: string }>('/program-director/goal-bank', {
      name: 'Follow 2-Step Instructions',
      domain: 'Cognitive',
      description: 'from the shared bank',
      masteryCriteria: '100%',
    });

    // Assign it to a specific student so only that student resolves it.
    await mockHttp.post('/program-director/caseload/student-c/assign-goal', { goalId: goal.id, station: 1, slot: 1 });

    const { data: roster } = await mockHttp.get<{ students: Array<{ id: string; goals: Array<{ id: string; name: string; category: string }> }> }>('/sessions/active/roster');

    const liam = roster.students.find((s) => s.id === 'student-c');
    expect(liam?.goals.map((g) => g.id)).toContain(goal.id);
    expect(liam?.goals.find((g) => g.id === goal.id)?.name).toBe('Follow 2-Step Instructions');
    expect(liam?.goals.find((g) => g.id === goal.id)?.category).toBe('Cognitive');
    // The seeded "Turn Taking" goal id is not in the bank, so it must NOT appear.
    expect(liam?.goals.map((g) => g.name)).not.toContain('Turn Taking');

    // A student with only non-bank (seeded) goals resolves to an empty list → "No goal assigned".
    const maya = roster.students.find((s) => s.id === 'student-b');
    expect(maya?.goals).toEqual([]);

    // A goal assigned to one student must not leak onto another student's card.
    const aiden = roster.students.find((s) => s.id === 'student-a');
    expect(aiden?.goals.map((g) => g.id)).not.toContain(goal.id);
  });

  it('walks a new student through the enrollment lifecycle before they reach SessionDataCollection', async () => {
    const { data: created } = await mockHttp.post<{ id: string }>('/coordinator/students', {
      firstName: 'Workflow',
      lastName: 'Check',
      dateOfBirth: '2018-05-05',
      programType: 'ABA',
      therapyGroup: 'Sunrise',
      assignedTherapist: 'Jared Cruz',
    });
    const rosterIds = async () =>
      (await mockHttp.get<{ students: Array<{ id: string }> }>('/sessions/active/roster')).data.students.map((s) => s.id);

    // 1. Newly enrolled: no completed assessment and no goals → not session-ready.
    expect(await rosterIds()).not.toContain(created.id);

    // 2. A draft (in progress) assessment is not enough either.
    await mockHttp.post(`/teacher/students/${created.id}/assessments/skills`, { scores: { A1: 1 } });
    expect(await rosterIds()).not.toContain(created.id);

    // 3. A completed assessment alone still isn't enough — the student has no goal yet.
    await mockHttp.post(`/teacher/students/${created.id}/assessments/skills`, {
      status: 'completed',
      scores: { A1: 2 },
    });
    expect(await rosterIds()).not.toContain(created.id);

    // The completed assessment makes them a candidate for IUP generation.
    const { data: candidates } = await mockHttp.get<Array<{ id: string; status: string }>>('/program-director/iup/candidates');
    expect(candidates.find((c) => c.id === created.id)?.status).toBe('Ready for IUP');

    // 4. Once a goal is assigned (through the IUP → caseload flow) they become session-ready.
    const { data: goal } = await mockHttp.post<{ id: string }>('/program-director/goal-bank', {
      name: 'Lifecycle Goal',
      domain: 'Communication',
      description: 'unlocks session data collection',
      masteryCriteria: '100%',
    });
    await mockHttp.post(`/program-director/caseload/${created.id}/assign-goal`, {
      goalId: goal.id,
      station: 1,
      slot: 1,
    });
    expect(await rosterIds()).toContain(created.id);
  });

  it('gates IUP Generation on completed assessments and assigns goals on finalize', async () => {
    const allCandidates = async () =>
      (await mockHttp.get<Array<{ id: string; assessmentStatus: string; assessmentProgress: number }>>('/program-director/iup/candidates')).data;
    const rosterIds = async () =>
      (await mockHttp.get<{ students: Array<{ id: string }> }>('/sessions/active/roster')).data.students.map((s) => s.id);

    // Seeded: a/b/c completed their assessment; student-d is still enrolled (no assessment).
    const seeded = await allCandidates();
    const seededIds = seeded.map((c) => c.id);
    expect(seededIds).toContain('student-a');
    expect(seededIds).not.toContain('student-d');
    // Every candidate must be visibly 100% complete - never a partial figure.
    for (const c of seeded) {
      expect(c.assessmentStatus).toBe('100% Complete');
      expect(c.assessmentProgress).toBe(100);
    }

    const { data: created } = await mockHttp.post<{ id: string }>('/coordinator/students', {
      firstName: 'Workflow', lastName: 'Gate', dateOfBirth: '2018-05-05',
      programType: 'ABA', therapyGroup: 'Sunrise', assignedTherapist: 'Jared Cruz',
    });

    // In-progress assessment - still not an IUP candidate.
    await mockHttp.post(`/teacher/students/${created.id}/assessments/skills`, { scores: { A1: 1 } });
    expect((await allCandidates()).map((c) => c.id)).not.toContain(created.id);

    // Completed assessment - IUP candidate with 100% completion shown, but no goal yet so not session-ready.
    await mockHttp.post(`/teacher/students/${created.id}/assessments/skills`, { status: 'completed', scores: { A1: 2 } });
    const afterComplete = await allCandidates();
    expect(afterComplete.map((c) => c.id)).toContain(created.id);
    const cAfter = afterComplete.find((c) => c.id === created.id) as { id: string; assessmentStatus: string; assessmentProgress: number } | undefined;
    expect(cAfter?.assessmentStatus).toBe('100% Complete');
    expect(cAfter?.assessmentProgress).toBe(100);
    expect(await rosterIds()).not.toContain(created.id);

    // Finalizing an IUP writes its goals onto the shared student record.
    const { data: bankGoal } = await mockHttp.post<{ id: string }>('/program-director/goal-bank', {
      name: 'IUP Goal', domain: 'Communication', description: 'from IUP', masteryCriteria: '100%',
    });
    await mockHttp.post(`/program-director/iup/${created.id}/finalize`, {
      slots: { station1: [{ id: bankGoal.id, name: 'IUP Goal', domain: 'Communication' }, null], station2: [null, null] },
    });
    expect(mockDb.findById('students', created.id)?.goals.map((g) => g.id)).toContain(bankGoal.id);
    expect(await rosterIds()).toContain(created.id);

    // Clearing the goal returns the student to the not-session-ready state.
    await mockHttp.post(`/program-director/caseload/${created.id}/remove-goal`, { goalId: bankGoal.id });
    expect(await rosterIds()).not.toContain(created.id);
    // Assessment is still complete, so they remain in the IUP workflow.
    expect((await allCandidates()).map((c) => c.id)).toContain(created.id);
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
    // Enrolled students appear on the dashboard immediately (Not Started),
    // still scoped to the current therapist's assigned students.
    const { data: before } = await mockHttp.get<{
      periodLabel: string;
      stats: { total: number; completed: number; inProgress: number; notStarted: number };
      students: Array<{
        id: string;
        ablls: { status: string };
        behavior: { status: string };
        assessments: Array<{ type: string; label: string; status: string; progress: number }>;
      }>;
    }>('/teacher/assessments/dashboard');
    expect(typeof before.periodLabel).toBe('string');
    expect(before.stats.total).toBeGreaterThanOrEqual(1);
    expect(before.stats.notStarted).toBeGreaterThanOrEqual(1);
    const stuBefore = before.students.find((s) => s.id === created.id);
    expect(stuBefore?.ablls.status).toBe('Not Started');
    // Every assessment type must appear for the student, driven by the data
    // model (skills/behavior/preference/sensory) — not hard-coded pairs.
    expect(stuBefore?.assessments.map((a) => a.type)).toEqual(['skills', 'behavior', 'preference', 'sensory']);
    expect(stuBefore?.assessments.every((a) => a.status === 'Not Started')).toBe(true);

    // Saving a skills assessment flips that student's row to In Progress.
    await mockHttp.post(`/teacher/students/${created.id}/assessments/skills`, { scores: { B1: 2 } });
    const { data } = await mockHttp.get<typeof before>('/teacher/assessments/dashboard');
    expect(data.stats.total).toBe(before.stats.total);
    expect(data.stats.total).toBe(data.stats.completed + data.stats.inProgress + data.stats.notStarted);
    expect(data.students.length).toBe(data.stats.total);

    const stu1 = data.students.find((s) => s.id === created.id);
    expect(stu1?.ablls.status).toBe('In Progress');
    expect((stu1!.ablls as any).progress).toBeGreaterThan(0);
    expect(stu1?.assessments.find((a) => a.type === 'skills')?.status).toBe('In Progress');
    // Only the saved student's status changes — other students stay isolated.
    const otherBefore = before.students.find((s) => s.id !== created.id);
    const otherAfter = data.students.find((s) => s.id !== created.id);
    expect(otherAfter).toEqual(otherBefore);
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
