import { Router } from 'express'
import { deleteOtp, getOtp, saveOtp } from '../db.js'
import { generateOtp, isAllowedEmail, normalizeEmail, signToken } from '../auth.js'
import { sendOtpEmail } from '../email.js'
import { clearSessionCookie, requireAuth, setSessionCookie } from '../middleware.js'
import { getPlayerByEmail } from '../db.js'

const router = Router()
const OTP_TTL_MS = 10 * 60 * 1000
const sendCooldown = new Map<string, number>()

router.post('/send-otp', async (req, res) => {
  const email = normalizeEmail(String(req.body.email ?? ''))

  if (!email || !isAllowedEmail(email)) {
    res.status(400).json({ error: 'Only @dcluttr.ai email addresses are allowed' })
    return
  }

  const lastSent = sendCooldown.get(email) ?? 0
  if (Date.now() - lastSent < 60_000) {
    res.status(429).json({ error: 'Please wait a minute before requesting another code' })
    return
  }

  const code = generateOtp()
  saveOtp(email, code, Date.now() + OTP_TTL_MS)
  sendCooldown.set(email, Date.now())

  try {
    await sendOtpEmail(email, code)
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to send verification email' })
  }
})

router.post('/verify-otp', (req, res) => {
  const email = normalizeEmail(String(req.body.email ?? ''))
  const code = String(req.body.code ?? '').trim()

  if (!email || !isAllowedEmail(email)) {
    res.status(400).json({ error: 'Only @dcluttr.ai email addresses are allowed' })
    return
  }

  if (!/^\d{6}$/.test(code)) {
    res.status(400).json({ error: 'Invalid verification code' })
    return
  }

  const record = getOtp(email)
  if (!record || record.expires_at < Date.now()) {
    res.status(400).json({ error: 'Code expired. Please request a new one.' })
    return
  }

  if (record.code !== code) {
    res.status(400).json({ error: 'Incorrect code' })
    return
  }

  deleteOtp(email)
  const token = signToken(email)
  setSessionCookie(res, token)
  res.json({ ok: true, email })
})

router.get('/me', requireAuth, (req, res) => {
  const email = req.userEmail!
  const player = getPlayerByEmail(email)
  res.json({
    email,
    player: player
      ? {
          jerseyNumber: player.jersey_number,
          name: player.name,
          tagLine: player.tag_line,
          createdAt: player.created_at,
          updatedAt: player.updated_at,
        }
      : null,
  })
})

router.post('/logout', (_req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

export default router
