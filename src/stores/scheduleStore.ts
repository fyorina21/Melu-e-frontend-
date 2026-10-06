// src/stores/scheduleStore.ts
//
// Modernized Schedule Store implemented with Zustand.
// Exposes both the reactive `useScheduleStore` hook and procedural helpers
// for backward compatibility across scheduling screens and modals.

import { create } from 'zustand';

export interface ScheduleAppointment {
  id: string;
  status: string;
  therapistId: string;
  therapistName: string;
  roomId: string;
  roomName: string;
  studentIds: string[];
  studentNames: string[];
  startTime: string;
  endTime: string;
  date?: string;
}

export type WeekData = Record<number, ScheduleAppointment[]>;

const THERAPIST_NAMES: Record<string, string> = {
  't-a': 'Teacher A',
  't-b': 'Teacher B',
  't-c': 'Teacher C',
};
const STUDENT_NAMES: Record<string, string> = {
  'student-a': 'Student A',
  'student-b': 'Student B',
  'student-c': 'Student C',
};
const ROOM_NAMES: Record<string, string> = {
  'room-1': 'Room 1',
  'room-2': 'Room 2',
  'room-3': 'Room 3',
};

export function resolveTherapistName(id: string | null | undefined): string {
  return (id && THERAPIST_NAMES[id]) || id || 'Unassigned';
}
export function resolveRoomName(id: string | null | undefined): string {
  return (id && ROOM_NAMES[id]) || id || 'TBD';
}
export function resolveStudentNames(ids: string[] | undefined): string[] {
  return (ids || []).map((id) => STUDENT_NAMES[id] || id);
}

export function dayIndexFromDate(date?: string): number {
  if (!date) return 0;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return 0;
  const dow = parsed.getDay();
  return dow >= 1 && dow <= 5 ? dow - 1 : 0;
}

export interface UnavailabilityEntry {
  therapistId: string;
  therapistName: string;
  date: string;
  reason: string;
}

function seedWeek(): WeekData {
  return {
    0: [
      {
        id: '1',
        status: 'confirmed',
        therapistId: 't-a',
        therapistName: 'Teacher A',
        roomId: 'room-2',
        roomName: 'Room 2',
        studentIds: ['student-a', 'student-b'],
        studentNames: ['Student A', 'Student B'],
        startTime: '9:00 AM',
        endTime: '10:30 AM',
        date: '2026-08-10',
      },
      {
        id: '2',
        status: 'scheduled',
        therapistId: 't-b',
        therapistName: 'Teacher B',
        roomId: 'room-3',
        roomName: 'Room 3',
        studentIds: ['student-c'],
        studentNames: ['Student C'],
        startTime: '11:00 AM',
        endTime: '12:00 PM',
        date: '2026-08-10',
      },
    ],
    1: [],
    2: [
      {
        id: '3',
        status: 'scheduled',
        therapistId: 't-a',
        therapistName: 'Teacher A',
        roomId: 'room-2',
        roomName: 'Room 2',
        studentIds: ['student-a', 'student-b'],
        studentNames: ['Student A', 'Student B'],
        startTime: '9:00 AM',
        endTime: '10:30 AM',
        date: '2026-08-12',
      },
    ],
    3: [],
    4: [],
  };
}

export interface ScheduleStoreState {
  schedule: WeekData;
  unavailability: UnavailabilityEntry[];
  addAppointment: (dayIndex: number, appt: Omit<ScheduleAppointment, 'id'>) => ScheduleAppointment;
  updateAppointmentById: (id: string, patch: Partial<ScheduleAppointment>) => void;
  setAppointmentStatus: (id: string, status: string) => void;
  addUnavailability: (therapistId: string, date: string, reason: string) => void;
  reassignStudentsInStore: (
    dayIndex: number,
    from: string,
    to: string,
    studentIds: string[],
  ) => void;
}

