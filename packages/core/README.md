# @diffspot/core

Framework-agnostic diff computation engine. Works in Node.js, browsers, and Web Workers.

## Installation

```bash
npm install @diffspot/core
```

## Usage

### Basic diff

```ts
import { computeDiff } from '@diffspot/core'

const result = computeDiff('hello\nworld', 'hello\nearth', {
  precision: 'line',       // 'line' | 'word' | 'char'
  ignoreWhitespace: false,
  ignoreCase: false,
})

console.log(result.additions)  // 1
console.log(result.removals)   // 1
console.log(result.lines)      // DiffLine[]
```

### Word-level and character-level diff

```ts
// Word diff — highlights changed words within a line
const wordDiff = computeDiff(oldText, newText, { precision: 'word', ... })

// Char diff — highlights individual character changes
const charDiff = computeDiff(oldText, newText, { precision: 'char', ... })
```

### Minimap blocks

Compute percentage-based block positions for rendering a scroll minimap:

```ts
import { computeMinimapBlocks } from '@diffspot/core'

const blocks = computeMinimapBlocks(result.lines)
// [{ y: 12.5, height: 3.2, type: 'added' }, ...]
```

### Change groups

Group consecutive changed lines for navigation (prev/next change):

```ts
import { computeChangeGroups } from '@diffspot/core'

const groups = computeChangeGroups(result.lines)
// [{ startIndex: 4, endIndex: 6, type: 'mixed' }, ...]
```

### Web Worker

For large files, offload computation to a Worker to keep the UI thread free:

```ts
const worker = new Worker(
  new URL('@diffspot/core/worker', import.meta.url),
  { type: 'module' }
)

worker.postMessage({ id: 1, left: oldText, right: newText, options })

worker.onmessage = (e) => {
  const { id, result, error } = e.data
  if (error) throw new Error(error)
  console.log(result)
}
```

### Node.js

```ts
import { computeDiff } from '@diffspot/core'

const result = computeDiff(fileA, fileB, {
  precision: 'line',
  ignoreWhitespace: true,
  ignoreCase: false,
})
```

## API

### `computeDiff(left, right, options): DiffResult`

| Param | Type | Description |
|-------|------|-------------|
| `left` | `string` | Original text |
| `right` | `string` | Modified text |
| `options` | `DiffOptions` | Computation options |

### `computeMinimapBlocks(lines): MinimapBlock[]`

Merges consecutive same-type changed lines into percentage-positioned blocks suitable for minimap rendering.

### `computeChangeGroups(lines): ChangeGroup[]`

Groups consecutive non-unchanged lines for prev/next navigation.

## Types

```ts
type DiffPrecision = 'line' | 'word' | 'char'

interface DiffOptions {
  precision: DiffPrecision
  ignoreWhitespace: boolean
  ignoreCase: boolean
}

interface DiffResult {
  lines: DiffLine[]
  additions: number
  removals: number
  unchanged: number
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
  words?: DiffWord[]      // word/char-level highlights
}

interface DiffWord {
  value: string
  added?: boolean
  removed?: boolean
}

interface ChangeGroup {
  startIndex: number
  endIndex: number
  type: 'added' | 'removed' | 'mixed'
}

interface MinimapBlock {
  y: number        // percentage from top (0–100)
  height: number   // percentage height (0–100)
  type: 'added' | 'removed'
}
```

## License

MIT
