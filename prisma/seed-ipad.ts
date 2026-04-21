import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.IPAD_USER_EMAIL
  const password = process.env.IPAD_USER_PASSWORD

  if (!email || !password) {
    throw new Error('IPAD_USER_EMAIL and IPAD_USER_PASSWORD must be set')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      name: 'iPad',
      lastName: 'Ooma',
      onboardingCompleted: true,
      canValidateAttendance: true,
      activatedAt: new Date(),
    },
  })

  console.log(`iPad user seeded: ${user.email} (id: ${user.id})`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
