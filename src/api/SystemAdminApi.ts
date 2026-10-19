import client from './sessionApi';
import type { QueryParams, Payload } from '../types';
import { filterOutDeletedStaff } from '../utils/deletedStaffHelper';
import { storage } from '../utils/storage';
import { FALLBACK_MODULES } from '../screens/systemadmin/permissions/permissionTypes';

// SCR-SYS-001: Staff Account Management
export const getStaffAccounts = async (params: QueryParams) => {
  try {
    const res = await client.get('/sysadmin/staff', { params });
    if (res?.data && Array.isArray(res.data)) {
      const filtered = filterOutDeletedStaff(res.data);
      storage.setJSONSync('sysadmin_staff_accounts', filtered);
      return { ...res, data: filtered };
    }
  } catch (err) {
    console.warn('getStaffAccounts network error, reading local cache if available:', err);
  }

  const cached = storage.getJSONSync<any[]>('sysadmin_staff_accounts') || [];
  return { data: filterOutDeletedStaff(cached) };
};

export const createStaffAccount = async (payload: Payload) => {
  // Let errors (e.g. 422 Unprocessable Content, duplicate email) bubble up to caller
  const res = await client.post('/sysadmin/staff', payload);
  const newStaff = res?.data;

  if (newStaff) {
    const currentList = storage.getJSONSync<any[]>('sysadmin_staff_accounts') || [];
    storage.setJSONSync('sysadmin_staff_accounts', [newStaff, ...currentList]);
  }

  return { data: newStaff };
};

export const updateStaffAccount = async (staffId: string, payload: Payload) => {
  const res = await client.patch(`/sysadmin/staff/${staffId}`, payload);
  const currentList = storage.getJSONSync<any[]>('sysadmin_staff_accounts') || [];
  const updated = currentList.map((s) =>
    s.id === staffId ? { ...s, ...payload, ...(res?.data || {}) } : s,
  );
  storage.setJSONSync('sysadmin_staff_accounts', updated);

  return { data: res?.data || { ok: true, id: staffId } };
};

export const deleteStaffAccount = async (staffId: string) => {
  await client.delete(`/sysadmin/staff/${staffId}`);

  const currentList = storage.getJSONSync<any[]>('sysadmin_staff_accounts') || [];
  const filtered = currentList.filter((s) => s.id !== staffId);
  storage.setJSONSync('sysadmin_staff_accounts', filtered);
  addAuditLogEntry({
    action: 'deleted',
    resource: `Staff Account: ${staffId}`,
  });

  return { data: { ok: true, id: staffId } };
};

export const resetStaffPassword = async (staffId: string, newPassword?: string) => {
  await client.post(`/sysadmin/staff/${staffId}/reset-password`, { newPassword });
  return { data: { ok: true, message: 'Password reset link sent to staff email' } };
};

export const toggleStaffActive = async (staffId: string, active: boolean) => {
  await client.post(`/sysadmin/staff/${staffId}/status`, { active });

  const currentList = storage.getJSONSync<any[]>('sysadmin_staff_accounts') || [];
  const updated = currentList.map((s) => (s.id === staffId ? { ...s, active } : s));
  storage.setJSONSync('sysadmin_staff_accounts', updated);

  return { data: { ok: true, id: staffId, active } };
};

export const bulkStaffAction = async (staffIds: string[], action: string) => {
  await client.post('/sysadmin/staff/bulk', { staffIds, action });

  const currentList = storage.getJSONSync<any[]>('sysadmin_staff_accounts') || [];
  const updated = currentList.map((s) => {
    if (!staffIds.includes(s.id)) return s;
    if (action.toLowerCase() === 'deactivate') return { ...s, active: false };
    if (action.toLowerCase() === 'activate') return { ...s, active: true };
    return s;
  });
  storage.setJSONSync('sysadmin_staff_accounts', updated);

  return { data: { ok: true, count: staffIds.length, action } };
};

// SCR-SYS-002: Role Management
export const getRoles = async () => {
  try {
    const res = await client.get('/sysadmin/roles');
    if (res?.data && Array.isArray(res.data)) {
      storage.setJSONSync('sysadmin_roles', res.data);
      const custom = storage.getJSONSync<any[]>('sysadmin_custom_roles') || [];
      const combined = [...res.data];
      for (const c of custom) {
        if (!combined.some((r) => r.id === c.id || r.name.toLowerCase() === c.name.toLowerCase())) {
          combined.push(c);
        }
      }
      return { data: combined };
    }
  } catch (err) {
    console.warn('getRoles network error, reading local cache:', err);
  }

  const cached = storage.getJSONSync<any[]>('sysadmin_roles') || [];
  const custom = storage.getJSONSync<any[]>('sysadmin_custom_roles') || [];
  const combined = [...cached];
  for (const c of custom) {
    if (!combined.some((r) => r.id === c.id || r.name.toLowerCase() === c.name.toLowerCase())) {
      combined.push(c);
    }
  }
  return { data: combined };
};

