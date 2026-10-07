export const ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE'] as const;
export type ActionType = (typeof ACTIONS)[number];

export interface CatalogPermission {
  id?: string;
  action: string;
  action_label: string;
  resource: string;
  name: string;
}

export interface CatalogModule {
  id: string;
  name: string;
  description: string;
  resource: string;
  permissions: CatalogPermission[];
}

export interface PermissionRole {
  id: string;
  name: string;
  description?: string;
  is_system_critical?: boolean;
}

export type PermissionMatrix = Record<string, Record<ActionType, boolean>>;

export const blankActions = (): Record<ActionType, boolean> => ({
  VIEW: false,
  CREATE: false,
  EDIT: false,
  DELETE: false,
  APPROVE: false,
});

// 7 Predefined core system roles (Therapist and others are configured dynamically)
export const DEFAULT_SYSTEM_ROLES: PermissionRole[] = [
  { id: 'system_admin', name: 'System Administrator', is_system_critical: true },
  { id: 'institutional_admin', name: 'Institutional Administrator', is_system_critical: true },
  { id: 'director', name: 'Director' },
  { id: 'program_director', name: 'Program Director' },
  { id: 'coordinator', name: 'Therapy Coordinator' },
  { id: 'teacher', name: 'Teacher' },
  { id: 'parent', name: 'Parent' },
];

export const FALLBACK_MODULES: CatalogModule[] = [
  {
    id: 'students',
    name: 'Students / Enrollment',
    description: 'Student records, enrollment pipeline, and documents',
    resource: 'students',
    permissions: [],
  },
  {
    id: 'assessments',
    name: 'Clinical Assessments',
    description: '6-Week ABLLS skills, MASS/FAST behavior, and preference assessments',
    resource: 'assessments',
    permissions: [],
  },
  {
    id: 'iups',
    name: 'IUP & Goal Management',
    description: 'IUP generation, Goal Bank, prompt levels, and mastery checks',
    resource: 'iups',
    permissions: [],
  },
  {
    id: 'sessions',
    name: 'Daily Active Therapy',
    description: 'Session blocks, real-time trial logging, and session summaries',
    resource: 'sessions',
    permissions: [],
  },
  {
    id: 'behavior_incidents',
    name: 'Behavior & ABC Logging',
    description: 'Behavior incident recording, ABC logs, and antecedent lists',
    resource: 'behavior_incidents',
    permissions: [],
  },
  {
    id: 'staff',
    name: 'Staff & Scheduling',
    description: 'Staff accounts, teacher-student linking, and room capacity limits',
    resource: 'staff',
    permissions: [],
  },
  {
    id: 'reports',
    name: 'Reports & Oversight',
    description: 'Oversight analytics, bi-annual progress reports, and exports',
    resource: 'reports',
    permissions: [],
  },
  {
    id: 'parent_portal',
    name: 'Parent Portal',
    description: 'Guardian updates, home observations, and staff messaging',
    resource: 'parent_portal',
    permissions: [],
  },
  {
    id: 'admin',
    name: 'System & Clinical Admin',
    description: 'Role definitions, permissions configuration, and institutional settings',
    resource: 'admin',
    permissions: [],
  },
];

export const ACTION_ALIAS_MAP: Record<string, ActionType> = {
  view: 'VIEW',
  index: 'VIEW',
  show: 'VIEW',
  read: 'VIEW',
  create: 'CREATE',
  edit: 'EDIT',
  update: 'EDIT',
  manage: 'EDIT',
  delete: 'DELETE',
  destroy: 'DELETE',
  approve: 'APPROVE',
  update_status: 'APPROVE',
};

export const RESOURCE_ALIAS_MAP: Record<string, string> = {
  students: 'students',
  enrollments: 'students',
  forms: 'students',
  assessments: 'assessments',
  skills_assessments: 'assessments',
  behavior_assessments: 'assessments',
  preference_assessments: 'assessments',
  iups: 'iups',
  goals: 'iups',
  goal_domains: 'iups',
  prompt_levels: 'iups',
  sessions: 'sessions',
  trials: 'sessions',
  session_summaries: 'sessions',
  behavior_incidents: 'behavior_incidents',
  abc_lists: 'behavior_incidents',
  staff_members: 'staff',
  staff_scheduling: 'staff',
  session_block_definitions: 'staff',
  session_schedule_configs: 'staff',
  reports: 'reports',
  oversight: 'reports',
  audit_logs: 'reports',
  parent_communications: 'parent_portal',
  home_observations: 'parent_portal',
  roles: 'admin',
  clinical_configs: 'admin',
  form_configurations: 'admin',
};

export interface BackendPermission {
  id?: string;
  resource?: string;
  action?: string;
  name?: string;
}

export function toDisplayMatrix(permissions: unknown, modules: CatalogModule[]): PermissionMatrix {
  const matrix: PermissionMatrix = {};
  modules.forEach((mod) => {
    matrix[mod.name] = blankActions();
  });

  if (!Array.isArray(permissions)) return matrix;

  for (const p of permissions as BackendPermission[]) {
    const rawRes = (p.resource || '').toLowerCase();
    const rawAct = (p.action || '').toLowerCase();

    const mappedModId = RESOURCE_ALIAS_MAP[rawRes] || rawRes;
    const targetModule = modules.find(
      (m) =>
        m.id === mappedModId || m.resource === mappedModId || m.name.toLowerCase().includes(rawRes),
    );
    const targetAction = ACTION_ALIAS_MAP[rawAct];

    if (targetModule && targetAction) {
      matrix[targetModule.name] = {
        ...(matrix[targetModule.name] ?? blankActions()),
        [targetAction]: true,
      };
    }
  }

  return matrix;
}

export interface AuditEntry {
  id?: string | number;
  date?: string;
  created_at?: string;
  user?: string;
  changed_by?: string;
  resource?: string;
  action?: string;
  roleName?: string;
  metadata?: Record<string, any>;
  change_data?: Record<string, any>;
}
