import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Check if classes already exist
    const existingClasses = await prisma.class.count()
    
    if (existingClasses > 0) {
      return NextResponse.json({ 
        message: 'Classes already exist',
        count: existingClasses 
      })
    }

    // Get current date and time
    const now = new Date()
    
    // Create classes for the next 7 days
    const classesToCreate = []
    
    for (let day = 0; day < 7; day++) {
      const classDate = new Date(now)
      classDate.setDate(now.getDate() + day)
      
      // Morning class at 9:00 AM
      const morningStart = new Date(classDate)
      morningStart.setHours(9, 0, 0, 0)
      const morningEnd = new Date(morningStart)
      morningEnd.setHours(10, 0, 0, 0)
      
      classesToCreate.push({
        title: 'Morning Flow',
        description: 'Start your day with energizing pilates movements',
        startTime: morningStart,
        endTime: morningEnd,
        capacity: 6,
        instructor: 'Sarah Martinez'
      })
      
      // Midday class at 12:00 PM
      const middayStart = new Date(classDate)
      middayStart.setHours(12, 0, 0, 0)
      const middayEnd = new Date(middayStart)
      middayEnd.setHours(13, 0, 0, 0)
      
      classesToCreate.push({
        title: 'Lunch Break Pilates',
        description: 'Perfect midday reset for body and mind',
        startTime: middayStart,
        endTime: middayEnd,
        capacity: 6,
        instructor: 'Maria Rodriguez'
      })
      
      // Evening class at 6:00 PM
      const eveningStart = new Date(classDate)
      eveningStart.setHours(18, 0, 0, 0)
      const eveningEnd = new Date(eveningStart)
      eveningEnd.setHours(19, 0, 0, 0)
      
      classesToCreate.push({
        title: 'Evening Unwind',
        description: 'Relax and restore after a long day',
        startTime: eveningStart,
        endTime: eveningEnd,
        capacity: 6,
        instructor: 'Ana Lopez'
      })
    }

    // Create all classes
    const result = await prisma.class.createMany({
      data: classesToCreate
    })

    return NextResponse.json({ 
      message: 'Classes created successfully',
      count: result.count
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}