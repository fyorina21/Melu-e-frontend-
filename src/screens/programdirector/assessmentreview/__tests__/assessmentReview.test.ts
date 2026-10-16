// src/screens/programdirector/assessmentreview/__tests__/assessmentReview.test.ts

import { describe, it, expect } from 'vitest';
import {
  scoreColor,
  normalizeStatus,
  normalizeAssessmentItem,
  normalizeAssessmentReport,
  generateAssessmentReportText,
  type AssessmentReport,
} from '../reviewTypes';

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
});
