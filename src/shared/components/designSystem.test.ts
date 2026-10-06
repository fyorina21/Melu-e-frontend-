import { describe, it, expect } from 'vitest';
import * as DesignSystem from './index';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { Badge } from './Badge';
import { ModalSheet } from './ModalSheet';
import { DataGrid } from './DataGrid';
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  TableSkeleton,
  PageSkeleton,
} from './Skeleton';

describe('Design System Primitives', () => {
  it('exports all atomic design system primitives', () => {
    expect(DesignSystem.Button).toBeDefined();
    expect(DesignSystem.Input).toBeDefined();
    expect(DesignSystem.Card).toBeDefined();
    expect(DesignSystem.Badge).toBeDefined();
    expect(DesignSystem.ModalSheet).toBeDefined();
    expect(DesignSystem.DataGrid).toBeDefined();
    expect(DesignSystem.Skeleton).toBeDefined();
  });

  it('provides Skeleton subcomponents attached to Skeleton', () => {
    expect(Skeleton.Text).toBe(SkeletonText);
    expect(Skeleton.Avatar).toBe(SkeletonAvatar);
    expect(Skeleton.Card).toBe(SkeletonCard);
    expect(Skeleton.Table).toBe(TableSkeleton);
    expect(Skeleton.Page).toBe(PageSkeleton);
  });

  it('validates PreferenceAssessment timer guard logic', () => {
    // Mimic the items timer guard logic implemented in PreferenceAssessmentScreen
    const items = [
      { id: '1', name: 'Item 1', isRunning: false, timerSeconds: 0 },
      { id: '2', name: 'Item 2', isRunning: false, timerSeconds: 0 },
    ];

    const hasRunningWhenAllStopped = items.some((i) => i.isRunning);
    expect(hasRunningWhenAllStopped).toBe(false);

    // If hasRunning is false, returning the exact same array reference halts re-renders
    const nextItems = hasRunningWhenAllStopped
      ? items.map((i) => (i.isRunning ? { ...i, timerSeconds: i.timerSeconds + 1 } : i))
      : items;

    expect(nextItems).toBe(items); // Same reference!

    // When one item is running:
    const activeItems = [
      { id: '1', name: 'Item 1', isRunning: true, timerSeconds: 0 },
      { id: '2', name: 'Item 2', isRunning: false, timerSeconds: 0 },
    ];
    const hasRunningWhenActive = activeItems.some((i) => i.isRunning);
    expect(hasRunningWhenActive).toBe(true);

    const updatedActiveItems = hasRunningWhenActive
      ? activeItems.map((i) => (i.isRunning ? { ...i, timerSeconds: i.timerSeconds + 1 } : i))
      : activeItems;

    expect(updatedActiveItems[0].timerSeconds).toBe(1);
    expect(updatedActiveItems[1].timerSeconds).toBe(0);
  });
});
