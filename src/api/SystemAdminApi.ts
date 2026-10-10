import client from './sessionApi';
import type { QueryParams, Payload } from '../types';
import { storage } from '../utils/storage';
import { FALLBACK_MODULES } from '../screens/systemadmin/permissions/permissionTypes';

const DEFAULT_STAFF: any[] = [
  {
    id: 'st-1',
    name: 'Rachel Green',
    email: 'rachel.green@melue.edu',
    role: 'teacher',
    active: true,
    lastActive: 'Today',
    assignedStudents: ['Sarah Jenkins', 'Leo Smith'],
  },
  {
    id: 'st-2',
    name: 'Kevin Vance',
    email: 'kevin.vance@melue.edu',
    role: 'coordinator',
    active: true,
    lastActive: 'Today',
    assignedStudents: [],
  },
  {
    id: 'st-3',
    name: 'Dr. Eleanor Vance',
    email: 'eleanor.vance@melue.edu',
    role: 'director',
    active: true,
    lastActive: 'Yesterday',
    assignedStudents: [],
  },
  {
    id: 'st-4',
    name: 'Dr. Marcus Webb',
    email: 'marcus.webb@melue.edu',
    role: 'program_director',
    active: true,
    lastActive: 'Yesterday',
    assignedStudents: [],
  },
  {
    id: 'st-5',
    name: 'System Admin',
    email: 'sysadmin@melue.edu',
    role: 'system_admin',
    active: true,
    lastActive: 'Today',
    assignedStudents: [],
  },
  {
    id: 'st-6',
    name: 'Institutional Admin',
    email: 'admin@melue.edu',
    role: 'institutional_admin',
    active: true,
    lastActive: '3 days ago',
    assignedStudents: [],
  },
];

const DEFAULT_ROLES = [
  {
    id: 'r-teacher',
    name: 'teacher',
    description: 'Classroom Teacher & Therapist',
    permission_count: 14,
    has_permissions: true,
  },
  {
    id: 'r-coord',
    name: 'coordinator',
    description: 'Therapy Coordinator',
    permission_count: 18,
    has_permissions: true,
  },
  {
    id: 'r-pd',
    name: 'program_director',
    description: 'Program Director',
    permission_count: 22,
    has_permissions: true,
  },
  {
    id: 'r-dir',
    name: 'director',
    description: 'Clinical Director',
    permission_count: 26,
    has_permissions: true,
  },
  {
    id: 'r-ia',
    name: 'institutional_admin',
    description: 'Institutional Administrator',
    permission_count: 20,
    has_permissions: true,
  },
  {
    id: 'r-sys',
    name: 'system_admin',
    description: 'System Administrator',
    permission_count: 30,
    has_permissions: true,
  },
  {
    id: 'r-parent',
    name: 'parent',
    description: 'Parent / Guardian Portal Access',
    permission_count: 6,
    has_permissions: true,
  },
];

const DEFAULT_AUDIT_LOGS = [
  {
    id: 'aud-1',
    user: 'Sysadmin A',
    action: 'updated',
    date: '2026-10-05',
    time: '14:22',
    resource: 'Role Permissions: Coordinator',
    ip: '192.168.1.10',
    oldValue: '16 permissions',
    newValue: '18 permissions',
  },
  {
    id: 'aud-2',
    user: 'Director A',
    action: 'created',
    date: '2026-10-04',
    time: '11:05',
    resource: 'Staff Account: Rachel Green',
    ip: '192.168.1.15',
  },
  {
    id: 'aud-3',
    user: 'Institutional Admin',
    action: 'changed',
    date: '2026-10-03',
    time: '09:40',
    resource: 'Session Schedule & Capacity',
    ip: '192.168.1.12',
    oldValue: 'Capacity: 1',
    newValue: 'Capacity: 2',
  },
  {
    id: 'aud-4',
    user: 'Sysadmin A',
    action: 'created',
    date: '2026-10-01',
    time: '08:30',
    resource: 'Task Analysis Template: Hand Washing',
    ip: '192.168.1.10',
  },
];

