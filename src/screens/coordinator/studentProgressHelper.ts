// src/screens/coordinator/studentProgressHelper.ts

import type { StudentListItem, ProgressOverview } from './studentProgressTypes';

export function filterStudentsBySearch(
  students: StudentListItem[],
  query: string,
): StudentListItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return students;
  return students.filter((s) => (s.fullName ?? '').toLowerCase().includes(q));
}

export function buildStudentProgressExportReport(
  overview: ProgressOverview | null,
  selectedStudent: StudentListItem | null,
): string {
  const studentName = overview?.name || selectedStudent?.fullName || 'Student';
  const age = overview?.age || selectedStudent?.age || 'N/A';
  const program = overview?.program || selectedStudent?.programType || 'Special Education';

  return [
    "MELU'E FOUNDATION FOR AUTISM & SPECIAL NEEDS",
    'STUDENT PROGRESS & CLINICAL MONITORING REPORT',
    '================================================================',
    `STUDENT: ${studentName} (Age: ${age})`,
    `PROGRAM: ${program}`,
    `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    '----------------------------------------------------------------',
    '',
    'ASSESSMENT STATUS:',
    `• Skills Assessment: ${overview?.assessmentSummary?.skills || 'In Progress'}`,
    `• Behavior Assessment: ${overview?.assessmentSummary?.behavior || 'In Progress'}`,
    `• Preferences Assessment: ${overview?.assessmentSummary?.preferences || 'Completed'}`,
    '',
    'GOALS SUMMARY:',
    ...(overview?.goals && overview.goals.length > 0
      ? overview.goals.map(
          (g, i) => `  ${i + 1}. ${g.name}: ${g.percent || 0}% (${g.status || 'In Progress'})`,
        )
      : ['  • No active goals logged.']),
    '',
    '----------------------------------------------------------------',
    'CONFIDENTIAL CLINICAL DOCUMENTATION',
    '================================================================',
  ].join('\n');
}
