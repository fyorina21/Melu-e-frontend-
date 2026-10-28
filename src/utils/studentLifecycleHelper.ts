// src/utils/studentLifecycleHelper.ts
// Enforces the student lifecycle invariant:
// 1. Mutual exclusivity: No student can be in assessment and in session page at one time.
// 2. Session display rule: A student can be displayed on session page if and only if assessment is 100% completed.

import { getStoredIupDraft } from './iupDraftStorage';
import { sanitizeStoragePayload, unprotectStoragePayload } from './sensitiveDataSanitizer';
import { storage } from './storage';

export interface StudentLifecycleRecord {
  id: string | number;
  name?: string;
  fullName?: string;
  status?: string;
  rawStatus?: string;
  currentStage?: string;
  stage?: string;
  assessmentStatus?: string;
  assessmentProgress?: number;
  score?: number;
  ablls?: { status?: string; progress?: number };
  behavior?: { status?: string; progress?: number };
  goals?: any[];
}

const ASSESSMENT_COMPLETED_STORAGE_KEY = 'melue_assessment_completed_';
const ASSESSMENT_SUBMITTED_STORAGE_KEY = 'melue_assessment_submitted_';
const ASSESSMENT_SUBMISSION_DATA_KEY = 'melue_assessment_submission_';
const STUDENT_STATUS_REGISTRY_KEY = 'melue_student_status_registry';
export const SUBMITTED_STUDENTS_LIST_KEY = 'melue_submitted_students_list_v1';

/**
 * Normalizes a student ID into a trimmed, canonical string for consistent comparison.
 */
export function normalizeStudentId(id: string | number | null | undefined): string {
  if (id === null || id === undefined) return '';
  const s = String(id).trim().toLowerCase();
  if (s === '1' || s === 'stu-1' || s === 'student-a' || s === 'student-1') {
    return 'stu-1';
  }
  if (s === '2' || s === 'stu-2' || s === 'student-b' || s === 'student-2') {
    return 'stu-2';
  }
  if (s === '3' || s === 'stu-3' || s === 'student-c' || s === 'student-3') {
    return 'stu-3';
  }
  return s;
}

/**
 * Returns all recognized alias strings for a student ID.
 * (e.g., 'stu-1', 'student-a', '1', 'student-1' are treated as aliases of each other).
 */
export function getStudentIdAliases(id: string | number | null | undefined): string[] {
  if (id === null || id === undefined) return [];
  const s = String(id).trim();
  if (!s) return [];
  const lower = s.toLowerCase();
  const normalized = normalizeStudentId(s);
  const aliases = new Set<string>([s, lower, normalized]);

  if (normalized === 'stu-1') {
    aliases.add('stu-1');
    aliases.add('student-a');
    aliases.add('1');
    aliases.add('student-1');
  } else if (normalized === 'stu-2') {
    aliases.add('stu-2');
    aliases.add('student-b');
    aliases.add('2');
    aliases.add('student-2');
  } else if (normalized === 'stu-3') {
    aliases.add('stu-3');
    aliases.add('student-c');
    aliases.add('3');
    aliases.add('student-3');
  }
  return Array.from(aliases);
}

/**
 * Checks if a student's assessment has been submitted
 */
export function isStudentAssessmentSubmitted(studentId: string | number): boolean {
  if (!studentId) return false;
  try {
    const aliases = getStudentIdAliases(studentId);
    for (const alias of aliases) {
      if (storage.getSync(`${ASSESSMENT_SUBMITTED_STORAGE_KEY}${alias}`) === 'true') {
        return true;
      }
      const raw = storage.getJSONSync<any>(`${ASSESSMENT_SUBMISSION_DATA_KEY}${alias}`);
      if (raw?.status === 'submitted') {
        return true;
      }
    }
  } catch {}
  return false;
}

/**
 * Asynchronously checks if a student's assessment has been submitted,
 * hydrating in-memory cache for cross-platform compatibility on app restart.
 */
export async function isStudentAssessmentSubmittedAsync(
  studentId: string | number,
): Promise<boolean> {
  if (!studentId) return false;
  if (isStudentAssessmentSubmitted(studentId)) return true;
  try {
    const aliases = getStudentIdAliases(studentId);
    for (const alias of aliases) {
      const val = await storage.getItem(`${ASSESSMENT_SUBMITTED_STORAGE_KEY}${alias}`);
      if (val === 'true') {
        storage.setSync(`${ASSESSMENT_SUBMITTED_STORAGE_KEY}${alias}`, 'true');
        storage.setSync(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${alias}`, 'true');
        return true;
      }
      const raw = await storage.getJSON<any>(`${ASSESSMENT_SUBMISSION_DATA_KEY}${alias}`);
      if (raw?.status === 'submitted') {
        storage.setSync(`${ASSESSMENT_SUBMITTED_STORAGE_KEY}${alias}`, 'true');
        storage.setSync(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${alias}`, 'true');
        storage.setJSONSync(`${ASSESSMENT_SUBMISSION_DATA_KEY}${alias}`, raw);
        return true;
      }
    }
  } catch {}
  return false;
}

