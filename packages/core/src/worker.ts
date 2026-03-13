import { computeDiff } from './compute';
import type { DiffOptions, DiffResult } from './types';

export interface WorkerRequest {
  id: number,
  left: string,
  right: string,
  options: DiffOptions
}

export interface WorkerResponse {
  id: number,
  result?: DiffResult,
  error?: string
}

addEventListener('message', (e: MessageEvent<WorkerRequest>) => {
  const { id, left, right, options } = e.data;
  try {
    const result = computeDiff(left, right, options);
    postMessage({ id, result } satisfies WorkerResponse);
  } catch (error) {
    postMessage({ id, error: String(error) } satisfies WorkerResponse);
  }
});
