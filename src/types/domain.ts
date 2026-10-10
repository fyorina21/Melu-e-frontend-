import type { FormField } from './forms';

export type UUID = string;
export type ISODateString = string;
export type ISODateTimeString = string;
export type TimeString = string;

export type PromptLevelLabel = 'FP' | 'PP' | 'G' | '+' | 'INDEPENDENT';
export type PromptLevel = 'FP' | 'PP' | 'G' | 'INDEPENDENT' | string;

export interface PromptLevelConfigItem {
  id: string;
  label: string;
  name: string;
  color: string;
  description: string;
  order: number;
  active: boolean;
}

export type GoalType = 'trial' | 'task_analysis' | string;

export type StudentGoalStatus = 'active' | 'mastered' | 'in_progress' | 'paused' | string;

export type TherapySessionStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | string;

export interface TaskAnalysisStep {
  id: string;
  description: string;
  successCount: number;
  totalTrials: number;
  independencePercent: number;
}

export interface Trial {
  id?: string;
  promptLevel?: string;
  promptLabel?: PromptLevelLabel | null;
  promptLevelId?: string;
  outcome?: string;
  timestamp?: string;
  loggedAt?: string;
  sessionId?: string;
  studentGoalId?: string;
  studentGoalStepId?: string | null;
  clientEventId?: string;
}

export interface Goal {
  id: string;
  name: string;
  category?: string;
  goalType?: string;
  independencePercent?: number;
  totalTrials?: number;
  promptBreakdown?: Record<string, number>;
  trialLog?: Trial[];
  overallMasteryStatus?: string;
  steps?: TaskAnalysisStep[];
}

export interface GoalPill {
  id: UUID;
  name: string;
  goalType: GoalType;
  status: StudentGoalStatus;
  progressPercent: number;
}

export interface Student {
  id: string;
  name: string;
  initial?: string;
  program?: string;
  active?: boolean;
  goals: Goal[];
  trials?: Trial[];
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

export interface StudentCard {
  id: UUID;
  cardPosition: number;
  student: Pick<StudentSummary, 'id' | 'fullName' | 'therapyGroup'>;
  currentFocusStudentGoalId: UUID | null;
  goals: GoalPill[];
  recentTrials: Trial[];
}

export interface SessionRoster {
  teacherName: string;
  stationName: string;
  roomName: string;
  blockDurationMinutes?: number;
  students: Student[];
}

export interface IncidentPayload {
  date?: string;
  time?: string;
  location?: string;
  behavior: string;
  frequency?: string;
  intensity?: string;
  category?: string;
  antecedent: string;
  consequence: string;
  teacher?: string;
  additionalNotes?: string;
  notes?: string;
  studentId?: string;
  studentName?: string;
  customFields?: Record<string, any>;
  [key: string]: any;
}

export interface SessionIncident {
  time: string;
  behavior: string;
  studentName: string;
  date?: string;
  antecedent?: string;
  consequence?: string;
  additionalNotes?: string;
}

export interface SessionSummaryStudent {
  id: string;
  name: string;
  goals: Goal[];
}

export interface SessionSummary {
  stationName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status?: string;
  students: SessionSummaryStudent[];
  incidents: SessionIncident[];
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
  promptLevels: PromptLevelConfigItem[] | any[];
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
  promptLevels: any[];
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

export type { FormField };
