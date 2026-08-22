// src/api/mock/routes.ts
//
// Route table for the mock http client. Each entry maps an HTTP method +
// path pattern (with `:param` segments) to a handler that reads/writes
// the mock database. Handlers mirror what a real Rails backend would
// serialize so the resource modules in src/api/resources can be used
// unchanged.

import type { EnrollmentDraft, SessionState, Trial, UUID } from '../resources/types';
import type { ParentObservation } from '../resources/parent';
import type {
  MockIncident,
  MockSessionNote,
  MockSessionSummary,
  MockGoal,
  MockIup,
  MockRole,
  MockAttendanceRecord,
  MockAssessment,
  MockAdminConfig,
  MockStaffMember,
} from './db';
import { seed } from './seed';
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
    },
  },
  // ---- Auth Me ----
  {
    method: 'GET',
    pattern: '/auth/me',
    handler: () => {
      const token = require('../token').getAccessToken();
      if (!token) throw new ApiError('Not authenticated', 401);
      const parts = token.split('.');
      const userId = parts[1];
      const user = mockDb.findById('users', userId);
      if (!user) throw new ApiError('User not found', 404);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
    },
  },
  // ---- Director Dashboard ----
  {
    method: 'GET',
    pattern: '/director/dashboard',
    handler: () => ({
      totalStudents: mockDb.all('students').length,
      activeTeachers: mockDb.all('users').filter((u) => u.role === 'teacher').length,
      pendingApprovals: mockDb.all('masteryChecks').filter((m) => m.status === 'pending').length,
      unreadParentMessages: mockDb.all('conversations').reduce((sum, c) => sum + c.unread, 0),
      sessionReportsPending: 2,
    }),
  },
  // ---- Director/TC Schedule ----
  {
    method: 'GET',
    pattern: '/director/schedule',
    handler: (ctx) => {
      const tId = ctx.query.teacherId;
      const assignments = mockDb.all('assignments');
      const teacher = tId ? mockDb.findById('users', tId) : null;
      const teacherName = teacher ? teacher.name : 'Teacher';
      const scheduleBlocks = [
        { id: 'b1', teacherName, stationName: 'Station 1 (Basic Skills)', startTime: '9:00 AM', endTime: '10:30 AM', studentIds: assignments.filter((a) => a.teacherId === tId && a.blockId === 'b1').flatMap((a) => a.studentIds) },
        { id: 'b2', teacherName, stationName: 'Station 2 (Advanced Skills)', startTime: '11:00 AM', endTime: '12:30 PM', studentIds: assignments.filter((a) => a.teacherId === tId && a.blockId === 'b2').flatMap((a) => a.studentIds) }
      ];
      return scheduleBlocks;
    },
  },
  {
    method: 'POST',
    pattern: '/director/schedule/assignments',
    handler: (ctx) => {
      const { blockId, studentIds, teacherId } = bodyAs<{ blockId: string; studentIds: string[]; teacherId?: string }>(ctx);
      const existing = mockDb.all('assignments').find((a) => a.blockId === blockId);
      if (existing) {
        mockDb.updateById('assignments', existing.id, { studentIds });
      } else {
        mockDb.insert('assignments', {
          id: newId('asn'),
          teacherId: teacherId ?? 's1',
          studentIds,
          blockId,
          stationId: 'stn-1',
          scheduledDate: new Date().toISOString(),
          status: 'confirmed'
        });
      }
      return { status: 'ok' };
    },
  },
  {
    method: 'POST',
    pattern: '/director/schedule/blocks/:blockId/clear',
    handler: (ctx) => {
      const bId = requiredParam(ctx, 'blockId');
      const existing = mockDb.all('assignments').find((a) => a.blockId === bId);
      if (existing) {
        mockDb.updateById('assignments', existing.id, { studentIds: [] });
      }
      return { status: 'ok' };
    },
  },
  // ---- Goal Mastery Approvals ----
  {
    method: 'GET',
    pattern: '/director/mastery-approvals',
    handler: () => mockDb.all('masteryChecks'),
  },
  {
    method: 'POST',
    pattern: '/director/mastery-approvals/:id/approve',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      mockDb.updateById('masteryChecks', id, { status: 'approved' });
      return { status: 'ok' };
    },
  },
  {
    method: 'POST',
    pattern: '/director/mastery-approvals/:id/reject',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      mockDb.updateById('masteryChecks', id, { status: 'rejected' });
      return { status: 'ok' };
    },
  },
  // ---- Conversations ----
  {
    method: 'GET',
    pattern: '/director/conversations',
    handler: () => mockDb.all('conversations'),
  },
  {
    method: 'GET',
    pattern: '/director/conversations/:id',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const convo = mockDb.findById('conversations', id);
      if (!convo) throw notFound(id);
      return convo;
    },
  },
  {
    method: 'POST',
    pattern: '/director/conversations/:id/messages',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const { text } = bodyAs<{ text: string }>(ctx);
      const convo = mockDb.findById('conversations', id);
      if (!convo) throw notFound(id);
      const newMsg = { id: newId('msg'), from: 'team' as const, senderName: 'Director', text, sentAt: new Date().toISOString() };
      const updatedMessages = [...convo.messages, newMsg];
      mockDb.updateById('conversations', id, { messages: updatedMessages, lastMessage: text, time: 'Just now' });
      return newMsg;
    },
  },
  {
    method: 'POST',
    pattern: '/director/conversations/:id/read-status',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      mockDb.updateById('conversations', id, { unread: 0 });
      return { status: 'ok' };
    },
  },
  // ---- Custom Report ----
  {
    method: 'POST',
    pattern: '/director/reports/custom',
    handler: () => [
      { id: '1', name: 'Aiden Rivera', age: 8, program: 'ABA', therapist: 'Teacher A', attendance: 95, assessmentScore: 82, goalStatus: 'On Track', behaviorType: 'None', diagnosis: 'Autism Spectrum' },
      { id: '2', name: 'Maya Chen', age: 7, program: 'ABA', therapist: 'Teacher B', attendance: 88, assessmentScore: 64, goalStatus: 'On Track', behaviorType: 'None', diagnosis: 'Speech Delay' },
    ],
  },
  // ---- Foundation Overview ----
  {
    method: 'GET',
    pattern: '/director/reports/foundation-overview',
    handler: () => ({
      attendanceRate: 92,
      masteredGoalsCount: 14,
      totalTrialCount: 1250,
      activeProgramsCount: 3
    }),
  },
  // ---- Student Progress ----
  {
    method: 'GET',
    pattern: '/director/students/:id/progress',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const student = mockDb.findById('students', id);
      if (!student) throw notFound(id);
      return {
        studentId: id,
        studentName: student.fullName,
        recentTrials: mockDb.all('trials').slice(0, 10),
        goals: student.goals
      };
    },
  },
  // ---- Auth: reset code request (forgot password) ----
  {
    method: 'POST',
    pattern: '/auth/request-reset-code',
    handler: () => ({ status: 'ok' as const }),
  },

  // ---- Sessions (legacy /sessions/ prefix) ----
  {
    method: 'POST',
    pattern: '/sessions/:id/start',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      mockDb.insert('sessions', { id, status: 'in_progress', startedAt: new Date().toISOString(), endedAt: null });
      return { status: 'ok' as const };
    },
  },
  {
    method: 'GET',
    pattern: '/sessions/:id/roster',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const session = mockDb.findById('sessions', id);
      return { sessionId: id, students: [] };
    },
  },
  {
    method: 'POST',
    pattern: '/sessions/:id/students/:studentId/incidents',
    handler: (ctx) => {
      const incident: MockIncident = {
        id: newId('inc'),
        studentId: requiredParam(ctx, 'studentId'),
        sessionId: requiredParam(ctx, 'id'),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: '',
        behavior: '',
        behaviorDefinition: '',
        frequency: '',
        intensity: '',
        category: '',
        antecedent: '',
        consequence: '',
        notes: '',
        recordedBy: 'Teacher',
        createdAt: new Date().toISOString(),
        ...bodyAs<Partial<MockIncident>>(ctx),
      };
      mockDb.insert('incidents', incident);
      return incident;
    },
  },
  {
    method: 'GET',
    pattern: '/sessions/:sessionId/students/:pid/incidents',
    handler: (ctx) => {
      const sessionId = requiredParam(ctx, 'sessionId');
      const pid = requiredParam(ctx, 'pid');
      const incidents = mockDb.all('incidents').filter((i) => i.studentId === pid || i.sessionId === sessionId);
      return { incidents };
    },
  },
  {
    method: 'POST',
    pattern: '/sessions/:id/students/:sid/goals/:gid/trials',
    handler: (ctx) => {
      const sid = requiredParam(ctx, 'sid');
      const gid = requiredParam(ctx, 'gid');
      const trial: Trial = {
        id: newId('tr'),
        outcome: 'correct',
        promptLabel: 'G',
        promptLevelId: 'pl-3',
        studentGoalId: gid,
        studentGoalStepId: null,
        clientEventId: newId('evt'),
        loggedAt: new Date().toISOString(),
      };
      mockDb.insert('trials', trial);
      return { trial };
    },
  },
  {
    method: 'POST',
    pattern: '/sessions/:id/students/:sid/goals/:gid/mastery-check',
    handler: (ctx) => {
      const sid = requiredParam(ctx, 'sid');
      const gid = requiredParam(ctx, 'gid');
      const check = {
        id: newId('mc'),
        studentGoalId: gid,
        status: 'pending' as const,
        requestedByName: 'Teacher',
        requestedAt: new Date().toISOString(),
        approvedAt: null,
      };
      mockDb.insert('masteryChecks', check);
      return check;
    },
  },
  {
    method: 'GET',
    pattern: '/students/:sid/goals/:gid/mastery-check',
    handler: (ctx) => {
      const checks = mockDb.all('masteryChecks').filter((m) => m.studentGoalId === requiredParam(ctx, 'gid'));
      return checks[0] ?? null;
    },
  },
  {
    method: 'POST',
    pattern: '/students/:sid/goals/:gid/mastery-check/submit',
    handler: (ctx) => {
      const payload = bodyAs<{ outcome: string; promptUsed?: string; notes?: string }>(ctx);
      const checks = mockDb.all('masteryChecks').filter((m) => m.studentGoalId === requiredParam(ctx, 'sid'));
      const check = checks[0];
      if (!check) throw notFound('mastery-check');
      mockDb.insert('masteryChecks', {
        id: check.id,
        studentGoalId: check.studentGoalId,
        status: 'approved' as const,
        requestedByName: check.requestedByName,
        requestedAt: check.requestedAt,
        approvedAt: new Date().toISOString(),
        verification: payload,
      } as any);
      return { status: 'ok' as const };
    },
  },
  {
    method: 'POST',
    pattern: '/sessions/:id/swap-students',
    handler: () => ({ status: 'ok' as const }),
  },
  {
    method: 'GET',
    pattern: '/sessions/:id/summary',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const summary = mockDb.findById('sessionSummaries', id);
      return summary ?? { id: id, studentIds: [], notes: '' };
    },
  },
  {
    method: 'POST',
    pattern: '/sessions/:id/summary',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const payload = bodyAs<{ notes: string; status?: string }>(ctx);
      const summary: MockSessionSummary = {
        id: id,
        sessionId: id,
        studentIds: [],
        station: 'Station 1',
        teacher: 'Teacher',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        status: (payload.status || 'pending_review') as any,
        trialsTotal: 10,
        trialsCorrect: 7,
        independencePercent: 70,
        notes: payload.notes || '',
        incidentCount: 0,
        createdAt: new Date().toISOString(),
      };
      mockDb.insert('sessionSummaries', summary);
      return summary;
    },
  },
  {
    method: 'POST',
    pattern: '/sessions/:id/summary/draft',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      return { id, status: 'draft' as const };
    },
  },
  {
    method: 'PATCH',
    pattern: '/students/:sid/goals/:gid/progress',
    handler: (ctx) => {
      const patch = bodyAs<{ progressPercent: number; status: string }>(ctx);
      const students = mockDb.all('students');
      const goals = students[0]?.goals ?? [];
      const updated = mockDb.updateById('students', requiredParam(ctx, 'sid'), { goals });
      return updated ?? null;
    },
  },
  {
    method: 'GET',
    pattern: '/students/:sid/goals/:gid/progress',
    handler: (ctx) => {
      const sid = requiredParam(ctx, 'sid');
      const student = mockDb.findById('students', sid);
      if (!student) throw notFound(sid);
      return { studentId: sid, goals: student.goals ?? [] };
    },
  },

  // ---- Session Notes ----
  {
    method: 'GET',
    pattern: '/session-notes',
    handler: () => mockDb.all('sessionNotes'),
  },
  {
    method: 'GET',
    pattern: '/session-notes/:id',
    handler: (ctx) => mockDb.findById('sessionNotes', requiredParam(ctx, 'id')) ?? { id: requiredParam(ctx, 'id') },
  },
  {
    method: 'POST',
    pattern: '/session-notes/:id',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const body = bodyAs<{ bodyMarkdown: string; draft?: boolean }>(ctx);
      const note: MockSessionNote = { id: newId('note'), sessionId: id, studentId: 'stu-001', teacher: 'Teacher', status: 'submitted', ...body, draft: body.draft ?? false };
      mockDb.insert('sessionNotes', note);
      return note;
    },
  },
  {
    method: 'PATCH',
    pattern: '/session-notes/:id',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const patch = bodyAs<Partial<MockSessionNote>>(ctx);
      const updated = mockDb.updateById('sessionNotes', id, patch);
      return updated ?? null;
    },
  },
  {
    method: 'PATCH',
    pattern: '/session-notes/:id/autosave',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const patch = bodyAs<{ bodyMarkdown: string }>(ctx);
      return mockDb.updateById('sessionNotes', id, patch) ?? { id };
    },
  },
  {
    method: 'POST',
    pattern: '/session-notes/:id/resubmit',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const updated = mockDb.updateById('sessionNotes', id, { status: 'submitted' });
      return updated ?? null;
    },
  },
  { method: 'GET', pattern: '/session-notes/weekly-summary', handler: () => ({ summaries: [] }) },
  {
    method: 'DELETE',
    pattern: '/session-notes/:sid/attachments/:aid',
    handler: (ctx) => ({ status: 'ok' as const }),
  },

  // ---- Appointments ----
  {
    method: 'GET',
    pattern: '/appointments',
    handler: () => [],
  },
  {
    method: 'GET',
    pattern: '/appointments/:id',
    handler: (ctx) => ({ id: requiredParam(ctx, 'id'), students: [], therapist: {} }),
  },
  {
    method: 'POST',
    pattern: '/appointments/:id/reschedule',
    handler: (ctx) => ({ id: requiredParam(ctx, 'id'), status: 'rescheduled' as const }),
  },

  // ---- Attendance ----
  {
    method: 'POST',
    pattern: '/sessions/:id/attendance',
    handler: (ctx) => {
      const payload = bodyAs<{ personId: string; personType: string; status: string }>(ctx);
      const record: MockAttendanceRecord = {
        id: newId('att'),
        sessionId: requiredParam(ctx, 'id'),
        personId: payload.personId,
        personType: payload.personType as 'student' | 'therapist' | 'support_staff',
        status: payload.status as 'present' | 'absent' | 'late' | 'excused',
        loggedAt: new Date().toISOString(),
      };
      mockDb.insert('attendanceRecords', record);
      return record;
    },
  },
  {
    method: 'POST',
    pattern: '/sessions/:id/attendance/bulk',
    handler: (ctx) => ({ status: 'ok' as const }),
  },
  {
    method: 'GET',
    pattern: '/attendance',
    handler: () => mockDb.all('attendanceRecords'),
  },
  {
    method: 'GET',
    pattern: '/attendance/report',
    handler: () => ({ report: [] }),
  },

  // ---- Teacher Dashboard & Assessment ----
  {
    method: 'GET',
    pattern: '/teacher/dashboard',
    handler: () => ({
      todaySchedule: {
        stationName: 'Station 1 — Basic Skills',
        roomName: 'Room 2',
        sessionBlock: 'Block B · Daily Living',
        startTime: '9:00 AM',
        endTime: '10:30 AM',
        startsIn: 'Starts in 3h 58m',
        students: [
          { id: 'student-a', name: 'Student A', initial: 'A' },
          { id: 'student-b', name: 'Student B', initial: 'B' },
        ],
      },
      assessmentTasks: [
        { id: 't1', studentName: 'Student C', studentInitial: 'C', assessmentName: 'ABLLS Assessment', status: 'In Progress', progress: 45 },
        { id: 't2', studentName: 'Student D', studentInitial: 'D', assessmentName: 'Behavior Assessment', status: 'Not Started', progress: 0 },
      ],
      pendingMasteryChecks: [
        { id: 'm1', studentId: 'student-a', goalId: 'goal-1', studentName: 'Student A', goalName: 'Identify Colors', pendingLabel: 'Pending B/C verification' },
        { id: 'm2', studentId: 'student-b', goalId: 'goal-3', studentName: 'Student B', goalName: 'Request Items', pendingLabel: 'Pending Director Review' },
        { id: 'm3', studentId: 'student-c', goalId: 'goal-4', studentName: 'Student C', goalName: 'Hand Washing Steps', pendingLabel: 'Pending B/C verification' },
      ],
      notifications: [
        { id: 'n1', type: 'approved', title: 'Session summary approved', source: 'Coordinator A', timeAgo: '2 hrs ago', unread: false },
        { id: 'n2', type: 'revision', title: 'Session revision requested', source: 'Coordinator A', timeAgo: '3 hrs ago', unread: true },
        { id: 'n3', type: 'alert', title: 'Coordinator alert: Parent meeting Thursday', source: 'Coordinator A', timeAgo: '5 hrs ago', unread: true },
        { id: 'n4', type: 'message', title: 'Parent message from Parent A', source: 'Parent A', timeAgo: 'Yesterday', unread: true },
        { id: 'n5', type: 'approved', title: 'Behavior plan update', source: 'Coordinator B', timeAgo: '2 days ago', unread: false },
      ],
    }),
  },
  {
    method: 'GET',
    pattern: '/teacher/assessments/dashboard',
    handler: () => ({ studentsInAssessment: [], continueAssessment: null }),
  },
  {
    method: 'GET',
    pattern: '/teacher/students/:studentId/assessments/:type',
    handler: (ctx) => ({ studentId: requiredParam(ctx, 'studentId'), type: requiredParam(ctx, 'type'), data: {} }),
  },
  {
    method: 'POST',
    pattern: '/teacher/students/:studentId/assessments/:type',
    handler: (ctx) => {
      const sid = requiredParam(ctx, 'studentId');
      const type = requiredParam(ctx, 'type');
      const assessment: MockAssessment = {
        id: newId('assess'),
        studentId: sid,
        type: type as 'skills' | 'behavior' | 'preference' | 'sensory',
        status: 'in_progress',
        data: bodyAs<Record<string, unknown>>(ctx),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockDb.insert('assessments', assessment);
      return assessment;
    },
  },
  {
    method: 'GET',
    pattern: '/teacher/students/:studentId/profile',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'studentId');
      const student = mockDb.findById('students', id);
      return student ?? null;
    },
  },

  // ---- Teacher ABC Log ----
  {
    method: 'GET',
    pattern: '/teacher/abc-log',
    handler: (ctx) => {
      let incidents = mockDb.all('incidents');
      const { studentId, from, to, behavior, category } = ctx.query;
      if (studentId) incidents = incidents.filter((i) => i.studentId === studentId);
      return { incidents, rows: incidents };
    },
  },
  {
    method: 'GET',
    pattern: '/teacher/abc-log/export',
    handler: () => ({ csv: 'date,time,behavior,notes\n' }),
  },
  {
    method: 'GET',
    pattern: '/teacher/notifications',
    handler: () => mockDb.all('notifications'),
  },
  {
    method: 'POST',
    pattern: '/teacher/notifications/:id/read',
    handler: (ctx) => mockDb.updateById('notifications', requiredParam(ctx, 'id'), { read: true }),
  },
  {
    method: 'GET',
    pattern: '/teacher/conversations',
    handler: () => {
      const convs = mockDb.all('conversations');
      return convs.map((c: any) => ({
        id: c.id,
        studentName: c.studentName || c.recipient || 'Aiden Smith',
        parentName: c.parentName || 'Sarah Smith',
        lastMessagePreview: c.lastMessage || c.lastMessagePreview || '',
        unreadCount: c.unread || c.unreadCount || 0,
        resolved: !!c.resolved,
      }));
    },
  },
  {
    method: 'GET',
    pattern: '/teacher/conversations/:id',
    handler: (ctx) => mockDb.findById('conversations', requiredParam(ctx, 'id')) ?? { id: requiredParam(ctx, 'id') },
  },
  {
    method: 'POST',
    pattern: '/teacher/conversations/:id/messages',
    handler: (ctx) => ({ id: newId('msg'), from: 'teacher', text: bodyAs<{ text: string }>(ctx).text }),
  },
  {
    method: 'POST',
    pattern: '/teacher/conversations/:id/escalate',
    handler: () => ({ status: 'ok' as const }),
  },
  {
    method: 'POST',
    pattern: '/teacher/conversations/:id/resolve',
    handler: () => ({ status: 'ok' as const }),
  },

  // ---- Coordinator Dashboard ----
  {
    method: 'GET',
    pattern: '/coordinator/dashboard',
    handler: () => ({
      summary: { sessionsCompleted: 6, trialsLogged: 124, incidents: 1, goalsMastered: 2 },
      liveSessions: [],
      pendingSummaries: mockDb.all('sessionSummaries').filter((s) => s.status === 'pending_review'),
    }),
  },
  {
    method: 'GET',
    pattern: '/coordinator/sessions/active',
    handler: () => ({ sessions: [], filter: {} }),
  },
  {
    method: 'POST',
    pattern: '/coordinator/sessions/:id/alert',
    handler: () => ({ status: 'alert_sent' as const }),
  },
  {
    method: 'GET',
    pattern: '/coordinator/sessions/export',
    handler: () => ({ csv: 'id,student,teacher,status\n' }),
  },
  {
    method: 'GET',
    pattern: '/coordinator/summaries/pending',
    handler: () => mockDb.all('sessionSummaries').filter((s) => s.status === 'pending_review'),
  },
  {
    method: 'POST',
    pattern: '/coordinator/summaries/:id/approve',
    handler: (ctx) => mockDb.updateById('sessionSummaries', requiredParam(ctx, 'id'), { status: 'approved' }),
  },
  {
    method: 'POST',
    pattern: '/coordinator/summaries/:id/request-changes',
    handler: (ctx) => ({ status: 'revision_requested' as const }),
  },
  {
    method: 'POST',
    pattern: '/coordinator/summaries/bulk-approve',
    handler: (ctx) => ({ status: 'ok' as const }),
  },
  {
    method: 'GET',
    pattern: '/coordinator/students',
    handler: (ctx) => {
      let rows = mockDb.all('students');
      const { search, status, program, therapyGroup } = ctx.query;
      if (search) rows = rows.filter((s) => s.fullName.toLowerCase().includes(search!.toLowerCase()));
      return rows.map((s) => ({ id: s.id, fullName: s.fullName, age: s.age, programType: s.programType, therapyGroup: s.therapyGroup, status: s.status }));
    },
  },
  {
    method: 'POST',
    pattern: '/coordinator/students',
    handler: (ctx) => {
      const p = bodyAs<{ firstName: string; lastName: string; dateOfBirth: string; programType: string; therapyGroup: string }>(ctx);
      const student = { id: newId('stu'), fullName: `${p.firstName} ${p.lastName}`, ...p };
      mockDb.insert('students', student as any);
      return student;
    },
  },
  {
    method: 'GET',
    pattern: '/coordinator/students/:sid/progress',
    handler: (ctx) => {
      const sid = requiredParam(ctx, 'sid');
      const student = mockDb.findById('students', sid);
      return { studentId: sid, studentName: student?.fullName ?? '', goals: student?.goals ?? [] };
    },
  },
  {
    method: 'GET',
    pattern: '/coordinator/students/:sid/profile',
    handler: (ctx) => mockDb.findById('students', requiredParam(ctx, 'sid')),
  },
  {
    method: 'PATCH',
    pattern: '/coordinator/students/:sid/profile',
    handler: (ctx) => mockDb.updateById('students', requiredParam(ctx, 'sid'), bodyAs<Record<string, unknown>>(ctx)),
  },
  {
    method: 'GET',
    pattern: '/coordinator/students/:sid/flag',
    handler: () => null,
  },
  {
    method: 'POST',
    pattern: '/coordinator/students/:sid/flag',
    handler: () => ({ status: 'ok' as const }),
  },
  {
    method: 'GET',
    pattern: '/coordinator/teachers/metrics',
    handler: () => mockDb.all('teacherSchedule'),
  },
  {
    method: 'GET',
    pattern: '/coordinator/teachers/workload',
    handler: () => mockDb.all('teacherSchedule'),
  },
  {
    method: 'GET',
    pattern: '/coordinator/teachers/workload/trend',
    handler: () => ({ trend: [] }),
  },
  {
    method: 'GET',
    pattern: '/coordinator/rooms-resources',
    handler: () => ({ rooms: [], resources: [] }),
  },
  {
    method: 'PATCH',
    pattern: '/coordinator/rooms/:roomId',
    handler: (ctx) => ({ id: requiredParam(ctx, 'roomId'), status: bodyAs<{ status: string }>(ctx).status }),
  },
  {
    method: 'PATCH',
    pattern: '/coordinator/resources/:resourceId',
    handler: (ctx) => ({ id: requiredParam(ctx, 'resourceId'), inUse: bodyAs<{ inUse: boolean }>(ctx).inUse }),
  },
  {
    method: 'GET',
    pattern: '/coordinator/conversations',
    handler: () => mockDb.all('conversations'),
  },
  {
    method: 'GET',
    pattern: '/coordinator/conversations/:id',
    handler: (ctx) => mockDb.findById('conversations', requiredParam(ctx, 'id')) ?? { id: requiredParam(ctx, 'id') },
  },
  {
    method: 'POST',
    pattern: '/coordinator/conversations/:id/messages',
    handler: (ctx) => ({ id: newId('msg'), from: 'team', text: bodyAs<{ text: string }>(ctx).text }),
  },
  {
    method: 'POST',
    pattern: '/coordinator/conversations/:id/escalate',
    handler: (ctx) => ({ escalatedTo: bodyAs<{ to: string }>(ctx).to }),
  },
  {
    method: 'POST',
    pattern: '/coordinator/conversations/:id/resolve',
    handler: () => ({ status: 'ok' as const }),
  },
  {
    method: 'GET',
    pattern: '/coordinator/notifications',
    handler: () => mockDb.all('notifications'),
  },

  // ---- Program Director ----
  {
    method: 'GET',
    pattern: '/program-director/dashboard',
    handler: () => ({
      counts: { inAssessment: 1, readyForIup: 1, activeIups: 1, goalsAssigned: 3 },
      pipeline: [],
    }),
  },
  {
    method: 'GET',
    pattern: '/program-director/assessments',
    handler: () => mockDb.all('assessments'),
  },
  {
    method: 'GET',
    pattern: '/program-director/assessments/:studentId/report',
    handler: (ctx) => {
      const sid = requiredParam(ctx, 'studentId');
      return { studentId: sid, skills: [], behavior: [], preferences: [], notes: '' };
    },
  },
  {
    method: 'POST',
    pattern: '/program-director/assessments/:studentId/mark-reviewed',
    handler: () => ({ status: 'marked_reviewed' as const }),
  },
  {
    method: 'POST',
    pattern: '/program-director/assessments/:studentId/notes',
    handler: () => ({ status: 'ok' as const }),
  },
  {
    method: 'GET',
    pattern: '/program-director/iup/candidates',
    handler: () => mockDb.all('iups').filter((i) => i.status === 'active'),
  },
  {
    method: 'GET',
    pattern: '/program-director/iup/:studentId/context',
    handler: (ctx) => ({ studentId: requiredParam(ctx, 'studentId'), goals: mockDb.all('goalBank') }),
  },
  {
    method: 'POST',
    pattern: '/program-director/iup/:studentId/draft',
    handler: (ctx) => ({ iupId: requiredParam(ctx, 'studentId'), status: 'draft' as const }),
  },
  {
    method: 'POST',
    pattern: '/program-director/iup/:studentId/finalize',
    handler: (ctx) => ({ status: 'finalized' as const }),
  },
  {
    method: 'GET',
    pattern: '/program-director/iup-library',
    handler: () => mockDb.all('iups'),
  },
  {
    method: 'POST',
    pattern: '/program-director/iup-library/:id/archive',
    handler: (ctx) => mockDb.updateById('iups', requiredParam(ctx, 'id'), { status: 'archived' }),
  },
  {
    method: 'GET',
    pattern: '/program-director/caseload/:studentId',
    handler: (ctx) => ({
      studentId: requiredParam(ctx, 'studentId'),
      goals: mockDb.findById('students', requiredParam(ctx, 'studentId'))?.goals ?? [],
    }),
  },
  {
    method: 'GET',
    pattern: '/program-director/goal-bank',
    handler: (ctx) => {
      const rows = mockDb.all('goalBank');
      const domain = ctx.query.domain as string | undefined;
      return domain ? rows.filter((g) => g.domain === domain) : rows;
    },
  },
  {
    method: 'POST',
    pattern: '/program-director/goal-bank',
    handler: (ctx) => {
      const goal: MockGoal = {
        id: newId('goal'),
        createdAt: new Date().toISOString(),
        status: 'active',
        name: '',
        domain: '',
        description: '',
        masteryCriteria: '',
        ...bodyAs<Partial<MockGoal>>(ctx),
      };
      mockDb.insert('goalBank', goal);
      return goal;
    },
  },
  {
    method: 'PATCH',
    pattern: '/program-director/goal-bank/:id',
    handler: (ctx) => mockDb.updateById('goalBank', requiredParam(ctx, 'id'), bodyAs<Partial<MockGoal>>(ctx)),
  },
  {
    method: 'POST',
    pattern: '/program-director/goal-bank/:id/deactivate',
    handler: (ctx) => mockDb.updateById('goalBank', requiredParam(ctx, 'id'), { status: 'inactive' }),
  },
  {
    method: 'DELETE',
    pattern: '/program-director/goal-bank/:id',
    handler: (ctx) => ({ deleted: mockDb.removeById('goalBank', requiredParam(ctx, 'id')) }),
  },
  {
    method: 'POST',
    pattern: '/program-director/caseload/:studentId/assign-goal',
    handler: (ctx) => ({ assigned: true }),
  },
  {
    method: 'POST',
    pattern: '/program-director/caseload/:studentId/remove-goal',
    handler: () => ({ removed: true }),
  },
  {
    method: 'GET',
    pattern: '/program-director/conversations',
    handler: () => mockDb.all('conversations'),
  },
  {
    method: 'GET',
    pattern: '/program-director/conversations/:id',
    handler: (ctx) => mockDb.findById('conversations', requiredParam(ctx, 'id')) ?? { id: requiredParam(ctx, 'id') },
  },
  {
    method: 'POST',
    pattern: '/program-director/conversations/:id/messages',
    handler: (ctx) => ({ id: newId('msg'), from: 'pd', text: bodyAs<{ text: string }>(ctx).text }),
  },
  {
    method: 'POST',
    pattern: '/program-director/conversations/:id/escalate',
    handler: (ctx) => ({ escalatedTo: 'director', conversationId: requiredParam(ctx, 'id') }),
  },
  {
    method: 'GET',
    pattern: '/program-director/charts',
    handler: (ctx) => ({ data: [], meta: { studentId: requiredParam(ctx, 'studentId') } }),
  },
  {
    method: 'GET',
    pattern: '/program-director/charts/export',
    handler: () => ({ pdf: 'chart' }),
  },

  // ---- Parent Notifications ----
  {
    method: 'GET',
    pattern: '/parent/notifications',
    handler: () => mockDb.all('notifications'),
  },

  // ---- Director extra readings ----
  {
    method: 'GET',
    pattern: '/director/sessions',
    handler: (ctx) => {
      const rows = mockDb.all('sessionSummaries');
      const { student, teacher, date } = ctx.query;
      let filtered = rows;
      if (student) filtered = filtered.filter((s) => s.studentIds.includes(student as string));
      if (teacher) filtered = filtered.filter((s) => s.teacher === teacher);
      return filtered;
    },
  },
  {
    method: 'GET',
    pattern: '/director/reports/bi-annual',
    handler: () => ({ report: [] }),
  },
  {
    method: 'GET',
    pattern: '/director/reports/custom/meta',
    handler: () => ({ meta: {} }),
  },
  {
    method: 'GET',
    pattern: '/director/mastery-approvals/:id',
    handler: (ctx) => {
      const checks = mockDb.all('masteryChecks').filter((c) => c.status === 'approved');
      return checks[0] ?? { id: requiredParam(ctx, 'id'), status: 'approved' };
    },
  },

  // ---- SysAdmin ----
  {
    method: 'GET',
    pattern: '/sysadmin/staff',
    handler: (ctx) => {
      const rows = mockDb.all('staffMembers');
      const { search, role, status } = ctx.query;
      let filtered = rows;
      if (search) filtered = filtered.filter((r) => (r.name ?? r.email)?.toLowerCase().includes(search!.toLowerCase()));
      return filtered;
    },
  },
  {
    method: 'POST',
    pattern: '/sysadmin/staff',
    handler: (ctx) => {
      const staff: MockStaffMember = {
        id: newId('stf'),
        name: '',
        email: '',
        role: 'teacher',
        status: 'active',
        assignedStudents: [],
        ...bodyAs<Partial<MockStaffMember>>(ctx),
      };
      mockDb.insert('staffMembers', staff);
      return staff;
    },
  },
  {
    method: 'PATCH',
    pattern: '/sysadmin/staff/:id',
    handler: (ctx) => mockDb.updateById('staffMembers', requiredParam(ctx, 'id'), bodyAs<Partial<MockStaffMember>>(ctx)),
  },
  {
    method: 'DELETE',
    pattern: '/sysadmin/staff/:id',
    handler: (ctx) => ({ deleted: mockDb.removeById('staffMembers', requiredParam(ctx, 'id')) }),
  },
  {
    method: 'POST',
    pattern: '/sysadmin/staff/:id/reset-password',
    handler: () => ({ status: 'ok' as const }),
  },
  {
    method: 'POST',
    pattern: '/sysadmin/staff/:id/status',
    handler: (ctx) => mockDb.updateById('staffMembers', requiredParam(ctx, 'id'), bodyAs<any>(ctx)),
  },
  {
    method: 'POST',
    pattern: '/sysadmin/staff/bulk',
    handler: () => ({ status: 'ok' as const }),
  },
  {
    method: 'GET',
    pattern: '/sysadmin/roles',
    handler: () => mockDb.all('sysRoles'),
  },
  {
    method: 'POST',
    pattern: '/sysadmin/roles',
    handler: (ctx) => {
      const role: MockRole = { id: newId('role'), name: '', description: '', ...bodyAs<Partial<MockRole>>(ctx) };
      mockDb.insert('sysRoles', role);
      return role;
    },
  },
  {
    method: 'PATCH',
    pattern: '/sysadmin/roles/:id',
    handler: (ctx) => mockDb.updateById('sysRoles', requiredParam(ctx, 'id'), bodyAs<Partial<MockRole>>(ctx)),
  },
  {
    method: 'DELETE',
    pattern: '/sysadmin/roles/:id',
    handler: (ctx) => ({ deleted: mockDb.removeById('sysRoles', requiredParam(ctx, 'id')) }),
  },
  {
    method: 'GET',
    pattern: '/sysadmin/roles/:id/permissions',
    handler: () => ({ matrix: {}, presets: [] }),
  },
  {
    method: 'POST',
    pattern: '/sysadmin/roles/:id/permissions',
    handler: (ctx) => mockDb.insert('auditLogs', { id: newId('audit'), action: 'permission_change', resource: 'role', resourceId: requiredParam(ctx, 'id'), user: 'admin', timestamp: new Date().toISOString(), details: bodyAs<any>(ctx) }),
  },
  {
    method: 'GET',
    pattern: '/sysadmin/roles/:id/permissions/audit',
    handler: () => mockDb.all('auditLogs'),
  },
  {
    method: 'GET',
    pattern: '/sysadmin/audit-logs',
    handler: () => mockDb.all('auditLogs'),
  },

  // ---- Institutional Admin ----
  {
    method: 'GET',
    pattern: '/admin/forms/:formName',
    handler: () => ({ config: {} }),
  },
  {
    method: 'POST',
    pattern: '/admin/forms/:formName',
    handler: (ctx) => ({ saved: true }),
  },
  {
    method: 'POST',
    pattern: '/admin/forms/:formName/reset',
    handler: () => ({ reset: true }),
  },
  {
    method: 'GET',
    pattern: '/admin/trial-logging-config',
    handler: () => ({ promptLevels: mockDb.all('promptLevels') }),
  },
  {
    method: 'POST',
    pattern: '/admin/trial-logging-config',
    handler: (ctx) => ({ saved: bodyAs<any>(ctx) }),
  },
  {
    method: 'GET',
    pattern: '/admin/abc-lists',
    handler: () => ({ lists: ['locations', 'behaviors', 'antecedents', 'consequences'] }),
  },
  {
    method: 'POST',
    pattern: '/admin/abc-lists/:listType',
    handler: (ctx) => ({ saved: true }),
  },
  {
    method: 'POST',
    pattern: '/admin/abc-lists/reset',
    handler: () => ({ reset: true }),
  },
  {
    method: 'GET',
    pattern: '/admin/schedule-capacity-config',
    handler: () => ({ morningStart: '08:00', afternoonStart: '13:00', capacity: 4 }),
  },
  {
    method: 'POST',
    pattern: '/admin/schedule-capacity-config',
    handler: (ctx) => ({ saved: bodyAs<any>(ctx) }),
  },
  {
    method: 'GET',
    pattern: '/admin/goal-domains',
    handler: () => mockDb.all('adminConfigs').find((c) => c.id === 'goalDomains')?.value ?? [],
  },
  {
    method: 'POST',
    pattern: '/admin/goal-domains',
    handler: (ctx) => { mockDb.insert('adminConfigs', { id: 'goalDomains', value: Array.isArray(bodyAs<any>(ctx)) ? bodyAs<any>(ctx) : [] }); return { saved: true }; },
  },
  {
    method: 'GET',
    pattern: '/admin/task-analysis-templates',
    handler: () => [],
  },
  {
    method: 'POST',
    pattern: '/admin/task-analysis-templates',
    handler: () => ({ saved: true }),
  },
  {
    method: 'PATCH',
    pattern: '/admin/task-analysis-templates/:id',
    handler: () => ({ saved: true }),
  },
  {
    method: 'DELETE',
    pattern: '/admin/task-analysis-templates/:id',
    handler: () => ({ deleted: true }),
  },
  {
    method: 'GET',
    pattern: '/admin/clinic-info',
    handler: () => ({ name: 'Melue Foundation' }),
  },
  {
    method: 'POST',
    pattern: '/admin/clinic-info',
    handler: (ctx) => ({ saved: bodyAs<any>(ctx) }),
  },
  {
    method: 'GET',
    pattern: '/admin/working-hours',
    handler: () => ({}),
  },
  {
    method: 'POST',
    pattern: '/admin/working-hours',
    handler: (ctx) => ({ saved: bodyAs<any>(ctx) }),
  },
  {
    method: 'GET',
    pattern: '/admin/school-settings',
    handler: () => ({}),
  },
  {
    method: 'POST',
    pattern: '/admin/school-settings',
    handler: (ctx) => ({ saved: bodyAs<any>(ctx) }),
  },
  {
    method: 'GET',
    pattern: '/admin/clinical-categories',
    handler: () => ({ programs: [], assessmentTypes: [], therapyTypes: [] }),
  },
  {
    method: 'POST',
    pattern: '/admin/clinical-categories/:category',
    handler: () => ({ saved: true }),
  },
  {
    method: 'PATCH',
    pattern: '/admin/clinical-categories/:category/:itemId',
    handler: () => ({ saved: true }),
  },
  {
    method: 'DELETE',
    pattern: '/admin/clinical-categories/:category/:itemId',
    handler: () => ({ deleted: true }),
  },
  {
    method: 'PUT',
    pattern: '/admin/prompt_levels/reorder',
    handler: () => ({ status: 'ok' as const }),
  },

  // ---- Goal Mastery Approvals (detailed) ----
  {
    method: 'GET',
    pattern: '/director/mastery-approvals',
    handler: () => mockDb.all('masteryChecks'),
  },

  // ---- Report sessions ----
  {
    method: 'GET',
    pattern: '/director/reports/sessions',
    handler: () => mockDb.all('sessionSummaries'),
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