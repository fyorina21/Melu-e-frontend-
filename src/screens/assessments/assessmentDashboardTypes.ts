export type SubModuleKey = 'skills' | 'behavior' | 'preference' | 'sensory';
export type SubModuleStatus = 'completed' | 'in_progress' | 'not_started';
export type StudentStatusDot = 'green' | 'amber' | 'gray';

export interface AssessmentSubModule {
  key: SubModuleKey;
  label: string;
  subtitle: string;
  status: SubModuleStatus;
  progressPercentage: number;
}

export interface StudentAssessmentItem {
  id: string;
  studentId?: string;
  fullName: string;
  initial: string;
  age: number;
  programType: string;
  therapistName: string;
  lastActivityAt?: string;
  lastAssessmentActivityAt?: string;
  lastActivityDisplay: string;
  daysSinceLastActivity?: number;
  hasStaleDraft: boolean;
  staleDays: number;
  statusDot: StudentStatusDot;
  status?: string;
  overallScore: number;
  completedModulesCount: number;
  modules: {
    skills: AssessmentSubModule;
    behavior: AssessmentSubModule;
    preference: AssessmentSubModule;
    sensory: AssessmentSubModule;
  };
  photoUrl?: string;
}

export interface AssessmentKpis {
  assignedStudentsCount: number;
  completedSubModules: number;
  totalRequiredSubModules: number;
  inProgressSubModules: number;
  pendingSubModules: number;
}

export interface AssessmentDashboardPayload {
  clinicianName: string;
  periodLabel: string;
  kpis: AssessmentKpis;
  students: StudentAssessmentItem[];
}
