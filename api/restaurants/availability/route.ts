// src/app/api/restaurants/availability/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/restaurants/availability?outletId=&date=2026-03-16&time=19:00&partySize=4&duration=90
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const outletId  = searchParams.get('outletId')
  const date      = searchParams.get('date')
  const time      = searchParams.get('time')      // HH:MM
  const partySize = parseInt(searchParams.get('partySize') || '2')
  const duration  = parseInt(searchParams.get('duration')  || '90')

  if (!outletId || !date) {
    return NextResponse.json({ error: 'outletId and date are required' }, { status: 400 })
  }

  try {
    // Get all active tables for this outlet that fit the party size
    const tables = await prisma.restaurant_tables.findMany({
      where: {
        outlet_id:   outletId,
        hotel_id:    payload.hotel_id,
        is_active:   true,
        capacity:    { gte: partySize },
      },
      orderBy: { capacity: 'asc' } // prefer smaller tables first
    })

    if (tables.length === 0) {
      return NextResponse.json({ available: [], message: 'No tables found for this party size' })
    }

    // Build time window for conflict check
    const [hours, minutes] = (time || '12:00').split(':').map(Number)
    const requestedStart = new Date(date)
    requestedStart.setHours(hours, minutes, 0, 0)
    const requestedEnd = new Date(requestedStart.getTime() + duration * 60 * 1000)

    // Find tables that have conflicting reservations in this window
    const conflicts = await prisma.restaurant_reservations.findMany({
      where: {
        hotel_id:  payload.hotel_id,
        table_id:  { in: tables.map(t => t.id), not: null },
        status:    { in: ['confirmed', 'CONFIRMED', 'seated', 'SEATED'] },
        reservation_date: {
          gte: new Date(requestedStart.getTime() - duration * 60 * 1000),
          lte: requestedEnd,
        }
      },
      select: { table_id: true, reservation_date: true, duration: true }
    })

    const conflictTableIds = new Set(conflicts.map(c => c.table_id))

    // Also exclude currently occupied tables
    const availableTables = tables.filter(t =>
      !conflictTableIds.has(t.id) &&
      !['occupied', 'OCCUPIED'].includes(t.status)
    )

    // Generate time slots for the day (every 30 min from 12:00 to 22:00)
    const slots: { time: string; available: number }[] = []
    for (let h = 12; h <= 22; h++) {
      for (const m of [0, 30]) {
        const slotTime = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
        const slotStart = new Date(date)
        slotStart.setHours(h, m, 0, 0)
        const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000)

        const slotConflicts = await prisma.restaurant_reservations.count({
          where: {
            hotel_id:  payload.hotel_id,
            table_id:  { in: tables.map(t => t.id), not: null },
            status:    { in: ['confirmed', 'CONFIRMED', 'seated'] },
            reservation_date: {
              gte: new Date(slotStart.getTime() - duration * 60 * 1000),
              lte: slotEnd,
            }
          }
        })

        slots.push({ time: slotTime, available: Math.max(0, tables.length - slotConflicts) })
      }
    }

    return NextResponse.json({
      availableTables: availableTables.map(t => ({
        id:           t.id,
        table_number: t.table_number,
        capacity:     t.capacity,
        section:      t.section,
        status:       t.status,
      })),
      totalTables:    tables.length,
      conflictCount:  conflictTableIds.size,
      slots,
    })
  } catch (e: any) {
    console.error('availability error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
