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
  '#EAB308',
  '#22C55E',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
] as const;

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
