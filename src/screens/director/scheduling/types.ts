export interface Option {
  id: string;
  name: string;
  role?: string;
  status?: string;
  program?: string;
}

export interface ScheduleBlock {
  id: string;
  teacherName: string;
  stationName: string;
  startTime: string;
  endTime: string;
  studentIds: string[];
}

export function filterStaffOptions(teachers: Option[], search: string): Option[] {
  const term = search.trim().toLowerCase();
  if (!term) return teachers;
  return teachers.filter((t) => (t.name || '').toLowerCase().includes(term));
}

export function filterStudentOptions(students: Option[], search: string): Option[] {
  const term = search.trim().toLowerCase();
  if (!term) return students;
  return students.filter((s) => (s.name || '').toLowerCase().includes(term));
}

export function isBlockOverCapacity(block: ScheduleBlock, capacity: number): boolean {
  return block.studentIds.length > capacity;
}
