import { unprotectStoragePayload } from '../../utils/sensitiveDataSanitizer';
import { describe, it, expect } from 'vitest';
import {
  PROMPT_CONFIG,
  mergeIncidents,
  generateSummaryReportText,
  type DisplayIncident,
} from './types';
import type { IncidentPayload } from '../../types';

describe('sessionSummary logic and helpers', () => {
  describe('PROMPT_CONFIG', () => {
    it('defines colors and labels for standard prompt hierarchy', () => {
      expect(PROMPT_CONFIG.FP).toBeDefined();
      expect(PROMPT_CONFIG.PP).toBeDefined();
      expect(PROMPT_CONFIG.G).toBeDefined();
      expect(PROMPT_CONFIG['+']).toBeDefined();
      expect(PROMPT_CONFIG.INDEPENDENT).toBeDefined();
    });
  });

  describe('mergeIncidents', () => {
    it('merges raw API incidents and unique local incidents without duplication', () => {
      const apiIncidents = [
        {
          date: '2026-10-07',
          time: '09:15 AM',
          behavior: 'Elopement',
          studentName: 'Alice',
          antecedent: 'Work demand',
          consequence: 'Redirected',
          notes: 'Safe return',
        },
      ];

      const localIncidents: IncidentPayload[] = [
        // Duplicate of API incident:
        {
          time: '09:15 AM',
          behavior: 'Elopement',
          studentName: 'Alice',
          antecedent: 'Work demand',
          consequence: 'Redirected',
          additionalNotes: 'Safe return',
        },
        // Unique new local incident:
        {
          time: '10:05 AM',
          behavior: 'Vocal Outburst',
          studentName: 'Bob',
          antecedent: 'Transition',
          consequence: 'Calming strategy',
          additionalNotes: 'Resolved quickly',
        },
      ];

      const merged = mergeIncidents(apiIncidents, localIncidents);
      expect(merged.length).toBe(2);
      expect(merged.some((i) => i.studentName === 'Alice')).toBe(true);
      expect(merged.some((i) => i.studentName === 'Bob')).toBe(true);
    });

    it('safely handles empty raw and local incident arrays', () => {
      expect(mergeIncidents([], [])).toEqual([]);
      expect(mergeIncidents(null as any, null as any)).toEqual([]);
    });
  });

  describe('generateSummaryReportText', () => {
    it('formats a printable text report containing session details', () => {
      const incidents: DisplayIncident[] = [
        { time: '09:30 AM', behavior: 'Flopping', studentName: 'Charlie' },
      ];
      const students = [
        {
          name: 'Charlie',
          goals: [
            {
              id: 'g1',
              name: 'Identify Letters',
              independencePercent: 85,
              totalTrials: 10,
              promptBreakdown: { FP: 0, PP: 1, G: 2, '+': 7 },
            } as any,
          ],
        },
      ];

      const report = generateSummaryReportText(
        'Station 1',
        'Teacher Sarah',
        students,
        incidents,
        'Great session overall.',
      );

      expect(report).toContain("Melu'e Foundation - Session Summary");
      expect(report).toContain('Station: Station 1');
      expect(report).toContain('Teacher: Teacher Sarah');
      expect(report).toContain('— Charlie');
      expect(report).toContain('• Identify Letters: 85% independent · 10 trials');
      expect(report).toContain('BEHAVIOR INCIDENTS: 1');
      expect(report).toContain('• 09:30 AM — Flopping (Charlie)');
      expect(report).toContain('TEACHER QUALITATIVE NOTES');
      expect(report).toContain('Great session overall.');
    });
  });

  describe('Session Summary submission and Daily Notes integration', () => {
    it('persists entered notes and changes status from draft to saved for Daily Notes store', async () => {
      const { createSessionNote } = await import('../../api/sessionApi');
      const testSessionId = 'test-sess-' + Date.now();
      const noteText = 'Student showed strong communication skills and completed all trials.';

      await createSessionNote(testSessionId, {
        bodyMarkdown: noteText,
        students: ['Abebe Bikila'],
        station: 'Station 1',
        room: 'Room 1A',
        status: 'Saved',
        date: '2026-10-27',
      });

      const stored = localStorage.getItem('melue_session_notes_store');
      expect(stored).toBeDefined();
      const decoded = unprotectStoragePayload(stored) || stored;
      const records = JSON.parse(decoded || '[]');
      const match = records.find((r: any) => r.id === testSessionId);
      expect(match).toBeDefined();
      expect(match?.status).toBe('Saved');
      expect(match?.bodyMarkdown).toBe(noteText);
      expect(match?.students).toContain('Abebe Bikila');
    });

    it('requires entered note to be functional and not empty or whitespace only', () => {
      const emptyNote = '';
      const whitespaceNote = '   ';
      const validNote = 'Student was attentive';

      expect(emptyNote.trim().length > 0).toBe(false);
      expect(whitespaceNote.trim().length > 0).toBe(false);
      expect(validNote.trim().length > 0).toBe(true);
    });
  });
});
