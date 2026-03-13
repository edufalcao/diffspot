import type { DiffLine, CollapsedRegion } from './types';

/**
 * Find regions of consecutive unchanged lines that can be collapsed.
 * Keeps `contextLines` visible before and after each change.
 * At the very start/end of the file, no leading/trailing context is kept.
 * Only collapses when at least 2 lines would be hidden (otherwise not worth it).
 */
export function computeCollapsedRegions(lines: DiffLine[], contextLines = 3): CollapsedRegion[] {
  const regions: CollapsedRegion[] = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i]!.type === 'unchanged') {
      const start = i;
      while (i < lines.length && lines[i]!.type === 'unchanged') i++;
      const end = i - 1;
      const runLength = end - start + 1;

      // At file boundaries, don't keep context facing outward
      const keepBefore = start === 0 ? 0 : contextLines;
      const keepAfter = i === lines.length ? 0 : contextLines;
      const minRequired = keepBefore + keepAfter + 2;

      if (runLength >= minRequired) {
        const collapseStart = start + keepBefore;
        const collapseEnd = end - keepAfter;
        if (collapseEnd >= collapseStart) {
          regions.push({
            startIndex: collapseStart,
            endIndex: collapseEnd,
            count: collapseEnd - collapseStart + 1
          });
        }
      }
    } else {
      i++;
    }
  }

  return regions;
}
