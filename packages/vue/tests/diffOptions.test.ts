import { describe, expect, it } from 'vitest';
import { getActiveDiffOptions } from '../src/lib/diffOptions';

describe('getActiveDiffOptions', () => {
  it('returns active options in a stable display order', () => {
    expect(getActiveDiffOptions({
      ignoreWhitespace: true,
      ignoreCase: false,
      collapseUnchanged: true
    })).toEqual([
      { key: 'ignoreWhitespace', label: 'Ignore whitespace' },
      { key: 'collapseUnchanged', label: 'Collapse unchanged' }
    ]);
  });

  it('returns an empty list when no options are active', () => {
    expect(getActiveDiffOptions({
      ignoreWhitespace: false,
      ignoreCase: false,
      collapseUnchanged: false
    })).toEqual([]);
  });
});
