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
import { seed, type DemoConversation, type DemoMessage, type DemoRole } from './seed';
import { mockDb } from './db';
import { reassignStudentsInStore, getWeekData, resolveTherapistName } from '../../stores/scheduleStore';
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
    pattern: '/notifications',
    handler: (ctx) => {
      const p = bodyAs<{ type?: string; payload?: Record<string, unknown> | null }>(ctx);
      const row = {
        id: newId('ntf'),
        type: p.type ?? 'message',
        payload: p.payload ?? null,
        read: false,
        readAt: null,
        createdAt: new Date().toISOString(),
      };
      mockDb.insert('notifications', row);
      return notificationDisplayRow(row);
    },
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
      const summaries = mockDb.all('sessionSummaries');
      const childGoals = child?.goals ?? [];
      const avgIndependence = childGoals.length
        ? Math.round(childGoals.reduce((s, g) => s + g.progressPercent, 0) / childGoals.length)
        : 68;
      return {
        parentName: parentUser?.name ?? 'Parent',
        childSummary: child
          ? { id: child.id, fullName: child.fullName, age: child.age, programType: child.programType, therapyGroup: child.therapyGroup, goals: childGoals.map((g) => ({ id: g.id, name: g.name, status: g.status, progressPercent: g.progressPercent })) }
          : null,
        sessionsThisWeek: Math.min(5, Math.max(1, summaries.length)),
        sessionsTotal: Math.max(summaries.length, 5),
        independencePercent: avgIndependence,
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
      const iups = mockDb.all('iups').filter((i) => i.studentId === child.id && i.status === 'active');
      const station1Goals = iups.length > 0 ? iups[0].goals.slice(0, 2) : goals.slice(0, 2).map((g) => g.name);
      const station2Goals = iups.length > 0 ? iups[0].goals.slice(2) : goals.slice(2).map((g) => g.name);
      const summaries = mockDb.all('sessionSummaries').filter((s) => s.studentIds.includes(child.id));
      const behaviorIncidents = mockDb.all('incidents').filter((i) => i.studentId === child.id);
      return {
        childName: child.fullName,
        age: child.age,
        program: child.programType,
        group: child.therapyGroup,
        goals,
        sessionHistory: parentSessionHistory(child),
        sessionsThisMonth: Math.max(summaries.length, 1),
        goalsMastered: goals.filter((g) => g.status === 'Mastered').length,
        totalTrials: trialsForGoals(child.goals.map((g) => g.id)).length,
        averageIndependence: studentIndependence(child.id),
        behaviorTrends: behaviorTrendsForChild(child.id),
        behaviorSummary: behaviorIncidents.length > 0
          ? `This month: ${behaviorIncidents.length} incident(s) recorded.`
          : 'No incidents recorded this month.',
        iupStation1: station1Goals.length > 0 ? station1Goals : ['No goals assigned'],
        iupStation2: station2Goals.length > 0 ? station2Goals : ['No goals assigned'],
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
    handler: () => {
      const user = currentUserFromToken();
      const childIds = user?.childIds ?? [];
      // Build conversation list from the parent's children → assigned teachers
      const list = childIds.map((sid) => {
        const convo = getOrCreateConvo(sid);
        if (!convo) return null;
        return {
          id: convo.id,
          recipient: convo.teacherName,
          role: 'Teacher',
          unread: convo.unread || 0,
          lastMessage: convo.lastMessage || 'Start a conversation...',
          time: convo.time || '',
        };
      }).filter(Boolean);
      // Fallback: if no childIds, show all conversations
      if (list.length === 0) {
        return mockDb.all('conversations').map((c: any) => ({
          id: c.id,
          recipient: c.teacherName || c.recipient || 'Teacher',
          role: 'Teacher',
          unread: c.unread || 0,
          lastMessage: c.lastMessage || 'Start a conversation...',
          time: c.time || '',
        }));
      }
      return list;
    },
  },
  {
    method: 'GET',
    pattern: '/parent/conversations/:id',
    handler: (ctx) => {
      const convo = mockDb.findById('conversations', requiredParam(ctx, 'id'));
      if (!convo) return { id: requiredParam(ctx, 'id'), messages: [] };
      return { id: convo.id, messages: (convo as any).messages ?? [] };
    },
  },
  {
    method: 'POST',
    pattern: '/parent/conversations/:id/messages',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const { text } = bodyAs<{ text: string }>(ctx);
      if (!text) throw new ApiError('Message text is required', 422);
      // Bootstrap the thread when it does not exist yet
      const existing =
        mockDb.findById('conversations', id) ?? {
          id,
          studentId: '',
          studentName: 'Student',
          parentName: '',
          teacherName: '',
          recipient: 'Therapy Team',
          role: 'Staff',
          unread: 0,
          lastMessage: '',
          time: '',
          messages: [] as DemoConversation['messages'],
        };
      if (!mockDb.findById('conversations', id)) {
        mockDb.insert('conversations', existing);
      }
      const user = currentUserFromToken();
      const message = {
        id: newId('msg'),
        from: 'parent' as const,
        senderName: user?.name ?? 'Parent',
        text,
        sentAt: new Date().toISOString(),
      };
      mockDb.updateById('conversations', id, {
        messages: [...existing.messages, message],
        lastMessage: text,
        time: 'Just now',
        unread: 1,
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
  // Coordinator / Operational Management: reassign students between therapists
  {
    method: 'POST',
    pattern: '/schedule/reassign',
    handler: (ctx) => {
      const { fromTherapistId, toTherapistId, studentIds } = bodyAs<{
        fromTherapistId: string;
        toTherapistId: string;
        studentIds: string[];
      }>(ctx);
      if (!fromTherapistId || !toTherapistId) throw new ApiError('fromTherapistId and toTherapistId are required', 422);
      // Persist the move across every day of the week so the schedule store
      // and the Operational Management grid stay in sync.
      for (let day = 0; day < 7; day++) {
        reassignStudentsInStore(day, fromTherapistId, toTherapistId, studentIds ?? []);
      }
      return { status: 'ok' as const, fromTherapistId, toTherapistId, moved: studentIds?.length ?? 0 };
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
    handler: () => {
      const pendingMastery = mockDb.all('masteryChecks').filter((m) => m.status === 'pending');
      const pendingReportsList = mockDb.all('sessionSummaries').filter((s) => s.status === 'pending_review');
      const recentActivity = [
        ...pendingMastery.slice(0, 3).map((m) => `Goal mastery submitted for approval - ${m.requestedByName ?? 'Teacher'}`),
        ...pendingReportsList.slice(0, 3).map((s) => `Session report flagged for review - ${s.teacher}`),
      ].slice(0, 5);
      return {
        unreadCount: mockDb.all('notifications').filter((n) => !n.read).length,
        totalStudents: mockDb.all('students').filter((s) => s.status !== 'paused').length,
        activeTeachers: mockDb.all('users').filter((u) => u.role === 'teacher').length,
        pendingApprovals: pendingMastery.length,
        unreadParentMessages: mockDb.all('conversations').reduce((sum, c) => sum + c.unread, 0),
        pendingReports: pendingReportsList.length,
        recentActivity,
      };
    },
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
    handler: () => {
      const students = mockDb.all('students');
      const goals = students.flatMap((s) => s.goals);
      const avgGoalProgress = goals.length
        ? Math.round(goals.reduce((sum, g) => sum + g.progressPercent, 0) / goals.length)
        : 0;
      return {
        attendanceRate: 92,
        masteredGoalsCount: goals.filter((g) => g.status === 'mastered').length,
        totalTrialCount: mockDb.all('trials').length,
        activeProgramsCount: new Set(students.map((s) => s.programType)).size,
        totalStudents: students.filter((s) => s.status !== 'paused').length,
        totalTeachers: Math.max(1, mockDb.all('users').filter((u) => u.role === 'teacher').length),
        sessionsThisMonth: Math.max(mockDb.all('sessionSummaries').length, 24),
        avgGoalProgress,
      };
    },
  },
  // ---- Student Progress ----
  {
    method: 'GET',
    pattern: '/director/students/:id/progress',
    handler: (ctx) => buildStudentProgress(requiredParam(ctx, 'id'), false),
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
      const allTrials = mockDb.all('trials') as Array<{
        studentGoalId: string;
        promptLabel?: string | null;
        loggedAt?: string;
      }>;
      const trialsForGoal = (goalId: string) =>
        allTrials
          .filter((t) => t.studentGoalId === goalId)
          .map((t) => ({
            promptLevel: t.promptLabel || 'G',
            timestamp:
              t.loggedAt ||
              new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
          }));
      return {
        sessionId: id,
        stationName: 'Station 1 — Basic Skills',
        roomName: 'Room 2',
        blockDurationMinutes: 90,
        students: [
          {
            id: 'student-a',
            name: 'Student A',
            initial: 'A',
            program: 'Basic',
            active: true,
            goals: [
              { id: 'goal-1', name: 'Identify Colors', category: 'Cognitive' },
              { id: 'goal-2', name: 'Goal 2', category: '' },
            ],
            trials: trialsForGoal('goal-1').concat(trialsForGoal('goal-2')),
          },
          {
            id: 'student-b',
            name: 'Student B',
            initial: 'B',
            program: 'Functional',
            active: false,
            goals: [
              { id: 'goal-3', name: 'Request Items', category: 'Expressive Language' },
              { id: 'goal-4', name: 'Goal 2', category: '' },
            ],
            trials: trialsForGoal('goal-3').concat(trialsForGoal('goal-4')),
          },
        ],
      };
    },
  },
  {
    method: 'POST',
    pattern: '/sessions/:id/students/:studentId/incidents',
    handler: (ctx) => {
      const body = bodyAs<{
        antecedent?: string;
        behavior?: string;
        consequence?: string;
        additionalNotes?: string;
        location?: string;
      }>(ctx);
      const incident: MockIncident = {
        id: newId('inc'),
        studentId: requiredParam(ctx, 'studentId'),
        sessionId: requiredParam(ctx, 'id'),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: body.location || '',
        behavior: body.behavior || '',
        behaviorDefinition: '',
        frequency: '',
        intensity: '',
        category: '',
        antecedent: body.antecedent || '',
        consequence: body.consequence || '',
        notes: body.additionalNotes || '',
        recordedBy: 'Teacher',
        createdAt: new Date().toISOString(),
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
      const body = bodyAs<{ promptLevel?: string; timestamp?: string; stepId?: string }>(ctx);
      const promptLevel = (body.promptLevel || 'G').toUpperCase();
      const trial: Trial = {
        id: newId('tr'),
        outcome: 'correct',
        promptLabel: promptLevel as any,
        promptLevelId: promptLevel,
        studentGoalId: gid,
        studentGoalStepId: body.stepId ? (body.stepId as any) : null,
        clientEventId: newId('evt'),
        loggedAt: body.timestamp || new Date().toISOString(),
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
      const sid = requiredParam(ctx, 'sid');
      const gid = requiredParam(ctx, 'gid');
      const checks = mockDb.all('masteryChecks').filter((m) => m.studentGoalId === gid);
      const dbCheck = checks[0];
      return {
        studentName: sid === 'student-b' ? 'Student B' : 'Student A',
        goalName: gid === 'goal-3' ? 'Request Items' : 'Identify Colors',
        station: 'Station 1 - Basic Skills',
        dateInitiated: 'May 24, 2025',
        initiatedBy: 'Maria Reyes',
        initiatedByRole: 'Teacher A',
        statusLabel: dbCheck ? (dbCheck.status || 'Pending') : 'Draft',
        primaryTeacher: {
          name: 'Maria Reyes',
          criteriaMet: '5 consecutive sessions at 100% independent.',
          dateAchieved: 'May 24, 2025',
          totalTrials: 50,
          independenceRate: '100% (+)',
          notes: '',
        },
        teacherB: { name: 'Jared Cruz', date: '2025-05-24' },
        teacherC: { name: 'Jeah Torres', date: '2025-05-24' },
      };
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
      const students = [
        {
          id: 'student-a',
          name: 'Student A',
          goals: [
            {
              id: 'goal-1',
              name: 'Identify Colors',
              goalType: 'standard',
              independencePercent: 40,
              totalTrials: 10,
              promptBreakdown: { FP: 1, PP: 2, G: 3, INDEPENDENT: 4 },
              trialLog: [],
            },
            {
              id: 'goal-2',
              name: 'Follow 2-Step Commands',
              goalType: 'standard',
              independencePercent: 70,
              totalTrials: 10,
              promptBreakdown: { FP: 0, PP: 1, G: 2, INDEPENDENT: 7 },
              trialLog: [],
            },
          ],
        },
        {
          id: 'student-b',
          name: 'Student B',
          goals: [
            {
              id: 'goal-3',
              name: 'Request Items',
              goalType: 'standard',
              independencePercent: 60,
              totalTrials: 10,
              promptBreakdown: { FP: 1, PP: 1, G: 2, INDEPENDENT: 6 },
              trialLog: [],
            },
          ],
        },
      ];

      const nameById = (sid: string) =>
        (mockDb.all('students') as Array<{ id: string; name?: string }>).find(
          (s) => s.id === sid
        )?.name || sid;
      const recordedIncidents = (
        mockDb.all('incidents') as Array<{
          sessionId?: string;
          studentId: string;
          time: string;
          behavior: string;
          antecedent: string;
          consequence: string;
          location: string;
          notes: string;
        }>
      )
        .filter((i) => i.sessionId === id)
        .map((i) => ({
          time: i.time,
          behavior: i.behavior || 'Unspecified behavior',
          studentName: nameById(i.studentId),
          antecedent: i.antecedent,
          consequence: i.consequence,
          location: i.location,
          notes: i.notes,
        }));

      const incidents =
        recordedIncidents.length > 0
          ? recordedIncidents
          : [
              {
                time: '9:12 AM',
                behavior: 'Tantrum',
                studentName: 'Student A',
                antecedent: '',
                consequence: '',
                location: '',
                notes: '',
              },
            ];

      if (summary) {
        return {
          ...summary,
          stationName: summary.station || 'Station A',
          teacherName: summary.teacher || 'Teacher A',
          startTime: '9:00 AM',
          endTime: '10:30 AM',
          durationMinutes: 90,
          students,
          incidents,
        };
      }

      return {
        id: id,
        stationName: 'Station A',
        teacherName: 'Teacher A',
        startTime: '9:00 AM',
        endTime: '9:30 AM',
        durationMinutes: 30,
        notes: '',
        status: 'pending_review',
        students,
        incidents,
      };
    },
  },
  {
    method: 'POST',
    pattern: '/sessions/:id/summary',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const payload = bodyAs<{ notes: string; status?: string }>(ctx);
      const dbStudents = mockDb.all('students').filter((s) => s.status !== 'paused');
      const studentIds = dbStudents.slice(0, 2).map((s) => s.id);
      const teacher = mockDb.all('staffMembers').find((s) => s.role === 'teacher')?.name ?? 'Teacher';
      const summary: MockSessionSummary = {
        id: id,
        sessionId: id,
        studentIds,
        station: 'Station 1',
        teacher,
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
    handler: () => buildDailyNotes(),
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
  { method: 'GET', pattern: '/session-notes/weekly-summary', handler: () => buildWeeklySummary() },
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
    handler: () => buildAttendanceRoster(),
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
    handler: () => {
      const students = mockDb.all('students').filter((s) => s.status !== 'paused');
      const teacher = mockDb.all('staffMembers').find((s) => s.role === 'teacher');
      const teacherName = teacher?.name ?? 'Teacher';

      // Today's schedule from the schedule store or derived from students
      const scheduleStudents = students.slice(0, 2).map((s) => ({ id: s.id, name: s.fullName, initial: s.fullName.charAt(0) }));
      const todaySchedule = {
        stationName: 'Station 1 — Basic Skills',
        roomName: 'Room 2',
        sessionBlock: 'Block B · Daily Living',
        startTime: '9:00 AM',
        endTime: '10:30 AM',
        startsIn: 'Starts in 3h 58m',
        students: scheduleStudents,
      };

      // Assessment tasks from the assessments collection
      const assessments = mockDb.all('assessments');
      const assessmentTasks = students.map((s) => {
        const ablls = assessments.find((a) => a.studentId === s.id && a.type === 'skills');
        const behavior = assessments.find((a) => a.studentId === s.id && a.type === 'behavior');
        const abllsStatus = ablls ? (ablls.status === 'completed' || ablls.status === 'submitted' ? 'Completed' : 'In Progress') : 'Not Started';
        const behaviorStatus = behavior ? (behavior.status === 'completed' || behavior.status === 'submitted' ? 'Completed' : 'In Progress') : 'Not Started';
        const progress = ablls ? Math.min(90, Object.keys(ablls.data ?? {}).length * 10) : 0;
        return {
          id: `assess-${s.id}`,
          studentName: s.fullName,
          studentInitial: s.fullName.charAt(0),
          assessmentName: 'ABLLS Assessment',
          status: abllsStatus,
          progress: abllsStatus === 'Completed' ? 100 : progress,
        };
      }).filter((t) => t.status !== 'Completed').slice(0, 5);

      // Pending mastery checks from masteryChecks collection
      const pendingChecks = mockDb.all('masteryChecks').filter((m) => m.status === 'pending');
      const pendingMasteryChecks = pendingChecks.map((mc) => {
        const student = students.find((s) => s.goals?.some((g) => g.id === mc.studentGoalId));
        const goal = student?.goals?.find((g) => g.id === mc.studentGoalId);
        return {
          id: mc.id,
          studentId: student?.id ?? '',
          goalId: mc.studentGoalId,
          studentName: student?.fullName ?? 'Unknown',
          goalName: goal?.name ?? 'Unknown Goal',
          pendingLabel: 'Pending B/C verification',
        };
      });

      // Notifications from the notifications collection
      const notifications = mockDb.all('notifications').slice(0, 5).map((n) => {
        const typeMap: Record<string, string> = { observation: 'goal', appointment: 'alert', announcement: 'approved', goal: 'revision', message: 'message', alert: 'alert' };
        return {
          id: n.id,
          type: typeMap[n.type] ?? n.type,
          title: n.payload && typeof n.payload === 'object' && 'title' in (n.payload as Record<string, unknown>)
            ? String((n.payload as Record<string, unknown>).title)
            : `${n.type} notification`,
          source: 'System',
          timeAgo: 'Just now',
          unread: !n.read,
        };
      });

      return { todaySchedule, assessmentTasks, pendingMasteryChecks, notifications };
    },
  },
  {
    method: 'GET',
    pattern: '/teacher/assessments/dashboard',
    handler: () => buildAssessmentDashboard(),
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
      if (studentId && studentId !== 'All') incidents = incidents.filter((i) => i.studentId === studentId);
      if (from) incidents = incidents.filter((i) => new Date(i.createdAt) >= new Date(from as string));
      if (to) incidents = incidents.filter((i) => new Date(i.createdAt) <= new Date(`${to}T23:59:59`));
      if (behavior && behavior !== 'All') incidents = incidents.filter((i) => i.behavior === behavior);
      if (category && category !== 'All') incidents = incidents.filter((i) => i.category === category);
      const rows = incidents.map((i) => ({ ...i, teacher: i.recordedBy }));
      const weekAgo = Date.now() - 7 * 86400000;
      const counts = new Map<string, number>();
      for (const i of incidents) counts.set(i.behavior, (counts.get(i.behavior) ?? 0) + 1);
      const antecedentCounts = new Map<string, number>();
      for (const i of incidents) antecedentCounts.set(i.antecedent, (antecedentCounts.get(i.antecedent) ?? 0) + 1);
      const mostCommon = (m: Map<string, number>) =>
        Array.from(m.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
      return {
        rows,
        incidents: rows,
        stats: {
          totalIncidents: rows.length,
          mostCommonBehavior: mostCommon(counts),
          mostCommonAntecedent: mostCommon(antecedentCounts),
          thisWeek: incidents.filter((i) => new Date(i.createdAt).getTime() >= weekAgo).length,
        },
      };
    },
  },
  {
    method: 'GET',
    pattern: '/teacher/abc-log/export',
    handler: () => ({ csv: 'date,time,behavior,notes\n' }),
  },
  {
    method: 'DELETE',
    pattern: '/teacher/abc-log/:id',
    handler: (ctx) => ({ removed: mockDb.removeById('incidents', requiredParam(ctx, 'id')) }),
  },
  {
    method: 'GET',
    pattern: '/teacher/notifications',
    handler: () => mockDb.all('notifications').map(notificationDisplayRow),
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
      const user = currentUserFromToken();
      const staff = user ? staffForUser(user.id) : null;
      // Build conversation list from the teacher's assigned students → parents
      const assignedIds = staff?.assignedStudents ?? [];
      const list = assignedIds.map((sid) => {
        const convo = getOrCreateConvo(sid);
        if (!convo) return null;
        return {
          id: convo.id,
          studentName: convo.studentName,
          parentName: convo.parentName,
          lastMessagePreview: convo.lastMessage || 'Start a conversation...',
          unreadCount: convo.unread || 0,
          resolved: false,
        };
      }).filter(Boolean);
      // If no assigned students, show all conversations
      if (list.length === 0) {
        return mockDb.all('conversations').map((c: any) => ({
          id: c.id,
          studentName: c.studentName || c.recipient || 'Student',
          parentName: c.parentName || 'Parent',
          lastMessagePreview: c.lastMessage || 'Start a conversation...',
          unreadCount: c.unread || 0,
          resolved: !!c.resolved,
        }));
      }
      return list;
    },
  },
  {
    method: 'GET',
    pattern: '/teacher/conversations/:id',
    handler: (ctx) => {
      const convo = mockDb.findById('conversations', requiredParam(ctx, 'id'));
      if (!convo) return { id: requiredParam(ctx, 'id'), messages: [] };
      return { id: convo.id, messages: (convo as any).messages ?? [] };
    },
  },
  {
    method: 'POST',
    pattern: '/teacher/conversations/:id/messages',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const { text } = bodyAs<{ text: string }>(ctx);
      const user = currentUserFromToken();
      return appendTeamMessage(id, user?.name ?? 'Teacher', text);
    },
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
    handler: () => {
      const active = buildActiveSessions();
      const pendingRows = mockDb
        .all('sessionSummaries')
        .filter((s) => s.status === 'pending_review')
        .map(summaryDisplayRow);
      const sessionsCompleted = mockDb.all('sessionSummaries').filter((s) => s.status === 'approved').length;
      const trialsLogged = mockDb.all('trials').length;
      const incidents = mockDb.all('incidents').length;
      const goalsMastered = mockDb.all('students').flatMap((s) => s.goals).filter((g) => g.status === 'mastered').length;
      return {
        summary: { sessionsCompleted: Math.max(sessionsCompleted, 1), trialsLogged, incidents, goalsMastered },
        unreadCount: mockDb.all('conversations').reduce((sum, c) => sum + (c.unread ?? 0), 0),
        activeSessionsCount: active.length,
        pendingReviewCount: pendingRows.length,
        studentsInTherapyCount: mockDb.all('students').filter((s) => s.status !== 'paused').length,
        teachersOnDutyCount: Math.max(1, mockDb.all('users').filter((u) => u.role === 'teacher').length),
        liveSessions: active.map((s) => ({
          id: s.id,
          teacherName: s.teacherName,
          stationName: s.stationName,
          status:
            s.status === 'On Track' ? 'green' : s.status === 'Needs Attention' ? 'yellow' : 'red',
          studentCount: s.studentNames.length,
        })),
        pendingReviews: pendingRows.map((r) => ({
          id: r.id,
          teacherName: r.teacherName,
          stationName: r.stationName,
          date: r.date,
          studentNames: r.studentNames,
          independencePercent: r.independencePercent,
          incidents: 0,
        })),
      };
    },
  },
  {
    method: 'GET',
    pattern: '/coordinator/sessions/active',
    handler: () => buildActiveSessions(),
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
    handler: () =>
      mockDb
        .all('sessionSummaries')
        .filter((s) => s.status === 'pending_review')
        .map(summaryDisplayRow),
  },
  {
    method: 'POST',
    pattern: '/coordinator/summaries/bulk-approve',
    handler: (ctx) => {
      const { summaryIds } = bodyAs<{ summaryIds: string[] }>(ctx);
      (summaryIds ?? []).forEach((id) => mockDb.updateById('sessionSummaries', id, { status: 'approved' }));
      return { status: 'ok' as const, updated: summaryIds?.length ?? 0 };
    },
  },
  {
    method: 'POST',
    pattern: '/coordinator/summaries/:id/approve',
    handler: (ctx) => {
      const updated = mockDb.updateById('sessionSummaries', requiredParam(ctx, 'id'), { status: 'approved' });
      if (!updated) throw notFound(requiredParam(ctx, 'id'));
      return summaryDisplayRow(updated as MockSessionSummary);
    },
  },
  {
    method: 'POST',
    pattern: '/coordinator/summaries/:id/request-changes',
    handler: (ctx) => {
      const { reason } = bodyAs<{ section?: string; reason?: string }>(ctx);
      const updated = mockDb.updateById('sessionSummaries', requiredParam(ctx, 'id'), {
        status: 'revised_required',
        notes: reason ? `${mockDb.findById('sessionSummaries', requiredParam(ctx, 'id'))?.notes ?? ''}\n\nCoordinator revision request: ${reason}` : undefined,
      });
      if (!updated) throw notFound(requiredParam(ctx, 'id'));
      return summaryDisplayRow(updated as MockSessionSummary);
    },
  },
  {
    method: 'GET',
    pattern: '/coordinator/students',
    handler: (ctx) => {
      let rows = mockDb.all('students');
      const { search, status, program, therapyGroup } = ctx.query;
      if (search) rows = rows.filter((s) => s.fullName.toLowerCase().includes(search!.toLowerCase()));
      return rows.map((s) => ({ id: s.id, fullName: s.fullName, age: ageOf(s), programType: s.programType, therapyGroup: s.therapyGroup, status: s.status }));
    },
  },
  {
    method: 'POST',
    pattern: '/coordinator/students',
    handler: (ctx) => {
      const p = bodyAs<{
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        programType: string;
        therapyGroup: string;
        gender?: string;
        parentName?: string;
        parentPhone?: string;
        parentEmail?: string;
        diagnosis?: string;
        medicalNotes?: string;
        documents?: string[];
        customFields?: Record<string, any>;
      }>(ctx);
      const student = {
        id: newId('stu'),
        fullName: `${p.firstName} ${p.lastName}`.trim(),
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dateOfBirth,
        programType: p.programType,
        therapyGroup: p.therapyGroup,
        status: 'active',
        gender: p.gender ?? '',
        parentName: p.parentName ?? '',
        parentPhone: p.parentPhone ?? '',
        parentEmail: p.parentEmail ?? '',
        diagnosis: p.diagnosis ?? '',
        medicalNotes: p.medicalNotes ?? '',
        documents: p.documents ?? [],
        customFields: p.customFields ?? {},
        goals: [],
      };
      mockDb.insert('students', student as any);
      return student;
    },
  },
  {
    method: 'GET',
    pattern: '/coordinator/students/:sid/progress',
    handler: (ctx) => buildStudentProgress(requiredParam(ctx, 'sid'), true),
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
    handler: () => buildTeacherMetrics(),
  },
  {
    method: 'GET',
    pattern: '/coordinator/teachers/workload',
    handler: () => buildWorkload(),
  },
  {
    method: 'GET',
    pattern: '/coordinator/teachers/workload/trend',
    handler: () => buildWorkloadTrend(),
  },
  {
    method: 'GET',
    pattern: '/coordinator/rooms-resources',
    handler: () => ({
      rooms: [
        { id: 'room-1', name: 'Sunrise Room', capacity: 6, status: 'Available' },
        { id: 'room-2', name: 'Horizon Room', capacity: 4, status: 'In Session' },
        { id: 'room-3', name: 'Sensory Room', capacity: 2, status: 'Maintenance' },
      ],
      resources: [
        { id: 'res-1', name: 'Token Boards', total: 10, inUse: 4 },
        { id: 'res-2', name: 'Picture Cards', total: 8, inUse: 8 },
        { id: 'res-3', name: 'iPads', total: 5, inUse: 2 },
      ],
    }),
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
    handler: (ctx) => {
      const { text } = bodyAs<{ text: string }>(ctx);
      return appendTeamMessage(requiredParam(ctx, 'id'), 'Therapy Coordinator', text);
    },
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
    handler: () => mockDb.all('notifications').map(notificationDisplayRow),
  },

  // ---- Program Director ----
  {
    method: 'GET',
    pattern: '/program-director/dashboard',
    handler: () => {
      const students = mockDb.all('students').filter((s) => s.status !== 'paused');
      const assessments = mockDb.all('assessments');
      const iups = mockDb.all('iups');
      const goalBank = mockDb.all('goalBank');
      const inAssessment = students.filter((s) => assessments.some((a) => a.studentId === s.id && a.status === 'in_progress')).length;
      const activeIups = iups.filter((i) => i.status === 'active').length;
      const readyForIup = students.filter((s) => !iups.some((i) => i.studentId === s.id)).length;
      const goalsAssigned = students.reduce((sum, s) => sum + (s.goals?.length ?? 0), 0);
      const recentActivity = [
        ...students
          .filter((s) => assessments.some((a) => a.studentId === s.id && a.status === 'in_progress'))
          .slice(0, 3)
          .map((s) => `Assessment in progress - ${s.fullName}`),
        ...iups
          .filter((i) => i.status === 'active')
          .slice(0, 3)
          .map((i) => {
            const student = students.find((s) => s.id === i.studentId);
            return `IUP active - ${student?.fullName ?? 'Student'}`;
          }),
      ].slice(0, 5);
      return {
        unreadCount: mockDb.all('notifications').filter((n) => !n.read).length,
        studentsInAssessment: Math.max(inAssessment, 1),
        readyForIup: Math.max(readyForIup, 1),
        activeIupPlans: Math.max(activeIups, 1),
        goalsAssignedThisMonth: Math.max(goalsAssigned, 1),
        pipeline: [
          { name: 'In Assessment', count: inAssessment },
          { name: 'Ready for IUP', count: readyForIup },
          { name: 'Active IUP', count: activeIups },
        ],
        recentActivity,
      };
    },
  },
  {
    method: 'GET',
    pattern: '/program-director/assessments',
    handler: () => buildAssessmentReviewList(),
  },
  {
    method: 'GET',
    pattern: '/program-director/assessments/:studentId/report',
    handler: (ctx) => buildAssessmentReport(requiredParam(ctx, 'studentId')),
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
    handler: () => {
      const assessed = new Set(mockDb.all('assessments').map((a) => a.studentId));
      return mockDb
        .all('students')
        .filter((s) => s.status !== 'paused')
        .map((s) => ({
          id: s.id,
          studentId: s.id,
          name: s.fullName,
          hasAssessmentData: assessed.has(s.id),
          status: assessed.has(s.id) ? 'Ready for IUP' : 'In Assessment',
        }));
    },
  },
  {
    method: 'GET',
    pattern: '/program-director/iup/:studentId/context',
    handler: (ctx) => buildIupContext(requiredParam(ctx, 'studentId')),
  },
  {
    method: 'POST',
    pattern: '/program-director/iup/:studentId/draft',
    handler: (ctx) => upsertIup(requiredParam(ctx, 'studentId'), 'draft', ctx),
  },
  {
    method: 'POST',
    pattern: '/program-director/iup/:studentId/finalize',
    handler: (ctx) => upsertIup(requiredParam(ctx, 'studentId'), 'active', ctx),
  },
  {
    method: 'GET',
    pattern: '/program-director/iup-library',
    handler: (ctx) => {
      let rows = mockDb.all('iups');
      const status = ctx.query.status;
      if (status && status !== 'All') {
        rows = rows.filter((i) => i.status === (status as MockIup['status']));
      }
      return rows.map(iupDisplayRow);
    },
  },
  {
    method: 'POST',
    pattern: '/program-director/iup-library/:id/archive',
    handler: (ctx) => mockDb.updateById('iups', requiredParam(ctx, 'id'), { status: 'archived' }),
  },
  {
    method: 'GET',
    pattern: '/program-director/caseload/:studentId',
    handler: (ctx) => {
      const sid = requiredParam(ctx, 'studentId');
      const student = mockDb.findById('students', sid);
      const assignments = mockDb.all('assignments');
      const assignment = assignments.find((a) => a.studentIds.includes(sid));
      const teacher = assignment ? mockDb.findById('users', assignment.teacherId) : null;
      const teachers = mockDb.all('users').filter((u) => u.role === 'teacher');
      return {
        name: student?.fullName ?? 'Student',
        primaryTeacher: teacher?.name ?? 'Unassigned',
        program: `${student?.programType ?? 'ABA'} Program`,
        goals: (student?.goals ?? []).map((g) => ({
          id: g.id,
          name: g.name,
          station: assignment?.stationId ? `Station ${assignment.stationId}` : 'Station 1',
          percent: g.progressPercent,
          assignedBy: 'Program Director',
        })),
        caseloadBalance: teachers.map((t) => ({
          teacherName: t.name,
          studentCount: new Set(
            assignments.filter((a) => a.teacherId === t.id).flatMap((a) => a.studentIds)
          ).size,
          capacity: 6,
        })),
      };
    },
  },
  {
    method: 'GET',
    pattern: '/program-director/goal-bank',
    handler: (ctx) => {
      let rows = mockDb.all('goalBank');
      const domain = ctx.query.domain as string | undefined;
      const q = ctx.query.q as string | undefined;
      if (domain && domain !== 'All') rows = rows.filter((g) => g.domain === domain);
      if (q) rows = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));
      return rows.map((g) => ({
        ...g,
        goalType: 'Standard',
        active: g.status !== 'inactive',
        usageCount: mockDb.all('students').filter((s) => s.goals.some((sg) => sg.id === g.id)).length,
      }));
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
    handler: (ctx) => {
      const sid = requiredParam(ctx, 'studentId');
      const student = mockDb.findById('students', sid);
      if (!student) throw notFound(sid);
      const { goalId, name, station } = bodyAs<{ goalId?: string; name?: string; station?: string }>(ctx);
      let goalName = name;
      if (goalId) {
        const bankGoal = mockDb.findById('goalBank', goalId);
        if (bankGoal) goalName = bankGoal.name;
      }
      if (!goalName) throw new ApiError('goalId or name is required', 422);
      const goal = { id: goalId ?? newId('goal'), name: goalName, status: 'active', progressPercent: 0 };
      mockDb.updateById('students', sid, { goals: [...student.goals, goal] });
      return { assigned: true, goal, station: station ?? null };
    },
  },
  {
    method: 'POST',
    pattern: '/program-director/caseload/:studentId/remove-goal',
    handler: (ctx) => {
      const sid = requiredParam(ctx, 'studentId');
      const student = mockDb.findById('students', sid);
      if (!student) throw notFound(sid);
      const { goalId, slot } = bodyAs<{ goalId?: string; slot?: string }>(ctx);
      const before = student.goals.length;
      const next = goalId
        ? student.goals.filter((g) => g.id !== goalId)
        : student.goals.filter((_, i) => i !== Number(slot ?? -1));
      mockDb.updateById('students', sid, { goals: next });
      return { removed: before !== next.length };
    },
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
    handler: (ctx) => {
      const { text } = bodyAs<{ text: string }>(ctx);
      return appendTeamMessage(requiredParam(ctx, 'id'), 'Program Director', text);
    },
  },
  {
    method: 'POST',
    pattern: '/program-director/conversations/:id/escalate',
    handler: (ctx) => ({ escalatedTo: 'director', conversationId: requiredParam(ctx, 'id') }),
  },
  {
    method: 'GET',
    pattern: '/program-director/charts',
    handler: (ctx) => buildGoalCharts(ctx.query.studentId ?? mockDb.all('students')[0]?.id ?? ''),
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
    handler: () => mockDb.all('notifications').map(notificationDisplayRow),
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
      if (search) {
        const needle = search.toLowerCase();
        filtered = filtered.filter((r) => r.name.toLowerCase().includes(needle) || r.email.toLowerCase().includes(needle));
      }
      if (status && status.toLowerCase() !== 'all') {
        filtered = filtered.filter((r) => (r.status === 'active') === (status.toLowerCase() === 'active'));
      }
      return filtered.map(staffDisplayRow);
    },
  },
  {
    method: 'POST',
    pattern: '/sysadmin/staff',
    handler: (ctx) => {
      const body = bodyAs<Partial<MockStaffMember> & { roles?: string[]; active?: boolean; password?: string }>(ctx);
      const primaryRole = body.role ?? roleKeyFromLabel(body.roles?.[0]) ?? 'teacher';
      const staff: MockStaffMember = {
        id: newId('stf'),
        name: body.name || '',
        email: body.email || '',
        role: primaryRole,
        status: body.status ?? (body.active === false ? 'inactive' : 'active'),
        assignedStudents: [],
      };
      mockDb.insert('staffMembers', staff);

      // Provision corresponding user account so the user can log in
      const userRole = (primaryRole || 'teacher') as DemoRole;
      const initialPassword = body.password || 'demo1234';
      const existingUser = mockDb.all('users').find((u) => u.email.toLowerCase() === staff.email.toLowerCase());
      if (existingUser) {
        mockDb.updateById('users', existingUser.id, {
          name: staff.name,
          password: initialPassword,
          role: userRole,
        });
      } else {
        mockDb.insert('users', {
          id: newId('user'),
          name: staff.name,
          email: staff.email,
          password: initialPassword,
          role: userRole,
          childIds: [],
        });
      }

      return staffDisplayRow(staff);
    },
  },
  {
    method: 'PATCH',
    pattern: '/sysadmin/staff/:id',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const body = bodyAs<Partial<MockStaffMember> & { roles?: string[]; active?: boolean; password?: string }>(ctx);
      const patch: Partial<MockStaffMember> = {
        name: body.name,
        email: body.email,
        role: body.role ?? (body.roles ? roleKeyFromLabel(body.roles[0]) : undefined),
        status: body.active !== undefined ? (body.active ? 'active' : 'inactive') : body.status,
      };
      const updated = mockDb.updateById('staffMembers', id, patch);
      if (updated) {
        const existingUser = mockDb.all('users').find((u) => u.email.toLowerCase() === (body.email || updated.email).toLowerCase());
        if (existingUser) {
          const userPatch: Record<string, any> = {};
          if (body.name) userPatch.name = body.name;
          if (body.email) userPatch.email = body.email;
          if (patch.role) userPatch.role = patch.role;
          if (body.password) userPatch.password = body.password;
          mockDb.updateById('users', existingUser.id, userPatch);
        }
      }
      return updated ? staffDisplayRow(updated) : null;
    },
  },
  {
    method: 'DELETE',
    pattern: '/sysadmin/staff/:id',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const staff = mockDb.findById('staffMembers', id);
      if (staff) {
        const user = mockDb.all('users').find((u) => u.email.toLowerCase() === staff.email.toLowerCase());
        if (user) {
          mockDb.removeById('users', user.id);
        }
      }
      return { deleted: mockDb.removeById('staffMembers', id) };
    },
  },
  {
    method: 'POST',
    pattern: '/sysadmin/staff/:id/reset-password',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const staff = mockDb.findById('staffMembers', id);
      const body = bodyAs<{ newPassword?: string }>(ctx);
      const newPassword = body?.newPassword || 'demo1234';
      if (staff) {
        const user = mockDb.all('users').find((u) => u.email.toLowerCase() === staff.email.toLowerCase());
        if (user) {
          mockDb.updateById('users', user.id, { password: newPassword });
        } else {
          mockDb.insert('users', {
            id: newId('user'),
            name: staff.name,
            email: staff.email,
            password: newPassword,
            role: (staff.role || 'teacher') as DemoRole,
            childIds: [],
          });
        }
      }
      return { status: 'ok' as const, password: newPassword };
    },
  },
  {
    method: 'POST',
    pattern: '/sysadmin/staff/:id/status',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const body = bodyAs<{ active?: boolean; status?: 'active' | 'inactive' }>(ctx);
      const nextStatus: 'active' | 'inactive' =
        body.status ?? (body.active !== undefined ? (body.active ? 'active' : 'inactive') : 'active');
      const updated = mockDb.updateById('staffMembers', id, { status: nextStatus });
      return updated ? staffDisplayRow(updated) : { status: 'ok' as const };
    },
  },
  {
    method: 'POST',
    pattern: '/sysadmin/staff/bulk',
    handler: (ctx) => {
      const body = bodyAs<{ staffIds?: string[]; action?: string }>(ctx);
      const action = body.action?.toLowerCase() || '';
      const targetStatus: 'active' | 'inactive' = action.includes('deact') ? 'inactive' : 'active';
      if (Array.isArray(body.staffIds)) {
        for (const sid of body.staffIds) {
          if (action.includes('delete')) {
            mockDb.removeById('staffMembers', sid);
          } else {
            mockDb.updateById('staffMembers', sid, { status: targetStatus });
          }
        }
      }
      return { status: 'ok' as const };
    },
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
    handler: (ctx) => {
      const roleId = requiredParam(ctx, 'id');
      const role = mockDb.findById('sysRoles', roleId);
      const now = new Date();
      mockDb.insert('auditLogs', {
        id: newId('audit'),
        action: 'changed' as const,
        resource: `permissions for ${role?.name ?? roleId}`,
        resourceId: roleId,
        user: 'Sysadmin A',
        timestamp: now.toISOString(),
        details: bodyAs<Record<string, unknown>>(ctx),
      });
      return { status: 'ok' as const };
    },
  },
  {
    method: 'GET',
    pattern: '/sysadmin/roles/:id/permissions/audit',
    handler: () => auditDisplayRows(),
  },
  {
    method: 'GET',
    pattern: '/sysadmin/audit-logs',
    handler: (ctx) => {
      let rows = auditDisplayRows();
      const { user, action, from, to, resource } = ctx.query;
      if (user) rows = rows.filter((r) => r.user === user);
      if (action && action !== 'All') rows = rows.filter((r) => r.action === action);
      if (resource) rows = rows.filter((r) => r.resource.toLowerCase().includes(resource.toLowerCase()));
      return rows;
    },
  },

  // ---- Institutional Admin ----
  {
    method: 'GET',
    pattern: '/admin/forms/:formName',
    handler: (ctx) => {
      const name = decodeURIComponent(requiredParam(ctx, 'formName')).trim();
      const saved = mockDb.all('adminConfigs').find(
        (c) => c.id === `form:${name}` || c.id.toLowerCase() === `form:${name.toLowerCase()}`
      );
      if (saved) {
        if (name.toLowerCase().includes('enrollment') && Array.isArray((saved.value as any)?.fields)) {
          const fields = (saved.value as any).fields.filter((f: any) => f.label !== 'Program Type' && f.id !== 'f3');
          return { ...(saved.value as any), fields };
        }
        return saved.value;
      }

      let defaultFields: Array<{ id: string; type: string; label: string; required: boolean; visible: boolean; options?: string[] }> = [];

      if (name.toLowerCase().includes('enrollment')) {
        defaultFields = [
          { id: 'f1', type: 'Text', label: 'Full Name', required: true, visible: true },
          { id: 'f2', type: 'Date', label: 'Date of Birth', required: true, visible: true },
          { id: 'f4', type: 'Text', label: 'Parent / Guardian Name', required: true, visible: true },
          { id: 'f5', type: 'Text', label: 'Parent Phone', required: true, visible: true },
          { id: 'f6', type: 'Text', label: 'Parent Email', required: true, visible: true },
          { id: 'f7', type: 'TextArea', label: 'Medical Notes & Allergies', required: false, visible: true },
          { id: 'f8', type: 'Checkbox', label: 'Transportation Required', required: false, visible: true },
          { id: 'f9', type: 'Text', label: 'Emergency Contact', required: false, visible: true },
        ];
      } else if (name.toLowerCase().includes('iup')) {
        defaultFields = [
          { id: 'i1', type: 'Text', label: 'Student Name', required: true, visible: true },
          { id: 'i2', type: 'Dropdown', label: 'Target Skill Domain', required: true, visible: true, options: ['Language & Communication', 'Social Interaction', 'Adaptive & Self-Care', 'Motor Skills', 'Cognitive'] },
          { id: 'i3', type: 'Number', label: 'Baseline Mastery (%)', required: true, visible: true },
          { id: 'i4', type: 'TextArea', label: 'Target Objective', required: true, visible: true },
          { id: 'i5', type: 'Dropdown', label: 'Service Setting', required: false, visible: true, options: ['Individual 1:1', 'Small Group', 'General Classroom', 'Community'] },
          { id: 'i6', type: 'TextArea', label: 'Special Accommodations', required: false, visible: true },
          { id: 'i7', type: 'Checkbox', label: 'Requires Assistive Technology', required: false, visible: true },
        ];
      } else if (name.toLowerCase().includes('ablls') || name.toLowerCase().includes('skills')) {
        defaultFields = [
          { id: 'a1', type: 'Date', label: 'Assessment Date', required: true, visible: true },
          { id: 'a2', type: 'Text', label: 'Assessor Name', required: true, visible: true },
          { id: 'a3', type: 'Number', label: 'Receptive Language Score', required: true, visible: true },
          { id: 'a4', type: 'Number', label: 'Vocal Imitation Score', required: true, visible: true },
          { id: 'a5', type: 'TextArea', label: 'Clinical Recommendations', required: false, visible: true },
          { id: 'a6', type: 'Checkbox', label: 'Eligible for Direct Therapy', required: false, visible: true },
        ];
      } else if (name.toLowerCase().includes('social')) {
        defaultFields = [
          { id: 's1', type: 'Text', label: 'Student Name', required: true, visible: true },
          { id: 's2', type: 'Dropdown', label: 'Peer Interaction Level', required: true, visible: true, options: ['High', 'Moderate', 'Emerging', 'Minimal'] },
          { id: 's3', type: 'Dropdown', label: 'Turn-Taking Ability', required: true, visible: true, options: ['Consistently', 'With Prompts', 'Needs Full Support'] },
          { id: 's4', type: 'TextArea', label: 'Social Engagement Notes', required: false, visible: true },
          { id: 's5', type: 'Checkbox', label: 'Participates in Group Activities', required: false, visible: true },
        ];
      } else {
        defaultFields = [
          { id: 'b1', type: 'Dropdown', label: 'Antecedent', required: true, visible: true, options: ['Task Demand', 'Transition', 'Peer Interaction', 'Denied Access'] },
          { id: 'b2', type: 'TextArea', label: 'Observed Behavior', required: true, visible: true },
          { id: 'b3', type: 'Dropdown', label: 'Consequence', required: true, visible: true, options: ['Redirected', 'Break Provided', 'Ignored'] },
          { id: 'b4', type: 'TextArea', label: 'Incident Notes', required: false, visible: true },
        ];
      }

      return {
        fields: defaultFields,
        isDefault: true,
        history: [],
      };
    },
  },
  {
    method: 'POST',
    pattern: '/admin/forms/:formName',
    handler: (ctx) => {
      const name = decodeURIComponent(requiredParam(ctx, 'formName')).trim();
      const value = bodyAs<Record<string, unknown>>(ctx);
      const existing = mockDb.all('adminConfigs').find(
        (c) => c.id === `form:${name}` || c.id.toLowerCase() === `form:${name.toLowerCase()}`
      );
      if (existing) {
        mockDb.updateById('adminConfigs', existing.id, { value });
      } else {
        mockDb.insert('adminConfigs', { id: `form:${name}`, value });
      }
      return value;
    },
  },
  {
    method: 'POST',
    pattern: '/admin/forms/:formName/reset',
    handler: (ctx) => {
      const name = decodeURIComponent(requiredParam(ctx, 'formName')).trim();
      const existing = mockDb.all('adminConfigs').find(
        (c) => c.id === `form:${name}` || c.id.toLowerCase() === `form:${name.toLowerCase()}`
      );
      if (existing) {
        mockDb.removeById('adminConfigs', existing.id);
      }
      return { status: 'ok' as const };
    },
  },
  {
    method: 'GET',
    pattern: '/admin/trial-logging-config',
    handler: () => {
      const saved = mockDb.all('adminConfigs').find((c) => c.id === 'trialLogging');
      if (saved) return saved.value;
      return {
        promptLevels: mockDb.all('promptLevels'),
        trialStreamLayout: 'grid',
        masteryCriteria: { percentage: 80, consecutiveSessions: 3 },
      };
    },
  },
  {
    method: 'POST',
    pattern: '/admin/trial-logging-config',
    handler: (ctx) => {
      const value = bodyAs<Record<string, unknown>>(ctx);
      const saved = mockDb.all('adminConfigs').find((c) => c.id === 'trialLogging');
      if (saved) {
        mockDb.updateById('adminConfigs', 'trialLogging', { value });
      } else {
        mockDb.insert('adminConfigs', { id: 'trialLogging', value });
      }
      return value;
    },
  },
  {
    method: 'GET',
    pattern: '/admin/abc-lists',
    handler: () => {
      const saved = mockDb.all('adminConfigs').find((c) => c.id === 'abcLists');
      if (saved) return saved.value;
      return {
        Behaviors: [
          { id: 'b1', name: 'Unable to remain seated', definition: 'Student leaves designated seat/area without permission.', category: 'Not sitting still/Hyperactivity', active: true },
          { id: 'b2', name: 'Biting others', definition: 'Student makes contact with teeth against another person\u2019s skin.', category: 'Safety concerns', active: true },
          { id: 'b3', name: 'Flopping', definition: 'Student drops to the floor and refuses to stand.', category: 'Safety concerns', active: true },
        ],
        Antecedents: [{ id: 'a1', name: 'Demand placed', active: true }, { id: 'a2', name: 'Transition', active: true }],
        Consequences: [{ id: 'c1', name: 'Redirected', active: true }, { id: 'c2', name: 'Ignored', active: true }],
        Locations: [{ id: 'l1', name: 'Therapy Room', active: true }, { id: 'l2', name: 'Playground', active: true }, { id: 'l3', name: 'Sensory Room', active: true }],
        Frequencies: [{ id: 'f1', name: 'Rarely', active: true }, { id: 'f2', name: 'Occasionally', active: true }, { id: 'f3', name: 'Frequently', active: true }, { id: 'f4', name: 'Constantly', active: true }],
        Intensities: [{ id: 'i1', name: 'Mild', active: true }, { id: 'i2', name: 'Moderate', active: true }, { id: 'i3', name: 'Severe', active: true }],
        Categories: [
          { id: 'cat1', name: 'Attention-seeking', active: true },
          { id: 'cat2', name: 'Safety concerns', active: true },
          { id: 'cat3', name: 'Elopement', active: true },
        ],
      };
    },
  },
  {
    method: 'POST',
    pattern: '/admin/abc-lists/:listType',
    handler: (ctx) => {
      const listType = requiredParam(ctx, 'listType');
      const { items } = bodyAs<{ items: unknown[] }>(ctx);
      const saved = mockDb.all('adminConfigs').find((c) => c.id === 'abcLists');
      const current = (saved?.value ?? {}) as Record<string, unknown>;
      const next = { ...current, [listType]: items };
      if (saved) {
        mockDb.updateById('adminConfigs', 'abcLists', { value: next });
      } else {
        mockDb.insert('adminConfigs', { id: 'abcLists', value: next });
      }
      return next;
    },
  },
  {
    method: 'POST',
    pattern: '/admin/abc-lists/reset',
    handler: () => {
      mockDb.removeById('adminConfigs', 'abcLists');
      return { status: 'ok' as const };
    },
  },
  {
    method: 'GET',
    pattern: '/admin/schedule-capacity-config',
    handler: () => {
      const saved = mockDb.all('adminConfigs').find((c) => c.id === 'scheduleCapacity');
      if (saved) return saved.value;
      return {
        morningStart: '8:07 AM',
        morningEnd: '12:00 PM',
        afternoonStart: '1:10 PM',
        afternoonEnd: '5:00 PM',
        preTherapyDuration: '30',
        capacity: '6',
        draftExpiry: '7',
        blocks: [
          { id: 'blk-1', name: 'Monday AM', startTime: '8:07 AM', endTime: '12:00 PM' },
          { id: 'blk-2', name: 'Monday PM', startTime: '1:10 PM', endTime: '5:00 PM' },
        ],
      };
    },
  },
  {
    method: 'POST',
    pattern: '/admin/schedule-capacity-config',
    handler: (ctx) => {
      const value = bodyAs<Record<string, unknown>>(ctx);
      const existing = mockDb.all('adminConfigs').find((c) => c.id === 'scheduleCapacity');
      if (existing) {
        mockDb.updateById('adminConfigs', 'scheduleCapacity', { value });
      } else {
        mockDb.insert('adminConfigs', { id: 'scheduleCapacity', value });
      }
      return value;
    },
  },
  {
    method: 'GET',
    pattern: '/admin/goal-domains',
    handler: () => mockDb.all('adminConfigs').find((c) => c.id === 'goalDomains')?.value ?? [],
  },
  {
    method: 'POST',
    pattern: '/admin/goal-domains',
    handler: (ctx) => {
      const value = Array.isArray(bodyAs<any>(ctx)) ? bodyAs<any>(ctx) : [];
      const saved = mockDb.all('adminConfigs').find((c) => c.id === 'goalDomains');
      if (saved) {
        mockDb.updateById('adminConfigs', 'goalDomains', { value });
      } else {
        mockDb.insert('adminConfigs', { id: 'goalDomains', value });
      }
      return { saved: true };
    },
  },
  {
    method: 'GET',
    pattern: '/admin/task-analysis-templates',
    handler: () => {
      const saved = mockDb.all('adminConfigs').find((c) => c.id === 'taskTemplates');
      return (saved?.value as unknown as unknown[]) ?? [
        {
          id: 'tat-1',
          name: 'Handwashing Routine',
          description: 'Multi-step handwashing chain for independence.',
          steps: [
            { id: 's1', description: 'Roll up sleeves' },
            { id: 's2', description: 'Turn on water' },
            { id: 's3', description: 'Wet hands' },
            { id: 's4', description: 'Apply soap and scrub' },
            { id: 's5', description: 'Rinse and dry' },
          ],
        },
        {
          id: 'tat-2',
          name: 'Snack Time Routine',
          description: 'Independent snack preparation and cleanup.',
          steps: [
            { id: 's1', description: 'Get placemat' },
            { id: 's2', description: 'Request snack' },
            { id: 's3', description: 'Eat at table' },
            { id: 's4', description: 'Throw away trash' },
          ],
        },
      ];
    },
  },
  {
    method: 'POST',
    pattern: '/admin/task-analysis-templates',
    handler: (ctx) => {
      const template = { id: newId('tat'), ...bodyAs<Record<string, unknown>>(ctx) };
      const saved = mockDb.all('adminConfigs').find((c) => c.id === 'taskTemplates');
      const list = (saved?.value as unknown as unknown[]) ?? [];
      const next = [...list, template] as unknown as Record<string, unknown>;
      if (saved) {
        mockDb.updateById('adminConfigs', 'taskTemplates', { value: next });
      } else {
        mockDb.insert('adminConfigs', { id: 'taskTemplates', value: next });
      }
      return template;
    },
  },
  {
    method: 'PATCH',
    pattern: '/admin/task-analysis-templates/:id',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const patch = bodyAs<Record<string, unknown>>(ctx);
      const saved = mockDb.all('adminConfigs').find((c) => c.id === 'taskTemplates');
      const list = ((saved?.value as unknown as unknown[]) ?? []) as Array<Record<string, unknown>>;
      const next = list.map((t) => (t.id === id ? { ...t, ...patch } : t));
      mockDb.updateById('adminConfigs', 'taskTemplates', { value: next as unknown as Record<string, unknown> });
      return next.find((t) => t.id === id) ?? patch;
    },
  },
  {
    method: 'DELETE',
    pattern: '/admin/task-analysis-templates/:id',
    handler: (ctx) => {
      const id = requiredParam(ctx, 'id');
      const saved = mockDb.all('adminConfigs').find((c) => c.id === 'taskTemplates');
      const list = ((saved?.value as unknown as unknown[]) ?? []) as Array<Record<string, unknown>>;
      mockDb.updateById('adminConfigs', 'taskTemplates', { value: list.filter((t) => t.id !== id) as unknown as Record<string, unknown> });
      return { deleted: true };
    },
  },
  {
    method: 'GET',
    pattern: '/admin/clinic-info',
    handler: () => {
      const saved = mockDb.all('adminConfigs').find((c) => c.id === 'clinicInfo');
      return saved?.value ?? {
        name: 'Melue Foundation',
        address: '123 Therapy Way, Building A',
        city: 'Amman',
        phone: '+962 6 555 0100',
        email: 'info@melue.org',
        director: 'Dr. Elena Martinez',
      };
    },
  },
  {
    method: 'POST',
    pattern: '/admin/clinic-info',
    handler: (ctx) => saveAdminConfig('clinicInfo', ctx),
  },
  {
    method: 'GET',
    pattern: '/admin/working-hours',
    handler: () => {
      const saved = mockDb.all('adminConfigs').find((c) => c.id === 'workingHours');
      return saved?.value ?? { openDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] };
    },
  },
  {
    method: 'POST',
    pattern: '/admin/working-hours',
    handler: (ctx) => saveAdminConfig('workingHours', ctx),
  },
  {
    method: 'GET',
    pattern: '/admin/school-settings',
    handler: () => {
      const saved = mockDb.all('adminConfigs').find((c) => c.id === 'schoolSettings');
      return saved?.value ?? {
        schoolName: 'Melue Learning Center',
        term: 'Fall Term',
        academicYear: '2026 / 2027',
        sessionLengthMinutes: '90',
        defaultStudentsPerSession: '2',
        maxStudentsPerTherapist: '2',
      };
    },
  },
  {
    method: 'POST',
    pattern: '/admin/school-settings',
    handler: (ctx) => saveAdminConfig('schoolSettings', ctx),
  },
  {
    method: 'GET',
    pattern: '/admin/clinical-categories',
    handler: () => {
      const saved = mockDb.all('adminConfigs').find((c) => c.id === 'clinicalCategories');
      return saved?.value ?? {
        programs: [
          { id: 'p1', name: 'ABA', active: true },
          { id: 'p2', name: 'PECS', active: true },
          { id: 'p3', name: 'Regular Program', active: true },
          { id: 'p4', name: 'Pooled-Out', active: true },
        ],
        assessmentTypes: [
          { id: 'at1', name: 'ABLLS-R Skills', active: true },
          { id: 'at2', name: 'MAS/FAST Behavior', active: true },
          { id: 'at3', name: 'Preference Assessment', active: true },
        ],
        therapyTypes: [
          { id: 'tt1', name: 'Basic Therapy (3-12)', active: true },
          { id: 'tt2', name: 'Functional Living Skills (13-19)', active: true },
        ],
      };
    },
  },
  {
    method: 'POST',
    pattern: '/admin/clinical-categories/:category',
    handler: (ctx) => {
      const category = requiredParam(ctx, 'category');
      const item = bodyAs<Record<string, unknown>>(ctx);
      return updateClinicalCategory(category, (list) => [...list, item]);
    },
  },
  {
    method: 'PATCH',
    pattern: '/admin/clinical-categories/:category/:itemId',
    handler: (ctx) => {
      const category = requiredParam(ctx, 'category');
      const itemId = requiredParam(ctx, 'itemId');
      const patch = bodyAs<Record<string, unknown>>(ctx);
      return updateClinicalCategory(category, (list) =>
        list.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
      );
    },
  },
  {
    method: 'DELETE',
    pattern: '/admin/clinical-categories/:category/:itemId',
    handler: (ctx) => {
      const category = requiredParam(ctx, 'category');
      const itemId = requiredParam(ctx, 'itemId');
      updateClinicalCategory(category, (list) => list.filter((item) => item.id !== itemId));
      return { deleted: true };
    },
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
    handler: () => mockDb.all('sessionSummaries').map(summaryDisplayRow),
  },

  // ---- Lightweight option lists (used by dropdowns / filters) ----
  {
    method: 'GET',
    pattern: '/options/students',
    handler: () =>
      mockDb
        .all('students')
        .filter((s) => s.status !== 'paused' && s.phase === 'active')
        .map((s) => ({ id: s.id, name: s.fullName, age: ageOf(s), phase: s.phase })),
  },
  {
    method: 'GET',
    pattern: '/options/staff',
    handler: () =>
      mockDb
        .all('staffMembers')
        .filter((s) => s.status === 'active')
        .map((s) => ({ id: s.id, name: s.name, role: s.role })),
  },
  {
    method: 'GET',
    pattern: '/options/rooms',
    handler: () => [
      { id: 'room-1', name: 'Sunrise Room' },
      { id: 'room-2', name: 'Horizon Room' },
      { id: 'room-3', name: 'Sensory Room' },
    ],
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

/** Appends a staff-side message to a shared conversation so every role
 *  (parent, teacher, coordinator, PD, director) sees the same thread.
 *  Threads are bootstrapped on first message when they do not exist yet,
 *  so demo data can be built entirely through the API. */
function appendTeamMessage(conversationId: string, senderName: string, text: string) {
  if (!text) throw new ApiError('Message text is required', 422);
  let convo = mockDb.findById('conversations', conversationId);
  if (!convo) {
    convo = {
      id: conversationId,
      recipient: 'Parent',
      role: 'Parent/Guardian',
      unread: 0,
      lastMessage: '',
      time: '',
      messages: [],
    };
    mockDb.insert('conversations', convo);
  }
  const message = {
    id: newId('msg'),
    from: 'team' as const,
    senderName,
    text,
    sentAt: new Date().toISOString(),
  };
  mockDb.updateById('conversations', conversationId, {
    messages: [...convo.messages, message],
    lastMessage: text,
    time: 'Just now',
  });
  return message;
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

// ---- Shared display mappers (screen-facing shapes) ----

function studentNameFor(studentId: string | null | undefined): string {
  return (studentId && mockDb.findById('students', studentId)?.fullName) || 'Unknown Student';
}

/** Maps a MockSessionSummary row to the shape the review/report screens render. */
function summaryDisplayRow(s: MockSessionSummary) {
  return {
    id: s.id,
    sessionId: s.sessionId,
    teacherName: s.teacher,
    stationName: s.station,
    roomName: '',
    date: new Date(s.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    bodyPreview: s.notes,
    status: s.status === 'pending_review' ? 'Pending' : s.status === 'approved' ? 'Approved' : 'Revision Required',
    studentNames: s.studentIds.map(studentNameFor),
    independencePercent: s.independencePercent,
    trialsTotal: s.trialsTotal,
    trialsCorrect: s.trialsCorrect,
    incidentCount: s.incidentCount,
  };
}

const NOTIF_TYPE_MAP: Record<string, string> = {
  observation: 'goal',
  progress: 'goal',
  message: 'announcement',
};

/** Maps a raw Notification row to the shape NotificationsList renders. */
function notificationDisplayRow(n: { id: string; type: string; payload: unknown; read: boolean; createdAt: string }) {
  const p = (n.payload ?? {}) as { name?: string };
  const title =
    n.type === 'progress'
      ? `Goal update: ${p.name ?? 'Goal'}`
      : n.type === 'observation'
        ? 'New home observation'
        : 'New message';
  return {
    id: n.id,
    type: NOTIF_TYPE_MAP[n.type] ?? 'alert',
    title,
    body:
      n.type === 'progress'
        ? `${p.name ?? 'A goal'} was updated for one of your students.`
        : n.type === 'observation'
          ? 'A parent submitted a new home observation log.'
          : 'You have a new message in your conversations.',
    date: new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    read: n.read,
  };
}

const ROLE_LABELS: Record<string, string> = {
  teacher: 'Teacher',
  coordinator: 'Coordinator',
  director: 'Director',
  program_director: 'Program Director',
  institutional_admin: 'Institutional Admin',
  system_admin: 'System Admin',
};

function roleKeyFromLabel(label?: string): string {
  if (!label) return 'teacher';
  const key = Object.keys(ROLE_LABELS).find((k) => ROLE_LABELS[k] === label);
  return key ?? 'teacher';
}

/** Upserts a named admin configuration blob and echoes it back. */
function saveAdminConfig(id: string, ctx: MockHandlerContext) {
  const value = bodyAs<Record<string, unknown>>(ctx);
  const existing = mockDb.all('adminConfigs').find((c) => c.id === id);
  if (existing) {
    mockDb.updateById('adminConfigs', id, { value });
  } else {
    mockDb.insert('adminConfigs', { id, value });
  }
  return value;
}

type ClinicalCategoryItem = Record<string, unknown> & { id?: string };

/** Maps audit rows to the AuditLogScreen shape (splits timestamp into date+time). */
function auditDisplayRows() {
  let rows = mockDb.all('auditLogs');
  if (!rows.length) {
    // Seed a few display-safe demo entries on first read.
    const now = Date.now();
    const demo = [
      { action: 'updated' as const, resource: 'staff account Rosa Delgado', user: 'Sysadmin A' },
      { action: 'created' as const, resource: 'role Behavior Technician', user: 'Sysadmin A' },
      { action: 'changed' as const, resource: 'permissions for teacher', user: 'Sysadmin A' },
      { action: 'deleted' as const, resource: 'staff account temp intern', user: 'Sysadmin A' },
    ];
    for (const [i, d] of demo.entries()) {
      mockDb.insert('auditLogs', {
        id: newId('audit'),
        ...d,
        resourceId: '-',
        timestamp: new Date(now - (i + 1) * 3600000).toISOString(),
      });
    }
    rows = mockDb.all('auditLogs');
  }
  return rows.map((r) => {
    const d = new Date(r.timestamp);
    return {
      id: r.id,
      user: r.user,
      action: (['created', 'updated', 'deleted', 'changed'].includes(r.action) ? r.action : 'updated') as
        | 'created'
        | 'updated'
        | 'deleted'
        | 'changed',
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      resource: r.resource,
    };
  });
}

function updateClinicalCategory(category: string, transform: (list: ClinicalCategoryItem[]) => ClinicalCategoryItem[]) {
  const saved = mockDb.all('adminConfigs').find((c) => c.id === 'clinicalCategories');
  const current = (saved?.value ?? {}) as Record<string, ClinicalCategoryItem[]>;
  const next = { ...current, [category]: transform(current[category] ?? []) };
  if (saved) {
    mockDb.updateById('adminConfigs', 'clinicalCategories', { value: next });
  } else {
    mockDb.insert('adminConfigs', { id: 'clinicalCategories', value: next });
  }
  return next;
}

/** Age derived from dateOfBirth when the stored row has no numeric age. */
function ageOf(s: { age?: number; dateOfBirth?: string }): number {
  if (typeof s.age === 'number') return s.age;
  if (!s.dateOfBirth) return 0;
  const dob = new Date(s.dateOfBirth);
  if (Number.isNaN(dob.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)));
}

function staffDisplayRow(s: MockStaffMember) {  return {
    id: s.id,
    name: s.name,
    email: s.email,
    phone: '',
    roles: [ROLE_LABELS[s.role] ?? s.role],
    active: s.status === 'active',
  };
}

/** SCR-TC-002 live session board derived from in-progress sessions + assignments. */
function buildActiveSessions() {
  const sessions = mockDb.all('sessions').filter((s) => s.status === 'in_progress');
  const teacher = mockDb.all('users').find((u) => u.role === 'teacher');
  const rows = sessions.map((s, i) => {
    const students = mockDb.all('students').filter((st) => st.status !== 'paused').slice(i * 2, i * 2 + 2);
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(s.startedAt ?? Date.now()).getTime()) / 1000));
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');
    const trialCount = mockDb.all('trials').length;
    return {
      id: s.id,
      teacherName: teacher?.name ?? 'Teacher A',
      stationName: i % 2 === 0 ? 'Station 1' : 'Station 2',
      roomName: i % 2 === 0 ? 'Room 1' : 'Room 2',
      status: trialCount > 20 ? 'On Track' : trialCount > 5 ? 'Needs Attention' : 'Overdue',
      timer: `${mm}:${ss}`,
      trialCount,
      studentNames: students.map((st) => st.fullName),
      students: students.map((st) => ({
        name: st.fullName,
        trials: Math.max(1, st.goals.length * 4),
        independencePercent: st.goals[0]?.progressPercent ?? 50,
      })),
      incidents: mockDb
        .all('incidents')
        .slice(-2)
        .map((inc) => ({ time: inc.time, type: inc.behavior || 'Behavior', note: inc.notes })),
    };
  });
  // Always show at least one demo row so the board is not empty.
  if (!rows.length) {
    const students = mockDb.all('students').filter((s) => s.status !== 'paused').slice(0, 2);
    return [
      {
        id: 'sess-demo',
        teacherName: teacher?.name ?? 'Teacher A',
        stationName: 'Station 1',
        roomName: 'Room 1',
        status: 'On Track',
        timer: '42:10',
        trialCount: 18,
        studentNames: students.map((s) => s.fullName),
        students: students.map((s) => ({ name: s.fullName, trials: 12, independencePercent: s.goals[0]?.progressPercent ?? 64 })),
        incidents: [],
      },
    ];
  }
  return rows;
}

