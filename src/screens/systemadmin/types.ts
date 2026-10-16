export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
  active: boolean;
}

export type LinkStation = '1' | '2';
export type LinkRoom = 1 | 2 | 3 | 4;

export const LINK_ROOMS = [1, 2, 3, 4] as const;
export const TEACHER_CAPACITY = 2;

export interface LinkStudent {
  id: string;
  name: string;
  group: string;
  program: 'regular' | 'pooled-out';
}

export interface TeacherLinkAssignment {
  teacherId: string;
  teacherName: string;
  station: LinkStation;
  room: LinkRoom;
  students: string[];
}

export type StaffPayload = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  roles: string[];
  active: boolean;
};

export interface RoleMeta {
  has_permissions?: boolean;
  permission_count?: number;
}

/**
 * The 7 predefined core system roles.
 * Custom roles (e.g. Therapist) are not hardcoded and can be configured within the app.
 */
export const ROLE_OPTIONS = [
  'Teacher',
  'Coordinator',
  'Director',
  'Program Director',
  'Institutional Admin',
  'System Admin',
  'Parent',
] as const;

export function getSafeStaffRoles(staff: StaffMember | any): string[] {
  if (!staff) return [];
  if (Array.isArray(staff.roles) && staff.roles.length > 0) {
    return staff.roles;
  }
  if (staff.role) {
    return [staff.role];
  }
  return [];
}

export function filterStaff(
  staff: StaffMember[] | null,
  search: string,
  roleFilter: string,
  statusFilter: string,
): StaffMember[] {
  if (!staff) return [];
  const term = search.trim().toLowerCase();
  const normalizedRoleFilter = roleFilter.trim().toLowerCase();

  return staff.filter((s) => {
    const safeRoles = getSafeStaffRoles(s);
    if (roleFilter !== 'All') {
      const hasMatchingRole = safeRoles.some(
        (r) => r.trim().toLowerCase() === normalizedRoleFilter,
      );
      if (!hasMatchingRole) return false;
    }
    if (statusFilter !== 'All' && (statusFilter === 'Active') !== s.active) return false;
    if (term) {
      const matchName = (s.name || '').toLowerCase().includes(term);
      const matchEmail = (s.email || '').toLowerCase().includes(term);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });
}
