import * as Diff from 'diff';
import type { ArrayChange, Change } from 'diff';
import type { DiffOptions, DiffResult, DiffLine, DiffWord } from './types';

function stripTrailingCarriageReturn(value: string): string {
  return value.endsWith('\r') ? value.slice(0, -1) : value;
}

/**
 * Split a jsdiff change value into individual lines, stripping the trailing
 * newline that jsdiff typically appends.
 */
function splitLines(value: string): string[] {
  const trimmed = value.endsWith('\n') ? value.slice(0, -1) : value;
  if (trimmed === '') return [];
  return trimmed.split('\n').map(stripTrailingCarriageReturn);
}

/**
 * Run `Diff.diffWords` on two strings and return an array of `DiffWord`
 * segments that can be used for inline highlighting.
 */
function computeInlineWords(
  oldText: string,
  newText: string,
  opts: { ignoreCase: boolean },
  preferredSide: 'old' | 'new' = 'new'
): DiffWord[] {
  const changes = preferredSide === 'new'
    ? Diff.diffWords(oldText, newText, {
        ignoreCase: opts.ignoreCase
      })
    : Diff.diffWords(newText, oldText, {
        ignoreCase: opts.ignoreCase
      });

  return changes.map((c: Change) => ({
    value: c.value,
    ...(preferredSide === 'new'
      ? {
          ...(c.added ? { added: true } : {}),
          ...(c.removed ? { removed: true } : {})
        }
      : {
          ...(c.added ? { removed: true } : {}),
          ...(c.removed ? { added: true } : {})
        })
  }));
}

function normalizeLineForComparison(value: string, opts: DiffOptions): string {
  let normalized = value;

  if (opts.ignoreWhitespace) {
    normalized = normalized.trim();
  }

  if (opts.ignoreCase) {
    normalized = normalized.toLowerCase();
  }

  return normalized;
}

function computeLineDiff(left: string, right: string, opts: DiffOptions): DiffLine[] {
  const leftLines = splitLines(left);
  const rightLines = splitLines(right);
  const changes = Diff.diffArrays(leftLines, rightLines, {
    comparator: (leftLine, rightLine) =>
      normalizeLineForComparison(leftLine, opts) === normalizeLineForComparison(rightLine, opts)
  });

  const lines: DiffLine[] = [];
  let oldLine = 1;
  let newLine = 1;
  let oldIndex = 0;
  let newIndex = 0;

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i] as ArrayChange<string>;
    const lineTexts = change.value;

    if (change.added) {
      const prev = i > 0 ? changes[i - 1] : null;
      const pairedRemovedLines
        = prev && prev.removed ? (prev as ArrayChange<string>).value : null;

      for (let j = 0; j < lineTexts.length; j++) {
        const pairedOld = pairedRemovedLines?.[j];
        const words
          = pairedOld !== undefined
            ? computeInlineWords(pairedOld, lineTexts[j]!, opts, 'new').filter(
                w => !w.removed
              )
            : undefined;

        lines.push({
          type: 'added',
          content: lineTexts[j]!,
          newLineNumber: newLine++,
          ...(words ? { words } : {})
        });
      }
      newIndex += lineTexts.length;
    } else if (change.removed) {
      const next = i + 1 < changes.length ? changes[i + 1] : null;
      const pairedAddedLines
        = next && next.added ? (next as ArrayChange<string>).value : null;

      for (let j = 0; j < lineTexts.length; j++) {
        const pairedNew = pairedAddedLines?.[j];
        const words
          = pairedNew !== undefined
            ? computeInlineWords(lineTexts[j]!, pairedNew, opts, 'old').filter(
                w => !w.added
              )
            : undefined;

        lines.push({
          type: 'removed',
          content: lineTexts[j]!,
          oldLineNumber: oldLine++,
          ...(words ? { words } : {})
        });
      }
      oldIndex += lineTexts.length;
    } else {
      for (let j = 0; j < lineTexts.length; j++) {
        const oldContent = leftLines[oldIndex]!;
        const newContent = rightLines[newIndex]!;

        lines.push({
          type: 'unchanged',
          content: oldContent,
          ...(oldContent !== newContent
            ? {
                oldContent,
                newContent
              }
            : {}),
          oldLineNumber: oldLine++,
          newLineNumber: newLine++
        });
        oldIndex++;
        newIndex++;
      }
    }
  }

  return lines;
}

