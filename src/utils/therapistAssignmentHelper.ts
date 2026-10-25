import { storage } from './storage';

export const THERAPIST_ASSIGNMENTS_STORAGE_KEY = 'melue_therapist_assigned_students_v1';
export const ENROLLED_STUDENTS_CACHE_KEY = 'melue_enrolled_students_cache';
export const DIRECTOR_ASSIGNMENTS_KEY = 'melue_director_assignments_store_v1';

export interface TherapistRef {
  id?: string | number | null;
  name?: string | null;
  userName?: string | null;
  email?: string | null;
  assignedStudents?: Array<string | number> | null;
}

export interface StudentRef {
  id?: string | number | null;
  studentId?: string | number | null;
  student_id?: string | number | null;
  name?: string | null;
  fullName?: string | null;
  therapist?: string | null;
  assignedTherapist?: string | null;
  teacher?: string | null;
  teacherName?: string | null;
}

/**
 * Returns all student names or IDs assigned to the specified therapist key
 * from persistent local storage.
 */
export function getTherapistAssignedStudents(therapistKey: string): string[] {
  if (!therapistKey) return [];
  const store =
    storage.getJSONSync<Record<string, string[]>>(THERAPIST_ASSIGNMENTS_STORAGE_KEY, {}) || {};
  const normKey = therapistKey.trim().toLowerCase();
  const result = new Set<string>();

  for (const [k, v] of Object.entries(store)) {
    if (k.trim().toLowerCase() === normKey && Array.isArray(v)) {
      v.forEach((item) => item && result.add(String(item)));
    }
  }
  return Array.from(result);
}

/**
 * Records an assignment between a therapist and a student from the Enrollment Wizard.
 * Updates both the therapist's name and therapist ID keys.
 */
export function assignStudentToTherapist(
  therapistName: string,
  studentIdentifier: string,
  therapistId?: string,
): void {
  if (!therapistName || !studentIdentifier) return;
  const store =
    storage.getJSONSync<Record<string, string[]>>(THERAPIST_ASSIGNMENTS_STORAGE_KEY, {}) || {};
  const key = therapistName.trim();
  const current = Array.isArray(store[key]) ? [...store[key]] : [];
  if (!current.includes(studentIdentifier.trim())) {
    current.push(studentIdentifier.trim());
  }
  store[key] = current;

  if (therapistId && therapistId.trim() && therapistId.trim() !== key) {
    const idKey = therapistId.trim();
    const idCurrent = Array.isArray(store[idKey]) ? [...store[idKey]] : [];
    if (!idCurrent.includes(studentIdentifier.trim())) {
      idCurrent.push(studentIdentifier.trim());
    }
    store[idKey] = idCurrent;
  }

  storage.setJSONSync(THERAPIST_ASSIGNMENTS_STORAGE_KEY, store);

  if (typeof window !== 'undefined') {
    window.dispatchEvent?.(new CustomEvent('melue_therapist_assignment_updated'));
  }
}

/**
 * Robustly checks if a student is assigned to a specific therapist based on:
 * 1. Explicit therapist/assignedTherapist fields on student
 * 2. Persistent therapist enrollment assignments (THERAPIST_ASSIGNMENTS_STORAGE_KEY)
 * 3. Enrolled students cache (melue_enrolled_students_cache)
 * 4. Staff record assignedStudents array
 * 5. Director schedule assignment store
 */
