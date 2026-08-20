// src/api/mock/routes.ts
//
// Route table for the mock http client. Each entry maps an HTTP method +
// path pattern (with `:param` segments) to a handler that reads/writes
// the mock database. Handlers mirror what a real Rails backend would
// serialize so the resource modules in src/api/resources can be used
// unchanged.

import type { EnrollmentDraft, SessionState, Trial, UUID } from '../resources/types';
import type { ParentObservation } from '../resources/parent';
import { mockDb } from './db';
import { ApiError } from '../http/errors';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface MockHandlerContext {
  params: Record<string, string>;
  query: Record<string, string | undefined>;
  body: unknown;
}

export interface MockRoute {
  method: HttpMethod;
  pattern: string;
  handler: (ctx: MockHandlerContext) => unknown;
}

function requiredParam(ctx: MockHandlerContext, name: string): string {
  const value = ctx.params[name];
  if (!value) throw new ApiError(`Missing path param: ${name}`, 400);
  return value;
}

function bodyAs<T>(ctx: MockHandlerContext): T {
  return (ctx.body ?? {}) as T;
}

function notFound(id: string) {
  return new ApiError(`Record not found: ${id}`, 404);
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---- Auth ----

const roleHome: Record<string, string> = {
  system_admin: '/system-admin',
  institutional_admin: '/institutional-admin',
  coordinator: '/coordinator',
  program_director: '/program-director',
  teacher: '/teacher',
  parent: '/parent',
};

// ---- Students ----

function serializeStudent(studentId: UUID) {
  const s = mockDb.findById('students', studentId);
  if (!s) throw notFound(studentId);
  const { goals, currentFocusStudentGoalId, ...summary } = s;
  return summary;
}

// ---- Trials ----

function trialForGoal(studentGoalId: string): Trial[] {
  return mockDb
    .all('trials')
    .filter((t) => t.studentGoalId === studentGoalId)
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

// ---- Session dashboard ----

function buildDashboard(sessionId: UUID): Record<string, unknown> {
  const session = mockDb.findById('sessions', sessionId);
  if (!session) throw notFound(sessionId);
  const assignment = mockDb.all('assignments')[0];
  const students = mockDb.all('students').filter((s) => s.status !== 'paused');

  return {
    id: session.id,
    status: session.status,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    station: assignment ? { id: assignment.stationId, name: 'Station A' } : { id: 'stn-none', name: 'Unassigned' },
    room: stationRoom(assignment?.stationId),
    block: {
      id: assignment?.blockId ?? 'blk-none',
      name: 'Block 1',
      startTime: '09:00',
      endTime: '10:30',
      secondsRemaining: 5400,
    },
    participants: students.map((s, index) => ({
      id: s.id,
      cardPosition: index,
      student: { id: s.id, fullName: s.fullName, therapyGroup: s.therapyGroup },
      currentFocusStudentGoalId: s.currentFocusStudentGoalId,
      goals: s.goals.map((g) => ({
        id: g.id,
        name: g.name,
        goalType: 'trial',
        status: g.status,
        progressPercent: g.progressPercent,
      })),
      recentTrials: trialForGoal(s.currentFocusStudentGoalId ?? s.goals[0]?.id ?? '').slice(0, 5),
    })),
    promptLevels: mockDb.all('promptLevels'),
  };
}

function stationRoom(_stationId: string | null | undefined): { id: string; name: string } {
  return { id: 'room-1', name: 'Sunrise Room' };
}

function buildTodaySession() {
  const assignment = mockDb.all('assignments')[0] ?? null;
  const activeSessions = mockDb.all('sessions');
  const latestSession = activeSessions.length ? activeSessions[activeSessions.length - 1] : null;
  return {
    assignment: assignment
      ? {
          id: assignment.id,
          scheduledDate: assignment.scheduledDate,
          status: assignment.status,
          block: { id: assignment.blockId ?? 'blk-none', name: 'Block 1', startTime: '09:00', endTime: '10:30', secondsRemaining: 5400 },
          station: { id: assignment.stationId ?? 'stn-none', name: 'Station A' },
          room: stationRoom(assignment?.stationId),
        }
      : null,
    session: latestSession
      ? { id: latestSession.id, status: latestSession.status, startedAt: latestSession.startedAt, endedAt: latestSession.endedAt }
      : null,
    promptLevels: mockDb.all('promptLevels'),
  };
}

export const MOCK_ROUTES: MockRoute[] = [
  // ---- Auth ----
  {
    method: 'POST',
    pattern: '/auth/login',
    handler: (ctx) => {
      const { email, password } = bodyAs<{ email: string; password: string }>(ctx);
      const user = mockDb.all('users').find((u) => u.email.toLowerCase() === (email ?? '').toLowerCase());
      if (!user || user.password !== password) {
        throw new ApiError('Invalid email or password', 401, ['Invalid email or password']);
      }
      return {
        token: `demo.${user.id}.${Date.now().toString(36)}`,
        role: user.role,
        homeRoute: roleHome[user.role] ?? '/',
      };
    },
  },
  { method: 'POST', pattern: '/auth/logout', handler: () => ({ status: 'ok' as const }) },
  {
    method: 'POST',
    pattern: '/auth/create-account',
    handler: (ctx) => {
      const { email, password } = bodyAs<{ email: string; password: string }>(ctx);
      if (!email || !password) throw new ApiError('Email and password are required', 422);
      mockDb.insert('users', {
        id: newId('user'),
        name: email.split('@')[0],
        email,
        password,
        role: 'parent',
        childIds: [],
      });
      return { status: 'ok' as const };
    },
  },
  { method: 'POST', pattern: '/auth/reset-password', handler: () => ({ status: 'ok' as const }) },

  // ---- Students ----
  {
    method: 'GET',
    pattern: '/students',
    handler: (ctx) => {
      let rows = mockDb.all('students');
      const { status, programType, therapyGroup, q } = ctx.query;
      if (status) rows = rows.filter((s) => s.status === status);
      if (programType) rows = rows.filter((s) => s.programType === programType);
      if (therapyGroup) rows = rows.filter((s) => s.therapyGroup === therapyGroup);
      if (q) {
        const needle = q.toLowerCase();
        rows = rows.filter((s) => s.fullName.toLowerCase().includes(needle) || s.firstName.toLowerCase().includes(needle) || s.lastName.toLowerCase().includes(needle));
      }
      return rows.map((s) => serializeStudent(s.id));
    },
  },
  {
    method: 'GET',
    pattern: '/students/:id',
    handler: (ctx) => serializeStudent(requiredParam(ctx, 'id')),
  },
  {
    method: 'POST',
    pattern: '/students',
    handler: (ctx) => {
      const p = bodyAs<{ firstName: string; middleName: string; lastName: string; dateOfBirth: string; programType: string; therapyGroup: string }>(ctx);
      const id = newId('stu');
      const fullName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
      const age = p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : 0;
      mockDb.insert('students', {
        id,
        fullName,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dateOfBirth,
        age,
        programType: p.programType,
        therapyGroup: p.therapyGroup,
        status: 'active',
        headshotUrl: null,
        currentFocusStudentGoalId: null,
        goals: [],
      });
      return serializeStudent(id);
    },
  },
  {
    method: 'PATCH',
    pattern: '/students/:id',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const patch = bodyAs<Record<string, unknown>>(ctx);
      const updated = mockDb.updateById('students', id, patch);
      if (!updated) throw notFound(id);
      return serializeStudent(id);
    },
  },

  // ---- Sessions ----
  { method: 'GET', pattern: '/today/session', handler: () => buildTodaySession() },
  {
    method: 'POST',
    pattern: '/therapy_sessions/start',
    handler: (ctx) => {
      const { assignmentId } = bodyAs<{ assignmentId: UUID }>(ctx);
      if (!assignmentId) throw new ApiError('assignmentId is required', 422);
      const session: SessionState = {
        id: newId('sess'),
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        endedAt: null,
      };
      mockDb.insert('sessions', session);
      return session;
    },
  },
  {
    method: 'GET',
    pattern: '/therapy_sessions/:id',
    handler: (ctx) => buildDashboard(requiredParam(ctx, 'id')),
  },
  {
    method: 'GET',
    pattern: '/therapy_sessions/:id/dashboard',
    handler: (ctx) => buildDashboard(requiredParam(ctx, 'id')),
  },
  {
    method: 'PATCH',
    pattern: '/therapy_sessions/:id/participants/:pid/active_goal',
    handler: (ctx) => {
      const pid = requiredParam(ctx, 'pid');
      const { studentGoalId } = bodyAs<{ studentGoalId: UUID }>(ctx);
      const student = mockDb.findById('students', pid);
      if (!student) throw notFound(pid);
      mockDb.updateById('students', pid, { currentFocusStudentGoalId: studentGoalId });
      return { participantId: pid, currentFocusStudentGoalId: studentGoalId };
    },
  },

  // ---- Trials ----
  {
    method: 'POST',
    pattern: '/therapy_sessions/:sessionId/trials',
    handler: (ctx) => {
      const sessionId = requiredParam(ctx, 'sessionId');
      const p = bodyAs<{ session_participant_id: UUID; student_goal_id: UUID; prompt_level_id: UUID; outcome: string; client_event_id: string; logged_at?: string }>(ctx);
      const trial: Trial = {
        id: newId('tr'),
        outcome: p.outcome,
        promptLabel: mockDb.findById('promptLevels', p.prompt_level_id)?.label ?? null,
        promptLevelId: p.prompt_level_id,
        studentGoalId: p.student_goal_id,
        studentGoalStepId: null,
        clientEventId: p.client_event_id ?? newId('evt'),
        loggedAt: p.logged_at ?? new Date().toISOString(),
      };
      mockDb.insert('trials', trial);
      return { trial };
    },
  },
  {
    method: 'GET',
    pattern: '/therapy_sessions/:sessionId/participants/:pid/trial_stream',
    handler: (ctx) => {
      const pid = requiredParam(ctx, 'pid');
      const student = mockDb.findById('students', pid);
      const studentGoalId = ctx.query.student_goal_id ?? student?.currentFocusStudentGoalId ?? student?.goals[0]?.id;
      let rows = studentGoalId ? trialForGoal(studentGoalId) : mockDb.all('trials');
      const limit = ctx.query.limit ? Number(ctx.query.limit) : undefined;
      if (limit != null) rows = rows.slice(0, limit);
      return { trials: rows };
    },
  },

  // ---- Notifications ----
  {
    method: 'GET',
    pattern: '/notifications',
    handler: () => mockDb.all('notifications').sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  },
  {
    method: 'POST',
    pattern: '/notifications/:id/mark_as_read',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const updated = mockDb.updateById('notifications', id, { read: true, readAt: new Date().toISOString() });
      if (!updated) throw notFound(id);
      return updated;
    },
  },

  // ---- Enrollments ----
  {
    method: 'POST',
    pattern: '/enrollments',
    handler: () => {
      const now = new Date().toISOString();
      const draft: EnrollmentDraft = {
        id: newId('enr'),
        currentStep: 'student_details',
        studentId: null,
        guardianId: null,
        data: {},
        createdAt: now,
        updatedAt: now,
      };
      mockDb.insert('enrollments', draft);
      return draft;
    },
  },
  {
    method: 'GET',
    pattern: '/enrollments/:id',
    handler: (ctx) => {
      const draft = mockDb.findById('enrollments', requiredParam(ctx, 'id'));
      if (!draft) throw notFound(requiredParam(ctx, 'id'));
      return draft;
    },
  },
  {
    method: 'PATCH',
    pattern: '/enrollments/:id',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const updated = mockDb.updateById('enrollments', id, { ...bodyAs<Record<string, unknown>>(ctx), updatedAt: new Date().toISOString() });
      if (!updated) throw notFound(id);
      return updated;
    },
  },
  {
    method: 'PATCH',
    pattern: '/enrollments/:id/update_step',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const { step, ...rest } = bodyAs<{ step: string } & Record<string, unknown>>(ctx);
      const existing = mockDb.findById('enrollments', id) ?? { data: {} };
      const updated = mockDb.updateById('enrollments', id, {
        currentStep: step,
        data: { ...(existing.data ?? {}), ...rest },
        updatedAt: new Date().toISOString(),
      });
      if (!updated) throw notFound(id);
      return updated;
    },
  },
  {
    method: 'POST',
    pattern: '/enrollments/:id/complete',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const updated = mockDb.updateById('enrollments', id, { currentStep: 'complete', updatedAt: new Date().toISOString() });
      if (!updated) throw notFound(id);
      return updated;
    },
  },
  {
    method: 'POST',
    pattern: '/enrollments/:id/save_draft',
    handler: (ctx) => {
      const draft = mockDb.findById('enrollments', requiredParam(ctx, 'id'));
      if (!draft) throw notFound(requiredParam(ctx, 'id'));
      return draft;
    },
  },
  {
    method: 'POST',
    pattern: '/enrollments/:id/attach_document',
    handler: (ctx) => mockDb.findById('enrollments', requiredParam(ctx, 'id')),
  },
  {
    method: 'POST',
    pattern: '/enrollments/:id/upload_photo',
    handler: (ctx) => mockDb.findById('enrollments', requiredParam(ctx, 'id')),
  },
  {
    method: 'POST',
    pattern: '/enrollments/:id/upload_video',
    handler: (ctx) => mockDb.findById('enrollments', requiredParam(ctx, 'id')),
  },
  {
    method: 'DELETE',
    pattern: '/enrollments/:id/remove_photo',
    handler: (ctx) => mockDb.findById('enrollments', requiredParam(ctx, 'id')),
  },
  {
    method: 'DELETE',
    pattern: '/enrollments/:id/remove_video',
    handler: (ctx) => mockDb.findById('enrollments', requiredParam(ctx, 'id')),
  },

  // ---- Mastery checks ----
  {
    method: 'POST',
    pattern: '/student_goals/:studentGoalId/mastery_checks',
    handler: (ctx) => {
      const studentGoalId = requiredParam(ctx, 'studentGoalId');
      const check = {
        id: newId('mc'),
        studentGoalId,
        status: 'pending' as const,
        requestedByName: null,
        requestedAt: new Date().toISOString(),
        approvedAt: null,
      };
      mockDb.insert('masteryChecks', check);
      return check;
    },
  },
  {
    method: 'GET',
    pattern: '/mastery_checks/:id',
    handler: (ctx) => {
      const check = mockDb.findById('masteryChecks', requiredParam(ctx, 'id'));
      if (!check) throw notFound(requiredParam(ctx, 'id'));
      return check;
    },
  },
  {
    method: 'PATCH',
    pattern: '/mastery_checks/:id/approve',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const updated = mockDb.updateById('masteryChecks', id, { status: 'approved', approvedAt: new Date().toISOString() });
      if (!updated) throw notFound(id);
      return updated;
    },
  },
  {
    method: 'PATCH',
    pattern: '/mastery_checks/:id/reject',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const updated = mockDb.updateById('masteryChecks', id, { status: 'rejected' });
      if (!updated) throw notFound(id);
      return updated;
    },
  },
  {
    method: 'POST',
    pattern: '/mastery_checks/:id/verifications',
    handler: (ctx) => {
      const masteryCheckId = requiredParam(ctx, 'id');
      const p = bodyAs<{ outcome: string; promptUsed?: string; notes?: string }>(ctx);
      return { id: newId('mv'), masteryCheckId, verifierName: null, outcome: p.outcome ?? 'correct', promptUsed: p.promptUsed ?? null, notes: p.notes ?? null };
    },
  },

  // ---- Sensory ----
  {
    method: 'GET',
    pattern: '/sensory_activities',
    handler: () => mockDb.all('sensoryActivities'),
  },
  { method: 'GET', pattern: '/sensory_assessments', handler: () => [] },
  {
    method: 'POST',
    pattern: '/sensory_assessments',
    handler: (ctx) => {
      const p = bodyAs<Record<string, unknown>>(ctx);
      return { id: newId('asse'), studentId: null, status: 'draft', submittedAt: null, records: [], ...p };
    },
  },
  {
    method: 'GET',
    pattern: '/sensory_assessments/:id',
    handler: (ctx) => ({ id: requiredParam(ctx, 'id'), studentId: null, status: 'draft', submittedAt: null, records: [] }),
  },
  {
    method: 'PATCH',
    pattern: '/sensory_assessments/:id',
    handler: (ctx) => ({ id: requiredParam(ctx, 'id'), ...bodyAs<Record<string, unknown>>(ctx) }),
  },
  {
    method: 'POST',
    pattern: '/sensory_assessments/:id/submit',
    handler: (ctx) => ({ id: requiredParam(ctx, 'id'), studentId: null, status: 'submitted', submittedAt: new Date().toISOString(), records: [] }),
  },

  // ---- Parent ----
  {
    method: 'GET',
    pattern: '/parent/dashboard',
    handler: () => {
      const parentUser = mockDb.all('users').find((u) => u.role === 'parent') ?? null;
      const child =
        (parentUser ? mockDb.findById('students', parentUser.childIds[0]) : undefined) ??
        mockDb.all('students')[0];
      const unreadTotal = mockDb.all('conversations').reduce((sum, c) => sum + (c.unread ?? 0), 0);
      const latest = firstConversationWithMessages();
      const obsThisWeek = countObservationsThisWeek();
      return {
        childSummary: child
          ? { id: child.id, fullName: child.fullName, age: child.age, programType: child.programType, therapyGroup: child.therapyGroup }
          : null,
        sessionsThisWeek: Math.min(5, obsThisWeek + 2),
        sessionsTotal: 24,
        independencePercent: 68,
        unreadCount: unreadTotal,
        latestMessage: latest
          ? { from: latest.recipient, preview: latest.lastMessage, time: latest.time }
          : null,
      };
    },
  },
  {
    method: 'GET',
    pattern: '/parent/children/:childId/progress',
    handler: (ctx) => {
      const child = mockDb.findById('students', requiredParam(ctx, 'childId'));
      if (!child) throw notFound(requiredParam(ctx, 'childId'));
      const goals = child.goals.map((g) => ({
        id: g.id,
        name: g.name,
        percent: g.progressPercent,
        status: g.status === 'mastered' ? 'Mastered' : g.status === 'in_progress' ? 'In Progress' : 'Active',
        updatedAt: null,
      }));
      return {
        childName: child.fullName,
        age: child.age,
        program: child.programType,
        group: child.therapyGroup,
        goals,
        sessionHistory: parentSessionHistory(child),
        sessionsThisMonth: sessionCountForChild(child.goals),
        goalsMastered: goals.filter((g) => g.status === 'Mastered').length,
        totalTrials: trialsForGoals(child.goals.map((g) => g.id)).length,
        averageIndependence: studentIndependence(child.id),
        behaviorTrends: behaviorTrendsForChild(child.id),
        behaviorSummary: behaviorSummaryForChild(child.id),
        iupStation1: ['Requesting (mand)', 'Receptive ID'],
        iupStation2: ['Gross Motor', 'Social Turn-taking'],
      };
    },
  },
  {
    method: 'GET',
    pattern: '/parent/sessions/:sessionId/summary',
    handler: (ctx) => {
      const sessionId = requiredParam(ctx, 'sessionId');
      const child = mockDb.all('students')[0];
      const trials = mockDb.all('trials').filter((t) => (child as { goals?: Array<{ id: string }> })?.goals?.some((g) => g.id === t.studentGoalId));
      const independence = trials.length ? Math.round((trials.filter((t) => t.outcome === 'correct').length / trials.length) * 100) : studentIndependence('');
      const goalNames = (child?.goals ?? []).map((g) => g.name);
      return {
        id: sessionId,
        childName: child?.fullName,
        age: child?.age,
        program: child?.programType,
        group: child?.therapyGroup,
        goals: goalNames,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        teacher: mockDb.all('users').find((u) => u.role === 'teacher')?.name ?? 'Therapy Team',
        duration: '45 min',
        independence,
        time: '9:00 AM',
        behavior: 'None',
        notes: trials.length
          ? `${trials.length} trials delivered across ${goalNames.length} goals. Keep practicing the same skills at home!`
          : 'No trials recorded yet this period.',
      };
    },
  },
  {
    method: 'GET',
    pattern: '/parent/observations',
    handler: (ctx) => {
      let rows = mockDb.all('observations');
      const category = ctx.query.category;
      if (category) rows = rows.filter((o) => o.category === category);
      return rows;
    },
  },
  {
    method: 'POST',
    pattern: '/parent/observations',
    handler: (ctx) => {
      const p = bodyAs<{ behavior: string; context: string; notes: string; category?: string }>(ctx);
      const category =
        p.category && ['Behavior', 'Achievement', 'Concern', 'General'].includes(p.category)
          ? (p.category as ParentObservation['category'])
          : 'General';
      const location = p.context?.split('·')[0]?.trim() || null;
      const duration = p.context?.split('·')[1]?.trim() || null;
      const obs: ParentObservation = {
        id: newId('obs'),
        date: new Date().toISOString().slice(0, 10),
        time: nowTimeHHMM(),
        category,
        text: p.notes || p.behavior,
        status: 'Pending',
        teamResponse: null,
        therapistName: null,
        location,
        duration,
      };
      mockDb.insert('observations', obs);
      return obs;
    },
  },
  { method: 'GET', pattern: '/parent/observations/requested', handler: () => [] },
  {
    method: 'GET',
    pattern: '/parent/conversations',
    handler: () =>
      mockDb.all('conversations').map((c) => ({
        id: c.id,
        recipient: c.recipient,
        role: c.role,
        unread: c.unread,
        lastMessage: c.lastMessage,
        time: c.time,
      })),
  },
  {
    method: 'GET',
    pattern: '/parent/conversations/:id',
    handler: (ctx) => {
      const convo = mockDb.findById('conversations', requiredParam(ctx, 'id'));
      if (!convo) throw notFound(requiredParam(ctx, 'id'));
      return convo;
    },
  },
  {
    method: 'POST',
    pattern: '/parent/conversations/:id/messages',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const { text } = bodyAs<{ text: string }>(ctx);
      if (!text) throw new ApiError('Message text is required', 422);
      const existing = mockDb.findById('conversations', id);
      if (!existing) throw notFound(id);
      const message = {
        id: newId('msg'),
        from: 'parent' as const,
        senderName: 'Parent A',
        text,
        sentAt: new Date().toISOString(),
      };
      mockDb.updateById('conversations', id, {
        messages: [...existing.messages, message],
        lastMessage: text,
        time: 'Just now',
        unread: 0,
      });
      return { status: 'ok' as const };
    },
  },
  {
    method: 'POST',
    pattern: '/parent/conversations/:id/status',
    handler: (ctx) => {
      const { resolved } = bodyAs<{ resolved: boolean }>(ctx);
      const conversation = mockDb.findById('conversations', requiredParam(ctx, 'id'));
      if (!conversation) throw notFound(requiredParam(ctx, 'id'));
      if (resolved) {
        mockDb.updateById('conversations', conversation.id, { unread: 0 });
      }
      return { status: 'ok' as const };
    },
  },

  // ---- Sync ----
  {
    method: 'GET',
    pattern: '/sync/pull',
    handler: () => ({ entities: {}, serverTime: new Date().toISOString() }),
  },
  {
    method: 'POST',
    pattern: '/sync/push',
    handler: (ctx) => {
      const { changes } = bodyAs<{ changes: Array<{ entity: string }> }>(ctx);
      return { accepted: changes?.length ?? 0, conflicts: [] };
    },
  },

  // ---- Admin ----
  { method: 'GET', pattern: '/admin/roles', handler: () => [] },
  { method: 'POST', pattern: '/admin/roles', handler: (ctx) => ({ id: newId('role'), ...bodyAs<Record<string, unknown>>(ctx) }) },
  { method: 'PATCH', pattern: '/admin/roles/:id', handler: (ctx) => ({ id: requiredParam(ctx, 'id'), ...bodyAs<Record<string, unknown>>(ctx) }) },
  { method: 'GET', pattern: '/admin/staff_members', handler: () => [] },
  { method: 'PUT', pattern: '/admin/staff_members/:id/update_status', handler: (ctx) => ({ id: requiredParam(ctx, 'id'), ...bodyAs<Record<string, unknown>>(ctx) }) },
  { method: 'POST', pattern: '/admin/staff_members/:id/reset_password', handler: () => ({ status: 'ok' as const }) },
  {
    method: 'GET',
    pattern: '/admin/prompt_levels',
    handler: () => mockDb.all('promptLevels').map((p) => ({ id: p.id, name: p.label })),
  },
  { method: 'PUT', pattern: '/admin/prompt_levels/reorder', handler: () => ({ status: 'ok' as const }) },
  { method: 'GET', pattern: '/admin/goal_domains', handler: () => [{ id: 'gd-1', name: 'Communication' }, { id: 'gd-2', name: 'Daily Living' }] },
  { method: 'PUT', pattern: '/admin/goal_domains/reorder', handler: () => ({ status: 'ok' as const }) },
  { method: 'GET', pattern: '/admin/session_block_definitions', handler: () => [] },
  { method: 'GET', pattern: '/admin/abc_dropdown_options', handler: () => [] },
  { method: 'PUT', pattern: '/admin/abc_dropdown_options/reorder', handler: () => ({ status: 'ok' as const }) },
  { method: 'GET', pattern: '/admin/form_configurations', handler: () => [] },
  { method: 'GET', pattern: '/admin/session_schedule_config', handler: () => ({}) },

  // ---- Staff scheduling ----
  { method: 'GET', pattern: '/staff_scheduling', handler: () => mockDb.all('assignments') },
  { method: 'GET', pattern: '/staff_scheduling/teacher_schedule', handler: () => mockDb.all('teacherSchedule') },
  { method: 'GET', pattern: '/staff_scheduling/capacity', handler: () => ({ stations: 3, rooms: 2, teachers: 5 }) },
  {
    method: 'POST',
    pattern: '/assignments',
    handler: (ctx) => {
      const p = bodyAs<Record<string, unknown>>(ctx);
      return { id: newId('asn'), teacherId: null, studentIds: [], blockId: null, stationId: null, scheduledDate: null, status: 'confirmed', ...p };
    },
  },
  {
    method: 'PATCH',
    pattern: '/assignments/:id',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const updated = mockDb.updateById('assignments', id, bodyAs<Record<string, unknown>>(ctx));
      if (!updated) throw notFound(id);
      return updated;
    },
  },
  {
    method: 'DELETE',
    pattern: '/assignments/:id',
    handler: (ctx) => {
      const removed = mockDb.removeById('assignments', requiredParam(ctx, 'id'));
      if (!removed) throw notFound(requiredParam(ctx, 'id'));
      return { status: 'ok' as const };
    },
  },
];

