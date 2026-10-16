// src/screens/parent/childprogress/childProgressTypes.ts

export type GoalStatus = 'Active' | 'Mastered' | 'In Progress';

export interface Goal {
  id: string;
  name: string;
  pct: number;
  status: GoalStatus;
  updated: string;
}

export interface Session {
  id: string;
  date: string;
  teacher: string;
  duration: string;
  trials: number;
  independence: number;
  time: string;
  goals: string[];
  behavior: string;
  notes: string;
}

export interface SessionSummary {
  id: string;
  date: string;
  teacher: string;
  duration: string;
  trials?: number;
  independence: number;
  time: string;
  goals: string[];
  behavior: string;
  notes: string;
}

export interface BehaviorTrend {
  month: string;
  incidents: number;
}

export interface ChildProgressData {
  childName: string;
  photoUrl?: string;
  headshotUrl?: string;
  photo?: string;
  age: number;
  program: string;
  group: string;
  goals: Goal[];
  sessions: Session[];
  sessionsThisMonth: number;
  goalsMastered: number;
  totalTrials: number;
  averageIndependence: number;
  behaviorTrends: BehaviorTrend[];
  behaviorSummary: string;
  iupStation1: string[];
  iupStation2: string[];
}

export function goalStatus(pct: number, raw?: string): GoalStatus {
  if (raw === 'Mastered' || pct >= 80) return 'Mastered';
  if (raw === 'In Progress' || pct >= 60) return 'In Progress';
  return 'Active';
}

export function goalBarColor(pct: number): string {
  if (pct >= 80) return '#4ADE80';
  if (pct >= 50) return '#FACC15';
  return '#F87171';
}

export function statusBadge(status: GoalStatus): { bg: string; text: string } {
  if (status === 'Mastered') return { bg: '#DCFCE7', text: '#15803D' };
  if (status === 'Active') return { bg: '#E0F2FE', text: '#0369A1' };
  return { bg: '#FEF9C3', text: '#A16207' };
}

export function independenceColor(pct: number): string {
  if (pct >= 80) return '#16A34A';
  if (pct >= 60) return '#CA8A04';
  return '#EF4444';
}

export function behaviorBox(behavior: string): {
  isClean: boolean;
  bg: string;
  text: string;
} {
  const clean = behavior === 'None' || behavior === 'No incidents' || !behavior;
  return {
    isClean: clean,
    bg: clean ? '#F0FDF4' : '#FEFCE8',
    text: clean ? '#15803D' : '#A16207',
  };
}
