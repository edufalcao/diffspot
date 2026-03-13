import { describe, it, expect } from 'vitest';
import {
  computeDiff,
  generateUnifiedDiff,
  generateHtmlExport,
  generateJsonExport,
  type DiffOptions,
  type DiffResult
} from '../src/index';

const defaultOptions: DiffOptions = {
  precision: 'line',
  ignoreWhitespace: false,
  ignoreCase: false
};

function makeDiff(left: string, right: string): DiffResult {
  return computeDiff(left, right, defaultOptions);
}

describe('generateUnifiedDiff', () => {
  it('produces valid unified diff format with hunk headers', () => {
    const result = makeDiff('foo\nbar\nbaz', 'foo\nqux\nbaz');
    const diff = generateUnifiedDiff(result);

    expect(diff).toContain('--- original');
    expect(diff).toContain('+++ modified');
    expect(diff).toMatch(/@@ -\d+,\d+ \+\d+,\d+ @@/);
    expect(diff).toContain('-bar');
    expect(diff).toContain('+qux');
  });

  it('uses custom labels from metadata', () => {
    const result = makeDiff('a', 'b');
    const diff = generateUnifiedDiff(result, { leftLabel: 'old.txt', rightLabel: 'new.txt' });

    expect(diff).toContain('--- old.txt');
    expect(diff).toContain('+++ new.txt');
  });

  it('includes context lines around changes', () => {
    const left = 'a\nb\nc\nd\ne';
    const right = 'a\nb\nX\nd\ne';
    const result = makeDiff(left, right);
    const diff = generateUnifiedDiff(result);

    // Context lines should appear with a leading space
    expect(diff).toContain(' a');
    expect(diff).toContain(' b');
    expect(diff).toContain('-c');
    expect(diff).toContain('+X');
    expect(diff).toContain(' d');
    expect(diff).toContain(' e');
  });

  it('returns empty hunks for identical texts', () => {
    const result = makeDiff('same\ntext', 'same\ntext');
    const diff = generateUnifiedDiff(result);

    expect(diff).toContain('--- original');
    expect(diff).toContain('+++ modified');
    expect(diff).not.toContain('@@');
  });

  it('handles added-only changes', () => {
    const result = makeDiff('a\n', 'a\nb\n');
    const diff = generateUnifiedDiff(result);

    expect(diff).toContain('+b');
    expect(diff).not.toContain('-b');
  });

  it('handles removed-only changes', () => {
    const result = makeDiff('a\nb\n', 'a\n');
    const diff = generateUnifiedDiff(result);

    expect(diff).toContain('-b');
    expect(diff).not.toContain('+b');
  });
});

describe('generateHtmlExport', () => {
  it('produces valid HTML with doctype and structure', () => {
    const result = makeDiff('hello', 'world');
    const html = generateHtmlExport(result);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    expect(html).toContain('<title>');
    expect(html).toContain('diffspot report');
  });

  it('HTML-escapes content to prevent XSS', () => {
    const result = makeDiff('<script>alert("xss")</script>', 'safe');
    const html = generateHtmlExport(result);

    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });

  it('includes stats in the output', () => {
    const result = makeDiff('foo\nbar', 'foo\nbaz');
    const html = generateHtmlExport(result);

    expect(html).toContain(`+${result.additions} added`);
    expect(html).toContain(`-${result.removals} removed`);
    expect(html).toContain(`${result.unchanged} unchanged`);
  });

  it('uses metadata labels and timestamp', () => {
    const result = makeDiff('a', 'b');
    const html = generateHtmlExport(result, {
      leftLabel: 'file-a.txt',
      rightLabel: 'file-b.txt',
      timestamp: '2026-01-01T00:00:00Z'
    });

    expect(html).toContain('file-a.txt');
    expect(html).toContain('file-b.txt');
    expect(html).toContain('2026-01-01T00:00:00Z');
  });

  it('renders word-level highlights when present', () => {
    const result = computeDiff('hello world', 'hello earth', {
      ...defaultOptions,
      precision: 'word'
    });
    const html = generateHtmlExport(result);

    // Should contain highlight spans for word-level changes
    expect(html).toContain('rgba(0,229,204,0.25)');
  });
});

describe('generateJsonExport', () => {
  it('produces valid JSON', () => {
    const result = makeDiff('a', 'b');
    const json = generateJsonExport(result);
    const parsed = JSON.parse(json);

    expect(parsed).toHaveProperty('metadata');
    expect(parsed).toHaveProperty('result');
    expect(parsed.result.lines).toBeInstanceOf(Array);
  });

  it('includes metadata when provided', () => {
    const result = makeDiff('a', 'b');
    const json = generateJsonExport(result, {
      timestamp: '2026-01-01',
      leftLabel: 'old',
      rightLabel: 'new'
    });
    const parsed = JSON.parse(json);

    expect(parsed.metadata.timestamp).toBe('2026-01-01');
    expect(parsed.metadata.leftLabel).toBe('old');
    expect(parsed.metadata.rightLabel).toBe('new');
  });

  it('preserves diff result structure', () => {
    const result = makeDiff('foo\nbar', 'foo\nbaz');
    const json = generateJsonExport(result);
    const parsed = JSON.parse(json);

    expect(parsed.result.additions).toBe(result.additions);
    expect(parsed.result.removals).toBe(result.removals);
    expect(parsed.result.unchanged).toBe(result.unchanged);
    expect(parsed.result.lines.length).toBe(result.lines.length);
  });

  it('is pretty-printed with 2-space indent', () => {
    const result = makeDiff('a', 'b');
    const json = generateJsonExport(result);

    // Pretty-printed JSON has newlines and indentation
    expect(json).toContain('\n');
    expect(json).toContain('  ');
  });
});