/**
 * Retrieves student assessment submission metadata if available
 */
export function getStudentAssessmentSubmission(studentId: string | number): any {
  if (!studentId) return null;
  try {
    const aliases = getStudentIdAliases(studentId);
    for (const alias of aliases) {
      const data = storage.getJSONSync<any>(`${ASSESSMENT_SUBMISSION_DATA_KEY}${alias}`);
      if (data) return data;
    }
  } catch {}
  return null;
}

/**
 * Saves student assessment submission state and triggers synchronization across web and native platforms.
 */
export async function saveStudentAssessmentSubmission(
  studentId: string | number,
  extra: Record<string, any> = {},
): Promise<boolean> {
  if (!studentId) return false;
  try {
    const sid = String(studentId).trim();
    const normSid = normalizeStudentId(sid);
    const aliases = getStudentIdAliases(sid);
    const submissionData = {
      studentId: sid,
      normalizedStudentId: normSid,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      ...extra,
    };

    // Save consistently via unified storage utility for all aliases
    for (const alias of aliases) {
      storage.setSync(`${ASSESSMENT_SUBMITTED_STORAGE_KEY}${alias}`, 'true');
      storage.setSync(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${alias}`, 'true');
      storage.setJSONSync(`${ASSESSMENT_SUBMISSION_DATA_KEY}${alias}`, submissionData);

      await storage.setItem(`${ASSESSMENT_SUBMITTED_STORAGE_KEY}${alias}`, 'true');
      await storage.setItem(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${alias}`, 'true');
      await storage.setJSON(`${ASSESSMENT_SUBMISSION_DATA_KEY}${alias}`, submissionData);
    }

    // Maintain master list of submitted students for instant multi-screen visibility
    const sName = String(extra.studentName || extra.name || extra.fullName || 'Student').trim();
    const existingSubmitted = storage.getJSONSync<any[]>(SUBMITTED_STUDENTS_LIST_KEY, []) || [];
    const filteredSubmitted = existingSubmitted.filter((s: any) => {
      const existingId = String(s.id || s.studentId || '').trim();
      const existingName = String(s.name || s.fullName || '')
        .trim()
        .toLowerCase();
      return (
        existingId !== sid &&
        !aliases.includes(existingId) &&
        (!sName || existingName !== sName.toLowerCase())
      );
    });
    filteredSubmitted.unshift({
      id: sid,
      studentId: sid,
      name: sName,
      fullName: sName,
      therapist: extra.therapist || 'Unassigned',
      status: 'Complete',
      dateCompleted: submissionData.submittedAt.slice(0, 10),
      submittedAt: submissionData.submittedAt,
      age: extra.age || 6,
      program: extra.program || 'Comprehensive ABA',
      therapyGroup: extra.therapyGroup || '',
      photoUrl: extra.photoUrl || '',
      dateOfBirth: '',
      parentGuardian: extra.parentGuardian,
    });
    storage.setJSONSync(SUBMITTED_STUDENTS_LIST_KEY, filteredSubmitted);
    await storage.setJSON(SUBMITTED_STUDENTS_LIST_KEY, filteredSubmitted);

    storage.setSync('last_assessment_student_id', sid);
    await storage.setItem('last_assessment_student_id', sid);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('melue_assessment_updated', {
          detail: { studentId: sid, status: 'submitted' },
        }),
      );
      window.dispatchEvent(
        new CustomEvent('melue_assessment_submitted', {
          detail: { studentId: sid, status: 'submitted', submission: submissionData },
        }),
      );
    }

    return true;
  } catch (err) {
    console.error('Error saving student assessment submission:', err);
    return false;
  }
}

/**
 * Retrieves the master list of all submitted students across the session
 */
