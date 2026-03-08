import Database from 'better-sqlite3'
import { nanoid } from 'nanoid'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'

// ---------------------------------------------------------------------------
// Database setup
// ---------------------------------------------------------------------------

const DATA_DIR = join(process.cwd(), 'data')

// Ensure the data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

const db = new Database(join(DATA_DIR, 'diffspot.db'))

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL')

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS shares (
    id         TEXT PRIMARY KEY,
    left_text  TEXT NOT NULL,
    right_text TEXT NOT NULL,
    language   TEXT DEFAULT 'plaintext',
    created_at TEXT DEFAULT (datetime('now'))
  )
`)

// ---------------------------------------------------------------------------
// Prepared statements
// ---------------------------------------------------------------------------

const insertStmt = db.prepare(`
  INSERT INTO shares (id, left_text, right_text, language)
  VALUES (?, ?, ?, ?)
`)

const selectStmt = db.prepare(`
  SELECT id, left_text, right_text, language, created_at
  FROM shares
  WHERE id = ?
`)

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

export interface Share {
  id: string
  left_text: string
  right_text: string
  language: string
  created_at: string
}

/**
 * Save a new share and return its generated nanoid.
 */
export function saveShare(
  leftText: string,
  rightText: string,
  language: string = 'plaintext',
): string {
  const id = nanoid(12)
  insertStmt.run(id, leftText, rightText, language)
  return id
}

/**
 * Retrieve a share by its ID, or null if not found.
 */
export function getShare(id: string): Share | null {
  const row = selectStmt.get(id) as Share | undefined
  return row ?? null
}
