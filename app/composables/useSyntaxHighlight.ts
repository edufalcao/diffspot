import { computed, shallowRef, watch, type Ref } from 'vue';
import type { DiffLine } from '@diffspot/core';
import { highlightTree, classHighlighter } from '@lezer/highlight';
import type { Parser, Tree } from '@lezer/common';

export interface SyntaxSpan {
  text: string,
  cls: string
}

const parserLoaders: Record<string, () => Promise<Parser>> = {
  javascript: async () => (await import('@codemirror/lang-javascript')).javascriptLanguage.parser,
  typescript: async () => (await import('@codemirror/lang-javascript')).typescriptLanguage.parser,
  jsx: async () => (await import('@codemirror/lang-javascript')).jsxLanguage.parser,
  tsx: async () => (await import('@codemirror/lang-javascript')).tsxLanguage.parser,
  python: async () => (await import('@codemirror/lang-python')).pythonLanguage.parser,
  html: async () => (await import('@codemirror/lang-html')).htmlLanguage.parser,
  css: async () => (await import('@codemirror/lang-css')).cssLanguage.parser,
  json: async () => (await import('@codemirror/lang-json')).jsonLanguage.parser,
  markdown: async () => (await import('@codemirror/lang-markdown')).markdownLanguage.parser,
  xml: async () => (await import('@codemirror/lang-xml')).xmlLanguage.parser,
  java: async () => (await import('@codemirror/lang-java')).javaLanguage.parser,
  cpp: async () => (await import('@codemirror/lang-cpp')).cppLanguage.parser,
  c: async () => (await import('@codemirror/lang-cpp')).cppLanguage.parser,
  rust: async () => (await import('@codemirror/lang-rust')).rustLanguage.parser,
  go: async () => (await import('@codemirror/lang-go')).goLanguage.parser,
  php: async () => (await import('@codemirror/lang-php')).phpLanguage.parser,
  sql: async () => (await import('@codemirror/lang-sql')).StandardSQL.language.parser
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
  const parser = shallowRef<Parser | null>(null);
  let currentParserRequest = 0;

  watch(
    language,
    async (languageValue) => {
      const requestId = ++currentParserRequest;
      const loader = parserLoaders[languageValue];

      if (!loader) {
        parser.value = null;
        return;
      }

      try {
        const loadedParser = await loader();
        if (requestId === currentParserRequest) {
          parser.value = loadedParser;
        }
      } catch {
        if (requestId === currentParserRequest) {
          parser.value = null;
        }
      }
    },
    { immediate: true }
  );

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
