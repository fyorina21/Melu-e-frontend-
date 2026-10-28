import { describe, it, expect, beforeEach } from 'vitest';
import {
  finalizeIup,
  getIupLibrary,
  saveIupDraft,
  getStudentCaseload,
  assignGoalToSlot,
  unassignApprovedGoalFromCaseload,
  CASELOAD_ASSIGNMENTS_STORAGE_KEY,
  IUP_LIBRARY_STORAGE_KEY,
  IUP_DRAFTS_STORAGE_KEY,
} from '../../api/programDirectorApi';
import { approveMastery } from '../../api/directorApi';
import { saveMasteryCheck } from '../../stores/goalMasteryStore';
import storage from '../../utils/storage';

describe('IUP Generation, Caseload, Goal Mastery Approval & IUP Library Workflow', () => {
  const studentA = 'test-student-alpha-001';
  const studentB = 'test-student-beta-002';

  const mockGoal1 = {
    id: 'goal-lang-01',
    goalId: 'goal-lang-01',
    name: 'Expressive Labeling of Common Objects',
    domain: 'Language & Communication',
    targetScore: '80%',
    masteryCriteria: '80% accuracy across 3 sessions',
    status: 'In Progress',
  };

  const mockGoal2 = {
    id: 'goal-soc-02',
    goalId: 'goal-soc-02',
    name: 'Turn-Taking in Structured Play',
    domain: 'Social Skills',
    targetScore: '85%',
    masteryCriteria: '85% accuracy across 3 sessions',
    status: 'In Progress',
  };

  const mockGoal3 = {
    id: 'goal-mot-03',
    goalId: 'goal-mot-03',
    name: 'Fine Motor Pincer Grasp',
    domain: 'Motor Skills',
    targetScore: '90%',
    masteryCriteria: '90% accuracy across 2 sessions',
    status: 'In Progress',
  };

  beforeEach(() => {
    // Reset test student storage
    const caseloadData =
      storage.getJSONSync<Record<string, any>>(CASELOAD_ASSIGNMENTS_STORAGE_KEY, {}) || {};
    delete caseloadData[studentA];
    delete caseloadData[studentB];
    storage.setJSONSync(CASELOAD_ASSIGNMENTS_STORAGE_KEY, caseloadData);

    const draftData = storage.getJSONSync<Record<string, any>>(IUP_DRAFTS_STORAGE_KEY, {}) || {};
    delete draftData[studentA];
    delete draftData[studentB];
    storage.setJSONSync(IUP_DRAFTS_STORAGE_KEY, draftData);

    const libraryData = storage.getJSONSync<any[]>(IUP_LIBRARY_STORAGE_KEY, []) || [];
    const filteredLib = libraryData.filter(
      (i) => i.studentId !== studentA && i.studentId !== studentB,
    );
    storage.setJSONSync(IUP_LIBRARY_STORAGE_KEY, filteredLib);
  });

  it('verifies the full end-to-end workflow from IUP generation through mastery approval and replacement', async () => {
    // 1. Generate & Finalize IUP for Student A with 2 assigned goals
    const finalizePayload = {
      studentId: studentA,
      studentName: 'Alpha Student',
      program: 'Early Intensive Behavioral Intervention',
      slots: {
        station1: [mockGoal1],
        station2: [mockGoal2],
      },
      goals: [mockGoal1, mockGoal2],
      reinforcementSchedule: 'VR-3 token system',
      crisisProtocol: 'Step 1: Redirect, Step 2: Calm room',
      accommodations: 'Visual schedule and noise-canceling headphones',
      reviewCycle: 'Every 90 days',
      customFields: { createdBy: 'PD Integration Test' },
    };

    const finalizedResult = await finalizeIup(studentA, finalizePayload);
    expect(finalizedResult.data.success).toBe(true);
    expect(finalizedResult.data.isFinalized).toBe(true);
    expect(finalizedResult.data.isPermanent).toBe(true);
    expect(finalizedResult.data.editable).toBe(false);

    // 2. Verify IUP Library contains the permanent record
    const libraryRes = await getIupLibrary();
    const studentARecord = libraryRes.data.find((item: any) => item.studentId === studentA);
    expect(studentARecord).toBeDefined();
    expect(studentARecord.status).toBe('Active');
    expect(studentARecord.isFinalized).toBe(true);
    expect(studentARecord.isPermanent).toBe(true);
    expect(studentARecord.editable).toBe(false);
    expect(studentARecord.reinforcementSchedule).toBe('VR-3 token system');
    expect(studentARecord.accommodations).toBe('Visual schedule and noise-canceling headphones');
    expect(studentARecord.crisisProtocol).toBe('Step 1: Redirect, Step 2: Calm room');

    // 3. Verify non-editability: Attempting to modify the finalized record must be rejected
    await expect(
      saveIupDraft(studentA, {
        studentId: studentA,
        program: 'Modified Program Attempt',
        notes: 'Trying to alter a finalized permanent IUP',
      }),
    ).rejects.toThrow(/Unauthorized modification/i);

    // 4. Verify assigned goals in Student Caseload for Student A
    const caseloadA = await getStudentCaseload(studentA);
    expect(caseloadA.data.studentId).toBe(studentA);
    expect(caseloadA.data.slots['station1-0']?.name).toBe(mockGoal1.name);
    expect(caseloadA.data.slots['station2-0']?.name).toBe(mockGoal2.name);

    // Verify isolation: Student B has empty slots and NO leaked default goals
    const caseloadB = await getStudentCaseload(studentB);
    expect(caseloadB.data.slots['station1-0']).toBeNull();
    expect(caseloadB.data.slots['station1-1']).toBeNull();
    expect(caseloadB.data.slots['station2-0']).toBeNull();
    expect(caseloadB.data.slots['station2-1']).toBeNull();

    // 5. Enforce 2-goal maximum per student
    // Student A already has 2 active goals. Trying to assign a 3rd goal to an empty slot must fail.
    await expect(assignGoalToSlot(studentA, { slot: 'station1-1', ...mockGoal3 })).rejects.toThrow(
      /Two-goal limit exceeded/i,
    );

    // Also verify duplicate assignment prevention
    await expect(assignGoalToSlot(studentA, { slot: 'station2-0', ...mockGoal1 })).rejects.toThrow(
      /already assigned/i,
    );

    // 6. Direct goal unassignment when mastery is reached
    const unassigned = unassignApprovedGoalFromCaseload(studentA, mockGoal1.id, mockGoal1.name);
    expect(unassigned).toBe(true);

    // 7. Verify only that student's approved goal is removed
    const postApprovalCaseloadA = await getStudentCaseload(studentA);
    // Goal 1 slot is now vacant
    expect(postApprovalCaseloadA.data.slots['station1-0']).toBeNull();
    // Goal 2 is STILL assigned and intact!
    expect(postApprovalCaseloadA.data.slots['station2-0']?.name).toBe(mockGoal2.name);
    // Student B remains untouched
    const postApprovalCaseloadB = await getStudentCaseload(studentB);
    expect(postApprovalCaseloadB.data.slots['station1-0']).toBeNull();
    expect(postApprovalCaseloadB.data.slots['station2-0']).toBeNull();

    // 8. Replacement Goal Assignment: A slot is now open (active count = 1 < 2)
    const assignReplacementRes = await assignGoalToSlot(studentA, {
      slot: 'station1-0',
      ...mockGoal3,
    });
    expect(assignReplacementRes.data.success).toBe(true);

    const updatedCaseloadA = await getStudentCaseload(studentA);
    expect(updatedCaseloadA.data.slots['station1-0']?.name).toBe(mockGoal3.name);
    expect(updatedCaseloadA.data.slots['station2-0']?.name).toBe(mockGoal2.name);
  });

  it('approveMastery automatically removes approved goal from caseload', async () => {
    // Set up Student A with mockGoal1 in caseload
    await assignGoalToSlot(studentA, { slot: 'station1-0', ...mockGoal1 });
    const initialCaseload = await getStudentCaseload(studentA);
    expect(initialCaseload.data.slots['station1-0']?.name).toBe(mockGoal1.name);

    // Create a pending mastery check in the mastery store for this student and goal
    const testCheckId = `mc-test-${Date.now()}`;
    saveMasteryCheck({
      id: testCheckId,
      studentId: studentA,
      studentName: 'Alpha Student',
      goalId: mockGoal1.id,
      goalName: mockGoal1.name,
      station: 'Station 1',
      dateSubmitted: '2026-03-28',
      status: 'pending',
      primaryTeacher: {
        name: 'Teacher One',
        criteriaMet: '100% across 3 sessions',
      },
      teacherB: {
        name: 'Teacher Two',
        outcome: 'Independent',
      },
    });

    // Approve the mastery check via directorApi
    const approveRes = await approveMastery(testCheckId, {
      notes: 'Mastered with excellence',
      signedBy: 'Dr. Director',
    });
    expect(approveRes.data.success).toBe(true);

    // Verify the approved goal was unassigned from studentA's caseload
    const refreshedCaseload = await getStudentCaseload(studentA);
    expect(refreshedCaseload.data.slots['station1-0']).toBeNull();
  });
});
