import { computed, ref, type Ref, type ComputedRef } from 'vue'
import * as Diff from 'diff'
import type { DiffOptions, DiffResult, DiffLine, DiffWord } from '~/types/diff'

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>

function unref<T>(val: MaybeRef<T>): T {
  return (val as Ref<T>)?.value !== undefined ? (val as Ref<T>).value : (val as T)
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Run `Diff.diffWords` on two strings and return an array of `DiffWord`
 * segments that can be used for inline highlighting.
 */
function computeInlineWords(
  oldText: string,
  newText: string,
  opts: { ignoreWhitespace: boolean },
): DiffWord[] {
  const changes = Diff.diffWords(oldText, newText, {
    ignoreWhitespace: opts.ignoreWhitespace,
  })

  return changes.map((c) => ({
    value: c.value,
    ...(c.added ? { added: true } : {}),
    ...(c.removed ? { removed: true } : {}),
  }))
}

/**
 * Split a jsdiff change value into individual lines, stripping the trailing
 * newline that jsdiff typically appends.
 */
function splitLines(value: string): string[] {
  // Remove a single trailing newline if present so we don't create a phantom
  // empty line at the end of each change block.
  const trimmed = value.endsWith('\n') ? value.slice(0, -1) : value
  if (trimmed === '') return []
  return trimmed.split('\n')
}

// ---------------------------------------------------------------------------
// Precision strategies
// ---------------------------------------------------------------------------

function computeLineDiff(left: string, right: string, opts: DiffOptions): DiffLine[] {
  const changes = Diff.diffLines(left, right, {
    ignoreWhitespace: opts.ignoreWhitespace,
  })

  const lines: DiffLine[] = []
  let oldLine = 1
  let newLine = 1

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i]
    const lineTexts = splitLines(change.value)

    if (change.added) {
      // Check if the previous change was a removal — if so, pair them for
      // inline word-level highlighting.
      const prev = i > 0 ? changes[i - 1] : null
      const pairedRemovedLines =
        prev && prev.removed ? splitLines(prev.value) : null

      for (let j = 0; j < lineTexts.length; j++) {
        const pairedOld = pairedRemovedLines?.[j]
        const words =
          pairedOld !== undefined
            ? computeInlineWords(pairedOld, lineTexts[j], opts).filter(
                (w) => !w.removed,
              )
            : undefined

        lines.push({
          type: 'added',
          content: lineTexts[j],
          newLineNumber: newLine++,
          ...(words ? { words } : {}),
        })
      }
    } else if (change.removed) {
      // Look ahead — if the next change is an addition we will pair them
      // there, but we still need to emit inline highlights for the removed
      // side now.
      const next = i + 1 < changes.length ? changes[i + 1] : null
      const pairedAddedLines =
        next && next.added ? splitLines(next.value) : null

      for (let j = 0; j < lineTexts.length; j++) {
        const pairedNew = pairedAddedLines?.[j]
        const words =
          pairedNew !== undefined
            ? computeInlineWords(lineTexts[j], pairedNew, opts).filter(
                (w) => !w.added,
              )
            : undefined

        lines.push({
          type: 'removed',
          content: lineTexts[j],
          oldLineNumber: oldLine++,
          ...(words ? { words } : {}),
        })
      }
    } else {
      // Unchanged
      for (const text of lineTexts) {
        lines.push({
          type: 'unchanged',
          content: text,
          oldLineNumber: oldLine++,
          newLineNumber: newLine++,
        })
      }
    }
  }

  return lines
}