function computeWordDiff(left: string, right: string, opts: DiffOptions): DiffLine[] {
  const changes = Diff.diffWords(left, right, {
    ignoreCase: opts.ignoreCase
  });

  const lines: DiffLine[] = [];
  let oldLine = 1;
  let newLine = 1;
  let currentWords: DiffWord[] = [];

  function pushLine() {
    if (currentWords.length === 0) return;
    const content = currentWords.map(w => w.value).join('');

    const hasAdded = currentWords.some(w => w.added);
    const hasRemoved = currentWords.some(w => w.removed);

    let type: DiffLine['type'] = 'unchanged';
    if (hasAdded && !hasRemoved) type = 'added';
    else if (hasRemoved && !hasAdded) type = 'removed';
    else if (hasAdded || hasRemoved) type = 'unchanged';

    lines.push({
      type,
      content,
      ...(type !== 'added' ? { oldLineNumber: oldLine++ } : {}),
      ...(type !== 'removed' ? { newLineNumber: newLine++ } : {}),
      words: [...currentWords]
    });
    currentWords = [];
  }

  for (const change of changes) {
    const parts = change.value.split('\n').map(stripTrailingCarriageReturn);
    for (let p = 0; p < parts.length; p++) {
      if (p > 0) {
        pushLine();
      }
      if (parts[p] !== '' || p === 0) {
        currentWords.push({
          value: parts[p]!,
          ...(change.added ? { added: true } : {}),
          ...(change.removed ? { removed: true } : {})
        });
      }
    }
  }
  pushLine();

  return lines;
}

function computeCharDiff(left: string, right: string, opts: DiffOptions): DiffLine[] {
  const changes = Diff.diffChars(left, right, {
    ignoreCase: opts.ignoreCase
  });

  const lines: DiffLine[] = [];
  let oldLine = 1;
  let newLine = 1;
  let currentWords: DiffWord[] = [];

  function pushLine() {
    if (currentWords.length === 0) return;
    const content = currentWords.map(w => w.value).join('');

    const hasAdded = currentWords.some(w => w.added);
    const hasRemoved = currentWords.some(w => w.removed);

    let type: DiffLine['type'] = 'unchanged';
    if (hasAdded && !hasRemoved) type = 'added';
    else if (hasRemoved && !hasAdded) type = 'removed';

    lines.push({
      type,
      content,
      ...(type !== 'added' ? { oldLineNumber: oldLine++ } : {}),
      ...(type !== 'removed' ? { newLineNumber: newLine++ } : {}),
      words: [...currentWords]
    });
    currentWords = [];
  }

  for (const change of changes) {
    const parts = change.value.split('\n').map(stripTrailingCarriageReturn);
    for (let p = 0; p < parts.length; p++) {
      if (p > 0) pushLine();
      if (parts[p] !== '' || p === 0) {
        currentWords.push({
          value: parts[p]!,
          ...(change.added ? { added: true } : {}),
          ...(change.removed ? { removed: true } : {})
        });
      }
    }
  }
  pushLine();

  return lines;
}

export function computeDiff(left: string, right: string, options: DiffOptions): DiffResult {
  let lines: DiffLine[];

  switch (options.precision) {
    case 'word':
      lines = computeWordDiff(left, right, options);
      break;
    case 'char':
      lines = computeCharDiff(left, right, options);
      break;
    case 'line':
    default:
      lines = computeLineDiff(left, right, options);
      break;
  }

  const additions = lines.filter(l => l.type === 'added').length;
  const removals = lines.filter(l => l.type === 'removed').length;
  const unchanged = lines.filter(l => l.type === 'unchanged').length;

  return { lines, additions, removals, unchanged };
}