function studentIndependence(_studentId: string): number {
  return 68;
}

function nowTimeHHMM(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function trialsForGoals(goalIds: string[]): Trial[] {
  if (!goalIds.length) return [];
  const set = new Set(goalIds);
  return mockDb.all('trials').filter((t) => set.has(t.studentGoalId));
}

function sessionCountForChild(goals: Array<{ id: string }>): number {
  return Math.max(1, Math.round(trialsForGoals(goals.map((g) => g.id)).length / 4));
}

function behaviorTrendsForChild(_childId: string): Array<{ month: string; incidents: number }> {
  return [
    { month: 'Mar', incidents: 8 },
    { month: 'Apr', incidents: 7 },
    { month: 'May', incidents: 5 },
    { month: 'Jun', incidents: 4 },
    { month: 'Jul', incidents: 5 },
    { month: 'Aug', incidents: trialsForGoals([]).length }, // placeholder; stable 3 via default
  ].map((row, i, arr) => (i === arr.length - 1 ? { ...row, incidents: 3 } : row));
}

function behaviorSummaryForChild(_childId: string): string {
  return 'This month: 3 incidents recorded (improving from 8 last month).';
}

function parentSessionHistory(child: { id: string; goals: Array<{ id: string; name: string }> }): Array<Record<string, unknown>> {
  const trials = trialsForGoals(child.goals.map((g) => g.id));
  if (!trials.length) return [];
  const teacher = mockDb.all('users').find((u) => u.role === 'teacher')?.name ?? 'Therapy Team';
  return trials.slice(0, 6).map((t, i) => {
    const goal = child.goals.find((g) => g.id === t.studentGoalId);
    return {
      id: `${t.clientEventId ?? t.id}`,
      date: new Date(t.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      teacher,
      duration: '45 min',
      trials: 1,
      independence: Math.round(55 + ((i * 7) % 40)),
      time: new Date(t.loggedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      goals: goal ? [goal.name] : [],
      behavior: 'None',
      notes: `Trials delivered on "${goal?.name ?? 'goal'}". Consistent effort — keep practicing at home!`,
    };
  });
}

function firstConversationWithMessages() {
  const convo = mockDb.all('conversations').find((c) => c.messages.length);
  return convo ?? null;
}

function countObservationsThisWeek(): number {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  return mockDb
    .all('observations')
    .filter((o) => {
      const t = new Date(o.date).getTime();
      return !Number.isNaN(t) && t >= weekAgo && t <= now;
    })
    .length;
}