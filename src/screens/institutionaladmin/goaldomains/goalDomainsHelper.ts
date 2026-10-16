// src/screens/institutionaladmin/goaldomains/goalDomainsHelper.ts

import type { GoalDomain, TaskAnalysisStep } from './types';

export function moveItemInList<T>(list: T[], index: number, direction: 'up' | 'down'): T[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= list.length) return list;

  const updated = [...list];
  const temp = updated[index];
  updated[index] = updated[targetIndex];
  updated[targetIndex] = temp;
  return updated;
}

export function validateDomainSubmission(domains: GoalDomain[]): {
  valid: boolean;
  error?: string;
} {
  const activeCount = domains.filter((d) => d.active !== false).length;
  if (activeCount === 0) {
    return { valid: false, error: 'At least one active domain is required.' };
  }
  return { valid: true };
}

export function validateTemplateSubmission(
  name: string,
  steps: TaskAnalysisStep[],
): {
  valid: boolean;
  error?: string;
} {
  if (!name.trim()) {
    return { valid: false, error: 'Template Name is required.' };
  }
  if (!steps || steps.length === 0) {
    return { valid: false, error: 'At least one step is required.' };
  }
  return { valid: true };
}
