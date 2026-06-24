import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from './auth.js'

const COOKIE_NAME = 'jersey_session'

export function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: '/' })
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[COOKIE_NAME]
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const payload = verifyToken(token)
  if (!payload) {
    res.status(401).json({ error: 'Session expired' })
    return
  }

  req.userEmail = payload.email
  next()
}

declare global {
  namespace Express {
    interface Request {
      userEmail?: string
    }
  }
}
