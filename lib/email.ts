import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}
const FROM = process.env.EMAIL_FROM || 'OOMA Wellness Club <noreply@oomawellness.com>'

// Types the user can opt out of — system emails (activation, password_reset) always send
const PREFERENCE_CONTROLLED_TYPES = new Set([
  'booking_confirmation',
  'booking_cancellation',
  'package_purchase',
])

function applyPlaceholders(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
    template
  )
}

interface SendEmailOptions {
  to: string
  type: 'activation' | 'password_reset' | 'booking_confirmation' | 'booking_cancellation' | 'package_purchase'
  userId?: string
  vars: Record<string, string>
  metadata?: Record<string, unknown>
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>
}

export async function sendEmail({ to, type, userId, vars, metadata, attachments }: SendEmailOptions): Promise<void> {
  // Check notification preference for controllable email types
  if (userId && PREFERENCE_CONTROLLED_TYPES.has(type)) {
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId_type: { userId, type } },
    })
    // If a preference row exists and is disabled, skip silently
    if (pref && !pref.enabled) return
    // If no row exists, default is On — continue sending
  }

  // Fetch template from DB
  const template = await prisma.emailTemplate.findUnique({ where: { type } })
  if (!template) {
    throw new Error(`No email template found for type: ${type}`)
  }

  const subject = applyPlaceholders(template.subject, vars)
  const html = applyPlaceholders(template.htmlBody, vars)

  let status = 'sent'
  try {
    const result = await getResend().emails.send({ from: FROM, to, subject, html, ...(attachments ? { attachments } : {}) })
    if ('error' in result && result.error) {
      console.error(`[email] Resend error sending ${type} to ${to}:`, result.error)
      status = 'failed'
      throw new Error((result.error as any).message || 'Email send failed')
    }
  } catch (err) {
    status = 'failed'
    prisma.emailLog.create({
      data: { userId: userId ?? null, to, type, subject, status, metadata: metadata ? (metadata as any) : undefined },
    }).catch(e => console.error('[email] Failed to write EmailLog:', e))
    throw err
  }

  prisma.emailLog.create({
    data: {
      userId: userId ?? null,
      to,
      type,
      subject,
      status,
      metadata: metadata ? (metadata as any) : undefined,
    },
  }).catch(e => console.error('[email] Failed to write EmailLog:', e))
}
