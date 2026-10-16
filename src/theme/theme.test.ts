import { describe, it, expect } from 'vitest';
import { colors, spacing, radius, makeShadow } from './colors';
import { shadows } from './shadows';
import { zIndex } from './zIndex';
import { typography } from './typography';

describe('Design Tokens System', () => {
  describe('colors', () => {
    it('defines essential brand colors', () => {
      expect(colors.primaryYellow).toBe('#F6C445');
      expect(colors.primaryYellowDark).toBe('#E0AE2E');
      expect(colors.primaryBlue).toBe('#2563EB');
      expect(colors.navyText).toBe('#1A2233');
    });

    it('enforces WCAG AA compliant text colors', () => {
      // mutedText changed from #9CA3AF to #6B7280 for 4.5:1+ contrast on white
      expect(colors.mutedText).toBe('#6B7280');
      expect(colors.bodyText).toBe('#4B5563');
      expect(colors.white).toBe('#FFFFFF');
    });

    it('provides full semantic error, warning, success, info palette', () => {
      expect(colors.error).toBeDefined();
      expect(colors.errorLight).toBeDefined();
      expect(colors.errorDark).toBeDefined();

      expect(colors.warning).toBeDefined();
      expect(colors.warningLight).toBeDefined();
      expect(colors.warningDark).toBeDefined();

      expect(colors.success).toBeDefined();
      expect(colors.successLight).toBeDefined();
      expect(colors.successDark).toBeDefined();

      expect(colors.info).toBeDefined();
      expect(colors.infoLight).toBeDefined();
      expect(colors.infoDark).toBeDefined();
    });

    it('defines status pill and prompt entry colors', () => {
      expect(colors.statusInProgressBg).toBeDefined();
      expect(colors.statusCompletedBg).toBeDefined();
      expect(colors.promptFP).toBeDefined();
      expect(colors.promptPP).toBeDefined();
      expect(colors.promptG).toBeDefined();
      expect(colors.promptIndependent).toBeDefined();
    });
  });

  describe('spacing', () => {
    it('provides an 8-point baseline grid scale', () => {
      expect(spacing.xs).toBe(4);
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(12);
      expect(spacing.lg).toBe(16);
      expect(spacing.xl).toBe(24);
      expect(spacing.xxl).toBe(32);
    });
  });

  describe('radius', () => {
    it('provides consistent border radius scale', () => {
      expect(radius.xs).toBe(4);
      expect(radius.sm).toBe(6);
      expect(radius.md).toBe(10);
      expect(radius.lg).toBe(14);
      expect(radius.pill).toBe(999);
      expect(radius.full).toBe(999);
    });
  });

  describe('shadows', () => {
    it('provides a complete elevation scale', () => {
      const levels = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;
      levels.forEach((lvl) => {
        expect(shadows[lvl]).toBeDefined();
        expect(shadows[lvl].elevation).toBeDefined();
      });
      expect(shadows.none.elevation).toBe(0);
      expect(shadows.xl.elevation).toBe(12);
    });
  });

  describe('zIndex', () => {
    it('enforces logical stacking order without collisions', () => {
      expect(zIndex.base).toBeLessThan(zIndex.sticky);
      expect(zIndex.sticky).toBeLessThan(zIndex.navigation);
      expect(zIndex.navigation).toBeLessThan(zIndex.dropdown);
      expect(zIndex.dropdown).toBeLessThan(zIndex.modal);
      expect(zIndex.modal).toBeLessThan(zIndex.toast);
      expect(zIndex.toast).toBeLessThan(zIndex.devTools);
    });
  });

  describe('typography', () => {
    it('defines standard typographic hierarchy styles', () => {
      expect(typography.h1.fontSize).toBe(24);
      expect(typography.h2.fontSize).toBe(18);
      expect(typography.h3.fontSize).toBe(15);
      expect(typography.body.fontSize).toBe(14);
      expect(typography.caption.fontSize).toBe(12);
      expect(typography.label.fontSize).toBe(11);
    });
  });

  describe('makeShadow helper', () => {
    it('generates cross-platform shadow styles', () => {
      const shadow = makeShadow(4, 8, 0.15, '0, 0, 0', 4);
      expect(shadow).toBeDefined();
      expect(
        typeof (shadow as any).boxShadow === 'string' ||
          typeof (shadow as any).elevation === 'number',
      ).toBe(true);
    });
  });
});
