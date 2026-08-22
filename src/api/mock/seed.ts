// src/api/mock/seed.ts
//
// Deterministic fixture data used to populate the demo database on first
// load (and on every manual reset). Values mirror the domain types in
// src/api/resources/types.ts plus the resource-specific interfaces.

import type {
  EnrollmentDraft,
  ISODateTimeString,
  Notification,
  PromptLevel,
  StudentSummary,
  Trial,
  UUID,
} from '../resources/types';
import type { ParentObservation } from '../resources/parent';
import type { SensoryActivity } from '../resources/sensory';
import type { TeacherScheduleEntry, Assignment } from '../resources/staffScheduling';
import type { MasteryCheck } from '../resources/masteryChecks';

export interface SeededStudent extends StudentSummary {
  currentFocusStudentGoalId: UUID | null;
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
  id: UUID;
  name: string;
  email: string;
  password: string;
  role: DemoRole;
  childIds: UUID[];
}

export interface DemoMessage {
  id: UUID;
  from: 'parent' | 'team';
  senderName: string;
  text: string;
  sentAt: ISODateTimeString;
}

export interface DemoConversation {
  id: UUID;
  recipient: string;
  role: string;
  unread: number;
  lastMessage: string;
  time: string;
  messages: DemoMessage[];
}

export const seed = {
  students: [
    {
      id: 'stu-001',
      fullName: 'Aiden Rivera',
      firstName: 'Aiden',
      lastName: 'Rivera',
      dateOfBirth: '2018-03-14',
      age: 8,
      programType: 'ABA',
      therapyGroup: 'Sunrise',
      status: 'active',
      headshotUrl: null,
      currentFocusStudentGoalId: 'goal-100',
      goals: [
        { id: 'goal-100', name: 'Requesting (mand)', status: 'in_progress', progressPercent: 64 },
        { id: 'goal-101', name: 'Following 2-step instructions', status: 'active', progressPercent: 38 },
        { id: 'goal-102', name: 'Toilet training', status: 'in_progress', progressPercent: 72 },
      ],
    },
    {
      id: 'stu-002',
      fullName: 'Maya Chen',
      firstName: 'Maya',
      lastName: 'Chen',
      dateOfBirth: '2019-07-22',
      age: 7,
      programType: 'PECS',
      therapyGroup: 'Sunrise',
      status: 'active',
      headshotUrl: null,
      currentFocusStudentGoalId: 'goal-200',
      goals: [
        { id: 'goal-200', name: 'Picture exchange initiation', status: 'active', progressPercent: 41 },
        { id: 'goal-201', name: 'Sustained joint attention', status: 'in_progress', progressPercent: 55 },
      ],
    },
    {
      id: 'stu-003',
      fullName: 'Lucas Osei',
      firstName: 'Lucas',
      lastName: 'Osei',
      dateOfBirth: '2017-01-30',
      age: 9,
      programType: 'ABA',
      therapyGroup: 'Pioneer',
      status: 'active',
      headshotUrl: null,
      currentFocusStudentGoalId: 'goal-301',
      goals: [
        { id: 'goal-300', name: 'Labeling (tact)', status: 'mastered', progressPercent: 100 },
        { id: 'goal-301', name: 'Conversational turn-taking', status: 'in_progress', progressPercent: 48 },
      ],
    },
    {
      id: 'stu-004',
      fullName: 'Sofia Martinez',
      firstName: 'Sofia',
      lastName: 'Martinez',
      dateOfBirth: '2020-11-05',
      age: 5,
      programType: 'PECS',
      therapyGroup: 'Pioneer',
      status: 'active',
      headshotUrl: null,
      currentFocusStudentGoalId: 'goal-400',
      goals: [
        { id: 'goal-400', name: 'Discrimination between symbols', status: 'active', progressPercent: 29 },
      ],
    },
    {
      id: 'stu-005',
      fullName: 'Ethan Brooks',
      firstName: 'Ethan',
      lastName: 'Brooks',
      dateOfBirth: '2016-05-18',
      age: 10,
      programType: 'ABA',
      therapyGroup: 'Horizon',
      status: 'paused',
      headshotUrl: null,
      currentFocusStudentGoalId: null,
      goals: [],
    },
  ] satisfies SeededStudent[],

  promptLevels: [
    { id: 'pl-1', label: 'FP', color: '#E5484D', displayOrder: 1, isActive: true },
    { id: 'pl-2', label: 'PP', color: '#F5A623', displayOrder: 2, isActive: true },
    { id: 'pl-3', label: 'G', color: '#30A46C', displayOrder: 3, isActive: true },
    { id: 'pl-4', label: '+', color: '#0091FF', displayOrder: 4, isActive: true },
  ] satisfies PromptLevel[],

  users: [
    { id: 'user-1', name: 'Rosa Delgado', email: 'teacher@melue.org', password: 'demo1234', role: 'teacher', childIds: ['stu-001', 'stu-002'] },
    { id: 'user-2', name: 'Marcus Chen', email: 'coordinator@melue.org', password: 'demo1234', role: 'coordinator', childIds: [] },
    { id: 'user-3', name: 'Aisha Patel', email: 'pd@melue.org', password: 'demo1234', role: 'program_director', childIds: [] },
    { id: 'user-4', name: 'Elena Martinez', email: 'parent@melue.org', password: 'demo1234', role: 'parent', childIds: ['stu-001', 'stu-004'] },
    { id: 'user-5', name: 'Dev Ops', email: 'sysadmin@melue.org', password: 'demo1234', role: 'system_admin', childIds: [] },
    { id: 'user-6', name: 'Director A', email: 'director@melue.org', password: 'demo1234', role: 'director', childIds: [] },
    { id: 'user-7', name: 'Admin A', email: 'admin@melue.org', password: 'demo1234', role: 'institutional_admin', childIds: [] },
  ] satisfies DemoUser[],

  enrollments: [
    {
      id: 'enr-1',
      currentStep: 'student_details',
      studentId: null,
      guardianId: null,
      data: { firstName: 'Zoe', lastName: 'Bishop', programType: 'ABA' },
      createdAt: '2026-08-18T09:00:00.000Z',
      updatedAt: '2026-08-18T09:10:00.000Z',
    },
  ] satisfies EnrollmentDraft[],

  conversations: [
    {
      id: 'conv-1',
      recipient: 'Ms. Rosa Delgado',
      role: 'Lead Therapist',
      unread: 2,
      lastMessage: 'Great progress this week!',
      time: '10m',
      messages: [
        { id: 'msg-1', from: 'team', senderName: 'Ms. Rosa Delgado', text: 'Great progress this week!', sentAt: '2026-08-20T09:00:00.000Z' },
        { id: 'msg-2', from: 'parent', senderName: 'Parent A', text: 'Thank you, we noticed at home too!', sentAt: '2026-08-20T09:15:00.000Z' },
      ],
    },
    {
      id: 'conv-2',
      recipient: 'Dr. Marcus Chen',
      role: 'Coordinator',
      unread: 0,
      lastMessage: 'Please review the new IUP.',
      time: '1d',
      messages: [
        { id: 'msg-3', from: 'team', senderName: 'Dr. Marcus Chen', text: 'Please review the new IUP.', sentAt: '2026-08-19T15:00:00.000Z' },
      ],
    },
  ] satisfies DemoConversation[],

  trials: [
    {
      id: 'tr-1',
      outcome: 'correct',
      promptLabel: 'G',
      promptLevelId: 'pl-3',
      studentGoalId: 'goal-100',
      studentGoalStepId: null,
      clientEventId: 'evt-1',
      loggedAt: '2026-08-20T09:02:00.000Z',
    },
    {
      id: 'tr-2',
      outcome: 'prompted',
      promptLabel: 'PP',
      promptLevelId: 'pl-2',
      studentGoalId: 'goal-100',
      studentGoalStepId: null,
      clientEventId: 'evt-2',
      loggedAt: '2026-08-20T09:05:00.000Z',
    },
    {
      id: 'tr-3',
      outcome: 'incorrect',
      promptLabel: 'FP',
      promptLevelId: 'pl-1',
      studentGoalId: 'goal-101',
      studentGoalStepId: null,
      clientEventId: 'evt-3',
      loggedAt: '2026-08-20T09:08:00.000Z',
    },
  ] satisfies Trial[],

  notifications: [
    {
      id: 'ntf-1',
      type: 'observation',
      payload: null,
      read: false,
      readAt: null,
      createdAt: '2026-08-19T15:30:00.000Z',
    },
    {
      id: 'ntf-2',
      type: 'progress',
      payload: { goalId: 'goal-300', name: 'Labeling (tact)' },
      read: false,
      readAt: null,
      createdAt: '2026-08-18T11:00:00.000Z',
    },
    {
      id: 'ntf-3',
      type: 'message',
      payload: null,
      read: true,
      readAt: '2026-08-17T08:45:00.000Z',
      createdAt: '2026-08-17T08:40:00.000Z',
    },
  ] satisfies Notification[],

  observations: [
    {
      id: 'obs-1',
      date: '2026-08-19',
      time: '09:15 AM',
      category: 'Achievement',
      text: 'Aiden independently requested his preferred snack during break.',
      status: 'Acknowledged',
      teamResponse: 'Great progress on mand training!',
      therapistName: 'Ms. Thompson',
      location: 'Sunrise Room',
      duration: '5 min',
    },
    {
      id: 'obs-2',
      date: '2026-08-18',
      time: '10:00 AM',
      category: 'Behavior',
      text: 'Maya had difficulty transitioning from the sensory room to circle time.',
      status: 'Needs Response',
      teamResponse: null,
      therapistName: 'Mr. Delgado',
      location: 'Sensory Room',
      duration: '10 min',
    },
  ] satisfies ParentObservation[],

  sensoryActivities: [
    { id: 'sen-1', name: 'Ball pit', category: 'Proprioceptive', description: 'Deep pressure through full-body contact with balls.' },
    { id: 'sen-2', name: 'Weighted blanket', category: 'Tactile', description: 'Calming input through even weight distribution.' },
    { id: 'sen-3', name: 'Swing', category: 'Vestibular', description: 'Rhythmic swinging to regulate arousal levels.' },
    { id: 'sen-4', name: 'Chew necklaces', category: 'Oral motor', description: 'Provides jaw input for sensory seekers.' },
  ] satisfies SensoryActivity[],

  teacherSchedule: [
    {
      id: 'sch-1',
      teacherName: 'Ms. Thompson',
      day: 'Monday',
      blockName: 'Block 1',
      stationName: 'Station A',
      roomName: 'Sunrise Room',
      status: 'confirmed',
    },
    {
      id: 'sch-2',
      teacherName: 'Mr. Delgado',
      day: 'Monday',
      blockName: 'Block 2',
      stationName: 'Station B',
      roomName: 'Horizon Room',
      status: 'confirmed',
    },
    {
      id: 'sch-3',
      teacherName: 'Ms. Thompson',
      day: 'Wednesday',
      blockName: 'Block 1',
      stationName: 'Station A',
      roomName: 'Sunrise Room',
      status: 'pending',
    },
  ] satisfies TeacherScheduleEntry[],

  assignments: [
    {
      id: 'asn-1',
      teacherId: 'stf-1',
      studentIds: ['stu-001', 'stu-002'],
      blockId: 'blk-1',
      stationId: 'stn-1',
      scheduledDate: '2026-08-20',
      status: 'confirmed',
    },
  ] satisfies Assignment[],

  masteryChecks: [
    {
      id: 'mc-1',
      studentGoalId: 'goal-300',
      status: 'pending',
      requestedByName: 'Ms. Thompson',
      requestedAt: '2026-08-19T14:00:00.000Z',
      approvedAt: null,
    },
    {
      id: 'mc-2',
      studentGoalId: 'goal-100',
      status: 'approved',
      requestedByName: 'Mr. Delgado',
      requestedAt: '2026-08-15T10:00:00.000Z',
      approvedAt: '2026-08-16T09:00:00.000Z',
    },
  ] satisfies MasteryCheck[],

  // New seeded collections for demo persistence
  incidents: [
    {
      id: 'inc-1',
      studentId: 'stu-001',
      sessionId: 'sess-1',
      date: '2026-08-19',
      time: '10:15 AM',
      location: 'Therapy Room',
      behavior: 'Unable to remain seated',
      behaviorDefinition: 'Student leaves designated seat/area without permission during instruction.',
      frequency: 'Occasionally',
      intensity: 'Mild',
      category: 'Not sitting still/Hyperactivity',
      antecedent: 'Demand placed',
      consequence: 'Redirected',
      notes: 'Triggered when asked to transition from preferred activity.',
      recordedBy: 'Ms. Rosa Delgado',
      createdAt: '2026-08-19T10:20:00.000Z',
    },
  ],

  sessionNotes: [
    {
      id: 'note-1',
      sessionId: 'sess-1',
      studentId: 'stu-001',
      teacher: 'Ms. Rosa Delgado',
      status: 'completed',
      bodyMarkdown: 'Great session with Aiden. Showed progress on Requesting (mand) skill. Independent on 64% of trials.',
      submittedAt: '2026-08-20T12:00:00.000Z',
      draft: false,
    },
  ],

  sessionSummaries: [
    {
      id: 'sum-1',
      sessionId: 'sess-1',
      studentIds: ['stu-001'],
      station: 'Station 1',
      teacher: 'Ms. Rosa Delgado',
      startedAt: '2026-08-20T09:00:00.000Z',
      endedAt: '2026-08-20T10:30:00.000Z',
      status: 'pending_review',
      trialsTotal: 25,
      trialsCorrect: 15,
      independencePercent: 60,
      notes: 'Solid work on goal mand. Student needed redirection during transitions.',
      incidentCount: 1,
      createdAt: '2026-08-20T10:35:00.000Z',
    },
  ],

  goalBank: [
    {
      id: 'goal-100',
      name: 'Requesting (mand)',
      domain: 'Communication',
      description: 'Student initiates requests for desired items, activities, or escape using spoken words, gestures, or signs.',
      masteryCriteria: '100% independence across 3 consecutive sessions',
      status: 'active',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'goal-101',
      name: 'Following 2-step instructions',
      domain: 'Cognition',
      description: 'Student follows verbal instructions that require 2 sequential actions.',
      masteryCriteria: '100% independence',
      status: 'active',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'goal-102',
      name: 'Toilet training',
      domain: 'Self-Help',
      description: 'Student uses toilet independently for urination and defecation.',
      masteryCriteria: '90% success across 5 opportunities',
      status: 'active',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
  ],

  iups: [
    {
      id: 'iup-1',
      studentId: 'stu-001',
      status: 'active',
      createdAt: '2026-08-10T00:00:00.000Z',
      updatedAt: '2026-08-10T00:00:00.000Z',
      goals: ['goal-100', 'goal-102'],
      interventionStrategies: ['Differential reinforcement of requesting', 'Visual preference cues'],
      reinforcementStrategies: ['Token economy', 'Preferred snacks'],
      antecedentManipulations: ['Provide choice before demand', 'Check for sensory needs'],
    },
  ],

  staffMembers: [
    {
      id: 'stf-1',
      name: 'Rosa Delgado',
      email: 'teacher@melue.org',
      role: 'teacher',
      status: 'active',
      assignedStudents: ['stu-001', 'stu-002'],
    },
  ],

  sysRoles: [
    { id: 'role-1', name: 'system_admin', description: 'Full administrative access' },
    { id: 'role-2', name: 'director', description: 'Director-level oversight' },
    { id: 'role-3', name: 'program_director', description: 'Program-specific management' },
    { id: 'role-4', name: 'coordinator', description: 'Session coordination' },
    { id: 'role-5', name: 'teacher', description: 'In-session data collection' },
  ],

  auditLogs: [],

  adminConfigs: {
    trialLoggingFormat: {
      promptLevels: [
        { id: 'pl-1', label: 'FP', color: '#E5484D', order: 1 },
        { id: 'pl-2', label: 'PP', color: '#F5A623', order: 2 },
        { id: 'pl-3', label: 'G', color: '#30A46C', order: 3 },
        { id: 'pl-4', label: '+', color: '#0091FF', order: 4 },
      ],
    },
    abcLists: {
      locations: ['Therapy Room', 'Snack Place', 'Playground', 'Sensory Room', 'Circle Time'],
      behaviors: ['Unable to remain seated', 'Biting others', 'Flopping', 'Screaming'],
      antecedents: ['Demand placed', 'Transition', 'Item removed'],
      consequences: ['Redirected', 'Ignored', 'Item given'],
    },
    goalDomains: [
      { id: 'gd-1', name: 'Communication', description: 'Expressive and receptive language skills' },
      { id: 'gd-2', name: 'Social', description: 'Peer interaction and social skills' },
      { id: 'gd-3', name: 'Motor', description: 'Fine and gross motor skills' },
      { id: 'gd-4', name: 'Self-Help', description: 'Daily living skills' },
      { id: 'gd-5', name: 'Cognition', description: 'Academic and problem-solving skills' },
    ],
  },

  attendanceRecords: [],

  assessments: [],
};