function buildTeacherMetrics() {
  // Derive the teacher roster from the live schedule store so the Operational
  // Management grid and the reassignment flow share the same therapist ids as
  // the scheduled appointments.
  const week = getWeekData();
  const therapistIds = Array.from(
    new Set(Object.values(week).flat().map((a) => a.therapistId).filter(Boolean))
  );
  if (therapistIds.length === 0) {
    const staffTeachers = mockDb.all('staffMembers').filter((s) => s.role === 'teacher');
    therapistIds.push(...staffTeachers.map((s) => s.id));
  }
  return therapistIds.map((id, i) => ({
    teacherId: id,
    teacherName: resolveTherapistName(id),
    sessions: 6 - (i % 6),
    trials: Math.max(20, 124 - i * 22),
    independencePercent: Math.max(30, 68 - i * 6),
    incidents: i % 2,
  }));
}

function buildWorkload() {
  return buildTeacherMetrics().map((m) => ({
    teacherId: m.teacherId,
    teacherName: m.teacherName,
    students: 2,
    todaySessions: Math.min(3, m.sessions),
    weeklySessions: m.sessions,
    hours: m.sessions * 1.5,
    goals: 4,
    pendingNotes: m.incidents,
    attendanceRate: 92,
  }));
}

function buildWorkloadTrend() {
  return [
    { label: 'Mon', sessions: 18 },
    { label: 'Tue', sessions: 21 },
    { label: 'Wed', sessions: 19 },
    { label: 'Thu', sessions: 24 },
    { label: 'Fri', sessions: 16 },
  ];
}

