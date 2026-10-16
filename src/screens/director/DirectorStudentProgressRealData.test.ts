import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDirectorStudentProgress } from '../../api/directorApi';
import client from '../../api/sessionApi';
import { saveStorageAssessment } from '../assessments/abllsConfigHelper';
import { saveBehaviorAssessment, savePreferenceAssessment } from '../../api/teacherExtrasApi';
import { storeIupDraftLocally } from '../../api/programDirectorApi';

describe('DirectorStudentProgress Real Data Only', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    vi.restoreAllMocks();
  });

  it('brings only real data and returns empty goals array when no goals exist (NO fake Comprehensive Functional Skills)', async () => {
    const studentId = 'student-no-goals';

    // Mock progress_monitoring returning student profile but NO goals and NO sessions
    vi.spyOn(client, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/progress_monitoring')) {
        return {
          data: {
            student: {
              id: studentId,
              full_name: 'Sara Tesfaye',
              age: 7,
              program_type: 'regular',
            },
            current_goals: [],
            goal_progress_charts: [],
            session_history: { recent_sessions: [] },
            behavior_incident_trends: { total_incidents: 0, recent_incidents: [] },
            assessment_summary: {
              ablls: { status: 'not_started' },
              preference: { status: 'not_started' },
            },
          },
        } as any;
      }
      return { data: {} } as any;
    });

    const { data } = await getDirectorStudentProgress(studentId);

    expect(data.name).toBe('Sara Tesfaye');
    expect(data.age).toBe(7);
    expect(data.program).toBe('Regular');
    // Ensure no fake/dummy goals exist!
    expect(data.goals).toEqual([]);
    expect(data.goals.find((g) => g.name.includes('Comprehensive Functional Skills'))).toBeUndefined();
    // Ensure real empty session history
    expect(data.sessionHistory).toEqual([]);
    // Ensure accurate incident summary
    expect(data.incidentSummary).toBe('No behavior incidents recorded for this student.');
    // Assessments are not started
    expect(data.assessmentSummary.skills).toBe('Not Started');
    expect(data.assessmentSummary.behavior).toBe('Not Started');
    expect(data.assessmentSummary.preferences).toBe('Not Started');
  });

  it('reflects real completed and in-progress assessment statuses from client and server', async () => {
    const studentId = 'student-real-assessments';

    // 1. Mark skills completed (100%)
    saveStorageAssessment(studentId, {
      scores: { A1: 2, A2: 2 },
      progress: 100,
      status: 'completed',
    });

    // 2. Mark behavior in-progress
    await saveBehaviorAssessment(studentId, {
      massAnswers: { M1: 'Frequently' },
      fastAnswers: { F1: true },
      progress: 50,
      status: 'draft',
    });

    // 3. Mark preferences completed
    await savePreferenceAssessment(studentId, {
      items: [{ id: 'item-1', name: 'iPad' }],
      status: 'submitted',
    });

    vi.spyOn(client, 'get').mockResolvedValue({
      data: {
        student: { id: studentId, full_name: 'Dawit Bekele', age: 8, program_type: 'aba_therapy' },
        current_goals: [],
      },
    } as any);

    const { data } = await getDirectorStudentProgress(studentId);

    expect(data.assessmentSummary.skills).toBe('Completed');
    expect(data.assessmentSummary.behavior).toBe('In Progress');
    expect(data.assessmentSummary.preferences).toBe('Completed');
  });

  it('brings real assigned goals from IUP draft and real incident logs', async () => {
    const studentId = 'student-assigned-goals';

    // Assign real goals in IUP draft
    storeIupDraftLocally(studentId, {
      studentId,
      goals: [
        { id: 'g-receptive', name: 'Follow 2-step verbal directions', progress_percent: 65, trend: [20, 45, 65] },
        { id: 'g-motor', name: 'Independent spoon feeding', progress_percent: 85, trend: [50, 70, 85] },
      ],
    });

    // Save real behavior incidents
    await saveBehaviorAssessment(studentId, {
      records: [
        { id: 'inc-1', studentId, trigger: 'Noise', behavior: 'Ear Covering', timestamp: '2026-10-12T09:00:00Z' },
        { id: 'inc-2', studentId, trigger: 'Demand', behavior: 'Tantrum', timestamp: '2026-10-12T10:00:00Z' },
        { id: 'inc-3', studentId, trigger: 'Demand', behavior: 'Tantrum', timestamp: '2026-10-12T11:00:00Z' },
      ],
      status: 'submitted',
    });

    vi.spyOn(client, 'get').mockResolvedValue({
      data: {
        student: { id: studentId, full_name: 'Helen Girmay', age: 5, program_type: 'pulled_out' },
      },
    } as any);

    const { data } = await getDirectorStudentProgress(studentId);

    expect(data.goals.length).toBe(2);
    expect(data.goals[0].name).toBe('Follow 2-step verbal directions');
    expect(data.goals[0].percent).toBe(65);
    expect(data.goals[0].trend).toEqual([20, 45, 65]);
    expect(data.goals[1].name).toBe('Independent spoon feeding');
    expect(data.goals[1].percent).toBe(85);

    // Incident summary correctly counts 3 incidents and finds most frequent
    expect(data.incidentSummary).toContain('3 behavior incidents recorded');
    expect(data.incidentSummary).toContain('Tantrum (2)');
  });

  it('persists and retrieves director internal supervisory notes for the student', async () => {
    const studentId = 'student-notes';

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`melue_director_notes_${studentId}`, 'Clinical review approved for 40-hr weekly program.');
    }

    vi.spyOn(client, 'get').mockResolvedValue({
      data: {
        student: { id: studentId, full_name: 'Yonas T.', age: 6 },
        internal_notes: { notes: [] },
      },
    } as any);

    const { data } = await getDirectorStudentProgress(studentId);
    expect(data.internalNotes).toBe('Clinical review approved for 40-hr weekly program.');
  });
});
