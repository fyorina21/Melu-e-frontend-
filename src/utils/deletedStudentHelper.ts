// src/utils/deletedStudentHelper.ts
//
// Centralized deleted student registry and purge helper.
// Ensures that when a student is deleted from StudentEnrollment (or anywhere in the app),
// they are completely and permanently purged from every storage cache, option list,
// assessment store, schedule assignment, and API response across the entire frontend.

import { storage } from './storage';

export const DELETED_STUDENTS_KEY = 'melue_deleted_students_cache';
export const DELETED_STUDENT_RECORDS_KEY = 'melue_deleted_student_records';

export interface DeletedStudentRecord {
  id: string;
  name: string;
  deletedAt: string;
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage)
      return (globalThis as any).localStorage;
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {}
  return null;
}

function dispatchStudentEvent(name: string, detail?: any) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    } else if (
      typeof globalThis !== 'undefined' &&
      typeof (globalThis as any).dispatchEvent === 'function'
    ) {
      (globalThis as any).dispatchEvent(new CustomEvent(name, { detail }));
    }
  } catch {}
}

export function getDeletedStudentKeys(): Set<string> {
  try {
    const s = getStorage();
    if (s) {
      const raw = s.getItem(DELETED_STUDENTS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          return new Set(
            arr
              .map((k: string) =>
                String(k || '')
                  .trim()
                  .toLowerCase(),
              )
              .filter(Boolean),
          );
        }
      }
    }
  } catch {}
  return new Set();
}

