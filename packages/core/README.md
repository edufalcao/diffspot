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

### Collapsed regions

Compute collapsible regions of consecutive unchanged lines (GitHub-style folding):

```ts
import { computeCollapsedRegions } from '@diffspot/core'

const regions = computeCollapsedRegions(result.lines)
// [{ startIndex: 10, endIndex: 45, count: 36 }, ...]

// Custom context (default: 3 lines before/after each change)
const regions2 = computeCollapsedRegions(result.lines, 5)
```

### Export

Generate export files from diff results:

```ts
import {
  generateUnifiedDiff,
  generateHtmlExport,
  generateJsonExport
} from '@diffspot/core'

const result = computeDiff(oldText, newText, options)
const metadata = { leftLabel: 'original.txt', rightLabel: 'modified.txt' }

// Standard unified diff / patch format
const patch = generateUnifiedDiff(result, metadata)

// Self-contained styled HTML report (dark theme)
const html = generateHtmlExport(result, metadata)

// Raw JSON data
const json = generateJsonExport(result, metadata)
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

### `computeCollapsedRegions(lines, contextLines?): CollapsedRegion[]`

Finds runs of 8+ consecutive unchanged lines and returns the collapsible ranges, keeping `contextLines` (default 3) visible before and after each change.

### `generateUnifiedDiff(result, metadata?): string`

Generates a standard unified diff (patch) string with `@@ -old,count +new,count @@` hunk headers and 3 lines of context.

### `generateHtmlExport(result, metadata?): string`

Generates a self-contained HTML report with inline CSS replicating diffspot's dark theme, including word-level highlights.

### `generateJsonExport(result, metadata?): string`

Generates a pretty-printed JSON string containing the metadata and full DiffResult.

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
  oldContent?: string     // preserved left-side content for ignored differences
  newContent?: string     // preserved right-side content for ignored differences
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

interface CollapsedRegion {
  startIndex: number   // first collapsed line index (inclusive)
  endIndex: number     // last collapsed line index (inclusive)
  count: number        // number of collapsed lines
}

type ExportFormat = 'print' | 'unified-diff' | 'html' | 'json'

interface ExportMetadata {
  timestamp?: string
  leftLabel?: string
  rightLabel?: string
  options?: DiffOptions
}
```

## License

MIT
