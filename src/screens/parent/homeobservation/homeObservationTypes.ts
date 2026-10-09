// src/screens/parent/homeobservation/homeObservationTypes.ts

import type { Feather } from '@expo/vector-icons';

export type Category = 'Behavior' | 'Achievement' | 'Concern' | 'General';
export type AckStatus = 'Acknowledged' | 'Pending' | 'Needs Response';

export interface Observation {
  id: string;
  date: string;
  time: string;
  category: Category;
  text: string;
  status: AckStatus;
  teamResponse?: string;
  therapistName?: string;
  location?: string;
  duration?: string;
}

export interface ObsPayload {
  category: Category;
  date: string;
  time: string;
  text: string;
  location: string;
  duration: string;
}

export const CATEGORY_STYLE: Record<Category, { bg: string; text: string; border: string }> = {
  Achievement: { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' },
  Behavior: { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA' },
  Concern: { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
  General: { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
};

export const STATUS_CONFIG: Record<
  AckStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: keyof typeof Feather.glyphMap;
  }
> = {
  Acknowledged: {
    label: 'Acknowledged',
    bg: '#F0FDF4',
    text: '#15803D',
    border: '#BBF7D0',
    icon: 'check-circle',
  },
  Pending: {
    label: 'Pending',
    bg: '#FEFCE8',
    text: '#A16207',
    border: '#FEF08A',
    icon: 'clock',
  },
  'Needs Response': {
    label: 'Needs Response',
    bg: '#FFF7ED',
    text: '#C2410C',
    border: '#FED7AA',
    icon: 'alert-circle',
  },
};

export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function nowTime(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatTime(isoTime: string): string {
  if (!isoTime) return '';
  const [h, m] = isoTime.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(`${dateStr}T00:00:00`);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }
  return dateStr;
}

export function toObservation(raw: any): Observation {
  if ((raw as any)?.category) {
    return {
      id: String(raw.id),
      date: String(raw.date ?? todayISO()),
      time: String(raw.time ?? ''),
      category: (['Behavior', 'Achievement', 'Concern', 'General'].includes(raw.category)
        ? raw.category
        : 'General') as Category,
      text: String(raw.text ?? raw.behavior ?? ''),
      status: (['Acknowledged', 'Pending', 'Needs Response'].includes(raw.status)
        ? raw.status
        : raw.acknowledged === 'acknowledged'
          ? 'Acknowledged'
          : raw.acknowledged === 'pending'
            ? 'Pending'
            : 'Needs Response') as AckStatus,
      teamResponse: raw.teamResponse ?? undefined,
      therapistName: raw.therapistName ?? undefined,
      location: raw.location ?? undefined,
      duration: raw.duration ?? undefined,
    };
  }
  return {
    id: String(raw.id),
    date: String(raw.date ?? todayISO()),
    time: String(raw.time ?? ''),
    category: 'General',
    text: String(raw.behavior ?? ''),
    status: (raw.acknowledged === 'acknowledged'
      ? 'Acknowledged'
      : raw.acknowledged === 'pending'
        ? 'Pending'
        : 'Needs Response') as AckStatus,
    teamResponse: raw.teamResponse ?? undefined,
  };
}
