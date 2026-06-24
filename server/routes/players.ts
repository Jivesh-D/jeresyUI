import { Router } from 'express'
import {
  createPlayer,
  getAllPlayers,
  getPlayerByEmail,
  getTakenNumbers,
  isJerseyTaken,
  JERSEY_SIZES,
  updatePlayer,
} from '../db.js'
import { requireAuth } from '../middleware.js'

const router = Router()

function validateSubmission(body: Record<string, unknown>) {
  const jerseyNumber = String(body.jerseyNumber ?? '').trim()
  const name = String(body.name ?? '').trim()
  const tagLine = String(body.tagLine ?? '').trim()
  const jerseySize = String(body.jerseySize ?? '').trim().toUpperCase()

  if (!/^\d{1,3}$/.test(jerseyNumber)) {
    return { error: 'Jersey number must be 1–3 digits' }
  }
  if (!name) {
    return { error: 'Name is required' }
  }
  if (name.length > 20) {
    return { error: 'Name must be 20 characters or less' }
  }
  if (tagLine.length > 24) {
    return { error: 'Tag line must be 24 characters or less' }
  }
  if (!jerseySize) {
    return { error: 'Jersey size is required' }
  }
  if (!JERSEY_SIZES.includes(jerseySize as (typeof JERSEY_SIZES)[number])) {
    return { error: 'Invalid jersey size' }
  }

  return { jerseyNumber, name, tagLine, jerseySize }
}

function toPublicPlayer(p: {
  jersey_number: string
  name: string
  tag_line: string
  jersey_size: string
  email: string
  created_at: number
}) {
  return {
    jerseyNumber: p.jersey_number,
    name: p.name,
    tagLine: p.tag_line,
    jerseySize: p.jersey_size,
    createdAt: p.created_at,
  }
}

router.get('/taken-numbers', (_req, res) => {
  res.json({ numbers: getTakenNumbers() })
})

router.get('/', (_req, res) => {
  const players = getAllPlayers().map((p) => toPublicPlayer(p))
  res.json({ players, total: players.length })
})

router.post('/', requireAuth, (req, res) => {
  const email = req.userEmail!
  const existing = getPlayerByEmail(email)

  if (existing) {
    res.status(409).json({ error: 'You have already registered a player. You can edit your entry instead.' })
    return
  }

  const validated = validateSubmission(req.body)
  if ('error' in validated) {
    res.status(400).json({ error: validated.error })
    return
  }

  const { jerseyNumber, name, tagLine, jerseySize } = validated

  if (isJerseyTaken(jerseyNumber)) {
    res.status(409).json({ error: `Jersey #${jerseyNumber} was just taken. Pick another number.` })
    return
  }

  try {
    const player = createPlayer(email, jerseyNumber, name, tagLine, jerseySize)
    res.status(201).json({ player: toPublicPlayer(player) })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('UNIQUE constraint failed')) {
      if (isJerseyTaken(jerseyNumber)) {
        res.status(409).json({ error: `Jersey #${jerseyNumber} was just taken. Pick another number.` })
        return
      }
      res.status(409).json({ error: 'You have already registered a player.' })
      return
    }
    res.status(500).json({ error: 'Failed to save player' })
  }
})

router.put('/me', requireAuth, (req, res) => {
  const email = req.userEmail!
  const existing = getPlayerByEmail(email)

  if (!existing) {
    res.status(404).json({ error: 'No player registered yet' })
    return
  }

  const validated = validateSubmission(req.body)
  if ('error' in validated) {
    res.status(400).json({ error: validated.error })
    return
  }

  const { jerseyNumber, name, tagLine, jerseySize } = validated

  if (jerseyNumber !== existing.jersey_number && isJerseyTaken(jerseyNumber, email)) {
    res.status(409).json({ error: `Jersey #${jerseyNumber} was just taken. Pick another number.` })
    return
  }

  try {
    const player = updatePlayer(email, jerseyNumber, name, tagLine, jerseySize)
    res.json({ player: player ? toPublicPlayer(player) : null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: `Jersey #${jerseyNumber} was just taken. Pick another number.` })
      return
    }
    res.status(500).json({ error: 'Failed to update player' })
  }
})

router.get('/export', (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret || req.query.secret !== adminSecret) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const players = getAllPlayers()
  const header = 'Jersey Number,Name,Tag Line,Jersey Size,Email,Created At'
  const rows = players.map((p) =>
    [p.jersey_number, p.name, p.tag_line, p.jersey_size, p.email, new Date(p.created_at).toISOString()]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  )

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="jersey-order.csv"')
  res.send([header, ...rows].join('\n'))
})

export default router
