# @diffspot/vue

Vue 3 diff components and composables for building beautiful text comparison interfaces.

## Installation

```bash
npm install @diffspot/vue @diffspot/core
```

> **Peer dependencies:** `vue ^3.3` and `@diffspot/core ^0.1` are required.

## Quick Start

```vue
<script setup>
import { ref } from 'vue'
import {
  DiffView,
  DiffControls,
  DiffStats,
  useDiff,
  useDiffOptions,
  useDiffNavigation,
  useExport
} from '@diffspot/vue'
import '@diffspot/vue/theme.css'

const left = ref('hello\nworld')
const right = ref('hello\nearth')

const { precision, ignoreWhitespace, ignoreCase, options } = useDiffOptions()
const { result, isComputing, compute } = useDiff(left, right, options)

const viewMode = ref<'split' | 'unified'>('split')
const scrollContainerRef = ref<HTMLElement | null>(null)

const {
  changeGroups,
  totalChanges,
  currentChangeIndex,
  scrollRatio,
  viewportRatio,
  goToNextChange,
  goToPrevChange
} = useDiffNavigation(result, scrollContainerRef)

const { exportAs } = useExport()

function handleExport(format) {
  exportAs(format, result.value, { timestamp: new Date().toISOString() })
}

// Compute initial diff
compute()
</script>

<template>
  <div>
    <DiffStats
      :additions="result.additions"
      :removals="result.removals"
      :unchanged="result.unchanged"
    />

    <DiffControls
      v-model:view-mode="viewMode"
      v-model:precision="precision"
      v-model:ignore-whitespace="ignoreWhitespace"
      v-model:ignore-case="ignoreCase"
      :current-change-index="currentChangeIndex"
      :total-changes="totalChanges"
      :total-lines="result.lines.length"
      @prev-change="goToPrevChange"
      @next-change="goToNextChange"
      @export="handleExport"
      @update:precision="compute"
      @update:ignore-whitespace="compute"
      @update:ignore-case="compute"
    />

    <DiffView
      :result="result"
      :view-mode="viewMode"
      :current-change-index="currentChangeIndex"
      :change-groups="changeGroups"
      :scroll-ratio="scrollRatio"
      :viewport-ratio="viewportRatio"
      @scroll-container-ready="scrollContainerRef = $event"
    />
  </div>
</template>
```

## Theming

Import the default theme CSS or define your own CSS variables:

