// src/screens/abclog/abcLogHelpers.ts
//
// Pure helper functions for AbcLogScreen:
// - Timezone-safe local date formatting and extraction
// - Consistent filtering across API and local storage
// - Content signature deduplication and safe ID assignment
// - Weekly stats calculation strictly excluding future dates
// - RFC 4180 CSV export and printable PDF report generation

export interface AbcStats {
  totalIncidents: number;
  mostCommonBehavior: string;
  mostCommonAntecedent: string;
  thisWeek: number;
}

export interface AbcIncident {
  id: string;
  date?: string;
  time?: string;
  location?: string;
  behavior?: string;
  frequency?: string;
  intensity?: string;
  category?: string;
  antecedent?: string;
  consequence?: string;
  notes?: string;
  teacher?: string;
  studentId?: string;
  studentName?: string;
}

export interface AbcFilterParams {
  from?: string;
  to?: string;
  behaviorFilter?: string;
  categoryFilter?: string;
}

export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function extractDateStr(rawDate?: string): string {
  if (!rawDate) return '';
  const trimmed = String(rawDate).trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return formatLocalDate(parsed);
  }
  return trimmed;
}

export function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: formatLocalDate(from), to: formatLocalDate(to) };
}

export function filterAbcIncidents(
  incidents: AbcIncident[],
  filters: AbcFilterParams
): AbcIncident[] {
  if (!Array.isArray(incidents)) return [];
  const { from, to, behaviorFilter, categoryFilter } = filters;

  return incidents.filter((inc) => {
    const incDate = extractDateStr(inc.date);
    if (from && incDate && incDate < from) return false;
    if (to && incDate && incDate > to) return false;
    if (behaviorFilter && behaviorFilter !== 'All' && inc.behavior !== behaviorFilter) return false;
    if (categoryFilter && categoryFilter !== 'All' && inc.category !== categoryFilter) return false;
    return true;
  });
}

export function mergeAndDeduplicateIncidents(
  stored: AbcIncident[],
  api: AbcIncident[]
): AbcIncident[] {
  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();
  const combined: AbcIncident[] = [];

  const allCandidates = [...(Array.isArray(stored) ? stored : []), ...(Array.isArray(api) ? api : [])];

  allCandidates.forEach((item, index) => {
    const dateStr = extractDateStr(item.date);
    const timeStr = (item.time || '').trim();
    const behaviorStr = (item.behavior || '').trim();
    const antecedentStr = (item.antecedent || '').trim();
    const consequenceStr = (item.consequence || '').trim();

    const signature = `${dateStr}|${timeStr}|${behaviorStr.toLowerCase()}|${antecedentStr.toLowerCase()}|${consequenceStr.toLowerCase()}`;

    // Deduplicate if ID already seen
    if (item.id && seenIds.has(String(item.id))) {
      return;
    }
    // Deduplicate if exact content signature already seen
    if (dateStr && behaviorStr && seenSignatures.has(signature)) {
      return;
    }

    let safeId = item.id ? String(item.id).trim() : '';
    if (!safeId || seenIds.has(safeId)) {
      safeId = `abc-${dateStr || 'nodate'}-${timeStr.replace(/[^0-9]/g, '') || index}-${index}-${Math.random().toString(36).slice(2, 7)}`;
    }

    seenIds.add(safeId);
    if (dateStr && behaviorStr) {
      seenSignatures.add(signature);
    }

    combined.push({
      ...item,
      id: safeId,
      date: dateStr,
      behavior: behaviorStr,
      antecedent: antecedentStr,
      consequence: consequenceStr,
    });
  });

  // Sort newest first
  combined.sort((a, b) => {
    const dtA = `${a.date || ''} ${a.time || ''}`;
    const dtB = `${b.date || ''} ${b.time || ''}`;
    return dtB.localeCompare(dtA);
  });

  return combined;
}

