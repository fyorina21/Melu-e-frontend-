// src/screens/systemadmin/roles/rolesTypes.ts

/** Shape returned by GET /api/v1/sysadmin/roles. */
export interface RoleRecord {
  id: string | number;
  name: string;
  description: string;
  is_system_critical?: boolean;
  user_count?: number;
}

/** Row model the table renders. */
export interface RoleRow {
  id: string;
  name: string;
  description: string;
  count: number;
  system: boolean;
}

export interface RoleFormData {
  name: string;
  description: string;
}

export function toRoleRow(role: RoleRecord): RoleRow {
  return {
    id: String(role.id),
    name: role.name ?? '',
    description: role.description ?? '',
    count: role.user_count ?? 0,
    system: Boolean(role.is_system_critical),
  };
}

export function parseRolesApiResponse(data: unknown): RoleRecord[] {
  if (Array.isArray(data)) return data as RoleRecord[];
  if (data && typeof data === 'object' && Array.isArray((data as any).roles)) {
    return (data as any).roles as RoleRecord[];
  }
  return [];
}

export function validateRoleInput(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'Role name is required.' };
  }
  if (trimmed.length > 50) {
    return { valid: false, error: 'Role name must be 50 characters or less.' };
  }
  return { valid: true };
}
