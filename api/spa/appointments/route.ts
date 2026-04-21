import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { broadcastToHotel } from '@/lib/sse-manager'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/spa/appointments?date=today&status=BOOKED&therapistId=
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const status      = searchParams.get('status')
  const therapistId = searchParams.get('therapistId')
  const date        = searchParams.get('date')
  const page        = parseInt(searchParams.get('page')  || '1')
  const limit       = parseInt(searchParams.get('limit') || '50')

  const where: any = { hotel_id: payload.hotel_id }
  if (status)      where.status       = status
  if (therapistId) where.therapist_id = therapistId

  if (date === 'today') {
    const start = new Date(); start.setHours(0,0,0,0)
    const end   = new Date(); end.setHours(23,59,59,999)
    where.scheduled_at = { gte: start, lte: end }
  } else if (date) {
    const start = new Date(date); start.setHours(0,0,0,0)
    const end   = new Date(date); end.setHours(23,59,59,999)
    where.scheduled_at = { gte: start, lte: end }
  }

  try {
    const [appointments, total, therapists, services, rooms] = await Promise.all([
      prisma.spa_appointments.findMany({
        where,
        orderBy: { scheduled_at: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          guests:       { select: { id: true, first_name: true, last_name: true, is_vip: true, loyalty_tier: true, phone: true } },
          reservations: { select: { id: true, rooms: { select: { room_number: true, type: true } } } },
          users:        { select: { first_name: true, last_name: true } },
          spa_services: { select: { name: true, category: true, duration: true } },
          spa_therapists: { select: { first_name: true, last_name: true, specialties: true } },
        }
      }),
      prisma.spa_appointments.count({ where }),
      prisma.spa_therapists.findMany({
        where:   { hotel_id: payload.hotel_id, is_active: true },
        orderBy: { first_name: 'asc' },
      }),
      prisma.spa_services.findMany({
        where:   { hotel_id: payload.hotel_id, is_active: true },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      prisma.spa_rooms.findMany({
        where:   { hotel_id: payload.hotel_id },
        orderBy: { name: 'asc' },
      }).catch(() => []),
    ])

    // Summary counts for today
    const today = new Date(); today.setHours(0,0,0,0)
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999)
    const todayWhere = { hotel_id: payload.hotel_id, scheduled_at: { gte: today, lte: todayEnd } }

    const [booked, confirmed, inProgress, completed, cancelled, noShow] = await Promise.all([
      prisma.spa_appointments.count({ where: { ...todayWhere, status: 'BOOKED'       } }),
      prisma.spa_appointments.count({ where: { ...todayWhere, status: 'CONFIRMED'    } }),
      prisma.spa_appointments.count({ where: { ...todayWhere, status: 'IN_PROGRESS'  } }),
      prisma.spa_appointments.count({ where: { ...todayWhere, status: 'COMPLETED'    } }),
      prisma.spa_appointments.count({ where: { ...todayWhere, status: 'CANCELLED'    } }),
      prisma.spa_appointments.count({ where: { ...todayWhere, status: 'NO_SHOW'      } }),
    ])

    const todayRevenue = await prisma.spa_appointments.aggregate({
      where:  { ...todayWhere, status: 'COMPLETED' },
      _sum:   { total_price: true },
    })

    // For appointments without reservation_id, look up guest's current room via active reservation
    const guestIdsNoRoom = appointments
      .filter(a => !a.reservation_id && a.guest_id)
      .map(a => a.guest_id as string)

    const guestRoomMap = new Map<string, string>()
    if (guestIdsNoRoom.length > 0) {
      const activeReservations = await prisma.reservations.findMany({
        where: {
          guest_id: { in: guestIdsNoRoom },
          hotel_id: payload.hotel_id,
          status:   { in: ['CHECKED_IN', 'CONFIRMED'] },
        },
        select: {
          guest_id: true,
          rooms:    { select: { room_number: true } },
        },
        orderBy: { check_in: 'desc' },
      })
      for (const r of activeReservations) {
        if (r.guest_id && r.rooms?.room_number && !guestRoomMap.has(r.guest_id)) {
          guestRoomMap.set(r.guest_id, r.rooms.room_number)
        }
      }
    }

    // Safely serialize appointments with room_number attached
    const appointmentsWithRoom = appointments.map(a => ({
      id:                 a.id,
      service_id:         a.service_id,
      therapist_id:       a.therapist_id,
      guest_id:           a.guest_id,
      reservation_id:     a.reservation_id,
      status:             a.status,
      scheduled_at:       a.scheduled_at,
      duration:           a.duration,
      price:              Number(a.price),
      discount:           a.discount ? Number(a.discount) : null,
      total_price:        Number(a.total_price),
      special_requests:   a.special_requests,
      health_notes:       a.health_notes,
      notes:              a.notes,
      completed_at:       a.completed_at,
      cancelled_at:       a.cancelled_at,
      cancellation_reason: a.cancellation_reason,
      hotel_id:           a.hotel_id,
      // Related
      guests:             a.guests,
      spa_services:       a.spa_services,
      spa_therapists:     a.spa_therapists,
      // Room number resolved
      room_number: a.reservations?.rooms?.room_number
        ?? (a.guest_id ? guestRoomMap.get(a.guest_id) ?? null : null),
      reservations: a.reservations,
    }))

    return NextResponse.json({
      appointments: appointmentsWithRoom, total, page, limit,
      therapists, services, rooms,
      summary: {
        booked, confirmed, inProgress, completed, cancelled, noShow,
        todayRevenue: Number(todayRevenue._sum.total_price ?? 0),
      }
    })
  } catch (e: any) {
    console.error('SPA GET error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/spa/appointments — book appointment
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  try {
    const body = await req.json()
    const {
      serviceId, therapistId, guestId, reservationId,
      scheduledAt, specialRequests, healthNotes, notes,
      guestName, guestPhone,  // walk-in guests
    } = body

    if (!serviceId)    return NextResponse.json({ error: 'serviceId required'   }, { status: 400 })
    if (!scheduledAt)  return NextResponse.json({ error: 'scheduledAt required' }, { status: 400 })

    const service = await prisma.spa_services.findFirst({
      where: { id: serviceId, hotel_id: payload.hotel_id }
    })
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

    // Check therapist availability if specified
    if (therapistId) {
      const endTime = new Date(new Date(scheduledAt).getTime() + service.duration * 60000)
      const conflict = await prisma.spa_appointments.findFirst({
        where: {
          therapist_id: therapistId,
          hotel_id:     payload.hotel_id,
          status:       { in: ['BOOKED', 'CONFIRMED', 'IN_PROGRESS'] },
          scheduled_at: { lt: endTime },
          AND: [{ scheduled_at: { gte: new Date(scheduledAt) } }]
        }
      })
      if (conflict) return NextResponse.json({ error: 'Therapist not available at this time' }, { status: 409 })
    }

    const appointment = await prisma.spa_appointments.create({
      data: {
        service_id:       serviceId,
        therapist_id:     therapistId    || null,
        guest_id:         guestId        || null,
        reservation_id:   reservationId  || null,
        user_id:          payload.userId || null,
        status:           'BOOKED',
        scheduled_at:     new Date(scheduledAt),
        duration:         service.duration,
        price:            service.price,
        total_price:      service.price,
        special_requests: specialRequests || null,
        health_notes:     healthNotes     || null,
        notes:            notes           || guestName ? `Walk-in: ${guestName}${guestPhone ? ` · ${guestPhone}` : ''}` : null,
        hotel_id:         payload.hotel_id,
      },
      include: {
        guests:         { select: { first_name: true, last_name: true, is_vip: true } },
        spa_services:   { select: { name: true, category: true, duration: true } },
        spa_therapists: { select: { first_name: true, last_name: true } },
      },
    })

    broadcastToHotel(payload.hotel_id, {
      type: 'spa',
      payload: { action: 'booked', appointmentId: appointment.id, scheduledAt }
    })

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (e: any) {
    console.error('SPA POST error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
