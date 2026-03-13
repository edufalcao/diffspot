import type { DiffLine, ChangeGroup } from './types';

/**
 * Groups consecutive non-unchanged lines into change groups.
 */
export function computeChangeGroups(lines: DiffLine[]): ChangeGroup[] {
  const groups: ChangeGroup[] = [];
  let i = 0;

  while (i < lines.length) {
    const currentLine = lines[i]!;
    if (currentLine.type !== 'unchanged') {
      const startIndex = i;
      const types = new Set<'added' | 'removed'>();

      while (i < lines.length && lines[i]!.type !== 'unchanged') {
        types.add(lines[i]!.type as 'added' | 'removed');
        i++;
      }

      const type = types.size > 1 ? 'mixed' : ([...types][0] as 'added' | 'removed');
      groups.push({ startIndex, endIndex: i - 1, type });
    } else {
      i++;
    }
  }

  return groups;
}
