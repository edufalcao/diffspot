import type { DiffResult, DiffLine, ExportMetadata } from './types';

/**
 * HTML-escape a string to prevent XSS in generated HTML.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Build unified diff hunks from DiffLine[], using 3 lines of context.
 */
function buildHunks(lines: DiffLine[]): { startOld: number, countOld: number, startNew: number, countNew: number, body: string }[] {
  const CONTEXT = 3;
  const hunks: { startOld: number, countOld: number, startNew: number, countNew: number, body: string }[] = [];

  // Find ranges of changed lines
  const changeRanges: { start: number, end: number }[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i]!.type !== 'unchanged') {
      const start = i;
      while (i < lines.length && lines[i]!.type !== 'unchanged') i++;
      changeRanges.push({ start, end: i - 1 });
    } else {
      i++;
    }
  }

  if (changeRanges.length === 0) return [];

  // Merge ranges that overlap when context is added
  const mergedRanges: { start: number, end: number }[] = [];
  let current = { start: changeRanges[0]!.start, end: changeRanges[0]!.end };

  for (let r = 1; r < changeRanges.length; r++) {
    const range = changeRanges[r]!;
    // If gap between end of previous context and start of next context is <= 0, merge
    if (range.start - current.end <= CONTEXT * 2 + 1) {
      current.end = range.end;
    } else {
      mergedRanges.push({ ...current });
      current = { start: range.start, end: range.end };
    }
  }
  mergedRanges.push(current);

  // Generate hunks from merged ranges
  for (const range of mergedRanges) {
    const hunkStart = Math.max(0, range.start - CONTEXT);
    const hunkEnd = Math.min(lines.length - 1, range.end + CONTEXT);

    let oldCount = 0;
    let newCount = 0;
    let startOld = 0;
    let startNew = 0;
    let body = '';
    let firstOld = true;
    let firstNew = true;

    for (let j = hunkStart; j <= hunkEnd; j++) {
      const line = lines[j]!;
      if (line.type === 'unchanged') {
        if (firstOld && line.oldLineNumber != null) {
          startOld = line.oldLineNumber;
          firstOld = false;
        }
        if (firstNew && line.newLineNumber != null) {
          startNew = line.newLineNumber;
          firstNew = false;
        }
        oldCount++;
        newCount++;
        body += ` ${line.content}\n`;
      } else if (line.type === 'removed') {
        if (firstOld && line.oldLineNumber != null) {
          startOld = line.oldLineNumber;
          firstOld = false;
        }
        oldCount++;
        body += `-${line.content}\n`;
      } else {
        if (firstNew && line.newLineNumber != null) {
          startNew = line.newLineNumber;
          firstNew = false;
        }
        newCount++;
        body += `+${line.content}\n`;
      }
    }

    // Fallback if no line numbers were found
    if (firstOld) startOld = 1;
    if (firstNew) startNew = 1;

    hunks.push({ startOld, countOld: oldCount, startNew, countNew: newCount, body });
  }

  return hunks;
}

/**
 * Generate a unified diff (patch) string from a DiffResult.
 *
 * Produces standard `@@ -old,count +new,count @@` hunk headers with 3 lines of context.
 */
export function generateUnifiedDiff(result: DiffResult, metadata?: ExportMetadata): string {
  const leftLabel = metadata?.leftLabel ?? 'original';
  const rightLabel = metadata?.rightLabel ?? 'modified';

  let output = '';
  output += `--- ${leftLabel}\n`;
  output += `+++ ${rightLabel}\n`;

  const hunks = buildHunks(result.lines);
  for (const hunk of hunks) {
    output += `@@ -${hunk.startOld},${hunk.countOld} +${hunk.startNew},${hunk.countNew} @@\n`;
    output += hunk.body;
  }

  return output;
}

/**
 * Generate a self-contained HTML report from a DiffResult.
 *
 * The HTML uses inline CSS that replicates diffspot's dark theme
 * (cyan/pink diff colors, JetBrains Mono font). All content is HTML-escaped.
 */