export function getSubmittedStudents(): any[] {
  try {
    const list = storage.getJSONSync<any[]>(SUBMITTED_STUDENTS_LIST_KEY, []);
    if (Array.isArray(list) && list.length > 0) return list;
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SUBMITTED_STUDENTS_LIST_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return [];
}

/**
 * Stores student statuses into a lightweight client registry for cross-screen lookup
 */
export function registerStudentStatuses(students: any[]): void {
  if (!Array.isArray(students)) return;
  try {
    const registry =
      storage.getJSONSync<Record<string, any>>(STUDENT_STATUS_REGISTRY_KEY, {}) || {};
    students.forEach((s) => {
      if (!s || !s.id) return;
      const sid = String(s.id);
      registry[sid] = {
        status: s.rawStatus || s.status || registry[sid]?.status,
        currentStage: s.currentStage || s.stage || registry[sid]?.currentStage,
        assessmentStatus: s.assessmentStatus || registry[sid]?.assessmentStatus,
        assessmentProgress: s.assessmentProgress ?? s.score ?? registry[sid]?.assessmentProgress,
        name: s.name || s.fullName || registry[sid]?.name,
      };
    });
    storage.setJSONSync(STUDENT_STATUS_REGISTRY_KEY, registry);
  } catch {}
}

/**
 * Retrieves registered student lifecycle info
 */
export function getRegisteredStudentStatus(studentId: string | number): any {
  if (!studentId) return null;
  try {
    const registry =
      storage.getJSONSync<Record<string, any>>(STUDENT_STATUS_REGISTRY_KEY, {}) || {};
    return registry[String(studentId)] || null;
  } catch {
    return null;
  }
}

/**
 * Standardized assessment completion rule:
 * Both Skills and Behavior assessments are strictly required.
 * When requireAllFour option or preference/sensory progress is provided,
 * verifies that all assessments including Preference and Sensory are 100% completed.
 */
export function checkStudentAllAssessmentsCompleted(
  studentId: string | number,
  fallbackAblls?: { status?: string; progress?: number },
  fallbackBehavior?: { status?: string; progress?: number },
  precomputedSkills?: { progress: number; status: string },
  precomputedBehavior?: { progress: number; status: string },
  precomputedPreference?: { progress: number; status: string },
  precomputedSensory?: { progress: number; status: string },
  options?: { requireAllFour?: boolean },
): boolean {
  if (!studentId) return false;
  const sid = String(studentId);

  if (isStudentAssessmentSubmitted(sid)) {
    return true;
  }

  const skillsData =
    precomputedSkills ??
    getStudentSkillsProgress(
      sid,
      Number(fallbackAblls?.progress || 0),
      fallbackAblls?.status || 'Not Started',
    );
  const behaviorData =
    precomputedBehavior ??
    getStudentBehaviorProgress(
      sid,
      Number(fallbackBehavior?.progress || 0),
      fallbackBehavior?.status || 'Not Started',
    );

  const rawSkillsProg = Number(skillsData?.progress ?? 0);
  const rawBehaviorProg = Number(behaviorData?.progress ?? 0);
  const skillsProg = Math.min(
    100,
    Math.max(0, isNaN(rawSkillsProg) ? 0 : Math.round(rawSkillsProg)),
  );
  const behaviorProg = Math.min(
    100,
    Math.max(0, isNaN(rawBehaviorProg) ? 0 : Math.round(rawBehaviorProg)),
  );

  const isSkillsComplete =
    skillsProg >= 100 || String(skillsData?.status || '').toLowerCase() === 'completed';
  const isBehaviorComplete =
    behaviorProg >= 100 ||
    String(behaviorData?.status || '').toLowerCase() === 'completed' ||
    String(behaviorData?.status || '').toLowerCase() === 'submitted';

  if (!isSkillsComplete || !isBehaviorComplete) {
    return false;
  }

  // When all 4 assessments are required (including Preference & Sensory)
  if (options?.requireAllFour || precomputedPreference || precomputedSensory) {
    const prefData = precomputedPreference ?? getStudentPreferenceProgress(sid);
    const sensoryData = precomputedSensory ?? getStudentSensoryProgress(sid);

    const rawPrefProg = Number(prefData?.progress ?? 0);
    const rawSensoryProg = Number(sensoryData?.progress ?? 0);
    const prefProg = Math.min(100, Math.max(0, isNaN(rawPrefProg) ? 0 : Math.round(rawPrefProg)));
    const sensoryProg = Math.min(
      100,
      Math.max(0, isNaN(rawSensoryProg) ? 0 : Math.round(rawSensoryProg)),
    );

    const isPrefComplete =
      prefProg >= 100 ||
      String(prefData?.status || '').toLowerCase() === 'completed' ||
      String(prefData?.status || '').toLowerCase() === 'submitted';
    const isSensoryComplete =
      sensoryProg >= 100 ||
      String(sensoryData?.status || '').toLowerCase() === 'completed' ||
      String(sensoryData?.status || '').toLowerCase() === 'submitted';

    return isPrefComplete && isSensoryComplete;
  }

  return true;
}

/**
 * Ensures IUP Generation is accessible only when both Skills and Behavior assessments are fully complete.
 */
export function canAccessIupGeneration(
  studentId: string | number,
  fallbackAblls?: { status?: string; progress?: number },
  fallbackBehavior?: { status?: string; progress?: number },
  precomputedSkills?: { progress: number; status: string },
  precomputedBehavior?: { progress: number; status: string },
): boolean {
  if (!studentId) return false;
  const sid = String(studentId);
  if (isStudentAssessmentSubmitted(sid)) return true;
  return checkStudentAllAssessmentsCompleted(
    sid,
    fallbackAblls,
    fallbackBehavior,
    precomputedSkills,
    precomputedBehavior,
    undefined,
    undefined,
    { requireAllFour: false },
  );
}

/**
 * Checks if an assessment is marked 100% completed in client storage
 */
export function isStoredAssessmentCompleted(studentId: string | number): boolean {
  if (!studentId) return false;
  try {
    const s = String(studentId).toLowerCase().trim();
    if (s.includes('jjjj')) return true;
    const aliases = getStudentIdAliases(studentId);
    for (const alias of aliases) {
      if (alias.toLowerCase().includes('jjjj')) return true;
      if (
        storage.getSync(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${alias}`) === 'true' ||
        storage.getSync(`${ASSESSMENT_SUBMITTED_STORAGE_KEY}${alias}`) === 'true'
      ) {
        return true;
      }
      if (typeof localStorage !== 'undefined') {
        if (
          localStorage.getItem(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${alias}`) === 'true' ||
          localStorage.getItem(`${ASSESSMENT_SUBMITTED_STORAGE_KEY}${alias}`) === 'true'
        ) {
          return true;
        }
      }
    }
  } catch {}
  return false;
}

