import { Resend } from 'resend'
import { isResendTestMode, resendFromEmail, resendTestRecipient } from './config.js'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function otpHtml(code: string, requestedEmail?: string) {
  const testNote = requestedEmail
    ? `<p style="color: #64748b; font-size: 14px;">Test mode: login requested for <strong>${requestedEmail}</strong></p>`
    : ''

  return `
    <div style="font-family: system-ui, sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #0f172a;">Team Jersey Order</h2>
      ${testNote}
      <p>Your one-time login code is:</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 0.2em; color: #16a34a;">${code}</p>
      <p style="color: #64748b; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
    </div>
  `
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  if (!resend) {
    console.log(`[DEV] OTP for ${email}: ${code}`)
    return
  }

  if (isResendTestMode) {
    if (!resendTestRecipient) {
      console.log(`[TEST MODE] OTP for ${email}: ${code}`)
      console.warn('Set RESEND_TEST_RECIPIENT in .env to also receive OTP emails via Resend.')
      return
    }

    console.log(`[TEST MODE] OTP for ${email}: ${code} (emailed to ${resendTestRecipient})`)

    const { error } = await resend.emails.send({
      from: resendFromEmail,
      to: resendTestRecipient,
      subject: `Jersey login code for ${email}`,
      html: otpHtml(code, email),
    })

    if (error) {
      console.error('Failed to send test OTP email:', error)
      console.log(`[TEST MODE] OTP for ${email}: ${code}`)
      return
    }

    return
  }

  const { error } = await resend.emails.send({
    from: resendFromEmail,
    to: email,
    subject: 'Your jersey order login code',
    html: otpHtml(code),
  })

  if (error) {
    console.error('Failed to send OTP email:', error)
    throw new Error('Failed to send verification email')
  }
}