export function computeAbcStats(
  incidents: AbcIncident[],
  referenceDate = new Date()
): AbcStats {
  if (!Array.isArray(incidents) || incidents.length === 0) {
    return {
      totalIncidents: 0,
      mostCommonBehavior: 'N/A',
      mostCommonAntecedent: 'N/A',
      thisWeek: 0,
    };
  }

  const behaviorCounts: Record<string, number> = {};
  const antecedentCounts: Record<string, number> = {};
  let thisWeekCount = 0;

  const todayStr = formatLocalDate(referenceDate);
  const oneWeekAgo = new Date(referenceDate);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoStr = formatLocalDate(oneWeekAgo);

  incidents.forEach((inc) => {
    if (inc.behavior) {
      behaviorCounts[inc.behavior] = (behaviorCounts[inc.behavior] || 0) + 1;
    }
    if (inc.antecedent) {
      antecedentCounts[inc.antecedent] = (antecedentCounts[inc.antecedent] || 0) + 1;
    }
    const incDate = extractDateStr(inc.date);
    // Exclude future-dated incidents: must be between oneWeekAgoStr and todayStr inclusive!
    if (incDate && incDate >= oneWeekAgoStr && incDate <= todayStr) {
      thisWeekCount++;
    }
  });

  let topBehavior = 'N/A';
  let maxB = 0;
  Object.entries(behaviorCounts).forEach(([k, v]) => {
    if (v > maxB) {
      maxB = v;
      topBehavior = k;
    }
  });

  let topAntecedent = 'N/A';
  let maxA = 0;
  Object.entries(antecedentCounts).forEach(([k, v]) => {
    if (v > maxA) {
      maxA = v;
      topAntecedent = k;
    }
  });

  return {
    totalIncidents: incidents.length,
    mostCommonBehavior: topBehavior,
    mostCommonAntecedent: topAntecedent,
    thisWeek: thisWeekCount,
  };
}

export function generateAbcCsv(
  incidents: AbcIncident[],
  columns: Array<{ key: keyof AbcIncident; label: string }>
): string {
  const headers = columns.map((c) => c.label).concat(['Notes']);
  const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const rows = incidents.map((r) =>
    columns.map((c) => escapeCsv(r[c.key])).concat([escapeCsv(r.notes)]).join(',')
  );
  return [headers.join(','), ...rows].join('\r\n');
}

export function generateAbcPrintHtml(options: {
  incidents: AbcIncident[];
  studentName: string;
  studentAge?: string | number;
  from: string;
  to: string;
  behaviorFilter: string;
  categoryFilter: string;
  stats: AbcStats | null;
  columns: Array<{ key: keyof AbcIncident; label: string }>;
}): string {
  const {
    incidents,
    studentName,
    studentAge,
    from,
    to,
    behaviorFilter,
    categoryFilter,
    stats,
    columns,
  } = options;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
      <div style="margin-bottom: 16px; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <div><strong>Student:</strong> ${studentName} (Age: ${studentAge ?? '—'})</div>
          <div><strong>Date Range:</strong> ${from || 'Any'} to ${to || 'Any'}</div>
        </div>
        <div style="display: flex; gap: 16px; font-size: 12px; color: #64748b;">
          <span><strong>Behavior Filter:</strong> ${behaviorFilter}</span>
          <span><strong>Category Filter:</strong> ${categoryFilter}</span>
        </div>
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 20px;">
        <div style="flex: 1; padding: 10px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; text-align: center;">
          <div style="font-size: 11px; color: #0369a1; text-transform: uppercase; font-weight: 600;">Total Incidents</div>
          <div style="font-size: 20px; font-weight: 700; color: #0284c7;">${stats?.totalIncidents ?? 0}</div>
        </div>
        <div style="flex: 1; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; text-align: center;">
          <div style="font-size: 11px; color: #475569; text-transform: uppercase; font-weight: 600;">Most Common Behavior</div>
          <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 4px;">${stats?.mostCommonBehavior ?? 'N/A'}</div>
        </div>
        <div style="flex: 1; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; text-align: center;">
          <div style="font-size: 11px; color: #475569; text-transform: uppercase; font-weight: 600;">Most Common Antecedent</div>
          <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 4px;">${stats?.mostCommonAntecedent ?? 'N/A'}</div>
        </div>
        <div style="flex: 1; padding: 10px; background: #fefce8; border: 1px solid #fef08a; border-radius: 6px; text-align: center;">
          <div style="font-size: 11px; color: #854d0e; text-transform: uppercase; font-weight: 600;">This Week</div>
          <div style="font-size: 20px; font-weight: 700; color: #ca8a04;">${stats?.thisWeek ?? 0}</div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            ${columns.map((col) => `<th style="padding: 8px 6px; border: 1px solid #e2e8f0;">${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${incidents.length === 0 ? '<tr><td colspan="10" style="padding: 16px; text-align: center; color: #64748b;">No incidents found for the selected filters.</td></tr>' : ''}
          ${incidents.map((inc, i) => `
            <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              ${columns.map((col) => `
                <td style="padding: 6px; border: 1px solid #e2e8f0; ${col.key === 'behavior' ? 'font-weight: 600;' : ''}">
                  ${inc[col.key] || '—'}
                </td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
