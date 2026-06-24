const fromEmail = process.env.FROM_EMAIL ?? 'Jersey Order <onboarding@resend.dev>'

export const isResendTestMode =
  process.env.RESEND_TEST_MODE === 'true' || fromEmail.includes('onboarding@resend.dev')

export const resendFromEmail = fromEmail

export const resendTestRecipient = process.env.RESEND_TEST_RECIPIENT ?? ''

export function getPublicConfig() {
  return {
    resendTestMode: isResendTestMode,
    testRecipient: isResendTestMode ? resendTestRecipient : null,
  }
}
