// src/screens/director/progress/directorProgressTypes.ts

import type { StatusType } from '../../../components/StatusPill';

export interface DirectorGoal {
  id: string;
  name: string;
  percent: number;
  trend: number[];
}

export interface SessionHistoryEntry {
  id: string;
  date: string;
  teacherName: string;
  status?: string;
}

export interface DirectorStudentData {
  id?: string;
  studentId?: string;
  photoUrl?: string;
  headshotUrl?: string;
  photo?: string;
  name: string;
  age: number;
  program: string;
  assessmentSummary: { skills: string; behavior: string; preferences: string };
  goals: DirectorGoal[];
  sessionHistory: SessionHistoryEntry[];
  incidentSummary: string;
}

export const ASSESSMENT_STATUS_KEY: Record<string, StatusType> = {
  Completed: 'completed',
  'In Progress': 'inProgress',
  'Not Started': 'notStarted',
};

export const SESSION_STATUS_KEY: Record<string, StatusType> = {
  Approved: 'approved',
  Pending: 'pending',
  'Revision Required': 'revision',
};

export function assessmentStatusType(status: string): StatusType {
  return ASSESSMENT_STATUS_KEY[status] ?? 'notStarted';
}

export function sessionStatusType(status?: string): StatusType {
  return (status && SESSION_STATUS_KEY[status]) || 'pending';
}

export function generateReportText(data: DirectorStudentData, notes: string = ''): string {
  const uniqueGoals = data.goals.filter(
    (g, index, self) => index === self.findIndex((t) => t.name === g.name),
  );

  return [
    '================================================================',
    "MELU'E FOUNDATION — STUDENT PROGRESS REPORT (DIRECTOR OVERSIGHT)",
    '================================================================',
    `STUDENT: ${data.name}`,
    `AGE: ${data.age}  |  PROGRAM: ${data.program}`,
    `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    '----------------------------------------------------------------',
    '',
    'CLINICAL ASSESSMENT SUMMARY:',
    `• Skills Assessment: ${data.assessmentSummary.skills}`,
    `• Behavior Assessment: ${data.assessmentSummary.behavior}`,
    `• Preferences & Reinforcers: ${data.assessmentSummary.preferences}`,
    '',
    '----------------------------------------------------------------',
    'CURRENT GOALS & MASTERY:',
    ...uniqueGoals.map((g, i) => `  ${i + 1}. ${g.name} — ${g.percent}% Independent`),
    '',
    '----------------------------------------------------------------',
    'SESSION HISTORY LOG:',
    ...data.sessionHistory.map(
      (s) => `  • ${s.date} — Therapist: ${s.teacherName}${s.status ? ` (${s.status})` : ''}`,
    ),
    '',
    '----------------------------------------------------------------',
    'BEHAVIOR INCIDENT TRENDS:',
    `  ${data.incidentSummary}`,
    '',
    '----------------------------------------------------------------',
    'DIRECTOR INTERNAL NOTES:',
    notes ? `  ${notes}` : '  (None entered)',
    '================================================================',
  ].join('\n');
}
