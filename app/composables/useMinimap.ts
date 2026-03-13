import type { DiffLine } from '@diffspot/core'

export interface MinimapBlock {
  y: number      // percentage from top (0–100)
  height: number  // percentage height (0–100)
  type: 'added' | 'removed'
}

/**
 * Merges consecutive same-type changed lines into blocks with percentage-based
 * positioning for efficient minimap rendering.
 */
export function computeMinimapBlocks(lines: DiffLine[]): MinimapBlock[] {
  if (lines.length === 0) return []

  const blocks: MinimapBlock[] = []
  let i = 0
  const total = lines.length

  while (i < total) {
    const line = lines[i]!
    if (line.type === 'added' || line.type === 'removed') {
      const startIdx = i
      const type = line.type

      while (i < total && lines[i]!.type === type) {
        i++
      }

      blocks.push({
        y: (startIdx / total) * 100,
        height: Math.max(((i - startIdx) / total) * 100, 0.5), // min 0.5% for visibility
        type,
      })
    } else {
      i++
    }
  }

  return blocks
}
