export interface NoteRecord {
  id: string;
  date: string;
  students: string[];
  station: string;
  room: string;
  status: 'Approved' | 'Pending' | 'Revision Required' | 'Draft';
  coordinatorFeedback?: string;
}

export interface DailyNotesStats {
  sessionsCompleted: number;
  totalTrials: number;
  avgIndependence: number;
  reviewsPending: number;
}

export interface WeeklySummaryData {
  weekRange: string;
  sessionsThisWeek: number;
  totalTrialsThisWeek: number;
  avgIndependenceThisWeek: number;
}

export interface BehaviorRecord {
  id: string;
  behavior: string;
  frequency: string;
  duration: string;
  intensity: 'Low' | 'Medium' | 'High';
  trigger: string;
  consequence: string;
}

export interface BehaviorAssessmentData {
  massAnswers?: Record<string, string>;
  fastAnswers?: Record<string, boolean>;
  records?: BehaviorRecord[];
  draftRecord?: BehaviorRecord;
  status?: string;
}

export interface StudentOption {
  id: string;
  name: string;
  initial: string;
}

export interface DailyNotesPresenterProps {
  stats: DailyNotesStats;
  summary: WeeklySummaryData | null;
  filteredRecords: NoteRecord[];
  search: string;
  dateFilter: string;
  statusFilter: string;
  studentId?: string;
  studentOptions: StudentOption[];
  openDropdown: 'date' | 'status' | 'student' | null;
  behaviorAssessment: BehaviorAssessmentData | null;
  hasBehavior: boolean;
  massFunctionText?: string;
  fastCategoryText?: string;
  feedbackTarget: NoteRecord | null;
  dateOptions: string[];
  statusOptions: string[];
  onSearchChange: (text: string) => void;
  onDateFilterChange: (date: string) => void;
  onStatusFilterChange: (status: string) => void;
  onStudentSelect: (id?: string) => void;
  onToggleDropdown: (dropdown: 'date' | 'status' | 'student' | null) => void;
  onExportWeekly: () => void;
  onGoBack: () => void;
  onNavigateEditor: (sessionId: string, mode: 'view' | 'edit') => void;
  onNavigateBehaviorAssessment: (studentId: string) => void;
  onResubmitNote: (id: string) => void;
  onCloseFeedback: () => void;
  onOpenFeedback: (record: NoteRecord) => void;
  onNavbarTabPress: (tab: string) => void;
}
