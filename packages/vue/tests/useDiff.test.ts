import type { DiffOptions } from '@diffspot/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

const baseOptions: DiffOptions = {
  precision: 'line',
  ignoreWhitespace: false,
  ignoreCase: false
};

class MockWorker {
  private readonly messageHandlers = new Set<(event: { data: unknown }) => void>();
  private readonly errorHandlers = new Set<(event: unknown) => void>();

  addEventListener(type: string, handler: (event: unknown) => void) {
    if (type === 'message') {
      this.messageHandlers.add(handler as (event: { data: unknown }) => void);
    }

    if (type === 'error') {
      this.errorHandlers.add(handler);
    }
  }

  removeEventListener(type: string, handler: (event: unknown) => void) {
    if (type === 'message') {
      this.messageHandlers.delete(handler as (event: { data: unknown }) => void);
    }

    if (type === 'error') {
      this.errorHandlers.delete(handler);
    }
  }

  postMessage(payload: { id: number, left: string, right: string, options: DiffOptions }) {
    queueMicrotask(async () => {
      try {
        const { computeDiff } = await import('@diffspot/core');
        const result = computeDiff(payload.left, payload.right, payload.options);

        for (const handler of this.messageHandlers) {
          handler({ data: { id: payload.id, result } });
        }
      } catch (error) {
        for (const handler of this.errorHandlers) {
          handler(error);
        }
      }
    });
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('useDiff', () => {
  it('uses the worker result when a Worker implementation is available', async () => {
    vi.stubGlobal('Worker', MockWorker as unknown as typeof Worker);

    const { useDiff } = await import('../src/composables/useDiff');
    const { compute, isComputing, result } = useDiff('alpha\nbeta', 'alpha\ngamma', baseOptions);

    await compute();

    expect(isComputing.value).toBe(false);
    expect(result.value.additions).toBe(1);
    expect(result.value.removals).toBe(1);
    expect(result.value.unchanged).toBe(1);
  });

  it('falls back to synchronous computation when Worker creation fails', async () => {
    function FailingWorker() {
      throw new Error('worker unavailable');
    }

    vi.stubGlobal('Worker', FailingWorker as unknown as typeof Worker);

    const { useDiff } = await import('../src/composables/useDiff');
    const { compute, result } = useDiff('hello\nworld', 'hello\nearth', baseOptions);

    await compute();

    expect(result.value.additions).toBe(1);
    expect(result.value.removals).toBe(1);
    expect(result.value.unchanged).toBe(1);
  });
});
