import { describe, expect, it } from 'vitest';
import { useDiffOptions } from '../src/composables/useDiffOptions';

describe('useDiffOptions', () => {
  it('returns the expected default options', () => {
    const { precision, ignoreWhitespace, ignoreCase, options } = useDiffOptions();

    expect(precision.value).toBe('line');
    expect(ignoreWhitespace.value).toBe(false);
    expect(ignoreCase.value).toBe(false);
    expect(options.value).toEqual({
      precision: 'line',
      ignoreWhitespace: false,
      ignoreCase: false
    });
  });

  it('keeps the computed options object in sync with individual refs', () => {
    const { precision, ignoreWhitespace, ignoreCase, options } = useDiffOptions();

    precision.value = 'char';
    ignoreWhitespace.value = true;
    ignoreCase.value = true;

    expect(options.value).toEqual({
      precision: 'char',
      ignoreWhitespace: true,
      ignoreCase: true
    });
  });
});