export function isStudentAssignedToTherapist(
  student: StudentRef | null | undefined,
  therapist: TherapistRef | string | null | undefined,
): boolean {
  if (!student || !therapist) return false;

  // 1. Collect all therapist identifier tokens
  const therapistTokens = new Set<string>();
  if (typeof therapist === 'string') {
    if (therapist.trim()) therapistTokens.add(therapist.trim().toLowerCase());
  } else {
    if (therapist.name) therapistTokens.add(therapist.name.trim().toLowerCase());
    if (therapist.userName) therapistTokens.add(therapist.userName.trim().toLowerCase());
    if (therapist.id != null) therapistTokens.add(String(therapist.id).trim().toLowerCase());
    if (therapist.email) therapistTokens.add(therapist.email.trim().toLowerCase());
  }

  if (therapistTokens.size === 0) return false;

  // 2. Collect all student identifier tokens
  const studentTokens = new Set<string>();
  if (student.name) studentTokens.add(student.name.trim().toLowerCase());
  if (student.fullName) studentTokens.add(student.fullName.trim().toLowerCase());
  if (student.id != null) studentTokens.add(String(student.id).trim().toLowerCase());
  if (student.studentId != null) studentTokens.add(String(student.studentId).trim().toLowerCase());
  if (student.student_id != null) studentTokens.add(String(student.student_id).trim().toLowerCase());

  if (studentTokens.size === 0) return false;

  // 3. Direct therapist property check on student object (if explicitly set and not generic placeholder)
  const rawTherapist = String(
    student.therapist || student.assignedTherapist || student.teacher || student.teacherName || '',
  ).trim();
  const lowerRawTherapist = rawTherapist.toLowerCase();
  const isGeneric =
    !rawTherapist ||
    lowerRawTherapist === 'lead teacher' ||
    lowerRawTherapist === 'unassigned' ||
    lowerRawTherapist === 'teacher';

  if (!isGeneric && therapistTokens.has(lowerRawTherapist)) {
    return true;
  }

  // 4. Check THERAPIST_ASSIGNMENTS_STORAGE_KEY
  const store =
    storage.getJSONSync<Record<string, string[]>>(THERAPIST_ASSIGNMENTS_STORAGE_KEY, {}) || {};
  for (const [key, list] of Object.entries(store)) {
    const normKey = key.trim().toLowerCase();
    if (therapistTokens.has(normKey) && Array.isArray(list)) {
      for (const item of list) {
        if (item && studentTokens.has(String(item).trim().toLowerCase())) {
          return true;
        }
      }
    }
  }

  // 5. Check ENROLLED_STUDENTS_CACHE_KEY
  const enrolledCache =
    storage.getJSONSync<Record<string, unknown>[]>(ENROLLED_STUDENTS_CACHE_KEY, []) || [];
  for (const item of enrolledCache) {
    const itemTokens = new Set<string>();
    if (item.name) itemTokens.add(String(item.name).trim().toLowerCase());
    if (item.fullName) itemTokens.add(String(item.fullName).trim().toLowerCase());
    if (item.id != null) itemTokens.add(String(item.id).trim().toLowerCase());
    if (item.studentId != null) itemTokens.add(String(item.studentId).trim().toLowerCase());

    const hasMatch = Array.from(studentTokens).some((t) => itemTokens.has(t));
    if (hasMatch) {
      const itemTherapist = String(
        item.therapist || item.assignedTherapist || item.teacher || item.teacherName || '',
      ).trim().toLowerCase();
      if (itemTherapist && therapistTokens.has(itemTherapist)) {
        return true;
      }
    }
  }

  // 6. Check staff assignedStudents array if provided on therapist
  if (typeof therapist !== 'string' && Array.isArray(therapist.assignedStudents)) {
    for (const a of therapist.assignedStudents) {
      if (a != null && studentTokens.has(String(a).trim().toLowerCase())) {
        return true;
      }
    }
  }

  // 7. Check director assignments store
  if (typeof therapist !== 'string' && therapist.id != null) {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(DIRECTOR_ASSIGNMENTS_KEY);
        if (raw) {
          const dirStore = JSON.parse(raw);
          const rec = dirStore[String(therapist.id)];
          if (rec && Array.isArray(rec.studentIds)) {
            for (const sid of rec.studentIds) {
              if (sid != null && studentTokens.has(String(sid).trim().toLowerCase())) {
                return true;
              }
            }
          }
        }
      }
    } catch {}
  }

  return false;
}
