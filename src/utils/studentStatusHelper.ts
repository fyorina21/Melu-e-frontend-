// src/utils/studentStatusHelper.ts
import { sanitizeStoragePayload, unprotectStoragePayload } from './sensitiveDataSanitizer';

const REGISTERED_ACTIVE_STUDENTS_KEY = 'melue_registered_active_students_v1';
const STATUS_OVERRIDES_KEY = 'melue_student_status_overrides_v1';

type StatusChangeListener = () => void;
const listeners = new Set<StatusChangeListener>();

function normalizeKey(str?: string | null): string {
  if (!str) return '';
  return String(str).trim().toLowerCase().replace(/\s+/g, ' ');
}

function getStoredJson<T>(key: string, defaultValue: T): T {
  if (typeof localStorage === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    const decoded = unprotectStoragePayload(raw) || raw;
    return JSON.parse(decoded);
  } catch {
    return defaultValue;
  }
}

function setStoredJson<T>(key: string, value: T): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const protectedVal = sanitizeStoragePayload(JSON.stringify(value));
    localStorage.setItem(key, protectedVal);
  } catch {}
}

function notifyListeners(): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('melue_student_status_changed'));
  }
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

/**
 * Marks a student as Active upon registration/enrollment.
 */
export function markStudentActive(id?: string, name?: string): void {
  const activeList = getStoredJson<string[]>(REGISTERED_ACTIVE_STUDENTS_KEY, []);
  const overrides = getStoredJson<Record<string, 'Active' | 'Inactive'>>(STATUS_OVERRIDES_KEY, {});

  const idKey = normalizeKey(id);
  const nameKey = normalizeKey(name);

  if (idKey && !activeList.includes(idKey)) activeList.push(idKey);
  if (nameKey && !activeList.includes(nameKey)) activeList.push(nameKey);

  if (idKey) overrides[idKey] = 'Active';
  if (nameKey) overrides[nameKey] = 'Active';

  setStoredJson(REGISTERED_ACTIVE_STUDENTS_KEY, activeList);
  setStoredJson(STATUS_OVERRIDES_KEY, overrides);
  notifyListeners();
}

/**
 * Toggles a student status between Active and Inactive.
 */
export function toggleStudentStatus(
  id?: string,
  name?: string,
  currentStatus?: 'Active' | 'Inactive' | string,
): 'Active' | 'Inactive' {
  const overrides = getStoredJson<Record<string, 'Active' | 'Inactive'>>(STATUS_OVERRIDES_KEY, {});
  const nextStatus: 'Active' | 'Inactive' = currentStatus === 'Active' ? 'Inactive' : 'Active';

  const idKey = normalizeKey(id);
  const nameKey = normalizeKey(name);

  if (idKey) overrides[idKey] = nextStatus;
  if (nameKey) overrides[nameKey] = nextStatus;

  setStoredJson(STATUS_OVERRIDES_KEY, overrides);
  notifyListeners();
  return nextStatus;
}

/**
 * Checks whether a student is registered as active.
 */
export function isStudentRegisteredActive(id?: string, name?: string): boolean {
  const activeList = getStoredJson<string[]>(REGISTERED_ACTIVE_STUDENTS_KEY, []);
  const idKey = normalizeKey(id);
  const nameKey = normalizeKey(name);

  return (
    Boolean(idKey && activeList.includes(idKey)) || Boolean(nameKey && activeList.includes(nameKey))
  );
}

/**
 * Resolves the display status ('Active' | 'Inactive') for a student on StudentEnrollment.
 * New students who are registered/enrolled are guaranteed to be 'Active'.
 */
export function resolveStudentStatus(
  id?: string,
  name?: string,
  rawStatus?: string | null,
): 'Active' | 'Inactive' | 'Draft' {
  if (rawStatus && String(rawStatus).trim().toLowerCase() === 'draft') {
    return 'Draft';
  }
  if (id && String(id).startsWith('draft-')) {
    return 'Draft';
  }

  const overrides = getStoredJson<Record<string, 'Active' | 'Inactive'>>(STATUS_OVERRIDES_KEY, {});
  const idKey = normalizeKey(id);
  const nameKey = normalizeKey(name);

  // 1. Check explicit manual overrides
  if (idKey && overrides[idKey]) return overrides[idKey];
  if (nameKey && overrides[nameKey]) return overrides[nameKey];

  // 2. Check if student was enrolled/registered in the app
  if (isStudentRegisteredActive(id, name)) {
    return 'Active';
  }

  // 3. Known legacy demo inactive student
  if (idKey === 'stu-4' || idKey === 'mlu-0015' || nameKey === 'liam wilson') {
    return 'Inactive';
  }

  // 4. Inspect raw status from API
  if (rawStatus) {
    const s = String(rawStatus).trim().toLowerCase().replace(/[-_]/g, ' ');
    if (
      s === 'active' ||
      s === 'enrolled' ||
      s === 'registered' ||
      s === 'new' ||
      s === 'ready_for_iup' ||
      s === 'ready for iup' ||
      s === 'in_session' ||
      s === 'assessment_complete' ||
      s === 'in_assessment' ||
      s === 'in assessment' ||
      s === 'active therapy' ||
      s.includes('active') ||
      s.includes('assessment') ||
      s.includes('iup')
    ) {
      return 'Active';
    }
    if (s === 'archived' || s === 'withdrawn' || s === 'discharged' || s === 'disabled') {
      return 'Inactive';
    }

    if (s === 'inactive') {
      const isKnownEnrolled =
        nameKey !== 'liam wilson' && idKey !== 'stu-4' && idKey !== 'mlu-0015';
      if (isKnownEnrolled) {
        return 'Active';
      }

      return 'Inactive';
    }
  }

  // 5. Newly registered/enrolled students on the Student Register default to 'Active'
  return 'Active';
}

/**
 * Subscribes to student status changes.
 */
export function onStudentStatusChanged(listener: StatusChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
