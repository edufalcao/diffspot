import type { DiffResult, ExportFormat, ExportMetadata } from '@diffspot/core';
import { generateUnifiedDiff, generateHtmlExport, generateJsonExport } from '@diffspot/core';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * App-level export composable. Delegates to @diffspot/core generators.
 */
export function useExport() {
  function print() {
    window.print();
  }

  function exportAs(format: ExportFormat, result: DiffResult, metadata?: ExportMetadata) {
    switch (format) {
      case 'print':
        print();
        break;
      case 'unified-diff': {
        const diff = generateUnifiedDiff(result, metadata);
        downloadFile(diff, 'diff-export.diff', 'text/x-diff');
        break;
      }
      case 'html': {
        const html = generateHtmlExport(result, metadata);
        downloadFile(html, 'diff-report.html', 'text/html');
        break;
      }
      case 'json': {
        const json = generateJsonExport(result, metadata);
        downloadFile(json, 'diff-data.json', 'application/json');
        break;
      }
    }
  }

  return { print, exportAs };
}

/**
 * @deprecated Use `useExport()` instead.
 */
export function usePrint() {
  const { print } = useExport();
  return { print };
}
