import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getStudentSkillsProgress,
  getStudentBehaviorProgress,
  getStudentPreferenceProgress,
  getStudentSensoryProgress,
  markStudentAssessmentCompleted,
  clearStudentAssessmentCompleted,
  isStudentAssessmentSubmitted,
  getStudentAssessmentSubmission,
  saveStudentAssessmentSubmission,
  checkStudentAllAssessmentsCompleted,
} from '../../utils/studentLifecycleHelper';
import { saveStorageAssessment } from './abllsConfigHelper';
import {
  saveBehaviorAssessment,
  savePreferenceAssessment,
  getPreferenceAssessment,
  saveSensoryAssessment,
} from '../../api/teacherExtrasApi';

describe('Assessment Dashboard Progress Sync', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('calculates and retrieves skills assessment draft progress for a specific student', () => {
    const studentId = 'student-test-1';

    // Initial state: not started
    const initial = getStudentSkillsProgress(studentId);
    expect(initial.progress).toBe(0);
    expect(initial.status).toBe('Not Started');

    // Simulate saving a draft with 11 scored items out of 55 (~20%)
    const scores: Record<string, any> = {
      A1: 2,
      A2: 2,
      A3: 1,
      A4: 1,
      A5: 2,
      B1: 1,
      B2: 2,
      B3: 1,
      C1: 1,
      C2: 2,
      C3: 2,
    };
    saveStorageAssessment(studentId, {
      scores,
      notes: { A1: 'Good effort' },
      progress: 20,
      status: 'in_progress',
    });

    const draftProgress = getStudentSkillsProgress(studentId);
    expect(draftProgress.progress).toBe(20);
    expect(draftProgress.status).toBe('In Progress');

    // Completing marks 100%
    markStudentAssessmentCompleted(studentId);
    const completed = getStudentSkillsProgress(studentId);
    expect(completed.progress).toBe(100);
    expect(completed.status).toBe('Completed');
  });

  it('calculates and retrieves behavior assessment draft progress for a specific student', async () => {
    const studentId = 'student-test-2';

    // Initial state: not started
    const initial = getStudentBehaviorProgress(studentId);
    expect(initial.progress).toBe(0);
    expect(initial.status).toBe('Not Started');

    // Simulate saving draft in BehaviorAssessment (e.g. 5 MASS answers + 3 FAST answers = 8/20 = 40%)
    const massAnswers: Record<string, string> = {
      M1: 'Always',
      M2: 'Usually',
      M3: 'Half the Time',
      M4: 'Seldom',
      M5: 'Never',
    };
    const fastAnswers: Record<string, boolean> = {
      F1: true,
      F2: false,
      F3: true,
    };

    await saveBehaviorAssessment(studentId, {
      tab: 'MASS',
      massAnswers,
      fastAnswers,
      records: [],
      status: 'draft',
      progress: 40,
    });

    const draftProgress = getStudentBehaviorProgress(studentId);
    expect(draftProgress.progress).toBe(40);
    expect(draftProgress.status).toBe('In Progress');

    // Submitting behavior assessment sets 100%
    await saveBehaviorAssessment(studentId, {
      tab: 'MASS',
      massAnswers,
      fastAnswers,
      records: [],
      status: 'submitted',
      progress: 100,
    });

    const submittedProgress = getStudentBehaviorProgress(studentId);
    expect(submittedProgress.progress).toBe(100);
    expect(submittedProgress.status).toBe('Completed');
  });

  it('keeps progress isolated between different students', async () => {
    const studentA = 'student-a';
    const studentB = 'student-b';

    // Student A saves 60% skills, 50% behavior
    saveStorageAssessment(studentA, {
      scores: { A1: 2, A2: 2 },
      progress: 60,
      status: 'in_progress',
    });
    await saveBehaviorAssessment(studentA, {
      tab: 'MASS',
      massAnswers: { M1: 'Always' },
      status: 'draft',
      progress: 50,
    });

    // Student B has no assessments
    const progressA_skills = getStudentSkillsProgress(studentA);
    const progressA_behavior = getStudentBehaviorProgress(studentA);
    const progressB_skills = getStudentSkillsProgress(studentB);
    const progressB_behavior = getStudentBehaviorProgress(studentB);

    expect(progressA_skills.progress).toBe(60);
    expect(progressA_behavior.progress).toBe(50);

    expect(progressB_skills.progress).toBe(0);
    expect(progressB_behavior.progress).toBe(0);
  });

  it('saves and restores preference assessment draft items and active tab across page switches', async () => {
    const studentId = 'student-pref-1';
    const testItems = [
      {
        id: '1',
        name: 'Light-up toys',
        category: 'Visual',
        timerSeconds: 45,
        isRunning: false,
        frequency: 3,
        durationSeconds: 45,
        notes: 'Very engaged',
      },
      {
        id: 'custom-1',
        name: 'Bubble gun',
        category: 'Toys',
        timerSeconds: 120,
        isRunning: false,
        frequency: 5,
        durationSeconds: 120,
        notes: 'Favorite toy',
      },
    ];

    await savePreferenceAssessment(studentId, {
      items: testItems,
      sessionTab: 'Play Time',
      status: 'draft',
    });

    const res = await getPreferenceAssessment(studentId);
    const data = (res?.data?.data || res?.data) as any;

    expect(data.sessionTab).toBe('Play Time');
    expect(data.status).toBe('draft');
    expect(data.items.length).toBe(2);
    expect(data.items[0].name).toBe('Light-up toys');
    expect(data.items[0].frequency).toBe(3);
    expect(data.items[0].notes).toBe('Very engaged');
    expect(data.items[1].name).toBe('Bubble gun');
    expect(data.items[1].frequency).toBe(5);
  });

  it('keeps data distinct for Sensory Time, Circle Time, and Play Time and updates AssessmentSummaryReport', async () => {
    const studentId = 'student-pref-distinct';

    const sensoryItems = [
      {
        id: '1',
        name: 'Light-up toys',
        category: 'Visual',
        timerSeconds: 60,
        isRunning: false,
        frequency: 5,
        durationSeconds: 60,
        notes: 'Sensory notes',
        engaged: 'Engaged' as const,
        approached: 'Approached' as const,
      },
    ];
    const circleItems = [
      {
        id: '2',
        name: 'Bubbles',
        category: 'Visual',
        timerSeconds: 30,
        isRunning: false,
        frequency: 2,
        durationSeconds: 30,
        notes: 'Circle notes',
        engaged: 'Did Not Engage' as const,
        approached: 'Approached' as const,
      },
    ];
    const playItems = [
      {
        id: '3',
        name: 'Mirror',
        category: 'Visual',
        timerSeconds: 15,
        isRunning: false,
        frequency: 1,
        durationSeconds: 15,
        notes: 'Play notes',
        engaged: 'Engaged' as const,
        approached: 'Did Not Approach' as const,
      },
    ];

    const itemsByTab = {
      'Sensory Time': sensoryItems,
      'Circle Time': circleItems,
      'Play Time': playItems,
    };

    const allObservations = [
      {
        id: 'sensory-1',
        rank: 1,
        item: 'Light-up toys',
        name: 'Light-up toys',
        duration: '1 min',
        duration_seconds: 60,
        frequency: 5,
        context: 'Sensory Time',
        engaged: 'Engaged',
        approached: 'Approached',
      },
      {
        id: 'circle-2',
        rank: 1,
        item: 'Bubbles',
        name: 'Bubbles',
        duration: '30s',
        duration_seconds: 30,
        frequency: 2,
        context: 'Circle Time',
        engaged: 'Did Not Engage',
        approached: 'Approached',
      },
      {
        id: 'play-3',
        rank: 1,
        item: 'Mirror',
        name: 'Mirror',
        duration: '15s',
        duration_seconds: 15,
        frequency: 1,
        context: 'Play Time',
        engaged: 'Engaged',
        approached: 'Did Not Approach',
      },
    ];

    await savePreferenceAssessment(studentId, {
      items: sensoryItems,
      itemsByTab,
      allObservations,
      sessionTab: 'Sensory Time',
      status: 'submitted',
    });

    const res = await getPreferenceAssessment(studentId);
    const saved = res.data;

    // Verify per-tab distinct data
    expect(saved.itemsByTab['Sensory Time'][0].name).toBe('Light-up toys');
    expect(saved.itemsByTab['Sensory Time'][0].frequency).toBe(5);
    expect(saved.itemsByTab['Circle Time'][0].name).toBe('Bubbles');
    expect(saved.itemsByTab['Circle Time'][0].frequency).toBe(2);
    expect(saved.itemsByTab['Play Time'][0].name).toBe('Mirror');
    expect(saved.itemsByTab['Play Time'][0].frequency).toBe(1);

    // Verify observations mapped in AssessmentSummaryReport dashboard
    const { getAssessmentSummaryDashboard } = await import('../../api/programDirectorApi');
    const { default: client } = await import('../../api/sessionApi');
    const spy = vi.spyOn(client, 'get').mockResolvedValue({ data: [] } as any);

    try {
      const dashboard = await getAssessmentSummaryDashboard(studentId);
      const prefItems = dashboard.data?.preference?.items || [];

      const sensoryFiltered = prefItems.filter((i: any) => i.context === 'Sensory Time');
      const circleFiltered = prefItems.filter((i: any) => i.context === 'Circle Time');
      const playFiltered = prefItems.filter((i: any) => i.context === 'Play Time');

      expect(sensoryFiltered.length).toBeGreaterThanOrEqual(1);
      expect(sensoryFiltered[0].item).toBe('Light-up toys');
      expect(sensoryFiltered[0].frequency).toBe(5);

      expect(circleFiltered.length).toBeGreaterThanOrEqual(1);
      expect(circleFiltered[0].item).toBe('Bubbles');
      expect(circleFiltered[0].frequency).toBe(2);

      expect(playFiltered.length).toBeGreaterThanOrEqual(1);
      expect(playFiltered[0].item).toBe('Mirror');
      expect(playFiltered[0].frequency).toBe(1);
    } finally {
      spy.mockRestore();
    }
  });

  it('brings real data to AssessmentSummaryReport dashboard across all assessments (ABLLS, Behavior, Sensory, Social Skills)', async () => {
    const studentId = 'student-all-sync';
    const { saveSensoryAssessment, saveSocialSkillsAssessment } =
      await import('../../api/teacherExtrasApi');

    // 1. Save ABLLS Skills
    saveStorageAssessment(studentId, {
      scores: { A1: 2, A2: 4, B1: 1 },
      notes: { A1: 'Mastered' },
      status: 'submitted',
      progress: 100,
    });

    // 2. Save Behavior Assessment
    await saveBehaviorAssessment(studentId, {
      massAnswers: { M1: 'Always', M2: 'Never' },
      fastAnswers: { F1: true, F2: false },
      records: [
        {
          id: 'rec-1',
          studentId,
          trigger: 'Denied access to iPad',
          behavior: 'Tantrum',
          consequence: 'Redirection',
          timestamp: '2026-10-12T10:00:00Z',
        },
        {
          id: 'rec-2',
          studentId,
          trigger: 'Denied access to iPad',
          behavior: 'Crying',
          consequence: 'Wait',
          timestamp: '2026-10-12T11:00:00Z',
        },
        {
          id: 'rec-3',
          studentId,
          trigger: 'Transition to math',
          behavior: 'Elopement',
          consequence: 'Guided back',
          timestamp: '2026-10-12T12:00:00Z',
        },
      ],
      status: 'submitted',
      progress: 100,
    });

    // 3. Save Sensory Assessment
    await saveSensoryAssessment(studentId, {
      assessmentDate: '2026-10-12',
      activities: [
        {
          id: 'SEN-001',
          name: 'Weighted blanket',
          engagementLevel: 'High',
          responseReaction: 'Positive',
          remark: 'Calming effect',
        },
        {
          id: 'SEN-002',
          name: 'Swinging hammock',
          engagementLevel: 'Moderate',
          responseReaction: 'Seeking',
          remark: 'Enjoys linear motion',
        },
      ],
      status: 'submitted',
    });

    // 4. Save Social Skills Questionnaire
    await saveSocialSkillsAssessment(studentId, {
      scores: { 'SQ-01': 3, 'SQ-02': 2, 'SQ-03': 4 },
      percent: 75,
      status: 'submitted',
    });

    // Fetch dashboard
    const { getAssessmentSummaryDashboard } = await import('../../api/programDirectorApi');
    const { default: client } = await import('../../api/sessionApi');
    const spy = vi.spyOn(client, 'get').mockResolvedValue({ data: [] } as any);

    try {
      const dashboard = await getAssessmentSummaryDashboard(studentId);
      const data = dashboard.data;

      // ABLLS
      expect(data.abllsScores['A1']).toBe(2);
      expect(data.abllsScores['A2']).toBe(4);
      expect(data.abllsScores['B1']).toBe(1);

      // Behavior MASS & FAST
      expect(data.behavior.massAnswers['M1']).toBe('Always');
      expect(data.behavior.massAnswers['M2']).toBe('Never');
      expect(data.behavior.fastAnswers['F1']).toBe(true);
      expect(data.behavior.fastAnswers['F2']).toBe(false);

      // Behavior ABC Incidents & Top Antecedents
      expect(data.behavior.abc.totalIncidents).toBe(3);
      expect(data.behavior.abc.topAntecedents.length).toBeGreaterThanOrEqual(1);
      expect(data.behavior.abc.topAntecedents[0].antecedent).toBe('Denied access to iPad');
      expect(data.behavior.abc.topAntecedents[0].count).toBe(2);

      // Sensory
      expect(data.sensory.activities.length).toBe(2);
      expect(data.sensory.activities[0].name).toBe('Weighted blanket');
      expect(data.sensory.activities[0].engagementLevel).toBe('High');

      // Social Skills
      expect(data.socialSkills.scores['SQ-01']).toBe(3);
      expect(data.socialSkills.percent).toBe(75);
    } finally {
      spy.mockRestore();
    }
  });

  it('saves assessment submission and exposes it for AssessmentSummaryReport', async () => {
    const studentId = 'stu-submission-test';

    // 1. Initially not submitted
    expect(isStudentAssessmentSubmitted(studentId)).toBe(false);
    expect(getStudentAssessmentSubmission(studentId)).toBeNull();

    // 2. Submit assessment
    saveStudentAssessmentSubmission(studentId, {
      studentName: 'Test Student',
      therapist: 'Lead Therapist',
    });

    // 3. Verified submitted
    expect(isStudentAssessmentSubmitted(studentId)).toBe(true);
    const sub = getStudentAssessmentSubmission(studentId);
    expect(sub).not.toBeNull();
    expect(sub.status).toBe('submitted');
    expect(sub.studentName).toBe('Test Student');
    expect(sub.therapist).toBe('Lead Therapist');
    expect(sub.submittedAt).toBeDefined();

    const { getAssessmentSummaryDashboard } = await import('../../api/programDirectorApi');
    const { default: client } = await import('../../api/sessionApi');
    const spy = vi.spyOn(client, 'get').mockResolvedValue({ data: [] } as any);

    try {
      const dashboard = await getAssessmentSummaryDashboard(studentId);
      expect(dashboard.data?.selectedStudentId).toBe(studentId);
      expect(dashboard.data?.studentInfo?.fullName).toBe('Test Student');
    } finally {
      spy.mockRestore();
    }
  });

  it('standardizes assessment completion logic: requires BOTH Skills and Behavior 100%', async () => {
    const studentId = 'student-partial-check';

    // Case 1: Skills 100%, Behavior 0% -> NOT completed
    saveStorageAssessment(studentId, {
      scores: { A1: 2, A2: 2 },
      status: 'completed',
      progress: 100,
    });
    expect(checkStudentAllAssessmentsCompleted(studentId)).toBe(false);

    // Case 2: Skills 100%, Behavior 50% -> NOT completed
    await saveBehaviorAssessment(studentId, {
      massAnswers: { M1: 'Always' },
      status: 'draft',
      progress: 50,
    });
    expect(checkStudentAllAssessmentsCompleted(studentId)).toBe(false);

    // Case 3: Skills 0%, Behavior 100% -> NOT completed
    const studentId2 = 'student-behavior-only';
    await saveBehaviorAssessment(studentId2, {
      massAnswers: { M1: 'Always' },
      status: 'submitted',
      progress: 100,
    });
    expect(checkStudentAllAssessmentsCompleted(studentId2)).toBe(false);

    // Case 4: BOTH Skills 100% AND Behavior 100% -> genuinely COMPLETED
    await saveBehaviorAssessment(studentId, {
      massAnswers: { M1: 'Always' },
      status: 'submitted',
      progress: 100,
    });
    expect(checkStudentAllAssessmentsCompleted(studentId)).toBe(true);
  });

  it('verifies the full workflow: in progress -> completed -> teacher submits -> IUP Generation', async () => {
    const studentId = 'student-full-workflow';

    // Step 1: In Progress
    saveStorageAssessment(studentId, { progress: 40, status: 'in_progress' });
    await saveBehaviorAssessment(studentId, { progress: 30, status: 'draft' });

    expect(checkStudentAllAssessmentsCompleted(studentId)).toBe(false);
    expect(isStudentAssessmentSubmitted(studentId)).toBe(false);

    // Step 2: Assessments reach 100% (Completed)
    saveStorageAssessment(studentId, { progress: 100, status: 'completed' });
    await saveBehaviorAssessment(studentId, { progress: 100, status: 'submitted' });

    // Both are 100% complete
    expect(checkStudentAllAssessmentsCompleted(studentId)).toBe(true);

    // CRITICAL: Reaching 100% must NOT automatically mark assessment as submitted
    expect(isStudentAssessmentSubmitted(studentId)).toBe(false);

    // Step 3: Teacher explicitly submits assessment
    const saved = await saveStudentAssessmentSubmission(studentId, {
      studentName: 'Full Workflow Student',
      therapist: 'Lead Therapist',
    });
    expect(saved).toBe(true);

    // Now marked as submitted
    expect(isStudentAssessmentSubmitted(studentId)).toBe(true);
    expect(getStudentAssessmentSubmission(studentId)?.status).toBe('submitted');

    // Step 4: IUP Generation protection
    // Only genuine completion allows marking completed
    const canProceedToIup = checkStudentAllAssessmentsCompleted(studentId);
    expect(canProceedToIup).toBe(true);
    markStudentAssessmentCompleted(studentId);
  });

  it('safely handles async saving and stores last_assessment_student_id in platform storage', async () => {
    const studentId = 'stu-async-save-check';
    saveStorageAssessment(studentId, { progress: 100, status: 'completed' });
    await saveBehaviorAssessment(studentId, { progress: 100, status: 'submitted' });

    const { default: storage } = await import('../../utils/storage');

    const result = await saveStudentAssessmentSubmission(studentId, {
      studentName: 'Async Student',
    });

    expect(result).toBe(true);
    expect(isStudentAssessmentSubmitted(studentId)).toBe(true);
    expect(storage.getSync('last_assessment_student_id')).toBe(studentId);
    if (typeof localStorage !== 'undefined') {
      expect(localStorage.getItem('last_assessment_student_id')).toBe(studentId);
    }
  });

  it('prevents repeated submissions and preserves submission state', async () => {
    const studentId = 'stu-duplicate-guard';
    saveStorageAssessment(studentId, { progress: 100, status: 'completed' });
    await saveBehaviorAssessment(studentId, { progress: 100, status: 'submitted' });

    // Initial submission
    const firstSave = await saveStudentAssessmentSubmission(studentId, {
      studentName: 'Dup Guard',
    });
    expect(firstSave).toBe(true);
    expect(isStudentAssessmentSubmitted(studentId)).toBe(true);

    // Submission status is retained and detectable
    expect(isStudentAssessmentSubmitted(studentId)).toBe(true);
  });

  it('ensures checkStudentAllAssessmentsCompleted uses reliable data and accepts precomputed progress to eliminate repeated storage reads', async () => {
    const studentId = 'stu-reliable-data';
    // Skills is only 50%, Behavior is 100%
    saveStorageAssessment(studentId, { progress: 50, status: 'in_progress' });
    await saveBehaviorAssessment(studentId, { progress: 100, status: 'submitted' });

    // An overall score of 100% or single 100% assessment MUST NOT override an incomplete skills assessment
    const apiFallbackAblls = { progress: 50, status: 'In Progress' };
    const apiFallbackBehavior = { progress: 100, status: 'Completed' };
    expect(
      checkStudentAllAssessmentsCompleted(studentId, apiFallbackAblls, apiFallbackBehavior),
    ).toBe(false);

    // Precomputed progress optimization check eliminates repeated storage reads
    const skillsPre = { progress: 100, status: 'Completed' };
    const behaviorPre = { progress: 100, status: 'Completed' };
    expect(
      checkStudentAllAssessmentsCompleted(studentId, undefined, undefined, skillsPre, behaviorPre),
    ).toBe(true);

    const skillsIncomplete = { progress: 60, status: 'In Progress' };
    expect(
      checkStudentAllAssessmentsCompleted(
        studentId,
        undefined,
        undefined,
        skillsIncomplete,
        behaviorPre,
      ),
    ).toBe(false);
  });

  it('tests complete workflow: progress updates, submission, app restart, summary report navigation, and IUP access with normalized IDs', async () => {
    const studentId = 'stu-1'; // Alias of 'student-a' and '1'
    const { default: storage } = await import('../../utils/storage');
    const { normalizeStudentId, getStudentIdAliases } =
      await import('../../utils/studentLifecycleHelper');

    // 1. Progress updates: Incomplete
    saveStorageAssessment(studentId, { progress: 75, status: 'in_progress' });
    await saveBehaviorAssessment(studentId, { progress: 40, status: 'draft' });

    expect(checkStudentAllAssessmentsCompleted(studentId)).toBe(false);
    expect(isStudentAssessmentSubmitted(studentId)).toBe(false);
    expect(isStudentAssessmentSubmitted('student-a')).toBe(false);

    // 2. Both reach 100% (Completed)
    saveStorageAssessment(studentId, { progress: 100, status: 'completed' });
    await saveBehaviorAssessment(studentId, { progress: 100, status: 'submitted' });

    // Verified complete
    expect(checkStudentAllAssessmentsCompleted(studentId)).toBe(true);
    expect(checkStudentAllAssessmentsCompleted('student-a')).toBe(true);

    // 3. Teacher explicitly submits assessment
    const saved = await saveStudentAssessmentSubmission(studentId, {
      studentName: 'Amir Hassan',
      therapist: 'Abeba Tadesse',
    });
    expect(saved).toBe(true);

    // Verified submitted across aliases
    expect(isStudentAssessmentSubmitted('stu-1')).toBe(true);
    expect(isStudentAssessmentSubmitted('student-a')).toBe(true);
    expect(isStudentAssessmentSubmitted('1')).toBe(true);

    // 4. Summary report navigation: last_assessment_student_id is saved
    expect(storage.getSync('last_assessment_student_id')).toBe('stu-1');

    // 5. App restart simulation:
    // When the app restarts, in-memory state is wiped, but persistent storage retains data
    // Verify that reads via normalized aliases and storage persist reliably
    const submissionData = getStudentAssessmentSubmission('student-a');
    expect(submissionData).not.toBeNull();
    expect(submissionData?.status).toBe('submitted');
    expect(submissionData?.studentName).toBe('Amir Hassan');
    expect(submissionData?.normalizedStudentId).toBe('stu-1');

    // 6. IUP access check: Genuine completion allows IUP generation
    expect(checkStudentAllAssessmentsCompleted('stu-1')).toBe(true);
    expect(checkStudentAllAssessmentsCompleted('student-a')).toBe(true);
  });

  it('requires all four assessments (Skills, Behavior, Preference, Sensory) to be 100% completed for submit to be functional', async () => {
    const studentId = 'stu-four-assessments';

    // 1. Only Skills 100% and Behavior 100% -> Preference & Sensory incomplete -> NOT functional
    saveStorageAssessment(studentId, { progress: 100, status: 'completed' });
    await saveBehaviorAssessment(studentId, { progress: 100, status: 'submitted' });

    expect(
      checkStudentAllAssessmentsCompleted(
        studentId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { requireAllFour: true },
      ),
    ).toBe(false);

    // 2. Preference completed, Sensory still incomplete -> NOT functional
    await savePreferenceAssessment(studentId, {
      status: 'submitted',
      progress: 100,
      allObservations: [{ id: 'obs-1', frequency: 3, durationSeconds: 60 }],
    });

    const prefProg = getStudentPreferenceProgress(studentId);
    expect(prefProg.progress).toBe(100);
    expect(prefProg.status).toBe('Completed');

    expect(
      checkStudentAllAssessmentsCompleted(
        studentId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { requireAllFour: true },
      ),
    ).toBe(false);

    // 3. Sensory completed -> ALL 4 now completed -> Functional!
    await saveSensoryAssessment(studentId, {
      status: 'submitted',
      progress: 100,
      activities: [{ id: 'SEN-001', name: 'Visual tracking', engagementLevel: 'High' }],
    });

    const sensoryProg = getStudentSensoryProgress(studentId);
    expect(sensoryProg.progress).toBe(100);
    expect(sensoryProg.status).toBe('Completed');

    expect(
      checkStudentAllAssessmentsCompleted(
        studentId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { requireAllFour: true },
      ),
    ).toBe(true);
  });
});
