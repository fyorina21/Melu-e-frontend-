import { describe, it, expect } from 'vitest';
import {
  getItemScoreOptions,
  getFilledCells,
  getMaxCellsForItem,
  parseScoreFromOption,
  saveStorageAssessment,
  loadStorageAssessment,
} from './abllsConfigHelper';

describe('ABLLS Scoring and Grid Helpers', () => {
  it('formats score options to numbers only and retains N/A for standard items', () => {
    const item = {
      options: ['0 — Not Demonstrated', '1 — Emerging', '2 — Mastered', 'N/A'],
    };
    const options = getItemScoreOptions(item);
    expect(options.map((o) => o.label)).toEqual(['0', '1', '2', 'N/A']);
    expect(options.map((o) => o.score)).toEqual([0, 1, 2, 'NA']);
  });

  it('removes N/A if options are 2 only', () => {
    // Case 1: 2 score choices plus N/A
    const itemWithNA = {
      options: ['0 — Not Demonstrated', '1 — Mastered', 'N/A'],
    };
    const optsWithNA = getItemScoreOptions(itemWithNA);
    expect(optsWithNA.map((o) => o.label)).toEqual(['0', '1']);
    expect(optsWithNA.map((o) => o.score)).toEqual([0, 1]);

    // Case 2: raw 2 options
    const itemTwo = {
      options: ['0', '1'],
    };
    const optsTwo = getItemScoreOptions(itemTwo);
    expect(optsTwo.map((o) => o.label)).toEqual(['0', '1']);
    expect(optsTwo.map((o) => o.score)).toEqual([0, 1]);

    // Case 3: maxCells 2
    const itemMaxCells2 = {
      maxCells: 2,
      options: ['0 - None', '1 - Yes', 'N/A'],
    };
    const optsMax2 = getItemScoreOptions(itemMaxCells2);
    expect(optsMax2.map((o) => o.label)).toEqual(['0', '1']);
  });

  it('parses scores without converting score 1 to 2', () => {
    expect(parseScoreFromOption('0')).toBe(0);
    expect(parseScoreFromOption('1')).toBe(1);
    expect(parseScoreFromOption('2')).toBe(2);
    expect(parseScoreFromOption('N/A')).toBe('NA');
  });

  it('occupies graph cells from left to right according to score number', () => {
    expect(getFilledCells({ score: 0 })).toBe(1); // 1 red cell for score 0
    expect(getFilledCells({ score: 1 })).toBe(1); // 1 yellow cell for score 1
    expect(getFilledCells({ score: 2 })).toBe(2); // 2 green cells for score 2
    expect(getFilledCells({ score: 3 })).toBe(3);
    expect(getFilledCells({ score: 4 })).toBe(4);
    expect(getFilledCells({ score: 'NA' })).toBe(0);
  });

  it('calculates max cells correctly', () => {
    expect(getMaxCellsForItem({ options: ['0', '1', '2', 'N/A'] })).toBe(4);
    expect(getMaxCellsForItem({ options: ['0', '1'] })).toBe(2);
  });

  it('persists assessment data to localStorage and retrieves it', () => {
    const studentId = 'test-student-persistence';
    saveStorageAssessment(studentId, {
      scores: { A1: 1, A2: 2 },
      notes: { A1: 'Good progress' },
    });

    const loaded = loadStorageAssessment(studentId);
    expect(loaded?.scores).toEqual({ A1: 1, A2: 2 });
    expect(loaded?.notes?.A1).toBe('Good progress');
  });
});
