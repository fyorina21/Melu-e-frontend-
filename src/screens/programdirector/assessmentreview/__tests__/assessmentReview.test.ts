// src/screens/programdirector/assessmentreview/__tests__/assessmentReview.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import client from '../../../../api/sessionApi';
import {
  scoreColor,
  normalizeStatus,
  normalizeAssessmentItem,
  normalizeAssessmentReport,
  generateAssessmentReportText,
  type AssessmentReport,
} from '../reviewTypes';
import { getAssessmentReport, getAssessmentsForReview, markAssessmentReviewed } from '../../../../api/programDirectorApi';
import { saveStudentAssessmentSubmission } from '../../../../utils/studentLifecycleHelper';
import { saveStorageAssessment } from '../../../assessments/abllsConfigHelper';
import { storage } from '../../../../utils/storage';

describe('Assessment Review types and helpers', () => {
  describe('scoreColor', () => {
    it('returns green for score >= 2', () => {
      expect(scoreColor(2)).toBe('#16A34A');
      expect(scoreColor('3')).toBe('#16A34A');
    });

    it('returns yellow for score 1', () => {
      expect(scoreColor(1)).toBe('#EAB308');
      expect(scoreColor('1')).toBe('#EAB308');
    });

    it('returns red for score 0', () => {
      expect(scoreColor(0)).toBe('#EF4444');
      expect(scoreColor('0')).toBe('#EF4444');
    });

    it('returns gray for undefined/null/NaN', () => {
      expect(scoreColor(null)).toBe('#94A3B8');
      expect(scoreColor(undefined)).toBe('#94A3B8');
      expect(scoreColor('invalid')).toBe('#94A3B8');
    });
  });

  describe('normalizeStatus', () => {
    it('normalizes various status string formats', () => {
      expect(normalizeStatus('not_started')).toBe('Not Started');
      expect(normalizeStatus('notstarted')).toBe('Not Started');
      expect(normalizeStatus('in_progress')).toBe('In Progress');
      expect(normalizeStatus('completed')).toBe('Complete');
      expect(normalizeStatus('approved')).toBe('Reviewed');
      expect(normalizeStatus('reviewed')).toBe('Reviewed');
      expect(normalizeStatus(undefined)).toBe('Not Started');
    });
  });

  describe('normalizeAssessmentItem', () => {
    it('normalizes raw assessment list item correctly', () => {
      const raw = {
        student_id: 'std-10',
        student_name: 'Leo Messi',
        age: 6,
        program_type: 'Early Intervention',
        therapist_name: 'Dr. John',
        status: 'in_progress',
        completion_percentage: 65,
        completed_on: '2026-10-01',
      };

      const item = normalizeAssessmentItem(raw);
      expect(item.studentId).toBe('std-10');
      expect(item.studentName).toBe('Leo Messi');
      expect(item.age).toBe(6);
      expect(item.program).toBe('Early Intervention');
      expect(item.therapist).toBe('Dr. John');
      expect(item.status).toBe('In Progress');
      expect(item.abllsPct).toBe(65);
      expect(item.dateCompleted).toBe('2026-10-01');
    });
  });

  describe('normalizeAssessmentReport', () => {
    it('normalizes full report object with domains and preferences', () => {
      const raw = {
        student: { id: 's-1', name: 'Alice Walker', age: 7, program_type: 'Full Day' },
        assessment: { status: 'completed', completed_on: '2026-09-30' },
        skills: {
          summary: 'High receptive language proficiency',
          domains: [
            {
              domain_code: 'A',
              domain_name: 'Cooperation',
              completed_items: 5,
              total_items: 5,
              items: [{ id: 'A1', description: 'Take reinforcer', score: 2 }],
            },
          ],
        },
        behavior: { summary: 'Low intensity tantrums' },
        preferences: { top_items: ['Bubbles', 'Music'] },
        teacher_notes: 'Responds well to token economy',
      };

      const report = normalizeAssessmentReport(raw);
      expect(report.studentId).toBe('s-1');
      expect(report.studentName).toBe('Alice Walker');
      expect(report.skillsSummary).toBe('High receptive language proficiency');
      expect(report.domainScores).toHaveLength(1);
      expect(report.domainScores[0].code).toBe('A');
      expect(report.preferences).toEqual(['Bubbles', 'Music']);
      expect(report.notes).toBe('Responds well to token economy');
    });
  });

  describe('generateAssessmentReportText', () => {
    it('produces formatted export text', () => {
      const report: AssessmentReport = {
        studentId: 's-1',
        studentName: 'Alice Walker',
        age: 7,
        program: 'Full Day',
        therapyGroup: 'Group 1',
        therapist: 'Ms. Clara',
        status: 'Complete',
        skillsSummary: 'Strong listener.',
        skillsStatus: 'complete',
        domainScores: [
          {
            code: 'A',
            name: 'Cooperation',
            scoredCount: 2,
            total: 2,
            items: [{ id: 'A1', description: 'Cooperation', score: 2 }],
          },
        ],
        behaviorSummary: 'No incidents.',
        behaviorStatus: 'complete',
        preferences: ['Blocks', 'Painting'],
        notes: 'Great worker.',
        dateCompleted: '2026-10-02',
        iupStatus: 'Active',
        reviewNotes: 'Approved for IUP.',
      };

      const text = generateAssessmentReportText(report, new Date('2026-10-09T12:00:00Z'));
      expect(text).toContain("Melu'e Foundation — Assessment Summary Report");
      expect(text).toContain('Student: Alice Walker');
      expect(text).toContain('SKILLS ASSESSMENT (ABLLS)');
      expect(text).toContain('A Cooperation: 2/2 items scored');
      expect(text).toContain('TOP PREFERENCES');
      expect(text).toContain('Blocks, Painting');
    });
  });

  describe('Real Data Assessment Review & Report integration', () => {
    beforeEach(() => {
      vi.spyOn(client, 'get').mockRejectedValue(new Error('Unit test mock network reject'));
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('generates real report from stored assessments without fake dummy fallbacks', async () => {
      const studentId = 'real-stu-888';

      // Save real enrolled student
      storage.setJSONSync('melue_enrolled_students_cache', [
        {
          id: studentId,
          studentId,
          fullName: 'Dawit Mengistu',
          name: 'Dawit Mengistu',
          age: 8,
          program: 'Regular',
          therapyGroup: 'Station 2',
          therapist: 'Bethlehem Tsegaye',
        },
      ]);

      // Record authentic ABLLS assessment scores
      saveStorageAssessment(studentId, {
        scores: {
          A1: 2,
          A2: 2,
          B1: 1,
        },
        progress: 15,
        status: 'in_progress',
      });

      // Record authentic preferences
      storage.setJSONSync(`melue_preference_assessment_${studentId}`, {
        top_items: ['Toy Train', 'Puzzle Map'],
      });

      // Record authentic behavior
      storage.setJSONSync(`melue_behavior_assessment_${studentId}`, {
        status: 'in_progress',
        records: [{ id: 'inc-1', antecedent: 'Transition', behavior: 'Protest' }],
      });

      const { data: report } = await getAssessmentReport(studentId);

      expect(report.student.id).toBe(studentId);
      expect(report.student.name).toBe('Dawit Mengistu');
      expect(report.student.therapist).toBe('Bethlehem Tsegaye');
      expect(report.skills.domains.find((d: any) => d.code === 'A')?.scoredCount).toBe(2);
      expect(report.skills.domains.find((d: any) => d.code === 'B')?.scoredCount).toBe(1);
      expect(report.skills.domains.find((d: any) => d.code === 'C')?.scoredCount).toBe(0);
      expect(report.preferences.top_items).toEqual(['Toy Train', 'Puzzle Map']);
      expect(report.behavior.summary).toContain('1 ABC incident(s) logged');
      expect(report.dateCompleted).toBeNull();

      const { data: reviewList } = await getAssessmentsForReview();
      expect(reviewList.some((s: any) => s.studentId === studentId)).toBe(true);
    });

    it('handles student with no recorded assessments showing authentic empty states rather than fake data', async () => {
      const studentId = 'unassessed-stu-999';

      storage.setJSONSync('melue_enrolled_students_cache', [
        {
          id: studentId,
          fullName: 'Kidus Yohannes',
          name: 'Kidus Yohannes',
          age: 5,
          program: 'Pulled Out',
          therapist: 'Selam Tesfaye',
        },
      ]);

      const { data: report } = await getAssessmentReport(studentId);

      expect(report.student.name).toBe('Kidus Yohannes');
      expect(report.skills.summary).toBe('No skills assessment recorded yet.');
      expect(report.skills.domains.every((d: any) => d.scoredCount === 0)).toBe(true);
      expect(report.behavior.summary).toBe('No behavior assessment recorded.');
      expect(report.preferences.top_items).toEqual([]);
      expect(report.dateCompleted).toBeNull();
    });
    it('accurately derives real student statuses (Not Started, In Progress, Complete, Reviewed) for Assessment Review', async () => {
      // 1. Student A: Not Started
      const studentNotStarted = 'stu-real-not-started';
      // 2. Student B: In Progress (has 35% skills)
      const studentInProgress = 'stu-real-in-progress';
      // 3. Student C: Complete (submitted)
      const studentComplete = 'stu-real-complete';
      // 4. Student D: Reviewed (already reviewed by PD)
      const studentReviewed = 'stu-real-reviewed';

      storage.setJSONSync('melue_enrolled_students_cache', [
        {
          id: studentNotStarted,
          fullName: 'Not Started Student',
          name: 'Not Started Student',
          age: 6,
          program: 'Regular',
          therapist: 'Abeba Tadesse',
        },
        {
          id: studentInProgress,
          fullName: 'In Progress Student',
          name: 'In Progress Student',
          age: 7,
          program: 'Comprehensive',
          therapist: 'Dawit Bekele',
        },
        {
          id: studentComplete,
          fullName: 'Completed Student',
          name: 'Completed Student',
          age: 8,
          program: 'Regular',
          therapist: 'Selam Tesfaye',
        },
        {
          id: studentReviewed,
          fullName: 'Reviewed Student',
          name: 'Reviewed Student',
          age: 9,
          program: 'Comprehensive',
          therapist: 'Bethlehem Tsegaye',
        },
      ]);

      // Student B: save 35% draft skills
      saveStorageAssessment(studentInProgress, {
        progress: 35,
        status: 'in_progress',
      });

      // Student C: save all and submit
      saveStorageAssessment(studentComplete, { progress: 100, status: 'completed' });
      await saveStudentAssessmentSubmission(studentComplete, {
        studentName: 'Completed Student',
      });

      // Student D: save and mark reviewed
      saveStorageAssessment(studentReviewed, { progress: 100, status: 'completed' });
      await saveStudentAssessmentSubmission(studentReviewed, {
        studentName: 'Reviewed Student',
      });
      await markAssessmentReviewed(studentReviewed, { notes: 'Approved for IUP' });

      // Fetch assessments for review
      const { data: list } = await getAssessmentsForReview();

      const itemA = list.find((s: any) => s.studentId === studentNotStarted);
      const itemB = list.find((s: any) => s.studentId === studentInProgress);
      const itemC = list.find((s: any) => s.studentId === studentComplete);
      const itemD = list.find((s: any) => s.studentId === studentReviewed);

      expect(itemA).toBeDefined();
      expect(itemA.status).toBe('Not Started');
      expect(itemA.abllsPct).toBe(0);
      expect(itemA.dateCompleted).toBeNull();
      expect(itemA.therapist).toBe('Abeba Tadesse');

      expect(itemB).toBeDefined();
      expect(itemB.status).toBe('In Progress');
      expect(itemB.abllsPct).toBe(35);
      expect(itemB.dateCompleted).toBeNull();
      expect(itemB.therapist).toBe('Dawit Bekele');

      expect(itemC).toBeDefined();
      expect(itemC.status).toBe('Complete');
      expect(itemC.abllsPct).toBe(100);
      expect(itemC.dateCompleted).toBeTruthy();

      expect(itemD).toBeDefined();
      expect(itemD.status).toBe('Reviewed');
      expect(itemD.reviewNotes).toBe('Approved for IUP');

      // Test status query filtering
      const { data: completeOnly } = await getAssessmentsForReview({ status: 'complete' });
      expect(completeOnly.some((s: any) => s.studentId === studentComplete)).toBe(true);
      expect(completeOnly.some((s: any) => s.studentId === studentNotStarted)).toBe(false);

      const { data: inProgOnly } = await getAssessmentsForReview({ status: 'in_progress' });
      expect(inProgOnly.some((s: any) => s.studentId === studentInProgress)).toBe(true);
      expect(inProgOnly.some((s: any) => s.studentId === studentNotStarted)).toBe(false);

      const { data: reviewedOnly } = await getAssessmentsForReview({ status: 'reviewed' });
      expect(reviewedOnly.some((s: any) => s.studentId === studentReviewed)).toBe(true);
      expect(reviewedOnly.some((s: any) => s.studentId === studentComplete)).toBe(false);
    });

  });
});
