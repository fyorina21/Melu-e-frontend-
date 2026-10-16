import type { ComponentProps } from 'react';
import type { Feather } from '@expo/vector-icons';

// Icon name union for the Feather icon set (used by screens that look up
// an icon name from data rather than hard-coding it in JSX).
export type FeatherIconName = ComponentProps<typeof Feather>['name'];

export type QueryParams = Record<string, unknown>;
export type Payload = Record<string, unknown>;

/**
 * The 7 core predefined roles in MELUE.
 * Other specialized roles (e.g., therapist, speech_therapist, behavior_analyst)
 * are configurable within the application.
 */
export type PredefinedRole =
  | 'teacher'
  | 'coordinator'
  | 'director'
  | 'program_director'
  | 'institutional_admin'
  | 'system_admin'
  | 'parent';

/**
 * Role type allows the 7 core predefined roles with autocomplete,
 * while seamlessly accepting any configured/custom role strings from the backend.
 */
export type Role = PredefinedRole | (string & {});

export interface DemoAccount {
  role: Role;
  label: string;
  email: string;
  userName: string;
}

export type ActionKey = 'view' | 'create' | 'edit' | 'delete' | 'approve';

/** resource → Set of granted actions */
export type PermissionMap = Record<string, Set<ActionKey>>;

export type ModuleId =
  | 'students'
  | 'assessments'
  | 'iups'
  | 'sessions'
  | 'behavior_incidents'
  | 'staff'
  | 'reports'
  | 'parent_portal'
  | 'admin';

export interface AuthSession {
  /** The role the shell is currently rendering as. */
  role: Role;
  /** Every role granted to the user; drives the navbar role switcher. */
  roles?: Role[];
  userName: string;
  email?: string;
  userId?: string;
  homeRoute?: string;
  modules?: string[];
  /** Raw permission strings from backend, e.g. ["sessions:view", "assessments:create"] */
  permissions?: string[];
  /** Parsed permission map, built from `permissions` on login/restore. */
  permissionMap?: PermissionMap;
}
