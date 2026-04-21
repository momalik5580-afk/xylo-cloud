// src/app/api/restaurants/kds/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { broadcastToHotel } from '@/lib/sse-manager'

function auth(req: NextRequest) {
  const token = req.cookies.get('xylo-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try { return verifyToken(token) } catch { return null }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { status, stationId, chefName, chefId, priority } = await req.json()

    const existing = await prisma.kitchen_orders.findFirst({
      where: { id: params.id, hotel_id: payload.hotel_id }
    })
    if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const now  = new Date()
    const data: any = {}
    if (status)    data.status             = status
    if (stationId) data.station_id         = stationId
    if (chefName)  data.chef_assigned_name = chefName
    if (chefId)    data.chef_assigned_id   = chefId
    if (priority)  data.priority           = priority

    if (status === 'in_progress' && !existing.started_at) data.started_at  = now
    if (status === 'completed')                            data.completed_at = now

    const order = await prisma.kitchen_orders.update({
      where: { id: params.id },
      data,
      include: {
        kitchen_order_items: true,
        kitchen_stations: { select: { name: true, station_type: true } }
      }
    })

    // ── Station load management ──────────────────────────────────────
    if (stationId && stationId !== existing.station_id) {
      if (existing.station_id) {
        await prisma.kitchen_stations.update({
          where: { id: existing.station_id },
          data:  { current_load: { decrement: 1 } }
        }).catch(() => {})
      }
      await prisma.kitchen_stations.update({
        where: { id: stationId },
        data:  { current_load: { increment: 1 } }
      }).catch(() => {})
    }
    if (status === 'completed' && existing.station_id) {
      await prisma.kitchen_stations.update({
        where: { id: existing.station_id },
        data:  { current_load: { decrement: 1 } }
      }).catch(() => {})
    }

    // ── Sync room service order when kitchen updates ─────────────────
    if (existing.source_type === 'ROOM_SERVICE' && existing.fnb_order_id) {

      // ── Kitchen starts preparing → RS order: PREPARING ──────────────
      if (status === 'in_progress') {
        // Update fnb_order
        await prisma.fnb_orders.update({
          where: { id: existing.fnb_order_id },
          data:  { status: 'PREPARING' }
        }).catch(() => {})

        // Find room_service_order via delivery_notes containing "fnb:<fnb_order_id>"
        await prisma.room_service_orders.updateMany({
          where: {
            hotel_id:      payload.hotel_id,
            delivery_notes: { contains: `fnb:${existing.fnb_order_id}` },
            status:        'PENDING',
          },
          data: { status: 'PREPARING', prepared_at: now }
        }).catch(async () => {
          // Fallback: match by room_number
          if (existing.room_number) {
            await prisma.room_service_orders.updateMany({
              where: {
                hotel_id:    payload.hotel_id,
                room_number: existing.room_number,
                status:      'PENDING',
              },
              data: { status: 'PREPARING', prepared_at: now }
            }).catch(() => {})
          }
        })

        broadcastToHotel(payload.hotel_id, {
          type: 'room_service',
          payload: {
            action:     'preparing',
            fnbOrderId: existing.fnb_order_id,
            roomNumber: existing.room_number,
            guestName:  existing.guest_name,
          }
        })
      }

      // ── Kitchen completes → RS order: READY (out for delivery) ──────
      if (status === 'completed') {
        // Update fnb_order to READY
        await prisma.fnb_orders.update({
          where: { id: existing.fnb_order_id },
          data:  { status: 'READY', prepared_at: now }
        }).catch(() => {})

        // Update room_service_order to CONFIRMED — find via delivery_notes "fnb:<id>"
        const rsUpdated = await prisma.room_service_orders.updateMany({
          where: {
            hotel_id:       payload.hotel_id,
            delivery_notes: { contains: `fnb:${existing.fnb_order_id}` },
            status:         { in: ['PENDING', 'PREPARING'] },
          },
          data: { status: 'CONFIRMED', prepared_at: now }
        })

        // Fallback by room_number for older orders without delivery_notes link
        if (rsUpdated.count === 0 && existing.room_number) {
          await prisma.room_service_orders.updateMany({
            where: {
              hotel_id:    payload.hotel_id,
              room_number: existing.room_number,
              status:      { in: ['PENDING', 'PREPARING'] },
            },
            data: { status: 'CONFIRMED', prepared_at: now }
          }).catch(() => {})
        }

        // Broadcast "ready for pickup" to room service staff
        broadcastToHotel(payload.hotel_id, {
          type: 'room_service',
          payload: {
            action:        'ready_for_delivery',
            fnbOrderId:    existing.fnb_order_id,
            kitchenTicket: existing.ticket_number,
            roomNumber:    existing.room_number,
            guestName:     existing.guest_name,
          }
        })
      }
    }

    // ── Standard broadcast ───────────────────────────────────────────
    broadcastToHotel(payload.hotel_id!, {
      type: 'kitchen_order',
      payload: {
        action:        'updated',
        orderId:       params.id,
        ticketNumber:  existing.ticket_number,
        oldStatus:     existing.status,
        newStatus:     status,
        guestName:     existing.guest_name,
        isRoomService: existing.source_type === 'ROOM_SERVICE',
        roomNumber:    existing.room_number,
      }
    })

    return NextResponse.json({ order })
  } catch (e: any) {
    console.error('KDS PATCH error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
