export const REPORT_TABS: string[] = [
  'Session Reports',
  'Student Progress',
  'Bi-Annual Reports',
  'Foundation Overview',
];

export const STATIONS = [
  'All Stations',
  'Station 1 (Basic Skills)',
  'Station 2 (Advanced Skills)',
  'Sensory Station',
];

export interface Option {
  id: string;
  name: string;
}

export interface SessionReport {
  id: string;
  date: string;
  teacherName: string;
  stationName?: string;
  studentNames: string[];
}

export interface FoundationOverview {
  totalStudents: number;
  totalTeachers: number;
  sessionsThisMonth: number;
  avgGoalProgress: number;
}
