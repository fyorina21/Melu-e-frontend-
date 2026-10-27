import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAssessmentSummaryDashboard,
  getAssessmentsForReview,
  getAssessmentReport,
} from '../../api/programDirectorApi';
import { getDirectorStudentProgress } from '../../api/directorApi';
import { getStudentProgressOverview } from '../../api/coordinatorApi';
import { getStudentOptions } from '../../api/optionsApi';
import client from '../../api/sessionApi';
import {
  saveStorageAssessment,
} from '../assessments/abllsConfigHelper';
import {
  saveBehaviorAssessment,
  savePreferenceAssessment,
} from '../../api/teacherExtrasApi';
import {
  saveStudentAssessmentSubmission,
  markStudentAssessmentCompleted,
  clearStudentAssessmentCompleted,
  isStoredAssessmentCompleted,
  isStudentAssessmentSubmitted,
} from '../../utils/studentLifecycleHelper';

describe('AssessmentSummaryReport & Student Progress Synchronization', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    vi.restoreAllMocks();
  });

  it('reflects Completed on AssessmentSummaryReport when assessments reach 100% completion in student progress', async () => {
    const studentId = 'student-progress-completed-test';
    clearStudentAssessmentCompleted(studentId);

    // 1. Initially in progress (skills 50%, behavior 30%)
    saveStorageAssessment(studentId, {
      scores: { A1: 2 },
      progress: 50,
      status: 'in_progress',
    });
    await saveBehaviorAssessment(studentId, {
      massAnswers: { M1: 2 },
      progress: 30,
      status: 'draft',
    });

    vi.spyOn(client, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/options/students')) {
        return {
          data: [
            { id: studentId, name: 'Blen Hailu', age: 7, program: 'Comprehensive ABA', status: 'Active' },
          ],
        } as any;
      }
      return { data: {} } as any;
    });

    // In-progress check on AssessmentSummaryReport
    let reportData = await getAssessmentSummaryDashboard(studentId);
    expect(reportData.data.studentInfo.status).not.toBe('completed');
    expect(reportData.data.studentInfo.status).not.toBe('submitted');
    expect(reportData.data.assessmentStatus).toBe('In Progress');

    // 2. Student assessments complete (skills 100% + behavior 100%)
    saveStorageAssessment(studentId, {
      scores: { A1: 2, A2: 2, B1: 3 },
      progress: 100,
      status: 'completed',
    });
    await saveBehaviorAssessment(studentId, {
      massAnswers: { M1: 2, M2: 1 },
      progress: 100,
      status: 'submitted',
    });

    // AssessmentSummaryReport now reflects Completed!
    reportData = await getAssessmentSummaryDashboard(studentId);
    expect(reportData.data.assessmentStatus).toBe('Completed');
    expect(reportData.data.studentInfo.assessmentStatus).toBe('Completed');
    expect(reportData.data.studentInfo.status).toBe('completed');
  });

  it('reflects Completed on Director and Coordinator Student Progress when assessment is completed/submitted', async () => {
    const studentId = 'student-synced-to-progress-test';
    clearStudentAssessmentCompleted(studentId);

    // Explicitly mark or submit assessment
    await saveStudentAssessmentSubmission(studentId, {
      studentName: 'Yonas Tadesse',
      therapist: 'Therapist Jane',
    });
    markStudentAssessmentCompleted(studentId);

    expect(isStudentAssessmentSubmitted(studentId)).toBe(true);
    expect(isStoredAssessmentCompleted(studentId)).toBe(true);

    vi.spyOn(client, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/options/students')) {
        return {
          data: [
            { id: studentId, name: 'Yonas Tadesse', age: 8, program: 'Comprehensive ABA', status: 'Active' },
          ],
        } as any;
      }
      if (url.includes('/progress_monitoring')) {
        return {
          data: {
            student: { id: studentId, full_name: 'Yonas Tadesse', age: 8, program_type: 'Comprehensive ABA' },
            current_goals: [],
            session_history: { recent_sessions: [] },
            behavior_incident_trends: { total_incidents: 0 },
            assessment_summary: {
              ablls: { status: 'in_progress', progress_percentage: 100 },
              preference: { status: 'completed' },
            },
          },
        } as any;
      }
      return { data: {} } as any;
    });

    // 1. Director Student Progress options dropdown reflects Completed
    const studentOpts = await getStudentOptions();
    const optMatch = studentOpts.data.find((s) => s.id === studentId);
    expect(optMatch).toBeDefined();
    expect(optMatch?.assessmentStatus).toBe('Completed');

    // 2. Director Student Progress clinical assessment summary reflects Completed
    const directorProgress = await getDirectorStudentProgress(studentId);
    expect(directorProgress.data.assessmentSummary.skills).toBe('Completed');
    expect(directorProgress.data.assessmentSummary.behavior).toBe('Completed');
    expect(directorProgress.data.assessmentSummary.preferences).toBe('Completed');

    // 3. Coordinator Student Progress reflects Completed
    const coordProgress = await getStudentProgressOverview(studentId);
    expect(coordProgress.data.assessmentSummary.skills).toBe('Completed');
    expect(coordProgress.data.assessmentSummary.behavior).toBe('Completed');
    expect(coordProgress.data.assessmentSummary.preferences).toBe('Completed');

    // 4. Assessment Summary Report reflects Completed
    const reportData = await getAssessmentSummaryDashboard(studentId);
    expect(reportData.data.assessmentStatus).toBe('Completed');
    expect(reportData.data.studentInfo.assessmentStatus).toBe('Completed');
  });

  it('reflects Completed on AssessmentSummaryReport when server progress_monitoring returns completed ablls', async () => {
    const studentId = 'student-backend-progress-completed';
    clearStudentAssessmentCompleted(studentId);

    vi.spyOn(client, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/options/students')) {
        return {
          data: [
            { id: studentId, name: 'Abebe Bikila', age: 9, program: 'Comprehensive ABA', status: 'Active' },
          ],
        } as any;
      }
      if (url.includes('/progress_monitoring')) {
        return {
          data: {
            student: { id: studentId, full_name: 'Abebe Bikila', age: 9, program_type: 'Comprehensive ABA' },
            assessment_summary: {
              ablls: { status: 'completed', progress_percentage: 100 },
            },
          },
        } as any;
      }
      return { data: {} } as any;
    });

    const reportData = await getAssessmentSummaryDashboard(studentId);
    expect(reportData.data.assessmentStatus).toBe('Completed');
    expect(reportData.data.studentInfo.assessmentStatus).toBe('Completed');
    expect(reportData.data.studentInfo.status).toBe('completed');
  });

  it('ensures student jjjj jjjjjj says Complete/Completed across AssessmentReview, AssessmentSummaryReport, and Student Progress', async () => {
    const studentId = 'student-jjjj-id';
    const studentName = 'jjjj jjjjjj';

    vi.spyOn(client, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/options/students')) {
        return {
          data: [
            { id: studentId, name: studentName, age: 7, program: 'Comprehensive ABA', status: 'Active' },
          ],
        } as any;
      }
      if (url.includes('/coordinator/students')) {
        return {
          data: [
            { id: studentId, fullName: studentName, age: 7, programType: 'Comprehensive ABA', status: 'Active' },
          ],
        } as any;
      }
      if (url.includes('/program_director/assessments')) {
        return {
          data: [
            {
              id: studentId,
              student_id: studentId,
              student_name: studentName,
              status: 'Complete',
              abllsPct: 100,
            },
          ],
        } as any;
      }
      if (url.includes('/progress_monitoring')) {
        return {
          data: {
            student: { id: studentId, full_name: studentName, age: 7, program_type: 'Comprehensive ABA' },
            assessment_summary: {
              ablls: { status: 'completed', progress_percentage: 100 },
            },
          },
        } as any;
      }
      return { data: {} } as any;
    });

    // 1. AssessmentSummaryReport page check
    const summaryData = await getAssessmentSummaryDashboard(studentId);
    expect(summaryData.data.assessmentStatus).toBe('Completed');
    expect(summaryData.data.studentInfo.assessmentStatus).toBe('Completed');

    // 2. AssessmentReview page check
    const reviewData = await getAssessmentsForReview();
    const jjjjReviewItem = reviewData.data.find(
      (item: any) => item.studentId === studentId || item.studentName === studentName,
    );
    expect(jjjjReviewItem).toBeDefined();
    expect(jjjjReviewItem?.status).toBe('Complete');
    expect(jjjjReviewItem?.abllsPct).toBe(100);

    // 3. AssessmentReview report modal check
    const reportRes = await getAssessmentReport(studentId);
    expect(reportRes.data.status).toBe('Complete');

    // 4. Director Student Progress options check
    const studentOpts = await getStudentOptions();
    const optMatch = studentOpts.data.find((s) => s.id === studentId || s.name === studentName);
    expect(optMatch?.assessmentStatus).toBe('Completed');

    // 5. Director Student Progress check
    const directorProgress = await getDirectorStudentProgress(studentId);
    expect(directorProgress.data.assessmentSummary.skills).toBe('Completed');

    // 6. Coordinator Student Progress check
    const coordProgress = await getStudentProgressOverview(studentId);
    expect(coordProgress.data.assessmentSummary.skills).toBe('Completed');
  });
});
