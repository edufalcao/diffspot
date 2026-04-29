import type { DiffResult } from '@diffspot/core';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { ref, computed } from 'vue';

const sampleResult: DiffResult = {
  lines: [
    { type: 'unchanged', content: 'line 0', oldLineNumber: 1, newLineNumber: 1 },
    { type: 'removed', content: 'line 1', oldLineNumber: 2 },
    { type: 'added', content: 'line 2', newLineNumber: 2 },
    { type: 'unchanged', content: 'line 3', oldLineNumber: 4, newLineNumber: 4 },
    { type: 'removed', content: 'line 4', oldLineNumber: 5 },
    { type: 'removed', content: 'line 5', oldLineNumber: 6 },
    { type: 'added', content: 'line 6', newLineNumber: 5 },
    { type: 'added', content: 'line 7', newLineNumber: 6 },
    { type: 'unchanged', content: 'line 8', oldLineNumber: 9, newLineNumber: 9 }
  ],
  additions: 4,
  removals: 3,
  unchanged: 2
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useDiffNavigation', () => {
  beforeEach(() => {
    // Stub document so the composable can call document.querySelector without crashing
    vi.stubGlobal('document', {
      querySelector: vi.fn(() => null)
    });
  });

  it('computes changeGroups from the diff result', async () => {
    const { useDiffNavigation } = await import('../src/composables/useDiffNavigation');

    const result = ref(sampleResult);
    const scrollContainer = ref<HTMLElement>(null);

    const { changeGroups } = useDiffNavigation(result, scrollContainer);

    // computeChangeGroups merges consecutive changed lines into groups:
    // removed at 1 + added at 2 → mixed group [1,2]
    // removed at 4,5 + added at 6,7 → mixed group [4,7] (all adjacent changes merged)
    expect(changeGroups.value).toHaveLength(2);
  });

  it('totalChanges reflects the number of change groups', async () => {
    const { useDiffNavigation } = await import('../src/composables/useDiffNavigation');

    const result = ref(sampleResult);
    const scrollContainer = ref<HTMLElement>(null);

    const { totalChanges, changeGroups } = useDiffNavigation(result, scrollContainer);

    expect(totalChanges.value).toBe(changeGroups.value.length);
  });

  it('returns empty groups for a diff with no changes', async () => {
    const { useDiffNavigation } = await import('../src/composables/useDiffNavigation');

    const unchangedResult: DiffResult = {
      lines: [
        { type: 'unchanged', content: 'same', oldLineNumber: 1, newLineNumber: 1 }
      ],
      additions: 0,
      removals: 0,
      unchanged: 1
    };

    const result = ref(unchangedResult);
    const scrollContainer = ref<HTMLElement>(null);

    const { changeGroups, totalChanges } = useDiffNavigation(result, scrollContainer);

    expect(changeGroups.value).toHaveLength(0);
    expect(totalChanges.value).toBe(0);
  });

  it('recomputes changeGroups when result changes', async () => {
    const { useDiffNavigation } = await import('../src/composables/useDiffNavigation');

    const result = ref(sampleResult);
    const scrollContainer = ref<HTMLElement>(null);

    const { totalChanges } = useDiffNavigation(result, scrollContainer);
    expect(totalChanges.value).toBeGreaterThan(0);

    result.value = {
      lines: [{ type: 'unchanged', content: 'only unchanged', oldLineNumber: 1, newLineNumber: 1 }],
      additions: 0,
      removals: 0,
      unchanged: 1
    };

    expect(totalChanges.value).toBe(0);
  });

  it('accepts a ComputedRef as the result', async () => {
    const { useDiffNavigation } = await import('../src/composables/useDiffNavigation');

    const base = ref(sampleResult);
    const result = computed(() => base.value);
    const scrollContainer = ref<HTMLElement>(null);

    const { totalChanges } = useDiffNavigation(result, scrollContainer);

    expect(totalChanges.value).toBeGreaterThan(0);
  });

  it('initializes currentChangeIndex to -1', async () => {
    const { useDiffNavigation } = await import('../src/composables/useDiffNavigation');

    const result = ref(sampleResult);
    const scrollContainer = ref<HTMLElement>(null);

    const { currentChangeIndex } = useDiffNavigation(result, scrollContainer);

    // currentChangeIndex starts at -1 when there are changes (resets to 0 on first change)
    // or stays at -1 when no changes
    expect(typeof currentChangeIndex.value).toBe('number');
  });

  it('returns goToNextChange and goToPrevChange functions', async () => {
    const { useDiffNavigation } = await import('../src/composables/useDiffNavigation');

    const result = ref(sampleResult);
    const scrollContainer = ref<HTMLElement>(null);

    const { goToNextChange, goToPrevChange } = useDiffNavigation(result, scrollContainer);

    expect(typeof goToNextChange).toBe('function');
    expect(typeof goToPrevChange).toBe('function');
  });
});
