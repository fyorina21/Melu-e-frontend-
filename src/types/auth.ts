import type { ComponentProps } from 'react';
import type { Feather } from '@expo/vector-icons';

// Icon name union for the Feather icon set (used by screens that look up
// an icon name from data rather than hard-coding it in JSX).
export type FeatherIconName = ComponentProps<typeof Feather>['name'];

export type QueryParams = Record<string, unknown>;
export type Payload = Record<string, unknown>;

export type Role =
  | 'teacher'
  | 'coordinator'
  | 'director'
  | 'program_director'
  | 'institutional_admin'
  | 'system_admin'
  | 'parent'
  | 'therapist';

export interface DemoAccount {
  role: Role;
  label: string;
  email: string;
  userName: string;
}

export interface AuthSession {
  /** The role the shell is currently rendering as. */
  role: Role;
  /** Every role granted to the user; drives the navbar role switcher. */
  roles?: Role[];
  userName: string;
  email?: string;
  modules?: string[];
  permissions?: string[];
}
