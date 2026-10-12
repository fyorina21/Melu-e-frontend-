// src/stores/goalMasteryStore.ts
//
// Single source of truth for Goal Mastery Checks and Director Approvals.
// Created and submitted on Goal Mastery Check (/GoalMasteryCheck),
// reviewed, approved, or rejected on Goal Mastery Approval (/GoalMasteryApproval).

export interface TeacherVerificationData {
  name: string;
  date?: string;
  outcome?: string | null;
  promptUsed?: string | null;
  notes?: string;
}

export interface PrimaryTeacherSubmissionData {
  name: string;
  criteriaMet?: string;
  dateAchieved?: string;
  totalTrials?: number | string;
  independenceRate?: string;
  summary?: string;
  notes?: string;
}

export interface GoalMasteryCheckItem {
  id: string; // unique checkId
  studentId: string;
  studentName: string;
  goalId: string;
  goalName: string;
  station: string;
  dateSubmitted: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvalNotes?: string;
  primaryTeacher: PrimaryTeacherSubmissionData;
  teacherB: TeacherVerificationData;
  teacherC: TeacherVerificationData;
  createdAt: string;
  updatedAt: string;
}

export const GOAL_MASTERY_CHECKS_KEY = 'melue_goal_mastery_checks';

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage;
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {}
  return null;
}

function dispatchMasteryEvent(name: string, detail?: any) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    } else if (typeof globalThis !== 'undefined' && typeof (globalThis as any).dispatchEvent === 'function') {
      (globalThis as any).dispatchEvent(new CustomEvent(name, { detail }));
    }
  } catch {}
}

export function getStoredMasteryChecks(): GoalMasteryCheckItem[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(GOAL_MASTERY_CHECKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMasteryCheck(item: GoalMasteryCheckItem): GoalMasteryCheckItem {
  const storage = getStorage();
  const current = getStoredMasteryChecks();
  const index = current.findIndex(
    (c) => c.id === item.id || (c.studentId === item.studentId && c.goalId === item.goalId)
  );

  const updatedItem: GoalMasteryCheckItem = {
    ...item,
    updatedAt: new Date().toISOString(),
  };

  let updatedList: GoalMasteryCheckItem[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = { ...current[index], ...updatedItem };
  } else {
    updatedList = [updatedItem, ...current];
  }

  if (storage) {
    storage.setItem(GOAL_MASTERY_CHECKS_KEY, JSON.stringify(updatedList));
  }

  dispatchMasteryEvent('melue_mastery_checks_changed', { check: updatedItem });
  return updatedItem;
}

export function getMasteryCheckById(id: string): GoalMasteryCheckItem | null {
  if (!id) return null;
  const list = getStoredMasteryChecks();
  return list.find((c) => c.id === id) || null;
}

export function getMasteryCheckByStudentAndGoal(studentId: string, goalId: string): GoalMasteryCheckItem | null {
  if (!studentId || !goalId) return null;
  const list = getStoredMasteryChecks();
  return list.find((c) => c.studentId === studentId && c.goalId === goalId) || null;
}

export function getPendingMasteryChecks(search?: string): GoalMasteryCheckItem[] {
  const list = getStoredMasteryChecks().filter((c) => c.status === 'pending');
  const term = String(search || '').toLowerCase().trim();
  if (!term) return list;

  return list.filter(
    (c) =>
      c.studentName.toLowerCase().includes(term) ||
      c.goalName.toLowerCase().includes(term) ||
      c.primaryTeacher.name.toLowerCase().includes(term) ||
      c.id.toLowerCase().includes(term)
  );
}

export function approveMasteryCheck(id: string, notes?: string): GoalMasteryCheckItem | null {
  const storage = getStorage();
  const current = getStoredMasteryChecks();
  const index = current.findIndex((c) => c.id === id);
  if (index < 0) return null;

  const item = current[index];
  const updatedItem: GoalMasteryCheckItem = {
    ...item,
    status: 'approved',
    approvalNotes: notes ?? item.approvalNotes,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updatedItem;
  if (storage) {
    storage.setItem(GOAL_MASTERY_CHECKS_KEY, JSON.stringify(current));
  }

  dispatchMasteryEvent('melue_mastery_checks_changed', { check: updatedItem, action: 'approved' });
  return updatedItem;
}

export function rejectMasteryCheck(id: string, reason: string, notes?: string): GoalMasteryCheckItem | null {
  const storage = getStorage();
  const current = getStoredMasteryChecks();
  const index = current.findIndex((c) => c.id === id);
  if (index < 0) return null;

  const item = current[index];
  const updatedItem: GoalMasteryCheckItem = {
    ...item,
    status: 'rejected',
    rejectionReason: reason,
    approvalNotes: notes ?? item.approvalNotes,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updatedItem;
  if (storage) {
    storage.setItem(GOAL_MASTERY_CHECKS_KEY, JSON.stringify(current));
  }

  dispatchMasteryEvent('melue_mastery_checks_changed', { check: updatedItem, action: 'rejected' });
  return updatedItem;
}

export function onMasteryChecksChanged(listener: () => void): () => void {
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('melue_mastery_checks_changed', listener);
    window.addEventListener('storage', listener);
    return () => {
      window.removeEventListener('melue_mastery_checks_changed', listener);
      window.removeEventListener('storage', listener);
    };
  } else if (typeof globalThis !== 'undefined' && typeof (globalThis as any).addEventListener === 'function') {
    (globalThis as any).addEventListener('melue_mastery_checks_changed', listener);
    return () => {
      (globalThis as any).removeEventListener('melue_mastery_checks_changed', listener);
    };
  }
  return () => {};
}
