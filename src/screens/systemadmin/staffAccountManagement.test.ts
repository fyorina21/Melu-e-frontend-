import { describe, it, expect } from 'vitest';
import { ROLE_OPTIONS, filterStaff, type StaffMember } from './types';

describe('staffAccountManagement logic and roles', () => {
  it('enforces the 7 core predefined system roles', () => {
    expect(ROLE_OPTIONS.length).toBe(7);
    expect(ROLE_OPTIONS).toContain('Teacher');
    expect(ROLE_OPTIONS).toContain('Coordinator');
    expect(ROLE_OPTIONS).toContain('Director');
    expect(ROLE_OPTIONS).toContain('Program Director');
    expect(ROLE_OPTIONS).toContain('Institutional Admin');
    expect(ROLE_OPTIONS).toContain('System Admin');
    expect(ROLE_OPTIONS).toContain('Parent');
    // Therapist must NOT be a predefined hardcoded role:
    expect(ROLE_OPTIONS).not.toContain('Therapist');
  });

  describe('filterStaff', () => {
    const sampleStaff: StaffMember[] = [
      {
        id: 's1',
        name: 'Sarah Teacher',
        email: 'sarah@melue.org',
        phone: '1234567890',
        roles: ['Teacher'],
        active: true,
      },
      {
        id: 's2',
        name: 'Carlos Coordinator',
        email: 'carlos@melue.org',
        phone: '0987654321',
        roles: ['Coordinator'],
        active: false,
      },
      {
        id: 's3',
        name: 'Elena Therapist',
        email: 'elena@melue.org',
        phone: '1122334455',
        roles: ['Therapist'],
        active: true,
      },
    ];

    it('returns all staff when filters are default', () => {
      const result = filterStaff(sampleStaff, '', 'All', 'All');
      expect(result.length).toBe(3);
    });

    it('filters staff by role', () => {
      const result = filterStaff(sampleStaff, '', 'Teacher', 'All');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('s1');
    });

    it('filters staff by status', () => {
      const activeStaff = filterStaff(sampleStaff, '', 'All', 'Active');
      expect(activeStaff.length).toBe(2);

      const inactiveStaff = filterStaff(sampleStaff, '', 'All', 'Inactive');
      expect(inactiveStaff.length).toBe(1);
      expect(inactiveStaff[0].id).toBe('s2');
    });

    it('filters staff by search matching name or email', () => {
      const byName = filterStaff(sampleStaff, 'Carlos', 'All', 'All');
      expect(byName.length).toBe(1);
      expect(byName[0].id).toBe('s2');

      const byEmail = filterStaff(sampleStaff, 'elena@melue.org', 'All', 'All');
      expect(byEmail.length).toBe(1);
      expect(byEmail[0].id).toBe('s3');
    });

    it('filters custom dynamic roles such as Therapist without issues', () => {
      const dynamicResult = filterStaff(sampleStaff, '', 'Therapist', 'All');
      expect(dynamicResult.length).toBe(1);
      expect(dynamicResult[0].name).toBe('Elena Therapist');
    });

    it('handles null staff gracefully', () => {
      expect(filterStaff(null, 'test', 'All', 'All')).toEqual([]);
    });
  });
});
