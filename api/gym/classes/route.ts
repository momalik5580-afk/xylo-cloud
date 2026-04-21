import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/gym/classes
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const hotelId = payload.hotel_id || 'hotel_hrg'

  // ── Classes ────────────────────────────────────────────────
  const classes = await prisma.gym_classes.findMany({
    where: { is_active: true, scheduled_at: { gte: new Date() } },
    orderBy: { scheduled_at: 'asc' },
    include: {
      gym_class_bookings: {
        where: { status: { not: 'CANCELLED' } },
        include: {
          guests: {
            include: {
              reservations: {
                where: { status: { in: ['CHECKED_IN', 'CONFIRMED'] } },
                include: { rooms: { select: { room_number: true } } },
                orderBy: { check_in_date: 'asc' },
                take: 1,
              },
            },
          },
        },
      },
    },
  })

  const enriched = classes.map((c: any) => ({
    ...c,
    bookings: c.gym_class_bookings?.map((b: any) => ({
      id: b.id, status: b.status, booked_at: b.booked_at,
      guest: b.guests ? {
        first_name:  b.guests.first_name,
        last_name:   b.guests.last_name,
        room_number: b.guests.reservations?.[0]?.rooms?.room_number ?? null,
      } : null,
    })) ?? [],
    gym_class_bookings: undefined,
    spotsLeft: c.capacity - c.current_count,
    is_full:   c.current_count >= c.capacity,
  }))

  // ── Equipment — gym/fitness items ──────────────────────────
  // Use separate query to avoid Prisma AND+OR issue
  const equipment = await prisma.equipment.findMany({
    where: {
      is_active: true,
      OR: [
        { category: { in: ['GYM', 'FITNESS', 'CARDIO', 'STRENGTH'] } },
        { location: { contains: 'gym',     mode: 'insensitive' } },
        { location: { contains: 'fitness', mode: 'insensitive' } },
        { location: { contains: 'spinning', mode: 'insensitive' } },
        { location: { contains: 'cardio',  mode: 'insensitive' } },
      ],
    },
    orderBy: { name: 'asc' },
    select: {
      id: true, asset_tag: true, name: true, category: true,
      brand: true, model: true, location: true, status: true,
      last_serviced_at: true, next_service_at: true, notes: true,
    },
  })

  // ── Today's attendance ─────────────────────────────────────
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const attendance = await prisma.gym_attendance_log.findMany({
    where: { hotel_id: hotelId, check_in_time: { gte: todayStart } },
    include: { guests: true },
    orderBy: { check_in_time: 'desc' },
    take: 50,
  })
  const attendanceNorm = attendance.map((a: any) => ({
    ...a,
    guest: a.guests ? { first_name: a.guests.first_name, last_name: a.guests.last_name } : null,
    guests: undefined,
  }))

  return NextResponse.json({ classes: enriched, equipment, attendance: attendanceNorm })
}

// POST — action: 'book' | 'checkin' | 'checkout' | create class
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const hotelId = payload.hotel_id || 'hotel_hrg'

  try {
    const body = await req.json()

    if (body.action === 'book') {
      const { classId, guestId } = body
      if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })
      const gymClass = await prisma.gym_classes.findUnique({ where: { id: classId } })
      if (!gymClass)                          return NextResponse.json({ error: 'Class not found' },      { status: 404 })
      if (gymClass.current_count >= gymClass.capacity) return NextResponse.json({ error: 'Class is fully reserved' }, { status: 400 })
      const booking = await prisma.gym_class_bookings.create({
        data: { class_id: classId, guest_id: guestId || null, user_id: payload.userId, status: 'CONFIRMED', hotel_id: hotelId },
      })
      return NextResponse.json({ booking }, { status: 201 })
    }

    if (body.action === 'checkin') {
      const log = await prisma.gym_attendance_log.create({
        data: { guest_id: body.guestId || null, check_in_time: new Date(), hotel_id: hotelId },
      })
      return NextResponse.json({ log }, { status: 201 })
    }

    if (body.action === 'checkout') {
      if (!body.logId) return NextResponse.json({ error: 'logId required' }, { status: 400 })
      const log = await prisma.gym_attendance_log.update({
        where: { id: body.logId }, data: { check_out_time: new Date() },
      })
      return NextResponse.json({ log })
    }

    // Create class
    const { name, description, instructor, capacity, duration, scheduledAt, location } = body
    if (!name || !scheduledAt) return NextResponse.json({ error: 'name and scheduledAt required' }, { status: 400 })
    const gymClass = await prisma.gym_classes.create({
      data: { name, description: description || null, instructor: instructor || null, capacity: capacity || 20, duration: duration || 60, scheduled_at: new Date(scheduledAt), location: location || null, status: 'SCHEDULED', current_count: 0, is_active: true, hotel_id: hotelId },
    })
    return NextResponse.json({ gymClass }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH — update booking, class status, or equipment status
export async function PATCH(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { bookingId, classId, equipmentId, status, notes } = await req.json()

    if (equipmentId) {
      const updated = await prisma.equipment.update({
        where: { id: equipmentId },
        data:  { status, ...(notes !== undefined ? { notes } : {}) },
      })
      return NextResponse.json({ equipment: updated })
    }

    if (bookingId) {
      const updated = await prisma.gym_class_bookings.update({
        where: { id: bookingId },
        data: { status, ...(status === 'CANCELLED' ? { cancelled_at: new Date() } : {}) },
      })
      return NextResponse.json({ booking: updated })
    }

    if (classId) {
      const updated = await prisma.gym_classes.update({
        where: { id: classId },
        data: { status, ...(notes ? { notes } : {}) },
      })
      return NextResponse.json({ gymClass: updated })
    }

    return NextResponse.json({ error: 'equipmentId, bookingId, or classId required' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
