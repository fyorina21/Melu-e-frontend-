import type { Goal, Trial, IncidentPayload } from '../../types';

export const PROMPT_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  FP: { bg: '#FEE2E2', text: '#DC2626', label: 'FP' },
  PP: { bg: '#FFEDD5', text: '#EA580C', label: 'PP' },
  G: { bg: '#EFF6FF', text: '#2563EB', label: 'G' },
  INDEPENDENT: { bg: '#DCFCE7', text: '#16A34A', label: '+' },
  '+': { bg: '#DCFCE7', text: '#16A34A', label: '+' },
};

export interface DisplayIncident {
  date?: string;
  time: string;
  behavior: string;
  studentName: string;
  antecedent?: string;
  consequence?: string;
  additionalNotes?: string;
}

export function mergeIncidents(
  rawIncidents: any[],
  localIncidents: IncidentPayload[],
): DisplayIncident[] {
  const apiIncidents: DisplayIncident[] = (rawIncidents || []).map((inc: any) => ({
    date: inc.date,
    time: inc.time,
    behavior: inc.behavior,
    studentName: inc.studentName,
    antecedent: inc.antecedent,
    consequence: inc.consequence,
    additionalNotes: inc.notes || inc.additionalNotes,
  }));

  const apiKeys = new Set(apiIncidents.map((i) => `${i.time}-${i.studentName}`));
  const uniqueLocal: DisplayIncident[] = (localIncidents || [])
    .filter((inc) => !apiKeys.has(`${inc.time}-${inc.studentName}`))
    .map((inc) => ({
      date: new Date().toLocaleDateString(),
      time: inc.time || new Date().toLocaleTimeString(),
      behavior: inc.behavior,
      studentName: inc.studentName || '',
      antecedent: inc.antecedent,
      consequence: inc.consequence,
      additionalNotes: inc.additionalNotes,
    }));

  return [...uniqueLocal, ...apiIncidents];
}

export function generateSummaryReportText(
  stationName: string,
  teacherName: string,
  students: { name: string; goals?: Goal[] }[],
  incidents: DisplayIncident[],
  notes: string,
): string {
  const lines = [
    `Melu'e Foundation - Session Summary`,
    `Station: ${stationName || ''}`,
    `Teacher: ${teacherName || ''}`,
    '',
    'STUDENT GOAL DATA',
    ...students.flatMap((s) => [
      `— ${s.name}`,
      ...(Array.isArray(s.goals) ? s.goals : []).map((g) =>
        g.goalType === 'task_analysis'
          ? `  • ${g.name} (TA): ${g.independencePercent}% independent · mastery: ${g.overallMasteryStatus}`
          : `  • ${g.name}: ${g.independencePercent}% independent · ${g.totalTrials} trials · ${Object.entries(
              g.promptBreakdown || {},
            )
              .map(([l, c]) => `${l}:${c}`)
              .join(' ')}`,
      ),
    ]),
    '',
    `BEHAVIOR INCIDENTS: ${incidents.length}`,
    ...incidents.map((inc) => `• ${inc.time} — ${inc.behavior} (${inc.studentName})`),
    '',
    'TEACHER QUALITATIVE NOTES',
    notes || '(no notes added yet)',
    '',
    `Preview generated ${new Date().toLocaleString()}`,
  ];
  return lines.join('\n');
}
