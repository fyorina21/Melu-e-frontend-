// src/screens/session/sessionEligibilityHelper.ts

import { getStoredIupDraft } from '../../api/programDirectorApi';

export function getStudentAssignedGoals(studentId: string, rawGoals: any[] = []): any[] {
  const draft = getStoredIupDraft(studentId);
  const extractedGoals: any[] = [];

  if (draft) {
    if (draft.slots && typeof draft.slots === 'object') {
      const s1 = Array.isArray((draft.slots as any).station1) ? (draft.slots as any).station1 : [];
      const s2 = Array.isArray((draft.slots as any).station2) ? (draft.slots as any).station2 : [];
      [...s1, ...s2].filter(Boolean).forEach((g: any, idx: number) => {
        extractedGoals.push({
          id: String(g.id || `${studentId}-draft-g-${idx}`),
          name: String(g.name || g.title || g.description || 'Assigned Goal'),
          category: g.domain || g.category || 'Adaptive',
          goalType: g.goalType || g.goal_type || 'standard',
          totalTrials: 0,
          independencePercent: 0,
          trialLog: [],
        });
      });
    }

    if (extractedGoals.length === 0 && Array.isArray(draft.goals) && draft.goals.length > 0) {
      draft.goals.forEach((g: any, idx: number) => {
        if (typeof g === 'object' && g !== null) {
          extractedGoals.push({
            id: String(g.id || `${studentId}-draft-g-${idx}`),
            name: String(g.name || g.title || g.description || 'Assigned Goal'),
            category: g.domain || g.category || 'Adaptive',
            goalType: g.goalType || g.goal_type || 'standard',
            totalTrials: 0,
            independencePercent: 0,
            trialLog: [],
          });
        } else if (typeof g === 'string' && g.trim()) {
          extractedGoals.push({
            id: g.trim(),
            name: 'Assigned Goal',
            category: 'Adaptive',
            goalType: 'standard',
            totalTrials: 0,
            independencePercent: 0,
            trialLog: [],
          });
        }
      });
    }
  }

  if (extractedGoals.length > 0) {
    return extractedGoals;
  }

  // Filter out default synthetic backend fallback IDs (e.g., studentId-g1, studentId-g2)
  const realBackendGoals = (Array.isArray(rawGoals) ? rawGoals : []).filter((g: any) => {
    const gid = String(g.id || '');
    const isFallbackId =
      gid === `${studentId}-g1` ||
      gid === `${studentId}-g2` ||
      gid.endsWith('-g1') ||
      gid.endsWith('-g2');
    return !isFallbackId;
  });

  if (realBackendGoals.length > 0) {
    return realBackendGoals;
  }

  return [];
}

export function checkStudentEligibility(rawStatus: string, hasAssignedGoal: boolean): boolean {
  const s = rawStatus.toLowerCase().trim();

  // Exclude students whose status is in assessment, draft, pending review, registered, discharged, etc.
  if (
    s === 'in_assessment' ||
    s === 'in assessment' ||
    s === 'assessment' ||
    s === 'draft' ||
    s === 'registered' ||
    s === 'pending_review' ||
    s === 'pending review' ||
    s === 'withdrawn' ||
    s === 'discharged' ||
    s === 'archived'
  ) {
    return false;
  }

  const isInSession =
    s === 'in session' ||
    s === 'in_session' ||
    s === 'active' ||
    s === 'active therapy' ||
    s === 'active_therapy' ||
    s === 'session_assigned' ||
    s === 'session assigned' ||
    s === 'in_progress' ||
    s === 'in progress';

  const isReadyForIup =
    s === 'ready for iup' ||
    s === 'ready_for_iup' ||
    s === 'assessment_complete' ||
    s === 'assessment complete' ||
    s === 'assessment completed';

  // "only be the ones that are in ready for iup status and who are assigned goal or in session status"
  if (isInSession) {
    return true;
  }

  if (isReadyForIup && hasAssignedGoal) {
    return true;
  }

  // If status is empty/unknown but student specifically has an assigned goal from draft and is not excluded
  if (!s && hasAssignedGoal) {
    return true;
  }

  return false;
}
