import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — list all packages
export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      orderBy: { price: 'asc' },
    })
    return NextResponse.json({ packages })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST — create or update a package
// Body: { name, description?, classCount, price, durationDays?, isStudentPackage?, active?, id? }
// If `id` is provided, updates that package. Otherwise creates a new one.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      description = null,
      classCount,
      price,
      durationDays = 30,
      isStudentPackage = false,
      active = true,
    } = body

    if (!name || classCount == null || price == null) {
      return NextResponse.json({ error: 'name, classCount, and price are required' }, { status: 400 })
    }

    const data = {
      name,
      description,
      classCount: parseInt(classCount),
      price: parseFloat(price),
      durationDays: parseInt(durationDays),
      isStudentPackage: Boolean(isStudentPackage),
      active: Boolean(active),
    }

    const pkg = id
      ? await prisma.package.update({ where: { id }, data })
      : await prisma.package.create({ data })

    return NextResponse.json({ package: pkg })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH — toggle active status
export async function PATCH(request: NextRequest) {
  try {
    const { id, active } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const pkg = await prisma.package.update({ where: { id }, data: { active: Boolean(active) } })
    return NextResponse.json({ package: pkg })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
