// src/app/api/restaurants/reservations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { broadcastToHotel } from '@/lib/sse-manager'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// PATCH /api/restaurants/reservations/[id] — update status or details
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { status, tableId, notes, specialRequests, partySize, reservationDate } = body

    const existing = await prisma.restaurant_reservations.findFirst({
      where: { id: params.id, hotel_id: payload.hotel_id }
    })
    if (!existing) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })

    const now = new Date()
    const statusTimestamps: any = {}
    if (status === 'seated')    statusTimestamps.seated_at    = now
    if (status === 'completed') statusTimestamps.left_at      = now
    if (status === 'cancelled') statusTimestamps.cancelled_at = now

    const reservation = await prisma.restaurant_reservations.update({
      where: { id: params.id },
      data: {
        ...(status          && { status }),
        ...(tableId         && { table_id: tableId }),
        ...(notes           && { notes }),
        ...(specialRequests && { special_requests: specialRequests }),
        ...(partySize       && { party_size: partySize }),
        ...(reservationDate && { reservation_date: new Date(reservationDate) }),
        ...statusTimestamps,
        updated_at: now,
      },
      include: {
        restaurant_tables: { select: { table_number: true, capacity: true } },
        guests: { select: { first_name: true, last_name: true, is_vip: true } }
      }
    })

    // Update table status based on reservation status
    const targetTableId = tableId || existing.table_id
    if (targetTableId) {
      let tableStatus: string | null = null
      if (status === 'seated')    tableStatus = 'OCCUPIED'
      if (status === 'completed') tableStatus = 'AVAILABLE'
      if (status === 'cancelled') tableStatus = 'AVAILABLE'
      if (status === 'no_show')   tableStatus = 'AVAILABLE'

      if (tableStatus) {
        const guestName = reservation.guests
          ? `${reservation.guests.first_name} ${reservation.guests.last_name}`
          : reservation.guest_name

        await prisma.restaurant_tables.update({
          where: { id: targetTableId },
          data: {
            status: tableStatus,
            ...(tableStatus === 'OCCUPIED' && {
              current_guests:     reservation.party_size,
              current_guest_name: guestName,
              current_order_id:   null,
            }),
            ...(tableStatus === 'AVAILABLE' && {
              current_guests:     0,
              current_guest_name: null,
              current_order_id:   null,
              current_server_id:  null,
            }),
          }
        })
      }
    }

    broadcastToHotel(payload.hotel_id!, {
      type: 'reservation',
      payload: { action: 'updated', id: params.id, status, tableId }
    })

    return NextResponse.json({ reservation })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/restaurants/reservations/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const existing = await prisma.restaurant_reservations.findFirst({
      where: { id: params.id, hotel_id: payload.hotel_id }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.restaurant_reservations.update({
      where: { id: params.id },
      data: { status: 'cancelled', cancelled_at: new Date() }
    })

    // Free the table
    if (existing.table_id) {
      await prisma.restaurant_tables.update({
        where: { id: existing.table_id },
        data: { status: 'AVAILABLE', current_guests: 0, current_guest_name: null }
      })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
