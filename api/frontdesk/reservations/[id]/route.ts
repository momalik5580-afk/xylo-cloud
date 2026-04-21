import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

// GET /api/frontdesk/reservations/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reservation = await prisma.reservations.findUnique({
    where: { id: params.id },
    include: {
  guests:              true,
  rooms:               true,
  folio_charges:       { orderBy: { charge_date: 'asc' } },
  payment_transactions:{ orderBy: { created_at: 'asc' } },
  reservation_add_ons: true,
},
  })

  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ reservation })
}

// PATCH /api/frontdesk/reservations/[id]
// action: 'checkin' | 'checkout' | 'cancel' | 'update'
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { action } = body

    if (action === 'checkin') {
      const reservation = await prisma.reservations.update({
        where: { id: params.id },
        data:  { status: 'CHECKED_IN', actual_check_in: new Date() },
      })
      if (reservation.room_id) {
        await prisma.rooms.update({
          where: { id: reservation.room_id },
          data:  { status: 'OCCUPIED' },
        })
      }
      await prisma.check_ins.create({
        data: {
          reservation_id: params.id,
          guest_id:       reservation.guest_id,
          room_id:        reservation.room_id!,
          agent_id:       payload.userId,
          hotel_id:       'hotel_hrg',
        },
      })
      return NextResponse.json({ success: true, reservation })
    }

    if (action === 'checkout') {
      const reservation = await prisma.reservations.update({
        where: { id: params.id },
        data:  { status: 'CHECKED_OUT', actual_check_out: new Date() },
      })
      if (reservation.room_id) {
        await prisma.rooms.update({
          where: { id: reservation.room_id },
          data:  { status: 'DIRTY' },
        })
      }
      await prisma.check_outs.create({
        data: {
          reservation_id: params.id,
          agent_id:       payload.userId,
          hotel_id:       'hotel_hrg',
        },
      })
      return NextResponse.json({ success: true, reservation })
    }

    if (action === 'cancel') {
      const reservation = await prisma.reservations.update({
        where: { id: params.id },
        data:  { status: 'CANCELLED', cancelled_at: new Date(), cancellation_reason: body.reason || null },
      })
      if (reservation.room_id) {
        await prisma.rooms.update({
          where: { id: reservation.room_id },
          data:  { status: 'AVAILABLE' },
        })
      }
      return NextResponse.json({ success: true, reservation })
    }

    // Default: update fields
    const { roomId, checkInDate, checkOutDate, adults, children, roomRate, specialRequests, notes, isVip } = body
    const updated = await prisma.reservations.update({
      where: { id: params.id },
      data: {
        ...(roomId        !== undefined && { room_id: roomId }),
        ...(checkInDate   !== undefined && { check_in_date:    new Date(checkInDate) }),
        ...(checkOutDate  !== undefined && { check_out_date:   new Date(checkOutDate) }),
        ...(adults        !== undefined && { adults }),
        ...(children      !== undefined && { children }),
        ...(roomRate      !== undefined && { room_rate: roomRate }),
        ...(specialRequests !== undefined && { special_requests: specialRequests }),
        ...(notes         !== undefined && { notes }),
        ...(isVip         !== undefined && { is_vip: isVip }),
      },
    })
    return NextResponse.json({ reservation: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/frontdesk/reservations/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.reservations.update({
    where: { id: params.id },
    data:  { status: 'CANCELLED', cancelled_at: new Date() },
  })
  return NextResponse.json({ success: true })
}
