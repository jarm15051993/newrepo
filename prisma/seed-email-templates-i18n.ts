/**
 * seed-email-templates-i18n.ts
 *
 * Migrates existing English-content templates (currently stored as language='es' from the
 * schema default) to language='en', then upserts full Spanish and Catalan translations.
 *
 * Run: npx tsx prisma/seed-email-templates-i18n.ts
 *
 * ⚠️  STUDIO OWNER SIGN-OFF REQUIRED before go-live:
 *   - All Spanish translations must be reviewed by the studio owner.
 *   - All Catalan translations must be reviewed by the studio owner.
 *   - The disclaimer content in all three languages must undergo legal review.
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// ─── Shared HTML wrapper ──────────────────────────────────────────────────────
const wrap = (title: string, subtitle: string, body: string) => `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 12px;">
  <h1 style="color: #fbbf24; text-align: center; margin-bottom: 8px;">OOMA Wellness Club</h1>
  <p style="color: #9ca3af; text-align: center; margin-bottom: 32px;">${title}</p>
  ${body}
</div>
`.trim()

const infoCard = (rows: [string, string][]) => `
  <div style="background: #111827; border: 1px solid #374151; border-radius: 8px; padding: 24px; margin: 24px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      ${rows.map(([label, value]) => `
      <tr>
        <td style="color: #9ca3af; font-size: 14px; padding: 6px 0;">${label}</td>
        <td style="color: #fff; font-size: 14px; text-align: right;">${value}</td>
      </tr>`).join('')}
    </table>
  </div>`

const btn = (href: string, label: string) =>
  `<div style="text-align: center; margin: 36px 0;"><a href="${href}" style="background: #fbbf24; color: #000; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none; display: inline-block;">${label}</a></div>`

const footer = (text: string) =>
  `<p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 24px;">${text}</p>`

// ─── Templates ───────────────────────────────────────────────────────────────

const templates: { type: string; language: string; subject: string; htmlBody: string }[] = [

  // ══════════════════════════════════════════════════════════════════════════════
  // ACTIVATION
  // ══════════════════════════════════════════════════════════════════════════════
  {
    type: 'activation', language: 'en',
    subject: 'Activate your OOMA Wellness Club account',
    htmlBody: wrap('Welcome to the club!', '', `
  <p style="color: #fff; font-size: 16px;">Hi {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Thank you for signing up. Please click the button below to activate your account and start booking classes.
  </p>
  ${btn('{{link}}', 'Activate Account')}
  ${footer("If you didn't create an account, you can safely ignore this email.")}
  ${footer('If the button doesn\'t work, copy and paste this link: <a href="{{link}}" style="color: #fbbf24;">{{link}}</a>')}
`),
  },
  {
    type: 'activation', language: 'es',
    subject: 'Activa tu cuenta de OOMA Wellness Club',
    htmlBody: wrap('¡Bienvenido/a al club!', '', `
  <p style="color: #fff; font-size: 16px;">Hola {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Gracias por registrarte. Haz clic en el botón de abajo para activar tu cuenta y empezar a reservar clases.
  </p>
  ${btn('{{link}}', 'Activar cuenta')}
  ${footer('Si no has creado una cuenta, puedes ignorar este correo.')}
  ${footer('Si el botón no funciona, copia y pega este enlace: <a href="{{link}}" style="color: #fbbf24;">{{link}}</a>')}
`),
  },
  {
    type: 'activation', language: 'ca',
    subject: 'Activa el teu compte de OOMA Wellness Club',
    htmlBody: wrap('Benvingut/da al club!', '', `
  <p style="color: #fff; font-size: 16px;">Hola {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Gràcies per registrar-te. Fes clic al botó de sota per activar el teu compte i començar a reservar classes.
  </p>
  ${btn('{{link}}', 'Activa el compte')}
  ${footer("Si no has creat un compte, pots ignorar aquest correu.")}
  ${footer('Si el botó no funciona, copia i enganxa aquest enllaç: <a href="{{link}}" style="color: #fbbf24;">{{link}}</a>')}
`),
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // PASSWORD RESET
  // ══════════════════════════════════════════════════════════════════════════════
  {
    type: 'password_reset', language: 'en',
    subject: 'Reset your OOMA Wellness Club password',
    htmlBody: wrap('Password Reset', '', `
  <p style="color: #fff; font-size: 16px;">Hi {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    We received a request to reset your password. Click the button below to set a new one.
    This link expires in <strong style="color: #fbbf24;">1 hour</strong>.
  </p>
  ${btn('{{link}}', 'Reset Password')}
  ${footer("If you didn't request a password reset, you can safely ignore this email. Your password will not change.")}
  ${footer('If the button doesn\'t work, copy and paste this link: <a href="{{link}}" style="color: #fbbf24;">{{link}}</a>')}
`),
  },
  {
    type: 'password_reset', language: 'es',
    subject: 'Restablece tu contraseña de OOMA Wellness Club',
    htmlBody: wrap('Restablecer contraseña', '', `
  <p style="color: #fff; font-size: 16px;">Hola {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para establecer una nueva.
    Este enlace caduca en <strong style="color: #fbbf24;">1 hora</strong>.
  </p>
  ${btn('{{link}}', 'Restablecer contraseña')}
  ${footer("Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no cambiará.")}
  ${footer('Si el botón no funciona, copia y pega este enlace: <a href="{{link}}" style="color: #fbbf24;">{{link}}</a>')}
`),
  },
  {
    type: 'password_reset', language: 'ca',
    subject: 'Restableix la teva contrasenya de OOMA Wellness Club',
    htmlBody: wrap('Restabliment de contrasenya', '', `
  <p style="color: #fff; font-size: 16px;">Hola {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Hem rebut una sol·licitud per restablir la teva contrasenya. Fes clic al botó de sota per establir-ne una de nova.
    Aquest enllaç caduca en <strong style="color: #fbbf24;">1 hora</strong>.
  </p>
  ${btn('{{link}}', 'Restableix la contrasenya')}
  ${footer("Si no has sol·licitat aquest canvi, pots ignorar aquest correu. La teva contrasenya no canviarà.")}
  ${footer('Si el botó no funciona, copia i enganxa aquest enllaç: <a href="{{link}}" style="color: #fbbf24;">{{link}}</a>')}
`),
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // BOOKING CONFIRMATION
  // ══════════════════════════════════════════════════════════════════════════════
  {
    type: 'booking_confirmation', language: 'en',
    subject: 'Booking confirmed: {{classTitle}}',
    htmlBody: wrap('Booking Confirmed', '', `
  <p style="color: #fff; font-size: 16px;">Hi {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">Your class booking is confirmed. Here are the details:</p>
  ${infoCard([['Class', '<span style="color:#fbbf24;font-weight:700;">{{classTitle}}</span>'], ['Date', '{{date}}'], ['Time', '{{time}}'], ['Reformer', '#{{reformerNumber}}']]) }
  ${footer("See you on the reformer! If you need to cancel, please do so from the app.")}
`),
  },
  {
    type: 'booking_confirmation', language: 'es',
    subject: 'Reserva confirmada: {{classTitle}}',
    htmlBody: wrap('Reserva confirmada', '', `
  <p style="color: #fff; font-size: 16px;">Hola {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">Tu reserva está confirmada. Aquí tienes los detalles:</p>
  ${infoCard([['Clase', '<span style="color:#fbbf24;font-weight:700;">{{classTitle}}</span>'], ['Fecha', '{{date}}'], ['Hora', '{{time}}'], ['Reformer', '#{{reformerNumber}}']]) }
  ${footer("¡Nos vemos en el reformer! Si necesitas cancelar, hazlo desde la app.")}
`),
  },
  {
    type: 'booking_confirmation', language: 'ca',
    subject: 'Reserva confirmada: {{classTitle}}',
    htmlBody: wrap('Reserva confirmada', '', `
  <p style="color: #fff; font-size: 16px;">Hola {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">La teva reserva està confirmada. Aquí tens els detalls:</p>
  ${infoCard([['Classe', '<span style="color:#fbbf24;font-weight:700;">{{classTitle}}</span>'], ['Data', '{{date}}'], ['Hora', '{{time}}'], ['Reformer', '#{{reformerNumber}}']]) }
  ${footer("Ens veiem al reformer! Si necessites cancel·lar, fes-ho des de l'app.")}
`),
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // BOOKING CANCELLATION
  // ══════════════════════════════════════════════════════════════════════════════
  {
    type: 'booking_cancellation', language: 'en',
    subject: 'Booking cancelled: {{classTitle}}',
    htmlBody: wrap('Booking Cancelled', '', `
  <p style="color: #fff; font-size: 16px;">Hi {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">Your booking has been cancelled. Here are the details:</p>
  ${infoCard([['Class', '<span style="color:#fbbf24;font-weight:700;">{{classTitle}}</span>'], ['Date', '{{date}}'], ['Time', '{{time}}']]) }
  <p style="color: #d1d5db; font-size: 14px; text-align: center;">{{creditNote}}</p>
  ${footer("We hope to see you back soon!")}
`),
  },
  {
    type: 'booking_cancellation', language: 'es',
    subject: 'Reserva cancelada: {{classTitle}}',
    htmlBody: wrap('Reserva cancelada', '', `
  <p style="color: #fff; font-size: 16px;">Hola {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">Tu reserva ha sido cancelada. Aquí tienes los detalles:</p>
  ${infoCard([['Clase', '<span style="color:#fbbf24;font-weight:700;">{{classTitle}}</span>'], ['Fecha', '{{date}}'], ['Hora', '{{time}}']]) }
  <p style="color: #d1d5db; font-size: 14px; text-align: center;">{{creditNote}}</p>
  ${footer("¡Esperamos verte pronto!")}
`),
  },
  {
    type: 'booking_cancellation', language: 'ca',
    subject: 'Reserva cancel·lada: {{classTitle}}',
    htmlBody: wrap('Reserva cancel·lada', '', `
  <p style="color: #fff; font-size: 16px;">Hola {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">La teva reserva ha estat cancel·lada. Aquí tens els detalls:</p>
  ${infoCard([['Classe', '<span style="color:#fbbf24;font-weight:700;">{{classTitle}}</span>'], ['Data', '{{date}}'], ['Hora', '{{time}}']]) }
  <p style="color: #d1d5db; font-size: 14px; text-align: center;">{{creditNote}}</p>
  ${footer("Esperem veure't aviat!")}
`),
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // PACKAGE PURCHASE
  // ══════════════════════════════════════════════════════════════════════════════
  {
    type: 'package_purchase', language: 'en',
    subject: 'Your {{packageName}} is confirmed',
    htmlBody: wrap('Purchase Confirmed', '', `
  <p style="color: #fff; font-size: 16px;">Hi {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Your purchase is confirmed and your classes are ready to book. Here are your package details:
  </p>
  ${infoCard([['Package', '<span style="color:#fbbf24;font-weight:700;">{{packageName}}</span>'], ['Classes', '{{classCount}}'], ['Amount paid', '€{{amount}}'], ['Expires', '{{expiresAt}}']]) }
  ${footer("Open the Ooma app to start booking your classes. See you on the reformer!")}
`),
  },
  {
    type: 'package_purchase', language: 'es',
    subject: 'Tu {{packageName}} está confirmado',
    htmlBody: wrap('Compra confirmada', '', `
  <p style="color: #fff; font-size: 16px;">Hola {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Tu compra está confirmada y tus clases están listas para reservar. Aquí tienes los detalles de tu paquete:
  </p>
  ${infoCard([['Paquete', '<span style="color:#fbbf24;font-weight:700;">{{packageName}}</span>'], ['Clases', '{{classCount}}'], ['Importe pagado', '€{{amount}}'], ['Caduca', '{{expiresAt}}']]) }
  ${footer("Abre la app de Ooma para reservar tus clases. ¡Nos vemos en el reformer!")}
`),
  },
  {
    type: 'package_purchase', language: 'ca',
    subject: 'El teu {{packageName}} està confirmat',
    htmlBody: wrap('Compra confirmada', '', `
  <p style="color: #fff; font-size: 16px;">Hola {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    La teva compra està confirmada i les teves classes estan llestes per reservar. Aquí tens els detalls del teu paquet:
  </p>
  ${infoCard([['Paquet', '<span style="color:#fbbf24;font-weight:700;">{{packageName}}</span>'], ['Classes', '{{classCount}}'], ['Import pagat', '€{{amount}}'], ['Caduca', '{{expiresAt}}']]) }
  ${footer("Obre l'app d'Ooma per reservar les teves classes. Ens veiem al reformer!")}
`),
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // STUDENT STATUS GRANTED
  // ══════════════════════════════════════════════════════════════════════════════
  {
    type: 'student_status_granted', language: 'en',
    subject: 'Your student discount is now active at OOMA',
    htmlBody: wrap('Student Discount Active', '', `
  <p style="color: #fff; font-size: 16px;">Hi {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Great news — your student status has been verified and your discount is now active.
    You now have access to our <strong style="color: #fbbf24;">student packages</strong> at reduced rates.
  </p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Open the Ooma app and head to the packages screen to see your student pricing.
  </p>
  ${footer("Questions? Contact us at admin@oomawellness.shop.")}
`),
  },
  {
    type: 'student_status_granted', language: 'es',
    subject: 'Tu descuento de estudiante ya está activo en OOMA',
    htmlBody: wrap('Descuento de estudiante activo', '', `
  <p style="color: #fff; font-size: 16px;">Hola {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    ¡Buenas noticias! Tu estado de estudiante ha sido verificado y tu descuento ya está activo.
    Ahora tienes acceso a nuestros <strong style="color: #fbbf24;">paquetes de estudiante</strong> a precios reducidos.
  </p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Abre la app de Ooma y ve a la pantalla de paquetes para ver tus precios de estudiante.
  </p>
  ${footer("¿Preguntas? Escríbenos a admin@oomawellness.shop.")}
`),
  },
  {
    type: 'student_status_granted', language: 'ca',
    subject: 'El teu descompte d\'estudiant ja és actiu a OOMA',
    htmlBody: wrap("Descompte d'estudiant actiu", '', `
  <p style="color: #fff; font-size: 16px;">Hola {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Bones notícies! El teu estat d'estudiant ha estat verificat i el teu descompte ja és actiu.
    Ara tens accés als nostres <strong style="color: #fbbf24;">paquets d'estudiant</strong> a preus reduïts.
  </p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Obre l'app d'Ooma i vés a la pantalla de paquets per veure els teus preus d'estudiant.
  </p>
  ${footer("Preguntes? Escriu-nos a admin@oomawellness.shop.")}
`),
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // STUDENT STATUS REMOVED
  // ══════════════════════════════════════════════════════════════════════════════
  {
    type: 'student_status_removed', language: 'en',
    subject: 'Your student status at OOMA has been updated',
    htmlBody: wrap('Student Status Update', '', `
  <p style="color: #fff; font-size: 16px;">Hi {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Your student status at OOMA Wellness Club has been removed. You no longer have access to student-only packages.
  </p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    All regular packages remain available to you. If you believe this is a mistake, please contact us.
  </p>
  ${footer("Questions? Reach us at admin@oomawellness.shop.")}
`),
  },
  {
    type: 'student_status_removed', language: 'es',
    subject: 'Tu estado de estudiante en OOMA ha sido actualizado',
    htmlBody: wrap('Actualización de estado de estudiante', '', `
  <p style="color: #fff; font-size: 16px;">Hola {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Tu estado de estudiante en OOMA Wellness Club ha sido eliminado. Ya no tienes acceso a los paquetes exclusivos para estudiantes.
  </p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Todos los paquetes regulares siguen disponibles para ti. Si crees que esto es un error, contáctanos.
  </p>
  ${footer("¿Preguntas? Escríbenos a admin@oomawellness.shop.")}
`),
  },
  {
    type: 'student_status_removed', language: 'ca',
    subject: 'El teu estat d\'estudiant a OOMA ha estat actualitzat',
    htmlBody: wrap("Actualització d'estat d'estudiant", '', `
  <p style="color: #fff; font-size: 16px;">Hola {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    El teu estat d'estudiant a OOMA Wellness Club ha estat eliminat. Ja no tens accés als paquets exclusius per a estudiants.
  </p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Tots els paquets regulars continuen disponibles per a tu. Si creus que és un error, contacta'ns.
  </p>
  ${footer("Preguntes? Escriu-nos a admin@oomawellness.shop.")}
`),
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // EMAIL VERIFICATION
  // ══════════════════════════════════════════════════════════════════════════════
  {
    type: 'email_verification', language: 'en',
    subject: 'Verify your new email address',
    htmlBody: wrap('Email Verification', '', `
  <p style="color: #fff; font-size: 16px;">Hi {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    You requested to change your email address to <strong style="color: #fbbf24;">{{newEmail}}</strong>.
    Click the button below to confirm this change. This link expires in <strong style="color: #fbbf24;">24 hours</strong>.
  </p>
  ${btn('{{link}}', 'Verify Email Address')}
  ${footer("If you didn't request this change, you can safely ignore this email. Your current email will remain unchanged.")}
  ${footer('If the button doesn\'t work, copy and paste this link: <a href="{{link}}" style="color: #fbbf24;">{{link}}</a>')}
`),
  },
  {
    type: 'email_verification', language: 'es',
    subject: 'Verifica tu nueva dirección de email',
    htmlBody: wrap('Verificación de email', '', `
  <p style="color: #fff; font-size: 16px;">Hola {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Has solicitado cambiar tu dirección de email a <strong style="color: #fbbf24;">{{newEmail}}</strong>.
    Haz clic en el botón de abajo para confirmar este cambio. Este enlace caduca en <strong style="color: #fbbf24;">24 horas</strong>.
  </p>
  ${btn('{{link}}', 'Verificar dirección de email')}
  ${footer("Si no solicitaste este cambio, puedes ignorar este correo. Tu email actual no cambiará.")}
  ${footer('Si el botón no funciona, copia y pega este enlace: <a href="{{link}}" style="color: #fbbf24;">{{link}}</a>')}
`),
  },
  {
    type: 'email_verification', language: 'ca',
    subject: 'Verifica la teva nova adreça de correu electrònic',
    htmlBody: wrap('Verificació de correu electrònic', '', `
  <p style="color: #fff; font-size: 16px;">Hola {{name}},</p>
  <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">
    Has sol·licitat canviar la teva adreça de correu a <strong style="color: #fbbf24;">{{newEmail}}</strong>.
    Fes clic al botó de sota per confirmar aquest canvi. Aquest enllaç caduca en <strong style="color: #fbbf24;">24 hores</strong>.
  </p>
  ${btn('{{link}}', 'Verifica l\'adreça de correu')}
  ${footer("Si no has sol·licitat aquest canvi, pots ignorar aquest correu. El teu correu actual no canviarà.")}
  ${footer('Si el botó no funciona, copia i enganxa aquest enllaç: <a href="{{link}}" style="color: #fbbf24;">{{link}}</a>')}
`),
  },
]

async function main() {
  console.log('Step 1: Fixing existing rows — updating language from "es" to "en" for English-content templates...')
  // Existing rows were created before the language field existed; they default to 'es'
  // but contain English content. Correct this by setting language = 'en'.
  const types = ['activation', 'password_reset', 'booking_confirmation', 'booking_cancellation',
    'package_purchase', 'student_status_granted', 'student_status_removed', 'email_verification']

  for (const type of types) {
    try {
      await prisma.emailTemplate.update({
        where: { type_language: { type, language: 'es' } },
        data: { language: 'en' },
      })
      console.log(`  ✓ Relabelled ${type} es → en`)
    } catch {
      // Row may not exist or already be 'en' — that's fine, upsert below will handle it
      console.log(`  – ${type} es→en: no existing row or already updated`)
    }
  }

  console.log('\nStep 2: Upserting all 24 templates (8 types × 3 languages)...')
  for (const t of templates) {
    await prisma.emailTemplate.upsert({
      where: { type_language: { type: t.type, language: t.language } },
      update: { subject: t.subject, htmlBody: t.htmlBody },
      create: t,
    })
    console.log(`  ✓ ${t.type} [${t.language}]`)
  }

  console.log('\n✅ Done. 24 email templates seeded across EN / ES / CA.')
  console.log('\n⚠️  REMINDER: Studio owner must review all ES and CA translations before go-live.')
  console.log('   Legal review of the disclaimer in EN and CA is a hard blocker for release.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
