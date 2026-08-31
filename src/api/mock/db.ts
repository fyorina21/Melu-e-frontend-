// src/api/mock/db.ts
//
// In-memory demo database backed by the storage adapter.
//
// The database is decoupled from both the http client and the screen
// components on purpose:
//   - resources (src/api/resources/*) still call `http.*`; wiring them to
//     this store is a later step.
//   - screens keep using their props/demo data today.
//
// This module only provides a persistent, typed CRUD store that the mock
// http layer (and future demo-mode wiring) can read from. Data survives
// reloads on web via localStorage and resets to the seed on `reset()`.

import { seed, type DemoUser, type DemoConversation, type SeededStudent } from './seed';
import { getMockStorage } from './storage';
import type {
  EnrollmentDraft,
  Notification,
  PromptLevel,
  SessionState,
  Trial,
  UUID,
} from '../resources/types';
import type { ParentObservation } from '../resources/parent';
import type { SensoryActivity } from '../resources/sensory';
import type { TeacherScheduleEntry, Assignment } from '../resources/staffScheduling';
import type { MasteryCheck } from '../resources/masteryChecks';

export interface MockIncident {
  id: UUID;
  studentId: string;
  sessionId?: string;
  date: string;
  time: string;
  location: string;
  behavior: string;
  behaviorDefinition: string;
  frequency: string;
  intensity: string;
  category: string;
  antecedent: string;
  consequence: string;
  notes: string;
  recordedBy: string;
  createdAt: string;
}

export interface MockSessionNote {
  id: UUID;
  sessionId: string;
  studentId: string;
  teacher: string;
  status: 'draft' | 'submitted' | 'revised' | 'approved';
  bodyMarkdown: string;
  submittedAt?: string;
  draft: boolean;
}

export interface MockSessionSummary {
  id: UUID;
  sessionId: string;
  studentIds: string[];
  station: string;
  teacher: string;
  startedAt: string;
  endedAt: string;
  status: 'pending_review' | 'approved' | 'revised_required';
  trialsTotal: number;
  trialsCorrect: number;
  independencePercent: number;
  notes: string;
  incidentCount: number;
  createdAt: string;
}

export interface MockGoal {
  id: UUID;
  name: string;
  domain: string;
  description: string;
  masteryCriteria: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface MockIup {
  id: UUID;
  studentId: string;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  goals: string[];
  customFields?: Record<string, unknown>;
  interventionStrategies: string[];
  reinforcementStrategies: string[];
  antecedentManipulations: string[];
}

export interface MockStaffMember {
  id: UUID;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  assignedStudents: string[];
}

export interface MockSysRole {
  id: UUID;
  name: string;
  description: string;
}

export type MockRole = MockSysRole;

export interface MockAuditLog {
  id: UUID;
  action: string;
  resource: string;
  resourceId: string;
  user: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface MockAttendanceRecord {
  id: UUID;
  sessionId: string;
  personId: string;
  personType: 'student' | 'therapist' | 'support_staff';
  status: 'present' | 'absent' | 'late' | 'excused';
  note?: string;
  loggedAt: string;
}

export interface MockAssessment {
  id: UUID;
  studentId: string;
  type: 'skills' | 'behavior' | 'preference' | 'sensory';
  status: 'in_progress' | 'completed' | 'submitted';
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MockAdminConfig {
  id: string;
  value: unknown;
}

export interface MockDatabaseShape {
  students: SeededStudent[];
  users: DemoUser[];
  promptLevels: PromptLevel[];
  sessions: SessionState[];
  trials: Trial[];
  notifications: Notification[];
  observations: ParentObservation[];
  sensoryActivities: SensoryActivity[];
  teacherSchedule: TeacherScheduleEntry[];
  assignments: Assignment[];
  masteryChecks: MasteryCheck[];
  enrollments: EnrollmentDraft[];
  conversations: DemoConversation[];
  incidents: MockIncident[];
  sessionNotes: MockSessionNote[];
  sessionSummaries: MockSessionSummary[];
  goalBank: MockGoal[];
  iups: MockIup[];
  staffMembers: MockStaffMember[];
  sysRoles: MockRole[];
  auditLogs: MockAuditLog[];
  adminConfigs: MockAdminConfig[];
  attendanceRecords: MockAttendanceRecord[];
  assessments: MockAssessment[];
}

type CollectionName = keyof MockDatabaseShape;
type MockItem = MockDatabaseShape[CollectionName][number];

const DB_KEY = 'melue.mock.db.v2';

function cloneSeed(): MockDatabaseShape {
  return {
    students: seed.students.map((s) => ({ ...s, goals: s.goals.map((g) => ({ ...g })) })),
    promptLevels: seed.promptLevels.map((p) => ({ ...p })),
    sessions: [],
    trials: seed.trials.map((t) => ({ ...t })),
    notifications: seed.notifications.map((n) => ({ ...n })),
    observations: seed.observations.map((o) => ({ ...o })),
    sensoryActivities: seed.sensoryActivities.map((s) => ({ ...s })),
    teacherSchedule: seed.teacherSchedule.map((s) => ({ ...s })),
    assignments: seed.assignments.map((a) => ({ ...a, studentIds: [...a.studentIds] })),
    masteryChecks: seed.masteryChecks.map((m) => ({ ...m })),
    enrollments: seed.enrollments.map((e) => ({ ...e, data: JSON.parse(JSON.stringify(e.data)) })),
    users: seed.users.map((u) => ({ ...u, childIds: [...u.childIds] })),
    conversations: seed.conversations.map((c) => ({
      ...c,
      messages: c.messages.map((m) => ({ ...m })),
    })),
    incidents: seed.incidents.map((i) => ({ ...i })),
    sessionNotes: seed.sessionNotes.map((n) => ({
      ...n,
      status: n.status as 'draft' | 'submitted' | 'revised' | 'approved',
    })),
    sessionSummaries: seed.sessionSummaries.map((s) => ({
      ...s,
      status: s.status as 'pending_review' | 'approved' | 'revised_required',
    })),
    goalBank: seed.goalBank.map((g) => ({
      ...g,
      status: g.status as 'active' | 'inactive',
    })),
    iups: seed.iups.map((i) => ({
      ...i,
      status: i.status as 'draft' | 'active' | 'archived',
    })),
    staffMembers: seed.staffMembers.map((s) => ({
      ...s,
      status: s.status as 'active' | 'inactive',
    })),
    sysRoles: seed.sysRoles.map((r) => ({ ...r })),
    auditLogs: [],
    adminConfigs: Object.entries(seed.adminConfigs).map(([id, value]) => ({ id, value: value as any })),
    attendanceRecords: [],
    assessments: [],
  };
}

function toRows(collection: MockItem[]): Array<Record<string, unknown>> {
  return collection as unknown as Array<Record<string, unknown>>;
}

export class MockDatabase {
  private data: MockDatabaseShape;
  private readonly storage = getMockStorage();

