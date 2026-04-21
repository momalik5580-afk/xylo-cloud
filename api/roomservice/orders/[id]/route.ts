import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { broadcastToHotel } from '@/lib/sse-manager'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const order = await prisma.room_service_orders.findUnique({
    where:   { id: params.id },
    include: {
      room_service_order_items: { include: { menu_items: true } },
      users_room_service_orders_delivery_staff_idTousers: { select: { first_name: true, last_name: true } },
    },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ order })
}

// PATCH — staff-side status flow:
// Auto (via kitchen KDS): PENDING → PREPARING → CONFIRMED (kitchen done)
// Staff action:           CONFIRMED → READY (picked up) → DELIVERED
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { status, assignedToId } = await req.json()

    const existing = await prisma.room_service_orders.findFirst({
      where: { id: params.id, hotel_id: payload.hotel_id }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const now  = new Date()
    const data: any = {}
    if (status !== undefined)       data.status         = status
    if (assignedToId !== undefined) data.assigned_to_id = assignedToId

    if (status === 'CONFIRMED') data.confirmed_at  = now
    if (status === 'PREPARING') data.prepared_at   = now
    if (status === 'READY')     data.confirmed_at  = now   // staff picked up
    if (status === 'DELIVERED') {
      data.delivered_at        = now
      data.actual_delivery_time = now
    }

    const order = await prisma.room_service_orders.update({
      where: { id: params.id },
      data,
      include: {
        room_service_order_items: { include: { menu_items: { select: { name: true } } } }
      }
    })

    // When delivered — also mark the linked fnb_order as DELIVERED
    // fnb_order_id is stored as "fnb:<id>" in delivery_notes
    const fnbOrderId = existing.delivery_notes?.startsWith('fnb:')
      ? existing.delivery_notes.replace('fnb:', '')
      : null
    if (status === 'DELIVERED' && fnbOrderId) {
      await prisma.fnb_orders.update({
        where: { id: fnbOrderId },
        data: {
          status:   'DELIVERED',
          served_at: now,
          billed_at: now,
          paid_amount: existing.total_amount,
        }
      }).catch(() => {})
    }

    // Broadcast status update so room service dashboard refreshes
    if (existing.hotel_id) {
      broadcastToHotel(existing.hotel_id, {
        type: 'room_service',
        payload: {
          action:    'status_updated',
          orderId:   params.id,
          oldStatus: existing.status,
          newStatus: status,
          roomNumber: existing.room_number,
        }
      })
    }

    return NextResponse.json({ order })
  } catch (e: any) {
    console.error('RS PATCH error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
