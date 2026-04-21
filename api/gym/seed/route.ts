import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// POST /api/gym/seed — clears and recreates sample gym classes (no fake bookings)
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const hotelId = payload.hotel_id || 'hotel_hrg'

  const today = new Date(); today.setHours(0, 0, 0, 0)

  function dayAt(daysFromNow: number, hour: number, minute = 0) {
    const d = new Date(today)
    d.setDate(d.getDate() + daysFromNow)
    d.setHours(hour, minute, 0, 0)
    return d
  }

  // Clear existing seeded classes and their bookings
  const oldClasses = await prisma.gym_classes.findMany({
    where: { hotel_id: hotelId, scheduled_at: { gte: today } },
    select: { id: true },
  })
  if (oldClasses.length > 0) {
    await prisma.gym_class_bookings.deleteMany({
      where: { class_id: { in: oldClasses.map((c: any) => c.id) } },
    })
  }
  await prisma.gym_classes.deleteMany({
    where: { hotel_id: hotelId, scheduled_at: { gte: today } },
  })

  const classData = [
    // Today
    { name: 'Morning Yoga',            instructor: 'Aisha Al-Mansoori', capacity: 12, duration: 60, scheduled_at: dayAt(0,  7,  0), location: 'Yoga Studio',     description: 'Gentle flow to start the day. All levels welcome.' },
    { name: 'HIIT Express',            instructor: 'Carlos Mendez',     capacity: 10, duration: 45, scheduled_at: dayAt(0,  9, 30), location: 'Fitness Studio',  description: 'High-intensity interval training. Moderate to advanced.' },
    { name: 'Pilates Core',            instructor: 'Sophie Laurent',    capacity: 8,  duration: 50, scheduled_at: dayAt(0, 11,  0), location: 'Pilates Studio',  description: 'Deep core work and postural alignment.' },
    { name: 'Meditation & Breath',     instructor: 'Aisha Al-Mansoori', capacity: 15, duration: 30, scheduled_at: dayAt(0, 17,  0), location: 'Wellness Room',   description: 'Guided breathwork and mindfulness session.' },
    { name: 'Evening Stretch',         instructor: 'Sophie Laurent',    capacity: 12, duration: 45, scheduled_at: dayAt(0, 19,  0), location: 'Yoga Studio',     description: 'Full-body stretch and recovery. All levels.' },
    // Tomorrow
    { name: 'Morning Yoga',            instructor: 'Aisha Al-Mansoori', capacity: 12, duration: 60, scheduled_at: dayAt(1,  7,  0), location: 'Yoga Studio',     description: 'Gentle flow to start the day. All levels welcome.' },
    { name: 'Aqua Fitness',            instructor: 'Carlos Mendez',     capacity: 14, duration: 45, scheduled_at: dayAt(1,  8,  0), location: 'Pool Deck',       description: 'Low-impact cardio workout in the pool.' },
    { name: 'Strength & Conditioning', instructor: 'Carlos Mendez',     capacity: 8,  duration: 60, scheduled_at: dayAt(1, 10,  0), location: 'Fitness Studio',  description: 'Weight training and functional movement.' },
    { name: 'Cycling Studio',          instructor: 'Carlos Mendez',     capacity: 10, duration: 45, scheduled_at: dayAt(1, 18,  0), location: 'Spinning Studio', description: 'High-energy indoor cycling session.' },
    // Day after
    { name: 'Outdoor Training',        instructor: 'Carlos Mendez',     capacity: 8,  duration: 60, scheduled_at: dayAt(2,  7,  0), location: 'Pool Terrace',    description: 'Functional outdoor workout with sea views.' },
    { name: 'Pilates Core',            instructor: 'Sophie Laurent',    capacity: 8,  duration: 50, scheduled_at: dayAt(2,  9,  0), location: 'Pilates Studio',  description: 'Deep core work and postural alignment.' },
    { name: 'HIIT Express',            instructor: 'Carlos Mendez',     capacity: 10, duration: 45, scheduled_at: dayAt(2, 11,  0), location: 'Fitness Studio',  description: 'High-intensity interval training.' },
  ]

  const created = await Promise.all(classData.map(c =>
    prisma.gym_classes.create({
      data: { ...c, status: 'SCHEDULED', current_count: 0, is_active: true, hotel_id: hotelId },
    })
  ))

  return NextResponse.json({ created: created.length, message: `${created.length} classes created` })
}
