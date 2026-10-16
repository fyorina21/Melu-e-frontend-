// src/utils/deletedStaffHelper.ts
//
// Centralized deleted staff registry and filter helpers.
// Ensures that when a staff account is deleted from StaffAccountManagement,
// it is immediately and permanently removed from EVERY screen across the entire app
// (schedules, assignment modals, workload, metrics, appointment calendars, attendance,
// dropdown options, and teacher/therapist rosters).

export const DELETED_STAFF_KEY = 'melue_deleted_staff_accounts';
export const DELETED_STAFF_RECORDS_KEY = 'melue_deleted_staff_records';

export interface DeletedStaffRecord {
  id: string;
  name: string;
  email: string;
  roles?: string[];
  deletedAt: string;
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage;
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {}
  return null;
}

function dispatchStaffEvent(name: string, detail?: any) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    } else if (typeof globalThis !== 'undefined' && typeof (globalThis as any).dispatchEvent === 'function') {
      (globalThis as any).dispatchEvent(new CustomEvent(name, { detail }));
    }
  } catch {}
}

export function getDeletedStaffKeys(): Set<string> {
  try {
    const storage = getStorage();
    if (storage) {
      const raw = storage.getItem(DELETED_STAFF_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          return new Set(
            arr
              .map((k: string) => String(k || '').trim().toLowerCase())
              .filter(Boolean)
          );
        }
      }
    }
  } catch {}
  return new Set();
}

