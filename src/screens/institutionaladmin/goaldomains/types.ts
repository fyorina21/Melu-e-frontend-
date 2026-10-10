export interface GoalDomain {
  id: string;
  name: string;
  description: string;
  active: boolean;
  [key: string]: unknown;
}

export interface TaskAnalysisStep {
  id: string;
  description: string;
}

export interface TaskAnalysisTemplate {
  id: string;
  name: string;
  description: string;
  steps: TaskAnalysisStep[];
  perStepMastery?: number;
  overallMastery?: number;
  active?: boolean;
}
