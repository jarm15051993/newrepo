import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const packages = [
    {
      name: '2 Class Yoga Pass',
      description: 'Test package — 2 yoga classes',
      classCount: 2,
      price: 1.0,
      durationDays: 30,
      packageType: 'YOGA' as const,
      active: true,
    },
    {
      name: '2 Class Pilates Pass',
      description: 'Test package — 2 pilates (reformer) classes',
      classCount: 2,
      price: 1.0,
      durationDays: 30,
      packageType: 'REFORMER' as const,
      active: true,
    },
    {
      name: '2 Class Yoga + Pilates Pass',
      description: 'Test package — 2 classes, yoga or pilates',
      classCount: 2,
      price: 1.0,
      durationDays: 30,
      packageType: 'BOTH' as const,
      active: true,
    },
  ]

  for (const pkg of packages) {
    const existing = await prisma.package.findFirst({ where: { name: pkg.name } })
    if (existing) {
      console.log(`⏭  Already exists: ${pkg.name}`)
      continue
    }
    const created = await prisma.package.create({ data: pkg })
    console.log(`✓  Created: ${created.name} (${created.id})`)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