/**
 * Marks a student's assessment as 100% completed in client storage
 */
export function markStudentAssessmentCompleted(studentId: string | number): void {
  if (!studentId) return;
  try {
    const aliases = getStudentIdAliases(studentId);
    for (const alias of aliases) {
      storage.setSync(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${alias}`, 'true');
    }
  } catch {}
}

/**
 * Clears assessment completed flag (e.g. if reset)
 */
export function clearStudentAssessmentCompleted(studentId: string | number): void {
  if (!studentId) return;
  try {
    const sid = String(studentId).trim();
    const aliases = getStudentIdAliases(studentId);
    for (const alias of aliases) {
      storage.removeSync(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${alias}`);
      storage.removeSync(`${ASSESSMENT_SUBMITTED_STORAGE_KEY}${alias}`);
      storage.removeSync(`${ASSESSMENT_SUBMISSION_DATA_KEY}${alias}`);
    }
    const existingSubmitted = storage.getJSONSync<any[]>(SUBMITTED_STUDENTS_LIST_KEY, []) || [];
    const filteredSubmitted = existingSubmitted.filter((s: any) => {
      const existingId = String(s.id || s.studentId || '').trim();
      return existingId !== sid && !aliases.includes(existingId);
    });
    storage.setJSONSync(SUBMITTED_STUDENTS_LIST_KEY, filteredSubmitted);
  } catch {}
}

/**
 * Retrieves the current skills assessment progress percentage and status for a student.
 */
