export interface Teacher {
  id: string;
  name: string;
  station: string;
  room: string;
  students: string[];
  studentIds: string[];
  sessions: number;
  trials: number;
  independence: number;
  incidents: number;
  available: boolean;
}

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
export type DayOfWeek = (typeof DAYS)[number];

export type Cell = { station: string; room: string } | null;

export interface MetricsRow {
  teacherId: string;
  teacherName: string;
  sessions: number;
  trials: number;
  independencePercent: number;
  incidents: number;
}

export interface WeekAppointment {
  therapistId: string;
  therapistName: string;
  roomName: string;
  studentIds?: string[];
  studentNames: string[];
  status?: string;
}
