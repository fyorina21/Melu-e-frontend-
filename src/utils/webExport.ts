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

export function openPrintWindow(bodyHtml: string, title = 'Print Document'): boolean {
  if (!isWeb()) return false;
  const win = window.open('', '_blank');
  if (!win) return false;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @media print {
      @page { margin: 16mm; size: auto; }
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
      margin: 2px 0 0 0;
    }
    .print-timestamp {
      font-size: 11px;
      color: #6B7280;
      text-align: right;
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
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="print-header">
    <div>
      <h1 class="brand-title">Melu'e Foundation</h1>
      <p class="doc-subtitle">${title} — Official Clinical Record</p>
    </div>
    <div class="print-timestamp">
      Printed: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
    </div>
  </div>
  <div class="print-content">
    ${bodyHtml.includes('<div') || bodyHtml.includes('<p') ? bodyHtml : `<div class="print-body">${bodyHtml.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`}
  </div>
  <div class="footer-note">
    Melu'e Clinical Therapy System · Confidential Student Document · Do Not Distribute Without Authorization
  </div>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 350);
  return true;
}