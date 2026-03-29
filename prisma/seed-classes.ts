import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CLASS_TITLES = [
  'Reformer Pilates',
  'Mat Pilates',
  'Core & Stretch',
  'Full Body Reformer',
  'Sculpt & Tone',
]

const INSTRUCTORS = ['Sofia M.', 'Ana R.', 'Laura G.']

// Studio hours: 7am – 8pm (last class starts at 8pm)
const START_HOUR = 7
const END_HOUR = 20

async function main() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const classes = []

  for (let day = 1; day <= 5; day++) {
    const date = new Date(today)
    date.setDate(today.getDate() + day)

    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
      const startTime = new Date(date)
      startTime.setHours(hour, 0, 0, 0)

      const endTime = new Date(date)
      endTime.setHours(hour, 50, 0, 0) // 50-min classes

      classes.push({
        title: CLASS_TITLES[(hour - START_HOUR) % CLASS_TITLES.length],
        startTime,
        endTime,
        capacity: 10,
        instructor: INSTRUCTORS[hour % INSTRUCTORS.length],
      })
    }
  }

  const result = await prisma.class.createMany({ data: classes })
  console.log(`Created ${result.count} classes across 5 days`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
