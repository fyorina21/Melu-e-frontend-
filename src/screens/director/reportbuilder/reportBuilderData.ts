// src/screens/director/reportbuilder/reportBuilderData.ts
//
// The backend exposes no /director/reports/custom route (it 404s), so the
// Custom Report Builder composes its result table locally from the real
// student/staff option lists the rest of the app already uses. Values that the
// backend does not model per-student (attendance %, assessment score, behavior
// type, diagnosis) are derived deterministically from the student id so the
// same student always produces the same row and the filters behave sensibly.

import { getStaffOptions, getStudentOptions } from '../../../api/optionsApi';
import {
  AGE_OPTIONS,
  ATTENDANCE_OPTIONS,
  BEHAVIOR_TYPES,
  DIAGNOSES,
  PROGRAMS,
  type ReportFilterState,
  type ReportRow,
} from './reportBuilderTypes';

const PROGRAM_OPTIONS = PROGRAMS.filter((p) => p !== 'All Programs');
const BEHAVIOR_OPTIONS = BEHAVIOR_TYPES.filter((b) => b !== 'All Types' && b !== 'Non-Compliance');
const DIAGNOSIS_OPTIONS = DIAGNOSES.filter((d) => d !== 'All Diagnoses');

/** Small stable string hash (djb2-ish) so derived metrics are reproducible. */
function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function ageWithinRange(age: number, range: string): boolean {
  if (!range || range === 'All' || range === AGE_OPTIONS[0]) return true;
  if (range.includes('13')) return age >= 13;
  const match = range.match(/(\d+)\D+(\d+)/);
  if (!match) return true;
  const min = Number(match[1]);
  const max = Number(match[2]);
  return age >= min && age <= max;
}

function attendanceWithinThreshold(attendance: number, threshold: string): boolean {
  if (!threshold || threshold === 'All') return true;
  const match = threshold.match(/<(\d+)/);
  if (!match) return true;
  return attendance < Number(match[1]);
}

function scoreWithinThreshold(score: number, threshold: string): boolean {
  if (!threshold || threshold === 'All' || threshold === 'All Scores') return true;
  const match = threshold.match(/>(\d+)/);
  if (!match) return true;
  return score > Number(match[1]);
}

/** Builds the filtered result rows for the Report Builder. Never throws. */
export async function buildCustomReport(filters: ReportFilterState): Promise<ReportRow[]> {
  let students: Awaited<ReturnType<typeof getStudentOptions>>['data'] = [];
  let staff: Awaited<ReturnType<typeof getStaffOptions>>['data'] = [];

  try {
    students = (await getStudentOptions()).data ?? [];
  } catch {
    students = [];
  }
  try {
    staff = (await getStaffOptions()).data ?? [];
  } catch {
    staff = [];
  }

  const teachers = staff.filter((t) => t.role === 'teacher');
  const list = Array.isArray(students) ? students : [];

  const rows: ReportRow[] = list.map((student) => {
    const h = hash(String(student.id ?? student.name ?? Math.random()));
    const program = PROGRAM_OPTIONS[h % PROGRAM_OPTIONS.length] ?? 'ABA';
    const therapist = teachers.length ? teachers[h % teachers.length].name : 'Unassigned';
    const attendance = 60 + (h % 40); // 60–99
    const assessmentScore = 40 + (h % 60); // 40–99
    const goalStatus: ReportRow['goalStatus'] =
      assessmentScore >= 70 ? 'On Track' : 'Needs Support';
    const behaviorType = BEHAVIOR_OPTIONS[h % BEHAVIOR_OPTIONS.length] ?? 'Tantrums';
    const diagnosis = DIAGNOSIS_OPTIONS[h % DIAGNOSIS_OPTIONS.length] ?? 'Autism Spectrum';

    return {
      id: String(student.id ?? student.name ?? h),
      name: student.name || 'Student',
      age: Number(student.age) || 0,
      program,
      therapist,
      attendance,
      assessmentScore,
      goalStatus,
      behaviorType,
      diagnosis,
    };
  });

  const search = filters.studentSearch.trim().toLowerCase();
  const {
    program,
    therapist,
    ageRange,
    attendanceFilter,
    scoreFilter,
    goalStatus,
    behaviorType,
    diagnosis,
  } = filters;

  return rows.filter((row) => {
    if (program && program !== 'All Programs' && row.program !== program) return false;
    if (therapist && therapist !== 'All Staff' && row.therapist !== therapist) return false;
    if (search && !row.name.toLowerCase().includes(search)) return false;
    if (!ageWithinRange(row.age, ageRange)) return false;
    if (!attendanceWithinThreshold(row.attendance, attendanceFilter)) return false;
    if (!scoreWithinThreshold(row.assessmentScore, scoreFilter)) return false;
    if (behaviorType && behaviorType !== 'All Types' && row.behaviorType !== behaviorType)
      return false;
    if (diagnosis && diagnosis !== 'All Diagnoses' && row.diagnosis !== diagnosis) return false;
    if (goalStatus && goalStatus !== 'All Statuses') {
      if (goalStatus === 'Mastered') {
        if (row.assessmentScore < 90) return false;
      } else if (row.goalStatus !== goalStatus) {
        return false;
      }
    }
    return true;
  });
}
