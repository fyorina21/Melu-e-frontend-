// src/api/mock/seed.ts
//
// Deterministic baseline data for the demo database.
//
// Business data (students, incidents, notes, summaries, goal bank, IUPs,
// staff, conversations, observations, ...) intentionally starts EMPTY so
// every record in demo mode comes from real actions through the mock API
// (screen flows or POST requests).
//
// Only three system collections are pre-provisioned because the app cannot
// function without them:
//   - users        → without an account nobody can pass /auth/login
//   - promptLevels → the trial-entry buttons on SCR-002 render from these
//   - sysRoles     → RBAC permission screen needs roles to configure

import type {
  EnrollmentDraft,
  ISODateTimeString,
  Notification,
  PromptLevel,
} from '../resources/types';
import type { ParentObservation } from '../resources/parent';
import type { SensoryActivity } from '../resources/sensory';
import type { TeacherScheduleEntry, Assignment } from '../resources/staffScheduling';
import type { MasteryCheck } from '../resources/masteryChecks';

export interface SeededStudent {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  programType: string;
  therapyGroup: string;
  status: string;
  headshotUrl: string | null;
  currentFocusStudentGoalId: string | null;
  goals: Array<{ id: string; name: string; status: string; progressPercent: number }>;
}

export type DemoRole =
  | 'system_admin'
  | 'institutional_admin'
  | 'coordinator'
  | 'program_director'
  | 'teacher'
  | 'parent'
  | 'director';

/** Plain-text demo credentials (never use in production). */
export interface DemoUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: DemoRole;
  childIds: string[];
}

export interface DemoMessage {
  id: string;
  from: 'parent' | 'team';
  senderName: string;
  text: string;
  sentAt: ISODateTimeString;
}

export interface DemoConversation {
  id: string;
  studentId?: string;
  studentName?: string;
  parentName?: string;
  teacherName?: string;
  recipient: string;
  role: string;
  unread: number;
  lastMessage: string;
  time: string;
  messages: DemoMessage[];
}

// Demo login accounts. Emails are role-based so they are easy to remember:
//   teacher@melue.org · coordinator@melue.org · pd@melue.org
//   parent@melue.org · director@melue.org · admin@melue.org · sysadmin@melue.org
// Password for all: demo1234
// Explicit shape annotation keeps inference stable across circular imports.
export interface SeedShape {
  students: SeededStudent[];
  promptLevels: PromptLevel[];
  users: DemoUser[];
  enrollments: EnrollmentDraft[];
  conversations: DemoConversation[];
  trials: Array<import('../resources/types').Trial>;
  notifications: Notification[];
  observations: ParentObservation[];
  sensoryActivities: SensoryActivity[];
  teacherSchedule: TeacherScheduleEntry[];
  assignments: Assignment[];
  masteryChecks: MasteryCheck[];
  incidents: MockSeedIncident[];
  sessionNotes: MockSeedNote[];
  sessionSummaries: MockSeedSummary[];
  goalBank: MockSeedGoal[];
  iups: MockSeedIup[];
  staffMembers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    assignedStudents: string[];
  }>;
  sysRoles: Array<{ id: string; name: string; description: string }>;
  auditLogs: MockSeedAuditLog[];
  adminConfigs: Record<string, unknown>;
  attendanceRecords: MockSeedAttendance[];
  assessments: MockSeedAssessment[];
}

