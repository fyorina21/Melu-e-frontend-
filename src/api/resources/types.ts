// src/api/resources/types.ts
//
// Shared domain types mirrored from the Rails serializers in the
// melue-foundation backend. Keeping them here (instead of the global
// src/types.ts) lets the API layer stay self-contained and independently
// testable.

export type UUID = string;
export type ISODateString = string;
export type ISODateTimeString = string;
export type TimeString = string;

export type PromptLevelLabel = 'FP' | 'PP' | 'G' | '+';

export type GoalType = 'trial' | 'task_analysis';

export type StudentGoalStatus = 'active' | 'mastered' | 'in_progress' | 'paused';

export type TherapySessionStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface PromptLevel {
  id: UUID;
  label: PromptLevelLabel;
  color: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface StudentSummary {
  id: UUID;
  fullName: string;
  firstName: string;
  lastName: string;
  dateOfBirth: ISODateString;
  age: number;
  programType: string;
  therapyGroup: string;
  status: string;
  headshotUrl: string | null;
}

export interface BlockContext {
  id: UUID;
  name: string;
  startTime: TimeString;
  endTime: TimeString;
  secondsRemaining: number;
}

export interface StationSummary {
  id: UUID;
  name: string;
}

export interface RoomSummary {
  id: UUID;
  name: string;
}

export interface Trial {
  id: UUID;
  outcome: string;
  promptLabel: PromptLevelLabel | null;
  promptLevelId: UUID;
  studentGoalId: UUID;
  studentGoalStepId: UUID | null;
  clientEventId: string;
  loggedAt: ISODateTimeString;
}

export interface GoalPill {
  id: UUID;
  name: string;
  goalType: GoalType;
  status: StudentGoalStatus;
  progressPercent: number;
}

export interface StudentCard {
  id: UUID;
  cardPosition: number;
  student: Pick<StudentSummary, 'id' | 'fullName' | 'therapyGroup'>;
  currentFocusStudentGoalId: UUID | null;
  goals: GoalPill[];
  recentTrials: Trial[];
}

export interface SessionState {
  id: UUID;
  status: TherapySessionStatus;
  startedAt: ISODateTimeString | null;
  endedAt: ISODateTimeString | null;
}

export interface SessionDashboard {
  id: UUID;
  status: TherapySessionStatus;
  startedAt: ISODateTimeString | null;
  endedAt: ISODateTimeString | null;
  station: StationSummary;
  room: RoomSummary;
  block: BlockContext;
  participants: StudentCard[];
  promptLevels: PromptLevel[];
}

export interface TodaySessionResponse {
  assignment: {
    id: UUID;
    scheduledDate: ISODateString;
    status: string;
    block: BlockContext;
    station: StationSummary;
    room: RoomSummary;
  } | null;
  session: SessionState | null;
  promptLevels: PromptLevel[];
}

export interface Notification {
  id: UUID;
  type: string;
  payload: Record<string, unknown> | null;
  read: boolean;
  readAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
}

export interface EnrollmentDraft {
  id: UUID;
  currentStep: string;
  studentId: UUID | null;
  guardianId: UUID | null;
  data: Record<string, unknown>;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}