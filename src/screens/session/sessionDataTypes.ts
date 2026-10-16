// src/screens/session/sessionDataTypes.ts

import type { IncidentPayload } from './components/BehaviorIncidentModal';

export interface IncidentModalState {
  studentId: string;
  studentGoalId?: string;
  studentName?: string;
  goalName?: string;
}

export interface SessionHeaderTimerProps {
  teacherName: string;
  stationName: string;
  roomName: string;
  secondsRemaining: number | null;
  isRunning: boolean;
  onToggleTimer: () => void;
}

export interface SessionFooterActionsProps {
  onSwapStudents: () => void;
  onSessionSummary: () => void;
}

export interface SessionEmptyStudentsProps {
  heading?: string;
  title?: string;
  message?: string;
}

export type { IncidentPayload };
