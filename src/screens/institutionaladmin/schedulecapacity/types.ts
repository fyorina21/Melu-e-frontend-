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

export const parseTimeString = (str: string): TimeValue => {
  const match = str?.match?.(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    return {
      hour: match[1].padStart(2, '0'),
      minute: match[2],
      period: match[3].toUpperCase() as 'AM' | 'PM',
    };
  }
  return { hour: '08', minute: '00', period: 'AM' };
};

export const DEFAULT_BLOCKS: ScheduleBlock[] = [
  {
    id: 'b1',
    name: 'Morning Block',
    startTime: { hour: '08', minute: '07', period: 'AM' },
    endTime: { hour: '10', minute: '30', period: 'AM' },
  },
  {
    id: 'b2',
    name: 'Afternoon Block',
    startTime: { hour: '01', minute: '10', period: 'PM' },
    endTime: { hour: '03', minute: '30', period: 'PM' },
  },
];
