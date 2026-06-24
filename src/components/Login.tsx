import { useEffect, useState } from 'react'
import { api, type AppConfig } from '../api'

type Step = 'email' | 'otp'

interface LoginProps {
  onSuccess: () => void
}

export function Login({ onSuccess }: LoginProps) {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [config, setConfig] = useState<AppConfig | null>(null)

  useEffect(() => {
    api.getConfig().then(setConfig).catch(() => setConfig(null))
  }, [])

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.sendOtp(email)
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.verifyOtp(email, code)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-card">
      <div className="login-header">
        <h1>Team Jersey Order</h1>
        <p>Sign in with your <strong>@dcluttr.ai</strong> email to claim your jersey number.</p>
      </div>

      {config?.resendTestMode && (
        <div className="alert alert-info" role="status">
          <strong>Test mode.</strong> OTP emails go to{' '}
          <strong>{config.testRecipient ?? 'the server console'}</strong> only (Resend sandbox).
          Use any <strong>@dcluttr.ai</strong> email to sign in — check that inbox or the server
          terminal for the code.
        </div>
      )}

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      {step === 'email' ? (
        <form onSubmit={handleSendOtp} className="login-form">
          <label className="field">
            <span>Work email</span>
            <input
              type="email"
              placeholder="you@dcluttr.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Sending…' : 'Send login code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="login-form">
          <p className="otp-sent">
            {config?.resendTestMode ? (
              <>
                Code sent to <strong>{config.testRecipient}</strong> for login as{' '}
                <strong>{email}</strong>
              </>
            ) : (
              <>
                We sent a 6-digit code to <strong>{email}</strong>
              </>
            )}
          </p>
          <label className="field">
            <span>Verification code</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
              autoFocus
            />
          </label>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading || code.length < 6}>
            {loading ? 'Verifying…' : 'Verify & sign in'}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-full"
            onClick={() => {
              setStep('email')
              setCode('')
              setError('')
            }}
          >
            Use a different email
          </button>
        </form>
      )}

      <p className="login-note">
        Jersey numbers are first come, first served. Each person can register one player only.
      </p>
    </div>
  )
}
