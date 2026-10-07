export interface Goal {
  id: string;
  name: string;
  domain: string;
  description: string;
}

export type GoalStatus = 'Active' | 'In Progress' | 'Mastered';

export type GoalWithStatus = Goal & {
  status: GoalStatus;
  progress: number;
};

export type SlotKey = 'station1-0' | 'station1-1' | 'station2-0' | 'station2-1';

export type StudentGoals = Record<SlotKey, GoalWithStatus | null>;

export const domainFilterMap: Record<string, string[]> = {
  Communication: ['Receptive Language', 'Expressive Language'],
  Motor: ['Motor Skills'],
  Social: ['Social Skills'],
  'Self-Help': ['Adaptive'],
  Cognition: ['Cognitive'],
  Play: ['Play Skills'],
  Academic: ['Academic'],
};

export const allDomains = [
  'All',
  'Communication',
  'Motor',
  'Social',
  'Self-Help',
  'Cognition',
  'Play',
  'Academic',
];

export const statusOptions: GoalStatus[] = ['Active', 'In Progress', 'Mastered'];

export const statusBadgeColors: Record<GoalStatus, { bg: string; text: string }> = {
  Active: { bg: '#D1FAE5', text: '#059669' },
  'In Progress': { bg: '#FEF3C7', text: '#B45309' },
  Mastered: { bg: '#E0F2FE', text: '#0284C7' },
};

export function goalToWithStatus(
  g: Goal,
  status: GoalStatus = 'Active',
  progress = 50,
): GoalWithStatus {
  return { ...g, status, progress };
}

export const emptyStudentGoals: StudentGoals = {
  'station1-0': null,
  'station1-1': null,
  'station2-0': null,
  'station2-1': null,
};

export const slotLabels: Record<SlotKey, string> = {
  'station1-0': 'Station 1 — Slot 1',
  'station1-1': 'Station 1 — Slot 2',
  'station2-0': 'Station 2 — Slot 1',
  'station2-1': 'Station 2 — Slot 2',
};
