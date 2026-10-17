// src/screens/goalmastery/GoalMasteryApprovalIntegration.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveMasteryCheck,
  getMasteryCheckById,
  getMasteryCheckByStudentAndGoal,
  getPendingMasteryChecks,
  approveMasteryCheck,
  rejectMasteryCheck,
  getStoredMasteryChecks,
  type GoalMasteryCheckItem,
} from '../../stores/goalMasteryStore';
import {
  getPendingMasteryApprovals,
  getMasteryApprovalDetail,
  approveMastery,
  rejectMastery,
} from '../../api/directorApi';

describe('Goal Mastery Check and Approval Flow', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('saves submitted mastery check and displays it in pending approvals with multi-therapist details', async () => {
    const submission: GoalMasteryCheckItem = {
      id: 'mc-student-1-g1',
      studentId: 'student-1',
      studentName: 'Oliver Martinez',
      goalId: 'g-101',
      goalName: 'Receptive Object Identification',
      station: 'Early Learning Station',
      dateSubmitted: '2026-10-12',
      status: 'pending',
      primaryTeacher: {
        name: 'Teacher Lead',
        criteriaMet: 'Receptive Object Identification',
        dateAchieved: '2026-10-12',
        totalTrials: 12,
        independenceRate: '100%',
        notes: 'Consistent performance across 3 sessions',
      },
      teacherB: {
        name: 'Therapist B',
        date: '2026-10-12',
        outcome: 'novel_person',
        promptUsed: undefined,
        notes: 'Maintained independent response with unfamiliar person',
      },
      teacherC: {
        name: 'Therapist C',
        date: '2026-10-12',
        outcome: 'novel_environment',
        promptUsed: undefined,
        notes: 'Demonstrated generalization in sensory room',
      },
    };

    saveMasteryCheck(submission);

    // Verify stored in client store
    const stored = getMasteryCheckById('mc-student-1-g1');
    expect(stored).toBeDefined();
    expect(stored?.studentName).toBe('Oliver Martinez');
    expect(stored?.status).toBe('pending');

    // Verify retrieved by getPendingMasteryApprovals
    const res = await getPendingMasteryApprovals();
    const list = res.data as any[];
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('mc-student-1-g1');
    expect(list[0].studentName).toBe('Oliver Martinez');
    expect(list[0].goalName).toBe('Receptive Object Identification');
    expect(list[0].primaryTeacher?.name).toBe('Teacher Lead');
    expect(list[0].teacherB?.name).toBe('Therapist B');
    expect(list[0].teacherC?.name).toBe('Therapist C');
  });

  it('rejects mastery check and records clinical feedback reason for teacher re-submission', async () => {
    const submission: GoalMasteryCheckItem = {
      id: 'mc-student-2-g2',
      studentId: 'student-2',
      studentName: 'Emma Watson',
      goalId: 'g-202',
      goalName: 'Expressive Requesting (Mands)',
      station: 'Language Hub',
      dateSubmitted: '2026-10-12',
      status: 'pending',
      primaryTeacher: {
        name: 'Teacher Primary',
        criteriaMet: 'Expressive Requesting',
        dateAchieved: '2026-10-12',
        totalTrials: 10,
        independenceRate: '95%',
      },
      teacherB: {
        name: 'Teacher B',
        date: '2026-10-12',
        outcome: 'failed',
        promptUsed: 'Gestural (G)',
        notes: 'Needed gestural cue',
      },
      teacherC: {
        name: 'Teacher C',
        date: '2026-10-12',
        outcome: 'novel_environment',
        notes: 'Passed in classroom',
      },
    };

    saveMasteryCheck(submission);

    // Reject via directorApi
    await rejectMastery('mc-student-2-g2', {
      reason: 'Generalization criteria not met with Teacher B (gestural prompt required).',
      notes:
        'Please conduct 3 additional generalization trials without prompt before re-submitting.',
    });

    // Verify removed from pending
    const pendingRes = await getPendingMasteryApprovals();
    expect((pendingRes.data as any[]).length).toBe(0);

    // Verify status updated to rejected and rejection feedback preserved
    const rejectedItem = getMasteryCheckById('mc-student-2-g2');
    expect(rejectedItem?.status).toBe('rejected');
    expect(rejectedItem?.rejectionReason).toBe(
      'Generalization criteria not met with Teacher B (gestural prompt required).',
    );
    expect(rejectedItem?.approvalNotes).toContain('3 additional generalization trials');

    // Verify lookup by student and goal returns the rejected record
    const byStudentAndGoal = getMasteryCheckByStudentAndGoal('student-2', 'g-202');
    expect(byStudentAndGoal?.status).toBe('rejected');
  }, 30000);

  it('approves mastery check and removes from pending approvals', async () => {
    const submission: GoalMasteryCheckItem = {
      id: 'mc-student-3-g3',
      studentId: 'student-3',
      studentName: 'Lucas Davies',
      goalId: 'g-303',
      goalName: 'Peer Turn Taking',
      station: 'Social Station',
      dateSubmitted: '2026-10-12',
      status: 'pending',
      primaryTeacher: {
        name: 'Teacher Primary',
        criteriaMet: 'Turn Taking Criteria Met',
        dateAchieved: '2026-10-12',
        totalTrials: 15,
        independenceRate: '100%',
      },
      teacherB: {
        name: 'Teacher B',
        date: '2026-10-12',
        outcome: 'both',
        notes: 'Independent in novel setting and person',
      },
      teacherC: {
        name: 'Teacher C',
        date: '2026-10-12',
        outcome: 'both',
        notes: 'Independent in cafeteria',
      },
    };

    saveMasteryCheck(submission);

    // Approve via directorApi
    await approveMastery('mc-student-3-g3', {
      notes:
        'Exceptional generalization demonstrated across novel peers and environments. Approved.',
    });

    // Verify removed from pending
    const pendingRes = await getPendingMasteryApprovals();
    expect((pendingRes.data as any[]).length).toBe(0);

    // Verify status updated to approved
    const approvedItem = getMasteryCheckById('mc-student-3-g3');
    expect(approvedItem?.status).toBe('approved');
    expect(approvedItem?.approvalNotes).toContain('Approved');
  }, 15000);

  it('fetches full mastery approval detail with observer verifications for modal view', async () => {
    const submission: GoalMasteryCheckItem = {
      id: 'mc-detail-test',
      studentId: 'student-detail',
      studentName: 'Sophia Taylor',
      goalId: 'g-detail-1',
      goalName: 'Color Matching',
      station: 'Foundations',
      dateSubmitted: '2026-10-12',
      status: 'pending',
      primaryTeacher: {
        name: 'Teacher Lead',
        criteriaMet: 'Color Matching',
        dateAchieved: '2026-10-12',
        totalTrials: 10,
        independenceRate: '100%',
        notes: 'Achieved mastery',
      },
      teacherB: {
        name: 'Observer 1',
        date: '2026-10-12',
        outcome: 'novel_person',
        notes: 'Passed novel person',
      },
      teacherC: {
        name: 'Observer 2',
        date: '2026-10-12',
        outcome: 'novel_environment',
        notes: 'Passed playground',
      },
    };

    saveMasteryCheck(submission);

    const detailRes = await getMasteryApprovalDetail('mc-detail-test');
    expect(detailRes.data).toBeDefined();
    const d = detailRes.data as any;
    expect(d.studentName).toBe('Sophia Taylor');
    expect(d.goalName).toBe('Color Matching');
    expect(d.teacherB.outcome).toBe('novel_person');
    expect(d.teacherC.outcome).toBe('novel_environment');
    expect(d.teacherB.notes).toBe('Passed novel person');
    expect(d.teacherC.notes).toBe('Passed playground');
  });
});
