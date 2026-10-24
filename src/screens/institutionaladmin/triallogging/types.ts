export interface LevelItem {
  id: string;
  name: string;
  color: string;
  order: number;
  status: 'Active';
}

export type TrialLayout = 'Horizontal' | 'Vertical' | 'Card Grid';

export const COLOR_SWATCHES = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#10B981',
  '#22C55E',
  '#0284C7',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#64748B',
] as const;

export const COLOR_SWATCH_LABELS: Record<string, string> = {
  '#EF4444': 'Crimson Red',
  '#F97316': 'Vibrant Orange',
  '#F59E0B': 'Amber Gold',
  '#EAB308': 'Amber Yellow',
  '#10B981': 'Emerald Green',
  '#22C55E': 'Vibrant Green',
  '#0284C7': 'Sky Blue',
  '#3B82F6': 'Primary Blue',
  '#6366F1': 'Indigo',
  '#8B5CF6': 'Purple',
  '#EC4899': 'Rose Pink',
  '#64748B': 'Slate Grey',
};

export function sortPromptLevels(levels: LevelItem[]): LevelItem[] {
  return [...levels].sort((a, b) => a.order - b.order);
}

export function validatePromptLevel(
  name: string,
  order: number,
  existingLevels: LevelItem[],
  excludeId?: string,
): { isValid: boolean; error?: string } {
  if (!name.trim()) {
    return { isValid: false, error: 'Every prompt level needs a name' };
  }
  const orderTaken = existingLevels.some(
    (l) => l.order === order && (!excludeId || l.id !== excludeId),
  );
  if (orderTaken) {
    return {
      isValid: false,
      error: `Order ${order} is already in use. Each prompt level needs a unique order number.`,
    };
  }
  return { isValid: true };
}
