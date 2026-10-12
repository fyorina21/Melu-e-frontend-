import client from './sessionApi';
import type { QueryParams, Payload } from '../types';
import { filterOutDeletedStaff } from '../utils/deletedStaffHelper';

// SCR-SYS-001: Staff Account Management
export const getStaffAccounts = async (params: QueryParams) => {
  const res = await client.get('/sysadmin/staff', { params });
  if (Array.isArray(res?.data)) {
    return { ...res, data: filterOutDeletedStaff(res.data) };
  }
  return res;
};
export const createStaffAccount = (payload: Payload) => client.post('/sysadmin/staff', payload);
export const updateStaffAccount = (staffId: string, payload: Payload) => client.patch(`/sysadmin/staff/${staffId}`, payload);
export const deleteStaffAccount = (staffId: string) => client.delete(`/sysadmin/staff/${staffId}`);
export const resetStaffPassword = (staffId: string, newPassword?: string) => client.post(`/sysadmin/staff/${staffId}/reset-password`, { newPassword });
export const toggleStaffActive = (staffId: string, active: boolean) => client.post(`/sysadmin/staff/${staffId}/status`, { active });
export const bulkStaffAction = (staffIds: string[], action: string) => client.post('/sysadmin/staff/bulk', { staffIds, action });

// SCR-SYS-002: Role Management
export const getRoles = () => client.get('/sysadmin/roles');
export const createRole = (payload: Payload) => client.post('/sysadmin/roles', payload);
export const updateRole = (roleId: string, payload: Payload) => client.patch(`/sysadmin/roles/${roleId}`, payload);
export const deleteRole = (roleId: string) => client.delete(`/sysadmin/roles/${roleId}`);

// SCR-SYS-003: Permission Configuration (RBAC)
//
// Backend contract (roles_controller#permissions / #update_permissions):
//   GET  -> { roleId, permissions: [{ id, resource, action, name }] }
//   POST -> expects `permission_ids` (flat array of Permission UUIDs).
//           Anything else is ignored, which silently clears the role.
//   GET  -> the response is a bare array of audit entries.
//
// The screen's MODULES/ACTIONS labels do not correspond to the backend's
// `resource`/`action` taxonomy, and there is no permission catalog endpoint,
// so this layer passes values through verbatim rather than guessing a mapping.
export const getPermissionsCatalog = () => client.get('/sysadmin/permissions');
export const getPermissionMatrix = (roleId: string) => client.get(`/sysadmin/roles/${roleId}/permissions`);
export const savePermissionMatrix = (
  roleId: string,
  payload: { permission_ids?: string[]; matrix?: Record<string, Record<string, boolean>> } | string[]
) => {
  const body = Array.isArray(payload) ? { permission_ids: payload } : payload;
  return client.post(`/sysadmin/roles/${roleId}/permissions`, body);
};
export const resetDefaultPermissions = (roleId: string) =>
  client.post(`/sysadmin/roles/${roleId}/permissions/reset_default`);
export const copyPermissionsFromRole = (roleId: string, sourceRoleId: string) =>
  client.post(`/sysadmin/roles/${roleId}/permissions/copy_from`, { source_role_id: sourceRoleId });
export const getPermissionAuditTrail = (roleId: string) => client.get(`/sysadmin/roles/${roleId}/permissions/audit`);

// MR-8: Audit Logging (System Admin view)
export const getAuditLogs = (params: QueryParams) =>
  // params: { user, action, from, to, resource }
  client.get('/sysadmin/audit-logs', { params });
