/** Available granularity levels for diff comparison. */
export type DiffPrecision = 'line' | 'word' | 'char'

/** A single word-level (or char-level) segment within a diff line. */
export interface DiffWord {
  /** The text content of this segment. */
  value: string
  /** Whether this segment was added in the new text. */
  added?: boolean
  /** Whether this segment was removed from the old text. */
  removed?: boolean
}

/** A single line in the diff output. */
export interface DiffLine {
  /** Whether this line was added, removed, or left unchanged. */
  type: 'added' | 'removed' | 'unchanged'
  /** The raw text content of this line (without trailing newline). */
  content: string
  /** Line number in the original (left) text. Present for removed and unchanged lines. */
  oldLineNumber?: number
  /** Line number in the modified (right) text. Present for added and unchanged lines. */
  newLineNumber?: number
  /** Word-level inline highlights within this line (used for inline diff display). */
  words?: DiffWord[]
}

/** The complete result of a diff computation. */
export interface DiffResult {
  /** All lines in the diff output. */
  lines: DiffLine[]
  /** Total number of added lines. */
  additions: number
  /** Total number of removed lines. */
  removals: number
  /** Total number of unchanged lines. */
  unchanged: number
}

/** Configuration options that control how the diff is computed. */
export interface DiffOptions {
  /** The granularity of the diff comparison. */
  precision: DiffPrecision
  /** Whether to ignore leading/trailing whitespace differences. */
  ignoreWhitespace: boolean
  /** Whether to treat uppercase and lowercase characters as equal. */
  ignoreCase: boolean
}
