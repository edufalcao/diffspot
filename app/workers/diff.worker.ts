import { computeDiff } from '@diffspot/core';
import type { DiffOptions } from '@diffspot/core';

interface WorkerRequest {
  id: number,
  left: string,
  right: string,
  options: DiffOptions
}

addEventListener('message', (e: MessageEvent<WorkerRequest>) => {
  const { id, left, right, options } = e.data;
  try {
    const result = computeDiff(left, right, options);
    postMessage({ id, result });
  } catch (error) {
    postMessage({ id, error: String(error) });
  }
});