export const useScheduleStore = create<ScheduleStoreState>((set, get) => ({
  schedule: seedWeek(),
  unavailability: [],

  addAppointment: (dayIndex, appt) => {
    const created: ScheduleAppointment = {
      id: `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...appt,
    };
    const s = get().schedule;
    set({ schedule: { ...s, [dayIndex]: [...(s[dayIndex] || []), created] } });
    return created;
  },

  updateAppointmentById: (id, patch) => {
    const s = get().schedule;
    let from: number | null = null;
    for (const day of Object.keys(s)) {
      if (s[Number(day)].some((a) => a.id === id)) {
        from = Number(day);
        break;
      }
    }
    if (from === null) return;
    const current = s[from].find((a) => a.id === id);
    if (!current) return;
    const updated: ScheduleAppointment = { ...current, ...patch, id };
    const rest = s[from].filter((a) => a.id !== id);
    const next = { ...s };
    if (patch.date) {
      next[from] = rest;
      const to = dayIndexFromDate(patch.date);
      next[to] = [...(next[to] || []), updated];
    } else {
      next[from] = [...rest, updated];
    }
    set({ schedule: next });
  },

  setAppointmentStatus: (id, status) => {
    get().updateAppointmentById(id, { status });
  },

  addUnavailability: (therapistId, date, reason) => {
    set({
      unavailability: [
        ...get().unavailability,
        { therapistId, therapistName: resolveTherapistName(therapistId), date, reason },
      ],
    });
  },

  reassignStudentsInStore: (dayIndex, from, to, studentIds) => {
    const next = { ...get().schedule };
    const moved = new Set(studentIds);
    const list = (next[dayIndex] || []).map((a) => {
      if (a.therapistId !== from) return a;
      const keptIds = (a.studentIds || []).filter((id) => !moved.has(id));
      return { ...a, studentIds: keptIds, studentNames: resolveStudentNames(keptIds) };
    });
    const targetIdx = list.findIndex((a) => a.therapistId === to);
    if (targetIdx >= 0) {
      const target = list[targetIdx];
      list[targetIdx] = {
        ...target,
        studentIds: [...(target.studentIds || []), ...studentIds],
        studentNames: [...(target.studentNames || []), ...resolveStudentNames(studentIds)],
      };
    } else {
      list.push({
        id: `local-reassign-${Date.now()}`,
        status: 'scheduled',
        therapistId: to,
        therapistName: resolveTherapistName(to),
        roomId: '',
        roomName: 'TBD',
        studentIds,
        studentNames: resolveStudentNames(studentIds),
        startTime: '9:00 AM',
        endTime: '10:30 AM',
      });
    }
    next[dayIndex] = list;
    set({ schedule: next });
  },
}));

// Backward-compatible exports
export function subscribe(listener: () => void): () => void {
  return useScheduleStore.subscribe(listener);
}

export function getWeekData(): WeekData {
  return useScheduleStore.getState().schedule;
}

export function getUnavailability(): UnavailabilityEntry[] {
  return useScheduleStore.getState().unavailability;
}

export function addAppointment(
  dayIndex: number,
  appt: Omit<ScheduleAppointment, 'id'>,
): ScheduleAppointment {
  return useScheduleStore.getState().addAppointment(dayIndex, appt);
}

export function updateAppointmentById(id: string, patch: Partial<ScheduleAppointment>): void {
  useScheduleStore.getState().updateAppointmentById(id, patch);
}

export function setAppointmentStatus(id: string, status: string): void {
  useScheduleStore.getState().setAppointmentStatus(id, status);
}

export function addUnavailability(therapistId: string, date: string, reason: string): void {
  useScheduleStore.getState().addUnavailability(therapistId, date, reason);
}

export function reassignStudentsInStore(
  dayIndex: number,
  from: string,
  to: string,
  studentIds: string[],
): void {
  useScheduleStore.getState().reassignStudentsInStore(dayIndex, from, to, studentIds);
}
