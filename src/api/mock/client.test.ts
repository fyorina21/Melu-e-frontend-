import { beforeEach, describe, expect, it } from 'vitest';
import { mockHttp } from './client';
import { mockDb } from './db';
import { ApiError } from '../http/errors';

beforeEach(() => {
  localStorage.clear();
  mockDb.reset();
});

// Business data is no longer pre-seeded — these helpers populate through the
// mock API exactly like the screens do.
const STU_A = { firstName: 'Test', lastName: 'Kid', dateOfBirth: '2018-01-01', programType: 'ABA', therapyGroup: 'Sunrise' };
const STU_B = { firstName: 'Second', lastName: 'Kid', dateOfBirth: '2019-01-01', programType: 'PECS', therapyGroup: 'Horizon' };

async function seedStudentsViaApi() {
  await mockHttp.post('/students', STU_A);
  await mockHttp.post('/students', STU_B);
}

describe('mock http client', () => {
  it('serves created students from the database', async () => {
    await seedStudentsViaApi();
    const { data } = await mockHttp.get<Array<{ fullName: string }>>('/students');
    expect(data.length).toBeGreaterThanOrEqual(2);
    expect(data[0].fullName).toBeDefined();
  });

  it('filters students by query params', async () => {
    await seedStudentsViaApi();
    const { data } = await mockHttp.get<Array<{ therapyGroup: string }>>('/students', {
      params: { therapyGroup: 'Sunrise' },
    });
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((s) => s.therapyGroup === 'Sunrise')).toBe(true);
  });

  it('creates a student and persists it', async () => {
    const { data: created } = await mockHttp.post<{ id: string; fullName: string }>('/students', STU_A);
    expect(created.fullName).toBe('Test Kid');
    expect(mockDb.findById('students', created.id)).toBeDefined();
    expect(localStorage.getItem('melue.mock.db.v2')).toContain('Test Kid');
  });

  it('logs a trial into the database', async () => {
    const { data } = await mockHttp.post<{ trial: { id: string; outcome: string } }>('/therapy_sessions/sess-1/trials', {
      session_participant_id: 'stu-001',
      student_goal_id: 'goal-100',
      prompt_level_id: 'pl-3',
      outcome: 'correct',
      client_event_id: 'evt-x',
    });
    expect(data.trial.outcome).toBe('correct');
    expect(mockDb.all('trials').some((t) => t.id === data.trial.id)).toBe(true);
  });

  it('starts a session and surfaces it on the dashboard', async () => {
    await seedStudentsViaApi();
    const { data: started } = await mockHttp.post<{ id: string; status: string }>('/therapy_sessions/start', {
      assignmentId: 'asn-1',
    });
    const { data: dashboard } = await mockHttp.get<{ id: string; participants: unknown[]; promptLevels: unknown[] }>(
      `/therapy_sessions/${started.id}/dashboard`,
    );
    expect(dashboard.id).toBe(started.id);
    expect(dashboard.participants.length).toBeGreaterThan(0);
    expect(dashboard.promptLevels.length).toBe(4);
  });

  it('rejects invalid credentials with status 401', async () => {
    await expect(
      mockHttp.post('/auth/login', { email: 'nobody@melue.demo', password: 'wrong' }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('accepts a provisioned demo login', async () => {
    const { data } = await mockHttp.post<{ token: string; role: string }>('/auth/login', {
      email: 'parent@melue.org',
      password: 'demo1234',
    });
    expect(data.token).toContain('demo.');
    expect(data.role).toBe('parent');
  });

  it('throws ApiError for unknown routes', async () => {
    await expect(mockHttp.get('/does/not/exist')).rejects.toBeInstanceOf(ApiError);
    await expect(mockHttp.get('/does/not/exist')).rejects.toMatchObject({ status: 404 });
  });
});
