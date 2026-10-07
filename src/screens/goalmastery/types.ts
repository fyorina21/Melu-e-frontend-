export type OutcomeOption = 'novel_person' | 'novel_environment' | 'both' | 'failed';
export type PromptType = '' | 'Full Physical (FP)' | 'Partial Physical (PP)' | 'Gestural (G)';

export interface PrimaryTeacherData {
  name: string;
  criteriaMet: string;
  dateAchieved: string;
  totalTrials: number;
  independenceRate: string;
  notes?: string;
}

export interface VerificationTeacher {
  name: string;
  date: string;
  outcome?: OutcomeOption | null;
  promptUsed?: PromptType;
  notes?: string;
}

export interface MasteryCheckData {
  studentId?: string;
  goalId?: string;
  studentName: string;
  goalName: string;
  station: string;
  dateInitiated: string;
  initiatedBy: string;
  initiatedByRole: string;
  statusLabel: string;
  primaryTeacher: PrimaryTeacherData;
  teacherB: VerificationTeacher;
  teacherC: VerificationTeacher;
}

export interface GoalOption {
  id: string;
  name: string;
  status?: string;
}

export const OUTCOME_OPTIONS: { id: OutcomeOption; label: string }[] = [
  { id: 'novel_person', label: 'Independent with Novel Person' },
  { id: 'novel_environment', label: 'Independent in Novel Environment' },
  { id: 'both', label: 'Both' },
  { id: 'failed', label: 'Failed - Required Prompt' },
];

export const PROMPT_OPTIONS: PromptType[] = [
  'Full Physical (FP)',
  'Partial Physical (PP)',
  'Gestural (G)',
];

export function isTeacherVerificationValid(
  outcome: OutcomeOption | null,
  prompt: PromptType,
): boolean {
  if (!outcome) return false;
  if (outcome === 'failed') {
    return prompt.trim().length > 0;
  }
  return true;
}
