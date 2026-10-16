// src/utils/teacherScheduleHelper.ts
//
// Helper utilities to resolve the currently logged-in teacher and their assigned
// students from Director Scheduling / Staff records. Ensures TeacherDashboard and
// SessionDataCollection display the exact same teacher-specific students.

import {
  isStudentEligibleForSession,
  getRegisteredStudentStatus,
  markStudentAssessmentCompleted,
  registerStudentStatuses,
} from './studentLifecycleHelper';
import { setStoredSessionStudents } from '../stores/trialsStore';

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

const DIRECTOR_ASSIGNMENTS_KEY = 'melue_director_assignments_store_v1';

export interface DirectorAssignmentRecord {
  teacherId: string;
  blockId: string;
  studentIds: string[];
  updatedAt: string;
}

type AssignmentChangeListener = () => void;
const listeners = new Set<AssignmentChangeListener>();

function notifyListeners(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

/**
 * Saves assigned students for a specific teacher and schedule block.
 * Persists locally, updates session stores, and notifies listening screens.
 */
export function saveDirectorAssignment(
  teacherId: string,
  blockId: string,
  studentIds: string[],
  studentObjects?: any[]
): void {
  if (typeof localStorage === 'undefined' || !teacherId) return;
  try {
    const raw = localStorage.getItem(DIRECTOR_ASSIGNMENTS_KEY);
    const store: Record<string, DirectorAssignmentRecord> = raw ? JSON.parse(raw) : {};

    const cleanIds = Array.from(new Set(studentIds.map(String))).slice(0, 2);

    const record: DirectorAssignmentRecord = {
      teacherId: String(teacherId),
      blockId: String(blockId),
      studentIds: cleanIds,
      updatedAt: new Date().toISOString(),
    };

    store[String(teacherId)] = record;
    if (blockId) {
      store[String(blockId)] = record;
    }

    localStorage.setItem(DIRECTOR_ASSIGNMENTS_KEY, JSON.stringify(store));

    // Ensure each assigned student has session assignment registered
    cleanIds.forEach((sid) => {
      markStudentAssessmentCompleted(sid);
      registerStudentStatuses([
        {
          id: sid,
          status: 'in_session',
          rawStatus: 'in_session',
          sessionAssigned: true,
        },
      ]);
    });

    // Store mapped full student objects into session storage
    if (Array.isArray(studentObjects) && studentObjects.length > 0) {
      setStoredSessionStudents('active', studentObjects, teacherId);
    }

    notifyListeners();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('melue_schedule_assignments_updated', {
          detail: { teacherId, blockId, studentIds: cleanIds },
        })
      );
    }
  } catch {}
}

/**
 * Retrieves the student IDs assigned to this teacher from Director Scheduling.
 */
