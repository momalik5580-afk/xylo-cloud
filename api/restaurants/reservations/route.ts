// src/app/api/restaurants/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { broadcastToHotel } from '@/lib/sse-manager'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/restaurants/reservations?outletId=&date=2026-03-16&status=confirmed
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const outletId = searchParams.get('outletId')
  const date     = searchParams.get('date')      // YYYY-MM-DD
  const status   = searchParams.get('status')
  const upcoming = searchParams.get('upcoming') === 'true'

  const where: any = { hotel_id: payload.hotel_id }
  if (status) where.status = status

  // Filter by date
  if (date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    where.reservation_date = { gte: start, lte: end }
  } else if (upcoming) {
    where.reservation_date = { gte: new Date() }
    where.status = { in: ['confirmed', 'CONFIRMED'] }
  }

  // Filter by outlet via table_id → restaurant_tables → outlet_id
  // We include: (a) reservations assigned to a table in this outlet, OR (b) unassigned (table_id null)
  // Use outlet_id directly on hotel reservations if available, otherwise filter by outlet's tables
  if (outletId) {
    const outletTables = await prisma.restaurant_tables.findMany({
      where: { outlet_id: outletId, hotel_id: payload.hotel_id },
      select: { id: true }
    })
    const tableIds = outletTables.map(t => t.id)
    // Only include reservations for this outlet's tables OR unassigned ones for this hotel
    where.OR = [
      { table_id: { in: tableIds.length > 0 ? tableIds : ['__none__'] } },
      { table_id: null, hotel_id: payload.hotel_id },
    ]
  }

  try {
    const reservations = await prisma.restaurant_reservations.findMany({
      where,
      orderBy: { reservation_date: 'asc' },
      include: {
        restaurant_tables: { select: { table_number: true, capacity: true, section: true } },
        guests: {
          select: {
            id: true, first_name: true, last_name: true,
            is_vip: true, loyalty_tier: true, phone: true, email: true,
            preferences: true,
          }
        }
      }
    })

    // Summary counts
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [todayCount, upcomingCount, totalCovers] = await Promise.all([
      prisma.restaurant_reservations.count({
        where: { hotel_id: payload.hotel_id, reservation_date: { gte: today, lt: tomorrow }, status: { in: ['confirmed','CONFIRMED'] } }
      }),
      prisma.restaurant_reservations.count({
        where: { hotel_id: payload.hotel_id, reservation_date: { gte: new Date() }, status: { in: ['confirmed','CONFIRMED'] } }
      }),
      prisma.restaurant_reservations.aggregate({
        where: { hotel_id: payload.hotel_id, reservation_date: { gte: today, lt: tomorrow } },
        _sum: { party_size: true }
      }),
    ])

    return NextResponse.json({
      reservations,
      summary: {
        today:       todayCount,
        upcoming:    upcomingCount,
        todayCovers: totalCovers._sum.party_size ?? 0,
      }
    })
  } catch (e: any) {
    console.error('GET reservations error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/restaurants/reservations — create new reservation
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!payload.hotel_id) return NextResponse.json({ error: 'No hotel assigned' }, { status: 400 })

  try {
    const body = await req.json()
    const {
      guestName, phone, email, partySize,
      reservationDate, duration, tableId,
      occasion, specialRequests, notes,
      guestId, // optional — link to hotel guest profile
    } = body

    if (!guestName) return NextResponse.json({ error: 'guestName is required' }, { status: 400 })
    if (!reservationDate) return NextResponse.json({ error: 'reservationDate is required' }, { status: 400 })
    if (!partySize) return NextResponse.json({ error: 'partySize is required' }, { status: 400 })

    // If tableId provided, verify table belongs to this hotel and is available
    if (tableId) {
      const table = await prisma.restaurant_tables.findFirst({
        where: { id: tableId, hotel_id: payload.hotel_id }
      })
      if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 })
      if (table.capacity < partySize) {
        return NextResponse.json({ error: `Table capacity (${table.capacity}) is less than party size (${partySize})` }, { status: 400 })
      }
    }

    const reservation = await prisma.restaurant_reservations.create({
      data: {
        guest_name:       guestName,
        phone:            phone            ?? null,
        email:            email            ?? null,
        party_size:       partySize,
        reservation_date: new Date(reservationDate),
        duration:         duration         ?? 90,
        table_id:         tableId          ?? null,
        occasion:         occasion         ?? null,
        special_requests: specialRequests  ?? null,
        notes:            notes            ?? null,
        guest_id:         guestId          ?? null,
        status:           'confirmed',
        confirmed_at:     new Date(),
        hotel_id:         payload.hotel_id,
      },
      include: {
        restaurant_tables: { select: { table_number: true, capacity: true } },
        guests: { select: { first_name: true, last_name: true, is_vip: true } }
      }
    })

    // If table assigned, update table status to reserved
    if (tableId) {
      await prisma.restaurant_tables.update({
        where: { id: tableId },
        data: {
          status:             'reserved',
          current_guest_name: guestName,
          current_guests:     partySize,
        }
      })
    }

    // Broadcast new reservation
    broadcastToHotel(payload.hotel_id, {
      type: 'reservation',
      payload: {
        action:      'created',
        id:          reservation.id,
        guestName,
        partySize,
        tableId,
        date:        reservation.reservation_date,
        isVip:       reservation.guests?.is_vip ?? false,
      }
    })

    return NextResponse.json({ reservation }, { status: 201 })
  } catch (e: any) {
    console.error('POST reservations error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
