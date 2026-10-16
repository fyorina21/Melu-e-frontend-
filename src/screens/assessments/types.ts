import type { Score } from './abllsConfigHelper';

export type ViewMode = 'grid' | 'cards' | 'summary';

export interface AbllsSummaryItem {
  id: string;
  description: string;
  options?: string[];
  maxCells?: number;
  score: Score;
}

export interface AbllsSummaryDomain {
  code: string;
  name: string;
  c0: number;
  c1: number;
  c2: number;
  cNA: number;
  masteredPct: number;
  items: AbllsSummaryItem[];
  isPriority?: boolean;
}

export interface PriorityArea {
  rank: number;
  name: string;
  c0: number;
  c1: number;
}

export interface SelectedItemState {
  id: string;
  domain: string;
  description: string;
  score: Score;
  options?: string[];
  maxCells?: number;
}

export const getMaxCellsForItem = (item: { options?: string[]; maxCells?: number }): number => {
  if (item.maxCells) return item.maxCells;
  if (item.options && Array.isArray(item.options) && item.options.length > 0) {
    const nonNA = item.options.filter(
      (o) =>
        o.trim().toUpperCase() !== 'N/A' &&
        o.trim().toUpperCase() !== 'NA' &&
        !o.toLowerCase().includes('not assessed'),
    );
    if (nonNA.length === 2) return 2;
    const numbers = nonNA
      .map((o) => {
        const m = o.trim().match(/^(\d+)/);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n): n is number => n !== null);
    if (numbers.length > 0) {
      const maxNum = Math.max(...numbers);
      if (maxNum <= 2) return 4;
      return Math.max(4, maxNum);
    }
    return 4;
  }
  return 4;
};

export const getFilledCells = (item: {
  score: Score | number;
  options?: string[];
  maxCells?: number;
}): number => {
  if (item.score === 'NA' || item.score === undefined || item.score === null) return 0;
  if (item.score === 0) return 1;
  const num = typeof item.score === 'number' ? item.score : parseInt(String(item.score), 10);
  if (isNaN(num) || num <= 0) return 0;
  return num;
};
