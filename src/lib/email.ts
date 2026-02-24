import { Resend } from "resend"

const ONE_HOUR_MS = 60 * 60 * 1000
const ONE_DAY_MS = 24 * ONE_HOUR_MS

const getAppBaseUrl = () => {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return "http://localhost:3000"
}

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.")
  }
  return new Resend(apiKey)
}

const rawFrom = () =>
  process.env.RESEND_FROM || process.env.FROM_EMAIL || process.env.EMAIL_FROM

/** Returns "PlanEra <email>" so the inbox shows "PlanEra" instead of the raw address (e.g. noreply). */
function formatFromWithPlanEra(raw: string): string {
  const match = raw.match(/<([^>]+)>/)
  const email = match ? match[1].trim() : raw.trim()
  return `PlanEra <${email}>`
}

export const getFromAddress = () => {
  const from = rawFrom()
  return from ? formatFromWithPlanEra(from) : undefined
}

export const createVerificationLink = (token: string, email: string) => {
  const url = new URL("/auth/verify", getAppBaseUrl())
  url.searchParams.set("token", token)
  url.searchParams.set("email", email)
  return url.toString()
}

export const createPasswordResetLink = (token: string, email: string) => {
  const url = new URL("/auth/reset-password", getAppBaseUrl())
  url.searchParams.set("token", token)
  url.searchParams.set("email", email)
  return url.toString()
}

export const sendVerificationEmail = async (email: string, link: string) => {
  const from = getFromAddress()
  if (!from) {
    throw new Error("Email sender is not configured.")
  }

  const resend = getResendClient()

  await resend.emails.send({
    to: email,
    from,
    subject: "Verify your PlanEra account",
    text: `Verify your email to finish creating your PlanEra account: ${link}`,
    html: `<p>Verify your email to finish creating your PlanEra account.</p><p><a href="${link}">Verify email</a></p>`,
  })
}

export const sendPasswordResetEmail = async (email: string, link: string) => {
  const from = getFromAddress()
  if (!from) {
    throw new Error("Email sender is not configured.")
  }

  const resend = getResendClient()

  await resend.emails.send({
    to: email,
    from,
    subject: "Reset your PlanEra password",
    text: `Reset your password: ${link}`,
    html: `<p>Reset your password:</p><p><a href="${link}">Set a new password</a></p>`,
  })
}

export const verificationExpiry = () => new Date(Date.now() + ONE_DAY_MS)
export const passwordResetExpiry = () => new Date(Date.now() + ONE_HOUR_MS)

