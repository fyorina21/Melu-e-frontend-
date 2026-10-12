// src/utils/teacherScheduleHelper.ts
//
// Helper utilities to resolve the currently logged-in teacher and their assigned
// students from Director Scheduling / Staff records. Ensures TeacherDashboard and
// SessionDataCollection display the exact same teacher-specific students.

import { isStudentEligibleForSession, getRegisteredStudentStatus } from './studentLifecycleHelper';

export interface TeacherRecord {
  id: string;
  name: string;
  email?: string;
  role?: string;
  assignedStudents?: string[];
}

export interface ScheduleBlockRecord {
  id: string;
  teacherId?: string;
  teacherName?: string;
  stationName?: string;
  roomName?: string;
  startTime?: string;
  endTime?: string;
  sessionBlock?: string;
  blockDurationMinutes?: number;
  studentIds?: string[];
}

/**
 * Finds the matching teacher from a list of staff options based on the current auth session.
 */
export function findLoggedInTeacher(
  authSession: { userId?: string; userName?: string; email?: string } | null | undefined,
  teachers: TeacherRecord[]
): TeacherRecord | null {
  if (!Array.isArray(teachers) || teachers.length === 0) return null;

  if (authSession?.userId) {
    const match = teachers.find((t) => String(t.id) === String(authSession.userId));
    if (match) return match;
  }

  if (authSession?.userName) {
    const normUser = authSession.userName.toLowerCase().trim();
    const match = teachers.find((t) => {
      const tName = (t.name || '').toLowerCase().trim();
      return tName === normUser || tName.includes(normUser) || normUser.includes(tName);
    });
    if (match) return match;
  }

  if (authSession?.email) {
    const normEmail = authSession.email.toLowerCase().trim();
    const match = teachers.find((t) => (t.email || '').toLowerCase().trim() === normEmail);
    if (match) return match;
  }

  return teachers[0] || null;
}

/**
 * Resolves the assigned student IDs strictly belonging to the given teacher from director blocks
 * or teacher staff records. Limits to at most 2 students per clinical / station ratio.
 */
export function resolveTeacherAssignedStudentIds(
  targetTeacher: TeacherRecord | null,
  blocks: ScheduleBlockRecord[]
): {
  assignedStudentIds: string[];
  activeBlock: ScheduleBlockRecord | null;
} {
  if (!targetTeacher) {
    return { assignedStudentIds: [], activeBlock: null };
  }

  const teacherIdStr = String(targetTeacher.id);
  const teacherNameLower = (targetTeacher.name || '').toLowerCase().trim();

  // Filter blocks strictly belonging to this teacher
  const teacherBlocks = (Array.isArray(blocks) ? blocks : []).filter((b) => {
    if (b.teacherId && String(b.teacherId) === teacherIdStr) return true;
    if (teacherNameLower && b.teacherName && b.teacherName.toLowerCase().trim() === teacherNameLower) return true;
    return false;
  });

  const activeBlock =
    teacherBlocks.find((b) => Array.isArray(b.studentIds) && b.studentIds.length > 0) ||
    teacherBlocks[0] ||
    null;

  let assignedStudentIds: string[] = [];

  if (activeBlock && Array.isArray(activeBlock.studentIds) && activeBlock.studentIds.length > 0) {
    assignedStudentIds = Array.from(new Set(activeBlock.studentIds.map(String))).slice(0, 2);
  } else if (Array.isArray(targetTeacher.assignedStudents) && targetTeacher.assignedStudents.length > 0) {
    assignedStudentIds = Array.from(new Set(targetTeacher.assignedStudents.map(String))).slice(0, 2);
  } else if (teacherBlocks.length > 0) {
    const allBlockIds = teacherBlocks.flatMap((b) =>
      Array.isArray(b.studentIds) ? b.studentIds : []
    ).map(String);
    if (allBlockIds.length > 0) {
      assignedStudentIds = Array.from(new Set(allBlockIds)).slice(0, 2);
    }
  }

  return { assignedStudentIds, activeBlock };
}

/**
 * Resolves full student objects from assigned student IDs, student options, and eligibility rules.
 */
export function resolveEligibleTeacherStudents(
  assignedStudentIds: string[],
  studentOptions: any[],
  fallbackStudents: any[] = []
): any[] {
  if (!assignedStudentIds || assignedStudentIds.length === 0) {
    return [];
  }

  const studentMap = new Map<string, any>(
    (studentOptions || []).map((s: any) => [String(s.id), s])
  );
  const fallbackMap = new Map<string, any>(
    (fallbackStudents || []).map((s: any) => [String(s.id), s])
  );

  const mapped = assignedStudentIds.map((sid) => {
    const opt = studentMap.get(sid);
    if (opt) {
      return {
        id: String(opt.id),
        name: opt.name || `Student ${sid.slice(0, 4)}`,
        initial: opt.initial || (opt.name ? opt.name.slice(0, 2).toUpperCase() : 'ST'),
        ...opt,
      };
    }
    const fromFallback = fallbackMap.get(sid);
    if (fromFallback) return fromFallback;

    const reg = getRegisteredStudentStatus(sid);
    if (reg) {
      return {
        id: sid,
        name: reg.name || `Student ${sid.slice(0, 4)}`,
        initial: (reg.name || 'ST').slice(0, 2).toUpperCase(),
        ...reg,
      };
    }

    return { id: sid, name: `Student ${sid.slice(0, 4)}`, initial: 'ST' };
  });

  return mapped.filter(isStudentEligibleForSession).slice(0, 2);
}
