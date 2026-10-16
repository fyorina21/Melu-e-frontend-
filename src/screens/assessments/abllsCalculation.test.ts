// src/screens/assessments/abllsCalculation.test.ts

import { describe, it, expect } from 'vitest';
import { computeAbllsSummaryData, computePriorityAreas } from './abllsCalculationHelper';
import { generateAbllsExportHtml } from './abllsExportHelper';
import type { AbllsDomainDef } from './abllsConfigHelper';

describe('ABLLS Calculation & Export Helpers', () => {
  const mockDomains: AbllsDomainDef[] = [
    {
      code: 'A',
      name: 'Cooperation & Reinforcer Effectiveness',
      items: [
        { id: 'A1', description: 'Take reinforcer', maxCells: 2 },
        { id: 'A2', description: 'Take reinforcer from common table', maxCells: 2 },
        { id: 'A3', description: 'Look at instructor', maxCells: 2 },
      ],
    },
    {
      code: 'B',
      name: 'Visual Performance',
      items: [
        { id: 'B1', description: 'Match objects', maxCells: 4 },
        { id: 'B2', description: 'Match pictures', maxCells: 4 },
      ],
    },
  ];

  describe('computeAbllsSummaryData', () => {
    it('computes domain summary statistics based on scores correctly', () => {
      const scores = {
        A1: 2,
        A2: 1,
        A3: 0,
        B1: 2,
        B2: 'NA',
      } as any;

      const summary = computeAbllsSummaryData(mockDomains, scores);
      expect(summary).toHaveLength(2);

      // Domain A: 3 items (A1: 2, A2: 1, A3: 0) -> c0=1, c1=1, c2=1, cNA=0, validTotal=3, masteredPct=33%
      expect(summary[0].code).toBe('A');
      expect(summary[0].c0).toBe(1);
      expect(summary[0].c1).toBe(1);
      expect(summary[0].c2).toBe(1);
      expect(summary[0].cNA).toBe(0);
      expect(summary[0].masteredPct).toBe(33);

      // Domain B: 2 items (B1: 2, B2: NA) -> c0=0, c1=0, c2=1, cNA=1, validTotal=1, masteredPct=100%
      expect(summary[1].code).toBe('B');
      expect(summary[1].c0).toBe(0);
      expect(summary[1].c1).toBe(0);
      expect(summary[1].c2).toBe(1);
      expect(summary[1].cNA).toBe(1);
      expect(summary[1].masteredPct).toBe(100);
    });
  });

  describe('computePriorityAreas', () => {
    it('ranks priority domains based on c0 descending, then c1', () => {
      const fourDomains: AbllsDomainDef[] = [
        ...mockDomains,
        { code: 'C', name: 'Receptive Language', items: [{ id: 'C1', description: 'C1' }] },
        { code: 'D', name: 'Motor Play', items: [{ id: 'D1', description: 'D1' }] },
      ];
      const summary = computeAbllsSummaryData(fourDomains, {
        A1: 0,
        A2: 0,
        B1: 2,
        C1: 1,
        D1: 2,
      } as any);

      const { priorityAreas, priorityNames, rows } = computePriorityAreas(summary);
      expect(priorityAreas.length).toBe(3);
      expect(priorityAreas[0].name).toBe('Cooperation & Reinforcer Effectiveness');
      expect(priorityNames.has('Cooperation & Reinforcer Effectiveness')).toBe(true);
      expect(rows[0].isPriority).toBe(true);
      expect(rows[3].isPriority).toBe(false);
    });
  });

  describe('generateAbllsExportHtml', () => {
    it('generates a full printable HTML document with student name and domain towers', () => {
      const summary = computeAbllsSummaryData(mockDomains, {
        A1: 2,
        A2: 1,
        A3: 0,
      } as any);

      const html = generateAbllsExportHtml({
        studentName: 'Leo Messi',
        age: 6,
        summaryData: summary,
      });

      expect(html).toContain('Leo Messi');
      expect(html).toContain('Age:</strong> 6');
      expect(html).toContain('Cooperation & Reinforcer Effectiveness');
      expect(html).toContain('tower-col');
      expect(html).toContain('summary-table');
    });
  });
});