  constructor() {
    this.data = this.load();
  }

  // ---- Serialization ----

  load(): MockDatabaseShape {
    const raw = this.storage.getItem(DB_KEY);
    if (raw == null) return cloneSeed();
    try {
      const parsed = JSON.parse(raw) as Partial<MockDatabaseShape>;
      const merged = cloneSeed();
      for (const key of Object.keys(merged) as CollectionName[]) {
        if (Array.isArray(parsed[key])) (merged[key] as unknown[]) = parsed[key] as unknown[];
      }
      return merged;
    } catch {
      // Corrupt payload: fall back to seed.
      return cloneSeed();
    }
  }

  persist(): void {
    try {
      this.storage.setItem(DB_KEY, JSON.stringify(this.data));
    } catch {
      // Storage quota / serialization failures are non-fatal in demo mode.
    }
  }

  /** Restore every collection to the deterministic seed. */
  reset(): MockDatabaseShape {
    this.data = cloneSeed();
    this.persist();
    return this.data;
  }

  /** Replace the whole store atomically and persist. */
  replace(next: MockDatabaseShape): MockDatabaseShape {
    this.data = JSON.parse(JSON.stringify(next)) as MockDatabaseShape;
    this.persist();
    return this.data;
  }

  snapshot(): MockDatabaseShape {
    return this.data;
  }

  // ---- Generic collection access (typed per caller) ----

  all<K extends CollectionName>(collection: K): MockDatabaseShape[K] {
    return this.data[collection];
  }

  findById<K extends CollectionName>(collection: K, id: string): MockDatabaseShape[K][number] | undefined {
    const row = toRows(this.data[collection]).find((item) => item.id === id);
    return (row ?? undefined) as MockDatabaseShape[K][number] | undefined;
  }

  insert<K extends CollectionName>(collection: K, item: MockDatabaseShape[K][number]): void {
    toRows(this.data[collection]).push(item as unknown as Record<string, unknown>);
    this.persist();
  }

  updateById<K extends CollectionName>(
    collection: K,
    id: string,
    patch: Partial<MockDatabaseShape[K][number]>,
  ): MockDatabaseShape[K][number] | undefined {
    const rows = toRows(this.data[collection]);
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) return undefined;
    const merged: Record<string, unknown> = {
      ...rows[index],
      ...JSON.parse(JSON.stringify(patch)),
    };
    rows[index] = merged;
    this.persist();
    return merged as unknown as MockDatabaseShape[K][number];
  }

  removeById<K extends CollectionName>(collection: K, id: string): boolean {
    const rows = toRows(this.data[collection]);
    const before = rows.length;
    const next = rows.filter((row) => row.id !== id);
    if (next.length !== before) {
      this.data[collection] = next as unknown as MockDatabaseShape[K];
      this.persist();
      return true;
    }
    return false;
  }
}

/** Shared singleton instance for the whole app. */
export const mockDb = new MockDatabase();