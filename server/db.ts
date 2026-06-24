import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'jersey.db')
fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS otp_codes (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    jersey_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    tag_line TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`)

export interface PlayerRow {
  id: number
  email: string
  jersey_number: string
  name: string
  tag_line: string
  created_at: number
  updated_at: number
}

export function saveOtp(email: string, code: string, expiresAt: number) {
  const now = Date.now()
  db.prepare(`
    INSERT INTO otp_codes (email, code, expires_at, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      code = excluded.code,
      expires_at = excluded.expires_at,
      created_at = excluded.created_at
  `).run(email, code, expiresAt, now)
}

export function getOtp(email: string): { code: string; expires_at: number } | undefined {
  return db
    .prepare('SELECT code, expires_at FROM otp_codes WHERE email = ?')
    .get(email) as { code: string; expires_at: number } | undefined
}

export function deleteOtp(email: string) {
  db.prepare('DELETE FROM otp_codes WHERE email = ?').run(email)
}

export function getPlayerByEmail(email: string): PlayerRow | undefined {
  return db.prepare('SELECT * FROM players WHERE email = ?').get(email) as
    | PlayerRow
    | undefined
}

export function getAllPlayers(): PlayerRow[] {
  return db
    .prepare('SELECT * FROM players ORDER BY CAST(jersey_number AS INTEGER), jersey_number')
    .all() as PlayerRow[]
}

export function getTakenNumbers(): string[] {
  return (db.prepare('SELECT jersey_number FROM players').all() as { jersey_number: string }[]).map(
    (r) => r.jersey_number,
  )
}

export function createPlayer(
  email: string,
  jerseyNumber: string,
  name: string,
  tagLine: string,
): PlayerRow {
  const now = Date.now()
  const result = db
    .prepare(
      `INSERT INTO players (email, jersey_number, name, tag_line, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(email, jerseyNumber, name, tagLine, now, now)

  return db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid) as PlayerRow
}

export function updatePlayer(
  email: string,
  jerseyNumber: string,
  name: string,
  tagLine: string,
): PlayerRow | undefined {
  const now = Date.now()
  const result = db
    .prepare(
      `UPDATE players
       SET jersey_number = ?, name = ?, tag_line = ?, updated_at = ?
       WHERE email = ?`,
    )
    .run(jerseyNumber, name, tagLine, now, email)

  if (result.changes === 0) return undefined
  return getPlayerByEmail(email)
}

export function isJerseyTaken(jerseyNumber: string, excludeEmail?: string): boolean {
  const row = excludeEmail
    ? (db
        .prepare('SELECT email FROM players WHERE jersey_number = ? AND email != ?')
        .get(jerseyNumber, excludeEmail) as { email: string } | undefined)
    : (db.prepare('SELECT email FROM players WHERE jersey_number = ?').get(jerseyNumber) as
        | { email: string }
        | undefined)
  return Boolean(row)
}

export default db
