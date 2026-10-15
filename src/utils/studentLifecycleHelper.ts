// src/utils/studentLifecycleHelper.ts
// Enforces the student lifecycle invariant:
// 1. Mutual exclusivity: No student can be in assessment and in session page at one time.
// 2. Session display rule: A student can be displayed on session page if and only if assessment is 100% completed.

import { getStoredIupDraft } from '../api/programDirectorApi';

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
const STUDENT_STATUS_REGISTRY_KEY = 'melue_student_status_registry';

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
 * Checks if an assessment is marked 100% completed in client storage
 */
export function isStoredAssessmentCompleted(studentId: string | number): boolean {
  if (typeof localStorage === 'undefined' || !studentId) return false;
  try {
    const sid = String(studentId);
    if (localStorage.getItem(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${sid}`) === 'true') {
      return true;
    }
    const skillsRaw = localStorage.getItem(`melue_skills_assessment_${sid}`);
    if (skillsRaw) {
      const skills = JSON.parse(skillsRaw);
      if (skills.status === 'completed' || skills.progress === 100) return true;
    }
    const legacySkills = localStorage.getItem(`skills_assessment_${sid}`);
    if (legacySkills) {
      const parsed = JSON.parse(legacySkills);
      if (parsed.status === 'completed' || parsed.progress === 100) return true;
    }
  } catch {}
  return false;
}

/**
 * Marks a student's assessment as 100% completed in client storage
 */
export function markStudentAssessmentCompleted(studentId: string | number): void {
  if (typeof localStorage === 'undefined' || !studentId) return;
  try {
    const sid = String(studentId);
    localStorage.setItem(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${sid}`, 'true');
  } catch {}
}

/**
 * Clears assessment completed flag (e.g. if reset)
 */
export function clearStudentAssessmentCompleted(studentId: string | number): void {
  if (typeof localStorage === 'undefined' || !studentId) return;
  try {
    const sid = String(studentId);
    localStorage.removeItem(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${sid}`);
  } catch {}
}

/**
 * Retrieves the current skills assessment progress percentage and status for a student.
 */
export function getStudentSkillsProgress(
  studentId: string | number,
  fallbackProgress: number = 0,
  fallbackStatus: string = 'Not Started'
): { progress: number; status: string } {
  if (typeof localStorage === 'undefined' || !studentId) {
    return { progress: fallbackProgress, status: fallbackStatus };
  }
  try {
    const sid = String(studentId);
    const aliasSid = sid === 'stu-1' ? 'student-a' : sid === 'student-a' ? 'stu-1' : sid;

    if (
      localStorage.getItem(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${sid}`) === 'true' ||
      localStorage.getItem(`${ASSESSMENT_COMPLETED_STORAGE_KEY}${aliasSid}`) === 'true'
    ) {
      return { progress: 100, status: 'Completed' };
    }

    const raw =
      localStorage.getItem(`melue_skills_assessment_${sid}`) ||
      localStorage.getItem(`melue_skills_assessment_${aliasSid}`) ||
      localStorage.getItem(`skills_assessment_${sid}`);

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
          (k) => parsed.scores[k] !== undefined && parsed.scores[k] !== null && parsed.scores[k] !== ''
        );
        const answered = scoredKeys.length;
        const prog = Math.min(100, Math.round((answered / 55) * 100));
        const stat = prog >= 100 ? 'Completed' : prog > 0 ? 'In Progress' : 'Not Started';
        return { progress: prog, status: stat };
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
  fallbackStatus: string = 'Not Started'
): { progress: number; status: string } {
  if (typeof localStorage === 'undefined' || !studentId) {
    return { progress: fallbackProgress, status: fallbackStatus };
  }
  try {
    const sid = String(studentId);
    const aliasSid = sid === 'stu-1' ? 'student-a' : sid === 'student-a' ? 'stu-1' : sid;

    const raw =
      localStorage.getItem(`melue_behavior_assessment_${sid}`) ||
      localStorage.getItem(`melue_behavior_assessment_${aliasSid}`);

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.status === 'submitted' || parsed.progress === 100) {
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
          ? Object.keys(parsed.fastAnswers).filter((k) => parsed.fastAnswers[k] !== undefined).length
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
      if (draft && ((Array.isArray(draft.goals) && draft.goals.length > 0) || (draft.slots && typeof draft.slots === 'object'))) {
        return true;
      }
    } catch {}
  }

  const status = String(student.rawStatus || student.status || '').toLowerCase().trim();
  const stage = String(student.currentStage || student.stage || '').toLowerCase().trim();
  const assessStatus = String(student.assessmentStatus || '').toLowerCase().trim();

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
  const status = String(student.rawStatus || student.status || '').toLowerCase().trim();
  const stage = String(student.currentStage || student.stage || '').toLowerCase().trim();

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

  const status = String(student.rawStatus || student.status || '').toLowerCase().trim();
  const stage = String(student.currentStage || student.stage || '').toLowerCase().trim();
  const assessStatus = String(student.assessmentStatus || '').toLowerCase().trim();

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
