// src/screens/director/reportsOversightHelper.ts

import type { SessionReport, FoundationOverview, Option } from './reportsTypes';

export function filterSessionReports(
  sessionReports: SessionReport[],
  options: {
    selectedStudentId?: string;
    selectedTeacherId?: string;
    selectedStation?: string;
    filterDate?: string;
    students: Option[];
    teachers: Option[];
  },
): SessionReport[] {
  const { selectedStudentId, selectedTeacherId, selectedStation, filterDate, students, teachers } =
    options;

  return sessionReports.filter((r) => {
    if (selectedStudentId) {
      const student = students.find((s) => s.id === selectedStudentId);
      const name = student?.name || selectedStudentId;
      if (!r.studentNames.some((sn) => sn.toLowerCase().includes(name.toLowerCase()))) {
        return false;
      }
    }
    if (selectedTeacherId) {
      const teacher = teachers.find((t) => t.id === selectedTeacherId);
      const name = teacher?.name || selectedTeacherId;
      if (!r.teacherName.toLowerCase().includes(name.toLowerCase())) {
        return false;
      }
    }
    if (selectedStation && selectedStation !== 'All Stations') {
      const st = (r as any).stationName || '';
      if (st && !st.toLowerCase().includes(selectedStation.toLowerCase())) {
        return false;
      }
    }
    if (filterDate && filterDate.trim()) {
      if (!r.date.includes(filterDate.trim())) {
        return false;
      }
    }
    return true;
  });
}

export function buildStudentProgressReportText(studentProgressData: any): string {
  if (!studentProgressData) return '';
  const goals = studentProgressData.goals || [];
  return [
    '================================================================',
    "      MELU'E FOUNDATION — STUDENT PROGRESS MONITORING           ",
    '================================================================',
    `STUDENT: ${studentProgressData.name || 'Student'}`,
    `AGE: ${studentProgressData.age || 'N/A'}  |  PROGRAM: ${studentProgressData.program || 'N/A'}`,
    `DIAGNOSIS: ${studentProgressData.diagnosis || 'Autism Spectrum Disorder'}`,
    `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    '----------------------------------------------------------------',
    '',
    'IEP / IUP GOALS MASTERY PROGRESSION:',
    ...goals.map(
      (g: any, i: number) =>
        `  ${i + 1}. ${g.name}: ${g.percent || 0}% Mastery (${g.status || 'In Progress'})`,
    ),
    '',
    'CLINICAL SESSIONS & ATTENDANCE:',
    `  • Total Sessions Attended: ${
      studentProgressData.sessionsAttended || studentProgressData.sessionHistory?.length || 0
    }`,
    `  • Clinical Assessment Status: ${studentProgressData.assessmentSummary?.skills || 'Completed'}`,
    '----------------------------------------------------------------',
    'SYSTEM STATUS: Official Clinical Oversight Record',
    '================================================================',
  ].join('\n');
}

export function buildBiAnnualReportText(sessionReports: SessionReport[]): string {
  return [
    '================================================================',
    "      MELU'E FOUNDATION — BI-ANNUAL PROGRESS OVERSIGHT          ",
    '================================================================',
    `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    'PERIOD: 6-Month Comprehensive Clinical Summary',
    '----------------------------------------------------------------',
    '',
    'SUMMARY OF CLINICAL SESSIONS & THERAPY:',
    ...sessionReports.map(
      (r, i) =>
        `  ${i + 1}. Session Date: ${r.date} | Lead Therapist: ${r.teacherName}\n     Students: ${r.studentNames.join(', ')}`,
    ),
    '',
    '----------------------------------------------------------------',
    'SYSTEM STATUS: Certified by Foundation Director',
    '================================================================',
  ].join('\n');
}

export function buildFoundationOverviewText(overview: FoundationOverview | null): string {
  if (!overview) return '';
  return [
    '================================================================',
    "      MELU'E FOUNDATION — EXECUTIVE ANALYTICS OVERVIEW          ",
    '================================================================',
    `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    '----------------------------------------------------------------',
    '',
    `• Total Enrolled Students: ${overview.totalStudents}`,
    `• Total Active Therapists: ${overview.totalTeachers}`,
    `• Sessions Conducted This Month: ${overview.sessionsThisMonth}`,
    `• Average Goal Progress (Foundation-Wide): ${overview.avgGoalProgress}%`,
    '',
    '================================================================',
  ].join('\n');
}
