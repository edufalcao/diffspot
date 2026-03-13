import { computed, type Ref } from 'vue';
import type { DiffLine } from '@diffspot/core';
import { highlightTree, classHighlighter } from '@lezer/highlight';
import type { Parser, Tree } from '@lezer/common';
import { javascriptLanguage, typescriptLanguage, jsxLanguage, tsxLanguage } from '@codemirror/lang-javascript';
import { pythonLanguage } from '@codemirror/lang-python';
import { htmlLanguage } from '@codemirror/lang-html';
import { cssLanguage } from '@codemirror/lang-css';
import { jsonLanguage } from '@codemirror/lang-json';
import { markdownLanguage } from '@codemirror/lang-markdown';
import { xmlLanguage } from '@codemirror/lang-xml';
import { javaLanguage } from '@codemirror/lang-java';
import { cppLanguage } from '@codemirror/lang-cpp';
import { rustLanguage } from '@codemirror/lang-rust';
import { goLanguage } from '@codemirror/lang-go';
import { phpLanguage } from '@codemirror/lang-php';
import { StandardSQL } from '@codemirror/lang-sql';

export interface SyntaxSpan {
  text: string,
  cls: string
}

const parserMap: Record<string, Parser> = {
  javascript: javascriptLanguage.parser,
  typescript: typescriptLanguage.parser,
  jsx: jsxLanguage.parser,
  tsx: tsxLanguage.parser,
  python: pythonLanguage.parser,
  html: htmlLanguage.parser,
  css: cssLanguage.parser,
  json: jsonLanguage.parser,
  markdown: markdownLanguage.parser,
  xml: xmlLanguage.parser,
  java: javaLanguage.parser,
  cpp: cppLanguage.parser,
  c: cppLanguage.parser,
  rust: rustLanguage.parser,
  go: goLanguage.parser,
  php: phpLanguage.parser,
  sql: StandardSQL.language.parser
};

function buildHighlightMap(tree: Tree, text: string): Map<number, SyntaxSpan[]> {
  const lines = text.split('\n');
  const lineStarts: number[] = [];
  let offset = 0;
  for (const line of lines) {
    lineStarts.push(offset);
    offset += line.length + 1;
  }

  // Per-line tracking: current position and accumulated spans
  const lineData: { pos: number, spans: SyntaxSpan[] }[] = lines.map((_, i) => ({
    pos: lineStarts[i]!,
    spans: []
  }));

  // Binary search for the line containing a given character offset
  function findLine(charOffset: number): number {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid]! <= charOffset) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  highlightTree(tree, classHighlighter, (from, to, classes) => {
    const startLine = findLine(from);

    for (let lineIdx = startLine; lineIdx < lines.length; lineIdx++) {
      const lineStart = lineStarts[lineIdx]!;
      const lineEnd = lineStart + lines[lineIdx]!.length;

      if (from >= lineEnd) continue;
      if (to <= lineStart) break;

      const clampedFrom = Math.max(from, lineStart);
      const clampedTo = Math.min(to, lineEnd);
      if (clampedFrom >= clampedTo) continue;

      const entry = lineData[lineIdx]!;

      // Fill unstyled gap before this span
      if (clampedFrom > entry.pos) {
        entry.spans.push({ text: text.slice(entry.pos, clampedFrom), cls: '' });
      }

      entry.spans.push({ text: text.slice(clampedFrom, clampedTo), cls: classes });
      entry.pos = clampedTo;
    }
  });

  // Finalize: add remaining unstyled text for each line
  const result = new Map<number, SyntaxSpan[]>();
  for (let i = 0; i < lines.length; i++) {
    const entry = lineData[i]!;
    const lineStart = lineStarts[i]!;
    const lineEnd = lineStart + lines[i]!.length;

    if (entry.pos < lineEnd) {
      entry.spans.push({ text: text.slice(entry.pos, lineEnd), cls: '' });
    }

    // Only store if there's at least one styled span
    if (entry.spans.some(s => s.cls !== '')) {
      result.set(i + 1, entry.spans); // 1-indexed line number
    }
  }

  return result;
}

/**
 * Provides syntax highlighting for diff lines using Lezer parsers.
 * Parses the full left/right text once, then looks up per-line tokens by line number.
 */
export function useSyntaxHighlight(
  leftText: Ref<string>,
  rightText: Ref<string>,
  language: Ref<string>
) {
  const parser = computed(() => parserMap[language.value] ?? null);

  const leftHighlightMap = computed(() => {
    if (!parser.value) return null;
    const tree = parser.value.parse(leftText.value);
    return buildHighlightMap(tree, leftText.value);
  });

  const rightHighlightMap = computed(() => {
    if (!parser.value) return null;
    const tree = parser.value.parse(rightText.value);
    return buildHighlightMap(tree, rightText.value);
  });

  function highlightLine(line: DiffLine): SyntaxSpan[] | null {
    const isRight = line.type === 'added';
    const map = isRight ? rightHighlightMap.value : leftHighlightMap.value;
    const lineNum = isRight ? line.newLineNumber : line.oldLineNumber;

    if (!map || !lineNum) return null;
    return map.get(lineNum) ?? null;
  }

  return { highlightLine };
}