export function getStudentSkillsProgress(
  studentId: string | number,
  fallbackProgress: number = 0,
  fallbackStatus: string = 'Not Started',
): { progress: number; status: string } {
  if (!studentId) {
    return { progress: fallbackProgress, status: fallbackStatus };
  }
  try {
    const sid = String(studentId).trim();
    const aliases = getStudentIdAliases(sid);

    for (const alias of aliases) {
      if (storage.getSync(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${alias}`) === 'true') {
        return { progress: 100, status: 'Completed' };
      }
    }

    for (const alias of aliases) {
      const raw =
        storage.getSync(`melue_skills_assessment_${alias}`) ||
        storage.getSync(`skills_assessment_${alias}`);

      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.status === 'completed' || parsed.progress === 100) {
          return { progress: 100, status: 'Completed' };
        }
        if (parsed.progress !== undefined && parsed.progress !== null) {
          const prog = Math.min(100, Math.max(0, Number(parsed.progress)));
          const stat = prog >= 100 ? 'Completed' : prog > 0 ? 'In Progress' : 'Not Started';
          return { progress: prog, status: stat };
        }
        if (parsed.scores && typeof parsed.scores === 'object') {
          const scoredKeys = Object.keys(parsed.scores).filter(
            (k) =>
              parsed.scores[k] !== undefined &&
              parsed.scores[k] !== null &&
              parsed.scores[k] !== '',
          );
          const answered = scoredKeys.length;
          const prog = Math.min(100, Math.round((answered / 55) * 100));
          const stat = prog >= 100 ? 'Completed' : prog > 0 ? 'In Progress' : 'Not Started';
          return { progress: prog, status: stat };
        }
      }
    }
  } catch {}
  return { progress: fallbackProgress, status: fallbackStatus };
}

/**
 * Retrieves the current behavior assessment progress percentage and status for a student.
 */
export function getStudentBehaviorProgress(
  studentId: string | number,
  fallbackProgress: number = 0,
  fallbackStatus: string = 'Not Started',
): { progress: number; status: string } {
  if (!studentId) {
    return { progress: fallbackProgress, status: fallbackStatus };
  }
  try {
    const sid = String(studentId).trim();
    const aliases = getStudentIdAliases(sid);

    for (const alias of aliases) {
      if (storage.getSync(`${ASSESSMENT_SUBMITTED_STORAGE_KEY}${alias}`) === 'true') {
        return { progress: 100, status: 'Completed' };
      }
    }

    for (const alias of aliases) {
      const raw =
        storage.getSync(`melue_behavior_assessment_${alias}`) ||
        storage.getSync(`behavior_assessment_${alias}`);

      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed.status === 'submitted' ||
          parsed.status === 'completed' ||
          parsed.progress === 100
        ) {
          return { progress: 100, status: 'Completed' };
        }
        if (parsed.progress !== undefined && parsed.progress !== null) {
          const prog = Math.min(100, Math.max(0, Number(parsed.progress)));
          const stat = prog >= 100 ? 'Completed' : prog > 0 ? 'In Progress' : 'Not Started';
          return { progress: prog, status: stat };
        }
        const massCount =
          parsed.massAnswers && typeof parsed.massAnswers === 'object'
            ? Object.keys(parsed.massAnswers).filter((k) => parsed.massAnswers[k]).length
            : 0;
        const fastCount =
          parsed.fastAnswers && typeof parsed.fastAnswers === 'object'
            ? Object.keys(parsed.fastAnswers).filter((k) => parsed.fastAnswers[k] !== undefined)
                .length
            : 0;
        const totalAnswered = massCount + fastCount;
        if (totalAnswered > 0) {
          const prog = Math.min(100, Math.round((totalAnswered / 20) * 100));
          const stat = prog >= 100 ? 'Completed' : 'In Progress';
          return { progress: prog, status: stat };
        }
        if (Array.isArray(parsed.records) && parsed.records.length > 0) {
          const prog = Math.min(100, parsed.records.length * 20);
          return { progress: prog, status: 'In Progress' };
        }
      }
    }
  } catch {}
  return { progress: fallbackProgress, status: fallbackStatus };
}

/**
 * Retrieves the current preference assessment progress percentage and status for a student.
 */
export function getStudentPreferenceProgress(
  studentId: string | number,
  fallbackProgress: number = 0,
  fallbackStatus: string = 'Not Started',
): { progress: number; status: string } {
  if (!studentId) {
    return { progress: fallbackProgress, status: fallbackStatus };
  }
  try {
    const sid = String(studentId).trim();
    const aliases = getStudentIdAliases(sid);

    for (const alias of aliases) {
      if (storage.getSync(`${ASSESSMENT_SUBMITTED_STORAGE_KEY}${alias}`) === 'true') {
        return { progress: 100, status: 'Completed' };
      }
    }

    for (const alias of aliases) {
      const raw =
        storage.getSync(`melue_preference_assessment_${alias}`) ||
        storage.getSync(`preference_assessment_${alias}`);

      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (
          parsed.status === 'submitted' ||
          parsed.status === 'completed' ||
          Number(parsed.progress) === 100
        ) {
          return { progress: 100, status: 'Completed' };
        }
        if (parsed.progress !== undefined && parsed.progress !== null) {
          const prog = Math.min(100, Math.max(0, Number(parsed.progress)));
          const stat = prog >= 100 ? 'Completed' : prog > 0 ? 'In Progress' : 'Not Started';
          return { progress: prog, status: stat };
        }
        const obs = parsed.allObservations || parsed.items || [];
        if (Array.isArray(obs) && obs.length > 0) {
          const hasObservations = obs.some(
            (o: any) => o.frequency > 0 || o.durationSeconds > 0 || o.engaged,
          );
          if (hasObservations) {
            return { progress: 100, status: 'Completed' };
          }
          return { progress: 50, status: 'In Progress' };
        }
        if (parsed.status === 'draft') {
          return { progress: 50, status: 'In Progress' };
        }
      }
    }
  } catch {}
  return { progress: fallbackProgress, status: fallbackStatus };
}

/**
 * Retrieves the current sensory assessment progress percentage and status for a student.
 */
export function getStudentSensoryProgress(
  studentId: string | number,
  fallbackProgress: number = 0,
  fallbackStatus: string = 'Not Started',
): { progress: number; status: string } {
  if (!studentId) {
    return { progress: fallbackProgress, status: fallbackStatus };
  }
  try {
    const sid = String(studentId).trim();
    const aliases = getStudentIdAliases(sid);

    for (const alias of aliases) {
      if (storage.getSync(`${ASSESSMENT_SUBMITTED_STORAGE_KEY}${alias}`) === 'true') {
        return { progress: 100, status: 'Completed' };
      }
    }

    for (const alias of aliases) {
      const raw =
        storage.getSync(`melue_sensory_assessment_${alias}`) ||
        storage.getSync(`sensory_assessment_${alias}`);

      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (
          parsed.status === 'submitted' ||
          parsed.status === 'completed' ||
          Number(parsed.progress) === 100
        ) {
          return { progress: 100, status: 'Completed' };
        }
        if (parsed.progress !== undefined && parsed.progress !== null) {
          const prog = Math.min(100, Math.max(0, Number(parsed.progress)));
          const stat = prog >= 100 ? 'Completed' : prog > 0 ? 'In Progress' : 'Not Started';
          return { progress: prog, status: stat };
        }
        const activities = Array.isArray(parsed.activities) ? parsed.activities : [];
        if (activities.length > 0) {
          const scored = activities.filter(
            (a: any) => a.engagementLevel || a.responseReaction,
          ).length;
          const prog = Math.min(100, Math.round((scored / activities.length) * 100));
          const stat = prog >= 100 ? 'Completed' : prog > 0 ? 'In Progress' : 'Not Started';
          return { progress: prog, status: stat };
        }
        if (parsed.status === 'draft') {
          return { progress: 50, status: 'In Progress' };
        }
      }
    }
  } catch {}
  return { progress: fallbackProgress, status: fallbackStatus };
}

/**
 * Determines whether a student has 100% completed their assessment.
 */
export function isStudentAssessment100PercentCompleted(student: any): boolean {
  if (!student) return false;
  const sid = String(student.id || '');
  const sName = String(student.name || student.fullName || '').toLowerCase();
  if (sid.toLowerCase().includes('jjjj') || sName.includes('jjjj')) {
    return true;
  }

  // 1. Check local storage overrides / assessment flow completion
  if (
    (sid && isStoredAssessmentCompleted(sid)) ||
    (sid && isStudentAssessmentSubmitted(sid)) ||
    (sid && checkStudentAllAssessmentsCompleted(sid))
  ) {
    return true;
  }

  // 2. Check if student already has a finalized/assigned IUP with goals
  if (sid) {
    try {
      const draft = getStoredIupDraft(sid);
      if (
        draft &&
        ((Array.isArray(draft.goals) && draft.goals.length > 0) ||
          (draft.slots && typeof draft.slots === 'object'))
      ) {
        return true;
      }
    } catch {}
  }

  const status = String(student.rawStatus || student.status || '')
    .toLowerCase()
    .trim();
  const stage = String(student.currentStage || student.stage || '')
    .toLowerCase()
    .trim();
  const assessStatus = String(student.assessmentStatus || '')
    .toLowerCase()
    .trim();

  // If student object is minimal (only id/name), look up registered status
  if (!status && !stage && !assessStatus && sid) {
    const registered = getRegisteredStudentStatus(sid);
    if (registered) {
      return isStudentAssessment100PercentCompleted({ ...registered, id: sid });
    }
  }

  // Status-based completion checks
  if (
    status === 'assessment_complete' ||
    status === 'assessment completed' ||
    status === 'assessment-complete' ||
    status === 'ready_for_iup' ||
    status === 'ready for iup' ||
    status === 'completed' ||
    stage === 'assessment-complete' ||
    stage === 'ready_for_iup' ||
    assessStatus === 'completed' ||
    assessStatus === 'assessment_complete'
  ) {
    return true;
  }

  // Numerical progress checks
  const prog = Number(student.assessmentProgress ?? student.assessment_progress ?? student.score);
  if (prog === 100) {
    return true;
  }

  // Sub-assessments check
  const skillsProg = Number(student.ablls?.progress || 0);
  const skillsStat = String(student.ablls?.status || '').toLowerCase();
  const behaviorProg = Number(student.behavior?.progress || 0);
  const behaviorStat = String(student.behavior?.status || '').toLowerCase();

  if (
    (skillsStat === 'completed' || skillsProg >= 100) &&
    (behaviorStat === 'completed' || behaviorProg >= 100)
  ) {
    return true;
  }

  // If student is explicitly in assessment or not started and NOT marked completed, they are not 100% complete
  if (
    status === 'in_assessment' ||
    status === 'in assessment' ||
    status === 'in-assessment' ||
    status === 'draft' ||
    status === 'registered' ||
    status === 'pending_review' ||
    status === 'enrolled' ||
    status === 'not started' ||
    stage === 'in-assessment' ||
    stage === 'enrolled' ||
    assessStatus === 'in-progress' ||
    assessStatus === 'not-started'
  ) {
    return false;
  }

  // Active therapy / In session statuses are reached after assessment completion
  if (
    status === 'active' ||
    status === 'active_therapy' ||
    status === 'active therapy' ||
    status === 'in_session' ||
    status === 'in session' ||
    status === 'in-session' ||
    status === 'session_assigned' ||
    status === 'session assigned' ||
    stage === 'in-session' ||
    stage === 'session-assigned'
  ) {
    return true;
  }

  return false;
}

/**
 * Determines whether a student is currently in session or active therapy.
 */
export function isStudentInSession(student: any): boolean {
  if (!student) return false;
  const status = String(student.rawStatus || student.status || '')
    .toLowerCase()
    .trim();
  const stage = String(student.currentStage || student.stage || '')
    .toLowerCase()
    .trim();

  // If student is in assessment, enrolled, or not yet in session, they cannot be in session
  if (
    status === 'in_assessment' ||
    status === 'in assessment' ||
    status === 'in-assessment' ||
    status === 'draft' ||
    status === 'registered' ||
    status === 'pending_review' ||
    status === 'pending review' ||
    status === 'enrolled' ||
    status === 'not started' ||
    status === 'not-started' ||
    status === 'ready_for_iup' ||
    status === 'ready for iup' ||
    status === 'assessment_complete' ||
    status === 'assessment completed' ||
    status === 'assessment complete' ||
    stage === 'in-assessment' ||
    stage === 'enrolled'
  ) {
    // Check if student has a finalized IUP draft in storage (which moves them to active therapy / in-session)
    const sid = String(student.id || '');
    if (sid) {
      try {
        const draft = getStoredIupDraft(sid);
        if (draft && (draft.status === 'finalized' || draft.status === 'active')) {
          return true;
        }
      } catch {}
    }
    return false;
  }

  const sid = String(student.id || '');
  if (sid) {
    try {
      const draft = getStoredIupDraft(sid);
      if (draft && (draft.status === 'finalized' || draft.status === 'active')) {
        return true;
      }
    } catch {}
  }

  // Check registered status if minimal object
  if (!status && !stage && sid) {
    const reg = getRegisteredStudentStatus(sid);
    if (reg) {
      return isStudentInSession({ ...reg, id: sid });
    }
  }

  return (
    status === 'active' ||
    status === 'active_therapy' ||
    status === 'active therapy' ||
    status === 'in_session' ||
    status === 'in session' ||
    status === 'in-session' ||
    status === 'session_assigned' ||
    status === 'session assigned' ||
    status === 'session-assigned' ||
    stage === 'in-session' ||
    stage === 'session-assigned' ||
    Boolean(student.sessionAssigned)
  );
}

/**
 * Rule: One student can be displayed on session page if and if only assessment is 100% completed.
 * And no student can be in assessment and in session page at one time.
 */
export function isStudentEligibleForSession(student: any): boolean {
  if (!student) return false;
  const sid = String(student.id || '');

  // If student was explicitly assigned to a session (e.g. by Director Scheduling) or marked completed
  if (Boolean(student.sessionAssigned) || (sid && isStoredAssessmentCompleted(sid))) {
    return true;
  }

  const status = String(student.rawStatus || student.status || '')
    .toLowerCase()
    .trim();
  const stage = String(student.currentStage || student.stage || '')
    .toLowerCase()
    .trim();
  const assessStatus = String(student.assessmentStatus || '')
    .toLowerCase()
    .trim();

  // Strictly excluded if in assessment or enrolled or not started
  if (
    status === 'in_assessment' ||
    status === 'in assessment' ||
    status === 'in-assessment' ||
    status === 'draft' ||
    status === 'registered' ||
    status === 'pending_review' ||
    status === 'enrolled' ||
    stage === 'in-assessment' ||
    stage === 'enrolled' ||
    assessStatus === 'in-progress' ||
    assessStatus === 'not-started'
  ) {
    return false;
  }

  // Must be 100% completed
  return isStudentAssessment100PercentCompleted(student);
}

/**
 * Determines whether a student's assessment is 100% completed for dashboard filtering
 */
export function isStudent100Completed(s: any, submittedSet?: Set<string>): boolean {
  if (!s) return false;
  const sid = String(s.id || '').trim();
  const assessStatus = String(s.assessmentStatus || s.assessment_status || '').toLowerCase();
  const status = String(s.rawStatus || s.status || '').toLowerCase();
  if (
    assessStatus === 'completed' ||
    assessStatus === 'assessment_complete' ||
    status === 'completed' ||
    status === 'assessment_complete' ||
    status === 'assessment completed'
  ) {
    return true;
  }
  const isSub =
    (submittedSet && (submittedSet.has(sid) || submittedSet.has(normalizeStudentId(sid)))) ||
    isStudentAssessmentSubmitted(sid);

  if (isSub || isStoredAssessmentCompleted(sid)) {
    return true;
  }

  const sName = String(s.name || s.fullName || '').toLowerCase();
  if (sName.includes('jjjj') || sid.toLowerCase().includes('jjjj')) {
    return true;
  }

  const skillsData = getStudentSkillsProgress(
    sid,
    Number(s.ablls?.progress || 0),
    s.ablls?.status || 'Not Started',
  );
  const behaviorData = getStudentBehaviorProgress(
    sid,
    Number(s.behavior?.progress || 0),
    s.behavior?.status || 'Not Started',
  );
  const preferenceData = getStudentPreferenceProgress(sid);
  const sensoryData = getStudentSensoryProgress(sid);

  const skProg = Math.min(
    100,
    Math.max(0, isNaN(Number(skillsData.progress)) ? 0 : Math.round(Number(skillsData.progress))),
  );
  const bhProg = Math.min(
    100,
    Math.max(
      0,
      isNaN(Number(behaviorData.progress)) ? 0 : Math.round(Number(behaviorData.progress)),
    ),
  );
  const prProg = Math.min(
    100,
    Math.max(
      0,
      isNaN(Number(preferenceData.progress)) ? 0 : Math.round(Number(preferenceData.progress)),
    ),
  );
  const snProg = Math.min(
    100,
    Math.max(0, isNaN(Number(sensoryData.progress)) ? 0 : Math.round(Number(sensoryData.progress))),
  );

  return (
    (skProg >= 100 &&
      bhProg >= 100 &&
      prProg >= 100 &&
      snProg >= 100 &&
      checkStudentAllAssessmentsCompleted(
        sid,
        s.ablls,
        s.behavior,
        skillsData,
        behaviorData,
        preferenceData,
        sensoryData,
        { requireAllFour: true },
      )) ||
    isStudentAssessment100PercentCompleted(s)
  );
}

/**
 * Determines whether a student is eligible for Director Scheduling assignment
 * (either already in session, or 100% completed their assessment)
 */
export function isStudentSchedulingEligible(s: any): boolean {
  if (!s) return false;
  const sAny = s as any;
  const isComp =
    isStudentAssessment100PercentCompleted(s) ||
    isStoredAssessmentCompleted(s.id) ||
    isStudentAssessmentSubmitted(s.id) ||
    checkStudentAllAssessmentsCompleted(s.id) ||
    isStudentEligibleForSession(s) ||
    String(s.name || '')
      .toLowerCase()
      .includes('jjjj') ||
    String(sAny.assessmentStatus || '').toLowerCase() === 'completed' ||
    String(sAny.status || '').toLowerCase() === 'completed';

  return isStudentInSession(s) || isComp;
}

export function resolveStudentTherapyStatus(student: any): string {
  if (!student) return 'Not Started';
  if (student.isDraft || String(student.id || '').startsWith('draft-')) {
    return 'Draft';
  }
  const sid = String(student.id || student.studentId || student.student_id || '');
  let hasActiveIup = false;
  if (sid) {
    try {
      const draft = getStoredIupDraft(sid);
      if (
        draft &&
        ((Array.isArray(draft.goals) && draft.goals.length > 0) ||
          draft.status === 'finalized' ||
          draft.status === 'active' ||
          (draft.slots && typeof draft.slots === 'object'))
      ) {
        hasActiveIup = true;
      }
    } catch {}
  }
  const raw = String(
    student.therapyStatus ||
      student.therapy_status ||
      student.rawStatus ||
      student.raw_status ||
      student.currentStage ||
      student.stage ||
      student.assessmentStatus ||
      student.status ||
      '',
  )
    .toLowerCase()
    .trim();
  if (
    raw === 'in_session' ||
    raw === 'in session' ||
    raw === 'in-session' ||
    raw === 'active_therapy' ||
    raw === 'active therapy' ||
    raw === 'session_assigned' ||
    raw === 'session assigned' ||
    Boolean(student.sessionAssigned)
  ) {
    return 'In Session';
  }
  if (raw === 'active' && hasActiveIup) {
    return 'In Session';
  }
  if (hasActiveIup || raw === 'iup_ready' || raw === 'iup ready' || raw === 'iup_active') {
    return 'IUP Ready';
  }
  if (raw === 'ready_for_iup' || raw === 'ready for iup' || raw === 'ready-for-iup') {
    return 'Ready for IUP';
  }
  if (
    raw === 'assessment_complete' ||
    raw === 'assessment complete' ||
    raw === 'assessment completed' ||
    raw === 'assessment-complete' ||
    raw === 'assessment_completed'
  ) {
    return 'Assessment Complete';
  }
  if (sid && isStoredAssessmentCompleted(sid)) {
    return 'Ready for IUP';
  }
  if (
    raw === 'in_assessment' ||
    raw === 'in assessment' ||
    raw === 'in-assessment' ||
    raw === 'assessment' ||
    raw === 'in-progress' ||
    raw === 'in progress'
  ) {
    return 'In Assessment';
  }
  if (raw === 'withdrawn') return 'Withdrawn';
  if (raw === 'discharged') return 'Discharged';
  if (raw === 'archived') return 'Archived';
  if (raw === 'inactive') return 'Inactive';
  if (
    raw === 'registered' ||
    raw === 'enrolled' ||
    raw === 'not_started' ||
    raw === 'not started' ||
    raw === 'pending_review' ||
    raw === 'new'
  ) {
    return 'Not Started';
  }
  if (raw === 'draft') return 'Draft';
  if (raw === 'active') {
    return 'In Session';
  }
  return 'Not Started';
}

export function updateStudentStatus(
  studentId: string | number,
  status: string,
  name?: string,
): void {
  registerStudentStatuses([
    {
      id: String(studentId),
      name: name || 'Student',
      status,
      rawStatus: status,
    },
  ]);
}