export function getDeletedStudentRecords(): DeletedStudentRecord[] {
  try {
    const s = getStorage();
    if (s) {
      const raw = s.getItem(DELETED_STUDENT_RECORDS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    }
  } catch {}
  return [];
}

/**
 * Checks whether the given identifier, name, or object matches a deleted student.
 */
export function isStudentDeleted(item: any, name?: string): boolean {
  if (name && isStudentDeleted(name)) return true;
  if (!item) return false;
  const deletedKeys = getDeletedStudentKeys();
  if (deletedKeys.size === 0) return false;

  if (typeof item === 'string') {
    const norm = item.trim().toLowerCase();
    return deletedKeys.has(norm);
  }

  if (typeof item === 'object') {
    const id = String(item.id || item.studentId || item.student_id || '')
      .trim()
      .toLowerCase();
    if (id && deletedKeys.has(id)) return true;

    const name = String(item.fullName || item.name || item.studentName || item.student_name || '')
      .trim()
      .toLowerCase();
    if (name && deletedKeys.has(name)) return true;

    // Check first/last name
    if (item.firstName || item.lastName) {
      const combined = `${item.firstName || ''} ${item.lastName || ''}`.trim().toLowerCase();
      if (combined && deletedKeys.has(combined)) return true;
    }
  }

  return false;
}

/**
 * Filters out deleted students from an array of students, options, or records.
 */
export function filterOutDeletedStudents<T>(items: T[]): T[] {
  if (!Array.isArray(items)) return items;
  return items.filter((item) => !isStudentDeleted(item));
}

/**
 * Automatically filters deleted students from API response payloads.
 */
export function filterStudentResponse(url: string, data: any): any {
  if (!data) return data;
  const normUrl = (url || '').toLowerCase();

  const isStudentEndpoint =
    normUrl.includes('/options/students') ||
    normUrl.includes('/students') ||
    normUrl.includes('/coordinator/students') ||
    normUrl.includes('/program_director/caseload') ||
    normUrl.includes('/program_director/assessments') ||
    normUrl.includes('/caseload') ||
    normUrl.includes('/teacher/dashboard') ||
    normUrl.includes('/coordinator/sessions') ||
    normUrl.includes('/sessions') ||
    normUrl.includes('/director/schedule');

  if (!isStudentEndpoint) return data;

  if (Array.isArray(data)) {
    return filterOutDeletedStudents(
      data.map((item) => {
        if (item && Array.isArray(item.studentIds)) {
          return {
            ...item,
            studentIds: item.studentIds.filter((sid: any) => !isStudentDeleted(sid)),
          };
        }
        if (item && Array.isArray(item.students)) {
          return {
            ...item,
            students: filterOutDeletedStudents(item.students),
          };
        }
        return item;
      }),
    );
  }

  if (typeof data === 'object') {
    if (Array.isArray(data.data)) {
      data = { ...data, data: filterOutDeletedStudents(data.data) };
    }
    if (Array.isArray(data.students)) {
      data = { ...data, students: filterOutDeletedStudents(data.students) };
    }
    if (Array.isArray(data.caseload)) {
      data = { ...data, caseload: filterOutDeletedStudents(data.caseload) };
    }
    if (Array.isArray(data.assessments)) {
      data = { ...data, assessments: filterOutDeletedStudents(data.assessments) };
    }
    if (Array.isArray(data.assessmentTasks)) {
      data = { ...data, assessmentTasks: filterOutDeletedStudents(data.assessmentTasks) };
    }
    if (data.todaySchedule && Array.isArray(data.todaySchedule.students)) {
      data = {
        ...data,
        todaySchedule: {
          ...data.todaySchedule,
          students: filterOutDeletedStudents(data.todaySchedule.students),
        },
      };
    }
  }

  return data;
}

/**
 * Permanently and completely purges a student from all storage caches,
 * assignment stores, assessments, and registries across the application.
 */
export function recordDeletedStudent(student: {
  id?: string;
  studentId?: string;
  student_id?: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
}): void {
  try {
    const s = getStorage();
    const currentKeys = getDeletedStudentKeys();
    const keysToAdd: string[] = [];

    const id = String(student.id || student.studentId || student.student_id || '')
      .trim()
      .toLowerCase();
    if (id) keysToAdd.push(id);

    const name = String(student.fullName || student.name || '')
      .trim()
      .toLowerCase();
    if (name) keysToAdd.push(name);

    if (student.firstName || student.lastName) {
      const combined = `${student.firstName || ''} ${student.lastName || ''}`.trim().toLowerCase();
      if (combined) keysToAdd.push(combined);
    }

    keysToAdd.forEach((k) => {
      if (k) currentKeys.add(k);
    });

    const newRecord: DeletedStudentRecord = {
      id: student.id || student.studentId || student.student_id || '',
      name: student.fullName || student.name || '',
      deletedAt: new Date().toISOString(),
    };

    if (s) {
      s.setItem(DELETED_STUDENTS_KEY, JSON.stringify(Array.from(currentKeys)));

      // Save audit records
      const records = getDeletedStudentRecords();
      const filteredRecords = records.filter(
        (r) => (!student.id || r.id !== student.id) && (!name || r.name.toLowerCase() !== name),
      );
      filteredRecords.push(newRecord);
      s.setItem(DELETED_STUDENT_RECORDS_KEY, JSON.stringify(filteredRecords));
    }

    // 1. Purge from melue_enrolled_students_cache
    try {
      const enrolled =
        storage.getJSONSync<Record<string, unknown>[]>('melue_enrolled_students_cache', []) || [];
      const cleanEnrolled = enrolled.filter((item) => !isStudentDeleted(item));
      storage.setJSONSync('melue_enrolled_students_cache', cleanEnrolled);
    } catch {}

    // 2. Purge from melue_registered_active_students_v1
    try {
      const activeList =
        storage.getJSONSync<string[]>('melue_registered_active_students_v1', []) || [];
      const cleanActive = activeList.filter(
        (item) =>
          !currentKeys.has(
            String(item || '')
              .trim()
              .toLowerCase(),
          ),
      );
      storage.setJSONSync('melue_registered_active_students_v1', cleanActive);
    } catch {}

    // 3. Purge from melue_student_status_overrides_v1
    try {
      const overrides =
        storage.getJSONSync<Record<string, string>>('melue_student_status_overrides_v1', {}) || {};
      keysToAdd.forEach((k) => {
        delete overrides[k];
      });
      storage.setJSONSync('melue_student_status_overrides_v1', overrides);
    } catch {}

    // 4. Purge from melue_student_status_registry
    try {
      const registry =
        storage.getJSONSync<Record<string, unknown>[]>('melue_student_status_registry', []) || [];
      const cleanRegistry = registry.filter((item) => !isStudentDeleted(item));
      storage.setJSONSync('melue_student_status_registry', cleanRegistry);
    } catch {}

    // 5. Purge from melue_student_photos_registry_v1
    try {
      const photos =
        storage.getJSONSync<Record<string, string>>('melue_student_photos_registry_v1', {}) || {};
      keysToAdd.forEach((k) => {
        delete photos[k];
      });
      storage.setJSONSync('melue_student_photos_registry_v1', photos);
    } catch {}

    // 6. Purge from therapist assignments store (melue_therapist_assigned_students_v1)
    try {
      const therapistStore =
        storage.getJSONSync<Record<string, string[]>>('melue_therapist_assigned_students_v1', {}) ||
        {};
      let changed = false;
      for (const th of Object.keys(therapistStore)) {
        const list = therapistStore[th];
        if (Array.isArray(list)) {
          const filtered = list.filter(
            (sid) =>
              !currentKeys.has(
                String(sid || '')
                  .trim()
                  .toLowerCase(),
              ),
          );
          if (filtered.length !== list.length) {
            therapistStore[th] = filtered;
            changed = true;
          }
        }
      }
      if (changed) {
        storage.setJSONSync('melue_therapist_assigned_students_v1', therapistStore);
      }
    } catch {}

    // 7. Purge from director assignments store (melue_director_assignments_store_v1)
    try {
      const dirStore =
        storage.getJSONSync<Record<string, { studentIds?: unknown[] }>>(
          'melue_director_assignments_store_v1',
          {},
        ) || {};
      let changed = false;
      for (const key of Object.keys(dirStore)) {
        const entry = dirStore[key];
        if (entry && Array.isArray(entry.studentIds)) {
          const filtered = entry.studentIds.filter(
            (sid) =>
              !currentKeys.has(
                String(sid || '')
                  .trim()
                  .toLowerCase(),
              ),
          );
          if (filtered.length !== entry.studentIds.length) {
            entry.studentIds = filtered;
            changed = true;
          }
        }
      }
      if (changed) {
        storage.setJSONSync('melue_director_assignments_store_v1', dirStore);
      }
    } catch {}

    // 8. Purge from caseload assignments cache (melue_caseload_assignments_cache)
    try {
      const caseloadStore =
        storage.getJSONSync<Record<string, string[]>>('melue_caseload_assignments_cache', {}) || {};
      let changed = false;
      for (const th of Object.keys(caseloadStore)) {
        const list = caseloadStore[th];
        if (Array.isArray(list)) {
          const filtered = list.filter(
            (sid) =>
              !currentKeys.has(
                String(sid || '')
                  .trim()
                  .toLowerCase(),
              ),
          );
          if (filtered.length !== list.length) {
            caseloadStore[th] = filtered;
            changed = true;
          }
        }
      }
      if (changed) {
        storage.setJSONSync('melue_caseload_assignments_cache', caseloadStore);
      }
    } catch {}

    // 9. Purge IUP drafts (melue_iup_drafts_cache)
    try {
      const drafts =
        storage.getJSONSync<Record<string, unknown>>('melue_iup_drafts_cache', {}) || {};
      keysToAdd.forEach((k) => {
        delete drafts[k];
      });
      storage.setJSONSync('melue_iup_drafts_cache', drafts);
    } catch {}

    // 10. Purge assessment stores for this student
    const idAliases = [id, student.studentId, student.student_id].filter(Boolean) as string[];
    idAliases.forEach((alias) => {
      try {
        storage.removeSync(`melue_skills_assessment_${alias}`);
        storage.removeSync(`melue_behavior_assessment_${alias}`);
        storage.removeSync(`melue_preference_assessment_${alias}`);
        storage.removeSync(`melue_sensory_assessment_${alias}`);
        storage.removeSync(`melue_assessment_submission_${alias}`);
        storage.removeSync(`melue_assessment_completed_${alias}`);
        storage.removeSync(`melue_assessment_submitted_${alias}`);
      } catch {}
    });

    try {
      const submittedList =
        storage.getJSONSync<any[]>('melue_submitted_students_list_v1', []) || [];
      const updatedList = submittedList.filter((s: any) => {
        const sid = String(s.id || s.studentId || '')
          .trim()
          .toLowerCase();
        const sname = String(s.name || s.fullName || '')
          .trim()
          .toLowerCase();
        return !currentKeys.has(sid) && (!sname || !currentKeys.has(sname));
      });
      storage.setJSONSync('melue_submitted_students_list_v1', updatedList);
    } catch {}

    // 11. Clear last_assessment_student_id if it matched this deleted student
    try {
      const lastSid = storage.getSync('last_assessment_student_id');
      if (lastSid && currentKeys.has(String(lastSid).trim().toLowerCase())) {
        storage.removeSync('last_assessment_student_id');
      }
    } catch {}

    // Purge from session students cache (melue_session_students_cache)
    try {
      const sessStudentsRaw = s ? s.getItem('melue_session_students_cache') : null;
      if (sessStudentsRaw) {
        const sessMap = JSON.parse(sessStudentsRaw);
        let changed = false;
        for (const k of Object.keys(sessMap)) {
          if (Array.isArray(sessMap[k])) {
            const filtered = sessMap[k].filter((item: any) => !isStudentDeleted(item));
            if (filtered.length !== sessMap[k].length) {
              sessMap[k] = filtered;
              changed = true;
            }
          }
        }
        if (changed && s) {
          s.setItem('melue_session_students_cache', JSON.stringify(sessMap));
        }
      }
    } catch {}

    // 12. Dispatch notification events to refresh all screens and views across the application
    dispatchStudentEvent('melue_student_deleted', { student: newRecord });
    dispatchStudentEvent('melue_student_enrolled_updated');
    dispatchStudentEvent('melue_student_status_changed');
    dispatchStudentEvent('melue_therapist_assignment_updated');
    dispatchStudentEvent('melue_assessment_updated');
    dispatchStudentEvent('melue_schedule_assignments_updated');
    dispatchStudentEvent('melue_session_updated');
  } catch {}
}

/**
 * Register a listener for student deletion events.
 */
export function onDeletedStudentChanged(listener: () => void): () => void {
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('melue_student_deleted', listener);
    return () => window.removeEventListener('melue_student_deleted', listener);
  }
  return () => {};
}
