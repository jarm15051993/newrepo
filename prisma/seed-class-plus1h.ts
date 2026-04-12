import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const now = new Date()
  const startTime = new Date(now)
  startTime.setHours(now.getHours() + 1, 0, 0, 0)

  const endTime = new Date(startTime)
  endTime.setMinutes(50)

  await prisma.class.create({
    data: { title: 'Reformer Pilates', startTime, endTime, capacity: 10, instructor: 'Sofia M.' },
  })

  console.log(`Created class at ${startTime.toLocaleTimeString()} → ${endTime.toLocaleTimeString()}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
