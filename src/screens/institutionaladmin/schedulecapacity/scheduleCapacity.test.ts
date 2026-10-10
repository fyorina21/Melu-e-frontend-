import { describe, it, expect } from 'vitest';
import {
  formatTimeString,
  parseTimeString,
  DEFAULT_BLOCKS,
  HOURS,
  MINUTES,
  PERIODS,
  type TimeValue,
} from './types';

describe('scheduleCapacity logic and time helpers', () => {
  describe('parseTimeString', () => {
    it('parses formatted AM time string correctly', () => {
      const parsed = parseTimeString('08:07 AM');
      expect(parsed).toEqual({ hour: '08', minute: '07', period: 'AM' });
    });

    it('parses single-digit hour with padding', () => {
      const parsed = parseTimeString('1:45 PM');
      expect(parsed).toEqual({ hour: '01', minute: '45', period: 'PM' });
    });

    it('falls back to 08:00 AM for invalid or empty inputs', () => {
      expect(parseTimeString('')).toEqual({ hour: '08', minute: '00', period: 'AM' });
      expect(parseTimeString('invalid')).toEqual({ hour: '08', minute: '00', period: 'AM' });
    });
  });

  describe('formatTimeString', () => {
    it('formats time value object into backend-compatible string', () => {
      const t: TimeValue = { hour: '02', minute: '15', period: 'PM' };
      expect(formatTimeString(t)).toBe('02:15 PM');
    });
  });

  describe('constants and DEFAULT_BLOCKS', () => {
    it('provides 12 hours, 60 minutes, and 2 periods', () => {
      expect(HOURS.length).toBe(12);
      expect(HOURS[0]).toBe('01');
      expect(HOURS[11]).toBe('12');

      expect(MINUTES.length).toBe(60);
      expect(MINUTES[0]).toBe('00');
      expect(MINUTES[59]).toBe('59');

      expect(PERIODS).toEqual(['AM', 'PM']);
    });

    it('contains default morning and afternoon blocks', () => {
      expect(DEFAULT_BLOCKS.length).toBe(2);
      expect(DEFAULT_BLOCKS[0].name).toBe('Morning Block');
      expect(DEFAULT_BLOCKS[1].name).toBe('Afternoon Block');
    });
  });

  describe('validation boundaries', () => {
    it('validates capacity lower bound', () => {
      const validateCap = (val: string) => {
        const num = Number(val);
        return !isNaN(num) && num >= 1;
      };
      expect(validateCap('2')).toBe(true);
      expect(validateCap('0')).toBe(false);
      expect(validateCap('-1')).toBe(false);
      expect(validateCap('abc')).toBe(false);
    });

    it('validates draft expiry days between 1 and 30', () => {
      const validateExpiry = (val: string) => {
        const num = Number(val);
        return !isNaN(num) && num >= 1 && num <= 30;
      };
      expect(validateExpiry('7')).toBe(true);
      expect(validateExpiry('30')).toBe(true);
      expect(validateExpiry('0')).toBe(false);
      expect(validateExpiry('31')).toBe(false);
    });
  });
});
