import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const now = new Date()
  const offsets = [2, 6, 8, 10]

  const classes = offsets.map((hours) => {
    const startTime = new Date(now)
    startTime.setHours(now.getHours() + hours, 0, 0, 0)

    const endTime = new Date(startTime)
    endTime.setMinutes(50)

    return {
      title: 'Reformer Pilates',
      startTime,
      endTime,
      capacity: 10,
      instructor: 'Sofia M.',
    }
  })

  const result = await prisma.class.createMany({ data: classes })
  console.log(`Created ${result.count} classes for today:`)
  classes.forEach(c => console.log(`  ${c.startTime.toLocaleTimeString()} → ${c.endTime.toLocaleTimeString()}`))
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
