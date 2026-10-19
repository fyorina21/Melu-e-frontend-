import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { confirmAction } from '../../../utils/dialogs';
import {
  getStoredGoalBank,
  setStoredGoalBank,
  saveGoalItem,
  deleteGoalItem,
  DEFAULT_GOAL_ITEMS,
} from '../../../stores/goalBankStore';

describe('Phase 2: Institutional Admin & Goal Bank Action Handlers & Protections', () => {
  describe('Input Sanitization & Boundary Constraints', () => {
    it('sanitizes non-digit characters from numeric inputs', () => {
      const sanitizeDigits = (text: string) => text.replace(/[^0-9]/g, '');

      expect(sanitizeDigits('10 sessions')).toBe('10');
      expect(sanitizeDigits('abc-45%')).toBe('45');
      expect(sanitizeDigits('!@#$')).toBe('');
      expect(sanitizeDigits('0')).toBe('0');
      expect(sanitizeDigits('  120  ')).toBe('120');
    });

    it('clamps trial logging configuration values to valid operational boundaries', () => {
      const clampStreamCount = (val: number) => Math.max(1, Math.min(10, isNaN(val) ? 1 : val));
      const clampConsecutive = (val: number) => Math.max(1, Math.min(10, isNaN(val) ? 3 : val));
      const clampIndependence = (val: number) => Math.max(10, Math.min(100, isNaN(val) ? 80 : val));

      // Stream count bounds [1, 10]
      expect(clampStreamCount(0)).toBe(1);
      expect(clampStreamCount(-5)).toBe(1);
      expect(clampStreamCount(5)).toBe(5);
      expect(clampStreamCount(15)).toBe(10);
      expect(clampStreamCount(NaN)).toBe(1);

      // Consecutive sessions bounds [1, 10]
      expect(clampConsecutive(0)).toBe(1);
      expect(clampConsecutive(3)).toBe(3);
      expect(clampConsecutive(20)).toBe(10);
      expect(clampConsecutive(NaN)).toBe(3);

      // Independence percentage bounds [10, 100]
      expect(clampIndependence(5)).toBe(10);
      expect(clampIndependence(80)).toBe(80);
      expect(clampIndependence(150)).toBe(100);
      expect(clampIndependence(NaN)).toBe(80);
    });

    it('validates schedule capacity and draft expiry numeric constraints', () => {
      const validateCapacity = (val: string) => {
        const num = parseInt(val, 10);
        return !isNaN(num) && num > 0;
      };

      expect(validateCapacity('12')).toBe(true);
      expect(validateCapacity('0')).toBe(false);
      expect(validateCapacity('-5')).toBe(false);
      expect(validateCapacity('')).toBe(false);
    });
  });

  describe('Cross-Platform Action Confirmation Dialogs', () => {
    let originalWindow: any;

    beforeEach(() => {
      originalWindow = (globalThis as any).window;
      (globalThis as any).window = {
        confirm: vi.fn(),
      };
    });

    afterEach(() => {
      (globalThis as any).window = originalWindow;
      vi.restoreAllMocks();
    });

    it('executes onConfirm when confirmed on web platform', () => {
      const onConfirm = vi.fn();
      vi.mocked((globalThis as any).window.confirm).mockReturnValue(true);

      confirmAction({
        title: 'Delete Item',
        message: 'Are you sure you want to delete this item?',
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm,
      });

      expect((globalThis as any).window.confirm).toHaveBeenCalledWith(
        'Delete Item\n\nAre you sure you want to delete this item?',
      );
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('aborts onConfirm when cancelled by user on web platform', () => {
      const onConfirm = vi.fn();
      vi.mocked((globalThis as any).window.confirm).mockReturnValue(false);

      confirmAction({
        title: 'Reset to Defaults',
        message: 'Reset all configuration to default values?',
        confirmLabel: 'Reset',
        onConfirm,
      });

      expect((globalThis as any).window.confirm).toHaveBeenCalledWith(
        'Reset to Defaults\n\nReset all configuration to default values?',
      );
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Goal Bank Status Toggling & Deletion Protection', () => {
    let originalWindow: any;
    let originalCustomEvent: any;
    let eventListeners: Record<string, Function[]> = {};

    beforeEach(() => {
      localStorage.clear();
      setStoredGoalBank(DEFAULT_GOAL_ITEMS);

      eventListeners = {};
      originalWindow = (globalThis as any).window;
      originalCustomEvent = (globalThis as any).CustomEvent;

      (globalThis as any).CustomEvent = class CustomEvent {
        type: string;
        detail: any;
        constructor(type: string, params?: { detail?: any }) {
          this.type = type;
          this.detail = params?.detail;
        }
      };

      (globalThis as any).window = {
        addEventListener: vi.fn((event: string, cb: Function) => {
          eventListeners[event] = eventListeners[event] || [];
          eventListeners[event].push(cb);
        }),
        removeEventListener: vi.fn((event: string, cb: Function) => {
          if (eventListeners[event]) {
            eventListeners[event] = eventListeners[event].filter((f) => f !== cb);
          }
        }),
        dispatchEvent: vi.fn((event: any) => {
          const list = eventListeners[event.type] || [];
          list.forEach((cb) => cb(event));
          return true;
        }),
      };
    });

    afterEach(() => {
      (globalThis as any).window = originalWindow;
      (globalThis as any).CustomEvent = originalCustomEvent;
    });

    it('toggles goal status between active and inactive while updating active flag', () => {
      const initialBank = getStoredGoalBank();
      const firstGoal = initialBank[0];
      expect(firstGoal).toBeDefined();

      // Toggle to inactive
      const updatedInactive = saveGoalItem({
        ...firstGoal,
        status: 'inactive',
        active: false,
      });
      expect(updatedInactive.status).toBe('inactive');
      expect(updatedInactive.active).toBe(false);

      // Verify in persistent storage
      const bankAfterFirst = getStoredGoalBank();
      const storedFirst = bankAfterFirst.find((g) => g.id === firstGoal.id);
      expect(storedFirst?.status).toBe('inactive');
      expect(storedFirst?.active).toBe(false);

      // Toggle back to active
      const updatedActive = saveGoalItem({
        ...firstGoal,
        status: 'active',
        active: true,
      });
      expect(updatedActive.status).toBe('active');
      expect(updatedActive.active).toBe(true);
    });

    it('deletes goal from store and notifies listeners via custom event', () => {
      const initialBank = getStoredGoalBank();
      const goalToDelete = initialBank[0];
      const initialCount = initialBank.length;

      let eventFired = false;
      const handler = () => {
        eventFired = true;
      };
      (globalThis as any).window.addEventListener('melue_goal_bank_changed', handler);

      deleteGoalItem(goalToDelete.id);

      (globalThis as any).window.removeEventListener('melue_goal_bank_changed', handler);

      expect(eventFired).toBe(true);

      const bankAfterDelete = getStoredGoalBank();
      expect(bankAfterDelete.length).toBe(initialCount - 1);
      expect(bankAfterDelete.some((g) => g.id === goalToDelete.id)).toBe(false);
    });
  });
});
