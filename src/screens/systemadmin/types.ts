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

export const ROLE_OPTIONS = [
  'Teacher',
  'Therapist',
  'Coordinator',
  'Director',
  'Program Director',
  'Institutional Admin',
  'System Admin',
];
