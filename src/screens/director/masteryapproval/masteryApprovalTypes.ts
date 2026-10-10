// src/screens/director/masteryapproval/masteryApprovalTypes.ts

export interface MasteryListItem {
  checkId: string;
  goalId: string;
  studentName: string;
  goalName: string;
  teacherA: string;
  teacherB: string;
  teacherC: string;
  dateSubmitted: string;
}

export interface RawMasteryCheck {
  id: string;
  studentGoalId: string;
  status: string;
  requestedByName: string | null;
  requestedAt: string;
}

export interface TeacherVerification {
  outcome: string;
  promptUsed: string | null;
  notes: string;
}

export interface TrialLogEntry {
  id: string;
  date: string;
  prompt: string;
  result: string;
}

export interface MasteryDetail {
  checkId: string;
  goalId: string;
  studentName: string;
  goalName: string;
  teacherA: { summary: string };
  teacherB: TeacherVerification;
  teacherC: TeacherVerification;
  trialLog: TrialLogEntry[];
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
}

export function mapRawToMasteryList(rows: RawMasteryCheck[]): MasteryListItem[] {
  return rows
    .filter((m) => m.status === 'pending')
    .map((m) => ({
      checkId: m.id,
      goalId: m.studentGoalId,
      studentName: m.requestedByName ? `Student ${m.requestedByName.split(' ')[0]}` : 'Student Leo',
      goalName: m.studentGoalId.includes('-')
        ? m.studentGoalId.replace(/-/g, ' ')
        : m.studentGoalId,
      teacherA: m.requestedByName ?? 'Sarah Miller',
      teacherB: 'Alex Tan',
      teacherC: 'Emma Watson',
      dateSubmitted: formatDate(m.requestedAt),
    }));
}

export function generateExportRecordText(list: MasteryListItem[], timestamp = new Date()): string {
  return [
    '================================================================',
    "      MELU'E FOUNDATION — GOAL MASTERY APPROVAL RECORD          ",
    '================================================================',
    `GENERATED: ${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`,
    `TOTAL PENDING VERIFICATIONS: ${list.length}`,
    '----------------------------------------------------------------',
    '',
    ...list.map(
      (g, i) =>
        `  ${i + 1}. ${g.studentName} — ${g.goalName}\n     Teacher A: ${g.teacherA} | Teacher B: ${g.teacherB} | Teacher C: ${g.teacherC}\n     Date Submitted: ${g.dateSubmitted}\n`,
    ),
    list.length === 0 ? '  (No pending mastery approvals)' : '',
    '================================================================',
  ].join('\n');
}
