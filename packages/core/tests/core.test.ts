import { describe, it, expect } from 'vitest'
import {
  computeDiff,
  computeMinimapBlocks,
  computeChangeGroups,
  type DiffOptions,
  type DiffLine,
} from '../src/index'

const defaultOptions: DiffOptions = {
  precision: 'line',
  ignoreWhitespace: false,
  ignoreCase: false,
}

describe('computeDiff', () => {
  describe('line precision', () => {
    it('returns empty result for identical strings', () => {
      const result = computeDiff('hello\nworld', 'hello\nworld', defaultOptions)
      expect(result.additions).toBe(0)
      expect(result.removals).toBe(0)
      expect(result.unchanged).toBe(2)
      expect(result.lines.every((l) => l.type === 'unchanged')).toBe(true)
    })

    it('detects added lines', () => {
      const result = computeDiff('hello\n', 'hello\nworld\n', defaultOptions)
      expect(result.additions).toBe(1)
      expect(result.removals).toBe(0)
      expect(result.unchanged).toBe(1)
      expect(result.lines.find((l) => l.type === 'added')?.content).toBe('world')
    })

    it('detects removed lines', () => {
      const result = computeDiff('hello\nworld\n', 'hello\n', defaultOptions)
      expect(result.removals).toBe(1)
      expect(result.additions).toBe(0)
      expect(result.unchanged).toBe(1)
      expect(result.lines.find((l) => l.type === 'removed')?.content).toBe('world')
    })

    it('detects mixed changes', () => {
      const result = computeDiff('foo\nbar', 'foo\nbaz', defaultOptions)
      expect(result.removals).toBe(1)
      expect(result.additions).toBe(1)
      expect(result.lines.find((l) => l.type === 'removed')?.content).toBe('bar')
      expect(result.lines.find((l) => l.type === 'added')?.content).toBe('baz')
    })

    it('includes line numbers', () => {
      const result = computeDiff('a\nb\nc', 'a\nB\nc', defaultOptions)
      const removed = result.lines.find((l) => l.type === 'removed')
      const added = result.lines.find((l) => l.type === 'added')
      expect(removed?.oldLineNumber).toBe(2)
      expect(added?.newLineNumber).toBe(2)
    })
  })

  describe('word precision', () => {
    it('detects word-level changes', () => {
      const result = computeDiff('hello world', 'hello earth', {
        ...defaultOptions,
        precision: 'word',
      })
      expect(result.lines.length).toBeGreaterThan(0)
      const line = result.lines.find((l) => l.words && l.words.length > 0)
      expect(line).toBeDefined()
      expect(line?.words?.some((w) => w.removed)).toBe(true)
      expect(line?.words?.some((w) => w.added)).toBe(true)
    })
  })

  describe('char precision', () => {
    it('detects character-level changes', () => {
      const result = computeDiff('hello', 'hallo', {
        ...defaultOptions,
        precision: 'char',
      })
      expect(result.lines.length).toBeGreaterThan(0)
      const line = result.lines.find((l) => l.words && l.words.length > 0)
      expect(line).toBeDefined()
    })
  })

  describe('ignoreWhitespace option', () => {
    it('ignores leading/trailing whitespace differences when enabled', () => {
      // jsdiff's ignoreWhitespace ignores leading/trailing whitespace per line
      const result = computeDiff('hello\n', '  hello  \n', {
        ...defaultOptions,
        ignoreWhitespace: true,
      })
      expect(result.additions).toBe(0)
      expect(result.removals).toBe(0)
    })

    it('detects whitespace differences when disabled', () => {
      const result = computeDiff('hello\n', '  hello  \n', {
        ...defaultOptions,
        ignoreWhitespace: false,
      })
      // Should detect changes when whitespace is significant
      expect(result.additions + result.removals).toBeGreaterThan(0)
    })
  })

  describe('ignoreCase option', () => {
    it('ignores case differences when enabled', () => {
      const result = computeDiff('Hello', 'hello', {
        ...defaultOptions,
        ignoreCase: true,
      })
      expect(result.additions).toBe(0)
      expect(result.removals).toBe(0)
    })

    it('detects case differences when disabled', () => {
      const result = computeDiff('Hello', 'hello', {
        ...defaultOptions,
        ignoreCase: false,
      })
      // Should detect a change
      expect(result.additions + result.removals).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('handles empty strings', () => {
      const result = computeDiff('', '', defaultOptions)
      expect(result.lines.length).toBe(0)
      expect(result.additions).toBe(0)
      expect(result.removals).toBe(0)
    })

    it('handles empty left string', () => {
      const result = computeDiff('', 'hello', defaultOptions)
      expect(result.additions).toBe(1)
      expect(result.removals).toBe(0)
    })

    it('handles empty right string', () => {
      const result = computeDiff('hello', '', defaultOptions)
      expect(result.removals).toBe(1)
      expect(result.additions).toBe(0)
    })

    it('handles completely different strings', () => {
      const result = computeDiff('abc', 'xyz', defaultOptions)
      expect(result.removals).toBe(1)
      expect(result.additions).toBe(1)
    })

    it('handles multi-line completely different', () => {
      const result = computeDiff('a\nb\nc', 'x\ny\nz', defaultOptions)
      expect(result.removals).toBe(3)
      expect(result.additions).toBe(3)
      expect(result.unchanged).toBe(0)
    })
  })
})

describe('computeMinimapBlocks', () => {
  it('returns empty array for empty input', () => {
    const blocks = computeMinimapBlocks([])
    expect(blocks).toEqual([])
  })

  it('returns empty array for only unchanged lines', () => {
    const lines: DiffLine[] = [
      { type: 'unchanged', content: 'a', oldLineNumber: 1, newLineNumber: 1 },
      { type: 'unchanged', content: 'b', oldLineNumber: 2, newLineNumber: 2 },
    ]
    const blocks = computeMinimapBlocks(lines)
    expect(blocks).toEqual([])
  })

  it('creates a single block for consecutive added lines', () => {
    const lines: DiffLine[] = [
      { type: 'added', content: 'a', newLineNumber: 1 },
      { type: 'added', content: 'b', newLineNumber: 2 },
    ]
    const blocks = computeMinimapBlocks(lines)
    expect(blocks.length).toBe(1)
    expect(blocks[0]?.type).toBe('added')
    expect(blocks[0]?.y).toBe(0)
    expect(blocks[0]?.height).toBe(100)
  })

  it('creates a single block for consecutive removed lines', () => {
    const lines: DiffLine[] = [
      { type: 'removed', content: 'a', oldLineNumber: 1 },
      { type: 'removed', content: 'b', oldLineNumber: 2 },
    ]
    const blocks = computeMinimapBlocks(lines)
    expect(blocks.length).toBe(1)
    expect(blocks[0]?.type).toBe('removed')
  })

  it('creates separate blocks for different change types', () => {
    const lines: DiffLine[] = [
      { type: 'added', content: 'a', newLineNumber: 1 },
      { type: 'removed', content: 'b', oldLineNumber: 1 },
    ]
    const blocks = computeMinimapBlocks(lines)
    expect(blocks.length).toBe(2)
    expect(blocks[0]?.type).toBe('added')
    expect(blocks[1]?.type).toBe('removed')
  })

  it('creates blocks with correct positions for mixed lines', () => {
    const lines: DiffLine[] = [
      { type: 'unchanged', content: 'a', oldLineNumber: 1, newLineNumber: 1 },
      { type: 'added', content: 'b', newLineNumber: 2 },
      { type: 'unchanged', content: 'c', oldLineNumber: 2, newLineNumber: 3 },
      { type: 'removed', content: 'd', oldLineNumber: 3 },
    ]
    const blocks = computeMinimapBlocks(lines)
    expect(blocks.length).toBe(2)
    expect(blocks[0]?.type).toBe('added')
    expect(blocks[0]?.y).toBe(25) // 1/4 * 100
    expect(blocks[1]?.type).toBe('removed')
    expect(blocks[1]?.y).toBe(75) // 3/4 * 100
  })
})

describe('computeChangeGroups', () => {
  it('returns empty array for empty input', () => {
    const groups = computeChangeGroups([])
    expect(groups).toEqual([])
  })

  it('returns empty array for only unchanged lines', () => {
    const lines: DiffLine[] = [
      { type: 'unchanged', content: 'a', oldLineNumber: 1, newLineNumber: 1 },
      { type: 'unchanged', content: 'b', oldLineNumber: 2, newLineNumber: 2 },
    ]
    const groups = computeChangeGroups(lines)
    expect(groups).toEqual([])
  })

  it('creates a single group for consecutive added lines', () => {
    const lines: DiffLine[] = [
      { type: 'added', content: 'a', newLineNumber: 1 },
      { type: 'added', content: 'b', newLineNumber: 2 },
    ]
    const groups = computeChangeGroups(lines)
    expect(groups.length).toBe(1)
    expect(groups[0]).toEqual({ startIndex: 0, endIndex: 1, type: 'added' })
  })

  it('creates a single group for consecutive removed lines', () => {
    const lines: DiffLine[] = [
      { type: 'removed', content: 'a', oldLineNumber: 1 },
      { type: 'removed', content: 'b', oldLineNumber: 2 },
    ]
    const groups = computeChangeGroups(lines)
    expect(groups.length).toBe(1)
    expect(groups[0]).toEqual({ startIndex: 0, endIndex: 1, type: 'removed' })
  })

  it('creates a mixed group for consecutive added and removed lines', () => {
    const lines: DiffLine[] = [
      { type: 'removed', content: 'a', oldLineNumber: 1 },
      { type: 'added', content: 'b', newLineNumber: 1 },
    ]
    const groups = computeChangeGroups(lines)
    expect(groups.length).toBe(1)
    expect(groups[0]?.type).toBe('mixed')
    expect(groups[0]?.startIndex).toBe(0)
    expect(groups[0]?.endIndex).toBe(1)
  })

  it('creates multiple groups separated by unchanged lines', () => {
    const lines: DiffLine[] = [
      { type: 'added', content: 'a', newLineNumber: 1 },
      { type: 'unchanged', content: 'b', oldLineNumber: 1, newLineNumber: 2 },
      { type: 'removed', content: 'c', oldLineNumber: 2 },
    ]
    const groups = computeChangeGroups(lines)
    expect(groups.length).toBe(2)
    expect(groups[0]).toEqual({ startIndex: 0, endIndex: 0, type: 'added' })
    expect(groups[1]).toEqual({ startIndex: 2, endIndex: 2, type: 'removed' })
  })

  it('handles changes at the start, middle, and end', () => {
    const lines: DiffLine[] = [
      { type: 'added', content: 'a', newLineNumber: 1 },
      { type: 'unchanged', content: 'b', oldLineNumber: 1, newLineNumber: 2 },
      { type: 'removed', content: 'c', oldLineNumber: 2 },
      { type: 'added', content: 'd', newLineNumber: 3 },
      { type: 'unchanged', content: 'e', oldLineNumber: 3, newLineNumber: 4 },
      { type: 'removed', content: 'f', oldLineNumber: 4 },
    ]
    const groups = computeChangeGroups(lines)
    expect(groups.length).toBe(3)
    expect(groups[0]?.type).toBe('added')
    expect(groups[1]?.type).toBe('mixed')
    expect(groups[2]?.type).toBe('removed')
  })
})
