import { describe, it, expect } from 'vitest';
import {
  getIupCandidates,
  isEligibleIupCandidate,
  isCandidateInSession,
} from '../../api/programDirectorApi';

describe('IUP Generation Candidate Eligibility & Status Filtering', () => {
  it('identifies students ready for IUP as eligible candidates', () => {
    const readyCandidate1 = {
      id: 's-ready-1',
      name: 'Mia Chen',
      status: 'Ready for IUP',
      rawStatus: 'ready_for_iup',
      assessmentStatus: 'Ready for IUP',
    };
    expect(isEligibleIupCandidate(readyCandidate1)).toBe(true);
    expect(isCandidateInSession(readyCandidate1)).toBe(false);

    const readyCandidate2 = {
      id: 's-ready-2',
      name: 'Elena Rostova',
      status: 'Assessment Completed',
      rawStatus: 'assessment_complete',
      assessmentStatus: 'completed',
    };
    expect(isEligibleIupCandidate(readyCandidate2)).toBe(true);
    expect(isCandidateInSession(readyCandidate2)).toBe(false);
  });

  it('identifies students with In Session status as eligible candidates', () => {
    const inSessionCandidate1 = {
      id: 's-session-1',
      name: 'Noah Wilson',
      status: 'In Session',
      rawStatus: 'in_session',
      assessmentStatus: 'In Session',
    };
    expect(isEligibleIupCandidate(inSessionCandidate1)).toBe(true);
    expect(isCandidateInSession(inSessionCandidate1)).toBe(true);

    const inSessionCandidate2 = {
      id: 's-session-2',
      name: 'Lucas Davies',
      status: 'Session Assigned',
      rawStatus: 'session_assigned',
      sessionAssigned: true,
      currentStage: 'session-assigned',
    };
    expect(isEligibleIupCandidate(inSessionCandidate2)).toBe(true);
    expect(isCandidateInSession(inSessionCandidate2)).toBe(true);

    const activeTherapyCandidate = {
      id: 's-session-3',
      name: 'Marcus Bell',
      status: 'Active',
      rawStatus: 'active_therapy',
    };
    expect(isEligibleIupCandidate(activeTherapyCandidate)).toBe(true);
    expect(isCandidateInSession(activeTherapyCandidate)).toBe(true);
  });

  it('excludes students who are In Assessment, Draft, or Not Started', () => {
    const inAssessmentCandidate = {
      id: 's-assess-1',
      name: 'Leo Miller',
      status: 'In Assessment',
      rawStatus: 'in_assessment',
      assessmentStatus: 'in-progress',
      currentStage: 'in-assessment',
    };
    expect(isEligibleIupCandidate(inAssessmentCandidate)).toBe(false);

    const enrolledCandidate = {
      id: 's-enroll-1',
      name: 'Sophia Taylor',
      status: 'Not Started',
      rawStatus: 'not started',
      assessmentStatus: 'not-started',
      currentStage: 'enrolled',
    };
    expect(isEligibleIupCandidate(enrolledCandidate)).toBe(false);

    const draftCandidate = {
      id: 's-draft-1',
      name: 'Pending Student',
      status: 'draft',
      rawStatus: 'draft',
    };
    expect(isEligibleIupCandidate(draftCandidate)).toBe(false);
  });

  it('getIupCandidates fetches and returns both Ready for IUP and In Session candidates', async () => {
    const res = await getIupCandidates();
    const candidates = res.candidates || res.data || [];
    expect(Array.isArray(candidates)).toBe(true);
    expect(candidates.length).toBeGreaterThan(0);

    const eligible = candidates.filter(isEligibleIupCandidate);
    expect(eligible.length).toBeGreaterThan(0);

    // Verify presence of Ready for IUP and In Session students
    const hasReadyForIup = eligible.some((c) => !isCandidateInSession(c) && isEligibleIupCandidate(c));
    const hasInSession = eligible.some((c) => isCandidateInSession(c));

    expect(hasReadyForIup).toBe(true);
    expect(hasInSession).toBe(true);
  }, 30000);
});
