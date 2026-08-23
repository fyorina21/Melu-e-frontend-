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
    // Instead of downloading HTML files, trigger print-to-PDF immediately
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

export function openPrintWindow(bodyHtml: string, title = 'Print'): boolean {
  if (!isWeb()) return false;
  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title></head><body>${bodyHtml}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
  return true;
}