import type { AbllsDomainDef, Score } from '../abllsConfigHelper';

export interface StudentProfile {
  id: string;
  fullName: string;
  age: number;
}

export function calculateDomainProgress(answered: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((answered / total) * 100)));
}

export function getStudentInitials(fullName: string): string {
  if (!fullName) return 'SA';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type { AbllsDomainDef, Score };
