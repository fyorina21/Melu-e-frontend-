// src/api/query-keys.ts
//
// Central query-key factory. If a data-fetching layer (React Query etc.) is
// added later, these keys keep cache invalidation consistent. They are plain
// string arrays today so they are dependency-free and future-proof.

import type { UUID } from './resources/types';

export const queryKeys = {
  auth: { all: ['auth'] as const },
  sessions: {
    all: ['sessions'] as const,
    today: () => [...queryKeys.sessions.all, 'today'] as const,
    detail: (id: UUID) => [...queryKeys.sessions.all, id] as const,
    dashboard: (id: UUID) => [...queryKeys.sessions.detail(id), 'dashboard'] as const,
    trialStream: (sessionId: UUID, participantId: UUID, studentGoalId?: UUID) =>
      [...queryKeys.sessions.detail(sessionId), 'trials', participantId, studentGoalId].filter(
        (value): value is string => typeof value !== 'undefined',
      ),
  },
  students: {
    all: ['students'] as const,
    detail: (id: UUID) => [...queryKeys.students.all, id] as const,
  },
  enrollments: {
    all: ['enrollments'] as const,
    detail: (id: UUID) => [...queryKeys.enrollments.all, id] as const,
  },
  notifications: { all: ['notifications'] as const },
  parent: {
    dashboard: ['parent', 'dashboard'] as const,
    progress: (childId: UUID) => ['parent', 'children', childId, 'progress'] as const,
    observations: ['parent', 'observations'] as const,
    conversations: ['parent', 'conversations'] as const,
    conversation: (id: UUID) => [...queryKeys.parent.conversations, id] as const,
  },
  admin: {
    roles: ['admin', 'roles'] as const,
    staffMembers: ['admin', 'staff_members'] as const,
    goalDomains: ['admin', 'goal_domains'] as const,
    promptLevels: ['admin', 'prompt_levels'] as const,
    blockDefinitions: ['admin', 'session_block_definitions'] as const,
    abcDropdownOptions: ['admin', 'abc_dropdown_options'] as const,
    formConfigurations: ['admin', 'form_configurations'] as const,
  },
  scheduling: { all: ['staff_scheduling'] as const },
} as const;