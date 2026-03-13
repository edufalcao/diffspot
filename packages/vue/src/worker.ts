import { computeDiff } from '@diffspot/core'
import type { DiffOptions, DiffResult } from '@diffspot/core'

interface WorkerMessage {
  id: number
  left: string
  right: string
  options: DiffOptions
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { id, left, right, options } = e.data
  try {
    const result: DiffResult = computeDiff(left, right, options)
    self.postMessage({ id, result })
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
