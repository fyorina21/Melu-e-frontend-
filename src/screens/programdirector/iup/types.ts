export interface GoalBankItem {
  id: string;
  name: string;
  domain: string;
  description: string;
  goalType: string;
  masteryCriteria: string;
  active?: boolean;
}

export interface IupCandidate {
  id: string;
  studentId?: string;
  iupId?: string;
  name: string;
  status: string;
  program?: string;
  age?: number;
  assessmentProgress?: number;
  assessmentStatus?: string;
  hasAssessmentData?: boolean;
}

export interface IupContext {
  studentName: string;
  age: number;
  dob: string;
  program: string;
  enrollmentDate: string;
  skillsStrengths: string;
  behaviorFunctions: string;
  topReinforcers: string[];
  sensorySummary: string;
}

export type StationKey = 'station1' | 'station2';
export type Slots = Record<StationKey, (GoalBankItem | null)[]>;

export interface IupGenerationPresenterProps {
  candidates: IupCandidate[];
  completedCandidates: IupCandidate[];
  filteredCandidates: IupCandidate[];
  selectedCandidate: IupCandidate | null;
  selectedStudentId: string | null;
  context: IupContext | null;
  slots: Slots;
  activeWorkbenchTab: 'assessment' | 'goals' | 'strategies';
  reinforcementSchedule: string;
  crisisProtocol: string;
  accommodations: string;
  reviewCycle: string;
  customIupValues: Record<string, any>;
  studentDropdownOpen: boolean;
  searchStudentText: string;
  selectorTarget: { station: StationKey; slotIndex: number } | null;
  goalSearch: string;
  domainFilter: string;
  filteredGoals: GoalBankItem[];
  previewOpen: boolean;
  exportContent: string | null;
  lastSavedTimestamp: string | null;
  onSelectStudent: (id: string) => void;
  onToggleDropdown: () => void;
  onSearchStudent: (text: string) => void;
  onTabChange: (tab: 'assessment' | 'goals' | 'strategies') => void;
  onOpenGoalSelector: (station: StationKey, slotIndex: number) => void;
  onCloseGoalSelector: () => void;
  onSelectGoal: (goal: GoalBankItem) => void;
  onRemoveGoal: (station: StationKey, slotIndex: number) => void;
  onDraftSave: () => void;
  onFinalize: () => void;
  onOpenPreview: () => void;
  onClosePreview: () => void;
  onExport: () => void;
  onCloseExport: () => void;
  onReinforcementScheduleChange: (val: string) => void;
  onCrisisProtocolChange: (val: string) => void;
  onAccommodationsChange: (val: string) => void;
  onReviewCycleChange: (val: string) => void;
  onCustomIupValuesChange: (key: string, val: any) => void;
  onGoalSearchChange: (text: string) => void;
  onDomainFilterChange: (domain: string) => void;
  onNavbarTabPress: (tab: string) => void;
}
