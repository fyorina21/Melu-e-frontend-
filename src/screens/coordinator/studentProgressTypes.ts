export interface StudentListItem {
  id: string;
  fullName: string;
  age: number;
  programType: string;
  therapyGroup: string;
  status?: string;
}

export interface GoalRow {
  id: string;
  name: string;
  percent: number;
  status: string;
  domain?: string;
  trend: number[];
}

export interface SessionHistoryRow {
  id: string;
  date: string;
  stationName?: string;
  bodyPreview: string;
  status?: string;
  independencePercent: number;
}

export interface ProgressOverview {
  name: string;
  age: number;
  program: string;
  assessmentSummary: { skills: string; behavior: string; preferences: string };
  goals: GoalRow[];
  sessionHistory: SessionHistoryRow[];
  incidentSummary: string;
  incidents: { date: string; type: string; detail: string }[];
}

export const STATUS_PERCENT: Record<string, number> = {
  Completed: 100,
  'In Progress': 50,
  'Not Started': 0,
};
