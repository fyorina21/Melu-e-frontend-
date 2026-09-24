import { beforeEach, describe, expect, it } from 'vitest';
import { mockHttp } from './client';
import { mockDb } from './db';
import { setAccessToken } from '../token';

// user-1 = Rosa Delgado (staff-1) is the only seeded teacher with a login.
// user-2 = Marcus Chen (staff-2) is the coordinator login.
const teacherToken = `demo.user-1.${Date.now().toString(36)}`;
const coordinatorToken = `demo.user-2.${Date.now().toString(36)}`;

beforeEach(async () => {
  localStorage.clear();
  mockDb.reset();
  await setAccessToken(null);
});

async function loginAsTeacher() {
  await setAccessToken(teacherToken);
}

async function loginAsCoordinator() {
  await setAccessToken(coordinatorToken);
}

// Some seeded therapists (e.g. Jeah Torres) have no login user; create one on the fly
// so we can exercise the scoped endpoints as that therapist.
async function loginAs(name: string) {
  const staff = mockDb.all('staffMembers').find((s) => s.name === name);
  if (!staff) throw new Error(`No staff member named ${name}`);
  const existing = mockDb.all('users').find((u) => u.email === staff.email);
  const userId = existing?.id ?? `login-user-${name.toLowerCase().replace(/\s+/g, '-')}`;
  if (!existing) {
    mockDb.insert('users', { id: userId, name, email: staff.email, password: 'demo1234', role: 'teacher', childIds: [] });
  }
  await setAccessToken(`demo.${userId}.${Date.now().toString(36)}`);
}

