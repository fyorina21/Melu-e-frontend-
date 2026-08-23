import { beforeEach, describe, expect, it } from 'vitest';
import { MockDatabase } from './db';
import { seed } from './seed';
import type { SeededStudent } from './seed';

const DB_KEY = 'melue.mock.db.v2';

function makeStudent(overrides: Partial<SeededStudent> = {}): SeededStudent {
  return {
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
    ...overrides,
  };
}

describe('MockDatabase', () => {
  let db: MockDatabase;

  beforeEach(() => {
    localStorage.clear();
    db = new MockDatabase();
  });

  it('starts with seeded business data and system collections provisioned', () => {
    const snap = db.snapshot();
    // Business collections are pre-seeded so demo screens always have data.
    expect(snap.students.length).toBeGreaterThan(0);
    expect(snap.incidents.length).toBeGreaterThan(0);
    expect(snap.staffMembers.length).toBeGreaterThan(0);
    expect(snap.goalBank).toHaveLength(0);
    expect(snap.conversations).toHaveLength(0);
    expect(snap.notifications).toHaveLength(0);
    // System collections the app cannot run without.
    expect(snap.promptLevels).toHaveLength(seed.promptLevels.length);
    expect(snap.users).toHaveLength(seed.users.length);
    expect(snap.sysRoles.length).toBeGreaterThan(0);
  });

  it('persists to storage so data survives reload', () => {
    db.insert('students', makeStudent());
    expect(localStorage.getItem(DB_KEY)).toContain('stu-999');

    const reloaded = new MockDatabase();
    expect(reloaded.findById('students', 'stu-999')?.fullName).toBe('New Kid');
  });

  it('updates and removes by id', () => {
    db.insert('students', makeStudent({ id: 'stu-a' }));
    db.insert('students', makeStudent({ id: 'stu-b', therapyGroup: 'Sunrise' }));

    const updated = db.updateById('students', 'stu-a', { therapyGroup: 'Horizon2' });
    expect(updated?.therapyGroup).toBe('Horizon2');
    expect(db.findById('students', 'stu-a')?.therapyGroup).toBe('Horizon2');

    expect(db.removeById('students', 'stu-b')).toBe(true);
    expect(db.findById('students', 'stu-b')).toBeUndefined();
    expect(db.removeById('students', 'missing')).toBe(false);
  });

  it('resets to the (empty) baseline and clears mutations', () => {
    db.insert('students', makeStudent({ id: 'x-1' }));
    db.reset();
    expect(db.findById('students', 'x-1')).toBeUndefined();
    expect(db.all('students')).toHaveLength(seed.students.length);
  });

  it('falls back to the baseline on corrupt stored payload', () => {
    localStorage.setItem(DB_KEY, '{not-json');
    const fresh = new MockDatabase();
    expect(fresh.all('students').length).toBeGreaterThan(0);
    expect(fresh.all('users').length).toBeGreaterThan(0);
  });

  it('replaces the entire store atomically', () => {
    db.insert('students', makeStudent({ id: 'stu-keep' }));
    const snap = db.snapshot();
    snap.students = [];
    db.replace(snap);
    expect(db.all('students')).toHaveLength(0);
    const reloaded = new MockDatabase();
    expect(reloaded.all('students')).toHaveLength(0);
  });
});