export const seed: SeedShape = {
  students: [
    { id: 'student-a', fullName: 'Aiden Rivera', firstName: 'Aiden', lastName: 'Rivera', dateOfBirth: '2018-03-15', age: 8, programType: 'ABA', therapyGroup: 'Sunrise', status: 'active', headshotUrl: null, currentFocusStudentGoalId: null, goals: [
      { id: 'goal-1', name: 'Identify Colors', status: 'active', progressPercent: 45 },
      { id: 'goal-2', name: 'Follow 2-Step Commands', status: 'active', progressPercent: 70 },
    ] },
    { id: 'student-b', fullName: 'Maya Chen', firstName: 'Maya', lastName: 'Chen', dateOfBirth: '2019-07-22', age: 7, programType: 'PECS', therapyGroup: 'Horizon', status: 'active', headshotUrl: null, currentFocusStudentGoalId: null, goals: [
      { id: 'goal-3', name: 'Request Items', status: 'active', progressPercent: 60 },
      { id: 'goal-4', name: 'Hand Washing Steps', status: 'active', progressPercent: 30 },
    ] },
    { id: 'student-c', fullName: 'Liam Okafor', firstName: 'Liam', lastName: 'Okafor', dateOfBirth: '2017-11-10', age: 8, programType: 'ABA', therapyGroup: 'Sunrise', status: 'active', headshotUrl: null, currentFocusStudentGoalId: null, goals: [
      { id: 'goal-5', name: 'Turn Taking', status: 'active', progressPercent: 55 },
    ] },
    { id: 'student-d', fullName: 'Sofia Patel', firstName: 'Sofia', lastName: 'Patel', dateOfBirth: '2018-06-03', age: 8, programType: 'ABA', therapyGroup: 'Horizon', status: 'active', headshotUrl: null, currentFocusStudentGoalId: null, goals: [] },
  ] satisfies SeededStudent[],

  promptLevels: [
    { id: 'pl-1', label: 'FP', color: '#E5484D', displayOrder: 1, isActive: true },
    { id: 'pl-2', label: 'PP', color: '#F5A623', displayOrder: 2, isActive: true },
    { id: 'pl-3', label: 'G', color: '#30A46C', displayOrder: 3, isActive: true },
    { id: 'pl-4', label: '+', color: '#0091FF', displayOrder: 4, isActive: true },
  ] satisfies PromptLevel[],

  users: [
    { id: 'user-1', name: 'Rosa Delgado', email: 'teacher@melue.org', password: 'demo1234', role: 'teacher', childIds: [] },
    { id: 'user-2', name: 'Marcus Chen', email: 'coordinator@melue.org', password: 'demo1234', role: 'coordinator', childIds: [] },
    { id: 'user-3', name: 'Aisha Patel', email: 'pd@melue.org', password: 'demo1234', role: 'program_director', childIds: [] },
    { id: 'user-4', name: 'Elena Martinez', email: 'parent@melue.org', password: 'demo1234', role: 'parent', childIds: ['student-a', 'student-b'] },
    { id: 'user-5', name: 'Dev Ops', email: 'sysadmin@melue.org', password: 'demo1234', role: 'system_admin', childIds: [] },
    { id: 'user-6', name: 'Director A', email: 'director@melue.org', password: 'demo1234', role: 'director', childIds: [] },
    { id: 'user-7', name: 'Admin A', email: 'admin@melue.org', password: 'demo1234', role: 'institutional_admin', childIds: [] },
  ] satisfies DemoUser[],

  enrollments: [] satisfies EnrollmentDraft[],

  conversations: [] satisfies DemoConversation[],

  trials: [] as Array<import('../resources/types').Trial>,

  notifications: [] satisfies Notification[],

  observations: [] satisfies ParentObservation[],

  sensoryActivities: [] satisfies SensoryActivity[],

  teacherSchedule: [] satisfies TeacherScheduleEntry[],

  assignments: [] satisfies Assignment[],

  masteryChecks: [] satisfies MasteryCheck[],

  incidents: [
    { id: 'inc-1', studentId: 'student-a', sessionId: 'sess-1', date: '08/01/2026', time: '9:12 AM', location: 'Room 2', behavior: 'Tantrum', behaviorDefinition: 'Crying and screaming on the floor', frequency: '2 times', intensity: 'High', category: 'Disruptive', antecedent: 'Transitions', consequence: 'Verbal redirection', notes: '', recordedBy: 'Rosa Delgado', createdAt: '2026-08-01T09:12:00Z' },
    { id: 'inc-2', studentId: 'student-a', sessionId: 'sess-1', date: '08/01/2026', time: '10:40 AM', location: 'Playground', behavior: 'Aggression', behaviorDefinition: 'Hitting peer', frequency: '1 time', intensity: 'High', category: 'Physical', antecedent: 'Peer proximity', consequence: 'Time-out', notes: '', recordedBy: 'Rosa Delgado', createdAt: '2026-08-01T10:40:00Z' },
    { id: 'inc-3', studentId: 'student-b', sessionId: 'sess-2', date: '08/02/2026', time: '10:15 AM', location: 'Library', behavior: 'Non-compliance', behaviorDefinition: 'Refusing to follow instruction', frequency: '2 times', intensity: 'Low', category: 'Verbal', antecedent: 'Quiet time prompt', consequence: 'Guided choices', notes: '', recordedBy: 'Rosa Delgado', createdAt: '2026-08-02T10:15:00Z' },
    { id: 'inc-4', studentId: 'student-a', sessionId: 'sess-3', date: '08/10/2026', time: '11:30 AM', location: 'Room 2', behavior: 'Elopement', behaviorDefinition: 'Running out of the room', frequency: '1 time', intensity: 'Medium', category: 'Safety concerns', antecedent: 'Demand placed', consequence: 'Physical prompt', notes: '', recordedBy: 'Rosa Delgado', createdAt: '2026-08-10T11:30:00Z' },
    { id: 'inc-5', studentId: 'student-b', sessionId: 'sess-3', date: '08/15/2026', time: '9:45 AM', location: 'Sensory Room', behavior: 'Self-injury', behaviorDefinition: 'Head hitting', frequency: '3 times', intensity: 'High', category: 'Safety concerns', antecedent: 'Overstimulation', consequence: 'Sensory break', notes: '', recordedBy: 'Rosa Delgado', createdAt: '2026-08-15T09:45:00Z' },
  ] satisfies MockSeedIncident[],

  sessionNotes: [] satisfies MockSeedNote[],

  sessionSummaries: [] satisfies MockSeedSummary[],

  goalBank: [] satisfies MockSeedGoal[],

  iups: [] satisfies MockSeedIup[],

  staffMembers: [
    { id: 'staff-1', name: 'Rosa Delgado', email: 'teacher@melue.org', role: 'teacher', status: 'active', assignedStudents: ['student-a', 'student-b'] },
    { id: 'staff-2', name: 'Marcus Chen', email: 'coordinator@melue.org', role: 'coordinator', status: 'active', assignedStudents: [] },
    { id: 'staff-3', name: 'Jared Cruz', email: 'jared@melue.org', role: 'teacher', status: 'active', assignedStudents: ['student-c'] },
    { id: 'staff-4', name: 'Jeah Torres', email: 'jeah@melue.org', role: 'teacher', status: 'active', assignedStudents: ['student-d'] },
  ] satisfies Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    assignedStudents: string[];
  }>,

  sysRoles: [
    { id: 'role-1', name: 'system_admin', description: 'Full administrative access' },
    { id: 'role-2', name: 'director', description: 'Director-level oversight' },
    { id: 'role-3', name: 'program_director', description: 'Program-specific management' },
    { id: 'role-4', name: 'coordinator', description: 'Session coordination' },
    { id: 'role-5', name: 'teacher', description: 'In-session data collection' },
  ],

  auditLogs: [] satisfies MockSeedAuditLog[],

  adminConfigs: {
    goalDomains: [
      { id: 'gd-1', name: 'Communication', description: 'Expressive and receptive language skills' },
      { id: 'gd-2', name: 'Social', description: 'Peer interaction and social skills' },
      { id: 'gd-3', name: 'Motor', description: 'Fine and gross motor skills' },
      { id: 'gd-4', name: 'Self-Help', description: 'Daily living skills' },
      { id: 'gd-5', name: 'Cognition', description: 'Academic and problem-solving skills' },
    ],
  },

  attendanceRecords: [] satisfies MockSeedAttendance[],

  assessments: [] satisfies MockSeedAssessment[],
}