describe('therapist-scoped student visibility', () => {
  it("scopes the teacher dashboard to the teacher's assigned students", async () => {
    await loginAsTeacher(); // Rosa Delgado → student-a, student-b
    const { data } = await mockHttp.get<{ todaySchedule: { students: { id: string; name: string }[] } }>('/teacher/dashboard');
    const ids = data.todaySchedule.students.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(['student-a', 'student-b']));
    expect(ids).not.toContain('student-c');
    expect(ids).not.toContain('student-d');
  });

  it('limits /options/students to the teacher while non-teachers see all', async () => {
    await loginAsTeacher();
    const teacherIds = (await mockHttp.get<Array<{ id: string }>>('/options/students')).data.map((s) => s.id).sort();
    expect(teacherIds).toEqual(['student-a', 'student-b']);

    await loginAsCoordinator();
    const coordinatorIds = (await mockHttp.get<Array<{ id: string }>>('/options/students')).data.map((s) => s.id).sort();
    expect(coordinatorIds).toEqual(['student-a', 'student-b', 'student-c']);
  });

  it('persists an enrollment assignment and surfaces the student to that therapist', async () => {
    const { data: created } = await mockHttp.post<{ id: string }>('/coordinator/students', {
      firstName: 'New',
      lastName: 'Learner',
      dateOfBirth: '2019-01-01',
      programType: 'ABA',
      therapyGroup: 'Sunrise',
      assignedTherapist: 'Jeah Torres',
    });

    const jeah = mockDb.all('staffMembers').find((s) => s.name === 'Jeah Torres');
    expect(jeah?.assignedStudents).toContain(created.id);

    await loginAs('Jeah Torres');
    const { data: dashboard } = await mockHttp.get<{ assessmentTasks: { studentName: string }[] }>('/teacher/dashboard');
    expect(dashboard.assessmentTasks.some((t) => t.studentName === 'New Learner')).toBe(true);

    const { data: assignedList } = await mockHttp.get<Array<{ id: string }>>('/coordinator/students', {
      params: { therapist: 'Jeah Torres' },
    });
    expect(assignedList.map((s) => s.id)).toContain(created.id);
  });

  it('enforces the 2-student caseload cap when assigning a therapist', async () => {
    // Rosa Delgado is already at 2/2 (student-a, student-b).
    await expect(
      mockHttp.post('/coordinator/students', {
        firstName: 'Over',
        lastName: 'Cap',
        dateOfBirth: '2019-01-01',
        programType: 'ABA',
        therapyGroup: 'Sunrise',
        assignedTherapist: 'Rosa Delgado',
      }),
    ).rejects.toMatchObject({ status: 422 });

    const rosa = mockDb.all('staffMembers').find((s) => s.name === 'Rosa Delgado');
    expect(rosa?.assignedStudents).toHaveLength(2);

    // A therapist with a free slot (Jared Cruz is 1/2) can still take another.
    const { data: created } = await mockHttp.post<{ id: string }>('/coordinator/students', {
      firstName: 'Within',
      lastName: 'Cap',
      dateOfBirth: '2019-01-01',
      programType: 'ABA',
      therapyGroup: 'Sunrise',
      assignedTherapist: 'Jared Cruz',
    });
    const jared = mockDb.all('staffMembers').find((s) => s.name === 'Jared Cruz');
    expect(jared?.assignedStudents).toEqual(['student-c', created.id]);
  });

  it('exposes each therapist caseload via /options/staff for the wizard', async () => {
    await loginAsCoordinator();
    const { data } = await mockHttp.get<Array<{ name: string; assignedStudents: string[] }>>('/options/staff');
    const byName = Object.fromEntries(data.map((s) => [s.name, s.assignedStudents]));
    expect(byName['Rosa Delgado']).toEqual(['student-a', 'student-b']);
    expect(byName['Jared Cruz']).toEqual(['student-c']);
  });

  it('scopes the session roster (SessionDataCollection) to the teacher', async () => {
    await loginAsTeacher(); // Rosa → student-a, student-b
    const { data } = await mockHttp.get<{ students: { id: string }[] }>('/sessions/active/roster');
    expect(data.students.map((s) => s.id).sort()).toEqual(['student-a', 'student-b']);

    await loginAsCoordinator();
    const { data: all } = await mockHttp.get<{ students: { id: string }[] }>('/sessions/active/roster');
    // Only session-ready students appear (assessment completed + assigned goal).
    // student-d is still in assessment with no goals, so she is not on the roster.
    expect(all.students.map((s) => s.id).sort()).toEqual(['student-a', 'student-b', 'student-c']);
  });

  it('shows all of the therapist\'s assigned students (both) on the assessment dashboard', async () => {
    await loginAsTeacher(); // Rosa → student-a, student-b
    const rosa = (await mockHttp.get<{ students: Array<{ id: string }> }>('/teacher/assessments/dashboard')).data.students.map((s) => s.id).sort();
    // Both assigned students are visible even with no assessments saved.
    expect(rosa).toEqual(['student-a', 'student-b']);

    // Assessments saved for another therapist's student must not leak in.
    await loginAs('Jared Cruz');
    await mockHttp.post('/teacher/students/student-c/assessments/skills', { scores: { B1: 3 } });
    await loginAsTeacher();
    const rosaAfter = (await mockHttp.get<{ students: Array<{ id: string }> }>('/teacher/assessments/dashboard')).data.students.map((s) => s.id).sort();
    expect(rosaAfter).toEqual(['student-a', 'student-b']);

    // A non-teacher (no assignedStudents) still sees the full roster.
    await loginAsCoordinator();
    const all = (await mockHttp.get<{ students: Array<{ id: string }> }>('/teacher/assessments/dashboard')).data.students.map((s) => s.id).sort();
    expect(all).toEqual(['student-a', 'student-b', 'student-c', 'student-d']);
  });

  it('reflects reassignment to a new therapist on both pages', async () => {
    // Enroll a fresh student under Jeah Torres (Jeah goes 1/2 → 2/2).
    const { data: created } = await mockHttp.post<{ id: string }>('/coordinator/students', {
      firstName: 'Reassign',
      lastName: 'Me',
      dateOfBirth: '2019-01-01',
      programType: 'ABA',
      therapyGroup: 'Sunrise',
      assignedTherapist: 'Jeah Torres',
    });

    // Make the student session-ready (completed assessment + assigned goal) so the
    // roster reflects the therapist change like the assessment dashboard does.
    const { data: goal } = await mockHttp.post<{ id: string }>('/program-director/goal-bank', {
      name: 'Reassign Goal',
      domain: 'Communication',
      description: 'for the reassignment roster check',
      masteryCriteria: '100%',
    });
    await mockHttp.post(`/teacher/students/${created.id}/assessments/skills`, {
      status: 'completed',
      scores: { A1: 1 },
    });
    await mockHttp.post(`/program-director/caseload/${created.id}/assign-goal`, {
      goalId: goal.id,
      station: 1,
      slot: 1,
    });

    await loginAs('Jeah Torres');
    expect((await mockHttp.get<{ students: { id: string }[] }>('/sessions/active/roster')).data.students.map((s) => s.id)).toContain(created.id);
    // Assigned students appear on the assessment dashboard immediately.
    expect((await mockHttp.get<{ students: Array<{ id: string }> }>('/teacher/assessments/dashboard')).data.students.map((s) => s.id)).toContain(created.id);

    // Reassign to Rosa Delgado (existing relationship, updated out-of-band).
    const jeahSt = mockDb.all('staffMembers').find((s) => s.name === 'Jeah Torres')!;
    const rosaSt = mockDb.all('staffMembers').find((s) => s.name === 'Rosa Delgado')!;
    mockDb.updateById('staffMembers', jeahSt.id, { assignedStudents: jeahSt.assignedStudents.filter((id) => id !== created.id) });
    mockDb.updateById('staffMembers', rosaSt.id, { assignedStudents: [...rosaSt.assignedStudents, created.id] });

    await loginAs('Jeah Torres');
    const jeahRoster = (await mockHttp.get<{ students: { id: string }[] }>('/sessions/active/roster')).data.students.map((s) => s.id);
    expect(jeahRoster).not.toContain(created.id);
    const jeahAdj = (await mockHttp.get<{ students: Array<{ id: string }> }>('/teacher/assessments/dashboard')).data.students.map((s) => s.id);
    expect(jeahAdj).not.toContain(created.id);

    await loginAsTeacher(); // Rosa
    const rosaRoster = (await mockHttp.get<{ students: { id: string }[] }>('/sessions/active/roster')).data.students.map((s) => s.id);
    expect(rosaRoster).toContain(created.id);
    const rosaAdj = (await mockHttp.get<{ students: Array<{ id: string }> }>('/teacher/assessments/dashboard')).data.students.map((s) => s.id);
    expect(rosaAdj).toContain(created.id);
  });

  it('rejects a teacher requesting another therapist\'s student profile', async () => {
    await loginAsTeacher();
    await expect(mockHttp.get('/teacher/students/student-c/profile')).rejects.toMatchObject({ status: 404 });
  });

  it('hides other therapists\' students from the teacher ABC log', async () => {
    await loginAsTeacher();
    const { data } = await mockHttp.get<{ rows: { studentId: string }[] }>('/teacher/abc-log', {
      params: { studentId: 'student-c' },
    });
    expect(data.rows).toEqual([]);
  });

  it('lists only conversations for the teacher\'s assigned students', async () => {
    await loginAsTeacher();
    const { data } = await mockHttp.get<Array<{ studentName: string }>>('/teacher/conversations');
    const names = data.map((c) => c.studentName);
    expect(names).toEqual(expect.arrayContaining(['Aiden Rivera', 'Maya Chen']));
    expect(names.length).toBe(2);
  });

  it('returns the assigned therapist and filters by therapist on the enrollment list', async () => {
    const { data } = await mockHttp.get<Array<{ id: string; therapist: string }>>('/coordinator/students');
    const byId = Object.fromEntries(data.map((s) => [s.id, s.therapist]));
    expect(byId['student-a']).toBe('Rosa Delgado');
    expect(byId['student-c']).toBe('Jared Cruz');
    expect(byId['student-d']).toBe('Jeah Torres');

    const filtered = await mockHttp.get<Array<{ id: string }>>('/coordinator/students', {
      params: { therapist: 'Jared Cruz' },
    });
    expect(filtered.data.map((s) => s.id)).toEqual(['student-c']);
  });
});