import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Check if packages already exist
    const existingPackages = await prisma.package.count()
    
    if (existingPackages > 0) {
      return NextResponse.json({ 
        message: 'Packages already exist',
        count: existingPackages 
      })
    }

    // Create the 3 packages
    const packages = await prisma.package.createMany({
      data: [
        {
          id: '1',
          name: '1 Class',
          description: 'Perfect for trying out OOMA',
          classCount: 1,
          price: 10,
          active: true
        },
        {
          id: '2',
          name: '2 Classes',
          description: 'Save €5 per class',
          classCount: 2,
          price: 15,
          active: true
        },
        {
          id: '3',
          name: '5 Classes',
          description: 'Best value - Save €15!',
          classCount: 5,
          price: 35,
          active: true
        }
      ]
    })

    return NextResponse.json({ 
      message: 'Packages created successfully',
      count: packages.count
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}