// Local structural aliases so the empty business collections stay typed
// without importing the mock db module (which imports this file).
type MockSeedIncident = {
  id: string; studentId: string; sessionId?: string; date: string; time: string;
  location: string; behavior: string; behaviorDefinition: string; frequency: string;
  intensity: string; category: string; antecedent: string; consequence: string;
  notes: string; recordedBy: string; createdAt: string;
};
type MockSeedNote = {
  id: string; sessionId: string; studentId: string; teacher: string;
  status: string; bodyMarkdown: string; submittedAt?: string; draft: boolean;
};
type MockSeedSummary = {
  id: string; sessionId: string; studentIds: string[]; station: string; teacher: string;
  startedAt: string; endedAt: string; status: string; trialsTotal: number; trialsCorrect: number;
  independencePercent: number; notes: string; incidentCount: number; createdAt: string;
};
type MockSeedGoal = {
  id: string; name: string; domain: string; description: string;
  masteryCriteria: string; status: string; createdAt: string;
};
type MockSeedIup = {
  id: string; studentId: string; status: string; createdAt: string; updatedAt: string;
  goals: string[]; interventionStrategies: string[]; reinforcementStrategies: string[];
  antecedentManipulations: string[];
};
type MockSeedAuditLog = {
  id: string; action: string; resource: string; resourceId: string; user: string;
  timestamp: string; details?: Record<string, unknown>;
};
type MockSeedAttendance = {
  id: string; sessionId: string; personId: string;
  personType: 'student' | 'therapist' | 'support_staff';
  status: string; note?: string; loggedAt: string;
};
type MockSeedAssessment = {
  id: string; studentId: string; type: 'skills' | 'behavior' | 'preference' | 'sensory';
  status: string; data: Record<string, unknown>; createdAt: string; updatedAt: string;
};
