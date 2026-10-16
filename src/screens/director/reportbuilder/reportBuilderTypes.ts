// src/screens/director/reportbuilder/reportBuilderTypes.ts

export const PROGRAMS = ['All Programs', 'ABA', 'Speech Therapy', 'Occupational Therapy'];
export const PERIODS = ['All Periods', 'Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec'];
export const SCORE_FILTERS = ['All Scores', '>50%', '>70%', '>90%'];
export const GOAL_STATUSES = ['All Statuses', 'On Track', 'Needs Support', 'Mastered'];
export const BEHAVIOR_TYPES = [
  'All Types',
  'Tantrums',
  'Aggression',
  'Self-Injury',
  'Elopement',
  'Non-Compliance',
];
export const DIAGNOSES = [
  'All Diagnoses',
  'Autism Spectrum',
  'Speech Delay',
  'Motor Delay',
  'Global Delay',
];
export const ATTENDANCE_OPTIONS = ['All', '<70%', '<75%', '<80%', '<85%', '<90%'];
export const AGE_OPTIONS = ['All', '3–5 yrs', '6–8 yrs', '9–12 yrs', '13+ yrs'];

export interface ReportRow {
  id: string;
  name: string;
  age: number;
  program: string;
  therapist: string;
  attendance: number;
  assessmentScore: number;
  goalStatus: 'On Track' | 'Needs Support';
  behaviorType: string;
  diagnosis: string;
}

export interface ReportFilterState {
  program: string;
  therapist: string;
  ageRange: string;
  attendanceFilter: string;
  period: string;
  studentSearch: string;
  scoreFilter: string;
  goalStatus: string;
  behaviorType: string;
  diagnosis: string;
}

export function buildCsv(results: ReportRow[] | null): string {
  if (!results) return '';
  const header = [
    'Name',
    'Age',
    'Program',
    'Therapist',
    'Attendance %',
    'Assessment %',
    'Goal Status',
    'Behavior Type',
    'Diagnosis',
  ];
  const rows = results.map((r) => [
    r.name,
    r.age,
    r.program,
    r.therapist,
    r.attendance,
    r.assessmentScore,
    r.goalStatus,
    r.behaviorType,
    r.diagnosis,
  ]);
  return [header, ...rows].map((row) => row.join(',')).join('\n');
}

export function buildReportText(
  results: ReportRow[] | null,
  filters: ReportFilterState,
  timestamp = new Date(),
): string {
  if (!results) return '';
  const lines = [
    '================================================================',
    "         MELU'E FOUNDATION — CUSTOM REPORT BUILDER              ",
    '================================================================',
    `GENERATED: ${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`,
    `FILTERS: Program: ${filters.program} | Therapist: ${filters.therapist} | Period: ${filters.period}`,
    `CRITERIA: Diagnosis: ${filters.diagnosis} | Score: ${filters.scoreFilter} | Goal: ${filters.goalStatus}`,
    '----------------------------------------------------------------',
    '',
    'MATCHED STUDENT RECORDS:',
    ...results.map(
      (r, i) =>
        `  ${i + 1}. ${r.name} (Age ${r.age}) | Program: ${r.program} | Therapist: ${r.therapist}\n     Attendance: ${r.attendance}% | Assessment: ${r.assessmentScore}% | Goal Status: ${r.goalStatus}\n     Diagnosis: ${r.diagnosis} | Primary Behavior: ${r.behaviorType}`,
    ),
    '',
    '----------------------------------------------------------------',
    `TOTAL MATCHED STUDENTS: ${results.length}`,
    '================================================================',
  ];
  return lines.join('\n');
}
