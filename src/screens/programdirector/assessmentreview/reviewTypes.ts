// src/screens/programdirector/assessmentreview/reviewTypes.ts

import type { StatusType } from '../../../components/StatusPill';

export const STATUS_KEY: Record<string, StatusType> = {
  'Not Started': 'notStarted',
  'In Progress': 'inProgress',
  Complete: 'completed',
  Reviewed: 'approved',
};

export const STATUS_OPTIONS = [
  'All',
  'Not Started',
  'In Progress',
  'Complete',
  'Reviewed',
] as const;

export type StatusOption = (typeof STATUS_OPTIONS)[number];

export interface AssessmentListItem {
  studentId: string;
  studentName: string;
  age: number;
  program: string;
  therapyGroup: string;
  therapist: string;
  status: string;
  abllsPct: number;
  behaviorStatus: string;
  sessionStatus: string;
  dateCompleted: string | null;
}

export interface DomainScore {
  code: string;
  name: string;
  items: Array<{ id: string; description: string; score: unknown }>;
  scoredCount: number;
  total: number;
}

export interface AssessmentReport {
  studentId: string;
  studentName: string;
  age: number;
  program: string;
  therapyGroup: string;
  therapist: string;
  status: string;
  skillsSummary: string;
  skillsStatus: string;
  domainScores: DomainScore[];
  behaviorSummary: string;
  behaviorStatus: string;
  preferences: string[];
  notes: string;
  dateCompleted: string | null;
  iupStatus: string;
  reviewNotes: string;
  assignedGoals?: { id: string; name: string; status: string }[];
}

export function scoreColor(score: unknown): string {
  const n =
    typeof score === 'number' ? score : typeof score === 'string' ? parseInt(score, 10) : NaN;
  if (isNaN(n)) return '#94A3B8';
  if (n === 0) return '#EF4444';
  if (n <= 1) return '#EAB308';
  return '#16A34A';
}

export function normalizeStatus(rawStatus?: string): string {
  if (!rawStatus) return 'Not Started';
  const s = rawStatus
    .toLowerCase()
    .replace(/[_\s-]+/g, ' ')
    .trim();
  if (s === 'not started' || s === 'notstarted') return 'Not Started';
  if (s === 'in progress' || s === 'inprogress') return 'In Progress';
  if (s === 'complete' || s === 'completed') return 'Complete';
  if (s === 'reviewed' || s === 'approved') return 'Reviewed';
  return rawStatus;
}

export function normalizeAssessmentItem(item: any): AssessmentListItem {
  return {
    studentId: String(item.studentId ?? item.student_id ?? item.id ?? ''),
    studentName: String(item.studentName ?? item.student_name ?? item.name ?? 'Unknown Student'),
    age: Number(item.age ?? 0),
    program: String(item.program ?? item.program_type ?? 'Regular'),
    therapyGroup: String(item.therapyGroup ?? item.therapy_group ?? ''),
    therapist: String(item.therapist ?? item.therapist_name ?? 'Unassigned'),
    status: normalizeStatus(item.status),
    abllsPct: Number(item.abllsPct ?? item.assessment_progress ?? item.completion_percentage ?? 0),
    behaviorStatus: String(item.behaviorStatus ?? item.behavior_assessment ?? 'notStarted'),
    sessionStatus: String(item.sessionStatus ?? ''),
    dateCompleted: item.dateCompleted ?? item.completed_at ?? item.completed_on ?? null,
  };
}

