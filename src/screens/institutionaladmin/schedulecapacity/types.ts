export interface TimeValue {
  hour: string;
  minute: string;
  period: 'AM' | 'PM';
}

export interface ScheduleBlock {
  id: string;
  name: string;
  startTime: TimeValue;
  endTime: TimeValue;
}

export const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
export const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
export const PERIODS: ('AM' | 'PM')[] = ['AM', 'PM'];

export const formatTimeString = (t: TimeValue): string => `${t.hour}:${t.minute} ${t.period}`;

export const parseTimeString = (val: unknown): TimeValue => {
  if (!val) return { hour: '08', minute: '00', period: 'AM' };
  if (typeof val === 'object' && val !== null && 'hour' in val && 'minute' in val) {
    const obj = val as any;
    return {
      hour: String(obj.hour).padStart(2, '0'),
      minute: String(obj.minute).padStart(2, '0'),
      period: (obj.period || 'AM').toUpperCase() as 'AM' | 'PM',
    };
  }

  const str = String(val).trim();

  // 12-hour format with AM/PM (e.g. "08:00 AM", "8:15pm")
  const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    if (h === 0) h = 12;
    if (h > 12) h = 12;
    return {
      hour: String(h).padStart(2, '0'),
      minute: match12[2],
      period: match12[3].toUpperCase() as 'AM' | 'PM',
    };
  }

  // ISO timestamp (e.g. "2000-01-01T14:15:00.000Z")
  const isoMatch = str.match(/T(\d{2}):(\d{2})/i);
  if (isoMatch) {
    const rawH = parseInt(isoMatch[1], 10);
    const m = isoMatch[2];
    const period: 'AM' | 'PM' = rawH >= 12 ? 'PM' : 'AM';
    const displayH = rawH % 12 === 0 ? 12 : rawH % 12;
    return {
      hour: String(displayH).padStart(2, '0'),
      minute: m,
      period,
    };
  }

  // 24-hour format (e.g. "14:15", "08:00", "09:30")
  const match24 = str.match(/^(\d{1,2}):(\d{2})/);
  if (match24) {
    const rawH = parseInt(match24[1], 10);
    const m = match24[2];
    const period: 'AM' | 'PM' = rawH >= 12 ? 'PM' : 'AM';
    const displayH = rawH % 12 === 0 ? 12 : rawH % 12;
    return {
      hour: String(displayH).padStart(2, '0'),
      minute: m,
      period,
    };
  }

  return { hour: '08', minute: '00', period: 'AM' };
};

export const isValidTimeString = (str: string): boolean => {
  return /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.test(str?.trim() || '');
};

export const DEFAULT_BLOCKS: ScheduleBlock[] = [
  {
    id: 'b1',
    name: 'Morning Block A',
    startTime: { hour: '08', minute: '00', period: 'AM' },
    endTime: { hour: '09', minute: '30', period: 'AM' },
  },
  {
    id: 'b2',
    name: 'Morning Block B',
    startTime: { hour: '09', minute: '45', period: 'AM' },
    endTime: { hour: '11', minute: '15', period: 'AM' },
  },
  {
    id: 'b3',
    name: 'Afternoon Block A',
    startTime: { hour: '12', minute: '30', period: 'PM' },
    endTime: { hour: '02', minute: '00', period: 'PM' },
  },
  {
    id: 'b4',
    name: 'Afternoon Block B',
    startTime: { hour: '02', minute: '15', period: 'PM' },
    endTime: { hour: '03', minute: '45', period: 'PM' },
  },
];