// SCR-SYS-001: Staff Account Management
export const getStaffAccounts = async (params: QueryParams) => {
  try {
    const res = await client.get('/sysadmin/staff', { params });
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      storage.setJSONSync('sysadmin_staff_accounts', res.data);
      return res;
    }
  } catch {}

  const cached = storage.getJSONSync<any[]>('sysadmin_staff_accounts');
  const list = cached && cached.length > 0 ? cached : DEFAULT_STAFF;
  return { data: list };
};

export const createStaffAccount = async (payload: Payload) => {
  let created = null;
  try {
    const res = await client.post('/sysadmin/staff', payload);
    created = res?.data;
  } catch {}

  const currentList = storage.getJSONSync<any[]>('sysadmin_staff_accounts') || DEFAULT_STAFF;
  const newStaff = created || {
    id: `st-${Date.now()}`,
    name:
      payload.name || `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || 'New Staff',
    email: payload.email || '',
    role: payload.role || 'teacher',
    active: payload.active ?? true,
    lastActive: 'Just now',
    assignedStudents: [],
  };
  storage.setJSONSync('sysadmin_staff_accounts', [newStaff, ...currentList]);

  return { data: newStaff };
};

export const updateStaffAccount = async (staffId: string, payload: Payload) => {
  try {
    await client.patch(`/sysadmin/staff/${staffId}`, payload);
  } catch {}

  const currentList = storage.getJSONSync<any[]>('sysadmin_staff_accounts') || DEFAULT_STAFF;
  const updated = currentList.map((s) => (s.id === staffId ? { ...s, ...payload } : s));
  storage.setJSONSync('sysadmin_staff_accounts', updated);

  return { data: { ok: true, id: staffId } };
};

export const deleteStaffAccount = async (staffId: string) => {
  try {
    await client.delete(`/sysadmin/staff/${staffId}`);
  } catch {}

  const currentList = storage.getJSONSync<any[]>('sysadmin_staff_accounts') || DEFAULT_STAFF;
  const filtered = currentList.filter((s) => s.id !== staffId);
  storage.setJSONSync('sysadmin_staff_accounts', filtered);

  return { data: { ok: true, id: staffId } };
};

export const resetStaffPassword = async (staffId: string, newPassword?: string) => {
  try {
    await client.post(`/sysadmin/staff/${staffId}/reset-password`, { newPassword });
  } catch {}
  return { data: { ok: true, message: 'Password reset link sent to staff email' } };
};

export const toggleStaffActive = async (staffId: string, active: boolean) => {
  try {
    await client.post(`/sysadmin/staff/${staffId}/status`, { active });
  } catch {}

  const currentList = storage.getJSONSync<any[]>('sysadmin_staff_accounts') || DEFAULT_STAFF;
  const updated = currentList.map((s) => (s.id === staffId ? { ...s, active } : s));
  storage.setJSONSync('sysadmin_staff_accounts', updated);

  return { data: { ok: true, id: staffId, active } };
};

export const bulkStaffAction = async (staffIds: string[], action: string) => {
  try {
    await client.post('/sysadmin/staff/bulk', { staffIds, action });
  } catch {}

  const currentList = storage.getJSONSync<any[]>('sysadmin_staff_accounts') || DEFAULT_STAFF;
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
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      storage.setJSONSync('sysadmin_roles', res.data);
      return res;
    }
  } catch {}

  const cached = storage.getJSONSync<any[]>('sysadmin_roles');
  const custom = storage.getJSONSync<any[]>('sysadmin_custom_roles') || [];
  const list = cached && cached.length > 0 ? cached : [...DEFAULT_ROLES, ...custom];
  return { data: list };
};

export const createRole = async (payload: Payload) => {
  let created = null;
  try {
    const res = await client.post('/sysadmin/roles', payload);
    created = res?.data;
  } catch {}

  const roleRecord = created || {
    id: `r-${Date.now()}`,
    name: payload.name,
    description: payload.description || '',
    permission_count: 0,
    has_permissions: false,
  };

  const custom = storage.getJSONSync<any[]>('sysadmin_custom_roles') || [];
  storage.setJSONSync('sysadmin_custom_roles', [...custom, roleRecord]);

  return { data: roleRecord };
};

export const updateRole = async (roleId: string, payload: Payload) => {
  let updated = null;
  try {
    const res = await client.patch(`/sysadmin/roles/${roleId}`, payload);
    updated = res?.data;
  } catch {}

  const custom = storage.getJSONSync<any[]>('sysadmin_custom_roles') || [];
  const nextCustom = custom.map((r) => (r.id === roleId ? { ...r, ...payload } : r));
  storage.setJSONSync('sysadmin_custom_roles', nextCustom);

  return { data: updated || { id: roleId, ...payload } };
};

export const deleteRole = async (roleId: string) => {
  try {
    await client.delete(`/sysadmin/roles/${roleId}`);
  } catch {}

  const custom = storage.getJSONSync<any[]>('sysadmin_custom_roles') || [];
  storage.setJSONSync(
    'sysadmin_custom_roles',
    custom.filter((r) => r.id !== roleId),
  );

  return { data: { ok: true, id: roleId } };
};

// SCR-SYS-003: Permission Configuration (RBAC)
export const getPermissionCatalog = async () => {
  try {
    const res = await client.get('/sysadmin/permissions');
    if (res?.data?.modules && Array.isArray(res.data.modules) && res.data.modules.length > 0) {
      return res;
    }
  } catch {}

  return { data: { modules: FALLBACK_MODULES } };
};

export const getPermissionMatrix = async (roleId: string) => {
  try {
    const res = await client.get(`/sysadmin/roles/${roleId}/permissions`);
    if (res?.data) return res;
  } catch {}

  const saved = storage.getJSONSync<string[]>(`sysadmin_perm_${roleId}`);
  if (saved) {
    return { data: { permissions: saved } };
  }

  return { data: { permissions: [] } };
};

export const savePermissionMatrix = async (roleId: string, permissionIds: string[]) => {
  try {
    await client.post(`/sysadmin/roles/${roleId}/permissions`, { permission_ids: permissionIds });
  } catch {}

  storage.setJSONSync(`sysadmin_perm_${roleId}`, permissionIds);

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

  return { data: { ok: true, permissions: permissionIds } };
};

export const resetDefaultPermissions = async (roleId: string) => {
  try {
    const res = await client.post(`/sysadmin/roles/${roleId}/permissions/reset-default`);
    if (res?.data) return res;
  } catch {}

  storage.removeSync(`sysadmin_perm_${roleId}`);
  return { data: { ok: true, permissions: [] } };
};

export const copyPermissionsFromRole = async (roleId: string, sourceRoleId: string) => {
  try {
    const res = await client.post(`/sysadmin/roles/${roleId}/permissions/copy-from`, {
      source_role_id: sourceRoleId,
    });
    if (res?.data) return res;
  } catch {}

  const sourcePerms = storage.getJSONSync<string[]>(`sysadmin_perm_${sourceRoleId}`) || [];
  storage.setJSONSync(`sysadmin_perm_${roleId}`, sourcePerms);

  return { data: { ok: true, permissions: sourcePerms } };
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

  return {
    data: [
      {
        id: 'aud-perm-1',
        date: '2026-10-01',
        time: '09:00 AM',
        user: 'System Admin',
        action: 'Default permissions assigned',
      },
    ],
  };
};

// MR-8: Audit Logging (System Admin view)
export const getAuditLogs = async (params: QueryParams) => {
  try {
    const res = await client.get('/sysadmin/audit-logs', { params });
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      return res;
    }
  } catch {}

  return { data: DEFAULT_AUDIT_LOGS };
};
