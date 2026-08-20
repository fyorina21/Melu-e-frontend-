import { beforeEach, describe, expect, it } from 'vitest';
import { MockDatabase } from './db';
import { seed } from './seed';

describe('MockDatabase', () => {
  let db: MockDatabase;

  beforeEach(() => {
    localStorage.clear();
    db = new MockDatabase();
  });

  it('seeds every collection from the fixture data', () => {
    const snap = db.snapshot();
    expect(snap.students).toHaveLength(seed.students.length);
    expect(snap.promptLevels).toHaveLength(4);
    expect(snap.notifications.length).toBeGreaterThan(0);
    expect(snap.sensoryActivities.length).toBeGreaterThan(0);
  });

  it('persists to storage so data survives reload', () => {
    db.insert('students', {
      id: 'stu-999',
      fullName: 'New Kid',
      firstName: 'New',
      lastName: 'Kid',
      dateOfBirth: '2021-01-01',
      age: 5,
      programType: 'ABA',
      therapyGroup: 'Horizon',
      status: 'active',
      headshotUrl: null,
      currentFocusStudentGoalId: null,
      goals: [],
    });
    expect(localStorage.getItem('melue.mock.db.v1')).toContain('stu-999');

    const reloaded = new MockDatabase();
    expect(reloaded.findById('students', 'stu-999')?.fullName).toBe('New Kid');
  });

  it('updates and removes by id', () => {
    const updated = db.updateById('students', 'stu-001', { therapyGroup: 'Horizon' });
    expect(updated?.therapyGroup).toBe('Horizon');
    expect(db.findById('students', 'stu-001')?.therapyGroup).toBe('Horizon');

    expect(db.removeById('students', 'stu-002')).toBe(true);
    expect(db.findById('students', 'stu-002')).toBeUndefined();
    expect(db.removeById('students', 'missing')).toBe(false);
  });

  it('resets to the seed and clears mutations', () => {
    db.insert('students', { id: 'x-1', fullName: 'Temp' } as never);
    db.reset();
    expect(db.findById('students', 'x-1')).toBeUndefined();
    expect(db.all('students')).toHaveLength(seed.students.length);
  });

  it('falls back to seed on corrupt stored payload', () => {
    localStorage.setItem('melue.mock.db.v1', '{not-json');
    const fresh = new MockDatabase();
    expect(fresh.all('students')).toHaveLength(seed.students.length);
  });

  it('replaces the entire store atomically', () => {
    const snap = db.snapshot();
    snap.students = [];
    db.replace(snap);
    expect(db.all('students')).toHaveLength(0);
    const reloaded = new MockDatabase();
    expect(reloaded.all('students')).toHaveLength(0);
  });
});