function computeWordDiff(left: string, right: string, opts: DiffOptions): DiffLine[] {
  const changes = Diff.diffWords(left, right, {
    ignoreWhitespace: opts.ignoreWhitespace,
  })

  // Flatten all changes into DiffWord segments, then group by line.
  const lines: DiffLine[] = []
  let oldLine = 1
  let newLine = 1
  let currentWords: DiffWord[] = []

  function pushLine() {
    if (currentWords.length === 0) return
    const content = currentWords.map((w) => w.value).join('')

    const hasAdded = currentWords.some((w) => w.added)
    const hasRemoved = currentWords.some((w) => w.removed)

    let type: DiffLine['type'] = 'unchanged'
    if (hasAdded && !hasRemoved) type = 'added'
    else if (hasRemoved && !hasAdded) type = 'removed'
    else if (hasAdded || hasRemoved) type = 'unchanged' // mixed — show as context with inline highlights

    lines.push({
      type,
      content,
      ...(type !== 'added' ? { oldLineNumber: oldLine++ } : {}),
      ...(type !== 'removed' ? { newLineNumber: newLine++ } : {}),
      words: [...currentWords],
    })
    currentWords = []
  }

  for (const change of changes) {
    // Split on newlines within the segment to maintain line structure.
    const parts = change.value.split('\n')
    for (let p = 0; p < parts.length; p++) {
      if (p > 0) {
        // Newline boundary — flush current line
        pushLine()
      }
      if (parts[p] !== '' || p === 0) {
        currentWords.push({
          value: parts[p],
          ...(change.added ? { added: true } : {}),
          ...(change.removed ? { removed: true } : {}),
        })
      }
    }
  }
  pushLine()

  return lines
}

function computeCharDiff(left: string, right: string, opts: DiffOptions): DiffLine[] {
  const changes = Diff.diffChars(left, right, {
    ignoreCase: opts.ignoreCase,
  })

  const lines: DiffLine[] = []
  let oldLine = 1
  let newLine = 1
  let currentWords: DiffWord[] = []

  function pushLine() {
    if (currentWords.length === 0) return
    const content = currentWords.map((w) => w.value).join('')

    const hasAdded = currentWords.some((w) => w.added)
    const hasRemoved = currentWords.some((w) => w.removed)

    let type: DiffLine['type'] = 'unchanged'
    if (hasAdded && !hasRemoved) type = 'added'
    else if (hasRemoved && !hasAdded) type = 'removed'

    lines.push({
      type,
      content,
      ...(type !== 'added' ? { oldLineNumber: oldLine++ } : {}),
      ...(type !== 'removed' ? { newLineNumber: newLine++ } : {}),
      words: [...currentWords],
    })
    currentWords = []
  }

  for (const change of changes) {
    const parts = change.value.split('\n')
    for (let p = 0; p < parts.length; p++) {
      if (p > 0) pushLine()
      if (parts[p] !== '' || p === 0) {
        currentWords.push({
          value: parts[p],
          ...(change.added ? { added: true } : {}),
          ...(change.removed ? { removed: true } : {}),
        })
      }
    }
  }
  pushLine()

  return lines
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

const emptyResult: DiffResult = { lines: [], additions: 0, removals: 0, unchanged: 0 }

/**
 * Core diff computation composable.
 *
 * Accepts left and right text inputs (plain strings or refs) and a reactive
 * `DiffOptions` object. The diff is only computed when `compute()` is called
 * explicitly — it does NOT react to input changes automatically.
 */
export function useDiff(
  leftText: MaybeRef<string>,
  rightText: MaybeRef<string>,
  options: MaybeRef<DiffOptions>,
) {
  const isComputing = ref(false)
  const result = ref<DiffResult>({ ...emptyResult })

  function compute() {
    isComputing.value = true

    try {
      const opts = unref(options)
      let left = unref(leftText)
      let right = unref(rightText)

      if (opts.ignoreCase) {
        left = left.toLowerCase()
        right = right.toLowerCase()
      }

      let lines: DiffLine[]

      switch (opts.precision) {
        case 'word':
          lines = computeWordDiff(left, right, opts)
          break
        case 'char':
          lines = computeCharDiff(left, right, opts)
          break
        case 'line':
        default:
          lines = computeLineDiff(left, right, opts)
          break
      }

      const additions = lines.filter((l) => l.type === 'added').length
      const removals = lines.filter((l) => l.type === 'removed').length
      const unchanged = lines.filter((l) => l.type === 'unchanged').length

      result.value = { lines, additions, removals, unchanged }
    } finally {
      isComputing.value = false
    }
  }

  return {
    result,
    isComputing,
    compute,
  }
}
