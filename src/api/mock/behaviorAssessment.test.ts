import { beforeEach, describe, expect, it } from 'vitest';
import { mockHttp } from './client';
import { mockDb } from './db';
import { setAccessToken } from '../token';

const teacherToken = `demo.user-1.${Date.now().toString(36)}`;

interface BehaviorAssessmentResponse {
  status?: string;
  studentId?: string;
  data?: {
    massAnswers?: Record<string, string>;
    fastAnswers?: Record<string, boolean>;
    records?: Array<Record<string, unknown>>;
  };
}

beforeEach(async () => {
  localStorage.clear();
  mockDb.reset();
  await setAccessToken(null);
});

async function loginAsTeacher() {
  await setAccessToken(teacherToken);
}

function countBehaviorAssessments(studentId: string): number {
  return mockDb
    .all('assessments')
    .filter((a) => a.studentId === studentId && a.type === 'behavior').length;
}

describe('behavior assessment save (shared, saved ≠ read-only)', () => {
  it('persists a behavior assessment for the selected student and returns it later', async () => {
    await loginAsTeacher();
    await mockHttp.post('/teacher/students/student-a/assessments/behavior', {
      massAnswers: { M1: 'Always', M2: 'Usually' },
      fastAnswers: { F1: true },
      records: [{ id: 'r1', behavior: 'Tantrum', frequency: '3 times', intensity: 'High' }],
    });

    const { data } = await mockHttp.get<BehaviorAssessmentResponse>(
      '/teacher/students/student-a/assessments/behavior'
    );
    expect(data.data?.massAnswers).toEqual({ M1: 'Always', M2: 'Usually' });
    expect(data.data?.fastAnswers).toEqual({ F1: true });
    expect(data.data?.records).toHaveLength(1);
  });

  it('updates the existing assessment instead of creating a duplicate', async () => {
    await loginAsTeacher();
    await mockHttp.post('/teacher/students/student-a/assessments/behavior', {
      massAnswers: { M1: 'Never' },
    });
    await mockHttp.post('/teacher/students/student-a/assessments/behavior', {
      massAnswers: { M1: 'Always' },
    });

    expect(countBehaviorAssessments('student-a')).toBe(1);

    const { data } = await mockHttp.get<BehaviorAssessmentResponse>(
      '/teacher/students/student-a/assessments/behavior'
    );
    expect(data.data?.massAnswers).toEqual({ M1: 'Always' });
  });

  it('keeps Student A and Student B data separate', async () => {
    await loginAsTeacher();
    await mockHttp.post('/teacher/students/student-a/assessments/behavior', {
      massAnswers: { M1: 'Always' },
    });

    const { data: other } = await mockHttp.get<BehaviorAssessmentResponse>(
      '/teacher/students/student-b/assessments/behavior'
    );
    expect((other.data?.massAnswers ?? {}) as Record<string, string>).not.toEqual({ M1: 'Always' });
    expect(other.data?.massAnswers?.M1).toBeUndefined();
  });

  it('returns the newest version after each save and stays editable', async () => {
    await loginAsTeacher();
    await mockHttp.post('/teacher/students/student-a/assessments/behavior', {
      fastAnswers: { F1: true },
      records: [{ id: 'r1', behavior: 'Aggression', frequency: '1 time', intensity: 'Low' }],
    });
    await mockHttp.post('/teacher/students/student-a/assessments/behavior', {
      fastAnswers: { F1: true, F2: true },
      records: [
        { id: 'r1', behavior: 'Aggression', frequency: '2 times', intensity: 'Medium' },
        { id: 'r2', behavior: 'Elopement', frequency: '1 time', intensity: 'High' },
      ],
    });

    expect(countBehaviorAssessments('student-a')).toBe(1);
    const { data } = await mockHttp.get<BehaviorAssessmentResponse>(
      '/teacher/students/student-a/assessments/behavior'
    );
    expect(data.data?.fastAnswers).toEqual({ F1: true, F2: true });
    expect(data.data?.records).toHaveLength(2);
  });

  it('persists draft assessments as in_progress and keeps draftRecord intact', async () => {
    await loginAsTeacher();
    await mockHttp.post('/teacher/students/student-a/assessments/behavior', {
      tab: 'ABC',
      massAnswers: { M1: 'Sometimes' },
      records: [],
      draftRecord: {
        id: '',
        behavior: 'Tantrum',
        frequency: '2 times',
        duration: '5 mins',
        intensity: 'Medium',
        trigger: 'Transitions',
        consequence: 'Redirection',
      },
    });

    const { data } = await mockHttp.get<BehaviorAssessmentResponse>(
      '/teacher/students/student-a/assessments/behavior'
    );
    expect(data.status).toBe('in_progress');
    expect((data.data as any)?.draftRecord?.behavior).toBe('Tantrum');
    expect((data.data as any)?.draftRecord?.frequency).toBe('2 times');
  });

  it('submits assessment with submitted status and remains editable on subsequent save', async () => {
    await loginAsTeacher();
    // Save draft first
    await mockHttp.post('/teacher/students/student-a/assessments/behavior', {
      massAnswers: { M1: 'Usually' },
    });

    // Submit assessment
    await mockHttp.post('/teacher/students/student-a/assessments/behavior', {
      status: 'submitted',
      massAnswers: { M1: 'Usually', M2: 'Always' },
    });

    let res = await mockHttp.get<BehaviorAssessmentResponse>(
      '/teacher/students/student-a/assessments/behavior'
    );
    expect(res.data.status).toBe('submitted');
    expect(res.data.data?.massAnswers?.M2).toBe('Always');

    // Edit and save again — status remains submitted/final and updates properly without duplicating
    await mockHttp.post('/teacher/students/student-a/assessments/behavior', {
      massAnswers: { M1: 'Always', M2: 'Always' },
      records: [{ id: 'r1', behavior: 'Aggression', frequency: '1 time', intensity: 'Low' }],
    });

    expect(countBehaviorAssessments('student-a')).toBe(1);
    res = await mockHttp.get<BehaviorAssessmentResponse>(
      '/teacher/students/student-a/assessments/behavior'
    );
    expect(res.data.status).toBe('submitted');
    expect(res.data.data?.massAnswers?.M1).toBe('Always');
    expect(res.data.data?.records).toHaveLength(1);
  });

  it('returns empty data structure for unassessed students (No behavior assessment recorded yet)', async () => {
    await loginAsTeacher();
    const { data } = await mockHttp.get<BehaviorAssessmentResponse>(
      '/teacher/students/student-d/assessments/behavior'
    );
    expect(data.studentId).toBe('student-d');
    expect(data.data?.massAnswers).toBeUndefined();
    expect(data.data?.records).toBeUndefined();
    expect(countBehaviorAssessments('student-d')).toBe(0);
  });
});
