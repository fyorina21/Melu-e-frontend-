// src/screens/programdirector/dashboard/dashboardTypes.ts

export interface DashboardStudent {
  id: string;
  fullName: string;
  programType: string;
  therapyGroup: string;
  therapist: string;
  assessmentStatus: 'not-started' | 'in-progress' | 'completed';
  sessionAssigned: boolean;
  currentStage: string;
  status: string;
}

export interface WorkflowStage {
  key: string;
  name: string;
  count: number;
}

export interface NotificationItem {
  id: string | number;
  text: string;
  urgent: boolean;
}

export interface ClinicalOverview {
  activeStudents: number;
  assessmentsPending: number;
  sessionsAssigned: number;
  completedSessions: number;
  goalsInProgress: number;
}

export interface RecentActivityItem {
  text: string;
  type: string;
  time: string;
}

export interface DashboardData {
  notifications?: NotificationItem[];
  unreadCount: number;
  totalStudents: number;
  inAssessment: number;
  assessmentCompleted: number;
  readyForSessions: number;
  workflowStages: WorkflowStage[];
  students: DashboardStudent[];
  clinicalOverview: ClinicalOverview;
  recentActivity: RecentActivityItem[];
}

export const STAGE_COLORS: Record<
  string,
  { bg: string; border: string; text: string; dot: string }
> = {
  enrolled: {
    bg: '#F3F4F6',
    border: '#D1D5DB',
    text: '#374151',
    dot: '#9CA3AF',
  },
  'in-assessment': {
    bg: '#FEF3C7',
    border: '#FCD34D',
    text: '#92400E',
    dot: '#F59E0B',
  },
  'assessment-complete': {
    bg: '#DBEAFE',
    border: '#93C5FD',
    text: '#1E40AF',
    dot: '#3B82F6',
  },
  'session-assigned': {
    bg: '#EDE9FE',
    border: '#C4B5FD',
    text: '#5B21B6',
    dot: '#8B5CF6',
  },
  'in-session': {
    bg: '#D1FAE5',
    border: '#6EE7B7',
    text: '#065F46',
    dot: '#10B981',
  },
};

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Not Started': { bg: '#F3F4F6', text: '#6B7280' },
  'In Assessment': { bg: '#FEF3C7', text: '#B45309' },
  'Assessment Completed': { bg: '#DBEAFE', text: '#2563EB' },
  'Session Assigned': { bg: '#EDE9FE', text: '#7C3AED' },
  'In Session': { bg: '#D1FAE5', text: '#059669' },
};

export const FILTER_OPTIONS = [
  { key: 'all', label: 'All Students' },
  { key: 'in-assessment', label: 'In Assessment' },
  { key: 'assessment-complete', label: 'Assessment Complete' },
  { key: 'session-assigned', label: 'Session Assigned' },
  { key: 'in-session', label: 'In Session' },
] as const;

export function filterStudents(
  students: DashboardStudent[] = [],
  filterKey: string,
  searchQuery: string,
): DashboardStudent[] {
  return students.filter((s) => {
    if (filterKey !== 'all' && s.currentStage !== filterKey) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.therapist.toLowerCase().includes(q) ||
        s.programType.toLowerCase().includes(q)
      );
    }
    return true;
  });
}