export const createRole = async (payload: Payload) => {
  const res = await client.post('/sysadmin/roles', payload);
  const roleRecord = res?.data || {
    id: `r-${Date.now()}`,
    name: payload.name,
    description: payload.description || '',
    permission_count: 0,
    has_permissions: false,
  };

  const custom = storage.getJSONSync<any[]>('sysadmin_custom_roles') || [];
  storage.setJSONSync('sysadmin_custom_roles', [...custom, roleRecord]);
  addAuditLogEntry({
    action: 'created',
    resource: `Role: ${roleRecord.name}`,
    newValue: roleRecord.description || 'Custom role created',
  });

  return { data: roleRecord };
};

export const updateRole = async (roleId: string, payload: Payload) => {
  const res = await client.patch(`/sysadmin/roles/${roleId}`, payload);
  const updated = res?.data;

  const custom = storage.getJSONSync<any[]>('sysadmin_custom_roles') || [];
  const nextCustom = custom.map((r) =>
    r.id === roleId ? { ...r, ...payload, ...(updated || {}) } : r,
  );
  storage.setJSONSync('sysadmin_custom_roles', nextCustom);
  addAuditLogEntry({
    action: 'updated',
    resource: `Role: ${payload.name || roleId}`,
    newValue: payload.description || 'Role details updated',
  });

  return { data: updated || { id: roleId, ...payload } };
};

export const deleteRole = async (roleId: string) => {
  await client.delete(`/sysadmin/roles/${roleId}`);

  const custom = storage.getJSONSync<any[]>('sysadmin_custom_roles') || [];
  const deleted = custom.find((r) => r.id === roleId);
  storage.setJSONSync(
    'sysadmin_custom_roles',
    custom.filter((r) => r.id !== roleId),
  );
  addAuditLogEntry({
    action: 'deleted',
    resource: `Role: ${deleted?.name || roleId}`,
  });

  return { data: { ok: true, id: roleId } };
};

// SCR-SYS-003: Permission Configuration (RBAC)
export const getPermissionCatalog = async () => {
  try {
    const res = await client.get('/sysadmin/permissions');
    if (res?.data?.modules && Array.isArray(res.data.modules) && res.data.modules.length > 0) {
      return res;
    }
    if (res?.data) return res;
  } catch {}

  return { data: { modules: FALLBACK_MODULES } };
};

export const getPermissionsCatalog = getPermissionCatalog;

export const getPermissionMatrix = async (roleId: string) => {
  try {
    const res = await client.get(`/sysadmin/roles/${roleId}/permissions`);
    if (res?.data) return res;
  } catch {}

  const savedPerms = storage.getJSONSync<string[]>(`sysadmin_perm_${roleId}`);
  const savedMatrix = storage.getJSONSync<Record<string, Record<string, boolean>>>(
    `sysadmin_perm_matrix_${roleId}`,
  );

  if (savedPerms || savedMatrix) {
    return { data: { permissions: savedPerms || [], matrix: savedMatrix || undefined } };
  }

  return { data: { permissions: [] } };
};

