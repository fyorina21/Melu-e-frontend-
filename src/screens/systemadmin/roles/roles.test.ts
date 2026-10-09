// src/screens/systemadmin/roles/roles.test.ts

import { describe, it, expect } from 'vitest';
import { toRoleRow, parseRolesApiResponse, validateRoleInput, type RoleRecord } from './rolesTypes';

describe('rolesTypes & helpers', () => {
  describe('toRoleRow', () => {
    it('correctly maps a RoleRecord to a RoleRow', () => {
      const record: RoleRecord = {
        id: 1,
        name: 'Super Admin',
        description: 'Full system control',
        is_system_critical: true,
        user_count: 5,
      };

      const row = toRoleRow(record);
      expect(row.id).toBe('1');
      expect(row.name).toBe('Super Admin');
      expect(row.description).toBe('Full system control');
      expect(row.system).toBe(true);
      expect(row.count).toBe(5);
    });

    it('handles missing or optional fields with safe defaults', () => {
      const record: RoleRecord = {
        id: 'r-custom',
        name: 'Guest',
        description: '',
      };

      const row = toRoleRow(record);
      expect(row.id).toBe('r-custom');
      expect(row.name).toBe('Guest');
      expect(row.description).toBe('');
      expect(row.system).toBe(false);
      expect(row.count).toBe(0);
    });
  });

  describe('parseRolesApiResponse', () => {
    it('parses raw array of roles', () => {
      const data = [{ id: 1, name: 'Teacher', description: 'Instructor' }];
      const parsed = parseRolesApiResponse(data);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Teacher');
    });

    it('parses object with roles property', () => {
      const data = { roles: [{ id: 2, name: 'Coordinator', description: 'Coordinator' }] };
      const parsed = parseRolesApiResponse(data);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Coordinator');
    });

    it('returns empty array on unexpected input', () => {
      expect(parseRolesApiResponse(null)).toEqual([]);
      expect(parseRolesApiResponse(undefined)).toEqual([]);
      expect(parseRolesApiResponse('invalid')).toEqual([]);
    });
  });

  describe('validateRoleInput', () => {
    it('returns valid for normal non-empty names', () => {
      expect(validateRoleInput('Therapist').valid).toBe(true);
      expect(validateRoleInput(' Special Educator ').valid).toBe(true);
    });

    it('rejects empty or whitespace-only names', () => {
      const res = validateRoleInput('   ');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Role name is required.');
    });

    it('rejects names exceeding 50 characters', () => {
      const longName = 'A'.repeat(51);
      const res = validateRoleInput(longName);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('50 characters or less');
    });
  });
});
