import { beforeEach, describe, expect, it } from 'vitest';
import { mockHttp } from './client';
import { mockDb } from './db';
import { setAccessToken } from '../token';

const teacherToken = `demo.user-1.${Date.now().toString(36)}`;

interface SkillsAssessmentResponse {
  status?: string;
  studentId?: string;
  data?: Record<string, any>;
}

beforeEach(async () => {
  localStorage.clear();
  mockDb.reset();
  await setAccessToken(null);
});

async function loginAsTeacher() {
  await setAccessToken(teacherToken);
}

describe('skills assessment save (saved ≠ read-only)', () => {
  it('persists a completed skills assessment and returns it on later loads', async () => {
    await loginAsTeacher();
    await mockHttp.post('/teacher/students/student-a/assessments/skills', {
      status: 'completed',
      scores: { A1: 2, B1: 3 },
      notes: { A1: 'Good eye contact' },
      customFields: { Assessor: 'Rosa Delgado' },
    });

    // Re-entering the screen refetches the same permanent data with status intact.
    const { data } = await mockHttp.get<SkillsAssessmentResponse>('/teacher/students/student-a/assessments/skills');
    expect(data.status).toBe('completed');
    expect(data.data?.scores).toEqual({ A1: 2, B1: 3 });
    expect(data.data?.notes).toEqual({ A1: 'Good eye contact' });
    expect(data.data?.customFields).toEqual({ Assessor: 'Rosa Delgado' });
  });

  it('associates the saved assessment with the correct student', async () => {
    await loginAsTeacher();
    await mockHttp.post('/teacher/students/student-a/assessments/skills', {
      status: 'completed',
      scores: { A1: 2 },
    });

    const { data: other } = await mockHttp.get<SkillsAssessmentResponse>('/teacher/students/student-b/assessments/skills');
    expect(other?.studentId ?? 'student-b').toBe('student-b');
    const otherData = other?.data ?? other ?? {};
    expect((otherData as any).scores ?? {}).not.toHaveProperty('A1');
  });

  it('keeps a completed assessment editable — autosaves never hit a read-only lock', async () => {
    await loginAsTeacher();
    await mockHttp.post('/teacher/students/student-a/assessments/skills', {
      status: 'completed',
      scores: { A1: 2 },
      notes: { A1: 'Final' },
    });

    // Draft-style autosave (no status) updates the record instead of being rejected.
    await mockHttp.post('/teacher/students/student-a/assessments/skills', { scores: { A1: 4 }, notes: { A1: 'edited' } });

    const { data } = await mockHttp.get<SkillsAssessmentResponse>('/teacher/students/student-a/assessments/skills');
    expect(data.status).toBe('completed');
    expect(data.data?.scores).toEqual({ A1: 4 });
    expect(data.data?.notes).toEqual({ A1: 'edited' });
  });

  it('still stores drafts as in progress until Saved', async () => {
    await loginAsTeacher();
    await mockHttp.post('/teacher/students/student-c/assessments/skills', { scores: { C1: 1 } });
    const { data } = await mockHttp.get<SkillsAssessmentResponse>('/teacher/students/student-c/assessments/skills');
    expect(data.status).toBe('in_progress');

    // Later Save flips it to completed permanently.
    await mockHttp.post('/teacher/students/student-c/assessments/skills', {
      status: 'completed',
      scores: { C1: 1 },
    });
    const { data: after } = await mockHttp.get<SkillsAssessmentResponse>('/teacher/students/student-c/assessments/skills');
    expect(after.status).toBe('completed');
  });

  it('exposes completed assessments on the teacher assessment dashboard', async () => {
    await loginAsTeacher();
    await mockHttp.post('/teacher/students/student-a/assessments/skills', {
      status: 'completed',
      scores: { A1: 2 },
    });
    const { data } = await mockHttp.get<{ students: Array<{ id: string; ablls: { status: string } }> }>('/teacher/assessments/dashboard');
    const row = data.students.find((s) => s.id === 'student-a');
    expect(row?.ablls.status).toBe('Completed');
  });
});