export const savePermissionMatrix = async (
  roleId: string,
  payload:
    | {
        permission_ids?: string[];
        matrix?: Record<string, Record<string, boolean>>;
        page_matrix?: Record<string, Record<string, boolean>>;
      }
    | string[],
) => {
  const permissionIds = Array.isArray(payload) ? payload : payload.permission_ids || [];
  const pageMatrix =
    !Array.isArray(payload) && typeof payload === 'object'
      ? payload.page_matrix || payload.matrix
      : undefined;
  const body = Array.isArray(payload) ? { permission_ids: payload } : payload;

  // Let failures propagate to caller so unsaved state is maintained
  const res = await client.post(`/sysadmin/roles/${roleId}/permissions`, body);

  // Direct ID sync
  storage.setJSONSync(`sysadmin_perm_${roleId}`, permissionIds);
  if (pageMatrix) {
    storage.setJSONSync(`sysadmin_perm_matrix_${roleId}`, pageMatrix);
  }

  // Cross-reference custom roles
  const custom = storage.getJSONSync<any[]>('sysadmin_custom_roles') || [];
  const foundRole = custom.find(
    (r) => r.id === roleId || r.name?.toLowerCase() === roleId.toLowerCase(),
  );
  const roleName = foundRole?.name || roleId;

  if (foundRole?.name) {
    storage.setJSONSync(`sysadmin_perm_${foundRole.name}`, permissionIds);
    storage.setJSONSync(`sysadmin_perm_${foundRole.name.toLowerCase()}`, permissionIds);
    if (pageMatrix) {
      storage.setJSONSync(`sysadmin_perm_matrix_${foundRole.name}`, pageMatrix);
      storage.setJSONSync(`sysadmin_perm_matrix_${foundRole.name.toLowerCase()}`, pageMatrix);
    }
  }

  // Update role metadata (has_permissions and permission_count)
  const updatedCustom = custom.map((r) =>
    r.id === roleId || r.name === roleId || r.name?.toLowerCase() === roleId.toLowerCase()
      ? { ...r, has_permissions: permissionIds.length > 0, permission_count: permissionIds.length }
      : r,
  );
  storage.setJSONSync('sysadmin_custom_roles', updatedCustom);

  // Central audit log entry
  addAuditLogEntry({
    action: 'updated',
    resource: `Role Permissions: ${roleName}`,
    newValue: `${permissionIds.length} permissions configured`,
  });

  // Role-specific audit trail
  const logs = storage.getJSONSync<any[]>(`sysadmin_perm_audit_${roleId}`) || [];
  const newLog = {
    id: `log-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    user: 'System Admin',
    action: 'Permissions updated',
    count: permissionIds.length,
  };
  storage.setJSONSync(`sysadmin_perm_audit_${roleId}`, [newLog, ...logs]);

  return res?.data ? res : { data: { ok: true, permissions: permissionIds, matrix: pageMatrix } };
};

export const resetDefaultPermissions = async (roleId: string) => {
  try {
    const res = await client.post(`/sysadmin/roles/${roleId}/permissions/reset_default`);
    if (res?.data) return res;
  } catch {
    const res = await client.post(`/sysadmin/roles/${roleId}/permissions/reset-default`);
    if (res?.data) return res;
  }

  storage.removeSync(`sysadmin_perm_${roleId}`);
  storage.removeSync(`sysadmin_perm_matrix_${roleId}`);
  return { data: { ok: true, permissions: [] } };
};

export const copyPermissionsFromRole = async (roleId: string, sourceRoleId: string) => {
  try {
    const res = await client.post(`/sysadmin/roles/${roleId}/permissions/copy_from`, {
      source_role_id: sourceRoleId,
    });
    if (res?.data) return res;
  } catch {
    const res = await client.post(`/sysadmin/roles/${roleId}/permissions/copy-from`, {
      source_role_id: sourceRoleId,
    });
    if (res?.data) return res;
  }

  const sourcePerms = storage.getJSONSync<string[]>(`sysadmin_perm_${sourceRoleId}`) || [];
  const sourceMatrix = storage.getJSONSync<any>(`sysadmin_perm_matrix_${sourceRoleId}`);
  storage.setJSONSync(`sysadmin_perm_${roleId}`, sourcePerms);
  if (sourceMatrix) {
    storage.setJSONSync(`sysadmin_perm_matrix_${roleId}`, sourceMatrix);
  }

  return { data: { ok: true, permissions: sourcePerms, matrix: sourceMatrix } };
};

export const getPermissionAuditTrail = async (roleId: string) => {
  try {
    const res = await client.get(`/sysadmin/roles/${roleId}/permissions/audit`);
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) return res;
  } catch {}

  const logs = storage.getJSONSync<any[]>(`sysadmin_perm_audit_${roleId}`);
  if (logs && logs.length > 0) {
    return { data: logs };
  }

  return { data: [] };
};

// MR-8: Audit Logging (System Admin view)
export const addAuditLogEntry = (entry: Record<string, any>) => {
  const existing = storage.getJSONSync<any[]>('sysadmin_audit_logs') || [];
  const now = new Date();
  const newEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: now.toISOString().slice(0, 10),
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    user: 'System Admin',
    action: 'updated' as const,
    ip: '192.168.1.10',
    ...entry,
  };
  storage.setJSONSync('sysadmin_audit_logs', [newEntry, ...existing]);
  return newEntry;
};

export const getAuditLogs = async (params?: QueryParams) => {
  try {
    const res = await client.get('/sysadmin/audit-logs', { params });
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      return res;
    }
  } catch {}

  const dynamic = storage.getJSONSync<any[]>('sysadmin_audit_logs') || [];

  if (!params) return { data: dynamic };

  let filtered = dynamic;
  if (typeof params.user === 'string' && params.user !== 'All') {
    filtered = filtered.filter((l) => l.user === params.user);
  }
  if (typeof params.action === 'string' && params.action !== 'All') {
    const act = params.action.toLowerCase();
    filtered = filtered.filter((l) => l.action?.toLowerCase() === act);
  }
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    const term = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (l) =>
        (l.resource || '').toLowerCase().includes(term) ||
        (l.user || '').toLowerCase().includes(term) ||
        (l.ip || '').toLowerCase().includes(term),
    );
  }

  return { data: filtered };
};