export function getDeletedStaffRecords(): DeletedStaffRecord[] {
  try {
    const storage = getStorage();
    if (storage) {
      const raw = storage.getItem(DELETED_STAFF_RECORDS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    }
  } catch {}
  return [];
}

export function recordDeletedStaff(staff: {
  id?: string;
  name?: string;
  email?: string;
  roles?: string[];
}) {
  try {
    const storage = getStorage();
    if (storage) {
      const currentKeys = getDeletedStaffKeys();
      const keysToAdd: string[] = [];

      if (staff.id) keysToAdd.push(String(staff.id).trim().toLowerCase());
      if (staff.email) keysToAdd.push(String(staff.email).trim().toLowerCase());
      if (staff.name) {
        const normName = String(staff.name).trim().toLowerCase();
        keysToAdd.push(normName);
        // Also strip titles (e.g. "Dr. Emily Watson" -> "Emily Watson")
        const withoutTitle = normName.replace(/^(dr\.|mr\.|mrs\.|ms\.)\s+/i, '').trim();
        if (withoutTitle && withoutTitle !== normName) {
          keysToAdd.push(withoutTitle);
        }
      }

      keysToAdd.forEach((k) => {
        if (k) currentKeys.add(k);
      });
      storage.setItem(DELETED_STAFF_KEY, JSON.stringify(Array.from(currentKeys)));

      // Save record list for audit / sync
      const records = getDeletedStaffRecords();
      const newRecord: DeletedStaffRecord = {
        id: String(staff.id || ''),
        name: String(staff.name || ''),
        email: String(staff.email || ''),
        roles: staff.roles || [],
        deletedAt: new Date().toISOString(),
      };
      const filteredRecords = records.filter(
        (r) =>
          (!staff.id || r.id !== staff.id) &&
          (!staff.email || r.email.toLowerCase() !== staff.email.toLowerCase())
      );
      filteredRecords.push(newRecord);
      storage.setItem(DELETED_STAFF_RECORDS_KEY, JSON.stringify(filteredRecords));

      // Clear any session teacher selection referencing this deleted staff
      const selectedTeacherId = storage.getItem('melue_session_selected_teacher_id');
      if (
        selectedTeacherId &&
        (selectedTeacherId.toLowerCase() === String(staff.id).toLowerCase() ||
          currentKeys.has(selectedTeacherId.toLowerCase()))
      ) {
        storage.removeItem('melue_session_selected_teacher_id');
      }

      // Notify entire app of deletion
      dispatchStaffEvent('melue_staff_deleted', { staff: newRecord });
      dispatchStaffEvent('melue_staff_accounts_changed');
    }
  } catch {}
}

export function removeDeletedStaffKey(key: string) {
  try {
    const storage = getStorage();
    if (storage) {
      const current = getDeletedStaffKeys();
      current.delete(String(key).trim().toLowerCase());
      storage.setItem(DELETED_STAFF_KEY, JSON.stringify(Array.from(current)));

      const records = getDeletedStaffRecords().filter(
        (r) =>
          r.id.toLowerCase() !== key.toLowerCase() &&
          r.email.toLowerCase() !== key.toLowerCase() &&
          r.name.toLowerCase() !== key.toLowerCase()
      );
      storage.setItem(DELETED_STAFF_RECORDS_KEY, JSON.stringify(records));

      dispatchStaffEvent('melue_staff_accounts_changed');
    }
  } catch {}
}

/**
 * Checks whether the given string identifier or object matches a deleted staff account.
 */
export function isStaffDeleted(item: any): boolean {
  if (!item) return false;
  const deletedKeys = getDeletedStaffKeys();
  if (deletedKeys.size === 0) return false;

  if (typeof item === 'string') {
    const norm = item.trim().toLowerCase();
    if (deletedKeys.has(norm)) return true;
    const withoutTitle = norm.replace(/^(dr\.|mr\.|mrs\.|ms\.)\s+/i, '').trim();
    if (withoutTitle && deletedKeys.has(withoutTitle)) return true;
    return false;
  }

  // 1. If item is specifically a schedule block, appointment, or workload/metrics row
  // where `id` represents the appointment or block ID, check teacher/therapist/staff fields first:
  if (item.teacherId || item.therapistId || item.staffId) {
    if (item.teacherId && deletedKeys.has(String(item.teacherId).trim().toLowerCase())) return true;
    if (item.therapistId && deletedKeys.has(String(item.therapistId).trim().toLowerCase())) return true;
    if (item.staffId && deletedKeys.has(String(item.staffId).trim().toLowerCase())) return true;
    if (item.teacherName && isStaffDeleted(item.teacherName)) return true;
    if (item.therapistName && isStaffDeleted(item.therapistName)) return true;
    if (item.staffName && isStaffDeleted(item.staffName)) return true;
    return false;
  }

  // 2. Schedule block or metrics row identified by teacherName/therapistName only
  if (item.teacherName && isStaffDeleted(item.teacherName)) return true;
  if (item.therapistName && isStaffDeleted(item.therapistName)) return true;

  // 3. Dropdown option, trend point, or key-value object
  if (item.label && isStaffDeleted(item.label)) return true;
  if (item.value && deletedKeys.has(String(item.value).trim().toLowerCase())) return true;

  // 4. Otherwise, check staff account, staff option, user object, or person
  if (item.id && deletedKeys.has(String(item.id).trim().toLowerCase())) return true;
  if (item.userId && deletedKeys.has(String(item.userId).trim().toLowerCase())) return true;
  if (item.personId && deletedKeys.has(String(item.personId).trim().toLowerCase())) return true;
  if (item.email && deletedKeys.has(String(item.email).trim().toLowerCase())) return true;
  if (item.userEmail && deletedKeys.has(String(item.userEmail).trim().toLowerCase())) return true;
  if (item.name && isStaffDeleted(item.name)) return true;
  if (item.fullName && isStaffDeleted(item.fullName)) return true;

  return false;
}

/**
 * Filters out deleted staff accounts or records from an array.
 */
export function filterOutDeletedStaff<T>(items: T[]): T[] {
  if (!Array.isArray(items)) return items;
  return items.filter((item) => !isStaffDeleted(item));
}

/**
 * Automatically filters deleted staff from API response payloads.
 */
export function filterStaffResponse(url: string, data: any): any {
  if (!data) return data;
  const normUrl = (url || '').toLowerCase();

  // 1. Array responses (e.g. /sysadmin/staff, /options/staff, /admin/staff_members, /coordinator/teachers/metrics, /coordinator/teachers/workload)
  if (Array.isArray(data)) {
    if (
      normUrl.includes('/sysadmin/staff') ||
      normUrl.includes('/options/staff') ||
      normUrl.includes('/admin/staff_members') ||
      normUrl.includes('/teachers/metrics') ||
      normUrl.includes('/teachers/workload') ||
      normUrl.includes('/workload/trend') ||
      normUrl.includes('/director/schedule') ||
      normUrl.includes('/staff-calendar') ||
      normUrl.includes('/appointments')
    ) {
      return filterOutDeletedStaff(data);
    }
    return data;
  }

  // 2. Object with nested array under `data` or `staff` or `teachers` or `blocks`
  if (typeof data === 'object') {
    if (Array.isArray(data.data)) {
      if (
        normUrl.includes('/sysadmin/staff') ||
        normUrl.includes('/options/staff') ||
        normUrl.includes('/admin/staff_members') ||
        normUrl.includes('/teachers/metrics') ||
        normUrl.includes('/teachers/workload') ||
        normUrl.includes('/director/schedule') ||
        normUrl.includes('/staff-calendar') ||
        normUrl.includes('/appointments')
      ) {
        return { ...data, data: filterOutDeletedStaff(data.data) };
      }
    }

    if (Array.isArray(data.staff)) {
      return { ...data, staff: filterOutDeletedStaff(data.staff) };
    }

    if (Array.isArray(data.blocks)) {
      return { ...data, blocks: filterOutDeletedStaff(data.blocks) };
    }

    // 3. Week schedule map (e.g. /coordinator/schedule or /staff-calendar: { 0: [...], 1: [...], ... })
    if (normUrl.includes('/coordinator/schedule') || normUrl.includes('/staff-calendar')) {
      const filteredSchedule: Record<string, any> = {};
      Object.keys(data).forEach((key) => {
        if (Array.isArray(data[key])) {
          filteredSchedule[key] = filterOutDeletedStaff(data[key]);
        } else {
          filteredSchedule[key] = data[key];
        }
      });
      return filteredSchedule;
    }

    // 4. Attendance response: { student: [...], therapist: [...], support_staff: [...] }
    if (normUrl.includes('/attendance')) {
      return {
        ...data,
        therapist: Array.isArray(data.therapist) ? filterOutDeletedStaff(data.therapist) : data.therapist,
        support_staff: Array.isArray(data.support_staff)
          ? filterOutDeletedStaff(data.support_staff)
          : data.support_staff,
      };
    }
  }

  return data;
}

/**
 * Helper to subscribe a component to deleted staff updates.
 */
export function onDeletedStaffChanged(listener: () => void): () => void {
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('melue_staff_accounts_changed', listener);
    window.addEventListener('storage', listener);
    return () => {
      window.removeEventListener('melue_staff_accounts_changed', listener);
      window.removeEventListener('storage', listener);
    };
  } else if (typeof globalThis !== 'undefined' && typeof (globalThis as any).addEventListener === 'function') {
    (globalThis as any).addEventListener('melue_staff_accounts_changed', listener);
    return () => {
      (globalThis as any).removeEventListener('melue_staff_accounts_changed', listener);
    };
  }
  return () => {};
}
