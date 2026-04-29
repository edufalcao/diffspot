import { ref, type Ref, type ComputedRef } from 'vue';
import type { DiffOptions, DiffResult } from '@diffspot/core';
import { computeDiff as computeDiffSync } from '@diffspot/core';

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>;

function unref<T>(val: MaybeRef<T>): T {
  return (val as Ref<T>)?.value !== undefined ? (val as Ref<T>).value : (val as T);
}

const emptyResult: DiffResult = { lines: [], additions: 0, removals: 0, unchanged: 0 };

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  }
  return worker;
}

/**
 * Core diff computation composable.
 *
 * Accepts left and right text inputs (plain strings or refs) and a reactive
 * `DiffOptions` object. The diff is only computed when `compute()` is called
 * explicitly — it does NOT react to input changes automatically.
 *
 * Computation runs in a Web Worker to keep the UI responsive on large inputs.
 */
export function useDiff(
  leftText: MaybeRef<string>,
  rightText: MaybeRef<string>,
  options: MaybeRef<DiffOptions>
) {
  const isComputing = ref(false);
  const result = ref<DiffResult>({ ...emptyResult });
  let currentRequestId = 0;

  async function compute(): Promise<void> {
    isComputing.value = true;
    const id = ++currentRequestId;

    const opts: DiffOptions = unref(options);
    const left: string = unref(leftText);
    const right: string = unref(rightText);

    try {
      const w = getWorker();

      const res = await new Promise<DiffResult>((resolve, reject) => {
        const handler = (e: MessageEvent) => {
          if (e.data.id === id) {
            w.removeEventListener('message', handler);
            w.removeEventListener('error', errorHandler);
            if (e.data.error) {
              reject(new Error(e.data.error));
            } else {
              resolve(e.data.result);
            }
          }
        };
        const errorHandler = (e: ErrorEvent) => {
          w.removeEventListener('message', handler);
          w.removeEventListener('error', errorHandler);
          reject(e);
        };
        w.addEventListener('message', handler);
        w.addEventListener('error', errorHandler);
        w.postMessage({ id, left, right, options: opts });
      });

      // Ignore stale responses
      if (id !== currentRequestId) return;
      result.value = res;
    } catch {
      // Fallback to synchronous computation if worker fails
      if (id !== currentRequestId) return;
      result.value = computeDiffSync(left, right, opts);
    } finally {
      if (id === currentRequestId) {
        isComputing.value = false;
      }
    }
  }

  return {
    result,
    isComputing,
    compute
  };
}