export function generateHtmlExport(result: DiffResult, metadata?: ExportMetadata): string {
  const timestamp = metadata?.timestamp ?? new Date().toISOString();
  const leftLabel = escapeHtml(metadata?.leftLabel ?? 'Original');
  const rightLabel = escapeHtml(metadata?.rightLabel ?? 'Modified');

  let linesHtml = '';
  for (const line of result.lines) {
    let bgColor = 'transparent';
    let prefix = ' ';
    if (line.type === 'added') {
      bgColor = 'rgba(0, 229, 204, 0.08)';
      prefix = '+';
    } else if (line.type === 'removed') {
      bgColor = 'rgba(255, 0, 110, 0.08)';
      prefix = '-';
    }

    const oldNum = line.oldLineNumber != null ? String(line.oldLineNumber) : '';
    const newNum = line.newLineNumber != null ? String(line.newLineNumber) : '';

    // Build content with word-level highlights if available
    let contentHtml: string;
    if (line.words && line.words.length > 0) {
      contentHtml = '';
      for (const word of line.words) {
        const escaped = escapeHtml(word.value);
        if (word.added) {
          contentHtml += `<span style="background:rgba(0,229,204,0.25)">${escaped}</span>`;
        } else if (word.removed) {
          contentHtml += `<span style="background:rgba(255,0,110,0.25)">${escaped}</span>`;
        } else {
          contentHtml += escaped;
        }
      }
    } else {
      contentHtml = escapeHtml(line.content);
    }

    linesHtml += `<div style="display:flex;background:${bgColor};padding:0 8px;line-height:1.7;border-bottom:1px solid rgba(255,255,255,0.03)">`;
    linesHtml += `<span style="min-width:3em;text-align:right;padding-right:8px;color:#8b8b8b;user-select:none">${oldNum}</span>`;
    linesHtml += `<span style="min-width:3em;text-align:right;padding-right:8px;color:#8b8b8b;user-select:none">${newNum}</span>`;
    linesHtml += `<span style="min-width:1.5em;text-align:center;color:#8b8b8b;user-select:none">${prefix}</span>`;
    linesHtml += `<span style="flex:1;white-space:pre-wrap;word-break:break-all">${contentHtml}</span>`;
    linesHtml += `</div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Diff Report — ${leftLabel} vs ${rightLabel}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0d0d0d; color: #f5f5f5; font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace; font-size: 13px; }
  .header { padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .header h1 { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 8px; background: linear-gradient(135deg, #00e5cc, #ff006e); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .meta { color: #8b8b8b; font-size: 12px; display: flex; gap: 24px; flex-wrap: wrap; }
  .stats { padding: 16px 32px; display: flex; gap: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 13px; }
  .stat-added { color: #00e5cc; }
  .stat-removed { color: #ff006e; }
  .stat-unchanged { color: #8b8b8b; }
  .diff { overflow-x: auto; }
  @media print {
    body { background: white; color: black; }
    .header h1 { -webkit-text-fill-color: #333; background: none; }
    .meta, .stats .stat-unchanged { color: #666; }
  }
</style>
</head>
<body>
<div class="header">
  <h1>diffspot report</h1>
  <div class="meta">
    <span>${leftLabel} → ${rightLabel}</span>
    <span>${escapeHtml(timestamp)}</span>
  </div>
</div>
<div class="stats">
  <span class="stat-added">+${result.additions} added</span>
  <span class="stat-removed">-${result.removals} removed</span>
  <span class="stat-unchanged">${result.unchanged} unchanged</span>
</div>
<div class="diff">
${linesHtml}
</div>
</body>
</html>`;
}

/**
 * Generate a JSON export from a DiffResult with optional metadata.
 */
export function generateJsonExport(result: DiffResult, metadata?: ExportMetadata): string {
  return JSON.stringify({ metadata: metadata ?? {}, result }, null, 2);
}
