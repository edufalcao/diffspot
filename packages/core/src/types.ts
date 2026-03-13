/** Available granularity levels for diff comparison. */
export type DiffPrecision = 'line' | 'word' | 'char';

/** A single word-level (or char-level) segment within a diff line. */
export interface DiffWord {
  /** The text content of this segment. */
  value: string,
  /** Whether this segment was added in the new text. */
  added?: boolean,
  /** Whether this segment was removed from the old text. */
  removed?: boolean
}

/** A single line in the diff output. */
export interface DiffLine {
  /** Whether this line was added, removed, or left unchanged. */
  type: 'added' | 'removed' | 'unchanged',
  /** The raw text content of this line (without trailing newline). */
  content: string,
  /** Line number in the original (left) text. Present for removed and unchanged lines. */
  oldLineNumber?: number,
  /** Line number in the modified (right) text. Present for added and unchanged lines. */
  newLineNumber?: number,
  /** Word-level inline highlights within this line (used for inline diff display). */
  words?: DiffWord[]
}

/** The complete result of a diff computation. */
export interface DiffResult {
  /** All lines in the diff output. */
  lines: DiffLine[],
  /** Total number of added lines. */
  additions: number,
  /** Total number of removed lines. */
  removals: number,
  /** Total number of unchanged lines. */
  unchanged: number
}

/** A group of consecutive changed (non-unchanged) lines in the diff output. */
export interface ChangeGroup {
  /** Index of the first line in this group (within the full lines array). */
  startIndex: number,
  /** Index of the last line in this group (inclusive). */
  endIndex: number,
  /** Whether the group contains only added, only removed, or a mix of both. */
  type: 'added' | 'removed' | 'mixed'
}

/** Configuration options that control how the diff is computed. */
export interface DiffOptions {
  /** The granularity of the diff comparison. */
  precision: DiffPrecision,
  /** Whether to ignore leading/trailing whitespace differences. */
  ignoreWhitespace: boolean,
  /** Whether to treat uppercase and lowercase characters as equal. */
  ignoreCase: boolean
}

/** Available export format identifiers. */
export type ExportFormat = 'print' | 'unified-diff' | 'html' | 'json';

/** Metadata attached to export output. */
export interface ExportMetadata {
  /** ISO timestamp of when the export was generated. */
  timestamp?: string,
  /** Label for the left (original) text. */
  leftLabel?: string,
  /** Label for the right (modified) text. */
  rightLabel?: string,
  /** Diff options used during computation. */
  options?: DiffOptions
}

/** A block representing a contiguous region of changes in a minimap. */
export interface MinimapBlock {
  /** Percentage position from top (0–100). */
  y: number,
  /** Percentage height (0–100). */
  height: number,
  /** Type of change in this block. */
  type: 'added' | 'removed'
}