export function normalizeAssessmentReport(res: any): AssessmentReport {
  const student = res?.student || {};
  const assessment = res?.assessment || {};
  const skills = res?.skills || {};
  const behavior = res?.behavior || {};
  const preferences = res?.preferences || {};

  const domainScores: DomainScore[] = Array.isArray(res?.domainScores)
    ? res.domainScores
    : Array.isArray(skills?.domains)
      ? skills.domains.map((d: any) => ({
          code: String(d.code || d.domain_code || ''),
          name: String(d.name || d.domain_name || ''),
          items: Array.isArray(d.items) ? d.items : [],
          scoredCount: Number(d.scoredCount ?? d.completed_items ?? d.scored_count ?? 0),
          total: Number(d.total ?? d.total_items ?? 0),
        }))
      : [];

  const prefList: string[] = Array.isArray(res?.preferences)
    ? res.preferences
    : Array.isArray(preferences?.top_items)
      ? preferences.top_items.map((p: any) =>
          typeof p === 'string' ? p : p.name || p.item_name || '',
        )
      : Array.isArray(res?.top_preferences)
        ? res.top_preferences.map((p: any) => (typeof p === 'string' ? p : p.name || ''))
        : [];

  return {
    studentId: String(student.id ?? res?.studentId ?? ''),
    studentName: String(student.name ?? student.full_name ?? res?.studentName ?? 'Unknown Student'),
    age: Number(student.age ?? res?.age ?? 0),
    program: String(student.program_type ?? student.program ?? res?.program ?? 'Regular'),
    therapyGroup: String(student.therapy_group ?? res?.therapyGroup ?? ''),
    therapist: String(res?.therapist ?? student.therapist ?? 'Unassigned'),
    status: normalizeStatus(assessment.status ?? res?.status),
    skillsSummary: String(skills.summary ?? res?.skillsSummary ?? 'No skills summary available.'),
    skillsStatus: String(skills.status ?? res?.skillsStatus ?? 'not_started'),
    domainScores,
    behaviorSummary: String(
      behavior.summary ?? res?.behaviorSummary ?? 'No behavior summary available.',
    ),
    behaviorStatus: String(behavior.status ?? res?.behaviorStatus ?? 'not_started'),
    preferences: prefList,
    notes: String(res?.notes ?? res?.teacher_notes ?? 'No notes recorded.'),
    dateCompleted: assessment.completed_on ?? res?.dateCompleted ?? null,
    iupStatus: String(res?.iupStatus ?? 'Draft'),
    reviewNotes: String(res?.reviewNotes ?? res?.review_notes ?? ''),
    assignedGoals: res?.assignedGoals ?? [],
  };
}

export function generateAssessmentReportText(
  report: AssessmentReport,
  timestamp = new Date(),
): string {
  const lines = [
    `Melu'e Foundation — Assessment Summary Report`,
    `Student: ${report.studentName}`,
    report.age ? `Age: ${report.age}` : '',
    `Program: ${report.program}`,
    report.therapist !== 'Unassigned' ? `Therapist: ${report.therapist}` : '',
    '',
    'SKILLS ASSESSMENT (ABLLS)',
    report.skillsSummary,
  ];

  if ((report.domainScores || []).filter((d) => d.scoredCount > 0).length > 0) {
    lines.push('');
    lines.push('DOMAIN BREAKDOWN');
    for (const d of (report.domainScores || []).filter((d) => d.scoredCount > 0)) {
      lines.push(`  ${d.code} ${d.name}: ${d.scoredCount}/${d.total} items scored`);
      for (const i of (d.items || []).filter((i) => i.score !== null && i.score !== undefined)) {
        lines.push(`    ${i.id} ${i.description}: ${i.score}`);
      }
    }
  }

  lines.push('', 'BEHAVIOR ASSESSMENT (MASS/FAST)', report.behaviorSummary || '');
  lines.push('', 'TOP PREFERENCES', (report.preferences || []).join(', '));

  if (report.notes && report.notes !== 'No notes recorded.') {
    lines.push('', 'TEACHER NOTES', report.notes);
  }

  lines.push('', 'IUP STATUS', report.iupStatus);

  if (report.dateCompleted) {
    lines.push('', `DATE COMPLETED: ${report.dateCompleted}`);
  }

  lines.push('', `Generated ${timestamp.toLocaleDateString()}`);

  return lines.filter(Boolean).join('\n');
}
