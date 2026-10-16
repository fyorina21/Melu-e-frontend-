import { Platform } from 'react-native';

export function isWeb(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined';
}

export function downloadBlob(filename: string, content: string | Blob, mime = 'text/plain'): boolean {
  if (!isWeb() || typeof document === 'undefined') return false;
  const blob = typeof content === 'string' ? new Blob([content], { type: mime }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

export function downloadTextFile(filename: string, text: string): boolean {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.html')) {
    const title = filename.replace('.html', '').replace(/_/g, ' ');
    return openPrintWindow(text, title);
  }

  let mime = 'text/plain;charset=utf-8';
  if (lower.endsWith('.csv')) {
    mime = 'text/csv;charset=utf-8';
  } else if (lower.endsWith('.json')) {
    mime = 'application/json;charset=utf-8';
  } else if (lower.endsWith('.pdf')) {
    mime = 'application/pdf';
  }
  const ok = downloadBlob(filename, text, mime);
  return ok;
}

export interface PrintOptions {
  formId?: string;
  revisionNumber?: string;
  pageNumber?: number;
  totalPages?: number;
}

function escapeHtml(str: unknown): string {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function openPrintWindow(
  bodyHtml: string,
  title = 'Print Document',
  options: PrintOptions = {}
): boolean {
  if (!isWeb() || typeof window === 'undefined') return false;

  const safeFormId = escapeHtml(options.formId || 'MCTC-TRP-015');
  const safeRevisionNumber = escapeHtml(options.revisionNumber || 'Rev: August 2025');
  const pageNum = Number(options.pageNumber) || 1;
  const totalPages = Number(options.totalPages) || 1;
  const safeTitle = escapeHtml(title);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <style>
    @media print {
      @page {
        margin: 16mm;
        size: auto;
        @bottom-right {
          content: "Page " counter(page) " of " counter(pages);
        }
      }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1A2233;
      background-color: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 13px;
      line-height: 1.6;
    }
    .print-header {
      border-bottom: 2px solid #F6C445;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: #1A2233;
      margin: 0;
    }
    .doc-subtitle {
      font-size: 11px;
      color: #6B7280;
      margin: 2px 0 4px 0;
    }
    .header-metadata {
      font-size: 10px;
      font-weight: 600;
      color: #4B5563;
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    .header-metadata span {
      background: #F3F4F6;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #E5E7EB;
    }
    .print-timestamp {
      font-size: 11px;
      color: #6B7280;
      text-align: right;
    }
    .page-indicator {
      font-size: 11px;
      font-weight: 700;
      color: #1A2233;
      margin-top: 4px;
    }
    .print-body {
      white-space: pre-wrap;
      font-family: monospace, monospace;
      font-size: 12px;
      line-height: 1.5;
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 16px;
    }
    .footer-note {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #E5E7EB;
      font-size: 10px;
      color: #9CA3AF;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="print-header">
    <div>
      <h1 class="brand-title">Melu'e Foundation</h1>
      <p class="doc-subtitle">${safeTitle} — Official Clinical Record</p>
      <div class="header-metadata">
        <span>Form ID: ${safeFormId}</span>
        <span>Revision: ${safeRevisionNumber}</span>
        <span>Page ${pageNum} of ${totalPages}</span>
      </div>
    </div>
    <div class="print-timestamp">
      <div>Printed: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
      <div class="page-indicator">Page ${pageNum} of ${totalPages}</div>
    </div>
  </div>
  <div class="print-content">
    ${bodyHtml.includes('<div') || bodyHtml.includes('<p') ? bodyHtml : `<div class="print-body">${escapeHtml(bodyHtml)}</div>`}
  </div>
  <div class="footer-note">
    <span>Melu'e Clinical Therapy System · Confidential Student Document</span>
    <span>Form ID: ${safeFormId} | ${safeRevisionNumber} | Page ${pageNum} of ${totalPages}</span>
  </div>
  <script>
    window.addEventListener('load', function() {
      window.focus();
      setTimeout(function() { window.print(); }, 350);
    });
  </script>
</body>
</html>`;

  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (!win) {
      URL.revokeObjectURL(blobUrl);
      return false;
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    return true;
  } catch {
    return false;
  }
}