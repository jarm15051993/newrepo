import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const templates = [
  {
    type: 'activation',
    subject: 'Activate your OOMA Wellness Club account',
    htmlBody: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 12px;">
  <h1 style="color: #fbbf24; text-align: center; margin-bottom: 8px;">OOMA Wellness Club</h1>
  <p style="color: #9ca3af; text-align: center; margin-bottom: 32px;">Welcome to the club!</p>

  <p style="color: #fff; font-size: 16px;">Hi {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Thank you for signing up. Please click the button below to activate your account and start booking classes.
  </p>

  <div style="text-align: center; margin: 36px 0;">
    <a href="{{link}}" style="background: #fbbf24; color: #000; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none; display: inline-block;">
      Activate Account
    </a>
  </div>

  <p style="color: #6b7280; font-size: 13px; text-align: center;">
    If you didn't create an account, you can safely ignore this email.
  </p>
  <p style="color: #6b7280; font-size: 13px; text-align: center;">
    If the button doesn't work, copy and paste this link: <a href="{{link}}" style="color: #fbbf24;">{{link}}</a>
  </p>
</div>
`.trim(),
  },
  {
    type: 'password_reset',
    subject: 'Reset your OOMA Wellness Club password',
    htmlBody: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 12px;">
  <h1 style="color: #fbbf24; text-align: center; margin-bottom: 8px;">OOMA Wellness Club</h1>
  <p style="color: #9ca3af; text-align: center; margin-bottom: 32px;">Password Reset</p>

  <p style="color: #fff; font-size: 16px;">Hi {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    We received a request to reset your password. Click the button below to set a new one.
    This link expires in <strong style="color: #fbbf24;">1 hour</strong>.
  </p>

  <div style="text-align: center; margin: 36px 0;">
    <a href="{{link}}" style="background: #fbbf24; color: #000; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none; display: inline-block;">
      Reset Password
    </a>
  </div>

  <p style="color: #6b7280; font-size: 13px; text-align: center;">
    If you didn't request a password reset, you can safely ignore this email. Your password will not change.
  </p>
  <p style="color: #6b7280; font-size: 13px; text-align: center;">
    If the button doesn't work, copy and paste this link: <a href="{{link}}" style="color: #fbbf24;">{{link}}</a>
  </p>
</div>
`.trim(),
  },
  {
    type: 'booking_confirmation',
    subject: 'Booking confirmed: {{classTitle}}',
    htmlBody: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 12px;">
  <h1 style="color: #fbbf24; text-align: center; margin-bottom: 8px;">OOMA Wellness Club</h1>
  <p style="color: #9ca3af; text-align: center; margin-bottom: 32px;">Booking Confirmed</p>

  <p style="color: #fff; font-size: 16px;">Hi {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Your class booking is confirmed. Here are the details:
  </p>

  <div style="background: #111827; border: 1px solid #374151; border-radius: 8px; padding: 24px; margin: 24px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="color: #9ca3af; font-size: 14px; padding: 6px 0;">Class</td>
        <td style="color: #fbbf24; font-size: 14px; font-weight: 700; text-align: right;">{{classTitle}}</td>
      </tr>
      <tr>
        <td style="color: #9ca3af; font-size: 14px; padding: 6px 0;">Date</td>
        <td style="color: #fff; font-size: 14px; text-align: right;">{{date}}</td>
      </tr>
      <tr>
        <td style="color: #9ca3af; font-size: 14px; padding: 6px 0;">Time</td>
        <td style="color: #fff; font-size: 14px; text-align: right;">{{time}}</td>
      </tr>
      <tr>
        <td style="color: #9ca3af; font-size: 14px; padding: 6px 0;">Reformer</td>
        <td style="color: #fff; font-size: 14px; text-align: right;">#{{reformerNumber}}</td>
      </tr>
    </table>
  </div>

  <p style="color: #6b7280; font-size: 13px; text-align: center;">
    See you on the reformer! If you need to cancel, please do so from your dashboard.
  </p>
</div>
`.trim(),
  },
]

async function main() {
  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { type: template.type },
      update: {},
      create: template,
    })
    console.log(`Seeded template: ${template.type}`)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
