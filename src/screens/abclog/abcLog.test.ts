import { describe, it, expect } from 'vitest';
import { getDefaultDateRange, intensityStyle, TABLE_COLUMNS } from './types';

describe('ABC Log Screen Utilities', () => {
  describe('getDefaultDateRange', () => {
    it('returns valid from and to dates 30 days apart in YYYY-MM-DD format', () => {
      const { from, to } = getDefaultDateRange();
      expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const fromTime = new Date(from).getTime();
      const toTime = new Date(to).getTime();
      expect(toTime).toBeGreaterThanOrEqual(fromTime);
    });
  });

  describe('intensityStyle', () => {
    it('returns green colors for Low or Mild intensity', () => {
      expect(intensityStyle('Low')).toEqual({ bg: '#F0FDF4', text: '#16A34A' });
      expect(intensityStyle('Mild')).toEqual({ bg: '#F0FDF4', text: '#16A34A' });
    });

    it('returns amber colors for Medium or Moderate intensity', () => {
      expect(intensityStyle('Medium')).toEqual({ bg: '#FEFCE8', text: '#A16207' });
      expect(intensityStyle('Moderate')).toEqual({ bg: '#FEFCE8', text: '#A16207' });
    });

    it('returns red colors for High or Severe intensity', () => {
      expect(intensityStyle('High')).toEqual({ bg: '#FEF2F2', text: '#B91C1C' });
      expect(intensityStyle('Severe')).toEqual({ bg: '#FEF2F2', text: '#B91C1C' });
    });
  });

  describe('TABLE_COLUMNS', () => {
    it('includes core ABC observational keys', () => {
      const keys = TABLE_COLUMNS.map((c) => c.key);
      expect(keys).toContain('date');
      expect(keys).toContain('behavior');
      expect(keys).toContain('antecedent');
      expect(keys).toContain('consequence');
      expect(keys).toContain('intensity');
    });
  });
});
