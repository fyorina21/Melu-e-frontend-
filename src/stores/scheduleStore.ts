
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

// Derive the Mon-Fri week index (0-4) from a YYYY-MM-DD date string.
// Weekends and malformed values fall back to Monday so a demo entry never
// silently disappears.
export function dayIndexFromDate(date?: string): number {
  if (!date) return 0;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return 0;
  const dow = parsed.getDay(); // 1 = Mon ... 5 = Fri
  return dow >= 1 && dow <= 5 ? dow - 1 : 0;
}

interface UnavailabilityEntry {
  therapistId: string;
  therapistName: string;
  date: string;
  reason: string;
}

let schedule: WeekData = seedWeek();
let unavailability: UnavailabilityEntry[] = [];

function seedWeek(): WeekData {
  return {
    0: [
      {
        id: '1', status: 'confirmed', therapistId: 't-a', therapistName: 'Teacher A',
        roomId: 'room-2', roomName: 'Room 2', studentIds: ['student-a', 'student-b'],
        studentNames: ['Student A', 'Student B'], startTime: '9:00 AM', endTime: '10:30 AM',
        date: '2026-08-10',
      },
      {
        id: '2', status: 'scheduled', therapistId: 't-b', therapistName: 'Teacher B',
        roomId: 'room-3', roomName: 'Room 3', studentIds: ['student-c'],
        studentNames: ['Student C'], startTime: '11:00 AM', endTime: '12:00 PM',
        date: '2026-08-10',
      },
    ],
    1: [],
    2: [
      {
        id: '3', status: 'scheduled', therapistId: 't-a', therapistName: 'Teacher A',
        roomId: 'room-2', roomName: 'Room 2', studentIds: ['student-a', 'student-b'],
        studentNames: ['Student A', 'Student B'], startTime: '9:00 AM', endTime: '10:30 AM',
        date: '2026-08-12',
      },
    ],
    3: [],
    4: [],
  };
}

const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function getWeekData(): WeekData {
  return schedule;
}

export function getUnavailability(): UnavailabilityEntry[] {
  return unavailability;
}

function findDayOf(id: string): number | null {
  for (const day of Object.keys(schedule)) {
    if (schedule[Number(day)].some((a) => a.id === id)) return Number(day);
  }
  return null;
}

export function addAppointment(dayIndex: number, appt: Omit<ScheduleAppointment, 'id'>): ScheduleAppointment {
  const created: ScheduleAppointment = {
    id: `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...appt,
  };
  schedule = { ...schedule, [dayIndex]: [...(schedule[dayIndex] || []), created] };
  emit();
  return created;
}

export function updateAppointmentById(id: string, patch: Partial<ScheduleAppointment>) {
  const from = findDayOf(id);
  if (from === null) return;
  const current = schedule[from].find((a) => a.id === id);
  if (!current) return;
  const updated: ScheduleAppointment = { ...current, ...patch, id };
  const rest = schedule[from].filter((a) => a.id !== id);
  const next = { ...schedule };
  if (patch.date) {
    next[from] = rest;
    const to = dayIndexFromDate(patch.date);
    next[to] = [...(next[to] || []), updated];
  } else {
    next[from] = [...rest, updated];
  }
  schedule = next;
  emit();
}

export function setAppointmentStatus(id: string, status: string) {
  updateAppointmentById(id, { status });
}

export function addUnavailability(therapistId: string, date: string, reason: string) {
  unavailability = [
    ...unavailability,
    { therapistId, therapistName: resolveTherapistName(therapistId), date, reason },
  ];
  emit();
}

export function reassignStudentsInStore(dayIndex: number, from: string, to: string, studentIds: string[]) {
  const next = { ...schedule };
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
  schedule = next;
  emit();
}
