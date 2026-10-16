// src/screens/assessments/abllsExportHelper.ts

import type { AbllsSummaryDomain } from './types';
import { getMaxCellsForItem, getFilledCells } from './types';

export interface AbllsExportOptions {
  studentName: string;
  age: number | string;
  dateStr?: string;
  summaryData: AbllsSummaryDomain[];
}

export function generateAbllsExportHtml({
  studentName,
  age,
  dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }),
  summaryData,
}: AbllsExportOptions): string {
  const title = 'ABLLS-R Skill Tracking System & Color Need Map';

  const priorityAreas = [...summaryData]
    .sort((a, b) => b.c0 - a.c0 || b.c1 - a.c1)
    .slice(0, 3)
    .map((d, idx) => ({ rank: idx + 1, name: d.name, c0: d.c0, c1: d.c1 }));

  const priorityNames = new Set(priorityAreas.map((p) => p.name));
  const rows = summaryData.map((d) => ({
    ...d,
    isPriority: priorityNames.has(d.name),
  }));

  const towersHtml = summaryData
    .map((domain) => {
      const reversedItems = [...domain.items].reverse();
      const rowsHtml = reversedItems
        .map((item) => {
          const maxCells = getMaxCellsForItem(item);
          const filledCount = getFilledCells(item);
          const scoreNum =
            typeof item.score === 'number' ? item.score : parseInt(String(item.score), 10);
          const cellColor = item.score === 0 ? '#EF4444' : scoreNum >= 2 ? '#16A34A' : '#EAB308';
          const cellsHtml = Array.from({ length: maxCells }, (_, cIdx) => {
            const isFilled = cIdx < filledCount;
            const bg = isFilled ? cellColor : item.score === 'NA' ? '#E2E8F0' : '#FFFFFF';
            return `<span class="cell" style="background-color: ${bg}; border: 1.5px solid #475569;"></span>`;
          }).join('');
          return `
            <div class="tower-row">
              <span class="item-label">${item.id}</span>
              <span class="cells-wrapper">${cellsHtml}</span>
            </div>
          `;
        })
        .join('');

      return `
        <div class="tower-col">
          <div class="tower-body">${rowsHtml}</div>
          <div class="tower-footer">
            <div class="domain-code">${domain.code}</div>
            <div class="domain-title">${domain.name}</div>
            <div class="domain-pct">${domain.masteredPct}%</div>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: landscape; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #0f172a; background: #fff; }
          .sheet-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .sheet-title { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
          .sheet-sub { font-size: 12px; color: #475569; margin-top: 2px; }
          .legend-box { border: 1px solid #0f172a; padding: 8px 12px; font-size: 11px; display: inline-flex; flex-direction: column; gap: 4px; background: #f8fafc; }
          .legend-row { display: flex; align-items: center; gap: 8px; }
          .sample-box { width: 14px; height: 14px; border: 1px solid #0f172a; display: inline-block; }
          .grid-container { display: flex; gap: 16px; overflow-x: auto; align-items: flex-end; padding: 20px; border: 1.5px solid #cbd5e1; background: #f8fafc; }
          .tower-col { display: flex; flex-direction: column; align-items: center; min-width: 140px; }
          .tower-body { display: flex; flex-direction: column; gap: 4px; border: 1.5px solid #0f172a; padding: 6px; background: #fff; width: 100%; box-sizing: border-box; }
          .tower-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
          .item-label { font-size: 11px; font-weight: 800; color: #0f172a; width: 30px; }
          .cells-wrapper { display: flex; gap: 2px; flex: 1; margin-left: 4px; }
          .cell { flex: 1; height: 14px; display: inline-block; box-sizing: border-box; }
          .tower-footer { text-align: center; margin-top: 8px; font-size: 11px; font-weight: 700; width: 100%; word-break: break-word; }
          .domain-code { font-size: 15px; font-weight: 900; }
          .domain-title { font-size: 11px; color: #334155; line-height: 1.2; margin: 3px 0; }
          .domain-pct { font-size: 11px; color: #16a34a; font-weight: 800; }
          .summary-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
          .summary-table th, .summary-table td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
          .summary-table th { background: #f1f5f9; font-weight: 700; }
          .priority-tag { background: #fee2e2; color: #b91c1c; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 9px; }
        </style>
      </head>
      <body>
        <div class="sheet-header">
          <div>
            <div class="sheet-title">Assessment of Basic Language and Learning Skills-Revised (ABLLS-R)</div>
            <div class="sheet-sub">Skill Tracking System &middot; Color Need Analysis Map</div>
            <div style="font-size: 12px; margin-top: 8px;">
              <strong>Student:</strong> ${studentName} &nbsp;|&nbsp; <strong>Age:</strong> ${age} &nbsp;|&nbsp; <strong>Date:</strong> ${dateStr}
            </div>
          </div>
          <div class="legend-box">
            <div class="legend-row">
              <span class="sample-box" style="background: #16A34A;"></span>
              <span>Level 2 — Mastered (All 4 Cells Filled)</span>
            </div>
            <div class="legend-row">
              <span class="sample-box" style="background: #EAB308;"></span>
              <span>Level 1 — Emerging (2 Cells Filled)</span>
            </div>
            <div class="legend-row">
              <span class="sample-box" style="background: #FFFFFF;"></span>
              <span>Level 0 — Not Demonstrated (0 Cells Filled)</span>
            </div>
          </div>
        </div>
        <div class="grid-container">${towersHtml}</div>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Domain Area</th>
              <th>Score 0 (Not Demonstrated)</th>
              <th>Score 1 (Emerging)</th>
              <th>Score 2 (Mastered)</th>
              <th>% Mastered</th>
              <th>Priority Needs Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (d) => `
              <tr>
                <td><strong>${d.code}. ${d.name}</strong></td>
                <td>${d.c0} skills</td>
                <td>${d.c1} skills</td>
                <td>${d.c2} skills</td>
                <td><strong>${d.masteredPct}%</strong></td>
                <td>${d.isPriority ? '<span class="priority-tag">HIGH PRIORITY</span>' : 'Normal'}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
}