/** Shared builder for the Coordinator/Director student progress screens. */
function buildStudentProgress(studentId: string, includeFlag: boolean) {
  const student = mockDb.findById('students', studentId);
  if (!student) throw notFound(studentId);
  const assessments = mockDb.all('assessments').filter((a) => a.studentId === studentId);
  const findAssessment = (type: MockAssessment['type']) =>
    assessments.find((a) => a.type === type)?.status === 'in_progress'
      ? 'In Progress'
      : assessments.find((a) => a.type === type)
        ? 'Completed'
        : 'Not Started';
  const incidents = mockDb.all('incidents').filter((i) => i.studentId === studentId);
  const summaries = mockDb.all('sessionSummaries').filter((s) => s.studentIds.includes(studentId));
  const base = {
    id: studentId,
    studentId,
    name: student.fullName,
    age: student.age,
    program: student.programType === 'ABA' ? 'Regular Program' : 'Pooled-Out',
    assessmentSummary: {
      skills: findAssessment('skills'),
      behavior: findAssessment('behavior'),
      preferences: findAssessment('preference'),
    },
    goals: student.goals.map((g, gi) => ({
      id: g.id,
      name: g.name,
      percent: g.progressPercent,
      status: g.status === 'mastered' ? 'Mastered' : g.status === 'in_progress' ? 'In Progress' : 'Active',
      trend: [g.progressPercent - 12, g.progressPercent - 8, g.progressPercent - 4, g.progressPercent].map((v) =>
        Math.max(0, v + ((gi * 3) % 5)),
      ),
    })),
    sessionHistory: (summaries.length
      ? summaries.map((s) => summaryDisplayRow(s))
      : Array.from({ length: 3 }, (_, i) => ({
          id: `sh-${studentId}-${i}`,
          date: new Date(Date.now() - (i + 1) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          teacherName: 'Teacher A',
          stationName: 'Station 1',
          bodyPreview: 'Session completed with steady progress.',
          status: 'Approved',
          studentNames: [student.fullName],
          independencePercent: 60 + i * 5,
        }))
    ).map((row) => ({ ...row, independencePercent: row.independencePercent ?? 65 })),
    incidentSummary: incidents.length
      ? `${incidents.length} incident(s) recorded in the last 30 days.`
      : 'No incidents recorded in the last 30 days.',
    incidents: incidents.slice(0, 5).map((inc) => ({
      date: inc.date,
      type: inc.behavior || 'Behavior',
      detail: `${inc.location} — ${inc.antecedent} → ${inc.consequence}`,
    })),
  };
  return includeFlag ? { ...base, flagged: false } : base;
}

/** SCR-PD-008 chart series derived from per-goal progress history. */
function buildGoalCharts(studentId: string) {
  const student = mockDb.findById('students', studentId);
  const goals = student?.goals ?? [];
  return {
    studentId,
    studentName: student?.fullName ?? '',
    goalCharts: goals.map((g, gi) => ({
      goalId: g.id,
      goalName: g.name,
      series: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'].map((label, w) => ({
        label,
        value: Math.max(0, g.progressPercent - (3 - w) * 8 + ((gi + w) % 4)),
      })),
      summary: `${g.progressPercent}% current independence`,
    })),
  };
}