export function getDirectorAssignmentsForTeacher(teacherId?: string): string[] | null {
  if (typeof localStorage === 'undefined' || !teacherId) return null;
  try {
    const raw = localStorage.getItem(DIRECTOR_ASSIGNMENTS_KEY);
    if (!raw) return null;
    const store: Record<string, DirectorAssignmentRecord> = JSON.parse(raw);
    const record = store[String(teacherId)];
    if (record && Array.isArray(record.studentIds)) {
      return record.studentIds;
    }
    for (const key of Object.keys(store)) {
      const item = store[key];
      if (item && String(item.teacherId) === String(teacherId) && Array.isArray(item.studentIds)) {
        return item.studentIds;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Retrieves the student IDs assigned to this block from Director Scheduling.
 */
export function getDirectorAssignmentsForBlock(blockId?: string): string[] | null {
  if (typeof localStorage === 'undefined' || !blockId) return null;
  try {
    const raw = localStorage.getItem(DIRECTOR_ASSIGNMENTS_KEY);
    if (!raw) return null;
    const store: Record<string, DirectorAssignmentRecord> = JSON.parse(raw);
    const record = store[String(blockId)];
    if (record && Array.isArray(record.studentIds)) {
      return record.studentIds;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Merges stored Director assignments into schedule blocks.
 */
export function applyDirectorAssignmentsToBlocks(blocks: any[], teacherId?: string): any[] {
  if (!Array.isArray(blocks)) blocks = [];
  if (typeof localStorage === 'undefined') return blocks;
  try {
    const raw = localStorage.getItem(DIRECTOR_ASSIGNMENTS_KEY);
    if (!raw) return blocks;
    const store: Record<string, DirectorAssignmentRecord> = JSON.parse(raw);

    const merged = blocks.map((b) => {
      const blockIdStr = String(b.id || '');
      const teacherIdStr = String(b.teacherId || '');

      const fromBlock = store[blockIdStr];
      const fromTeacher = store[teacherIdStr];

      const assignment = fromBlock || fromTeacher;
      if (assignment && Array.isArray(assignment.studentIds)) {
        return {
          ...b,
          studentIds: assignment.studentIds,
        };
      }
      return b;
    });

    if (teacherId && store[String(teacherId)]) {
      const record = store[String(teacherId)];
      const hasBlock = merged.some(
        (b) => String(b.teacherId) === String(teacherId) || String(b.id) === String(record.blockId)
      );
      if (!hasBlock) {
        merged.push({
          id: record.blockId || `block-${teacherId}`,
          teacherId: String(teacherId),
          teacherName: 'Assigned Teacher',
          stationName: 'Station 1',
          startTime: '09:00 AM',
          endTime: '10:30 AM',
          studentIds: record.studentIds,
        });
      }
    }

    return merged;
  } catch {
    return blocks;
  }
}

/**
 * Clears or removes specific student assignments for a block.
 */
export function clearDirectorAssignmentsForBlock(
  blockId: string,
  teacherId?: string,
  studentIdsToRemove?: string[]
): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(DIRECTOR_ASSIGNMENTS_KEY);
    if (!raw) return;
    const store: Record<string, DirectorAssignmentRecord> = JSON.parse(raw);

    const targetKey = String(blockId);
    const current = store[targetKey] || (teacherId ? store[String(teacherId)] : null);

    if (current && Array.isArray(current.studentIds)) {
      if (Array.isArray(studentIdsToRemove) && studentIdsToRemove.length > 0) {
        const removeSet = new Set(studentIdsToRemove.map(String));
        current.studentIds = current.studentIds.filter((id) => !removeSet.has(String(id)));
      } else {
        current.studentIds = [];
      }
      store[targetKey] = current;
      if (teacherId) store[String(teacherId)] = current;
    }

    localStorage.setItem(DIRECTOR_ASSIGNMENTS_KEY, JSON.stringify(store));
    notifyListeners();
  } catch {}
}

/**
 * Subscribes to director schedule assignment changes.
 */
export function onScheduleAssignmentsChanged(listener: AssignmentChangeListener): () => void {
  listeners.add(listener);
  const handleCustomEvent = () => listener();
  if (typeof window !== 'undefined') {
    window.addEventListener('melue_schedule_assignments_updated', handleCustomEvent);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('melue_schedule_assignments_updated', handleCustomEvent);
    }
  };
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

  // Check director assignments store first
  const storedIds = getDirectorAssignmentsForTeacher(teacherIdStr);
  if (storedIds !== null) {
    const teacherBlocks = (Array.isArray(blocks) ? blocks : []).filter((b) => {
      if (b.teacherId && String(b.teacherId) === teacherIdStr) return true;
      if (teacherNameLower && b.teacherName && b.teacherName.toLowerCase().trim() === teacherNameLower) return true;
      return false;
    });
    const activeBlock = teacherBlocks[0] || null;
    return { assignedStudentIds: storedIds.slice(0, 2), activeBlock };
  }

  // Filter blocks strictly belonging to this teacher
  let teacherBlocks = (Array.isArray(blocks) ? blocks : []).filter((b) => {
    if (b.teacherId && String(b.teacherId) === teacherIdStr) return true;
    if (teacherNameLower && b.teacherName && b.teacherName.toLowerCase().trim() === teacherNameLower) return true;
    return false;
  });

  // If blocks were already fetched specifically for this teacher (e.g. via ?teacherId=...)
  // or teacherName is generic (e.g. "Teacher"), match blocks associated with this teacher
  if (teacherBlocks.length === 0 && Array.isArray(blocks) && blocks.length > 0) {
    const matchingBlocks = blocks.filter((b) => {
      if (b.teacherId && String(b.teacherId) === teacherIdStr) return true;
      if (teacherNameLower && b.teacherName && b.teacherName.toLowerCase().trim() === teacherNameLower) return true;
      return false;
    });
    if (matchingBlocks.length > 0) {
      teacherBlocks = matchingBlocks;
    }
  }

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
        ...opt,
        id: String(opt.id),
        name: opt.name || `Student ${sid.slice(0, 4)}`,
        initial: opt.initial || (opt.name ? opt.name.slice(0, 2).toUpperCase() : 'ST'),
        status: 'in_session',
        rawStatus: 'in_session',
        currentStage: 'in-session',
        sessionAssigned: true,
      };
    }
    const fromFallback = fallbackMap.get(sid);
    if (fromFallback) {
      return {
        ...fromFallback,
        id: sid,
        status: 'in_session',
        rawStatus: 'in_session',
        currentStage: 'in-session',
        sessionAssigned: true,
      };
    }

    const reg = getRegisteredStudentStatus(sid);
    if (reg) {
      return {
        ...reg,
        id: sid,
        name: reg.name || `Student ${sid.slice(0, 4)}`,
        initial: (reg.name || 'ST').slice(0, 2).toUpperCase(),
        status: 'in_session',
        rawStatus: 'in_session',
        currentStage: 'in-session',
        sessionAssigned: true,
      };
    }

    return {
      id: sid,
      name: `Student ${sid.slice(0, 4)}`,
      initial: 'ST',
      status: 'in_session',
      rawStatus: 'in_session',
      currentStage: 'in-session',
      sessionAssigned: true,
    };
  });

  return mapped.slice(0, 2);
}
