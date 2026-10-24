// src/utils/studentLifecycleHelper.ts
// Enforces the student lifecycle invariant:
// 1. Mutual exclusivity: No student can be in assessment and in session page at one time.
// 2. Session display rule: A student can be displayed on session page if and only if assessment is 100% completed.

import { getStoredIupDraft } from '../api/programDirectorApi';
import storage from './storage';

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

    storage.setSync('last_assessment_student_id', sid);
    await storage.setItem('last_assessment_student_id', sid);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('melue_assessment_updated', {
          detail: { studentId: sid, status: 'submitted' },
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
 * Stores student statuses into a lightweight client registry for cross-screen lookup
 */
export function registerStudentStatuses(students: any[]): void {
  if (typeof localStorage === 'undefined' || !Array.isArray(students)) return;
  try {
    const raw = localStorage.getItem(STUDENT_STATUS_REGISTRY_KEY);
    const registry = raw ? JSON.parse(raw) : {};
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
    localStorage.setItem(STUDENT_STATUS_REGISTRY_KEY, JSON.stringify(registry));
  } catch {}
}

/**
 * Retrieves registered student lifecycle info
 */
export function getRegisteredStudentStatus(studentId: string | number): any {
  if (typeof localStorage === 'undefined' || !studentId) return null;
  try {
    const raw = localStorage.getItem(STUDENT_STATUS_REGISTRY_KEY);
    if (!raw) return null;
    const registry = JSON.parse(raw);
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
    const aliases = getStudentIdAliases(studentId);
    for (const alias of aliases) {
      if (
        storage.getSync(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${alias}`) === 'true' ||
        storage.getSync(`${ASSESSMENT_SUBMITTED_STORAGE_KEY}${alias}`) === 'true'
      ) {
        return true;
      }
      const skillsRaw =
        storage.getSync(`melue_skills_assessment_${alias}`) ||
        storage.getSync(`skills_assessment_${alias}`);
      if (skillsRaw) {
        const skills = JSON.parse(skillsRaw);
        if (skills.status === 'completed' || skills.progress === 100) return true;
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
    const aliases = getStudentIdAliases(studentId);
    for (const alias of aliases) {
      storage.removeSync(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${alias}`);
      storage.removeSync(`${ASSESSMENT_SUBMITTED_STORAGE_KEY}${alias}`);
      storage.removeSync(`${ASSESSMENT_SUBMISSION_DATA_KEY}${alias}`);
    }
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
      if (
        storage.getSync(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${alias}`) === 'true' ||
        storage.getSync(`${ASSESSMENT_SUBMITTED_STORAGE_KEY}${alias}`) === 'true'
      ) {
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
      if (storage.getSync(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${alias}`) === 'true') {
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
      if (storage.getSync(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${alias}`) === 'true') {
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

  // 1. Check local storage overrides / assessment flow completion
  if (sid && isStoredAssessmentCompleted(sid)) {
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

  // If student is explicitly in assessment or not started, they are not 100% complete
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

  // Status-based completion checks
  if (
    status === 'assessment_complete' ||
    status === 'assessment completed' ||
    status === 'assessment-complete' ||
    status === 'ready_for_iup' ||
    status === 'ready for iup' ||
    stage === 'assessment-complete' ||
    stage === 'ready_for_iup' ||
    assessStatus === 'completed' ||
    assessStatus === 'assessment_complete'
  ) {
    return true;
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