function iupDisplayRow(i: MockIup) {
  return {
    id: i.id,
    studentId: i.studentId,
    studentName: studentNameFor(i.studentId),
    program: mockDb.findById('students', i.studentId)?.programType ?? 'ABA',
    finalizedDate: new Date(i.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    goalCount: i.goals.length,
    version: '1.0',
    status: i.status === 'active' ? 'Active' : i.status === 'draft' ? 'Draft' : 'Archived',
  };
}

function upsertIup(studentId: string, status: MockIup['status'], ctx: MockHandlerContext) {
  const body = bodyAs<Record<string, unknown>>(ctx);
  const goals = Array.isArray(body.goals) ? (body.goals as string[]) : [];
  const existing = mockDb.all('iups').find((i) => i.studentId === studentId);
  const now = new Date().toISOString();
  if (existing) {
    return mockDb.updateById('iups', existing.id, {
      status,
      goals: goals.length ? goals : existing.goals,
      customFields: (body.customFields as Record<string, unknown>) ?? (existing as any).customFields ?? {},
      updatedAt: now,
    });
  }
  const iup: MockIup = {
    id: newId('iup'),
    studentId,
    status,
    createdAt: now,
    updatedAt: now,
    goals,
    customFields: (body.customFields as Record<string, unknown>) ?? {},
    interventionStrategies: [],
    reinforcementStrategies: [],
    antecedentManipulations: [],
  };
  mockDb.insert('iups', iup as any);
  return iup;
}

/** SCR-PD-003 assessment context panel for IUP generation. */
function buildIupContext(studentId: string) {
  const s = mockDb.findById('students', studentId);
  if (!s) throw notFound(studentId);
  const assessments = mockDb.all('assessments').filter((a) => a.studentId === studentId);
  const skillsDone = assessments.some((a) => a.type === 'skills');
  const behaviorDone = assessments.some((a) => a.type === 'behavior');
  const preferenceData = assessments.find((a) => a.type === 'preference')?.data as { topPreferences?: string[] } | undefined;
  return {
    studentName: s.fullName,
    age: s.age,
    dob: s.dateOfBirth,
    program: s.programType === 'ABA' ? 'Regular Program' : 'Pooled-Out',
    enrollmentDate: 'Aug 1, 2026',
    skillsStrengths: skillsDone
      ? ['Imitation skills emerging', 'Strong visual performance']
      : ['6-week skills assessment pending'],
    behaviorFunctions: behaviorDone
      ? ['Attention-seeking (moderate)', 'Escape from demands (low)']
      : ['Behavior assessment pending'],
    topReinforcers: preferenceData?.topPreferences ?? ['Preferred snacks', 'Token economy', 'Praise', 'Sensory play'],
    sensorySummary: 'Enjoys swing and ball pit; avoids loud auditory stimuli.',
  };
}

/** SCR-PD-002 assessment review list joined with student info. */
function buildAssessmentReviewList() {
  const rows = mockDb.all('assessments');
  const byStudent = new Map<string, typeof rows>();
  for (const a of rows) {
    byStudent.set(a.studentId, [...(byStudent.get(a.studentId) ?? []), a]);
  }
  return Array.from(byStudent.entries()).map(([studentId, list]) => {
    const s = mockDb.findById('students', studentId);
    const allComplete = list.every((a) => a.status !== 'in_progress');
    return {
      studentId,
      studentName: s?.fullName ?? 'Unknown',
      age: s?.age ?? 0,
      program: (s?.programType ?? 'ABA') === 'ABA' ? 'Regular Program' : 'Pooled-Out',
      status: allComplete ? 'Complete' : 'In Progress',
      dateCompleted: new Date(list[0]?.updatedAt ?? new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  });
}

/** SCR-015-style assessment summary report for the review modal. */
function buildAssessmentReport(studentId: string) {
  const s = mockDb.findById('students', studentId);
  const assessments = mockDb.all('assessments').filter((a) => a.studentId === studentId);
  const find = (t: MockAssessment['type']) => assessments.find((a) => a.type === t);
  const prefs = (find('preference')?.data as { rankings?: string[] } | undefined)?.rankings;
  const iup = mockDb.all('iups').find((i) => i.studentId === studentId);
  return {
    studentId,
    studentName: s?.fullName ?? 'Unknown',
    skillsSummary: find('skills')
      ? 'ABLLS-R completed. Priority needs in receptive language and social interaction.'
      : 'Skills assessment not yet completed.',
    behaviorSummary: find('behavior')
      ? 'MAS/FAST complete. Primary function: access to attention.'
      : 'Behavior assessment not yet completed.',
    preferences: prefs ?? ['Preferred snacks', 'Bubble play', 'Music'],
    iupStatus: iup ? (iup.status === 'active' ? 'Active' : 'Draft') : 'Not created',
  };
}

/** MR-40 attendance roster grouped by person type for AttendanceScreen. */
function buildAttendanceRoster() {
  const records = mockDb.all('attendanceRecords');
  const students = mockDb.all('students').filter((s) => s.status !== 'paused');
  const teachers = mockDb.all('users').filter((u) => u.role === 'teacher');
  const statusOf = (personId: string) =>
    records.find((r) => r.personId === personId)?.status === 'absent'
      ? 'Absent'
      : records.find((r) => r.personId === personId)?.status === 'late'
        ? 'Late'
        : records.find((r) => r.personId === personId)
          ? 'Present'
          : null;
  return {
    student: students.map((s) => ({ id: s.id, name: s.fullName, status: statusOf(s.id) })),
    therapist: teachers.map((t) => ({ id: t.id, name: t.name, status: statusOf(t.id) })),
    support_staff: [] as Array<{ id: string; name: string; status: string | null }>,
  };
}

/** MR-35 Daily Notes list + stats in the display shape the screen renders. */
function buildDailyNotes() {
  const notes = mockDb.all('sessionNotes');
  const records = notes.map((n) => {
    const status: 'Approved' | 'Pending' | 'Revision Required' | 'Draft' =
      n.status === 'approved' ? 'Approved'
      : n.status === 'revised' ? 'Revision Required'
      : n.draft ? 'Draft'
      : 'Pending';
    const coordinatorFeedback =
      status === 'Approved'
        ? 'Great documentation. Approved — keep up the consistent trial logging across both stations.'
        : status === 'Revision Required'
        ? 'Please revise the session notes for this block. Missing behavior data — include the antecedent, behavior, and consequence for the observed incident, and correct the trial counts to match the data collection sheet.'
        : '';
    return {
      id: n.id,
      date: n.submittedAt
        ? new Date(n.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      students: [studentNameFor(n.studentId)],
      station: 'Station 1',
      room: 'Sunrise Room',
      status,
      coordinatorFeedback,
    };
  });
  const trials = mockDb.all('trials');
  const sessions = mockDb.all('sessionSummaries');
  const independentCount = trials.filter((t) => t.outcome === 'correct').length;
  const trialsTotal = trials.length;
  const avgIndependence = trialsTotal > 0 ? Math.round((independentCount / trialsTotal) * 100) : 0;
  return {
    records,
    stats: {
      sessionsCompleted: Math.max(notes.length, sessions.length),
      totalTrials: trialsTotal,
      avgIndependence,
      reviewsPending: sessions.filter((s) => s.status === 'pending_review').length,
    },
  };
}

function buildWeeklySummary() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const summaries = mockDb.all('sessionSummaries').filter((s) => s.status !== 'pending_review');
  const trials = mockDb.all('trials');
  const independentCount = trials.filter((t) => t.outcome === 'correct').length;
  const trialsTotal = trials.length;
  return {
    weekRange: `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`,
    sessionsThisWeek: summaries.length,
    totalTrialsThisWeek: trialsTotal,
    avgIndependenceThisWeek: trialsTotal > 0 ? Math.round((independentCount / trialsTotal) * 100) : 0,
  };
}

/** SCR-010: 6-week assessment dashboard built from live mock data so
 *  teacher assessment saves (skills/behavior) reflect back on the board. */
function buildAssessmentDashboard() {
  const students = mockDb.all('students').filter((s) => s.status !== 'paused');
  const rows = mockDb.all('assessments');
  const teacherName = mockDb.all('users').find((u) => u.role === 'teacher')?.name ?? 'Teacher A';

  const rowFor = (studentId: string, type: 'skills' | 'behavior') => {
    const a = rows.find((r) => r.studentId === studentId && r.type === type);
    if (!a) return { status: 'Not Started', progress: 0 };
    if (a.status === 'completed' || a.status === 'submitted') return { status: 'Completed', progress: 100 };
    const saved = Object.keys(a.data ?? {}).length;
    const progress = Math.min(90, saved * 10);
    return { status: progress > 0 ? 'In Progress' : 'Not Started', progress };
  };

  const list = students.map((s, idx) => {
    const ablls = rowFor(s.id, 'skills');
    const behavior = rowFor(s.id, 'behavior');
    const hasAssessment = rows.some((r) => r.studentId === s.id);
    const phase: '6-week' | 'active' = (idx < 3 || hasAssessment || s.status === 'assessment') ? '6-week' : 'active';
    return {
      id: s.id,
      name: s.fullName,
      initial: s.fullName.charAt(0),
      age: s.age,
      program: s.programType === 'ABA' ? 'Regular Program' : 'Pooled-Out',
      therapist: teacherName,
      lastAssessment: '—',
      phase,
      score: Math.round((ablls.progress + behavior.progress) / 2),
      ablls,
      behavior,
    };
  });

  // Only students currently in the 6-week assessment phase are shown.
  const sixWeek = list.filter((x) => x.phase === '6-week');

  const completed = sixWeek.filter((x) => x.ablls.status === 'Completed' && x.behavior.status === 'Completed').length;
  const notStarted = sixWeek.filter((x) => x.ablls.status === 'Not Started' && x.behavior.status === 'Not Started').length;

  const start = new Date();
  start.setDate(start.getDate() - start.getDay() - 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 41);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const periodLabel = `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;

  return {
    periodLabel,
    stats: {
      total: sixWeek.length,
      completed,
      inProgress: sixWeek.length - completed - notStarted,
      notStarted,
    },
    students: sixWeek,
  };
}

/** Extract the current user from the demo auth token. */
function currentUserFromToken() {
  try {
    const token = require('../token').getAccessToken();
    if (!token) return null;
    const userId = token.split('.')[1];
    return mockDb.findById('users', userId) ?? null;
  } catch {
    return null;
  }
}

/** Find the staff record for a given user id or email. */
function staffForUser(userId: string) {
  return mockDb.all('staffMembers').find((s) => s.id === userId || s.email === mockDb.findById('users', userId)?.email) ?? null;
}

/** Find the parent user who has this student in their childIds. */
function parentForStudent(studentId: string) {
  return mockDb.all('users').find((u) => u.role === 'parent' && u.childIds.includes(studentId)) ?? null;
}

/** Find the staff member assigned to a student. */
function teacherForStudent(studentId: string) {
  return mockDb.all('staffMembers').find((s) => s.assignedStudents.includes(studentId) && s.role === 'teacher') ?? null;
}

/** Build or find the conversation for a student between parent and teacher. */
function getOrCreateConvo(studentId: string) {
  const existing = mockDb.all('conversations').find((c: any) => c.studentId === studentId);
  if (existing) return existing;

  const student = mockDb.findById('students', studentId);
  const parent = parentForStudent(studentId);
  const teacher = teacherForStudent(studentId);
  if (!student || !parent || !teacher) return null;

  const convo = {
    id: `convo-${studentId}`,
    studentId,
    studentName: student.fullName,
    parentName: parent.name,
    teacherName: teacher.name,
    recipient: teacher.name,
    role: 'Staff',
    unread: 0,
    lastMessage: '',
    time: '',
    messages: [] as DemoMessage[],
  };
  mockDb.insert('conversations', convo);
  return convo;
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