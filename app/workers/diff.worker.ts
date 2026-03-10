import { computeDiff } from '../utils/diffCompute'
import type { DiffOptions } from '../types/diff'

interface WorkerRequest {
  id: number
  left: string
  right: string
  options: DiffOptions
}

addEventListener('message', (e: MessageEvent<WorkerRequest>) => {
  const { id, left, right, options } = e.data
  try {
    const result = computeDiff(left, right, options)
    postMessage({ id, result })
  } catch (error) {
    postMessage({ id, error: String(error) })
  }
})