```css
/* Required CSS variables */
:root {
  --color-surface: #1a1a1a;
  --color-elevated: #242424;
  --color-text: #f5f5f5;
  --color-muted: #8b8b8b;
  --color-accent: #00e5cc;
  --color-accent-2: #ff006e;
  --color-border: hsla(0, 0%, 100%, 0.08);
  --color-added-bg: rgba(0, 229, 204, 0.08);
  --color-added-highlight: rgba(0, 229, 204, 0.25);
  --color-removed-bg: rgba(255, 0, 110, 0.08);
  --color-removed-highlight: rgba(255, 0, 110, 0.25);
  --font-mono: 'JetBrains Mono', monospace;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Components

### DiffView

Main diff display component with split/unified view toggle.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `result` | `DiffResult` | required | The diff result from `useDiff` |
| `viewMode` | `'split' \| 'unified'` | required | Display mode |
| `isFullscreen` | `boolean` | `false` | Enable fullscreen mode |
| `collapseUnchanged` | `boolean` | `true` | Collapse consecutive unchanged regions |
| `currentChangeIndex` | `number` | `-1` | Current highlighted change group |
| `changeGroups` | `ChangeGroup[]` | `[]` | Change groups from navigation |
| `scrollRatio` | `number` | `0` | Scroll position ratio (0-1) |
| `viewportRatio` | `number` | `1` | Viewport size ratio |

### DiffControls

Toolbar component with view mode, precision, and navigation controls.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `viewMode` | `'split' \| 'unified'` | required | Current view mode |
| `precision` | `DiffPrecision` | required | Diff granularity |
| `ignoreWhitespace` | `boolean` | required | Ignore whitespace option |
| `ignoreCase` | `boolean` | required | Ignore case option |
| `collapseUnchanged` | `boolean` | required | Collapse unchanged regions |
| `hideSplitOption` | `boolean` | `false` | Hide split view option |
| `isFullscreen` | `boolean` | `false` | Fullscreen state |
| `currentChangeIndex` | `number` | `-1` | Current change index |
| `totalChanges` | `number` | `0` | Total number of changes |
| `totalLines` | `number` | `0` | Total diff lines (for large-diff warning) |

| Event | Payload | Description |
|-------|---------|-------------|
| `update:viewMode` | `'split' \| 'unified'` | View mode changed |
| `update:precision` | `DiffPrecision` | Precision changed |
| `update:ignoreWhitespace` | `boolean` | Whitespace option changed |
| `update:ignoreCase` | `boolean` | Case option changed |
| `update:collapseUnchanged` | `boolean` | Collapse unchanged toggled |
| `export` | `ExportFormat` | Export format selected (print, unified-diff, html, json) |
| `toggle-fullscreen` | - | Fullscreen button clicked |
| `prev-change` | - | Previous change button clicked |
| `next-change` | - | Next change button clicked |

### DiffStats

Displays addition/removal/unchanged counts.

| Prop | Type | Description |
|------|------|-------------|
| `additions` | `number` | Number of added lines |
| `removals` | `number` | Number of removed lines |
| `unchanged` | `number` | Number of unchanged lines |

### DiffLine

Renders a single diff line with syntax highlighting.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `line` | `DiffLine` | required | The line data |
| `showLineNumbers` | `boolean` | `true` | Show line numbers |
| `isHighlighted` | `boolean` | `false` | Highlight this line |

### DiffMinimap

Visual overview of changes with click-to-scroll.

| Prop | Type | Description |
|------|------|-------------|
| `lines` | `DiffLine[]` | All diff lines |
| `scrollRatio` | `number` | Current scroll position (0-1) |
| `viewportRatio` | `number` | Viewport size ratio |

| Event | Payload | Description |
|-------|---------|-------------|
| `scroll-to` | `number` | Requested scroll ratio |

## Composables

### useDiff

Core diff computation with Web Worker support.

```ts
const { result, isComputing, compute } = useDiff(leftText, rightText, options)
```

| Return | Type | Description |
|--------|------|-------------|
| `result` | `Ref<DiffResult>` | The computed diff result |
| `isComputing` | `Ref<boolean>` | Whether computation is in progress |
| `compute` | `() => Promise<void>` | Trigger diff computation |

### useDiffOptions

Reactive diff configuration state.

```ts
const { precision, ignoreWhitespace, ignoreCase, options } = useDiffOptions()
```

| Return | Type | Description |
|--------|------|-------------|
| `precision` | `Ref<DiffPrecision>` | 'line', 'word', or 'char' |
| `ignoreWhitespace` | `Ref<boolean>` | Ignore whitespace differences |
| `ignoreCase` | `Ref<boolean>` | Case-insensitive comparison |
| `options` | `ComputedRef<DiffOptions>` | Combined options object |

### useDiffNavigation

Navigate between change groups with scroll tracking.

```ts
const {
  changeGroups,
  totalChanges,
  currentChangeIndex,
  scrollRatio,
  viewportRatio,
  goToNextChange,
  goToPrevChange,
  scrollToChange
} = useDiffNavigation(result, scrollContainerRef)
```

### useVirtualScroll

Virtual scrolling for large diffs.

```ts
const { startIndex, endIndex, totalHeight, offsetY, isPrinting } = useVirtualScroll(
  containerRef,
  totalItems,
  { itemHeight: 26, overscan: 20 }
)
```

### useExport

Multi-format export: print, unified diff, HTML report, JSON data.

```ts
import { useExport } from '@diffspot/vue'

const { print, exportAs } = useExport()

// Print via browser dialog
print()

// Export as unified diff, HTML report, or JSON
exportAs('unified-diff', result, { leftLabel: 'old.txt', rightLabel: 'new.txt' })
exportAs('html', result)
exportAs('json', result)
```

### usePrint (deprecated)

Use `useExport()` instead. Kept for backward compatibility.

```ts
const { print } = usePrint()
```

## License

MIT
