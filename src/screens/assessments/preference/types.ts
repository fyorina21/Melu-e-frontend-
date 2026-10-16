export interface StimulusItem {
  id: string;
  name: string;
  category: string;
  timerSeconds: number;
  isRunning: boolean;
  frequency: number;
  durationSeconds: number;
  notes: string;
  engaged?: 'Engaged' | 'Did Not Engage';
  approached?: 'Approached' | 'Did Not Approach';
}

export const CATEGORIES = ['Visual', 'Auditory', 'Tactile', 'Toys', 'Movement'] as const;

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Visual: { bg: '#F3E8FF', text: '#9333EA' },
  Auditory: { bg: '#DCFCE7', text: '#16A34A' },
  Tactile: { bg: '#FFEDD5', text: '#EA580C' },
  Toys: { bg: '#FCE7F3', text: '#DB2777' },
  Movement: { bg: '#DBEAFE', text: '#2563EB' },
};

export const INITIAL_ITEMS: StimulusItem[] = [
  {
    id: '1',
    name: 'Light-up toys',
    category: 'Visual',
    timerSeconds: 0,
    isRunning: false,
    frequency: 0,
    durationSeconds: 0,
    notes: '',
  },
  {
    id: '2',
    name: 'Bubbles',
    category: 'Visual',
    timerSeconds: 0,
    isRunning: false,
    frequency: 0,
    durationSeconds: 0,
    notes: '',
  },
  {
    id: '3',
    name: 'Mirror',
    category: 'Visual',
    timerSeconds: 0,
    isRunning: false,
    frequency: 0,
    durationSeconds: 0,
    notes: '',
  },
  {
    id: '4',
    name: 'Kaleidoscope',
    category: 'Visual',
    timerSeconds: 0,
    isRunning: false,
    frequency: 0,
    durationSeconds: 0,
    notes: '',
  },
];

export function formatMMSS(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
