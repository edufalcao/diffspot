import type { DiffResult, ExportFormat } from '@diffspot/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useExport } from '../src/composables/useExport';

const sampleResult: DiffResult = {
  lines: [
    { type: 'removed', content: 'before', oldLineNumber: 1 },
    { type: 'added', content: 'after', newLineNumber: 1 }
  ],
  additions: 1,
  removals: 1,
  unchanged: 0
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useExport', () => {
  it('delegates print exports to window.print', () => {
    const print = vi.fn();

    vi.stubGlobal('window', { print } as unknown as Window);

    const { exportAs } = useExport();
    exportAs('print', sampleResult);

    expect(print).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['unified-diff', 'diff-export.diff'],
    ['html', 'diff-report.html'],
    ['json', 'diff-data.json']
  ] satisfies [ExportFormat, string][])('downloads %s exports with the expected filename', (format, filename) => {
    const click = vi.fn();
    const anchor = {
      click,
      download: '',
      href: ''
    };
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();

    vi.stubGlobal('window', { print: vi.fn() } as unknown as Window);
    vi.stubGlobal('document', {
      createElement: vi.fn(() => anchor),
      body: {
        appendChild,
        removeChild
      }
    } as unknown as Document);
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL
    } as unknown as typeof URL);

    const { exportAs } = useExport();
    exportAs(format, sampleResult, {
      leftLabel: 'old.txt',
      rightLabel: 'new.txt'
    });

    expect(anchor.download).toBe(filename);
    expect(click).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(appendChild).toHaveBeenCalledWith(anchor);
    expect(removeChild).toHaveBeenCalledWith(anchor);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });
});
