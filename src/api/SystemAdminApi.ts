// api/systemAdminApi.ts
// System Administrator role - assumed contract, no real backend.

import client from './sessionApi';
import type { QueryParams, Payload } from '../types';

// SCR-SYS-001: Staff Account Management
export const getStaffAccounts = (params: QueryParams) => client.get('/sysadmin/staff', { params });
export const createStaffAccount = (payload: Payload) => client.post('/sysadmin/staff', payload);
export const updateStaffAccount = (staffId: string, payload: Payload) => client.patch(`/sysadmin/staff/${staffId}`, payload);
export const deleteStaffAccount = (staffId: string) => client.delete(`/sysadmin/staff/${staffId}`);
export const resetStaffPassword = (staffId: string) => client.post(`/sysadmin/staff/${staffId}/reset-password`);
export const toggleStaffActive = (staffId: string, active: boolean) => client.post(`/sysadmin/staff/${staffId}/status`, { active });
export const bulkStaffAction = (staffIds: string[], action: string) => client.post('/sysadmin/staff/bulk', { staffIds, action });

// SCR-SYS-002: Role Management
export const getRoles = () => client.get('/sysadmin/roles');
export const createRole = (payload: Payload) => client.post('/sysadmin/roles', payload);
export const updateRole = (roleId: string, payload: Payload) => client.patch(`/sysadmin/roles/${roleId}`, payload);
export const deleteRole = (roleId: string) => client.delete(`/sysadmin/roles/${roleId}`);

// SCR-SYS-003: Permission Configuration (RBAC)
export const getPermissionMatrix = (roleId: string) => client.get(`/sysadmin/roles/${roleId}/permissions`);
export const savePermissionMatrix = (roleId: string, matrix: Payload) => client.post(`/sysadmin/roles/${roleId}/permissions`, { matrix });
export const getPermissionAuditTrail = (roleId: string) => client.get(`/sysadmin/roles/${roleId}/permissions/audit`);

// MR-8: Audit Logging (System Admin view)
export const getAuditLogs = (params: QueryParams) =>
  // params: { user, action, from, to, resource }
  client.get('/sysadmin/audit-logs', { params });
