// src/screens/assessments/abllsCalculationHelper.ts

import type { AbllsDomainDef, Score } from './abllsConfigHelper';
import type { AbllsSummaryDomain, PriorityArea } from './types';

export function computeAbllsSummaryData(
  domains: AbllsDomainDef[],
  scores: Record<string, Score>,
): AbllsSummaryDomain[] {
  return domains.map((d) => {
    const items = d.items.map((it) => ({
      id: it.id,
      description: it.description,
      options: it.options,
      maxCells: it.maxCells,
      score: scores[it.id] ?? ('NA' as Score),
    }));
    const c0 = items.filter((i) => i.score === 0).length;
    const c1 = items.filter((i) => i.score === 1).length;
    const c2 = items.filter((i) => i.score === 2).length;
    const cNA = items.filter((i) => i.score === 'NA').length;
    const validTotal = items.length - cNA;
    const masteredPct = validTotal > 0 ? Math.round((c2 / validTotal) * 100) : 0;

    return {
      code: d.code,
      name: d.name,
      c0,
      c1,
      c2,
      cNA,
      masteredPct,
      items,
    };
  });
}

export function computePriorityAreas(summaryData: AbllsSummaryDomain[]): {
  priorityAreas: PriorityArea[];
  priorityNames: Set<string>;
  rows: (AbllsSummaryDomain & { isPriority: boolean })[];
} {
  const priorityAreas: PriorityArea[] = [...summaryData]
    .sort((a, b) => b.c0 - a.c0 || b.c1 - a.c1)
    .slice(0, 3)
    .map((d, idx) => ({ rank: idx + 1, name: d.name, c0: d.c0, c1: d.c1 }));

  const priorityNames = new Set(priorityAreas.map((p) => p.name));
  const rows = summaryData.map((d) => ({
    ...d,
    isPriority: priorityNames.has(d.name),
  }));

  return { priorityAreas, priorityNames, rows };
}
