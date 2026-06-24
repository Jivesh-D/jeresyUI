import crypto from 'crypto'
import jwt from 'jsonwebtoken'

const ALLOWED_DOMAIN = '@dcluttr.ai'
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
const JWT_EXPIRY = '7d'

export interface AuthTokenPayload {
  email: string
}

export function isAllowedEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(ALLOWED_DOMAIN)
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999))
}

export function signToken(email: string): string {
  return jwt.sign({ email } satisfies AuthTokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload
  } catch {
    return null
  }
}
